window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

cls.EcmascriptDebugger["6.0"].Runtime = function(runtime)
{
  var RUNTIME_ID = 0;
  var HTML_FRAME_PATH = 1;
  var WINDOW_ID = 2;
  var OBJECT_ID = 3;
  var URI = 4;
  var DESCRIPTION = 5;

  this.runtime_id = runtime[RUNTIME_ID];
  this.html_frame_path = runtime[HTML_FRAME_PATH];
  this.window_id = runtime[WINDOW_ID];
  this.object_id = runtime[OBJECT_ID];
  this.uri = runtime[URI];
  this.description = runtime[DESCRIPTION];
};

cls.EcmascriptDebugger["6.0"].Runtime.prototype = new URIPrototype("uri");

cls.EcmascriptDebugger["6.0"].DOMRuntime = function(rt)
{
  this.type = "document";
  this.id = rt.runtime_id;
  this.uri = rt.uri;
  this.title = rt.title || rt.uri;
  this.selected = rt.selected;
  this.extensions = [];
};

cls.EcmascriptDebugger["6.0"].DOMRuntime.prototype = new URIPrototype("uri");

cls.EcmascriptDebugger["6.0"].ExtensionRuntime = function(rt)
{
  this.type = "extension";
  this.id = rt.runtime_id;
  this.uri = rt.uri;
  this.title = "Extension Runtime " + rt.runtime_id;
};

/**
  * @constructor
  */

