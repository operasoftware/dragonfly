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

  var reset_spotlight_timeouts = new Timeouts();

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

  var _is_element_selected_checked = false;

  var get_selected_element = function(rt_id)
  {
    var tag = tagManager.set_callback(self, self.on_element_selected, [rt_id, true]);
    window.services['ecmascript-debugger'].requestGetSelectedObject(tag);
  }

  this.on_element_selected = function(status, message, rt_id, show_initial_view)
  {
    const
    OBJECT_ID = 0,
    WINDOW_ID = 1,
    RUNTIME_ID = 2;

    _is_element_selected_checked = true;

    if(message[OBJECT_ID])
    {
      if(!window.views.dom.isvisible())
      {
        window.topCell.showView('dom');
      }
      // TODO this will fail on inspecting a popup which is part of the debug context
      if(message[WINDOW_ID] == window.window_manager_data.get_debug_context())
      {
        clickHandlerHost({runtime_id: message[RUNTIME_ID], object_id: message[OBJECT_ID]});
      }
      else
      {
        _is_element_selected_checked = false;
        window.window_manager_data.set_debug_context(message[WINDOW_ID]);
      }
    }
    else if (show_initial_view)
    {
      getInitialView(rt_id);
    }
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
    var rt_id = event.runtime_id, obj_id = event.object_id;
    current_target = obj_id;
    data = [];
    mime = '';
    var tag = tagManager.set_callback(null, handleGetDOM, [ rt_id, obj_id]);
    services['ecmascript-debugger'].requestInspectDom(tag, 
      [obj_id, 'parent-node-chain-with-children']);
  }


  var domNodeRemovedHandler = function(event)
  {
    // if the node is in the current data handle it otherwise not.
    var rt_id = event.runtime_id, obj_id = event.object_id;
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

  var handleGetDOM = function(status, message, rt_id, obj_id)
  {
    const NODE_LIST = 0;
    var view_id = '', i = 0;

    data = message[NODE_LIST];
    mime = set_mime();
    
    // handle text nodes as target in get selected element
    for( i = 0; data[i] && data[i][ID] != obj_id; i++);
    while(data[i] && data[i][TYPE] != 1) 
    {
      i--;
    }
    if(data[i] && data[i][ID] != obj_id)
    {
      current_target = obj_id = data[i][ID];
    }

    if( rt_id != data_runtime_id || __next_rt_id )
    {
      data_runtime_id = rt_id;
      messages.post("runtime-selected", {id: data_runtime_id});
      window['cst-selects']['document-select'].updateElement();
      __next_rt_id = '';
    }
    
    for( i = 0; view_id = view_ids[i]; i++)
    {
      views[view_id].update();
      views[view_id].scrollTargetIntoView();
    }
    if(obj_id)
    {
      messages.post("element-selected", {obj_id: obj_id, rt_id: rt_id});
    }
        
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
              host_tabs.activeTab.addEventListener('mouseout', set_reset_spotlight);
            }
            else
            {
              hostspotlighter.clearSpotlight();
              host_tabs.activeTab.removeEventListener('mouseover', spotlight);
              host_tabs.activeTab.removeEventListener('mouseout', set_reset_spotlight);
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
    for( ; (id = view_ids[i]) && id != msg_id; i++);
    if (id)
    {
      if(activeWindow.length)
      {
        // in the case there is no runtime selected 
        // set the top window to the active runtime
        if (!data_runtime_id)
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
          host_tabs.activeTab.addEventListener('mouseout', set_reset_spotlight);
        } 
        if(settings[settings_id].get('update-on-dom-node-inserted'))
        {
          host_tabs.activeTab.addEventListener('DOMNodeRemoved', domNodeRemovedHandler);
        }
        if(!data.length)
        {
          if(_is_element_selected_checked)
          {
            getInitialView(data_runtime_id);
          }
          else
          {
            get_selected_element(data_runtime_id);
          }
        }
      }
      else
      {
        views[id].update();
      }
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
      host_tabs.activeTab.removeEventListener('mouseout', set_reset_spotlight);
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
    var tag = tagManager.set_callback(null, handleInitialView, [rt_id]);
    var script_data = "return ( document.body || document.documentElement )";
    services['ecmascript-debugger'].requestEval(tag, [rt_id, 0, 0, script_data]);
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

  var handleInitialView = function(status, message, rt_id)
  {
    
    const
    STATUS = 0,
    OBJECT_VALUE = 3,
    // sub message ObjectValue 
    OBJECT_ID = 0;
    
    if(message[STATUS] == 'completed' )
    {
      clickHandlerHost({runtime_id: rt_id, object_id: message[OBJECT_VALUE][OBJECT_ID] })
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        'handleInitialView failed in dom_data\n');
    }
  }

  var handleGetChildren = function(status, message, runtime_id, object_id)
  {
    const NODE_LIST = 0;
    var _data = message[NODE_LIST], i = 0, view_id = '';
    for( ; data[i] && data[i][ID] != object_id; i += 1 );
    if( data[i] )
    {
      // the traversal was subtree
      if(object_id == _data[0][ID]) 
      {
        Array.prototype.splice.apply( data, [i, 1].concat(_data) );
      }
      else
      {
        Array.prototype.splice.apply( data, [i + 1, 0].concat(_data) );
      }
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


  this.getChildernFromNode = function(object_id, traversal)
  {
    var tag = tagManager.set_callback(null, handleGetChildren, [data_runtime_id, object_id]);
    services['ecmascript-debugger'].requestInspectDom(tag, [object_id, traversal]);
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
    var tag = tagManager.set_callback(null, handleSnapshot, [data_runtime_id]);
    var script_data = 'return document.document';
    services['ecmascript-debugger'].requestEval(tag, [data_runtime_id, 0, 0, script_data]);
  }

  var handleSnapshot = function(status, message, runtime_id)
  {
    const
    STATUS = 0,
    OBJECT_VALUE = 3,
    // sub message ObjectValue 
    OBJECT_ID = 0;

    if(message[STATUS] == 'completed' )
    {
      var tag = tagManager.set_callback(null, handleGetDOM, [runtime_id]);
      services['ecmascript-debugger'].requestInspectDom(tag,
          [message[OBJECT_VALUE][OBJECT_ID], 'subtree']);
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        'handleSnapshot in dom_data has failed');
    }
  }

  var spotlight = function(event)
  {
    reset_spotlight_timeouts.clear();
    hostspotlighter.spotlight(event.object_id);
  }

  var reset_spotlight = function()
  {
    if(current_target)
    {
      hostspotlighter.spotlight(current_target);
    }
  }

  var set_reset_spotlight = function(event)
  {
    reset_spotlight_timeouts.set(reset_spotlight, 70);
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
  /* */
  messages.addListener('active-tab', onActiveTab);
  messages.addListener('show-view', onShowView);
  messages.addListener('hide-view', onHideView);
  messages.addListener('setting-changed', onSettingChange);
  messages.addListener('runtime-stopped', onRuntimeStopped);
  messages.addListener('runtime-destroyed', onRuntimeStopped);

  messages.addListener('reset-state', onResetState);
  /* */

};

