/**
  * @constructor 
  */

var dom_data = new function()
{
  var self = this;

  var view_ids = ['dom'];  // this needs to be handled in a more general and sytematic way.
  var settings_id = 'dom';

  var data = []; // TODO seperated for all runtimes off the active tab
  var mime = '';
  var data_runtime_id = '';  // data of a dom tree has always just one runtime
  var current_target = '';
  var __next_rt_id = '';

  var activeWindow = [];

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

  var onResetState = function()
  {
    data = []; 
    mime = '';
    data_runtime_id = ''; 
    current_target = '';
    __next_rt_id = '';
    activeWindow = [];
  }

  var is_view_visible = function()
  {
    var id = '', i = 0;
    for( ; ( id = view_ids[i] ) && !views[id].isvisible(); i++);
    return i < view_ids.length;
  }




  var onActiveTab = function(msg)
  {
    // TODO clean up old tab
    data = []; 
    mime = '';
    var view_id = '', i = 0;
    // the top frame is per default the active tab
    data_runtime_id = __next_rt_id || msg.activeTab[0];
    messages.post("runtime-selected", {id: data_runtime_id});
    window['cst-selects']['document-select'].updateElement();
    activeWindow = msg.activeTab.slice(0);
    for( ; view_id = view_ids[i]; i++)
    {
      if(views[view_id].isvisible())
      {
        onShowView({id: view_id})
      }
    }
  }

  var clickHandlerHost = function(event)
  {
    var rt_id = event['runtime-id'], obj_id = event['object-id'];
    current_target = obj_id;
    data = [];
    mime = '';
    var tag = tagManager.setCB(null, handleGetDOM, [ rt_id, obj_id]);
    services['ecmascript-debugger'].inspectDOM( tag, obj_id, 'parent-node-chain-with-children', 'json' );
  }


  var domNodeRemovedHandler = function(event)
  {
    // if the node is in the current data handle it otherwise not.
    var rt_id = event['runtime-id'], obj_id = event['object-id'];
    var node = null, i = 0, j = 0, level = 0, k = 0, view_id = '';
    if( !( actions['dom'].editor && actions['dom'].editor.is_active ) && data_runtime_id == rt_id )
    {
      for( ; ( node = data[i] ) && obj_id != node[ID]; i++ );
      if( node  && node[TYPE] == 1 ) // don't update the dom if it's only a text node
      {
        level = node[ DEPTH ];
        j = i + 1 ;
        while( data[j] && data[j][ DEPTH ] > level ) j++;
        data.splice(i, j - i);
        for( ; view_id = view_ids[k]; k++)
        {
          views[view_id].update();
        }
      }
    }
  }

  var set_mime = function()
  {
    var 
    node = null, 
    i = 0;

    for( ; node = data[i]; i++)
    {
      if(node[TYPE] == 1 )
      {
        // TODO take in account doctype if present
        return /^[A-Z]*$/.test(node[NAME]) && "text/html" || "application/xml";
      }
    }
  }

  this.isTextHtml = function()
  {
    return data.length && mime == "text/html" || false;
  }

  var handleGetDOM = function(xml, rt_id, obj_id)
  {
    var json = xml.getNodeData('jsondata');
    if( json )
    {
      data = eval('(' + json +')');
      mime = set_mime();
      if( rt_id != data_runtime_id || __next_rt_id )
      {
        data_runtime_id = rt_id;
        messages.post("runtime-selected", {id: data_runtime_id});
        window['cst-selects']['document-select'].updateElement();
        __next_rt_id = '';
      }
      var view_id = '', i = 0;
      for( ; view_id = view_ids[i]; i++)
      {
        views[view_id].update();
        views[view_id].scrollTargetIntoView();
      }
      if(obj_id)
      {
        messages.post("element-selected", {obj_id: obj_id, rt_id: rt_id});
      }
    }
    /* with xml 
    data = getDataFromXML(xml);
    data_runtime_id = rt_id;
    var view_id = '', i = 0;
    for( ; view_id = view_ids[i]; i++)
    {
      views[view_id].update();
      views[view_id].scrollTargetIntoView();
    }
    */
    
  }

  var onSettingChange = function(msg)
  {
    if( msg.id == settings_id )
    {
      if( is_view_visible() )
      {
        switch (msg.key)
        {
          case 'highlight-on-hover':
          {
            if(settings[settings_id].get(msg.key))
            {
              host_tabs.activeTab.addEventListener('mouseover', spotlight);
            }
            else
            {
              hostspotlighter.clearSpotlight();
              host_tabs.activeTab.removeEventListener('mouseover', spotlight);
            }
            break;
          }

          case 'find-with-click':
          {
            if(settings[settings_id].get(msg.key))
            {
              host_tabs.activeTab.addEventListener('click', clickHandlerHost);
            }
            else
            {
              host_tabs.activeTab.removeEventListener('click', clickHandlerHost);
            }
            break;
          }

          case 'update-on-dom-node-inserted':
          {
            if(settings[settings_id].get(msg.key))
            {
              host_tabs.activeTab.addEventListener('DOMNodeRemoved', domNodeRemovedHandler);
            }
            else
            {
              host_tabs.activeTab.removeEventListener('DOMNodeRemoved', domNodeRemovedHandler);
            }
            break;
          }
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
      
      //if( !data.length )
     // {
        if(activeWindow.length)
        {
          // in the case there is no runtime selected 
          // set the top window to the active runtime
          if( !data_runtime_id )
          {
            data_runtime_id = activeWindow[0];
          }
          if(settings[settings_id].get('find-with-click'))
          {
            host_tabs.activeTab.addEventListener('click', clickHandlerHost);
          }
          if(settings[settings_id].get('highlight-on-hover'))
          {
            host_tabs.activeTab.addEventListener('mouseover', spotlight);
          } 
          if(settings[settings_id].get('update-on-dom-node-inserted'))
          {
            host_tabs.activeTab.addEventListener('DOMNodeRemoved', domNodeRemovedHandler);
          }
          if( !data.length )
          {
            getInitialView(data_runtime_id);
          }
        }
     // }
    }
  }

  var onHideView = function(msg)
  {
    var msg_id = msg.id, id = '', i = 0;
    for( ; ( id = view_ids[i] ) && id != msg_id; i++);
    if( id )
    {
      host_tabs.activeTab.removeEventListener('click', clickHandlerHost);
      host_tabs.activeTab.removeEventListener('mouseover', spotlight);
      host_tabs.activeTab.removeEventListener('DOMNodeRemoved', domNodeRemovedHandler);
      // switching between dom style and markup style data = [];
    }
  }

  var onRuntimeStopped = function(msg)
  {
    
    if( msg.id == data_runtime_id )
    {
      
      data = [];
      mime = "";
      data_runtime_id = '';
      var id = '', i = 0;
      for( ; id = view_ids[i] ; i++)
      {
        views[id].clearAllContainers();
      }
    }
  }

  var getInitialView = function(rt_id)
  {
    var tag = tagManager.setCB(null, handleInitialView, [rt_id]);
    var script_data = "return ( document.body || document.documentElement )";
    services['ecmascript-debugger'].eval(tag, rt_id, '', '', script_data);
  }

  this.getDOM = function(rt_id)
  {
    if( !(rt_id == data_runtime_id && data.length) && runtime_onload_handler.check(rt_id, arguments) )
    {
      getInitialView(rt_id);
    }
  }



  this.getData = function()
  {
    return data;
  }

  this.getDataRuntimeId = function()
  {
    
    return data_runtime_id;
  }

  this.setActiveRuntime = function(rt_id)
  {
    __next_rt_id = rt_id;
  }

  var handleInitialView = function(xml, rt_id)
  {
    if(xml.getNodeData('status') == 'completed' )
    {
      clickHandlerHost({'runtime-id': rt_id, 'object-id': xml.getNodeData('object-id') })
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        'handleInitialView failed in dom_data\n');
    }
  }


  /* with xml format
  var getDataFromXML = function(xml)
  {
    var ret = [],
      fields =
      [
        "object-id",
        "type",
        "name",
        "namespace-prefix",
        "value",
        "depth",
        "children-length",
        "public-id",
        "system-id",
        "attributes",
      ],
      field = null, 
      nodes = xml.getElementsByTagName('node'), 
      node = null, i = 0, attrs = null, attr = null, attr_cur = null, j = 0;
    for( ; node = nodes[i]; i++)
    {
      field = ret[ret.length] = [];
      field[ID] = node.getNodeData(fields[0]);
      field[TYPE] = parseInt(node.getNodeData(fields[1]));
      field[NAME] = node.getNodeData(fields[2]);
      field[NAMESPACE] = node.getNodeData(fields[3]);
      field[VALUE] = node.getNodeData(fields[4]);
      field[DEPTH] = parseInt(node.getNodeData(fields[5]));
      field[CHILDREN_LENGTH] = parseInt(node.getNodeData(fields[6]) || 0);
      attr_cur = field[ATTRS] = {};
      attrs = node.getElementsByTagName('attribute');
      for( j = 0; attr = attrs[j]; j++)
      {
        attr_cur[attr.getNodeData('name')] = attr.getNodeData('value');
      }
    }
    return ret;

  }
  */



  var handleGetChildren = function(xml, runtime_id, object_id)
  {
    var json = xml.getNodeData('jsondata');
    if( json )
    {
      var _data = eval('(' + json +')'), i = 0, view_id = '';
      alert(JSON.stringify(_data))
      for( ; data[i] && data[i][ID] != object_id; i += 1 );
      if( data[i] )
      {
        Array.prototype.splice.apply( data, [i + 1, 0].concat(_data) );
        for(i = 0 ; view_id = view_ids[i]; i++)
        {
          views[view_id].update();
        }
      }
      else
      {
        opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 'missing refrence');
      }
    }
  }


  this.getChildernFromNode = function(object_id)
  {
    var tag = tagManager.setCB(null, handleGetChildren, [data_runtime_id, object_id]);
    services['ecmascript-debugger'].inspectDOM(tag, object_id, 'children', 'json'  );
  }

  this.closeNode = function(object_id, do_not_update)
  {
    var i = 0, j = 0, level = 0, k = 0, view_id = '';
    for( ; data[i] && data[i][ID] != object_id; i++ );
    if( data[i] )
    {
      level = data[ i ][ DEPTH ];
      i += 1;
      j = i;
      while( data[j] && data[j][ DEPTH ] > level ) j++;
      data.splice(i, j - i);
      
      if(!do_not_update)
      {
        for( ; view_id = view_ids[k]; k++)
        {
          views[view_id].update();
        }
      }
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 'missing refrence');
    }
  }

  this.getSnapshot = function()
  {
    var tag = tagManager.setCB(null, handleSnapshot, [data_runtime_id]);
    var script_data = 'return document.document';
    services['ecmascript-debugger'].eval(tag, data_runtime_id, '', '', script_data);
  }

  var handleSnapshot = function(xml, runtime_id)
  {
    if(xml.getNodeData('status') == 'completed' )
    {
      var tag = tagManager.setCB(null, handleGetDOM, [runtime_id]);
      services['ecmascript-debugger'].inspectDOM( tag, xml.getNodeData('object-id'), 'subtree', 'json' );
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        'handleSnapshot in dom_data has failed');
    }
  }

  var spotlight = function(event)
  {
    hostspotlighter.spotlight(event['object-id']);
  }

  this.highlight_on_hover = function(event)
  {
    if(event.target.checked)
    {
      host_tabs.activeTab.addEventListener('mouseover', spotlight);
    }
    else
    {
      hostspotlighter.clearSpotlight();
      host_tabs.activeTab.removeEventListener('mouseover', spotlight);
    }
  }

  this.setCurrentTarget = function(obj_id)
  {
    messages.post("element-selected", {obj_id: obj_id, rt_id: data_runtime_id});
    current_target = obj_id;
  }

  this.getCurrentTarget = function(obj_id)
  {
    return current_target;
  }

  var get_element_name = function(data_entry, with_ids_and_classes)
  {
    var 
    name = data_entry[NAME],
    attrs = data_entry[ATTRS],
    attr = null,
    i = 0,
    id = '',
    class_name = '';

    if( settings.dom.get('force-lowercase') )
    {
      name = name.toLowerCase();
    }
    if(with_ids_and_classes)
    {
      for( ; attr = attrs[i]; i++)
      {
        if( attr[ATTR_KEY] == 'id' ) 
        {
          id = "#" + attr[ATTR_VALUE];
        }
        if( attr[ATTR_KEY] == 'class' ) 
        {
          class_name = "." + attr[ATTR_VALUE].replace(/ /g, "."); 
        }
      }
    }
    return name + id + class_name;
  }

  var parse_parent_offset = function(chain)
  {
    var 
    ret = false,
    cur = null;
    if( chain )
    {
      cur = chain.pop();
      if( cur )
      {
        ret = cur[1] == '1';
      }
      else
      {
        opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
          "failed in parse_parent_offset in dom_data");
      }
    }
    return ret;
  }

  this.getCSSPath = function(parent_offset_chain)
  {
    // parent_offset_chain array with 
    var 
    i = 0, 
    j = -1,
    path = '',
    show_siblings = settings.dom.get('show-siblings-in-breadcrumb'),
    show_id_and_classes = settings.dom.get('show-id_and_classes-in-breadcrumb'); 

    // TODO make new settings

    if( current_target )
    {
      for( ; data[i] && data[i][ID] != current_target; i ++);
      if( data[i] )
      {
        path = 
        [ 
          {
            name: get_element_name(data[i], show_id_and_classes), 
            id: data[i][ID],
            combinator: "", 
            is_parent_offset: parse_parent_offset(parent_offset_chain) 
          }
        ];
        j = i;
        i --;
        for(  ; data[i]; i --)
        {
          if(data[i][TYPE] == 1)
          {
            if(data[i][ DEPTH] <= data[j][DEPTH])
            {
              if ( data[i][DEPTH] < data[j][DEPTH] )
              {
                path.splice
                (
                  0, 
                  0, 
                  {
                    name: get_element_name(data[i], show_id_and_classes), 
                    id: data[i][ID], 
                    combinator: ">" ,
                    is_parent_offset: parse_parent_offset(parent_offset_chain) 
                  }
                );
              }
              
              else if ( show_siblings )
              {
                path.splice
                (
                  0, 
                  0, 
                  {
                    name: get_element_name(data[i], show_id_and_classes), 
                    id: data[i][ID], 
                    combinator: "+",
                    is_parent_offset: false
                  }
                );
              }
              j = i;
            }
          } 
        }
      }
      else
      {
        current_target = '';
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

  // to be update from a editor
  this.update = function(state)
  {
    if( state.rt_id == data_runtime_id )
    {
      var 
      entry = null, 
      i = 0,
      obj_id = state.obj_id,
      attrs = null,
      attr = null, 
      j = 0;
      
      for( ; data[i] && data[i][ID] != obj_id; i++ );
      if( data[i] )
      {
        switch(state.type)
        {
          case "key":
          case "value":
          {
            if( state.key )
            {
              attrs = data[i][ATTRS];
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
            data[i][VALUE] = state.text;
            break;
          }
        }
      }
    }
  }

  this.getParentElement = function(obj_id)
  {
    var 
    i = 0,
    depth = 0;
    
    for( ; data[i] && data[i][ID] != obj_id; i++ );
    if( data[i] )
    {
      depth = data[i][DEPTH];
      for( ; data[i] && !( ( data[i][TYPE] == 1 || data[i][TYPE] == 9 ) && data[i][DEPTH] < depth ); i-- );
      return data[i] && data[i][ID] || '';
    }
  }

  this.getRootElement = function()
  {
    for( var i = 0; data[i] && data[i][TYPE] != 1; i++);
    return data[i] && data[i][ID] || 0;
  }
  
  messages.addListener('active-tab', onActiveTab);
  messages.addListener('show-view', onShowView);
  messages.addListener('hide-view', onHideView);
  messages.addListener('setting-changed', onSettingChange);
  messages.addListener('runtime-stopped', onRuntimeStopped);
  messages.addListener('runtime-destroyed', onRuntimeStopped);

  messages.addListener('reset-state', onResetState);

};

