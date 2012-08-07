window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * @constructor
  */

cls.EcmascriptDebugger["6.0"].HostTabs = function()
{
  var self = this;
  var __window_id = '';
  /* an array with all runtime ids off the active tab */
  var __activeTab = [];
  var document_map = {};

  var _top_runtime_id = '';

  var type_map = {};
  var callback_map = {};
  var node_map = {};
  var runtime_id_map = {};
  var id_map = {};
  var handler_id = 1;
  var activeEvents = [];

  var __get_document_id = {};

  var _on_profile_disabled = function(msg)
  {
    if (msg.profile == window.app.profiles.DEFAULT)
    {
      __activeTab = [];
      __window_id = 0;
      document_map = {};
      cleanUpEventListener();
    }
  };

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
    if(!__window_id || __window_id != window_id)
    {
      // if window id is 0 the connection is closed
      if(window_id)
      {
        activeTabOnChange();
      }
      __window_id = window_id;
      runtimes.setActiveWindowId(window_id);
      __activeTab = runtimes.getRuntimeIdsFromWindow(window_id);
      this.post_messages();
    }

  }

  this._has_changed = function(arr_1, arr_2)
  {
    for(var i = 0; i < arr_1.length && arr_1[i] == arr_2[i]; i++);
    return !(i == arr_1.length && i == arr_2.length);
  }

  this.updateActiveTab = function()
  {
    var rt_ids = runtimes.getRuntimeIdsFromWindow(__window_id);
    if(this._has_changed(rt_ids, __activeTab))
    {
      __activeTab = rt_ids;
      for (var ev = null, i = 0; ev = activeEvents[i]; i++)
      {
        __addEvenetListener(ev.type, ev.cb, ev.prevent_default, ev.stop_propagation);
      }
      cleanUpEventListener();
      this.post_messages();
    }
  }

  this.post_messages = function()
  {
    messages.post('active-tab', {
      activeTab: __activeTab,
      runtimes_with_dom: __activeTab.filter(function(rt) {
        return window.runtimes.runtime_has_dom(rt);
      })
    });
    // first runtime is the top runtime of the selected window
    if(__activeTab.length && __activeTab[0] != _top_runtime_id)
    {
      _top_runtime_id = __activeTab[0];
      messages.post('new-top-runtime', {top_runtime_id:  _top_runtime_id});
    }
  }

  this.getActiveTab = function(top_frame_runtime_id)
  {
    return __activeTab.slice();
  };

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
          object_id: message[OBJECT_ID],
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
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
        'Error in host_tabs handleAddEventWithDocument');
    }

  }

  var __addEvenetListener = function(event_type, callback, prevent_default, stop_propagation)
  {
    var esde = window.services['ecmascript-debugger'];
    var rt_p = '', i = 0, id = '';
    for( ; rt_p = __activeTab[i]; i++ )
    {
      if (!window.runtimes.runtime_has_dom(rt_p))
      {
        continue;
      }
      if( document_map[rt_p] && !checkTriple(document_map[rt_p], event_type, callback) )
      {
        id = getNewHandlerId();
        node_map[id] = document_map[rt_p];
        type_map[id] = event_type;
        callback_map[id] = callback;
        runtime_id_map[id] = rt_p;
        var msg = [id, document_map[ rt_p ], "", event_type,
                   prevent_default && 1 || 0, stop_propagation && 1 || 0];
        esde.requestAddEventHandler(cls.TagManager.IGNORE_RESPONSE, msg);
      }
      else if(__get_document_id[rt_p])
      {
        __get_document_id[rt_p].push([rt_p, event_type, callback, prevent_default, stop_propagation]);
      }
      else
      {
        __get_document_id[rt_p] = [[rt_p, event_type, callback, prevent_default, stop_propagation]];
        var tag = tagManager.set_callback(null, handleAddEventWithDocument, [rt_p]);
        esde.requestEval(tag, [rt_p, 0, 0, "return window.document"]);
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

  this.bind = function(ecma_debugger)
  {
    ecma_debugger.handleAddEventHandler =
    ecma_debugger.handleRemoveEventHandler =
    function(status, message){};


    ecma_debugger.onHandleEvent = function(status, message)
    {
      self.handleEventHandler(status, message);
    }
  }

  window.messages.addListener('profile-disabled', _on_profile_disabled);

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

