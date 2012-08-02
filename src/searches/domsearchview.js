window.cls || (window.cls = {});

/** Inherits from ViewBase,
   @see ../build-application/build_ecmascript_debugger_6_0.js
**/
cls.DOMSearchView = function(id, name, container_class)
{

  const
  SEARCHFIELD = 0,
  MOVE_HIGHLIGHT_UP = 1,
  MOVE_HIGHLIGHT_DOWN = 2,
  HANDLER = 'clear-style-highlight-node',
  SHOW_SEARCH_MATCH = 'show-search-match';

  this.createView = function(container)
  {
    container.clearAndRender(window.templates.search_panel(this, 'dom', HANDLER));
    this._adjust_search_controls(container);
    this._search_container = container.childNodes[1];
    this._search.set_container(this._search_container);
    var query = '[handler="' + this.controls[SEARCHFIELD].handler + '"]';
    this._input = container.querySelector(query);
    this._search.set_form_input(this._input);
    var info_ele = container.getElementsByClassName('search-info-badge')[0];
    this._search.set_info_element(info_ele);
    this._search.show_last_search();
  };

  this._adjust_search_controls = PanelSearch.adjust_search_controls;

  this.onresize = function(container)
  {
    this._adjust_search_controls(container);
  };

  ActionHandlerInterface.apply(this);

  this.focus = function(event, container)
  {
    setTimeout(this._focus_input, 50);
  };

  this.focus_search_field = function()
  {
    this._focus_input();
  }

  this._focus_input = function()
  {
    if (this._input)
    {
      this._input.selectionStart = 0;
      this._input.selectionEnd = this._input.value.length;
      this._input.focus();
    }
  }.bind(this);

  this._handlers['highlight-next-match'] = function(action_id, event, target)
  {
    this._search.highlight_next();
    return false;
  }.bind(this);

  this._handlers['highlight-previous-match'] = function(action_id, event, target)
  {
    this._search.highlight_previous();
    return false;
  }.bind(this);

  this._handlers['show-script'] = function(action_id, event, target)
  {
    var hit_ele = this._search.get_current_hit_element();
    if (hit_ele)
    {
      hit_ele.dispatchMouseEvent('click');
    }
    return false;
  }.bind(this);

  this._ondomviewupdated = function(msg)
  {
    if (this._search_hit)
    {
      window.views.dom.highlight_search_hit(this._search_hit);
      this._search_hit = null;
    }
  };

  this._show_search_hit = function(event, target)
  {
    if (target.get_ancestor(".panel-search-container"))
    {
      this._search.update_match_highlight(event, target);
      this._search_hit = this._search.get_search_hit();
      if (window.host_tabs.is_runtime_of_active_tab(this._search_hit.runtime_id))
        eventHandlers.click['inspect-node-link'](event, target);
      else
        new ConfirmDialog(ui_strings.D_REDO_SEARCH, this._redo_search_bound).show();
    }
    else
    {
      var rt_id = Number(target.get_ancestor_attr("data-rt-id"));
      if (window.host_tabs.is_runtime_of_active_tab(rt_id))
        eventHandlers.click['inspect-node-link'](event, target);
    }
  };

  this._onsettingchange = function(msg)
  {
    if (msg.id == "dom" &&
        (msg.key == "dom-tree-style" || msg.key == "force-lowercase"))
    {
      this.update();
    }
  };

  this._init = function(id, name, container_class)
  {
    this.required_services = ["ecmascript-debugger"];
    this.init(id, name, container_class);
    this.shared_shortcuts = "search";
    this.shared_shortcuts_label = ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH;
    this._search = new DOMSearch();
    this._redo_search_bound = this._search.highlight_next.bind(this._search);
    this.controls =
    [
      {
        handler: this.id + '-simple-text-search',
        class: 'panel-search-input-container',
        shortcuts: this.id + '-simple-text-search',
        title: ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH
      },
      {
        handler: this.id + '-move-highlight-up',
        type: "search_control",
        class: "search-move-highlight-up",
        title: ui_strings.S_LABEL_MOVE_HIGHLIGHT_UP
      },
      {
        handler: this.id + '-move-highlight-down',
        type: "search_control",
        class: "search-move-highlight-down",
        title: ui_strings.S_LABEL_MOVE_HIGHLIGHT_DOWN
      },
    ];

    [
      'search_type',
      'ignore_case',
      'search_only_selected_node',
      'is_token_search',
    ].forEach(function(prop)
    {
      this.__defineGetter__(prop, function()
      {
        return this._search[prop];
      });
      this.__defineSetter__(prop, function(){});
    }, this);

    eventHandlers.click[this.controls[MOVE_HIGHLIGHT_DOWN].handler] =
      this._handlers['highlight-next-match'];
    eventHandlers.click[this.controls[MOVE_HIGHLIGHT_UP].handler] =
      this._handlers['highlight-previous-match'];
    eventHandlers.mouseover[HANDLER] =
      this._search.clear_style_highlight_node.bind(this._search);
    eventHandlers.click[SHOW_SEARCH_MATCH] = this._show_search_hit.bind(this);
    eventHandlers.mouseover[SHOW_SEARCH_MATCH] =
      eventHandlers.mouseover['inspect-node-link'];
    this._broker = ActionBroker.get_instance();
    this._broker.register_handler(this);
    this._broker.get_global_handler()
    .register_shortcut_listener(this.controls[SEARCHFIELD].shortcuts,
                                this.handle.bind(this),
                                ['highlight-next-match',
                                 'highlight-previous-match',
                                 'hide-search']);
    this._broker.get_global_handler().register_search_panel(this.id);
    messages.addListener('setting-changed', this._onsettingchange.bind(this));
    messages.addListener('dom-view-updated', this._ondomviewupdated.bind(this));
  };

  this._init(id, name, container_class);

};
