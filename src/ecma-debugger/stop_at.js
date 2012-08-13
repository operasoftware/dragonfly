window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * @constructor
  */

cls.EcmascriptDebugger["6.0"].StopAt = function()
{

  /**
  * two layers are needed.
  * stop_at script must be enabled allways to be able to reasign breakpoints.
  */

  var stop_at_settings =
  {
    script: 1,
    exception: 0,
    error: 0,
    abort: 0,
    gc: 0,
    debugger_statement: 1,
    reformat_javascript: 1,
    use_reformat_condition: 1,
  }

  var stop_at_id_map =
  {
    script: 0,
    exception: 1,
    error: 2,
    abort: 3,
    gc: 4,
    debugger_statement: 5,
    reformat_javascript: 6,
    use_reformat_condition: 7,
  }

  var requires_version_map =
  {
    "6": [6, 13],
    "7": [6, 13],
  };

  var reformat_condition =
  [
    "var MAX_SLICE = 5000;",
    "var LIMIT = 11;",
    "var re = /\\s+/g;",
    "var ws = 0;",
    "var m = null;",
    "var src = scriptData.slice(0, MAX_SLICE);",
    "while (m = re.exec(src))",
    "  ws += m[0].length;",
    "",
    "return (100 * ws / src.length) < LIMIT;",
  ].join("");

  var self = this;

  var ecma_debugger = window.services['ecmascript-debugger'];

  var stopAt = {}; // there can be only one stop at at the time

  var runtime_id = '';

  var callstack = [];
  var return_values = {};

  var __script_ids_in_callstack = [];

  var __controls_enabled = false;

  var __is_stopped = false;

  var __stopAtId = 1;

  var __selected_frame_index = -1;

  var cur_inspection_type = '';

  var getStopAtId = function()
  {
    return __stopAtId++;
  }

  var _is_initial_settings_set = false;

  var onSettingChange = function(msg)
  {
    if(msg.id == 'js_source' )
    {
      var key = msg.key;
      var value = settings['js_source'].get(key);
      stop_at_settings[key] = value;
      var message = get_config_msg();
      ecma_debugger.requestSetConfiguration(cls.TagManager.IGNORE_RESPONSE, message);

      if (msg.key == 'reformat_javascript')
      {
        new ConfirmDialog(ui_strings.D_REFORMAT_SCRIPTS,
                          function() { window.runtimes.reloadWindow(); }).show();
      }
    }
  };

  var get_config_msg = function()
  {
    var config_arr = [];
    for (var prop in stop_at_settings)
    {
      var index = stop_at_id_map[prop];
      var depending = requires_version_map[index];
      if (depending && !ecma_debugger.satisfies_version.apply(ecma_debugger, depending))
        continue;

      if (prop == "script")
        config_arr[index] = 1;
      else if (prop == "use_reformat_condition")
        config_arr[index] = stop_at_settings[prop] ? reformat_condition : "";
      else
        config_arr[index] = stop_at_settings[prop] ? 1 : 0;
    }
    return config_arr;
  };

  this.getRuntimeId = function()
  {
    return runtime_id;
  }


  this.getControlsEnabled = function()
  {
    return __controls_enabled;
  }

  this.__defineGetter__("is_stopped", function()
  {
    return __is_stopped;
  });

  this.__defineSetter__("is_stopped", function(){});

  this.getFrames = function()
  {
    return callstack; // should be copied
  }

  this.get_return_values = function()
  {
    return return_values;
  };

  this.get_script_ids_in_callstack = function()
  {
    return __script_ids_in_callstack;
  };

  this.getFrame = function(id)
  {
    return callstack[id];
  }

  this.getThreadId = function()
  {
    return stopAt && stopAt.thread_id || '';
  }

  /**
    * To get the selected frame index.
    * It can return -1 which means that no frame is selected.
    * Be aware that -1 is not a valid value in e.g. the Eval command.
    * 0 for frame index has an overloaded meaning: if the thread id is not 0
    * it means the top frame, otherwise it means no frame.
    */
  this.getSelectedFrameIndex = function()
  {
    return __selected_frame_index;
  }

  /**
    * To get the selected frame.
    * @returns null or an object with runtime_id, scope_id, thread_id and index.
    */
  this.getSelectedFrame = function()
  {
    if (__selected_frame_index > -1)
    {
      var frame = callstack[__selected_frame_index];
      return (
      {
        runtime_id: frame.rt_id,
        scope_id: frame.scope_id,
        thread_id: stopAt.thread_id,
        index: __selected_frame_index,
        argument_id: frame.argument_id,
        scope_list: frame.scope_list
      });
    }
    return null;
  }

  var parseBacktrace = function(status, message, stop_at)
  {
    const
    FRAME_LIST = 0,
    // sub message BacktraceFrame
    FUNCTION_ID = 0,
    ARGUMENT_OBJECT = 1,
    VARIABLE_OBJECT = 2,
    THIS_OBJECT = 3,
    OBJECT_VALUE = 4,
    SCRIPT_ID = 5,
    LINE_NUMBER = 6,
    // sub message ObjectValue
    OBJECT_ID = 0,
    NAME = 5,
    SCOPE_LIST = 7,
    ARGUMENT_VALUE = 8,
    THIS_VALUE = 9;

    if (status)
    {
      opera.postError("parseBacktrace failed scope message: " + message);
    }
    else
    {
      var _frames = message[FRAME_LIST], frame = null, i = 0;
      var fn_name = '', line = '', script_id = '', argument_id = '', scope_id = '';
      var _frames_length = _frames.length;
      var is_all_frames = _frames_length <= ini.max_frames;
      var line_number = 0;
      callstack = [];
      __script_ids_in_callstack = [];
      for( ; frame  = _frames[i]; i++ )
      {
        line_number = frame[LINE_NUMBER];
        // workaround for CORE-37771 and CORE-37798
        // line number of the top frame is sometime off by one or two lines
        if (!i && typeof stop_at.line_number == 'number' &&
            Math.abs(line_number - stop_at.line_number) < 3)
        {
          line_number = stop_at.line_number;
        }
        callstack[i] =
        {
          fn_name : is_all_frames && i == _frames_length - 1
                    ? ui_strings.S_GLOBAL_SCOPE_NAME
                    : frame[OBJECT_VALUE] && frame[OBJECT_VALUE][NAME] ||
                      ui_strings.S_ANONYMOUS_FUNCTION_NAME,
          line : line_number,
          script_id : frame[SCRIPT_ID],
          argument_id : frame[ARGUMENT_OBJECT],
          scope_id : frame[VARIABLE_OBJECT],
          this_id : frame[THIS_OBJECT],
          id: i,
          rt_id: stop_at.runtime_id,
          scope_list: frame[SCOPE_LIST],
          argument_value: frame[ARGUMENT_VALUE],
          this_value: frame[THIS_VALUE],
        }
        __script_ids_in_callstack[i] = frame[SCRIPT_ID];
      }

      var backtrace_frame_list = new cls.EcmascriptDebugger["6.14"].BacktraceFrameList(message);
      var return_value_list = backtrace_frame_list && backtrace_frame_list.returnValueList;
      if (return_value_list)
      {
        return_values = {
          rt_id: stop_at.runtime_id,
          return_value_list: return_value_list
        };
      }

      if( cur_inspection_type != 'frame' )
      {
        messages.post('active-inspection-type', {inspection_type: 'frame'});
      }
      messages.post('frame-selected', {frame_index: 0});
      views["callstack"].update();
      views["return-values"].update();
      if (!views.js_source.isvisible())
      {
        topCell.showView(views.js_source.id);
      }
      var top_frame = callstack[0];
      if (views.js_source.showLine(top_frame.script_id, top_frame.line))
      {
        runtimes.setSelectedScript(top_frame.script_id);
        views.js_source.showLinePointer(top_frame.line, true);
      }
      toolbars.js_source.enableButtons('continue');
      messages.post('thread-stopped-event', {stop_at: stop_at});
      messages.post('host-state', {state: 'waiting'});
      setTimeout(function(){ __controls_enabled = true;}, 50);
    }
  }

  this.setInitialSettings = function()
  {
    if (!_is_initial_settings_set)
    {
      for (var prop in stop_at_settings)
      {
        var value = window.settings['js_source'].get(prop);
        if (typeof value == "boolean")
          stop_at_settings[prop] = value;
      }
      var msg = get_config_msg();
      ecma_debugger.requestSetConfiguration(cls.TagManager.IGNORE_RESPONSE, msg);
      _is_initial_settings_set = true;
    }
  };

  this.__continue = function (mode, clear_disabled_state) //
  {
    var tag = tag_manager.set_callback(this,
                                       this._handle_continue,
                                       [mode, clear_disabled_state]);
    var msg = [stopAt.runtime_id, stopAt.thread_id, mode];
    services['ecmascript-debugger'].requestContinueThread(tag, msg);
  }

  this.continue_thread = function (mode) //
  {
    if (__controls_enabled)
    {
      this.__continue(mode, true);
    }
  }

  this._handle_continue = function(status, message, mode, clear_disabled_state)
  {
    this._clear_stop_at_error();
    callstack = [];
    return_values = {};
    __script_ids_in_callstack = [];
    runtimes.setObserve(stopAt.runtime_id, mode != 'run');
    messages.post('frame-selected', {frame_index: -1});
    messages.post('thread-continue-event', {stop_at: stopAt});
    if (clear_disabled_state)
    {
      __controls_enabled = false;
      __is_stopped = false;
      toolbars.js_source.disableButtons('continue');
    }
    messages.post('host-state', {state: 'ready'});
    window.views["return-values"].update();
  }

  this.on_thread_cancelled = function(message)
  {
    const THREAD_ID = 1;
    if (message[THREAD_ID] == stopAt.thread_id)
    {
      this._clear_stop_at_error();
      callstack = [];
      return_values = {};
      __script_ids_in_callstack = [];
      messages.post('frame-selected', {frame_index: -1});
      __controls_enabled = false;
      __is_stopped = false;
      toolbars.js_source.disableButtons('continue');
      messages.post('host-state', {state: 'ready'});
    }
  };

  this.handle = function(message)
  {
    const
    RUNTIME_ID = 0,
    THREAD_ID = 1,
    SCRIPT_ID = 2,
    LINE_NUMBER = 3,
    STOPPED_REASON = 4,
    BREAKPOINT_ID = 5,
    EXCEPTION_VALUE = 6,
    OBJECT_VALUE = 3,
    OBJECT_ID = 0;

    stopAt =
    {
      runtime_id: message[RUNTIME_ID],
      thread_id: message[THREAD_ID],
      script_id: message[SCRIPT_ID],
      line_number: message[LINE_NUMBER],
      stopped_reason: message[STOPPED_REASON],
      breakpoint_id: message[BREAKPOINT_ID]
    };

    if (message[EXCEPTION_VALUE])
    {
      var error_obj_id = message[EXCEPTION_VALUE] &&
                         message[EXCEPTION_VALUE][OBJECT_VALUE] &&
                         message[EXCEPTION_VALUE][OBJECT_VALUE][OBJECT_ID];
      if (error_obj_id)
      {
        stopAt.error = message[EXCEPTION_VALUE];
        stopAt.error_obj_id = error_obj_id;
      }
    }

    var line = stopAt.line_number;
    if (typeof line == 'number')
    {
      /**
      * This event is enabled by default to reassign breakpoints.
      * Here it must be checked if the user likes actually to stop or not.
      * At the moment this is a hack because the stop reason is not set for that case.
      * The check is if the stop reason is 'unknown' (should be 'new script')
      *
      * In version 6.6 and higher the stop reason is 'new script'.
      */
      if (stopAt.stopped_reason == 'unknown' ||
          stopAt.stopped_reason == 'new script')
      {
        runtime_id = stopAt.runtime_id;
        if (settings['js_source'].get('script')
             || runtimes.getObserve(runtime_id)
              // this is a workaround for Bug 328220
              // if there is a breakpoint at the first statement of a script
              // the event for stop at new script and the stop at breakpoint are the same
             || this._bps.script_has_breakpoint_on_line(stopAt.script_id, line))
        {
          this._stop_in_script(stopAt);
        }
        else
        {
          this.__continue('run');
        }
      }
      else
      {
        /*
          example

          "runtime_id":2,
          "thread_id":7,
          "script_id":3068,
          "line_number":8,
          "stopped_reason":"breakpoint",
          "breakpoint_id":1

        */
        var condition = this._bps.get_condition(stopAt.breakpoint_id);
        if (condition)
        {
          var tag = tagManager.set_callback(this,
                                            this._handle_condition,
                                            [stopAt]);
          var msg = [stopAt.runtime_id,
                     stopAt.thread_id,
                     0,
                     "Boolean(" + condition + ")",
                     [['dummy', 0]]];
          services['ecmascript-debugger'].requestEval(tag, msg);
        }
        else
        {
          this._stop_in_script(stopAt);
        }
      }
    }
    else
    {
      opera.postError('not a line number: ' + stopAt.line_number + '\n' +
                      JSON.stringify(stopAt))
    }
  }

  this._handle_condition = function(status, message, stop_at)
  {
    const STATUS = 0, TYPE = 1, VALUE = 2;
    if (status)
    {
      opera.postError('Evaling breakpoint condition failed');
      this.__continue('run');
    }
    else if(message[STATUS] == "completed" &&
            message[TYPE] == "boolean" &&
            message[VALUE] == "true")
    {
      this._stop_in_script(stop_at);
    }
    else
    {
      this.__continue('run');
    }
  };

  this._handle_error = function(status, message, stop_at)
  {
    if (status)
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      " error inspection failed in StopAt handle_error");
    }
    else
    {
      const
      OBJECT_CHAIN_LIST = 0,
      OBJECT_LIST = 0,
      OBJECT_VALUE = 0,
      CLASS_NAME = 4,
      PROPERTY_LIST = 1,
      OBJECT_ID = 0,
      PROP_OBJECT_VALUE = 3,
      NAME = 0,
      STRING = 2;

      var error = message &&
                  (message = message[OBJECT_CHAIN_LIST]) &&
                  (message = message[0]) &&
                  (message = message[OBJECT_LIST]) &&
                  message[0];
      if (error)
      {
        stop_at.error_class = error[OBJECT_VALUE] &&
                              error[OBJECT_VALUE][CLASS_NAME] || "Error";
        var props = error[PROPERTY_LIST];
        if (props)
        {
          for (var i = 0, prop; prop = props[i]; i++)
          {
            if (prop[NAME] == "message")
              stop_at.error_message = prop[STRING];
          }
        }

        var script = window.runtimes.getScript(stop_at.script_id);
        if (script)
        {
          script.stop_at_error = stop_at;
          window.views.js_source.show_stop_at_error();
        }
      }
    }
  };

  this._clear_stop_at_error = function()
  {
    if (stopAt.error)
    {
      var script = window.runtimes.getScript(stopAt.script_id);
      if (script)
        script.stop_at_error = null;
      window.views.js_source.clear_stop_at_error();
    }
  };

  this._stop_in_script = function(stop_at)
  {
    __is_stopped = true;
    var tag = tagManager.set_callback(null, parseBacktrace, [stop_at]);
    var msg = [stop_at.runtime_id, stop_at.thread_id, ini.max_frames];
    services['ecmascript-debugger'].requestGetBacktrace(tag, msg);
    if (stop_at.error)
    {
      var tag = tagManager.set_callback(this, this._handle_error, [stop_at]);
      var msg = [stop_at.runtime_id, [stop_at.error_obj_id], 0, 0, 0];
      window.services['ecmascript-debugger'].requestExamineObjects(tag, msg);
    }
  }

  var onRuntimeDestroyed = function(msg)
  {
    if( stopAt && stopAt.runtime_id == msg.id )
    {
      views.callstack.clearView();
      views.inspection.clearView();
      self.__continue('run');
    }

  };

  this._on_profile_disabled = function(msg)
  {
    if (msg.profile == window.app.profiles.DEFAULT)
    {
      this._clear_stop_at_error();
      callstack = [];
      __script_ids_in_callstack = [];
      window.views.js_source.clearLinePointer();
      window.views.callstack.clearView();
      window.views.inspection.clearView();
      window.messages.post('frame-selected', {frame_index: -1});
      window.messages.post('thread-continue-event', {stop_at: stopAt});
      __controls_enabled = false;
      __is_stopped = false;
      window.toolbars.js_source.disableButtons('continue');
      window.messages.post('host-state', {state: 'ready'});
    }
  };

  messages.addListener('runtime-destroyed', onRuntimeDestroyed);
  messages.addListener('profile-disabled', this._on_profile_disabled.bind(this));

  var onActiveInspectionType = function(msg)
  {
    cur_inspection_type = msg.inspection_type;
  }

  var onFrameSelected = function(msg)
  {
    __selected_frame_index = msg.frame_index;
  }

  this._bps = cls.Breakpoints.get_instance();

  messages.addListener('active-inspection-type', onActiveInspectionType);



  messages.addListener('setting-changed', onSettingChange);
  messages.addListener('frame-selected', onFrameSelected);

  this.bind = function(ecma_debugger)
  {
    var self = this;

    ecma_debugger.handleSetConfiguration =
    ecma_debugger.handleContinueThread =
    function(status, message){};


    ecma_debugger.addListener('enable-success', function()
    {
      self.setInitialSettings();
    });
  }

  this._bps = window.cls.Breakpoints.get_instance();


}
