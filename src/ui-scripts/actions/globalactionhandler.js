var GlobalActionHandler = function(id)
{
  /* interface */
  /**
    * A view id to identify an action handler.
    */
  this.id = id;

  /**
    * To handle a single action.
    * Returning false (as in === false) will cancel the event
    * (preventDefault and stopPropagation),
    * true will pass it to the next level if any.
    * @param {String} action_id
    * @param {Event} event
    * @param {Element} target
    */
  this.handle = function(action_id, event, target){};

  /**
    * To get a list of supported actions.
    */
  this.get_action_list = function(){};

  /**
    * Gets called if an action handler changes to be the current context.
    */
  this.focus = function(container){};

  /**
    * Gets called if an action handle stops to be the current context.
    */
  this.blur = function(){};

  /**
    * Gets called if an action handler is the current context.
    * Returning false (as in === false) will cancel the event
    * (preventDefault and stopPropagation),
    * true will pass it to the next level if any.
    */
  this.onclick = function(event){};

  /**
    * To check and set the mode independent of the focused action handler.
    * Special method for the global action handler.
    */
  this.check_mode = function(event){};

  /**
    * To register a shortcut listener with a unique id token
    * on a global input element. Global as not being part of a view pane, e.g.
    * an input in a toolbar.
    * @param {String} listener_id. A unique token.
    * @param {Function} callback
    * @param {Array} action_list. A list of action supported by
    * that listener, optional.
    */
  this.register_shortcut_listener = function(listener_id, callback, action_list){};

  /**
    * To register a serach panel.
    * This is used to focus the panel with an according shortcut.
    */
  this.register_search_panel = function(view_id){};

  /* constants */

  const
  MODE_DEFAULT = "default",
  MODE_EDIT = "edit",
  RE_TEXT_INPUTS = GlobalActionHandler.RE_TEXT_INPUTS;

  this.mode = MODE_DEFAULT;

  this.mode_labels =
  {
    "default": ui_strings.S_LABEL_KEYBOARDCONFIG_MODE_DEFAULT,
    "edit": ui_strings.S_LABEL_KEYBOARDCONFIG_MODE_EDIT,
  }

  /* privat */

  this._broker = ActionBroker.get_instance();
  this._handlers = {};
  this._private_handlers = [];
  this._listener_handlers = [];
  this._sc_listeners = {};
  this._search_panels = [];

  this.get_action_list = function()
  {
    var actions = [], key = '';
    for (key in this._handlers)
    {
      if (this._private_handlers.indexOf(key) == -1)
      {
        actions.push(key);
      }
    }
    return actions.concat(this._listener_handlers);
  };

  this._continue_with_mode = function(mode, action_id, event, target)
  {
    window.views.js_source.clearLinePointer();
    window.views.callstack.clearView();
    window.views.inspection.clearView();
    window.stop_at.continue_thread(mode, true);
    return false;
  };

  [
    'run',
    'step-next-line',
    'step-into-call',
    'step-out-of-call',
  ].forEach(function(mode)
  {
    this._handlers['continue-' + mode] = this._continue_with_mode.bind(this, mode);
  }, this);

  this._handlers["select-all"] = function(action_id, event, target)
  {
    if (this._selection_controller.is_selectable(target))
    {
      var selection = getSelection();
      var range = document.createRange();
      selection.removeAllRanges();
      range.selectNodeContents(target);
      selection.addRange(range);
    }
    return false;
  }.bind(this);

  this._handlers["invert-spotlight-colors"] = function(action_id, event, target)
  {
    window.hostspotlighter.invertColors();
    return false;
  };

  this._handlers["show-script-dropdown"] = function(action_id, event, target)
  {
    var ui = UI.get_instance();
    ui.show_view("js_source");
    ui.show_dropdown("js-script-select");
  };

  this._close_open_menus = function()
  {
    var contextmenu = ContextMenu.get_instance();
    if (contextmenu.is_visible)
    {
      contextmenu.dismiss();
      return true;
    }
    var has_opened_select = CstSelectBase.close_opened_select();
    return has_opened_select;
  };

  this._handlers["toggle-console"] = function(action_id, event, target)
  {
    var has_open_menus = this._close_open_menus();
    if (has_open_menus || window.views['color-selector'].cancel_edit_color())
    {
      return;
    }

    if (this.mode == MODE_EDIT)
    {
      var sc_listener = event.target.get_attr('parent-node-chain', 'shortcuts');
      if (sc_listener && sc_listener in this._sc_listeners &&
          this._sc_listeners[sc_listener](action_id, event, target) === false)
      {
         return false;
      }

      // Prevent ESC from opening/closing console when in edit mode,
      // except if we're actually in the console
      if (this._broker.get_current_handler_id() != "command_line")
      {
        return;
      }
    }

    var overlay = Overlay.get_instance();
    if (overlay.is_visible)
    {
      this._handlers["hide-overlay"](action_id, event, target);
      return;
    }

    return this._handlers["toggle-commandline"](action_id, event, target);

  }.bind(this);

  this._handlers["toggle-commandline"] = function(action_id, event, target)
  {
    var visible = (window.views.command_line && window.views.command_line.isvisible());
    var button = UI.get_instance().get_button("toggle-console");
    visible ? button.removeClass("is-active") : button.addClass("is-active");

    if (!visible)
    {
      UIWindowBase.showWindow('command_line',
                              Math.ceil(innerHeight/2), 0,
                              innerWidth, Math.floor(innerHeight/2));
      ActionBroker.get_instance().focus_handler("command_line", event);
    }
    else
    {
      UIWindowBase.closeWindow('command_line');
    }

    return false;
  }.bind(this);

  this._handlers["reload-context"] = function(action_id, event, target)
  {
    runtimes.reloadWindow();

    return false;
  };

  this._handlers["show-overlay"] = function(action_id, event, target)
  {
    const OVERLAY_TOP_MARGIN = 10;
    const OVERLAY_RIGHT_MARGIN = 20;
    const ADJUST = 2; // TODO: where does this actually come from

    var overlay = Overlay.get_instance();
    var ui = UI.get_instance();
    var overlay_id = target.getAttribute("data-overlay-id");

    ui.get_button("toggle-" + overlay_id).addClass("is-active");

    overlay.show(overlay_id);

    if (target)
    {
      var button_dims = target.getBoundingClientRect();
      var element = overlay.element.querySelector("overlay-window");
      var arrow = overlay.element.querySelector("overlay-arrow");
      var arrow_width = arrow.getBoundingClientRect().width;
      element.style.top = button_dims.bottom + OVERLAY_TOP_MARGIN + "px";
      element.addClass("attached");
      arrow.style.right = Math.floor(document.documentElement.clientWidth - OVERLAY_RIGHT_MARGIN -
          button_dims.right - (arrow_width / 2) + (button_dims.width / 2) - ADJUST) + "px";
    }

    var first_button = overlay.element.querySelector("button, input[type='button'], .ui-button");
    if (first_button)
    {
      first_button.focus();
    }
  };
  this._private_handlers.push("show-overlay");

  this._handlers["hide-overlay"] = function(action_id, event, target)
  {
    var overlay = Overlay.get_instance();
    var ui = UI.get_instance();
    var client = window.client.current_client;
    var overlay_id = overlay.active_overlay;

    ui.get_button("toggle-" + overlay_id).removeClass("is-active");

    if (overlay_id == "remote-debug-overlay" && (!client || !client.connected))
    {
      var button = UI.get_instance().get_button("toggle-remote-debug-overlay");
      if (button)
        button.removeClass("alert");
      eventHandlers.click['cancel-remote-debug'](); // TODO: make a proper action
    }

    overlay.hide();
  };
  this._private_handlers.push("hide-overlay");

  this._handlers["navigate-next-top-tab"] = function(action_id, event, target)
  {
    window.topCell.tab.navigate_to_next_or_previous_tab(false);
    return false;
  };

  this._handlers["navigate-previous-top-tab"] = function(action_id, event, target)
  {
    window.topCell.tab.navigate_to_next_or_previous_tab(true);
    return false;
  };

  this._handlers["show-search"] = function(action_id, event, target)
  {
    var ui = UI.get_instance();
    var search = ui.get_visible_tabs().filter(function(view_id)
    {
      return this._search_panels.contains(view_id);
    }, this)[0];
    if (search)
    {
      ui.show_view(search).focus_search_field();
      return false;
    }
  }.bind(this);

  var TestTempView = function(name)
  {
    this.createView = function(container)
    {
      container.innerHTML =
        "<div class='padding'><h2>Test view, id: " + this.id + "</h2></div>";
    };
    this.init(name);
  };

  TestTempView.prototype = new TempView();

  this._handlers["add-temp-test-view"] = function(action_id, event, target)
  {
    var test_view = new TestTempView('Hello');
    var ui = UI.get_instance();
    ui.get_tabbar("request").add_tab(test_view.id);
    ui.show_view(test_view.id);
    return false;
  };

  /* implementation */

  this.handle = function(action_id, event, target)
  {
    if (action_id in this._handlers &&
        this._handlers[action_id](action_id, event, target) == false)
    {
      return false;
    }
    var sc_listener = event.target.get_attr('parent-node-chain', 'shortcuts');
    if (sc_listener && sc_listener in this._sc_listeners)
    {
      return this._sc_listeners[sc_listener](action_id, event, target);
    }
  }

  this.focus = function(event, container)
  {
    var node_name = event && event.target.nodeName.toLowerCase();
    if (event && (node_name == "input" && RE_TEXT_INPUTS.test(event.target.type))
              || node_name == "textarea"
    )
    {
      this.mode = MODE_EDIT;
    }
    else
    {
      this.mode = MODE_DEFAULT;
    }
  };

  this.check_mode = this.onclick = this.focus;

  this.register_shortcut_listener = function(listener_id, callback, action_list)
  {
    this._sc_listeners[listener_id] = callback;
    if (action_list)
      action_list.forEach(function(action)
      {
        if (this._listener_handlers.indexOf(action) == -1)
          this._listener_handlers.push(action);
      }, this);
  };

  this.register_search_panel = function(view_id)
  {
    if (!this._search_panels.contains(view_id))
    {
      this._search_panels.push(view_id);
    }
  };

  /* instatiation */

  var is_not_selectable = '.info-box';
  var is_selectable = 'container:not(.side-panel)' +
                               ':not(.network-options-container)' +
                               ':not(.screenshot-controls),' +
                      'panel-container,' +
                      'window-container,' +
                      '.tooltip-container,' +
                      '.selectable';

  this._selection_controller = new SelectionController(is_selectable, is_not_selectable);

  /* message handling */
  messages.addListener("before-show-view", function(msg) {
    if (msg.id == "console_panel")
    {
      var is_visible = (window.views.command_line && window.views.command_line.isvisible());
      if (is_visible)
      {
        var button = UI.get_instance().get_button("toggle-console");
        is_visible ? button.removeClass("is-active") : button.addClass("is-active");
        UIWindowBase.closeWindow('command_line');
      }
    }
  });

};

GlobalActionHandler.RE_TEXT_INPUTS = new RegExp(["text",
                                                 "search",
                                                 "tel",
                                                 "url",
                                                 "email",
                                                 "password",
                                                 "datetime",
                                                 "date",
                                                 "month",
                                                 "week",
                                                 "time",
                                                 "datetime-local",
                                                 "number",
                                                 "file",
                                                 "color"].join("|"), "i");


