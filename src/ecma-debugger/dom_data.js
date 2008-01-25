var dom_data = new function()
{
  var self = this;

  var view_ids = ['dom-markup-style', 'dom-tree-style'];  // this needs to be handled in a more general and sytematic way.

  var initializedRuntimes = {};

  var data = []; // TODO seperated for all runtimes off the active tab
  var data_runtime_id = '';  // data off a dom tree has always just one runtime
  var current_target = '';

  const 
  ID = 0, 
  TYPE = 1, 
  NAME = 2, 
  NAMESPACE = 3, 
  VALUE = 4, 
  DEPTH = 5, 
  ATTRS = 6, 
  CHILDREN_LENGTH = 7, 
  IS_TARGET = 8, 
  IS_LAST = 9;

  var initRuntime_hostside = function(runtime_id)
  {
    return [
      runtime_id,
      window.document,
      function(ele)  
      {
        var data = [];
        var data_pointer = 0;
        var target = ele;
        var original_target = target;
        var children = target.childNodes, child = null, i=0;
        var chain = [];
        var p = target.parentNode;
        const 
        ID = 0, 
        TYPE = 1, 
        NAME = 2, 
        NAMESPACE = 3, 
        VALUE = 4, 
        DEPTH = 5, 
        ATTRS = 6, 
        CHILDREN_LENGTH = 7, 
        IS_TARGET = 8, 
        IS_LAST = 9;
        var readNode = function(node, pointer, level, is_last)
        {
          var children = node.childNodes, 
          children_length = children.length,  
          child = null, 
          i = 0,
          attrs = node.attributes, 
          attr = null, 
          j = 0, 
          s_attr = '';
          data[ data_pointer + ID ] = node;
          data[ data_pointer + TYPE ] = node.nodeType;
          data[ data_pointer + NAME ] = node.nodeName;
          data[ data_pointer + NAMESPACE ] = node.namespaceURI || 'null';
          data[ data_pointer + VALUE ] = ( node.nodeValue || '' ).replace(/\u003C/g, '&lt;');
          data[ data_pointer + DEPTH ] = level;
          if( attrs )
          {
            for( ; attr = attrs[j]; j++)
            {
              s_attr += ( s_attr ? ',' : '' ) + 
                '"' + attr.name + '":' +
                '"' + attr.value.replace(/"/g, '\\"') + '"';
            };
          };
          data[ data_pointer + ATTRS ] = s_attr;
          data[ data_pointer + CHILDREN_LENGTH ] = children_length;
          data[ data_pointer + IS_TARGET ] = node == original_target ? 1 : 0;
          data[ data_pointer + IS_LAST ] = is_last ? 1 : 0;
          data_pointer += 10;
          if( !level )
          {
            readDoctype();
          };
          if( node == chain[pointer] )
          { 
            for( i=0; child = children[i]; i++ )
            {
              readNode(child, pointer+1, level+1, i == children_length - 1);
            };
          }
          if( children_length == 1 && node.firstChild.nodeType == 3 )
          {
            readNode(node.firstChild, pointer+1, level+1, true);
          }
        };
        do
        {
          chain.unshift(p);
        }
        while( p = p.parentNode );
        var readDoctype = function()
        {
          if( document.firstChild && document.doctype && document.firstChild.nodeType != 10 )
          {

            data[ data_pointer + ID ] = document.doctype;
            data[ data_pointer + TYPE ] = document.doctype.nodeType;
            data[ data_pointer + NAME ] = document.doctype.nodeName;
            data[ data_pointer + NAMESPACE ] = '';
            data[ data_pointer + VALUE ] = '';
            data[ data_pointer + DEPTH ] = 1;
            data[ data_pointer + ATTRS ] = '"publicId":"' + document.doctype.publicId +
              '","systemId":"'+document.doctype.systemId +'"';
            data[ data_pointer + CHILDREN_LENGTH ] = 0;
            data[ data_pointer + IS_TARGET ] = 0;
            data[ data_pointer + IS_LAST ] = 0;
            data_pointer += 10;
          }
        }
        readNode(chain[0], 0, 0, true);
        return data;
      },
      function(node) 
      {
        var data = [];
        var data_pointer = 0;
        const 
        ID = 0, 
        TYPE = 1, 
        NAME = 2, 
        NAMESPACE = 3, 
        VALUE = 4, 
        DEPTH = 5, 
        ATTRS = 6, 
        CHILDREN_LENGTH = 7, 
        IS_TARGET = 8, 
        IS_LAST = 9;
        var readNode = function(node, level, is_last)
        {
          var children = node.childNodes, children_length = children.length;
          var attrs = node.attributes, attr = null, j = 0, s_attr = '';
          data[ data_pointer + ID ] = node;
          data[ data_pointer + TYPE ] = node.nodeType;
          data[ data_pointer + NAME ] = node.nodeName;
          data[ data_pointer + NAMESPACE ] = node.namespaceURI || 'null';
          data[ data_pointer + VALUE ] = ( node.nodeValue || '' ).replace(/\u003C/g, '&lt;');
          data[ data_pointer + DEPTH ] = level;
          if( attrs )
          {
            for( ; attr = attrs[j]; j++)
            {
              s_attr += ( s_attr ? ',' : '' ) + 
                '"' + attr.name + '":' +
                '"' + attr.value.replace(/"/g, '\\"') + '"';
            };
          };
          data[ data_pointer + ATTRS ] = s_attr;
          data[ data_pointer + CHILDREN_LENGTH ] = children_length;
          data[ data_pointer + IS_TARGET ] = 0;
          data[ data_pointer + IS_LAST ] = is_last ? 1 : 0;
          data_pointer += 10;
          if( children_length == 1 && node.firstChild.nodeType == 3 )
          {
            readNode(node.firstChild, level+1, true);
          }
        };
        var children = node.childNodes, children_length = children.length,  child = null, i = 0;
        for( ; child = children[i]; i++ ) 
        {
           readNode(child, 1, i == children_length - 1);
        };
        return data;
      }
    ];
  }

  var initRuntime_hostside_to_string = initRuntime_hostside.toString().replace(/&/g, '&amp;');

  // returned value is a an object-id, 
  var handleInitRuntimeCall = function(xml, runtime_id)
  {
    if(xml.getNodeData('status') == 'completed' )
    {
     var tag = tagManager.setCB(null, initRuntime, [runtime_id]);
     services['ecmascript-debugger'].examineObjects(tag, runtime_id, xml.getNodeData('object-id'))
    }
    else
    {
      opera.postError('initialization from runtime in dom_data has failed');
    }
  }

  var initRuntime = function(xml, runtime_id )
  {
    var items = xml.getElementsByTagName('object-id');
    if( items.length == 5 )
    {
      //items[0] is the id of the returned array
      initializedRuntimes[items[1].textContent] =
      {
        document_id: items[2].textContent,
        getTreeWithTarget: items[3].textContent,
        getChildren: items[4].textContent
      }
      var view_id = '', i = 0;
      for( ; view_id = view_ids[i]; i++)
      {
        if(views[view_id].isvisible())
        {
          onShowView({id: view_id})
        }
      }
    }
  }

  var onActiveTab = function(msg)
  {
    // TODO clean up old tab
    data = []; // this must be split for all runtimes in the active tab
    var tab = msg.activeTab, rt_id = '', i = 0, tag = 0;
    for( ; rt_id = tab[i]; i++)
    {
      tag = tagManager.setCB(null, handleInitRuntimeCall, [ rt_id ]);
      services['ecmascript-debugger'].eval
      (
        tag, 
        rt_id, '', '', 
        '(' + initRuntime_hostside_to_string +')(' + '$' + rt_id + ')', ['$' + rt_id, rt_id]
       );
    }
  }

  var clickHandlerHost = function(event)
  {
    if(window.__times_dom)
    {
      window.__times_dom = [new Date().getTime()] 
    }
    var rt_id = event['runtime-id'], obj_id = event['object-id'];
    messages.post("element-selected", {obj_id: obj_id, rt_id: data_runtime_id});
    current_target = obj_id;
    var init_rt_id = initializedRuntimes[rt_id];
    if( init_rt_id  )
    {
      data = [];
      tag = tagManager.setCB(null, handleGetTree, [ rt_id ]);
      services['ecmascript-debugger'].eval
      (
        tag, 
        rt_id, '', '', 
        '$' + init_rt_id.getTreeWithTarget + '($' + obj_id  + ')',  ['$' + init_rt_id.getTreeWithTarget, init_rt_id.getTreeWithTarget, '$' + obj_id, obj_id]
       );
     
    }

  }

  var handleGetTree = function(xml, runtime_id)
  {
    if(window.__times_dom)
    {
      window.__times_dom[window.__times_dom.length] = new Date().getTime();
    }
    if(xml.getNodeData('status') == 'completed' )
    {
     var tag = tagManager.setCB(null, getTree, [runtime_id]);
     services['ecmascript-debugger'].examineObjects(tag, runtime_id, xml.getNodeData('object-id'))
    }
    else
    {
      opera.postError('handleGetTree in dom_data has failed');
    }
    
  }

  var parseXMLToNodeArray = function(xml)
  {
    var objects = xml.getElementsByTagName('object-id'), object = null;
    var strings = xml.getElementsByTagName('string');
    var i = 0, j = 1, k = 0;
    var data = [];
    for( ; object = objects[j]; j++)
    {
      data[i + ID] = object.textContent; 
      data[i + TYPE] = parseInt(strings[k + TYPE].textContent);
      data[i + NAME] = strings[k + NAME].textContent;
      data[i + NAMESPACE] = strings[k + NAMESPACE].textContent;
      data[i + VALUE] = strings[k + VALUE].textContent;
      data[i + DEPTH] = parseInt(strings[k + DEPTH].textContent);
      data[i + ATTRS] = eval( "({" + strings[k + ATTRS].textContent + "})" );
      data[i + CHILDREN_LENGTH] = parseInt(strings[k + CHILDREN_LENGTH].textContent);
      data[i + IS_TARGET] = parseInt(strings[k + IS_TARGET].textContent);
      data[i + IS_LAST] = parseInt(strings[k + IS_TARGET].textContent);
      k += 9;
      i += 10;
    }
    return data;
  }

  var getTree = function(xml, runtime_id)
  {
    if(window.__times_dom)
    {
      window.__times_dom[window.__times_dom.length] = new Date().getTime();
      window.__times_dom.response_length = xml.response_length;
    }
    data = parseXMLToNodeArray(xml);
    if(window.__times_dom)
    {
      window.__times_dom[window.__times_dom.length] = new Date().getTime();
    }
    data_runtime_id = runtime_id;
    var view_id = '', i = 0;
    for( ; view_id = view_ids[i]; i++)
    {
      views[view_id].update();
      views[view_id].scrollTargetIntoView();
    }
    if(window.__times_dom)
    {
      window.__times_dom[window.__times_dom.length] = new Date().getTime();
      debug.checkProfiling();
    }
  }



  var onSettingChange = function(msg)
  {
    var msg_id = msg.id, id = '', i = 0;
    for( ; ( id = view_ids[i] ) && id != msg_id; i++);
    if( id )
    {
      switch (msg.key)
      {
        case 'highlight-on-hover':
        {
          if(settings[id].get(msg.key))
          {
            host_tabs.activeTab.addEventListener('mouseover', spotlight);
          }
          else
          {
            services['ecmascript-debugger'].clearSpotlight(data_runtime_id);
            host_tabs.activeTab.removeEventListener('mouseover', spotlight);
          }
          break;
        }

        case 'find-with-click':
        {
          if(settings[id].get(msg.key))
          {
            host_tabs.activeTab.addEventListener('click', clickHandlerHost);
          }
          else
          {
            host_tabs.activeTab.removeEventListener('click', clickHandlerHost);
          }
          break;
        }

      }
    }
  }

  var onShowView = function(msg)
  {
    var msg_id = msg.id, id = '', i = 0;
    for( ; ( id = view_ids[i] ) && id != msg_id; i++);
    if( id )
    {
      if( !data.length )
      {
        if(settings[id].get('find-with-click'))
        {
          host_tabs.activeTab.addEventListener('click', clickHandlerHost);
        }
        if(settings[id].get('highlight-on-hover'))
        {
          host_tabs.activeTab.addEventListener('mouseover', spotlight);
        }
        var tab = host_tabs.getActiveTab(), rt_id = '', i = 0, tag = 0;
        var init_rt_id = null;
        for( ; rt_id = tab[i]; i++)
        {
          if( init_rt_id = initializedRuntimes[rt_id] )
          {
            tag = tagManager.setCB(null, handleGetTree, [ rt_id ]);
            services['ecmascript-debugger'].eval
            (
              tag, 
              rt_id, '', '', 
              '$' + init_rt_id.getTreeWithTarget + '($' + init_rt_id.document_id  + '.body)',  ['$' + init_rt_id.getTreeWithTarget, init_rt_id.getTreeWithTarget, '$' + init_rt_id.document_id, init_rt_id.document_id]
             );
           
          }
          else
          {
            opera.postError('missing initialized runtime in onShowView in dom_data');
          }
        }
      }
    }
  }

  var onHideView = function(msg)
  {
    
  }

  this.getData = function()
  {
    return data.slice(0);
  }

  this.getDataRuntimeId = function()
  {
    return data_runtime_id;
  }



  var handleGetChildren = function(xml, runtime_id, object_id)
  {
    //alert(8);
    if(xml.getNodeData('status') == 'completed' )
    {
     var tag = tagManager.setCB(null, getChildren, [data_runtime_id, object_id]);
     services['ecmascript-debugger'].examineObjects(tag, runtime_id, xml.getNodeData('object-id'))
    }
    else
    {
      opera.postError('handleGetTree in dom_data has failed');
    }
    
  }

  var getChildren = function(xml, runtime_id, object_id)
  {
    //opera.postError(new XMLSerializer().serializeToString(xml));
    var new_data = parseXMLToNodeArray(xml);
    //opera.postError(new_data);
    
    /* */
    var i = 0, j = 0, k = 0, view_id = '';
    //var ref = self.update_ref;
    //var new_data = [];
    //if( ref )
    //{
      for( ; data[i] && data[i] != object_id; i += 10);
      if( data[i] )
      {
        for( ; j < new_data.length; j += 10)
        {
          new_data[j+5] += data[i+5];
          //arr[j+6] = eval( "({" + arr[j+6] + "})" );
        }
        data = data.slice(0, i+10).concat(new_data, data.slice(i+10));
        for( ; view_id = view_ids[k]; k++)
        {
          views[view_id].update();
        }
      }
      else
      {
        opera.postError('missing refrence');
      }
      //ref = '';
      
    //}
    /* */
  }

  this.getChildernFromNode = function(object_id)
  {
    var init_rt_id = initializedRuntimes[data_runtime_id];
    if( init_rt_id  )
    {
      tag = tagManager.setCB(null, handleGetChildren, [data_runtime_id, object_id]);
      services['ecmascript-debugger'].eval
      (
        tag, 
        data_runtime_id, '', '', 
        '$' + init_rt_id.getChildren + '($' + object_id  + ')',  ['$' + init_rt_id.getChildren, init_rt_id.getChildren, '$' + object_id, object_id]
      );
    }
  }

  this.closeNode = function(object_id)
  {
    var i = 0, j = 0, level = 0, k = 0, view_id = '';
    for( ; data[i] && data[i] != object_id; i += 10);
    if( data[i] )
    {
      level = data[ i + DEPTH ];
      i += 10;
      j = i;
      while( data[j] && data[j + DEPTH ] > level ) j+=10;
      data.splice(i, j - i);
      for( ; view_id = view_ids[k]; k++)
      {
        views[view_id].update();
      }
    }
    else
    {
      opera.postError('missing refrence');
    }
  }

  var spotlight = function(event)
  {
    services['ecmascript-debugger'].spotlight(event['runtime-id'], event['object-id']);
  }

  this.highlight_on_hover = function(event)
  {
    if(event.target.checked)
    {
      host_tabs.activeTab.addEventListener('mouseover', spotlight);
    }
    else
    {
      services['ecmascript-debugger'].clearSpotlight(data_runtime_id);
      host_tabs.activeTab.removeEventListener('mouseover', spotlight);
    }
  }

  this.setCurrentTarget = function(obj_id)
  {
    // data_runtime_id will fail with more then one runtime per runtime container
    messages.post("element-selected", {obj_id: obj_id, rt_id: data_runtime_id});
    current_target = obj_id;
  }

  this.getCurrentTarget = function(obj_id)
  {
    return current_target;
  }

  this.getCSSPath = function()
  {
    var i = 0, j = -1, path = '';
    if(current_target)
    {
      for( ; data[i] && data[i] != current_target; i += 10);
      if( data[i] )
      {
        path = data[i + NAME] + path;
        j = i;
        i -= 10;
        for(  ; data[i]; i -= 10)
        {
          if(data[i + TYPE] == 1)
          {
            if(data[i + DEPTH] <= data[j + DEPTH])
            {
              path =  data[i + NAME] + ( data[i + DEPTH] < data[j + DEPTH] ? ' > ' : ' + ' ) + path;
              j = i;
            }
          } 
        }
      }
      else
      {
        opera.postError('missing refrence in getCSSPath in dom_data');
      }
      return path;
    }
  }

  var postElementSeleceted = function(obj_id, rt_id)
  {
    messages.post("element-selected", {obj_id: obj_id, rt_id: rt_id});
  }

  this.set_click_handler = function(event)
  {
    if(event.target.checked)
    {
      host_tabs.activeTab.addEventListener('click', clickHandlerHost);
    }
    else
    {
      host_tabs.activeTab.removeEventListener('click', clickHandlerHost);
    }
  }
  
  messages.addListener('active-tab', onActiveTab);
  messages.addListener('show-view', onShowView);
  messages.addListener('hide-view', onHideView);
  messages.addListener('setting-changed', onSettingChange);

}