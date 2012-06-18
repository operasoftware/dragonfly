"use strict";

/**
 * @constructor
 */
var ProfilerService = function()
{
  this.__defineGetter__("is_active", function() {
    return this._is_active;
  });

  this.__defineSetter__("is_active", function() {});

  this.start_profiler = function(callback, config)
  {
    var config = config || {};
    var start_mode = config.start_mode || ProfilerService.StartMode.IMMEDIATE;
    var window_id = config.window_id || this._window_id;
    var tag = this._tag_manager.set_callback(this, function(status, msg) {
      this._is_active = true;
      if (callback)
        callback(status, msg);
    });
    var msg = [start_mode, window_id];
    this._profiler.requestStartProfiler(tag, msg);
  };

  this.stop_profiler = function(callback, config)
  {
    var config = config || {};
    var tag = this._tag_manager.set_callback(this, function(status, msg) {
      this._is_active = false;
      if (callback)
        callback(status, msg);
    });
    var msg = [config.session_id];
    this._profiler.requestStopProfiler(tag, msg);
  };

  this.get_events = function(callback, config)
  {
    var config = config || {};
    var tag = this._tag_manager.set_callback(this, function(status, msg) {
      if (callback)
        callback(status, msg);
    });
    var msg = [
      config.session_id,
      config.timeline_id,
      config.mode,
      config.event_id,
      config.max_depth,
      config.event_type_list,
      config.interval
    ];
    this._profiler.requestGetEvents(tag, msg);
  };

  this.release_session = function(callback, config)
  {
    var config = config || {};
    var tag = this._tag_manager.set_callback(this, function(status, msg) {
      if (callback)
        callback(status, msg);
    });
    var msg = [config.session_id];
    this._profiler.requestReleaseSession(tag, msg);
  };

  this.get_window_id = function()
  {
    return this._window_id;
  };

  this._on_debug_context_selected = function(msg)
  {
    this._window_id = msg.window_id;
  };

  this._init = function()
  {
    this._profiler = window.services["profiler"];
    this._tag_manager = window.tag_manager;
    this._is_active = false;
    this._window_id = 0;

    this._on_debug_context_selected_bound = this._on_debug_context_selected.bind(this);
    window.messages.addListener("debug-context-selected", this._on_debug_context_selected_bound);
  };

  this._init();
};

ProfilerService.StartMode = {
  IMMEDIATE: 1,
  URL: 2
};

ProfilerService.EventType = {
  GENERIC: 1,
  PROCESS: 2,
  DOCUMENT_PARSING: 3,
  CSS_PARSING: 4,
  SCRIPT_COMPILATION: 5,
  THREAD_EVALUATION: 6,
  REFLOW: 7,
  STYLE_RECALCULATION: 8,
  CSS_SELECTOR_MATCHING: 9,
  LAYOUT: 10,
  PAINT: 11
};

ProfilerService.Mode = {
  ALL: 1,
  REDUCE_UNIQUE_TYPES: 2,
  REDUCE_UNIQUE_EVENTS: 3,
  REDUCE_ALL: 4
};

ProfilerService.ScriptThreadType = {
  UNKNOWN: 0,
  COMMON: 1,
  TIMEOUT: 2,
  EVENT: 3,
  INLINE_SCRIPT: 4,
  JAVASCRIPT_URL: 5,
  HISTORY_NAVIGATION: 6,
  JAVA_EVAL: 7,
  DEBUGGER_EVAL: 8
};

ProfilerService.ScriptType = {
  UNKNOWN: 0,
  LINKED: 1,
  INLINE: 2,
  GENERATED: 3,
  EVAL: 4,
  TIMEOUT: 5,
  URI: 6,
  EVENT_HANDLER: 7,
  USERJS: 8,
  BROWSERJS: 9,
  EXTENSIONJS: 10,
  DEBUGGER: 11
};

