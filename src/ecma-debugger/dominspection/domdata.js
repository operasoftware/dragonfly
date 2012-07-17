window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * @constructor
  * @extends InspectableDOMNode
  */

cls.EcmascriptDebugger["6.0"].DOMData = function(view_id)
{

  /* interface */

  /**
    * To get an initial DOM of the given runtime.
    * Selects either the body or the root element in that order, if no optional
    * obj id is given.
    * Displays a travesal 'parent-node-chain-with-children' for the selected node.
    * @param {Number} rt_id. The runtime id of the given runtime.
    * @param {Number} obj_id. The optional node to be inspected.
    */
  this.get_dom = function(rt_id, obj_id, do_highlight, scroll_ito_view){};

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
  DEPTH = 3,
  CHILDREN_LENGTH = 6;

  const NOT_CHECKED = 0;
  const CHECKED = 1;
  const CHECK_AGAIN_RUNTIME = 2;
  const CHECK_AGAIN_NO_RUNTIME = 3;
  const PSEUDO_NODE = cls.EcmascriptDebugger["6.0"].InspectableDOMNode.PSEUDO_NODE;

  /* private */

  this._view_id = view_id;
  this._settings_id = view_id;
  this._current_target = 0;
  // to select a runtime if none is selected
  this._active_window = [];
  this._element_selected_state = NOT_CHECKED;
  // spotlight on hover on the host side
  this._reset_spotlight_timeouts = new Timeouts();
  this._is_waiting = false;
  this._editor_active = false;

  this._spotlight = function(event)
  {
    this._reset_spotlight_timeouts.clear();
    if (window.settings.dom.get('highlight-on-hover'))
      hostspotlighter.soft_spotlight(event.object_id);
  }

  this._reset_spotlight = function()
  {
    if (this._current_target)
    {
      if (window.settings.dom.get('highlight-on-hover'))
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
    if (msg.id == this._view_id)
    {
      if (this._active_window.length)
      {
        // in the case there is no runtime selected
        // set the top window to the active runtime
        if (!this._data_runtime_id)
        {
          this._data_runtime_id = this._active_window[0];
        }

        for (var key in this._settings)
        {
          if (window.settings[this._settings_id].get(key))
            this._handle_setting(key);
        }

        if (!this._is_waiting)
        {
          if (!this._data.length && this._element_selected_state == CHECKED)
          {
            this._get_initial_view(this._data_runtime_id);
          }
          else if (this._element_selected_state != CHECKED &&
                   this._element_selected_state != CHECK_AGAIN_NO_RUNTIME)
          {
            this._get_selected_element(this._data_runtime_id);
          }
        }
      }
      else
      {
        // caller is also _on_active_tab.
        // if the runtime list is empty, the view must be updated too
        // and the element selection must be cleared
        window.views.dom.update();
        window.messages.post("element-selected", {obj_id: 0, rt_id: 0, model: null});
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
      off: function(){window.hostspotlighter.clearSpotlight();},
      on: function()
      {
        if (window.dom_data.target)
        {
          window.hostspotlighter.spotlight(window.dom_data.target);
        }
      }
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
    // If the window ID is not the debug context, the runtime ID will not be set
    const OBJECT_ID = 0, WINDOW_ID = 1, RUNTIME_ID = 2;
    this._element_selected_state = CHECKED;
    if (message[OBJECT_ID])
    {
      this._data_runtime_id = message[RUNTIME_ID];
      if (!window.views[this._view_id].isvisible())
      {
        if (message[WINDOW_ID] == window.window_manager_data.get_debug_context())
        {
          this._element_selected_state = CHECK_AGAIN_RUNTIME;
        }
        else
        {
          this._element_selected_state = CHECK_AGAIN_NO_RUNTIME;
          window.window_manager_data.set_debug_context(message[WINDOW_ID]);
        }

        this._data = [];
        window.topCell.showView(this._view_id);
      }
      else
      {
        if (message[WINDOW_ID] == window.window_manager_data.get_debug_context())
        {
          messages.post("runtime-selected", {id: this._data_runtime_id});
          window['cst-selects']['document-select'].updateElement();
          this._get_dom_sub(message[RUNTIME_ID], message[OBJECT_ID], true);
        }
        else
        {
          this._element_selected_state = CHECK_AGAIN_NO_RUNTIME;
          window.window_manager_data.set_debug_context(message[WINDOW_ID]);
        }
      }
    }
    else if (show_initial_view)
    {
      this._get_initial_view(rt_id);
    }
  }

  this._on_profile_disabled = function(msg)
  {
    if (msg.profile == window.app.profiles.DEFAULT)
      this._on_reset_state();
  };

  this._on_reset_state = function()
  {
    this._data = [];
    this._mime = '';
    this._data_runtime_id = 0;
    this._current_target = 0;
    this._active_window = [];
    this.target = 0;
  }

  this._on_active_tab = function(msg)
  {
    if (!this._data_runtime_id ||
        msg.activeTab.indexOf(this._data_runtime_id) == -1)
    {
      if (this._element_selected_state == CHECK_AGAIN_NO_RUNTIME)
      {
        this._get_selected_element();
        this._active_window = msg.activeTab.slice();
      }
      else
      {
        this._on_reset_state();
        // the first field is the top runtime
        this._data_runtime_id = msg.activeTab[0];
        messages.post("runtime-selected", {id: this._data_runtime_id});
        window['cst-selects']['document-select'].updateElement();
        this._active_window = msg.activeTab.slice();
        if (window.views[this._view_id].isvisible())
          this._on_show_view({id: this._view_id})
      }
    }
  }

  this._on_top_runtime_update = function()
  {
    window['cst-selects']['document-select'].updateElement();
  }

  this._on_dom_editor_active = function(message)
  {
    this._editor_active = message.editor_active;
  };

  this._click_handler_host = function(event)
  {
    var rt_id = event.runtime_id
    var obj_id = event.object_id;
    var do_highlight = event.highlight === false ? false : true;
    this._get_dom_sub(rt_id, obj_id, do_highlight);
  }

  this._get_dom_sub = function(rt_id, obj_id, do_highlight, scroll_into_view)
  {
    var cb = this._handle_get_dom.bind(this, rt_id, obj_id,
                                       do_highlight, scroll_into_view);
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
    if (this._data_runtime_id == rt_id)
    {
      for ( ; (node = this._data[i]) && obj_id != node[ID]; i++);
      if (node)
      {
        level = node[DEPTH];
        j = i + 1 ;
        while (this._data[j] && this._data[j][DEPTH] > level)
          j++;
        this._data.splice(i, j - i);
        // update the children count of the parent node
        i--;
        level--;
        // get the parent node
        while (this._data[i] && this._data[i][DEPTH] > level)
          i--;
        if (this._data[i])
        {
          var children_count = 0;
          j = i + 1;
          while (this._data[j] && this._data[j][DEPTH] > level)
          {
            if (this._data[j][DEPTH] == (level + 1) &&
                this._data[j][TYPE] !== PSEUDO_NODE)
            {
              children_count++;
            }
            j++;
          }
          this._data[i][CHILDREN_LENGTH] = children_count;
        }
        if (!this._editor_active)
        {
          window.views[this._view_id].update();
        }
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

  this._handle_get_dom = function(rt_id, obj_id, highlight_target, scroll_into_view)
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
    if (highlight_target && window.settings.dom.get('highlight-on-hover'))
    {
      window.hostspotlighter.spotlight(this._current_target, scroll_into_view);
    }
    if (rt_id != this._data_runtime_id)
    {
      this._data_runtime_id = rt_id;
      messages.post("runtime-selected", {id: this._data_runtime_id});
      window['cst-selects']['document-select'].updateElement();
    }
    if (obj_id)
    {
      this.breadcrumbhead = null;
      this.breadcrumb_offsets = null;
      this.target = obj_id;
      window.dominspections.active = this;
      messages.post("element-selected", {obj_id: obj_id, rt_id: rt_id, model: this});
    }
    window.views[this._view_id].update();
    this._is_waiting = false;
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
    if (message[STATUS] == 'completed')
    {
      if (message[OBJECT_VALUE])
      {
        this._click_handler_host({runtime_id: rt_id,
                                  object_id: message[OBJECT_VALUE][OBJECT_ID],
                                  highlight: false});
      }
    }
    else
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
        'this._handle_initial_view failed in dom_data\n');
    }
  }

  this._handle_snapshot = function(status, message, runtime_id)
  {
    const STATUS = 0, OBJECT_VALUE = 3, OBJECT_ID = 0;
    if (message[STATUS] == 'completed' && message[OBJECT_VALUE])
    {
      this._data = [];
      this._get_dom(message[OBJECT_VALUE][OBJECT_ID], 'subtree',
                    this._handle_get_dom.bind(this, runtime_id));
    }
    else
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
        'this._handle_snapshot in dom_data has failed');
  }

  /* implementation */


  this.get_dom = (function(rt_id, obj_id, do_highlight, scroll_into_view)
  {
    if (obj_id)
      this._get_dom_sub(rt_id, obj_id, do_highlight, scroll_into_view);
    else if (!(rt_id == this._data_runtime_id && this._data.length))
    {
      if (runtime_onload_handler.is_loaded(rt_id))
        this._get_initial_view(rt_id);
      else
        runtime_onload_handler.register(rt_id, this._get_initial_view.bind(this, rt_id));
    }
    this._is_waiting = true;
  }).bind(this);

  this.get_snapshot = function()
  {
    var tag = tagManager.set_callback(this, this._handle_snapshot, [this._data_runtime_id]);
    var script_data = 'return document.documentElement && document.documentElement.ownerDocument;';
    services['ecmascript-debugger'].requestEval(tag, [this._data_runtime_id, 0, 0, script_data]);
  }

  this.remove_node = function(rt_id, ref_id)
  {
    this._dom_node_removed_handler({"object_id": ref_id, "runtime_id": rt_id});
  };

  this.bind = function(ecma_debugger)
  {
    ecma_debugger.onObjectSelected =
    ecma_debugger.handleGetSelectedObject =
    this._on_element_selected.bind(this);
  }

  /* initialisation */

  this._on_reset_state_bound = this._on_reset_state.bind(this);
  this._on_profile_disabled_bound = this._on_profile_disabled.bind(this);
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
  this._on_top_runtime_update_bound = this._on_top_runtime_update.bind(this);
  this._on_dom_editor_active_bound = this._on_dom_editor_active.bind(this);

  this._init(0, 0);

  messages.addListener('active-tab', this._on_active_tab_bound);
  messages.addListener('show-view', this._on_show_view_bound);
  messages.addListener('hide-view', this._on_hide_view_bound);
  messages.addListener('setting-changed', this._on_setting_change_bound);
  messages.addListener('runtime-stopped', this._on_runtime_stopped_bound);
  messages.addListener('runtime-destroyed', this._on_runtime_stopped_bound);
  messages.addListener('reset-state', this._on_reset_state_bound);
  messages.addListener('top-runtime-updated', this._on_top_runtime_update_bound);
  messages.addListener('dom-editor-active', this._on_dom_editor_active_bound);
  messages.addListener('profile-disabled', this._on_profile_disabled_bound);
};

cls.EcmascriptDebugger["6.0"].DOMData.prototype = cls.EcmascriptDebugger["6.0"].InspectableDOMNode.prototype;

// Disable forced lowercase for some elements
cls.EcmascriptDebugger["6.0"].DOMData.DISREGARD_FORCE_LOWER_CASE_WHITELIST = ["svg", "math"];
