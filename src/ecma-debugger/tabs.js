window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["5.0"] || (cls.EcmascriptDebugger["5.0"] = {});

/**
  * @constructor 
  */

cls.EcmascriptDebugger["5.0"].HostTabs = function()
{
  var self = this;
  var __window_id = '';
  /* an array with all runtime ids off the active tab */
  var __activeTab = [];
  var document_map = {};

  var type_map = {};
  var callback_map = {};
  var node_map = {};
  var runtime_id_map = {};
  var id_map = {};
  var handler_id = 1;
  var activeEvents = [];

  var __get_document_id = {};



  var getNewHandlerId = function()
  {
    var id = handler_id;
    handler_id++;
    id_map[id] = 1;
    return id;
  }

  var checkTriple = function(node_id, event_type, callback)
  {
    var id_p = '';
    for( id_p in id_map )
    {
      if( node_map[id_p] == node_id && type_map[id_p] == event_type && callback_map[id_p] == callback )
      {
        return true;
      }
    }
    return false;
  }

  var getHandlerId = function(event_type, callback)
  {
    var id_ps = [], id_p = '';
    for( id_p in id_map )
    {
      if( type_map[id_p] == event_type && callback_map[id_p] == callback )
      {
        id_ps[id_ps.length] = id_p;
      }
    }
    return id_ps;
  }

  var activeTabOnChange = function()
  {
    // remove all event listeners
    var rt_id = '', i = 0, h_id = '';
    for( ; rt_id = __activeTab[i]; i++)
    {
      for( h_id in runtime_id_map )
      {
        if( runtime_id_map[h_id] == rt_id )
        {
          clearEventListener(h_id);
        }
      }
    }
  }

  this.setActiveTab = function(window_id)
  {
    activeTabOnChange();
    __window_id = window_id;
    runtimes.setActiveWindowId(window_id);
    __activeTab = runtimes.getRuntimeIdsFromWindow(window_id);
    messages.post('active-tab', {activeTab: __activeTab} ); 
  }

  this.updateActiveTab = function()
  {
    __activeTab = runtimes.getRuntimeIdsFromWindow(__window_id);
    var ev = null, i = 0;
    for( ; ev = activeEvents[i]; i++)
    {
      __addEvenetListener(ev.type, ev.cb, ev.prevent_default, ev.stop_propagation);
    }
    cleanUpEventListener();
    messages.post('active-tab', {activeTab: __activeTab} );
  }

  this.getActiveTab = function(top_frame_runtime_id)
  {
    return __activeTab;
  }

  this.is_runtime_of_active_tab = function(rt)
  {
    return __activeTab.indexOf(rt) != -1;
  }

  this.isMultiRuntime = function()
  {
    return __activeTab.length > 1;
  }

  this.handleEventHandler = function(status, message)
  {

    if( window.__times_spotlight__ ) 
    {
      window.__times_spotlight__[0] =  new Date().getTime();
    }

    const
    OBJECT_ID = 0,
    HANDLER_ID = 1,
    EVENT_TYPE = 2;

    if( message[HANDLER_ID] in callback_map )
    {
      callback_map[message[HANDLER_ID]](
        {
          'object-id': message[OBJECT_ID],
          'handler-id': message[HANDLER_ID],
          'event-type': message[EVENT_TYPE],
          runtime_id: runtime_id_map[message[HANDLER_ID]]
        }
      );
    }
  }

  var handleAddEventWithDocument = function(status, message, runtime_id)
  {
    const
    STATUS = 0,
    OBJECT_VALUE = 3,
    // sub message ObjectValue 
    OBJECT_ID = 0;

    var 
    event_type = '', 
    callback = null, 
    prevent_default = null, 
    stop_propagation = null,
    id = 0,
    ev_listener = null, 
    i = 0,
    node_id = 0;

    if( message[STATUS] == 'completed' )
    {
      node_id = message[OBJECT_VALUE][OBJECT_ID];
      document_map[runtime_id] = node_id;
      for( ; ev_listener = __get_document_id[runtime_id][i]; i++)
      {
        // __get_document_id[rt_p].push([rt_p, event_type, callback, prevent_default, stop_propagation])
        event_type = ev_listener[1];
        callback = ev_listener[2]; 
        prevent_default = ev_listener[3];
        stop_propagation = ev_listener[4];
        if( !checkTriple(node_id, event_type, callback ) ) 
        {
          id = getNewHandlerId();
          node_map[id] = node_id;
          type_map[id] = event_type;
          callback_map[id] = callback;
          runtime_id_map[id] = runtime_id;
          services['ecmascript-debugger'].requestAddEventHandler(33, 
              [id, node_id, "", event_type, prevent_default && 1 || 0, stop_propagation && 1 || 0]); 
        }
      }
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        'Error in host_tabs handleAddEventWithDocument');
    }
     
  }

  var __addEvenetListener = function(event_type, callback, prevent_default, stop_propagation)
  {
    var rt_p = '', i = 0, id = '';
    for( ; rt_p = __activeTab[i]; i++ )
    {
      if( document_map[rt_p] && !checkTriple(document_map[rt_p], event_type, callback) )
      {
        id = getNewHandlerId();
        node_map[id] = document_map[rt_p];
        type_map[id] = event_type;
        callback_map[id] = callback;
        runtime_id_map[id] = rt_p;
        services['ecmascript-debugger'].requestAddEventHandler(0, 
          [id, document_map[ rt_p ], "", event_type, prevent_default && 1 || 0, stop_propagation && 1 || 0]);
      }
      else if(__get_document_id[rt_p])
      {
        __get_document_id[rt_p].push([rt_p, event_type, callback, prevent_default, stop_propagation]);
      }
      else
      {
        __get_document_id[rt_p] = [[rt_p, event_type, callback, prevent_default, stop_propagation]];
        var tag = tagManager.setCB(null, handleAddEventWithDocument, [rt_p]);
        services['ecmascript-debugger'].requestEval(tag, [rt_p, 0, 0, "return window.document"]);
      }
    }
  }

  

  var cleanUpEventListener =  function()
  {
    var ev = null, i =  0, j = 0, k = 0, ids = null, id = '', cur = '', rt_id = '';
    for( ; ev = activeEvents[i]; i++)
    {
      ids = getHandlerId(ev.type, ev.cb);
      for( j = 0; id = ids[j]; j++ )
      {
        rt_id = runtime_id_map[id];
        for( k = 0; ( cur = __activeTab[k] ) && rt_id != cur; k++ );
        if( !cur )
        {
          clearEventListener(id);
        }
      }
    }
  }

  var clearEventListener = function(id)
  {
    services['ecmascript-debugger'].requestRemoveEventHandler(0, [parseInt(id)]);
    delete node_map[id];
    delete type_map[id];
    delete callback_map[id];
    delete runtime_id_map[id];
    delete id_map[id];
  }

  this.bind = function()
  {
    var ecma_debugger = window.services['ecmascript-debugger'];

    ecma_debugger.handleAddEventHandler =
    ecma_debugger.handleRemoveEventHandler =
    function(status, message){};
     

    ecma_debugger.onHandleEvent = function(status, message)
    {
      self.handleEventHandler(status, message);
    }
  }

  /**
  * @constructor 
  */

  this.activeTab = new function()
  {
    var self = this;

    this.addEventListener = function(event_type, callback, prevent_default, stop_propagation)
    {
      if(prevent_default !== false)
      {
        prevent_default = true;
      }
      if(stop_propagation !== false)
      {
        stop_propagation = true;
      }
      activeEvents[activeEvents.length] = 
      {
        type: event_type, 
        cb: callback,
        prevent_default: prevent_default, 
        stop_propagation: stop_propagation
      };
      __addEvenetListener(event_type, callback, prevent_default, stop_propagation);
    }

    this.removeEventListener =  function(event_type, callback)
    {
      var ids = getHandlerId(event_type, callback), id = '', i = 0, ev = null;
      for( ; id = ids[i]; i++ )
      {
        clearEventListener(id);
      }
      for( i = 0; i < activeEvents.length; i++)
      {
        ev = activeEvents[i];
        if( ev && ev.type == event_type && ev.cb == callback )
        {
          activeEvents.splice(i, 1);
          i--;
        }
      }
    }
  }

}

