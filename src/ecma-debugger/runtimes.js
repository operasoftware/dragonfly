window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["5.0"] || (cls.EcmascriptDebugger["5.0"] = {});

/**
  * @constructor 
  */

// TODO clean up in regard of protocol 4
cls.EcmascriptDebugger["5.0"].Runtimes = function()
{

  const
  RUNTIME_LIST = 0,
  // sub message RuntimeInfo 
  RUNTIME_ID = 0,
  HTML_FRAME_PATH = 1,
  WINDOW_ID = 2,
  OBJECT_ID = 3,
  URI = 4;

  var __runtimes = {};

  var __old_runtimes = {};

  var __runtimes_arr = []; // runtime ids

  var __window_ids = {};
  var __windows_reloaded = {};
  var __selected_window = '';

  var __threads = [];

  var __log_threads = false;

  var __windowsFolding = {};

  var __old_selected_window = ''; 


  var view_ids = ['threads'];

  var runtime_views = [];

  var __replaced_scripts = {};

  var __selected_runtime_id = '';

  var __next_runtime_id_to_select = '';

  var __selected_script = '';

  var _is_first_call_create_all_runtimes_on_debug_context_change = true;

  // used to set the top runtime automatically 
  // on start or on debug context change
  var debug_context_frame_path = '';

  // TODO check if that can be removed completly
  var updateRuntimeViews = function()
  {
    var rt = '', i = 0;
    for( ; rt = runtime_views[i]; i++ )
    {
      views[rt].update();
    }
  }
  
  var self = this;
  var ecma_debugger = window.services['ecmascript-debugger'];

  var _on_window_updated = function(msg)
  {
    for( var r in __runtimes )
    { 
      if (__runtimes[r] &&  __runtimes[r].window_id == msg.window_id && __runtimes[r].is_top)
      {
        __runtimes[r].title = msg.title;
        break;
      }
    }
  }

  var onResetState = function()
  {
    __runtimes = {};
    __old_runtimes = {};
    __runtimes_arr = []; // runtime ids
    __window_ids = {};
    __windows_reloaded = {};
    __selected_window = '';
    __threads = [];
    __log_threads = false;
    __windowsFolding = {};
    __old_selected_window = ''; 
    __selected_runtime_id = '';
    __next_runtime_id_to_select = '';
    __selected_script = '';
    updateRuntimeViews();
  }

  var registerRuntime = function(id)
  { 
    if( !(id in __runtimes) )
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        'runtime id does not exist')
      __runtimes[id] = null;
      services['ecmascript-debugger'].getRuntime( tagManager.setCB(null, parseRuntime), id );
    }
  }

  var removeRuntime = function(id)
  { 
    
    var sc = null , cur = '', i = 0;
    for( ; cur = __runtimes_arr[i] && cur != id; i++);
    if(cur)
    {
      __runtimes_arr.splice(cur, 1);
    }
    /*
    TODO check for existing breakpoints before cleaning up
    for( sc in __scripts )
    {
      if( __scripts[sc].runtime_id == id )
      {
        delete __scripts[sc];
      }
    }
    */
    if( __selected_runtime_id == id )
    {
      __selected_runtime_id = '';
    }
    messages.post('runtime-destroyed', {id: id});
    __old_runtimes[id] = __runtimes[id];
    delete __runtimes[id];
  }

  var cleanupWindow = function(win_id, rt_id)
  {
    // assert there is not yet a child runtime from this new top runtime
    // remove all runtimes in that window
    var cur = '';
    for( cur in __runtimes )
    {
      if( __runtimes[cur] && __runtimes[cur].window_id == win_id )
      {
        removeRuntime(__runtimes[cur].runtime_id);
      }
    }
  }

  this.handleRuntimeStarted = function(xml)
  {
    parseRuntime(xml);
  }

  this.handleRuntimesReplay = function(xml)
  {
    parseRuntime(xml);
  }

  var isTopRuntime = function(rt)
  {
    return rt.html_frame_path.indexOf('[') == -1;
  }

  /*

  <runtime>
    <runtime-id>1</runtime-id>
    <html-frame-path>_top</html-frame-path>
    <window-id>1</window-id>
    <object-id>1</object-id>
    <uri>http://dev.opera.com/</uri>
  </runtime>

  */
  var checkOldRuntimes = function(runtime)
  {
    var cur = '', old_rt = null;
    for( cur in __old_runtimes )
    {
      old_rt = __old_runtimes[cur];
      if( old_rt
          && old_rt.uri == runtime.uri
          && old_rt.window_id == runtime.window_id
          && old_rt.html_frame_path == runtime.html_frame_path )
      {
        runtime['unfolded-script'] = old_rt['unfolded-script'] || false;
        runtime['unfolded-css'] = old_rt['unfolded-css'] || false;
        // the old runtimes are needed to find "known" scripts
        // delete __old_runtimes[cur];
        return;
      }
    }
  }

  this.handleListRuntimes = function(status, message)
  {
    message[RUNTIME_LIST].forEach(this.handleRuntime, this);
  }

  this.onRuntimeStarted = function(status, message) 
  {
    this.handleRuntime(message);
  }

  this.handleRuntime = function(r_t)
  {

    /*
    const
    RUNTIME_LIST = 0,
    // sub message RuntimeInfo 
    RUNTIME_ID = 0,
    HTML_FRAME_PATH = 1,
    WINDOW_ID = 2,
    OBJECT_ID = 3,
    URI = 4;
    */
    var i=0;
    var length = 0, k = 0;
    var 
    runtimeId = r_t[RUNTIME_ID], 
    prop = '', 
    window_id = '',
    children = null, 
    child = null, 
    j = 0;
    var cur = '';
    var runtime = null;
    var host_tabs_update_active_tab = false;
    var host_tabs_set_active_tab = 0;

      // with the createAllRuntimes call and the runtime-started event
      // it can happen that a runtime get parsed twice
    if(runtimeId && !__runtimes[runtimeId] )
    {
      length = __runtimes_arr.length;
      for( k = 0; k < length && runtimeId != __runtimes_arr[k]; k++);
      if( k == length )
      {
        __runtimes_arr[k] = runtimeId;  
      }
      runtime = 
      {
        runtime_id: r_t[RUNTIME_ID],
        html_frame_path: r_t[HTML_FRAME_PATH],
        window_id: r_t[WINDOW_ID],
        object_id: r_t[OBJECT_ID],
        uri: r_t[URI],
      };

      checkOldRuntimes(runtime);
      if( runtime.is_top = isTopRuntime(runtime) )
      {
        var win_id = runtime.window_id;
        if (win_id in __window_ids)
        {
          cleanupWindow(win_id, runtimeId);
        }
        else
        {
          __window_ids[win_id] = true;
        }
        /* 
           pop-ups are top runtimes but part of the debug context.
           right now we don't get the correct info in the message 
           stream to know that directly. ( see bug CORE-17782 and CORE-17775 )
           for now we trust the window manager and our 
           setting to just use one window-id as filter.
           that basically means that a top runtime with a differnt window id 
           than __selected_window must actually be a pop-up 
        */
        if( __selected_window && win_id != __selected_window )
        {
          /*
            it is a pop-up, but the id of the opener 
            window is an assumption here, 
            certainly not true in all cases. 
          */
          runtime.opener_window_id = __selected_window;
        }
        if (!debug_context_frame_path)
        {
          debug_context_frame_path = runtime.html_frame_path;
        }   
        __selected_script = '';
      } 
      runtime.title = (window.window_manager_data.get_window(win_id) || {}).title;
      __runtimes[runtimeId] = runtime;
      // TODO check if that is still needed

      if(__next_runtime_id_to_select == runtimeId)
      {
        self.setSelectedRuntime(runtime);
        __next_runtime_id_to_select = '';
      }
      if( runtime.window_id == __old_selected_window )
      {
        self.setActiveWindowId(__old_selected_window);
        host_tabs_set_active_tab = __old_selected_window;
        __old_selected_window = '';
      }
      else
      {
        // TODO still needed?
        updateRuntimeViews();
      }
      if(__windows_reloaded[runtime.window_id] == 1)
      {
        __windows_reloaded[runtime.window_id] = 2;
      }
      if( debug_context_frame_path == runtime.html_frame_path && 
            __selected_window == runtime.window_id && 
            runtimeId != __selected_runtime_id )
      {
        self.setSelectedRuntimeId(runtimeId);
      }
      if( runtime.window_id == __selected_window ||
            runtime.opener_window_id == __selected_window )
      {
        host_tabs_update_active_tab = true;
      }
      if(runtime.is_top)
      {
        views['js_source'].update();
        window['cst-selects']['js-script-select'].updateElement();
        window['cst-selects']['cmd-runtime-select'].updateElement();
      }
    }
    if(host_tabs_set_active_tab)
    {
      host_tabs.setActiveTab(host_tabs_set_active_tab);
    }
    if(host_tabs_update_active_tab)
    {
      host_tabs.updateActiveTab();
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
    var new_script_id = script.script_id;
    var new_rt = __runtimes[script.runtime_id];
    var old_rt = null;
    var old_break_points = null;
    var line_nr = '';

    for( sc in __scripts )
    {
      old_rt = __runtimes[__scripts[sc].runtime_id] || __old_runtimes[__scripts[sc].runtime_id] || {};
      // TODO check for script-type as well?
      if( ( 
            ( __scripts[sc].uri && __scripts[sc].uri == script.uri ) 
            || __scripts[sc].script_data == script.script_data 
          ) &&
          old_rt.uri == new_rt.uri &&
          ( old_rt.window_id == new_rt.window_id ||
            ( new_rt.opener_window_id && 
              old_rt.opener_window_id == new_rt.opener_window_id  ) ) &&
          old_rt.html_frame_path == new_rt.html_frame_path )
      {
        is_known = true;
        break;
      }
    }
    __scripts[new_script_id] = script;
    if( is_known )
    {
      old_break_points = __scripts[sc].breakpoints;
      for( line_nr in old_break_points )
      {
        // do we need to remove the old breakpoints?
        self.setBreakpoint(new_script_id, parseInt(line_nr));
      }
      if( __scripts[sc].script_id == __selected_script )
      {
        __selected_script = new_script_id;
      }
      // the script could be in a pop-up window
      if( old_rt.window_id == new_rt.window_id )
      {
        __replaced_scripts[sc] = script;
        delete __scripts[sc];
      }
    }

    if( !__selected_script )
    {
      __selected_script = new_script_id;
      views['js_source'].update();
      window['cst-selects']['js-script-select'].updateElement();
      window['cst-selects']['cmd-runtime-select'].updateElement();

    }
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
    return ( breakpoint_count++ );
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

  var onActiveTab = function(msg)
  {

  }

  var onApplicationSetup = function(msg)
  {
    __old_selected_window = settings.runtimes.get('selected-window');

  }

  this.setActiveWindowId = function(window_id)
  {
    if( window_id != __selected_window )
    {
      __selected_window = window_id;
      cleanUpThreadOnContextChange();
      settings.runtimes.set('selected-window', window_id);
      updateRuntimeViews();
    }
  }

  // new in proto 4

  // window id is the new debug context
  // called to create all runtimes on setting or changing the debug context
  this.createAllRuntimesOnDebugContextChange = function(win_id)
  {
    debug_context_frame_path = '';
    __selected_script = '';
    /*
    if( _is_first_call_create_all_runtimes_on_debug_context_change )
    {
      stop_at.setInitialSettings();
      // with the STP 1 design this workaround can be removed
      _is_first_call_create_all_runtimes_on_debug_context_change = false;
    }
    */
    var tag =  tagManager.setCB(null, set_new_debug_context, [win_id]);
    ecma_debugger.requestListRuntimes(tag, [[],1]);
  }

  var set_new_debug_context = function(status, message, win_id)
  {
    if(message[RUNTIME_LIST])
    {
      message[RUNTIME_LIST].forEach(self.handleRuntime, self);
      host_tabs.setActiveTab(win_id);
      if( message[RUNTIME_LIST].length )
      {
        if( settings.runtimes.get('reload-runtime-automatically') )
        {
          self.reloadWindow();
        }
      }
      else
      {
        if (win_id in __window_ids)
        {
          cleanupWindow(win_id);
        }
        else
        {
          __window_ids[win_id] = true;
        }
        __selected_runtime_id = '';
        __selected_script = '';
        views['js_source'].update();
        window['cst-selects']['js-script-select'].updateElement();
        window['cst-selects']['cmd-runtime-select'].updateElement();
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



  this.onNewScript = function(status, message)
  {

    const
    RUNTIME_ID = 0,
    SCRIPT_ID = 1,
    SCRIPT_TYPE = 2,
    SCRIPT_DATA = 3,
    URI = 4;

    var script = 
    {
      runtime_id: message[RUNTIME_ID],
      script_id: message[SCRIPT_ID],
      script_type: message[SCRIPT_TYPE],
      script_data: message[SCRIPT_DATA],
      uri: message[URI]
    };

    if( !script.script_data )
    {
      script.script_data = '';
    }
    
    if( is_runtime_of_debug_context(script.runtime_id))
    {
      script.breakpoints = {};
      script.stop_ats = [];
      registerRuntime( script.runtime_id );
      registerScript( script );
    }
  }

  this.onParseError = function(status, message)
  {
    const
    RUNTIME_ID = 0,
    SCRIPT_ID = 1,
    LINE_NUMBER = 2,
    OFFSET = 3,
    CONTEXT = 4,
    DESCRIPTION = 5;

    if(__scripts[message[SCRIPT_ID]])
    {
      var reason = /^[^:]*/.exec(message[DESCRIPTION]);
      var expected_token = /Expected token: '[^']*'/i.exec(message[DESCRIPTION]);
      var error = __scripts[message[SCRIPT_ID]].parse_error =
      {
        runtime_id: message[RUNTIME_ID],
        script_id: message[SCRIPT_ID],
        line_nr: message[LINE_NUMBER],
        offset: message[OFFSET],
        context: message[CONTEXT],
        description: message[DESCRIPTION],
        reason: reason && reason[0] || '',
        expected_token: expected_token && expected_token[0] || ''
      };      
      if(settings['js_source'].get('error'))
      {
        if(  !views['js_source'].isvisible())
        {
          window.topCell.showView('js_source');
        }
        var plus_lines = views.js_source.getMaxLines() <= 10 
          ? views.js_source.getMaxLines() / 2 >> 0 
          : 10;
        if( views.js_source.showLine(error.script_id, error.line_nr - plus_lines) )
        {
          runtimes.setSelectedScript(error.script_id);
          views.js_source.showLinePointer(error.line_nr, true );
        }

      }
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        "script source is missing in onParseError handler in runtimes");
    }

  }

  // TODO client side therads handling needs a revision

  var thread_queues = {};
  var current_threads = {};
  
  var runtime_stoped_queue = [];
  var stoped_threads = {};

  var cleanUpThreadOnContextChange = function()
  {
    thread_queues = {};
    current_threads = {};
    // release all stopped events
    var rt_id = '', i = 0, thread_id = '';
    for( ; rt_id = runtime_stoped_queue[i]; i++)
    {
      thread_id = stoped_threads[rt_id] && stoped_threads[rt_id].getNodeData("thread-id");
      if( thread_id )
      {
        services['ecmascript-debugger'].continue_run(rt_id, thread_id);
      }
    }
    stoped_threads = {};
    runtime_stoped_queue = [];
  }

  var is_runtime_of_debug_context = function(rt_id)
  {
    /*
      TODO remove this check
      everything which passes the window manager filter
      is part of the debug context
    */
    return __runtimes[rt_id] && 
              ( __runtimes[rt_id].window_id == __selected_window ||
                __runtimes[rt_id].opener_window_id == __selected_window );

  }

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
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        'got a thread finished event \n' +
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

 


  this.onThreadStarted = function(status, message)
  {
        
    const
    RUNTIME_ID = 0,
    THREAD_ID = 1,
    PARENT_THREAD_ID = 2,
    THREAD_TYPE = 3,
    EVENT_NAMESPACE = 4,
    EVENT_TYPE = 5;
    
    var rt_id = message[RUNTIME_ID];
    // workaround for missing filtering
    if( is_runtime_of_debug_context(rt_id) )
    {
      var id = message[THREAD_ID];
      var parent_thread_id = message[PARENT_THREAD_ID];
      var thread_queue = thread_queues[rt_id] || ( thread_queues[rt_id] = [] );
      var current_thread = current_threads[rt_id] || ( current_threads[rt_id] = [] );
      thread_queue[thread_queue.length] = id;
      if( !current_thread.length || 
        ( parent_thread_id !== 0 && parent_thread_id == current_thread[ current_thread.length - 1 ] ) )
      {
        current_thread[current_thread.length] = id;
      }
      if( __log_threads )
      {
        log_thread(xml, rt_id, id);
        views.threads.update();
      }
    }
  }

  this.onThreadStoppedAt = function(status, message)
  {

    const
    RUNTIME_ID = 0,
    THREAD_ID = 1,
    SCRIPT_ID = 2,
    LINE_NUMBER = 3,
    STOPPED_REASON = 4,
    BREAKPOINT_ID = 5;
    
    var rt_id = message[RUNTIME_ID];
    var thread_id = message[THREAD_ID];

    // TODO clean up workaround for missing filtering 
    if( is_runtime_of_debug_context(rt_id) )
    {
      
      var current_thread = current_threads[rt_id];

      // the current thread id must be set in 'thread-started' event
      // TODO thread logic
      if( !stop_at.getControlsEnabled ()  
          && ( !current_thread // in case the window was switched 
              || thread_id == current_thread[ current_thread.length - 1 ] ) )
      {
        stop_at.handle(message);
      }
      else
      {
        // it is sure to assume that per runtime there can be only one <stoped-at> event
        if( ! stoped_threads[rt_id] )
        {
          stoped_threads[rt_id] = {};
        } 
        stoped_threads[rt_id] = message;
        runtime_stoped_queue[runtime_stoped_queue.length] = rt_id;
      }
      if( __log_threads )
      {
        log_thread(xml, rt_id, thread_id);
        views.threads.update();
      }
    }
    else
    {
      services['ecmascript-debugger'].continue_run(rt_id, thread_id);
    }
  }

  this.onThreadFinished = function(status, message)
  {
    /* TODO
    status "completed" | "unhandled-exception" | "aborted" | "cancelled-by-scheduler"
    */

    const
    RUNTIME_ID = 0,
    THREAD_ID = 1,
    SCRIPT_ID = 2,
    LINE_NUMBER = 3,
    STOPPED_REASON = 4,
    BREAKPOINT_ID = 5;

    var rt_id = message[RUNTIME_ID];
    // workaround for missing filtering 
    if( is_runtime_of_debug_context(rt_id) )
    {
      var thread_id = message[THREAD_ID];
      clear_thread_id(rt_id, thread_id);
      if( !stop_at.getControlsEnabled () && runtime_stoped_queue.length )
      {
        stop_at.handle( stoped_threads[runtime_stoped_queue.shift()] );
      }
      if( __log_threads )
      {
        log_thread(message, rt_id, thread_id);
        views.threads.update();
      }
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
  this.onRuntimeStopped = function(status, message)
  {
    var rt_id = message[0];
    if(rt_id)
    {
      removeRuntime(rt_id);
      updateRuntimeViews();
      
      messages.post('runtime-stopped', {id: rt_id} );
    }
  }

  // windows means runtime containers here to stay in sync with the xml protocol

  this.getWindows = function()
  {
    var ret = [], r = '', is_unfolded = true;
    for( r in __runtimes )
    {
      if( __runtimes[r] && __runtimes[r].html_frame_path && __runtimes[r].html_frame_path.indexOf('[') == -1 )
      {
        is_unfolded = true;
        if( __windowsFolding[__runtimes[r].window_id] === false )
        {
          is_unfolded = false;
        }
        ret[ret.length] = 
        {
          id: __runtimes[r].window_id,
          uri: __runtimes[r].uri,
          title: __runtimes[r]['title'] || '',
          is_unfolded: is_unfolded,
          is_selected: __selected_window == __runtimes[r].window_id ||
            __selected_window == __runtimes[r].opener_window_id,
          runtimes: this.getRuntimes( __runtimes[r].window_id )
        }
      }
    }
    return ret;
  }

  this.getActiveWindowId = function()
  {
    return __selected_window;
  }

 

  this.getRuntimes = function(window_id)
  {
    var ret = [], r = '';
    for( r in __runtimes )
    { 
      if ( __runtimes[r] && __runtimes[r].window_id &&  
            ( __runtimes[r].window_id == window_id ||
              __runtimes[r].opener_window_id == window_id ) )
      {
        ret[ret.length] = __runtimes[r];
      }
    }
    return ret;
  }

  this.getRuntime = function(rt_id)
  {
    return __runtimes[rt_id] || null;
  }

  this.getRuntimeIdsFromWindow = function(window_id)
  {
    // first member is the top runtime
    var ret = [], r = '';
    for( r in __runtimes )
    { 
      if ( __runtimes[r] && __runtimes[r].window_id &&
            ( __runtimes[r].window_id == window_id ||
              __runtimes[r].opener_window_id == window_id )
        )
      {
        if(__runtimes[r].is_top && !__runtimes[r].opener_window_id )
        {
          ret = [__runtimes[r].runtime_id].concat(ret);
        }
        else
        {
          ret[ret.length] = __runtimes[r].runtime_id;
        }
        
      }
    }
    return ret;
  }


 
  this.getRuntimeIdWithURL = function(url)
  {
    var r = '';
    for( r in __runtimes )
    {
      if( __runtimes[r].uri == url )
      {
        return __runtimes[r];
      }
    }
    return null;
  }

  this.getURI = function(rt_id)
  {
    for( var r in __runtimes )
    {
      if( __runtimes[r].runtime_id == rt_id )
      {
        return __runtimes[r].uri;
      }
    }
    return '';
  }

  this.getScript = function(scriptId)
  {
    return __scripts[scriptId] || __replaced_scripts[scriptId] || null;
  }

  this.getStoppedAt = function(scriptId)
  {
    return __scripts[scriptId] && __scripts[scriptId].stop_ats || null;
  }

  this.getScriptsRuntimeId = function(scriptId)
  {
    return __scripts[scriptId] && __scripts[scriptId].runtime_id || null;
  }

  this.getScriptSource = function(scriptId)
  {
    // script_data can be an empty string
    if( __scripts[scriptId] )
    {
      return  __scripts[scriptId].script_data 
    }
    return null;
  }

  this.getScripts = function(runtime_id)
  {
    var ret=[], script = null, cur = '';
    for( cur in __scripts )
    {
      script = __scripts[cur];
      if(script.runtime_id == runtime_id)
      {
        ret[ret.length] = script;
      }
    }
    return ret;
  }


  this.hasBreakpoint = function(script_id, line_nr)
  {
    return __scripts[script_id] && (line_nr in __scripts[script_id].breakpoints);
  }

  this.setBreakpoint = function(script_id, line_nr)
  {
    var b_p_id = __scripts[script_id].breakpoints[line_nr] = getBreakpointId();
    services['ecmascript-debugger'].requestAddBreakpoint(0, [b_p_id, "line", script_id, line_nr]);
  }

  this.removeBreakpoint = function(script_id, line_nr)
  {
    services['ecmascript-debugger'].requestRemoveBreakpoint(0, 
      [__scripts[script_id].breakpoints[line_nr]] );
    delete __scripts[script_id].breakpoints[line_nr];
  }

  this.getBreakpoints = function(script_id)
  {
    return __scripts[script_id] && __scripts[script_id].breakpoints;
  }


  this.setUnfolded = function(runtime_id, view, is_unfolded)
  {
    
    if( __runtimes[runtime_id] )
    {
      __runtimes[runtime_id]['unfolded-' + view] = is_unfolded;
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



  this.setSelectedRuntime = function(runtime)
  {
    var r = '';
    for( r in __runtimes )
    {
      if( __runtimes[r] == runtime )
      {
        __runtimes[r]['selected'] = true;
        __selected_runtime_id = __runtimes[r].runtime_id;
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
  // only one script can be selected at a time
  this.setSelectedScript = function( script_id )
  {
    __selected_script = script_id;
    window['cst-selects']['js-script-select'].updateElement();

    
    /*
    don't understand why this was done in this way
    var scripts = this.getScripts(rt_id), script = null, i = 0;
    for( ; script = scripts[i]; i++)
    {
      script.selected = script.script_id == script_id ;
    }
    */
  }

  this.getSelectedScript = function()
  {
    return __selected_script;
  }

  this.setSelectedRuntimeId = function(id)
  {
    if(__runtimes[id])
    {
      this.setSelectedRuntime(__runtimes[id]);
      // this is not clean
      // views.runtimes.update();
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

  this.getSelecetdScriptIdFromSelectedRuntime = function()
  {
    var scripts = this.getScripts(__selected_runtime_id), script = null, i = 0;
    for( ; script = scripts[i]; i++)
    {
      if( script.selected )
      {
        return script.script_id;
      }
    }
    return null;
  }

  this.getRuntimeIdWithScriptId = function(scriptId)
  {
    return  __scripts[scriptId] && __scripts[scriptId].runtime_id || null; 
  }

  this.reloadWindow = function()
  {
    
    if( __selected_window )
    {
      if( !__windows_reloaded[__selected_window] )
      {
        __windows_reloaded[__selected_window] = 1;
      }
      var rt_id = this.getRuntimeIdsFromWindow(__selected_window)[0];
      if( rt_id )
      {
        if(services.exec && services.exec.is_implemented)
        {
          services.exec.requestExec(0, 
              [[["reload", null, window.window_manager_data.get_debug_context()]]]);
        }
        else
        {
          services['ecmascript-debugger'].requestEval(0, [rt_id, 0, 0, 'location.reload()']);
        }
      }
    }
  }

  this.isReloadedWindow = function(window_id)
  {
    return __windows_reloaded[window_id] == 2;
  }

  var onThreadStopped = function(msg)
  {
    var script_id = msg.stop_at.script_id;
    // only scripts from the selected runtime are registered
    if( script_id && __scripts[script_id] )
    {
      var stop_ats = __scripts[script_id].stop_ats;
      stop_ats[stop_ats.length] = msg.stop_at;
    }


  }

  var onThreadContinue = function(msg)
  {
    var
    script_id = msg.stop_at.script_id,
    stop_ats = __scripts[script_id] && __scripts[script_id].stop_ats,
    stop_at = null,
    i = 0;
 
    if( stop_ats )
    {
      for( ; stop_at = stop_ats[i]; i++ )
      {
        if(stop_at == msg.stop_at)
        {
          stop_ats.splice(i, 1);
          return;
        }
      }
    }
  }





  messages.addListener("thread-stopped-event", onThreadStopped);
  messages.addListener("thread-continue-event", onThreadContinue);
  
  messages.addListener('host-state', onHostStateChange);
  messages.addListener('setting-changed', onSettingChange);
  messages.addListener('active-tab', onActiveTab);
  messages.addListener('application-setup', onApplicationSetup);

  messages.addListener('reset-state', onResetState);

  messages.addListener('window-updated', _on_window_updated)

  this.bind = function()
  {
    var self = this,
    ecma_debugger = window.services['ecmascript-debugger'];

    ecma_debugger.handleEval = function(status, message){};

    ecma_debugger.handleListRuntimes = function(status, message)
    {
      self.handleListRuntimes(status, message);
    }

    ecma_debugger.onRuntimeStarted = function(status, message)
    {
      self.onRuntimeStarted(status, message);
    }

    ecma_debugger.onRuntimeStopped = function(status, message)
    {
      self.onRuntimeStopped(status, message);
    }

    ecma_debugger.onNewScript = function(status, message)
    {
      self.onNewScript(status, message);
    }

    ecma_debugger.onThreadStarted = function(status, message)
    {
      self.onThreadStarted(status, message);
    }

    ecma_debugger.onThreadStoppedAt = function(status, message)
    {
      self.onThreadStoppedAt(status, message);
    }



    ecma_debugger.onThreadFinished = function(status, message)
    {
      self.onThreadFinished(status, message);
    }

    ecma_debugger.onParseError = function(status, message)
    {
      self.onParseError(status, message);
    }

    // TODO move to a bind method of dom_data
    ecma_debugger.onObjectSelected =
    ecma_debugger.handleGetSelectedObject = function(status, message)
    {
      window.dom_data.on_element_selected(status, message);
    }

    ecma_debugger.addListener('window-filter-change', function(msg)
    {
      self.createAllRuntimesOnDebugContextChange(msg.filter[1][0])
    });
  }
  




}

