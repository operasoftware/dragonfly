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
    * To register a shortcut listener with a unique id token
    * on a global input element. Global as not being part of a view pane, e.g.
    * an input in a toolbar.
    * @param {String} listener_id. A unique token.
    * @param {Function} callback
    * @param {Array} action_list. A list of action supported by
    * that listener, optional.
    */
  this.register_shortcut_listener = function(listener_id, callback, action_list){};

  /* constants */

  const
  MODE_DEFAULT = "default",
  MODE_EDIT = "edit";

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

  this._clear_stopped_views = function()
  {
    window.views.js_source.clearLinePointer();
    window.views.callstack.clearView();
    window.views.inspection.clearView();
  }

  this._handlers['continue-run'] =
  function(action_id, event, target)
  {
    this._clear_stopped_views();
    window.stop_at.__continue('run');
    return false;
  }.bind(this);

  this._handlers['continue-step-next-line'] =
  function(action_id, event, target)
  {
    this._clear_stopped_views();
    window.stop_at.__continue('step-next-line');
    return false;
  }.bind(this);

  this._handlers['continue-step-out-of-call'] =
  function(action_id, event, target)
  {
    this._clear_stopped_views();
    window.stop_at.__continue('step-out-of-call');
    return false;
  }.bind(this);

  this._handlers['continue-step-into-call'] =
  function(action_id, event, target)
  {
    this._clear_stopped_views();
    window.stop_at.__continue('step-into-call');
    return false;
  }.bind(this);

  this._handlers["select-all"] = function(action_id, event, target)
  {
    var selection = getSelection();
    var range = document.createRange();
    selection.removeAllRanges()
    range.selectNodeContents(target);
    selection.addRange(range);
    return false;
  };

  this._handlers["invert-spotlight-colors"] = function(action_id, event, target)
  {
    window.hostspotlighter.invertColors();
    return false;
  };

  this._handlers["toggle-console"] = function(action_id, event, target)
  {
    var overlay = Overlay.get_instance();
    if (overlay.is_visible)
    {
      this["hide-overlay"](action_id, event, target);
      return;
    }

    var ele = document.querySelector("[view_id=command_line]");
    var visible = (window.views.command_line && window.views.command_line.isvisible());

    if (!visible)
    {
      UIWindowBase.showWindow('command_line',
                              innerHeight/2, 0,
                              innerWidth, innerHeight/2);
      setTimeout(function() {
        var box = UI.get_instance().get_layout_box('command_line');
        var ele = box && box.container.getElement();
        ele && (ele = ele.getElementsByTagName('textarea')[0]) && ele.focus();
      }, 0);
    }
    else
    {
      UIWindowBase.closeWindow('command_line');
    }

    UI.get_instance().get_button("toggle-console")
                     .setAttribute("is-active", !visible);
    return false;
  };

  this._handlers["show-overlay"] = function(action_id, event, target)
  {
    const OVERLAY_TOP_MARGIN = 10;
    const OVERLAY_RIGHT_MARGIN = 20;

    var overlay = Overlay.get_instance();
    var ui = UI.get_instance();
    var overlay_id = target.getAttribute("data-overlay-id");

    ui.get_button("toggle-" + overlay_id).setAttribute("is-active", "true");

    overlay.show(overlay_id);

    if (target)
    {
      var button_dims = target.getBoundingClientRect();
      var element = overlay.element.querySelector("overlay-window");
      var arrow = overlay.element.querySelector("overlay-arrow");
      element.style.top = button_dims.bottom + OVERLAY_TOP_MARGIN + "px";
      element.addClass("attached");
      arrow.style.right = document.documentElement.clientWidth - button_dims.right - OVERLAY_RIGHT_MARGIN + "px";
    }
  };
  this._private_handlers.push("show-overlay");

  this._handlers["hide-overlay"] = function(action_id, event, target)
  {
    var overlay = Overlay.get_instance();
    var ui = UI.get_instance();
    var client = window.client.current_client;
    var overlay_id = overlay.active_overlay;

    ui.get_button("toggle-" + overlay_id).setAttribute("is-active", "false");

    if (overlay_id == "remote-debug-overlay" && (!client || !client.connected))
    {
      UI.get_instance().get_button("toggle-remote-debug-overlay")
                       .removeClass("alert");
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
  
  this._handlers["focus-container-search-field"] = function(action_id, event, target)
  {
    /* get context -> get container (representation? view?) ->  get UI object -> get cell -> get toolbar -> get search field. If found, focus and return false */
    var container = ActionBroker.get_instance().get_action_container();
    var ui_obj = UIBase.getUIById(container.getAttribute('ui-id'));
    var filters = ui_obj && ui_obj.cell.toolbar && ui_obj.cell.toolbar.get_filters();
    var element = null;
    if (filters && filters[0] && (element = ViewBase.getToolbarControl(container, filters[0].handler)))
    {
      element.focus();
      return false;
    }
  }

  this._handlers["show-search"] = function(action_id, event, target)
  {
    var action_id = ActionBroker.get_instance().get_current_handler_id();
    var search = UI.get_instance().get_search(action_id);
    if (search)
    {
      search.show();
      return false;
    }
  }

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

  this.onclick = function(event)
  {
    this.mode = /input|textarea/i.test(event.target.nodeName) ?
                                       MODE_EDIT :
                                       MODE_DEFAULT;
  };

  this.focus = function(event, container)
  {
    this.mode = event && /input|textarea/i.test(event.target.nodeName) ?
                                                MODE_EDIT :
                                                MODE_DEFAULT;
  };

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

  /* instatiation */


}


