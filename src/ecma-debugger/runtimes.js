var runtimes = new function()
{
  var __runtimes = {};
  var __runtimes_arr = [];

  var __threads = [];

  var __log_threads = false;

  var __windowsFolding = {};

  var view_ids = ['threads'];
  
  var self = this;

  var registerRuntime = function(id)
  { 
    if( !(id in __runtimes) )
    {
      opera.postError('runtime id does not exist')
      __runtimes[id] = null;
      services['ecmascript-debugger'].getRuntime( tagManager.setCB(null, parseRuntime), id );
    }
  }

  var removeRuntime = function(id)
  { 
    var sc = null ;
    /*
    TODO check for existing breakpoints before cleaning up
    for( sc in __scripts )
    {
      if( __scripts[sc]['runtime-id'] == id )
      {
        delete __scripts[sc];
      }
    }
    */
    delete __runtimes[id];
  }

  this.handleRuntimeStarted = function(xml)
  {
    parseRuntime(xml);
  }

  this.handleRuntimesReplay = function(xml)
  {
    parseRuntime(xml);
  }

  var parseRuntime = function(xml)
  {
    var r_ts = xml.getElementsByTagName('runtime'), r_t=null, i=0;
    var length = 0, k = 0;
    var runtimeId = '', runtime=null, prop = '', 
      children = null, child = null, j = 0;
    var cur = '';
    for ( ; r_t = r_ts[i]; i++)
    {
      runtimeId = r_t.getNodeData('runtime-id'); 
      if(runtimeId)
      {
        length = __runtimes_arr.length
        for( k = 0; k < length && runtimeId != __runtimes_arr[k]; k++);
        if( k == length )
        {
          __runtimes_arr[k] = runtimeId;  
        }
        runtime={};
        children = r_t.childNodes;
        for(j=0 ; child = children[j]; j++)
        {
          runtime[child.nodeName] = child.textContent;
        }
        for( cur in __runtimes )
        {
          if( __runtimes[cur] && __runtimes[cur]['uri'] == runtime['uri'] )
          {
            if( __runtimes[cur]['unfolded'] )
            {
              runtime['unfolded'] = __runtimes[cur]['unfolded'];
            }
            delete __runtimes[cur];
          }
        }
        getTitleRuntime(runtimeId);
        __runtimes[runtimeId] = runtime;

        if(__next_runtime_id_to_select == runtimeId)
        {
          self.setSelectedRuntime(runtime);
          __next_runtime_id_to_select = '';
        }
        
        views.runtimes.update();
      }
    }
  }

  var getTitleRuntime = function(rt_id)
  {
    var tag = tagManager.setCB(null, parseGetTitle, [rt_id]);
    var script = "return $" + rt_id + ".document.title || ''";
    services['ecmascript-debugger'].eval(tag, rt_id, '', '', script, ['$' + rt_id, rt_id] );
  }

  var parseGetTitle = function(xml, rt_id)
  {
    if(xml.getNodeData('status') == 'completed' )
    {
      __runtimes[rt_id]['title'] = xml.getNodeData('string');
    }
    else
    {
      opera.postError('getting title has failed in runtimes getTitleRuntime');
    }
  }

  var __scripts = {};

/** checks if that script is already known from a previous runtime
  * checks first for the url and the for the script data. 
  * Both checks are not really reliable.
  * TODO we need a better logic to handle this
  */
  var registerScript = function(script)
  {
    var sc = null, is_known = false;
    var new_script_id = script['script-id'];
    for( sc in __scripts )
    {
      if( ( __scripts[sc]['uri'] && ( __scripts[sc]['uri'] == script['uri'] ) )|| __scripts[sc]['script-data'] == script['script-data'] )
      {
        is_known = true;
        break;
      }
    }

    if( is_known )
    {
      var old_b_ps = __scripts[sc]['breakpoints'];
      var new_b_ps = script['breakpoints'];
      for( b_p in old_b_ps )
      {
        services['ecmascript-debugger'].setBreakpoint(new_script_id, b_p, old_b_ps[b_p]);
        new_b_ps[b_p] = old_b_ps[b_p];
      }
      delete __scripts[sc];
    }

    __scripts[new_script_id] = script;

    var a ='', b='';
    for( a in __scripts ) b+=a+'; '; 

  }
  
/*
"<new-script>" 
   "<runtime-id>" UNSIGNED "</runtime-id>"
   "<script-id>" UNSIGNED "</script-id>" 
   "<script-type>" 
      ( "inline" | "event" | "linked" | "timeout" | "java" | "unknown" ) 
   "</script-type>"
   "<script-data>" TEXT "</script-data>" 
   "<uri>" TEXT "</uri>"             ; present if SCRIPT-TYPE is "linked"
 "</new-script>" ;
*/

  var breakpoint_count = 1;

  var getBreakpointId = function()
  {
    return ( breakpoint_count++ ).toString();
  }

  var script_count = 1;

  var getScriptId = function()
  {
    return ( script_count++ ).toString();
  }

  var log_thread = function(xml, rt_id, thread_id)
  {
    var event_map =
    {
       'thread-started': ['thread-type', 'parent-thread-id'],
       'thread-finished': ['status'],
       'thread-stopped-at': ['script-id', 'line-number', 'stopped-reason']
    };
    var thread = __threads[__threads.length] = 
    {
      stoped_at_queue: runtime_stoped_queue.slice(0),
      rt_id: rt_id,
      thread_id: thread_id
    };
    var type = thread.event_type = xml.documentElement.nodeName, key = '', i = 0;
    for( ; key = event_map[type][i]; i++)
    {
      thread[key] = xml.getNodeData(key);
    }
    thread.threads = [];
    for( i = 0; key = __runtimes_arr[i]; i++ )
    {
      if( key in current_threads && current_threads[key].length )
      {
        thread.threads[thread.threads.length] = [key].concat( current_threads[key] );
      }
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
        case 'log-threads':
        {
          __log_threads = settings[id].get(msg.key);
          break;
        }
      }
    }
  }

  this.getThreads = function()
  {
    return __threads;
  }

  this.clearThreadLog = function()
  {
    __threads = [];
  }



  this.handle = function(new_script_event)
  {
    var script = {};
    var children = new_script_event.documentElement.childNodes, child=null, i=0;
    for ( ; child = children[i]; i++)
    {
      script[child.nodeName] = child.firstChild.nodeValue;
    }
    script['breakpoints'] = {};
    registerRuntime( script['runtime-id'] );
    registerScript( script );
    views.runtimes.update();
  }

  var thread_queues = {};
  var current_threads = {};
  
  var runtime_stoped_queue = [];
  var stoped_threads = {};

  var clear_thread_id = function(rt_id, thread_id)
  {
    var cur = '', i = 0;
    var thread_queue = thread_queues[rt_id];
    var current_thread = current_threads[rt_id];
    // it seems that the order of the thread-finished events can get reversed 
    // TODO this is a temporary fix for situations where a threads 
    // finishes in a runtime whre it has never started
    if(current_thread)
    {
      for(i = 0 ; cur = current_thread[i]; i++)
      {
        if( cur == thread_id )
        {
          current_thread.splice(i, 1);
          break;
        }
      }
      for(i = 0 ; cur = thread_queue[i]; i++)
      {
        if( cur == thread_id )
        {
          thread_queue.splice(i, 1);
          delete stoped_threads[rt_id][thread_id];
          return true;
        }
      }
    }
    else
    {
      opera.postError('got a thread finished event \n' +
        'in a runtime where the thread \n'+
        'has never started: '+ rt_id+' '+thread_id)
    }
    return false;
  }