// TODO clean up in regard of protocol 4
cls.EcmascriptDebugger["6.0"].Runtimes = function(service_version)
{
  var RUNTIME_LIST = 0;
  // sub message RuntimeInfo
  var RUNTIME_ID = 0;
  var HTML_FRAME_PATH = 1;
  var WINDOW_ID = 2;
  var OBJECT_ID = 3;
  var URI = 4;
  var DESCRIPTION = 5;
  var THREAD_STARTED = 0;
  var THREAD_STOPPED_AT = 1;
  var THREAD_FINISHED = 2;
  var SUCCESS = 0;

  var _runtimes = {};
  var _rt_class = cls.EcmascriptDebugger["6.0"].Runtime;
  var _dom_rt_class = cls.EcmascriptDebugger["6.0"].DOMRuntime;
  var _ext_rt_class = cls.EcmascriptDebugger["6.0"].ExtensionRuntime;
  var _old_runtimes = {};
  var _runtime_ids = [];
  var _window_ids = {};
  var _windows_reloaded = {};
  var _selected_window = '';
  var _threads = [];
  var _old_selected_window = "";
  var _replaced_scripts = {};
  var _selected_runtime_id = "";
  var _next_runtime_id_to_select = "";
  var _selected_script_id = '';
  var _selected_script_type = "";
  var _is_first_call_create_all_runtimes_on_debug_context_change = true;
  var _window_top_rt_map = {};
  var _submitted_scripts = [];
  // used to set the top runtime automatically
  // on start or on debug context change
  var _debug_context_frame_path = "";
  var _ecma_debugger = window.services['ecmascript-debugger'];

  var _on_window_updated = function(msg)
  {
    for( var r in _runtimes )
    {
      if (_runtimes[r] &&  _runtimes[r].window_id == msg.window_id && _runtimes[r].is_top)
      {
        _runtimes[r].title = msg.title;
        window.messages.post('top-runtime-updated', {rt: _runtimes[r]});
        break;
      }
    }
  };

  this._on_debug_context_selected = function(msg)
  {
    this.setActiveWindowId(msg.window_id);
  };

  var is_injected_script = function(script_type)
  {
    return (
    [
      "Greasemonkey JS",
      "Browser JS",
      "User JS",
      "Extension JS"
    ].indexOf(script_type) != -1);
  };

  var onResetState = function()
  {
    _runtimes = {};
    _old_runtimes = {};
    _runtime_ids = []; // runtime ids
    _window_ids = {};
    _windows_reloaded = {};
    _selected_window = '';
    _threads = [];
    _old_selected_window = '';
    _selected_runtime_id = '';
    _next_runtime_id_to_select = '';
    _selected_script_id = '';
  };

  var _on_profile_disabled = function(msg)
  {
    if (msg.profile == window.app.profiles.DEFAULT)
    {
      _runtimes = {};
      _old_runtimes = {};
      _runtime_ids = []; // runtime ids
      _window_ids = {};
      _windows_reloaded = {};
      _threads = [];
      _selected_runtime_id = '';
      _next_runtime_id_to_select = '';
      _selected_script_id = '';
      _thread_queues = {};
    }
  };

  this._on_profile_enabled = function(msg)
  {
    if (msg.profile == window.app.profiles.DEFAULT)
    {
      _windows_reloaded = {};
      var dbg_ctx = window.window_manager_data.get_debug_context();
      if (dbg_ctx)
      {
        var tag = window.tag_manager.set_callback(this, this._set_new_debug_context, [dbg_ctx]);
        _ecma_debugger.requestListRuntimes(tag, [[],1]);
      }
    }
  };

  var registerRuntime = function(id)
  {
    if (!(id in _runtimes))
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      'runtime id does not exist');
      _runtimes[id] = null;
      var tag = tagManager.set_callback(this, this.handleListRuntimes);
      services['ecmascript-debugger'].requestListRuntimes(tag, [id]);
    }
  };

  this._remove_runtime = function(id)
  {
    for (var i = 0, cur; cur = _runtime_ids[i] && cur != id; i++);
    if (cur)
      _runtime_ids.splice(cur, 1);

    if (_selected_runtime_id == id)
    {
      _selected_runtime_id = '';
      if (_runtimes[id] && !_runtimes[id].is_top)
      {
        var rt = _window_top_rt_map[_runtimes[id].window_id];
        if (rt)
        {
          this.setSelectedRuntime(rt);
          window['cst-selects']['cmd-runtime-select'].updateElement();
        }
      }
    }
    messages.post('runtime-destroyed', {id: id});
    _old_runtimes[id] = _runtimes[id];
    delete _runtimes[id];
  };

  this._reset_window = function(win_id)
  {
    for (var cur in _runtimes)
    {
      if (_runtimes[cur] && _runtimes[cur].window_id == win_id)
        this._remove_runtime(_runtimes[cur].runtime_id);
    }
  };

  // If the script _is_ a console script it is also
  // removed from the list of console scripts.
  // This is to prevent a false positive, e.g. if the document itself
  // would by coincidence create a script as submitted in the console.
  var is_console_script = function(script)
  {
    var index = _submitted_scripts.indexOf(script);
    if (index > -1)
      _submitted_scripts.splice(index, 1);
    return index != -1;
  };

  this.handleRuntimeStarted = function(xml)
  {
    parseRuntime(xml);
  };

  this.handleRuntimesReplay = function(xml)
  {
    parseRuntime(xml);
  };

  var isTopRuntime = function(rt)
  {
    return (rt.html_frame_path.indexOf('_top') == 0 &&
            rt.html_frame_path.indexOf('[') == -1);
  };

  var checkOldRuntimes = function(runtime)
  {
    var cur = '', old_rt = null;
    for( cur in _old_runtimes )
    {
      old_rt = _old_runtimes[cur];
      if( old_rt
          && old_rt.uri == runtime.uri
          && old_rt.window_id == runtime.window_id
          && old_rt.html_frame_path == runtime.html_frame_path )
      {
        runtime['unfolded-script'] = old_rt['unfolded-script'] || false;
        runtime['unfolded-css'] = old_rt['unfolded-css'] || false;
        // the old runtimes are needed to find "known" scripts
        // delete _old_runtimes[cur];
        return;
      }
    }
  };

  this.handleListRuntimes = function(status, message)
  {
    message[RUNTIME_LIST].forEach(this._handle_runtime, this);
  };

  this.onRuntimeStarted = function(status, message)
  {
    this._handle_runtime(message);
  };

  this._handle_runtime = function(r_t)
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

    // With the createAllRuntimes call and the runtime-started event
    // it can happen that a runtime get parsed twice.
    if (runtimeId && !_runtimes[runtimeId])
    {
      if (!_runtime_ids.contains(runtimeId))
        _runtime_ids.push(runtimeId);

      var runtime = new _rt_class(r_t);
      if (!runtime.window_id)
        runtime.window_id = _selected_window;

      checkOldRuntimes(runtime);
      if (runtime.is_top = isTopRuntime(runtime))
      {
        var win_id = runtime.window_id;
        if (win_id in _window_ids)
          this._reset_window(win_id);
        else
          _window_ids[win_id] = true;

        _window_top_rt_map[runtime.window_id] = runtime;
        /*
           pop-ups are top runtimes but part of the debug context.
           right now we don't get the correct info in the message
           stream to know that directly. ( see bug CORE-17782 and CORE-17775 )
           for now we trust the window manager and our
           setting to just use one window-id as filter.
           that basically means that a top runtime with a differnt window id
           than _selected_window must actually be a pop-up
        */
        if (_selected_window && win_id != _selected_window)
        {
          /*
            it is a pop-up, but the id of the opener
            window is an assumption here,
            certainly not true in all cases.
          */
          runtime.opener_window_id = _selected_window;
        }

        if (!_debug_context_frame_path)
          _debug_context_frame_path = runtime.html_frame_path;

        _selected_script_id = "";
      }

      var title = window.window_manager_data.get_window(win_id);
      if (title)
        runtime.title = title;
      _runtimes[runtimeId] = runtime;
      // TODO check if that is still needed
      if(_next_runtime_id_to_select == runtimeId)
      {
        this.setSelectedRuntime(runtime);
        _next_runtime_id_to_select = "";
      }

      if (runtime.window_id == _old_selected_window)
      {
        this.setActiveWindowId(_old_selected_window);
        host_tabs_set_active_tab = _old_selected_window;
        _old_selected_window = "";
      }

      if (_windows_reloaded[runtime.window_id] == 1)
        _windows_reloaded[runtime.window_id] = 2;

      if (_debug_context_frame_path == runtime.html_frame_path &&
          _selected_window == runtime.window_id &&
          runtimeId != _selected_runtime_id )
      {
        this.setSelectedRuntimeId(runtimeId);
      }

      if (runtime.window_id == _selected_window ||
          runtime.opener_window_id == _selected_window)
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
      host_tabs.setActiveTab(host_tabs_set_active_tab);

    if(host_tabs_update_active_tab)
      host_tabs.updateActiveTab();
  };

  this.runtime_has_dom = function(rt_id)
  {
    // description is only available in newer Core versions, so if it's undefined it has DOM
    return _runtimes[rt_id] && (_runtimes[rt_id].description == "document" ||
                                 _runtimes[rt_id].description === undefined);
  };

  var _scripts = {};

