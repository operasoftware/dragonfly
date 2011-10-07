window.cls || (window.cls = {});

cls.ProfilerService = function()
{
  this.data = new cls.ProfilerData();
  this.is_active = false;
  this._profiler = window.services["profiler"];
  this._tag_manager = window.tag_manager;
  this._window_id = 0;

  const START_MODE_IMMEDIATE = 1;
  const START_MODE_URL = 2;

  this.start_profiler = function(start_mode, window_id, callback)
  {
    var tag = this._tag_manager.set_callback(this, function(status, msg) {
      this.is_active = true;
      if (callback)
      {
        callback(status, msg);
      }
    });
    this._profiler.requestStartProfiler(tag, [start_mode || START_MODE_IMMEDIATE,
                                              this._window_id]);
  };

  this.stop_profiler = function(session_id, callback)
  {
    var tag = this._tag_manager.set_callback(this, function(status, msg) {
      this.is_active = false;
      if (callback)
      {
        callback(status, msg);
      }
    });
    this._profiler.requestStopProfiler(tag, [session_id]);
  };

  this.get_events = function(session_id, timeline_id, mode, event_id,
                             max_depth, event_type_list, interval, callback)
  {
    var tag = this._tag_manager.set_callback(this, function(status, msg) {
      if (callback)
      {
        callback(status, msg);
      }
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

  window.messages.addListener("debug-context-selected", this._on_debug_context_selected.bind(this));
};

cls.ProfilerService.GENERIC = 1;
cls.ProfilerService.PROCESS = 2;
cls.ProfilerService.DOCUMENT_PARSING = 3;
cls.ProfilerService.CSS_PARSING = 4;
cls.ProfilerService.SCRIPT_COMPILATION = 5;
cls.ProfilerService.THREAD_EVALUATION = 6;
cls.ProfilerService.REFLOW = 7;
cls.ProfilerService.STYLE_RECALCULATION = 8;
cls.ProfilerService.CSS_SELECTOR_MATCHING = 9;
cls.ProfilerService.LAYOUT = 10;
cls.ProfilerService.PAINT = 11;