/*

  <thread-started>
    <runtime-id>3</runtime-id>
    <thread-id>3</thread-id>
    <parent-thread-id>0</parent-thread-id>
    <thread-type>inline</thread-type>
  </thread-started>

  <thread-finished>
    <runtime-id>3</runtime-id>
    <thread-id>3</thread-id>
    <status>completed</status>
    <value type="null"/>
  </thread-finished>

  */


  this.handleThreadStarted = function(xml)
  {
    var rt_id = xml.getNodeData("runtime-id");
    var id = xml.getNodeData("thread-id");
    var parent_thread_id = xml.getNodeData("parent-thread-id");
    var thread_queue = thread_queues[rt_id] || ( thread_queues[rt_id] = [] );
    var current_thread = current_threads[rt_id] || ( current_threads[rt_id] = [] );
    thread_queue[thread_queue.length] = id;
    if( !current_thread.length || 
      ( parent_thread_id != '0' && parent_thread_id == current_thread[ current_thread.length - 1 ] ) )
    {
      current_thread[current_thread.length] = id;
    }
    if( __log_threads )
    {
      log_thread(xml, rt_id, id);
      views.threads.update();
    }
  }

  this.handleThreadStopedAt = function(xml)
  {
    var rt_id = xml.getNodeData("runtime-id");
    var thread_id = xml.getNodeData("thread-id");
    var current_thread = current_threads[rt_id];
    // the current thread id must be set in 'thread-started' event  
    if( !stop_at.getControlsEnabled () && thread_id == current_thread[ current_thread.length - 1 ] )
    {
      stop_at.handle(xml);
    }
    else
    {
      // it is sure to assume that per runtime there can be only one <stoped-at> event
      if( ! stoped_threads[rt_id] )
      {
        stoped_threads[rt_id] = {};
      } 
      stoped_threads[rt_id] = xml;
      runtime_stoped_queue[runtime_stoped_queue.length] = rt_id;
    }
    if( __log_threads )
    {
      log_thread(xml, rt_id, thread_id);
      views.threads.update();
    }
  }

  this.handleThreadFinished = function(xml)
  {
    /* TODO
    status "completed" | "unhandled-exception" | "aborted" | "cancelled-by-scheduler"
    */
    var rt_id = xml.getNodeData("runtime-id");
    var thread_id = xml.getNodeData("thread-id");
    clear_thread_id(rt_id, thread_id);
    if( !stop_at.getControlsEnabled () && runtime_stoped_queue.length )
    {
      stop_at.handle( stoped_threads[runtime_stoped_queue.shift()] );
    }
    if( __log_threads )
    {
      log_thread(xml, rt_id, thread_id);
      views.threads.update();
    }
  }

    // messages.post('host-state', {state: 'ready'});
    // fires when stop_at releases the control to the host
    // if there is already a <thread-stoped> event in the queue 
    // it has to be handled here
    var onHostStateChange = function(msg)
    {
      if( !stop_at.getControlsEnabled() && runtime_stoped_queue.length )
      {
        stop_at.handle( stoped_threads[runtime_stoped_queue.shift()] );
      }
    }

  /*
  <runtime-stopped>
  <runtime-id>1</runtime-id>
</runtime-stopped>

*/
  this.handleRuntimeStoped = function(xml)
  {
    var rt_id = xml.getNodeData('runtime-id');
    if(rt_id)
    {
      removeRuntime(rt_id);
      views.runtimes.update();
      var script_id = views.js_source.getCurrentScriptId();
      if( script_id  && ( self.getScriptsRuntimeId(script_id) == rt_id ) )
      {
        views.js_source.clearView();
      }
    }
  }

  // windows means runtime containers here to stay in sync with the xml protocol

  this.getWindows = function()
  {
    var ret = [], r = '', is_unfolded = true;
    for( r in __runtimes )
    {
      if( __runtimes[r]['html-frame-path'] && __runtimes[r]['html-frame-path'].indexOf('[') == -1 )
      {
        is_unfolded = true;
        if( __windowsFolding[__runtimes[r]['window-id']] === false )
        {
          is_unfolded = false;
        }
        ret[ret.length] = 
        {
          id: __runtimes[r]['window-id'],
          uri: __runtimes[r]['uri'],
          title: __runtimes[r]['title'] || '',
          is_unfolded: is_unfolded,
          runtimes: this.getRuntimes( __runtimes[r]['window-id'] )
        }
      }
    }
    return ret;
  }

  this.getRuntimes = function(window_id)
  {
    var ret = [], r = '';
    for( r in __runtimes )
    { 
      if ( __runtimes[r] && __runtimes[r]['window-id'] &&  __runtimes[r]['window-id'] == window_id )
      {
        ret[ret.length] = __runtimes[r];
      }
    }
    return ret;
  }
  


  this.getRuntimeIdWithURL = function(url)
  {
    var r = '';
    for( r in __runtimes )
    {
      if( __runtimes[r]['uri'] == url )
      {
        return __runtimes[r];
      }
    }
    return null;
  }

  this.getScript = function(scriptId)
  {
    return __scripts[scriptId];
  }

  this.getScriptsRuntimeId = function(scriptId)
  {
    return __scripts[scriptId] && __scripts[scriptId]['runtime-id'] || null;
  }

  this.getScriptSource = function(scriptId)
  {
    return __scripts[scriptId] && __scripts[scriptId]['script-data'] || null;
  }

  this.getScripts = function(runtime_id)
  {
    var ret=[], script = null, cur = '';
    for( cur in __scripts )
    {
      script = __scripts[cur];
      if(script['runtime-id'] == runtime_id)
      {
        ret[ret.length] = script;
      }
    }
    return ret;
  }


  this.hasBreakpoint = function(script_id, line_nr)
  {
    return (line_nr in __scripts[script_id]['breakpoints']);
  }

  this.setBreakpoint = function(script_id, line_nr)
  {
    var b_p_id = __scripts[script_id]['breakpoints'][line_nr] = getBreakpointId();
    services['ecmascript-debugger'].setBreakpoint(script_id, line_nr, b_p_id);
  }

  this.removeBreakpoint = function(script_id, line_nr)
  {
    services['ecmascript-debugger'].removeBreakpoint( __scripts[script_id]['breakpoints'][line_nr] );
    delete __scripts[script_id]['breakpoints'][line_nr];
  }

  this.getBreakpoints = function(script_id)
  {
    return __scripts[script_id] && __scripts[script_id]['breakpoints'];
  }


  this.setUnfolded = function(runtime_id, is_unfolded)
  {
    
    if( __runtimes[runtime_id] )
    {
      //alert(__runtimes[runtime_id]+' '+is_unfolded);
      __runtimes[runtime_id]['unfolded'] = is_unfolded;
    }
  }

  this.setWindowUnfolded = function(window_id, is_unfolded)
  {
    __windowsFolding[window_id] = is_unfolded;
  }

  this.setObserve = function(runtime_id, observe)
  {
    if( __runtimes[runtime_id] )
    {
      __runtimes[runtime_id]['observe'] = observe;
    }
  }

  this.getObserve = function(runtime_id)
  {
    return __runtimes[runtime_id] && __runtimes[runtime_id]['observe']  || false;
  }

  // this is a temporary solution as long as we don't have a concept for tabs

  var __selected_runtime_id = '';

  var __next_runtime_id_to_select = ''

  this.setSelectedRuntime = function(runtime)
  {
    var r = '';
    for( r in __runtimes )
    {
      if( __runtimes[r] == runtime )
      {
        __runtimes[r]['selected'] = true;
        __selected_runtime_id = __runtimes[r]['runtime-id'];
      }
      else
      {
        // the runtime could be registered but not jet parsed
        if( __runtimes[r] )
        {
          __runtimes[r]['selected'] = false;
        }
      }
    }
  }

  this.setSelectedScript = function( runtime, id )
  {
    var scripts = this.getScripts(runtime['runtime-id']), script = null, i = 0;
    for( ; script = scripts[i]; i++)
    {
      script.selected = script['script-id'] == id ? true : false;
    }
  }

  this.setSelectedRuntimeId = function(id)
  {
    if(__runtimes[id])
    {
      this.setSelectedRuntime(__runtimes[id]);
      views.runtimes.update();
    }
    else
    {
      __next_runtime_id_to_select = id;
    }
  }

  this.getSelectedRuntimeId = function()
  {
    return __selected_runtime_id;
  }
  
  messages.addListener('host-state', onHostStateChange);
  messages.addListener('setting-changed', onSettingChange);




}

//