/** checks if that script is already known from a previous runtime
  * checks first for the url and the for the script data.
  * Both checks are not really reliable.
  * TODO we need a better logic to handle this
  */
  this._register_script = function(script)
  {
    var sc = null, is_known = false;
    var new_script_id = script.script_id;
    var new_rt = _runtimes[script.runtime_id];
    var old_rt = null;
    var line_nr = '';

    for (sc in _scripts)
    {
      old_rt = _runtimes[_scripts[sc].runtime_id] ||
               _old_runtimes[_scripts[sc].runtime_id] || {};
      // TODO check for script-type as well?
      if ((
            (_scripts[sc].uri && _scripts[sc].uri == script.uri)
            || _scripts[sc].script_data == script.script_data
          ) &&
          old_rt.uri == new_rt.uri &&
          (old_rt.window_id == new_rt.window_id ||
            (new_rt.opener_window_id &&
             old_rt.opener_window_id == new_rt.opener_window_id)) &&
          old_rt.html_frame_path == new_rt.html_frame_path)
      {
        is_known = true;
        break;
      }
    }
    _scripts[new_script_id] = script;
    if (is_known)
    {
      this._bps.copy_breakpoints(script, _scripts[sc]);
      if (_scripts[sc].script_id == _selected_script_id)
      {
        _selected_script_id = new_script_id;
      }
      // the script could be in a pop-up window
      if (old_rt.window_id == new_rt.window_id)
      {
        _replaced_scripts[sc] = script;
        delete _scripts[sc];
      }
    }

    var callstack_scripts = window.stop_at.get_script_ids_in_callstack();

    if ((!_selected_script_id &&
         (!script.is_console_script ||
          callstack_scripts.contains(new_script_id))) ||
        (is_injected_script(_selected_script_type) &&
         !is_injected_script(script.script_type)))
    {
      _selected_script_id = new_script_id;
      _selected_script_type = script.script_type;
      views['js_source'].update();
      window['cst-selects']['js-script-select'].updateElement();
      window['cst-selects']['cmd-runtime-select'].updateElement();
    }
  }

  var script_count = 1;

  var getScriptId = function()
  {
    return ( script_count++ ).toString();
  }

  var log_thread = function(type, message, rt_id, thread_id)
  {

    const
    THREAD_TYPE = 3,
    PARENT_THREAD_ID = 2,
    STATUS = 2,
    SCRIPT_ID = 2,
    LINE_NUMBER = 3,
    STOPPED_REASON = 4,
    INDENT = "  ",
    NL = '\n',
    EVENT_TYPES = ['thread started', 'thread stopped', 'thread finished'];

    var log = [EVENT_TYPES[type], ':', NL];

    if (_runtime_stopped_queue.length)
    {
      log.push(INDENT, _runtime_stopped_queue.join(' '));
    }
    log.push(INDENT, 'runtime id: ', rt_id, NL);
    log.push(INDENT, 'thread id: ', thread_id, NL);
    /*
    thread.threads = [];
    for( i = 0; key = _runtime_ids[i]; i++ )
    {
      if (cur in _thread_queues && _thread_queues[cur].length )
      {
        thread.threads[thread.threads.length] = [cur].concat(_thread_queues[cur]);
      }
    }
    */
    switch (type)
    {
      case THREAD_STARTED:
      {
        log.push(INDENT, 'parent thread id: ', message[PARENT_THREAD_ID], NL);
        log.push(INDENT, 'thread type: ', message[THREAD_TYPE], NL);
        break;
      }
      case THREAD_STOPPED_AT:
      {
        log.push(INDENT, 'script id: ', message[SCRIPT_ID], NL);
        log.push(INDENT, 'line number: ', message[LINE_NUMBER], NL);
        log.push(INDENT, 'stopped reason: ', message[STOPPED_REASON], NL);
        break;
      }
      case THREAD_FINISHED:
      {
        log.push(INDENT, 'status: ', message[STATUS], NL);
        break;
      }
    }
    _threads.push(log.join(''));
  }

  this.setActiveWindowId = function(window_id)
  {
    // set the debug context
    if (window_id != _selected_window)
    {
      _selected_window = window_id;
      cleanUpThreadOnContextChange();
      settings.runtimes.set('selected-window', window_id);
    }
  }

  // new in proto 4

  // window id is the new debug context
  // called to create all runtimes on setting or changing the debug context
  this.createAllRuntimesOnDebugContextChange = function(win_id)
  {
    _debug_context_frame_path = '';
    _windows_reloaded = {};
    _selected_script_id = '';
    /*
    if( _is_first_call_create_all_runtimes_on_debug_context_change )
    {
      stop_at.setInitialSettings();
      // with the STP 1 design this workaround can be removed
      _is_first_call_create_all_runtimes_on_debug_context_change = false;
    }
    */
    var tag =  tagManager.set_callback(this, this._set_new_debug_context, [win_id]);
    _ecma_debugger.requestListRuntimes(tag, [[],1]);
  }

  this._set_new_debug_context = function(status, message, win_id)
  {
    if (status !== SUCCESS)
      return;

    if (message[RUNTIME_LIST])
      message[RUNTIME_LIST].forEach(this._handle_runtime, this);
    host_tabs.setActiveTab(win_id);
    if (message[RUNTIME_LIST] && message[RUNTIME_LIST].length)
    {
      if (settings.runtimes.get("reload-runtime-automatically"))
        this.reloadWindow();
    }
    else
    {
      if (win_id in _window_ids)
        this._reset_window(win_id);
      else
        _window_ids[win_id] = true;
      _selected_runtime_id = "";
      _selected_script_id = "";
      views["js_source"].update();
      window["cst-selects"]["js-script-select"].updateElement();
      window["cst-selects"]["cmd-runtime-select"].updateElement();
    }
  }

  this.getThreads = function()
  {
    return _threads;
  }

  this.clearThreadLog = function()
  {
    _threads = [];
  }

  this.onNewScript = function(status, message)
  {
    var script = new cls.NewScript(message);
    if (script.is_console_script = is_console_script(script.script_data))
      script.script_type = "Console Script";

    if( is_runtime_of_debug_context(script.runtime_id))
    {
      registerRuntime(script.runtime_id);
      this._register_script(script);
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

    if(_scripts[message[SCRIPT_ID]])
    {
      var error = _scripts[message[SCRIPT_ID]].parse_error =
      {
        runtime_id: message[RUNTIME_ID],
        script_id: message[SCRIPT_ID],
        line_nr: message[LINE_NUMBER],
        offset: message[OFFSET],
        context: message[CONTEXT],
        description: message[DESCRIPTION]
      };
      if (settings['js_source'].get('error') ||
          (views.js_source.isvisible() &&
           views.js_source.getCurrentScriptId() == message[SCRIPT_ID]))
      {
        if (!views.js_source.isvisible())
        {
          window.topCell.showView('js_source');
        }
        runtimes.setSelectedScript(error.script_id);
        views.js_source.showLine(error.script_id, error.line_nr, true);
      }
    }
    else
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
        "script source is missing in onParseError handler in runtimes");
    }

  }

  // TODO client side therads handling needs a revision

  var _thread_queues_obsolete = {};
  var _thread_queues = {};

  var _runtime_stopped_queue = [];
  var _stopped_threads = {};

  // for debug purpose
  var print_threads = function(label, msg)
  {
    var log = label + ': ' + JSON.stringify(msg) + '\n' +
      '_thread_queues: ' + JSON.stringify(_thread_queues) + '\n' +
      '_runtime_stopped_queue: ' + JSON.stringify(_runtime_stopped_queue) + '\n' +
      '_stopped_threads: ' + JSON.stringify(_stopped_threads) + '\n';
    opera.postError(log);
  };

  var cleanUpThreadOnContextChange = function()
  {
    const THREAD_ID = 1;
    // release all stopped events
    while (_runtime_stopped_queue.length)
    {
      var rt_id = _runtime_stopped_queue.shift();
      var thread = _stopped_threads[rt_id].shift();
      if (thread)
      {
        var msg = [rt_id, thread[THREAD_ID], 'run'];
        services['ecmascript-debugger'].requestContinueThread(0, msg);
      }
    }
    _thread_queues_obsolete = {};
    _thread_queues = {};
    _stopped_threads = {};
    _runtime_stopped_queue = [];
  }

  var is_runtime_of_debug_context = function(rt_id)
  {
    /*
      TODO remove this check
      everything which passes the window manager filter
      is part of the debug context
    */

    var rt = _runtimes[rt_id];
    return rt && (rt.window_id == _selected_window ||
                  (rt = _window_top_rt_map[rt.window_id]) &&
                  rt.opener_window_id == _selected_window);
  }

  var clear_thread_id = function(rt_id, thread_id)
  {
    var current_thread = _thread_queues[rt_id];
    // it seems that the order of the thread-finished events can get reversed
    // TODO this is a temporary fix for situations where a threads
    // finishes in a runtime whre it has never started
    if (current_thread)
    {
      for (var i = 0 ; cur = current_thread[i]; i++)
      {
        if (cur == thread_id)
        {
          current_thread.splice(i, 1);
          break;
        }
      }
    }
    else
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      "got a thread finished event \n" +
                      "in a runtime where the thread \n"+
                      "has never started: "+ rt_id + " " + thread_id);
    }
  };

  this.onThreadStarted = function(status, message)
  {
    var RUNTIME_ID = 0;
    var THREAD_ID = 1;
    var PARENT_THREAD_ID = 2;
    var rt_id = message[RUNTIME_ID];
    var id = message[THREAD_ID];
    var parent_thread_id = message[PARENT_THREAD_ID];
    if (!_thread_queues[rt_id])
      _thread_queues[rt_id] = [];
    _thread_queues[rt_id].push(id);
  };

  this.onThreadStoppedAt = function(status, message)
  {
    var RUNTIME_ID = 0;
    var THREAD_ID = 1;
    var rt_id = message[RUNTIME_ID];
    var thread_id = message[THREAD_ID];
    var current_thread = _thread_queues[rt_id];
    if (!stop_at.is_stopped &&
        (!current_thread /* in case the window was switched */ ||
         thread_id == current_thread.last))
    {
      stop_at.handle(message);
    }
    else
    {
      if (!_stopped_threads[rt_id])
        _stopped_threads[rt_id] = [];
      _stopped_threads[rt_id].push(message);
      _runtime_stopped_queue.push(rt_id);
    }
  };

  this.onThreadFinished = function(status, message)
  {
    /* TODO
    status "completed" | "unhandled-exception" | "aborted" | "cancelled-by-scheduler"
    */
    var RUNTIME_ID = 0;
    var THREAD_ID = 1;
    var STATUS = 2;
    var rt_id = message[RUNTIME_ID];
    var thread_id = message[THREAD_ID];
    clear_thread_id(rt_id, thread_id);
    if (message[STATUS] == "cancelled-by-scheduler" && stop_at.is_stopped)
      stop_at.on_thread_cancelled(message);

    if (!stop_at.is_stopped && _runtime_stopped_queue.length)
      stop_at.handle(_stopped_threads[_runtime_stopped_queue.shift()].shift());
  };

  this.onThreadMigrated = function(status, message)
  {
    var THREAD_ID = 0;
    var FROM_RUNTIME_ID = 1;
    var TO_RUNTIME_ID = 2;
    var from_rt_id = message[FROM_RUNTIME_ID];
    var to_rt_id = message[TO_RUNTIME_ID];
    var thread_id = message[THREAD_ID];
    var from_thread_queue = _thread_queues[from_rt_id];
    if (from_thread_queue && from_thread_queue.contains(thread_id))
    {
      clear_thread_id(from_rt_id, thread_id);
      if (!_thread_queues[to_rt_id])
        _thread_queues[to_rt_id] = [];
      _thread_queues[to_rt_id].push(thread_id);
    }
    else
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      "not possible to migrate thread");
  };

  // messages.post('host-state', {state: 'ready'});
  // fires when stop_at releases the control to the host
  // if there is already a <thread-stopped> event in the queue
  // it has to be handled here
  var onHostStateChange = function(msg)
  {
    if (!stop_at.is_stopped && _runtime_stopped_queue.length)
    {
      stop_at.handle(_stopped_threads[_runtime_stopped_queue.shift()].shift());
    }
  }

  this.onRuntimeStopped = function(status, message)
  {
    var rt_id = message[0];
    if(rt_id)
    {
      this._remove_runtime(rt_id);
      host_tabs.updateActiveTab();
      messages.post('runtime-stopped', {id: rt_id} );
    }
  }

  this.getActiveWindowId = function()
  {
    return _selected_window;
  }

  this.get_dom_runtimes = function(get_scripts)
  {
    var rts = this.getRuntimes(_selected_window);
    var rt = null;
    for (var i = 0; (rt = rts[i]) && !rt.selected; i++);
    if (!rt && rts[0])
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE + 'no runtime selected');
      return;
    }

    var dom_rts = [];
    var rt_map = {};

    for (var i = 0, rt_id = 0; rt = rts[i]; i++)
    {
      rt_id = rt.runtime_id;
      if (rt.description == "extensionjs")
      {
        var owner_rt = rt_map[rt.uri];
        if (owner_rt)
        {
          var rt_obj = new _ext_rt_class(rt);
          if (get_scripts)
            rt_obj.scripts = this.getScripts(rt_id, true);

          owner_rt.extensions.push(rt_obj);
        }
        else
          opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                          'extension rt without owner rt in get_dom_runtimes');
      }
      else
      {
        var rt_obj =  new _dom_rt_class(rt);
        if (get_scripts)
        {
          var scripts = this.getScripts(rt_id, true);
          var browser_js = null;
          var user_js_s = [];
          for (var j = scripts.length - 1, script; script = scripts[j]; j--)
          {
            switch (script.script_type)
            {
              case "Browser JS":
                browser_js = scripts.splice(j, 1)[0];
                break;

              case "User JS":
                user_js_s.push(scripts.splice(j, 1)[0]);
                break;
            }
          }
          rt_obj.scripts = scripts;
          rt_obj.browser_js = browser_js;
          rt_obj.user_js_s = user_js_s;
        }
        rt_map[rt.uri] = rt_obj;
        dom_rts.push(rt_obj);
      }
    }
    return dom_rts;
  };

  this.getRuntimes = function(window_id)
  {
    var ret = [], r = '';
    for( r in _runtimes )
    {
      if ( _runtimes[r] && _runtimes[r].window_id &&
            ( _runtimes[r].window_id == window_id ||
              _runtimes[r].opener_window_id == window_id ) )
      {
        ret[ret.length] = _runtimes[r];
      }
    }
    return ret;
  }

  this.getRuntime = function(rt_id)
  {
    return _runtimes[rt_id] || null;
  }

  this.getRuntimeIdsFromWindow = function(window_id)
  {
    // first member is the top runtime
    var ret = [], r = '';
    for( r in _runtimes )
    {
      if ( _runtimes[r] && _runtimes[r].window_id &&
            ( _runtimes[r].window_id == window_id ||
              _runtimes[r].opener_window_id == window_id )
        )
      {
        if(_runtimes[r].is_top && !_runtimes[r].opener_window_id )
        {
          ret = [_runtimes[r].runtime_id].concat(ret);
        }
        else
        {
          ret[ret.length] = _runtimes[r].runtime_id;
        }

      }
    }
    return ret;
  };

  this.get_runtime_ids = function()
  {
    return this.getRuntimeIdsFromWindow(_selected_window);
  };

  this.get_dom_runtime_ids = function()
  {
    return this.getRuntimeIdsFromWindow(_selected_window).filter(this.runtime_has_dom);
  };

  this.getRuntimeIdWithURL = function(url)
  {
    var r = '';
    for( r in _runtimes )
    {
      if( _runtimes[r].uri == url )
      {
        return _runtimes[r];
      }
    }
    return null;
  }

  this.getURI = function(rt_id)
  {
    for( var r in _runtimes )
    {
      if( _runtimes[r].runtime_id == rt_id )
      {
        return _runtimes[r].uri;
      }
    }
    return '';
  }

  this.getScript = function(scriptId)
  {
    return _scripts[scriptId] || _replaced_scripts[scriptId] || null;
  }

  this.getStoppedAt = function(scriptId)
  {
    return _scripts[scriptId] && _scripts[scriptId].stop_ats || null;
  }

  this.getScriptsRuntimeId = function(scriptId)
  {
    return _scripts[scriptId] && _scripts[scriptId].runtime_id || null;
  }

  this.getScriptSource = function(scriptId)
  {
    // script_data can be an empty string
    if( _scripts[scriptId] )
    {
      return  _scripts[scriptId].script_data
    }
    return null;
  }

  /**
    * If the without_console_scripts flag is set it will
    * still return console_scripts if they are in the current call stack
    */
  this.getScripts = function(runtime_id, without_console_scripts)
  {
    var ret = [], script = null;
    var callstack_scripts = without_console_scripts
                          ? window.stop_at.get_script_ids_in_callstack()
                          : null;
    for (var cur in _scripts)
    {
      script = _scripts[cur];
      if (script.runtime_id == runtime_id &&
          (!without_console_scripts ||
           !script.is_console_script ||
           callstack_scripts.contains(script.script_id)))
      {
        ret[ret.length] = script;
      }
    }
    return ret;
  }

  this.setObserve = function(runtime_id, observe)
  {
    if( _runtimes[runtime_id] )
    {
      _runtimes[runtime_id]['observe'] = observe;
    }
  }

  this.getObserve = function(runtime_id)
  {
    return _runtimes[runtime_id] && _runtimes[runtime_id]['observe']  || false;
  }

  // this is a temporary solution as long as we don't have a concept for tabs



  this.setSelectedRuntime = function(runtime)
  {
    var r = '';
    for( r in _runtimes )
    {
      if( _runtimes[r] == runtime )
      {
        _runtimes[r]['selected'] = true;
        _selected_runtime_id = _runtimes[r].runtime_id;
      }
      else
      {
        // the runtime could be registered but not jet parsed
        if( _runtimes[r] )
        {
          _runtimes[r]['selected'] = false;
        }
      }
    }
  }
  // only one script can be selected at a time
  this.setSelectedScript = function( script_id )
  {
    _selected_script_id = script_id;
    window['cst-selects']['js-script-select'].updateElement();
  }

  this.getSelectedScript = function()
  {
    return _selected_script_id;
  }

  this.setSelectedRuntimeId = function(id)
  {
    if (_runtimes[id])
    {
      this.setSelectedRuntime(_runtimes[id]);
    }
    else
    {
      _next_runtime_id_to_select = id;
    }
  }

  this.getSelectedRuntimeId = function()
  {
    return _selected_runtime_id;
  }

  this.getSelecetdScriptIdFromSelectedRuntime = function()
  {
    var scripts = this.getScripts(_selected_runtime_id), script = null, i = 0;
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
    return  _scripts[scriptId] && _scripts[scriptId].runtime_id || null;
  }

  this.reloadWindow = function()
  {
    if (_selected_window)
    {
      if (!_windows_reloaded[_selected_window])
        _windows_reloaded[_selected_window] = 1;

      var rt_id = this.getRuntimeIdsFromWindow(_selected_window)[0];
      if (window.services['ecmascript-debugger'] &&
          window.services['ecmascript-debugger'].is_enabled &&
          // For background processes we can not use the exec service.
          // Background processes have no UI window to dispatch an exec command.
          // Background processes so far are e.g. unite services or
          // extension background processes.
          // They all use the widget protocol.
          ((rt_id && _runtimes[rt_id].uri.indexOf("widget://") != -1) ||
           !(window.services.exec && window.services.exec.is_implemented)))
      {
        var msg = [rt_id, 0, 0, 'location.reload()'];
        window.services['ecmascript-debugger'].requestEval(0, msg);
      }
      else if (window.services.exec && window.services.exec.is_implemented)
      {
        var msg = [[["reload",
                     null,
                     window.window_manager_data.get_debug_context()]]];
        window.services.exec.requestExec(cls.TagManager.IGNORE_RESPONSE, msg);
      }
    }
  };

  this.isReloadedWindow = function(window_id)
  {
    return _windows_reloaded[window_id] == 2;
  }

  this.is_runtime_of_reloaded_window = function(rt_id)
  {
    var rt = this.getRuntime(rt_id);
    var win_id = rt && rt.window_id;
    return win_id ? this.isReloadedWindow(win_id) : false;
  };

  this.get_execution_context = function()
  {
    var selected_frame = window.stop_at.getSelectedFrame();
    return selected_frame
         ? {rt_id: selected_frame.runtime_id,
            thread_id: selected_frame.thread_id,
            frame_index: selected_frame.index}
         : {rt_id: this.getSelectedRuntimeId(),
            thread_id: 0,
            frame_index: 0};
  };

  var onThreadStopped = function(msg)
  {
    var script_id = msg.stop_at.script_id;
    // only scripts from the selected runtime are registered
    if( script_id && _scripts[script_id] )
    {
      var stop_ats = _scripts[script_id].stop_ats;
      stop_ats[stop_ats.length] = msg.stop_at;
    }


  }

  var onThreadContinue = function(msg)
  {
    var
    script_id = msg.stop_at.script_id,
    stop_ats = _scripts[script_id] && _scripts[script_id].stop_ats,
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

  var _on_console_script_submitted = function(msg)
  {
    _submitted_scripts.push(msg.script);
  };


  this._bps = cls.Breakpoints.get_instance();

  messages.addListener("thread-stopped-event", onThreadStopped);
  messages.addListener("thread-continue-event", onThreadContinue);
  messages.addListener('host-state', onHostStateChange);
  messages.addListener('reset-state', onResetState);
  messages.addListener('window-updated', _on_window_updated);
  messages.addListener('debug-context-selected', this._on_debug_context_selected.bind(this));
  messages.addListener('console-script-submitted', _on_console_script_submitted);
  messages.addListener('profile-disabled', _on_profile_disabled);
  messages.addListener('profile-enabled', this._on_profile_enabled.bind(this));

  this.bind = function(_ecma_debugger)
  {
    _ecma_debugger.handleEval = function(status, message) {};
    _ecma_debugger.handleListRuntimes = this.handleListRuntimes.bind(this);
    _ecma_debugger.onRuntimeStarted = this.onRuntimeStarted.bind(this);
    _ecma_debugger.onRuntimeStopped = this.onRuntimeStopped.bind(this);
    _ecma_debugger.onNewScript = this.onNewScript.bind(this);
    _ecma_debugger.onThreadStarted = this.onThreadStarted.bind(this);
    _ecma_debugger.onThreadStoppedAt = this.onThreadStoppedAt.bind(this);
    _ecma_debugger.onThreadFinished = this.onThreadFinished.bind(this);
    _ecma_debugger.onThreadMigrated = this.onThreadMigrated.bind(this);
    _ecma_debugger.onParseError = this.onParseError.bind(this);
    // TODO looks strange
    _ecma_debugger.addListener('window-filter-change', function(msg)
    {
      this.createAllRuntimesOnDebugContextChange(msg.filter[1][0]);
    }.bind(this));
  };
}
