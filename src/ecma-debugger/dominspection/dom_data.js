window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["5.0"] || (cls.EcmascriptDebugger["5.0"] = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * @constructor 
  */

cls.EcmascriptDebugger["6.0"].DOMData =
cls.EcmascriptDebugger["5.0"].DOMData = function()
{

  this._view_ids = ['dom'];  // this needs to be handled in a more general and sytematic way.
  this._settings_id = 'dom';
  this._mime = '';
  this._data_runtime_id = 0;  // data of a dom tree has always just one runtime
  this._current_target = 0;
  this._reset_spotlight_timeouts = new Timeouts();
  this._active_window = [];
  this._is_element_selected_checked = false;

  const 
  ID = 0, 
  TYPE = 1, 
  NAME = 2, 
  DEPTH = 3,
  NAMESPACE = 4, 
  VALUE = 4, 
  ATTRS = 5,
  ATTR_PREFIX = 0,
  ATTR_KEY = 1, 
  ATTR_VALUE = 2,
  CHILDREN_LENGTH = 6, 
  PUBLIC_ID = 4,
  SYSTEM_ID = 5; 

  this._update_views = function()
  {
    for (var view_id, i = 0; view_id = this._view_ids[i]; i++)
    {
      window.views[view_id].update();
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

  this._is_view_visible = function()
  {
    var id = '', i = 0;
    for ( ; ( id = this._view_ids[i] ) && !views[id].isvisible(); i++);
    return i < this._view_ids.length;
  }

  this._get_selected_element = function(rt_id)
  {
    var tag = tagManager.set_callback(this, this.on_element_selected, [rt_id, true]);
    window.services['ecmascript-debugger'].requestGetSelectedObject(tag);
  }

  this.on_element_selected = function(status, message, rt_id, show_initial_view)
  {
    const
    OBJECT_ID = 0,
    WINDOW_ID = 1,
    RUNTIME_ID = 2;

    this._is_element_selected_checked = true;

    if(message[OBJECT_ID])
    {
      if(!window.views.dom.isvisible())
      {
        window.topCell.showView('dom');
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

  this._on_active_tab = function(msg)
  {
    // TODO clean up old tab
    this._data = []; 
    this._mime = '';
    var view_id = '', i = 0;
    // the top frame is per default the active tab
    this._data_runtime_id = msg.activeTab[0];
    messages.post("runtime-selected", {id: this._data_runtime_id});
    window['cst-selects']['document-select'].updateElement();
    this._active_window = msg.activeTab.slice(0);
    for( ; view_id = this._view_ids[i]; i++)
    {
      if(views[view_id].isvisible())
      {
        this._on_show_view({id: view_id})
      }
    }
  }

  this._click_handler_host = function(event)
  {
    var 
    rt_id = event.runtime_id,
    obj_id = event.object_id,
    do_highlight = event.highlight === false ? false : true
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
    if( !( actions['dom'].editor && actions['dom'].editor.is_active ) && this._data_runtime_id == rt_id )
    {
      for( ; ( node = this._data[i] ) && obj_id != node[ID]; i++ );
      if( node  && node[TYPE] == 1 ) // don't update the dom if it's only a text node
      {
        level = node[ DEPTH ];
        j = i + 1 ;
        while( this._data[j] && this._data[j][ DEPTH ] > level ) j++;
        this._data.splice(i, j - i);
        this._update_views();
      }
    }
  }

  this._handle_get_dom = function(rt_id, obj_id, highlight_target)
  {
    var view_id = '', i = 0;
    // handle text nodes as target in get selected element
    for( i = 0; this._data[i] && this._data[i][ID] != obj_id; i++);
    while(this._data[i] && this._data[i][TYPE] != 1) 
    {
      i--;
    }
    if(this._data[i] && this._data[i][ID] != obj_id)
    {
      this._current_target = obj_id = this._data[i][ID];
    }
    if(highlight_target)
    {
      hostspotlighter.spotlight(this._current_target);
    }
    if (rt_id != this._data_runtime_id)
    {
      this._data_runtime_id = rt_id;
      messages.post("runtime-selected", {id: this._data_runtime_id});
      window['cst-selects']['document-select'].updateElement();
    }
    this._update_views();
    if(obj_id)
    {
      messages.post("element-selected", {obj_id: obj_id, rt_id: rt_id});
    } 
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

  this._on_setting_change = function(msg)
  {
    if (msg.id == this._settings_id && this._is_view_visible() && msg.key in this._settings)
      this._handle_setting(msg.key);
  }

  this._on_show_view = function(msg)
  {
    var msg_id = msg.id, id = '', i = 0, key = '';
    for( ; (id = this._view_ids[i]) && id != msg_id; i++);
    if (id)
    {
      if (this._active_window.length)
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
      else
      {
        views[id].update();
      }
    }
  }

  this._on_hide_view = function(msg)
  {
    var msg_id = msg.id, id = '', i = 0;
    for ( ; ( id = this._view_ids[i] ) && id != msg_id; i++);
    if (id)
    {
      this._remove_all_active_window_listeners();
    }
  }

  this._on_runtime_stopped = function(msg)
  {
    if (msg.id == this._data_runtime_id)
    {
      this._data = [];
      this._mime = "";
      this._data_runtime_id = 0;
      var id = '', i = 0;
      for( ; id = this._view_ids[i] ; i++)
      {
        views[id].clearAllContainers();
      }
    }
  }

  this._get_initial_view = function(rt_id)
  {
    var tag = tagManager.set_callback(this, this._handle_initial_view, [rt_id]);
    var script_data = "return ( document.body || document.documentElement )";
    services['ecmascript-debugger'].requestEval(tag, [rt_id, 0, 0, script_data]);
  }

  this.getDOM = function(rt_id)
  {
    if( !(rt_id == this._data_runtime_id && this._data.length) && runtime_onload_handler.check(rt_id, arguments) )
    {
      this._get_initial_view(rt_id);
    }
  }

  this.getDataRuntimeId = function()
  {
    return this._data_runtime_id;
  }

  this.getCSSPath = function(parent_node_chain)
  {
    return this._get_css_path(this._current_target, parent_node_chain,
                              window.settings.dom.get('force-lowercase'),
                              window.settings.dom.get('show-id_and_classes-in-breadcrumb'),
                              window.settings.dom.get('show-siblings-in-breadcrumb'));
  }

  this._handle_initial_view = function(status, message, rt_id)
  {
    
    const
    STATUS = 0,
    OBJECT_VALUE = 3,
    // sub message ObjectValue 
    OBJECT_ID = 0;
    
    if(message[STATUS] == 'completed' )
    {
      this._click_handler_host({runtime_id: rt_id, object_id: message[OBJECT_VALUE][OBJECT_ID], highlight: false})
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        'this._handle_initial_view failed in dom_data\n');
    }
  }

  this.getChildernFromNode = function(object_id, traversal)
  {
    this._get_dom(object_id, traversal, this._update_views_bound);
  }

  this.closeNode = function(object_id, do_not_update)
  {
    this.collapse_node(object_id);
    if (!do_not_update)
      this._update_views();
  }

  this.getSnapshot = function()
  {
    var tag = tagManager.set_callback(this, this._handle_snapshot, [this._data_runtime_id]);
    var script_data = 'return document.document';
    services['ecmascript-debugger'].requestEval(tag, [this._data_runtime_id, 0, 0, script_data]);
  }

  this._handle_snapshot = function(status, message, runtime_id)
  {
    const
    STATUS = 0,
    OBJECT_VALUE = 3,
    // sub message ObjectValue 
    OBJECT_ID = 0;

    if(message[STATUS] == 'completed' )
    {
      this._data = [];
      this._get_dom(message[OBJECT_VALUE][OBJECT_ID], 'subtree', 
                    this._handle_get_dom.bind(this, runtime_id));
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        'this._handle_snapshot in dom_data has failed');
    }
  }

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

  this.setCurrentTarget = function(obj_id)
  {
    messages.post("element-selected", {obj_id: obj_id, rt_id: this._data_runtime_id});
    this._current_target = obj_id;
  }

  this.getCurrentTarget = function(obj_id)
  {
    return this._current_target;
  }

  // to be update from a editor
  this.update = function(state)
  {
    if( state.rt_id == this._data_runtime_id )
    {
      var 
      entry = null, 
      i = 0,
      obj_id = state.obj_id,
      attrs = null,
      attr = null, 
      j = 0;
      
      for( ; this._data[i] && this._data[i][ID] != obj_id; i++ );
      if( this._data[i] )
      {
        switch(state.type)
        {
          case "key":
          case "value":
          {
            if( state.key )
            {
              attrs = this._data[i][ATTRS];
              for( ; ( attr = attrs[j] ) && attr[ATTR_KEY] != state.key; j++ );
              attr || ( attr = attrs[j] = ["", state.key, ""] );
              if( state.value )
              {
                attr[ATTR_VALUE] = state.value;
              }
              else
              {
                attrs.splice(j, 1);
              }
            }
            break;
          }
          case "text":
          {
            this._data[i][VALUE] = state.text;
            break;
          }
        }
      }
    }
  }

  this.bind = function(ecma_debugger)
  {
    ecma_debugger.onObjectSelected =
    ecma_debugger.handleGetSelectedObject = 
    this.on_element_selected.bind(this);
  }

  this._init();

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
  this._update_views_bound = this._update_views.bind(this);
  
  messages.addListener('active-tab', this._on_active_tab_bound);
  messages.addListener('show-view', this._on_show_view_bound);
  messages.addListener('hide-view', this._on_hide_view_bound);
  messages.addListener('setting-changed', this._on_setting_change_bound);
  messages.addListener('runtime-stopped', this._on_runtime_stopped_bound);
  messages.addListener('runtime-destroyed', this._on_runtime_stopped_bound);
  messages.addListener('reset-state', this._on_reset_state_bound);

};

cls.EcmascriptDebugger["5.0"].DOMData.prototype = cls.EcmascriptDebugger["5.0"].DOMBaseData;

// Disable forced lowercase for some elements
cls.EcmascriptDebugger["5.0"].DOMData.DISREGARD_FORCE_LOWER_CASE_WHITELIST = ["svg", "math"];

