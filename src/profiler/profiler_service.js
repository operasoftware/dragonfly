"use strict";

/**
 * @constructor
 */
var ProfilerService = function()
{
  var START_MODE_IMMEDIATE = 1;
  var START_MODE_URL = 2;

  this.__defineGetter__("is_active", function() {
    return this._is_active;
  });

  this.__defineSetter__("is_active", function() {});

  this.start_profiler = function(start_mode, window_id, callback)
  {
    var tag = this._tag_manager.set_callback(this, function(status, msg) {
      this._is_active = true;
      if (callback)
        callback(status, msg);
    });
    this._profiler.requestStartProfiler(tag, [start_mode || START_MODE_IMMEDIATE,
                                              this._window_id]);
  };

  this.stop_profiler = function(session_id, callback)
  {
    var tag = this._tag_manager.set_callback(this, function(status, msg) {
      this._is_active = false;
      if (callback)
        callback(status, msg);
    });
    this._profiler.requestStopProfiler(tag, [session_id]);
  };

  this.get_events = function(session_id, timeline_id, mode, event_id,
                             max_depth, event_type_list, interval, callback)
  {
    var tag = this._tag_manager.set_callback(this, function(status, msg) {
      if (callback)
        callback(status, msg);
    });
    this._profiler.requestGetEvents(tag, [session_id,
                                          timeline_id,
                                          mode,
                                          event_id,
                                          max_depth,
                                          event_type_list,
                                          interval]);
  };

  this.release_session = function(session_id)
  {
    this._profiler.requestReleaseSession(null, [session_id]);
  };

  this._on_debug_context_selected = function(msg)
  {
    this._window_id = msg.window_id;
  };

  this.get_window_id = function()
  {
    return this._window_id;
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

ProfilerService.EventTypes = {
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

ProfilerService.Modes = {
  ALL: 1,
  REDUCE_UNIQUE_TYPES: 2,
  REDUCE_UNIQUE_EVENTS: 3,
  REDUCE_ALL: 4
};

