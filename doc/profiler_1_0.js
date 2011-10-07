window.cls || (window.cls = {});
cls.Profiler || (cls.Profiler = {});
cls.Profiler["1.0"] || (cls.Profiler["1.0"] = {});
cls.Profiler["1.0"].name = 'profiler';

/**
  * @constructor 
  * @extends ServiceBase
  * generated with hob from the service definitions
  */

cls.Profiler["1.0"].Service = function()
{
  /**
    * The name of the service used in scope in ScopeTransferProtocol
    */
  this.name = 'profiler';
  this.version = '1.0';


  // see http://dragonfly.opera.com/app/scope-interface/Profiler.html#startprofiler
  this.requestStartProfiler = function(tag, message)
  {
    opera.scopeTransmit('profiler', message || [], 1, tag || 0);
  }
  this.handleStartProfiler = function(status, message)
  {
    /*
    const
    SESSION_ID = 0;
    */
    opera.postError("NotBoundWarning: Profiler, StartProfiler");
  }

  // see http://dragonfly.opera.com/app/scope-interface/Profiler.html#stopprofiler
  this.requestStopProfiler = function(tag, message)
  {
    opera.scopeTransmit('profiler', message || [], 2, tag || 0);
  }
  this.handleStopProfiler = function(status, message)
  {
    /*
    const
    SESSION_ID = 0,
    WINDOW_ID = 1,
    TIMELINE_LIST = 2,
    // sub message Timeline 
    TIMELINE_ID = 0,
    FRAME_ID = 1;
    */
    opera.postError("NotBoundWarning: Profiler, StopProfiler");
  }

  // see http://dragonfly.opera.com/app/scope-interface/Profiler.html#getevents
  this.requestGetEvents = function(tag, message)
  {
    opera.scopeTransmit('profiler', message || [], 3, tag || 0);
  }
  this.handleGetEvents = function(status, message)
  {
    /*
    const
    INTERVAL = 0,
    EVENT_LIST = 1,
    // sub message Interval 
    START = 0,
    END = 1;
    // sub message Event 
    TYPE = 0,
    TIME = 1,
    OVERHEAD = 2,
    HITS = 3,
    EVENT_INTERVAL = 4,
    EVENT_ID = 5,
    PARENT_EVENT_ID = 6,
    CHILD_COUNT = 7,
    AGGREGATED_TIME = 8,
    AGGREGATED_OVERHEAD = 9,
    CSS_SELECTOR_MATCHING = 10,
    THREAD_EVALUATION = 11,
    DOCUMENT_PARSING = 12,
    CSS_PARSING = 13,
    SCRIPT_COMPILATION = 14,
    PAINT = 15,
    // sub message CssSelectorMatchingEvent 
    SELECTOR = 0;
    // sub message ThreadEvaluationEvent 
    THREAD_TYPE = 0,
    EVENT_NAME = 1;
    // sub message DocumentParsingEvent 
    URL = 0;
    // sub message CssParsingEvent 
    CSSPARSINGEVENT_URL = 0;
    // sub message ScriptCompilationEvent 
    SCRIPT_TYPE = 0,
    SCRIPTCOMPILATIONEVENT_URL = 1;
    // sub message PaintEvent 
    AREA = 0,
    // sub message Area 
    X = 0,
    Y = 1,
    W = 2,
    H = 3;
    */
    opera.postError("NotBoundWarning: Profiler, GetEvents");
  }

  // see http://dragonfly.opera.com/app/scope-interface/Profiler.html#releasesession
  this.requestReleaseSession = function(tag, message)
  {
    opera.scopeTransmit('profiler', message || [], 4, tag || 0);
  }
  this.handleReleaseSession = function(status, message)
  {
    opera.postError("NotBoundWarning: Profiler, ReleaseSession");
  }
}
