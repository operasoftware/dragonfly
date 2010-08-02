window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["5.0"] || (cls.EcmascriptDebugger["5.0"] = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * @constructor
  * @extends InspectableDOMNode
  */

cls.EcmascriptDebugger["6.0"].DOMData =
cls.EcmascriptDebugger["5.0"].DOMData = function(view_id)
{

  /* interface */

  /**
    * To get an initial DOM of the given runtime.
    * Selects either the body or the root element in that oreder.
    * Displays a travesal 'parent-node-chain-with-children' for the selected node.
    * @param {Number} rt_id. The runtime id of the given runtime.
    */
  this.get_dom = function(rt_id){};

  /**
    * To get a fully expanded DOM of the current selected runtime (document).
    */
  this.get_snapshot = function(){};

  /**
    * To bind the instantiated object to the service interface.
    */
  this.bind = function(ecma_debugger){};

  /* constants */

  const
  ID = 0,
  TYPE = 1,
  DEPTH = 3;

  /* private */

  this._view_id = view_id;
  this._settings_id = view_id;
  this._current_target = 0;
  // to select a runtime if none is selected
  this._active_window = [];
  this._is_element_selected_checked = false;
  // spotlight on hover on the host side
  this._reset_spotlight_timeouts = new Timeouts();

  this._spotlight = function(event)
  {
    this._reset_spotlight_timeouts.clear();
    hostspotlighter.soft_spotlight(event.object_id);
  }

  this._reset_spotlight = function()
  {
    if (this._current_target)
    {
      hostspotlighter.spotlight(this._current_target);
    }
  }

  this._set_reset_spotlight = function(event)
  {
    this._reset_spotlight_timeouts.set(this._reset_spotlight_bound, 70);
  }

  this._on_setting_change = function(msg)
  {
    if (msg.id == this._settings_id &&
        window.views[this._view_id].isvisible() &&
        msg.key in this._settings)
      this._handle_setting(msg.key);
  }

  this._on_show_view = function(msg)
  {
    if (msg.id == this._view_id && this._active_window.length)
    {
      // in the case there is no runtime selected
      // set the top window to the active runtime
      if (!this._data_runtime_id)
        this._data_runtime_id = this._active_window[0];
      for (key in this._settings)
      {
        if (window.settings[this._settings_id].get(key))
          this._handle_setting(key);
      }
      if (!this._data.length)
      {
        if(this._is_element_selected_checked)
          this._get_initial_view(this._data_runtime_id);
        else
          this._get_selected_element(this._data_runtime_id);
      }
    }
  }

  this._on_hide_view = function(msg)
  {
    if (msg.id == this._view_id)
      this._remove_all_active_window_listeners();
  }

  this._settings =
  {
    'highlight-on-hover':
    {
      events:
      [
        ['mouseover', '_spotlight_bound'],
        ['mouseout', '_set_reset_spotlight_bound']
      ],
      off: function(){window.hostspotlighter.clearSpotlight();}
    },
    'find-with-click':
    {
      events:
      [
        ['click', '_click_handler_host_bound']
      ]
    },
    'update-on-dom-node-inserted':
    {
      events:
      [
        ['DOMNodeRemoved', '_dom_node_removed_handler_bound']
      ]
    },
  };

  this._handle_setting = function(key)
  {
    var
    EVENT = 0,
    HANDLER = 1,
    active_window = window.host_tabs.activeTab,
    value = window.settings[this._settings_id].get(key),
    handlers = this._settings[key].events,
    handler = null,
    method = (value ? 'add' : 'remove') + 'EventListener',
    i = 0;

    for ( ; handler = handlers[i]; i++)
      active_window[method](handler[EVENT], this[handler[HANDLER]]);
    if (!value && this._settings[key].off)
      this._settings[key].off();
    if (value && this._settings[key].on)
      this._settings[key].on();
  }

  this._remove_all_active_window_listeners = function()
  {
    var
    EVENT = 0,
    HANDLER = 1,
    active_window = window.host_tabs.activeTab,
    handlers = null,
    handler = null,
    key = '',
    i = 0;

    for (key in this._settings)
    {
      handlers = this._settings[key].events;
      for (i = 0 ; handler = handlers[i]; i++)
        active_window.removeEventListener(handler[EVENT], this[handler[HANDLER]]);
    }
  }

  this._get_selected_element = function(rt_id)
  {
    var tag = tagManager.set_callback(this, this._on_element_selected, [rt_id, true]);
    window.services['ecmascript-debugger'].requestGetSelectedObject(tag);
  }

  this._on_element_selected = function(status, message, rt_id, show_initial_view)
  {
    const OBJECT_ID = 0, WINDOW_ID = 1, RUNTIME_ID = 2;
    this._is_element_selected_checked = true;
    if(message[OBJECT_ID])
    {
      if(!window.views[this._view_id].isvisible())
      {
        window.topCell.showView(this._view_id);
      }
      // TODO this will fail on inspecting a popup which is part of the debug context
      if(message[WINDOW_ID] == window.window_manager_data.get_debug_context())
      {
        this._click_handler_host({runtime_id: message[RUNTIME_ID], object_id: message[OBJECT_ID]});
      }
      else
      {
        this._is_element_selected_checked = false;
        window.window_manager_data.set_debug_context(message[WINDOW_ID]);
      }
    }
    else if (show_initial_view)
    {
      this._get_initial_view(rt_id);
    }
  }

  this._on_reset_state = function()
  {
    this._data = [];
    this._mime = '';
    this._data_runtime_id = 0;
    this._current_target = 0;
    this._active_window = [];
  }

  this._on_active_tab = function(msg)
  {
    this._on_reset_state();
    // the top frame is per default the active tab
    this._data_runtime_id = msg.activeTab[0];
    messages.post("runtime-selected", {id: this._data_runtime_id});
    window['cst-selects']['document-select'].updateElement();
    this._active_window = msg.activeTab.slice();
    if (window.views[this._view_id].isvisible())
      this._on_show_view({id: this._view_id})
  }

  this._click_handler_host = function(event)
  {
    var
    rt_id = event.runtime_id,
    obj_id = event.object_id,
    do_highlight = event.highlight === false ? false : true,
    cb = this._handle_get_dom.bind(this, rt_id, obj_id, do_highlight);

    this._current_target = obj_id;
    this._data = [];
    this._mime = '';
    this._get_dom(obj_id, 'parent-node-chain-with-children', cb);
  }

  this._dom_node_removed_handler = function(event)
  {
    // if the node is in the current data handle it otherwise not.
    var rt_id = event.runtime_id, obj_id = event.object_id;
    var node = null, i = 0, j = 0, level = 0, k = 0, view_id = '';
    if ( !(actions[this._view_id].editor && actions[this._view_id].editor.is_active) &&
          this._data_runtime_id == rt_id)
    {
      for ( ; (node = this._data[i]) && obj_id != node[ID]; i++);
      if (node && node[TYPE] == 1) // don't update the dom if it's only a text node
      {
        level = node[DEPTH];
        j = i + 1 ;
        while (this._data[j] && this._data[j][DEPTH] > level)
          j++;
        this._data.splice(i, j - i);
        window.views[this._view_id].update();
      }
    }
  }

  this._on_runtime_stopped = function(msg)
  {
    if (msg.id == this._data_runtime_id)
    {
      this._data = [];
      this._mime = "";
      this._data_runtime_id = 0;
      window.views[this._view_id].clearAllContainers();
    }
  }

  this._handle_get_dom = function(rt_id, obj_id, highlight_target)
  {
    // handle text nodes as target in get selected element
    for (var i = 0; this._data[i] && this._data[i][ID] != obj_id; i++);
    while(this._data[i] && this._data[i][TYPE] != 1)
    {
      i--;
    }
    if (this._data[i] && this._data[i][ID] != obj_id)
    {
      this._current_target = obj_id = this._data[i][ID];
    }
    if (highlight_target)
    {
      window.hostspotlighter.spotlight(this._current_target);
    }
    if (rt_id != this._data_runtime_id)
    {
      this._data_runtime_id = rt_id;
      messages.post("runtime-selected", {id: this._data_runtime_id});
      window['cst-selects']['document-select'].updateElement();
    }
    if (obj_id)
    {
      this.target = obj_id;
      window.dominspections.active = this;
      messages.post("element-selected", {obj_id: obj_id, rt_id: rt_id, model: this});
    }
    window.views[this._view_id].update();
  }

  this._get_initial_view = function(rt_id)
  {
    var tag = tagManager.set_callback(this, this._handle_initial_view, [rt_id]);
    var script_data = "return ( document.body || document.documentElement )";
    services['ecmascript-debugger'].requestEval(tag, [rt_id, 0, 0, script_data]);
  }

  this._handle_initial_view = function(status, message, rt_id)
  {
    const STATUS = 0, OBJECT_VALUE = 3, OBJECT_ID = 0;
    if(message[STATUS] == 'completed' )
      this._click_handler_host({runtime_id: rt_id,
                                object_id: message[OBJECT_VALUE][OBJECT_ID],
                                highlight: false});
    else
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
        'this._handle_initial_view failed in dom_data\n');
  }

  this._handle_snapshot = function(status, message, runtime_id)
  {
    const STATUS = 0, OBJECT_VALUE = 3, OBJECT_ID = 0;
    if(message[STATUS] == 'completed' )
    {
      this._data = [];
      this._get_dom(message[OBJECT_VALUE][OBJECT_ID], 'subtree',
                    this._handle_get_dom.bind(this, runtime_id));
    }
    else
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
        'this._handle_snapshot in dom_data has failed');
  }

  /* implementation */

  this.get_dom = function(rt_id)
  {
    if ( !(rt_id == this._data_runtime_id && this._data.length) &&
          runtime_onload_handler.check(rt_id, arguments))
      this._get_initial_view(rt_id);
  }

  this.get_snapshot = function()
  {
    var tag = tagManager.set_callback(this, this._handle_snapshot, [this._data_runtime_id]);
    var script_data = 'return document.document';
    services['ecmascript-debugger'].requestEval(tag, [this._data_runtime_id, 0, 0, script_data]);
  }

  this.bind = function(ecma_debugger)
  {
    ecma_debugger.onObjectSelected =
    ecma_debugger.handleGetSelectedObject =
    this._on_element_selected.bind(this);
  }

  /* initialisation */

  this._on_reset_state_bound = this._on_reset_state.bind(this);
  this._on_active_tab_bound = this._on_active_tab.bind(this);
  this._click_handler_host_bound = this._click_handler_host.bind(this);
  this._on_setting_change_bound = this._on_setting_change.bind(this);
  this._on_show_view_bound = this._on_show_view.bind(this);
  this._on_hide_view_bound = this._on_hide_view.bind(this);
  this._dom_node_removed_handler_bound = this._dom_node_removed_handler.bind(this);
  this._on_runtime_stopped_bound = this._on_runtime_stopped.bind(this);
  this._spotlight_bound = this._spotlight.bind(this);
  this._reset_spotlight_bound = this._reset_spotlight.bind(this);
  this._set_reset_spotlight_bound = this._set_reset_spotlight.bind(this);

  this._init(0, 0);

  messages.addListener('active-tab', this._on_active_tab_bound);
  messages.addListener('show-view', this._on_show_view_bound);
  messages.addListener('hide-view', this._on_hide_view_bound);
  messages.addListener('setting-changed', this._on_setting_change_bound);
  messages.addListener('runtime-stopped', this._on_runtime_stopped_bound);
  messages.addListener('runtime-destroyed', this._on_runtime_stopped_bound);
  messages.addListener('reset-state', this._on_reset_state_bound);

};

cls.EcmascriptDebugger["5.0"].DOMData.prototype = cls.EcmascriptDebugger["6.0"].InspectableDOMNode.prototype;

// Disable forced lowercase for some elements
cls.EcmascriptDebugger["5.0"].DOMData.DISREGARD_FORCE_LOWER_CASE_WHITELIST = ["svg", "math"];
