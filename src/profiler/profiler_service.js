window.cls || (window.cls = {});

cls.ProfilerService = function()
{
  this.data = new cls.ProfilerData();
  this.is_active = false;
  this._profiler = window.services["profiler"];
  this._tag_manager = window.tag_manager;

  const START_MODE_IMMEDIATE = 1;
  const START_MODE_URL = 2;

  this.start_profiler = function(start_mode, window_id, callback)
  {
    start_mode = start_mode || START_MODE_IMMEDIATE;
    window_id = window_id || 3; // TODO: should be current window
    var tag = this._tag_manager.set_callback(this, function(status, msg) {
      this.is_active = true;
      if (callback)
      {
        callback(status, msg);
      }
    });
    this._profiler.requestStartProfiler(tag, [start_mode, window_id]);
  };

  this.stop_profiler = function(callback)
  {
    var tag = this._tag_manager.set_callback(this, function(status, msg) {
      this.is_active = false;
      if (callback)
      {
        callback(status, msg);
      }
    });
    this._profiler.requestStopProfiler(tag);
  };

  this.get_events = function(profile_id, timeline_id, mode, event_id,
                             max_depth, event_type_list, interval, callback)
  {
    var tag = this._tag_manager.set_callback(this, function(status, msg) {
      this.data.set_event_list(msg);
      if (callback)
      {
        callback(status, msg);
      }
    });
    this._profiler.requestGetEvents(tag, [profile_id,
                                          timeline_id,
                                          mode,
                                          event_id,
                                          max_depth,
                                          event_type_list,
                                          interval]);
  };

  this.release_profile = function(profile_id)
  {
    this._profiler.requestReleaseProfile(null, [profile_id]);
  };
};

cls.ProfilerService.GENERIC = 1;
cls.ProfilerService.PROCESS = 11;
cls.ProfilerService.DOCUMENT_PARSING = 7;
cls.ProfilerService.CSS_PARSING = 8;
cls.ProfilerService.SCRIPT_COMPILATION = 9;
cls.ProfilerService.THREAD_EVALUATION = 4;
cls.ProfilerService.REFLOW = 5;
cls.ProfilerService.STYLE_RECALCULATION = 2;
cls.ProfilerService.CSS_SELECTOR_MATCHING = 3;
cls.ProfilerService.LAYOUT = 10;
cls.ProfilerService.PAINT = 6;

