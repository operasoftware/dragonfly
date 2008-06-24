var host_tabs = new function()
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



  var getNewHandlerId = function()
  {
    var id = handler_id.toString();
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
      __addEvenetListener(ev.type, ev.cb);
    }
    cleanUpEventListener();
  }

  this.getActiveTab = function(top_frame_runtime_id)
  {
    return __activeTab;
    
  }


  this.handleEventHandler = function(xml)
  {

    if( window.__times_spotlight__ ) 
    {
      window.__times_spotlight__[0] =  new Date().getTime();
    }
    var event = {};

    var children = xml.documentElement.childNodes, child=null, i=0;
    for ( ; child = children[i]; i++)
    {
      event[child.nodeName] = child.firstChild.nodeValue;
    }
    event['runtime-id'] = runtime_id_map[event['handler-id']];
    if( event['handler-id'] in callback_map )
    {
      callback_map[ event['handler-id'] ](event);
    }
  }

  var handleAddEventWithDocument = function(xml, runtime_id, event_type, callback)
  {
    if( xml.getNodeData('status') == 'completed' )
    {
      var node_id = xml.getNodeData('object-id');
      document_map[runtime_id] = node_id;
      var id = getNewHandlerId();
      node_map[id] = node_id;
      type_map[id] = event_type;
      callback_map[id] = callback;
      runtime_id_map[id] = runtime_id;
      services['ecmascript-debugger'].addEventHandler(id, node_id, event_type);     
    }
    else
    {
      opera.postError( 'Error in host_tabs handleAddEventWithDocument');
    }
     
  }

  var __addEvenetListener = function(event_type, callback)
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
        services['ecmascript-debugger'].addEventHandler(id, document_map[ rt_p ], event_type);
      }
      else
      {
        var tag = tagManager.setCB(null, handleAddEventWithDocument, [rt_p, event_type, callback]);
        services['ecmascript-debugger'].getDocumentFromRuntime(tag, rt_p);
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
    services['ecmascript-debugger'].removeEventHandler(id);
    delete node_map[id];
    delete type_map[id];
    delete callback_map[id];
    delete runtime_id_map[id];
    delete id_map[id];
  }

  this.activeTab = new function()
  {
    var self = this;

    this.addEventListener = function(event_type, callback)
    {
      activeEvents[activeEvents.length] = {type: event_type, cb: callback};
      __addEvenetListener(event_type, callback);
    }

    this.removeEventListener =  function(event_type, callback)
    {
      var ids = getHandlerId(event_type, callback), id = '', i = 0, ev = null;
      for( ; id = ids[i]; i++ )
      {
        clearEventListener(id);
      }
      for( i = 0; ( ev = activeEvents[i] ) && !( ev.type == event_type && ev.cb == callback ); i++);
      if( ev )
      {
        activeEvents.splice(i, 1);
      }
    }
  }

}

