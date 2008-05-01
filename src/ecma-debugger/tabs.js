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
          services['ecmascript-debugger'].removeEventHandler(h_id);
          delete node_map[h_id];
          delete type_map[h_id];
          delete callback_map[h_id];
          delete runtime_id_map[h_id];
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

  this.activeTab = new function()
  {
    var self = this;

    this.addEventListener = function(event_type, callback)
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

    this.removeEventListener =  function(event_type, callback)
    {
      var ids = getHandlerId(event_type, callback), id = '', i = 0;
      for( ; id = ids[i]; i++ )
      {
        services['ecmascript-debugger'].removeEventHandler(id);
        delete node_map[id];
        delete type_map[id];
        delete callback_map[id];
        delete runtime_id_map[id];
      }
    }
  }

}

