window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["5.0"] || (cls.EcmascriptDebugger["5.0"] = {});
cls.EcmascriptDebugger["5.0"].name = 'ecmascript-debugger';

/**
  * @constructor 
  * @extends ServiceBase
  * generated with opprotoc from the service definitions
  */

cls.EcmascriptDebugger["5.0"].Service = function()
{
  /**
    * The name of the service used in scope in ScopeTransferProtocol
    */
  this.name = 'ecmascript-debugger';
  this.version = '5.0';
  this.core_release = '2.4';


  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#listruntimes
  this.requestListRuntimes = function(tag, message)
  {
    opera.scopeTransmit('ecmascript-debugger', message || [], 1, tag || 0);
  }
  this.handleListRuntimes = function(status, message)
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
    opera.postError("NotBoundWarning: EcmascriptDebugger, ListRuntimes");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#continuethread
  this.requestContinueThread = function(tag, message)
  {
    opera.scopeTransmit('ecmascript-debugger', message || [], 2, tag || 0);
  }
  this.handleContinueThread = function(status, message)
  {
    opera.postError("NotBoundWarning: EcmascriptDebugger, ContinueThread");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#eval
  this.requestEval = function(tag, message)
  {
    opera.scopeTransmit('ecmascript-debugger', message || [], 3, tag || 0);
  }
  this.handleEval = function(status, message)
  {
    /*
    const
    STATUS = 0,
    TYPE = 1,
    VALUE = 2,
    OBJECT_VALUE = 3,
    // sub message ObjectValue 
    OBJECT_ID = 0,
    IS_CALLABLE = 1,
    IS_FUNCTION = 2,
    OBJECTVALUE_TYPE = 3,
    PROTOTYPE_ID = 4,
    NAME = 5;
    */
    opera.postError("NotBoundWarning: EcmascriptDebugger, Eval");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#examineobjects
  this.requestExamineObjects = function(tag, message)
  {
    opera.scopeTransmit('ecmascript-debugger', message || [], 4, tag || 0);
  }
  this.handleExamineObjects = function(status, message)
  {
    /*
    const
    OBJECT_LIST = 0,
    // sub message ObjectInfo 
    VALUE = 0,
    PROPERTY_LIST = 1,
    // sub message ObjectValue 
    OBJECT_ID = 0,
    IS_CALLABLE = 1,
    IS_FUNCTION = 2,
    TYPE = 3,
    PROTOTYPE_ID = 4,
    NAME = 5;
    // sub message Property 
    PROPERTY_NAME = 0,
    PROPERTY_TYPE = 1,
    PROPERTY_VALUE = 2,
    OBJECT_VALUE = 3;
    */
    opera.postError("NotBoundWarning: EcmascriptDebugger, ExamineObjects");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#spotlightobject
  this.requestSpotlightObject = function(tag, message)
  {
    opera.scopeTransmit('ecmascript-debugger', message || [], 5, tag || 0);
  }
  this.handleSpotlightObject = function(status, message)
  {
    opera.postError("NotBoundWarning: EcmascriptDebugger, SpotlightObject");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#addbreakpoint
  this.requestAddBreakpoint = function(tag, message)
  {
    opera.scopeTransmit('ecmascript-debugger', message || [], 6, tag || 0);
  }
  this.handleAddBreakpoint = function(status, message)
  {
    opera.postError("NotBoundWarning: EcmascriptDebugger, AddBreakpoint");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#removebreakpoint
  this.requestRemoveBreakpoint = function(tag, message)
  {
    opera.scopeTransmit('ecmascript-debugger', message || [], 7, tag || 0);
  }
  this.handleRemoveBreakpoint = function(status, message)
  {
    opera.postError("NotBoundWarning: EcmascriptDebugger, RemoveBreakpoint");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#addeventhandler
  this.requestAddEventHandler = function(tag, message)
  {
    opera.scopeTransmit('ecmascript-debugger', message || [], 8, tag || 0);
  }
  this.handleAddEventHandler = function(status, message)
  {
    opera.postError("NotBoundWarning: EcmascriptDebugger, AddEventHandler");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#removeeventhandler
  this.requestRemoveEventHandler = function(tag, message)
  {
    opera.scopeTransmit('ecmascript-debugger', message || [], 9, tag || 0);
  }
  this.handleRemoveEventHandler = function(status, message)
  {
    opera.postError("NotBoundWarning: EcmascriptDebugger, RemoveEventHandler");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#setconfiguration
  this.requestSetConfiguration = function(tag, message)
  {
    opera.scopeTransmit('ecmascript-debugger', message || [], 10, tag || 0);
  }
  this.handleSetConfiguration = function(status, message)
  {
    opera.postError("NotBoundWarning: EcmascriptDebugger, SetConfiguration");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#getbacktrace
  this.requestGetBacktrace = function(tag, message)
  {
    opera.scopeTransmit('ecmascript-debugger', message || [], 11, tag || 0);
  }
  this.handleGetBacktrace = function(status, message)
  {
    /*
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
    IS_CALLABLE = 1,
    IS_FUNCTION = 2,
    TYPE = 3,
    PROTOTYPE_ID = 4,
    NAME = 5;
    */
    opera.postError("NotBoundWarning: EcmascriptDebugger, GetBacktrace");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#break
  this.requestBreak = function(tag, message)
  {
    opera.scopeTransmit('ecmascript-debugger', message || [], 12, tag || 0);
  }
  this.handleBreak = function(status, message)
  {
    opera.postError("NotBoundWarning: EcmascriptDebugger, Break");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#inspectdom
  this.requestInspectDom = function(tag, message)
  {
    opera.scopeTransmit('ecmascript-debugger', message || [], 13, tag || 0);
  }
  this.handleInspectDom = function(status, message)
  {
    /*
    const
    NODE_LIST = 0,
    // sub message NodeInfo 
    OBJECT_ID = 0,
    TYPE = 1,
    NAME = 2,
    DEPTH = 3,
    NAMESPACE_PREFIX = 4,
    ATTRIBUTE_LIST = 5,
    CHILDREN_LENGTH = 6,
    VALUE = 7,
    PUBLIC_ID = 8,
    SYSTEM_ID = 9,
    // sub message Attribute 
    NAME_PREFIX = 0,
    ATTRIBUTE_NAME = 1,
    ATTRIBUTE_VALUE = 2;
    */
    opera.postError("NotBoundWarning: EcmascriptDebugger, InspectDom");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#cssgetindexmap
  this.requestCssGetIndexMap = function(tag, message)
  {
    opera.scopeTransmit('ecmascript-debugger', message || [], 22, tag || 0);
  }
  this.handleCssGetIndexMap = function(status, message)
  {
    /*
    const
    NAME_LIST = 0;
    */
    opera.postError("NotBoundWarning: EcmascriptDebugger, CssGetIndexMap");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#cssgetallstylesheets
  this.requestCssGetAllStylesheets = function(tag, message)
  {
    opera.scopeTransmit('ecmascript-debugger', message || [], 23, tag || 0);
  }
  this.handleCssGetAllStylesheets = function(status, message)
  {
    /*
    const
    STYLESHEET_LIST = 0,
    // sub message Stylesheet 
    OBJECT_ID = 0,
    IS_DISABLED = 1,
    HREF = 2,
    TITLE = 3,
    TYPE = 4,
    MEDIA_LIST = 5,
    OWNER_NODE_ID = 6,
    OWNER_RULE_ID = 7,
    PARENT_STYLESHEET_ID = 8;
    */
    opera.postError("NotBoundWarning: EcmascriptDebugger, CssGetAllStylesheets");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#cssgetstylesheet
  this.requestCssGetStylesheet = function(tag, message)
  {
    opera.scopeTransmit('ecmascript-debugger', message || [], 24, tag || 0);
  }
  this.handleCssGetStylesheet = function(status, message)
  {
    /*
    const
    RULE_LIST = 0,
    // sub message StylesheetRule 
    TYPE = 0,
    STYLESHEET_ID = 1,
    RULE_ID = 2,
    INDEX_LIST = 3,
    VALUE_LIST = 4,
    PRIORITY_LIST = 5,
    SELECTOR_LIST = 6,
    SPECIFICITY_LIST = 7,
    MEDIA_LIST = 8,
    STYLESHEETRULE_RULE_LIST = 9,
    HREF = 10,
    IMPORT_STYLESHEET_ID = 11,
    PSEUDO_CLASS = 12,
    CHARSET = 13;
    */
    opera.postError("NotBoundWarning: EcmascriptDebugger, CssGetStylesheet");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#cssgetstyledeclarations
  this.requestCssGetStyleDeclarations = function(tag, message)
  {
    opera.scopeTransmit('ecmascript-debugger', message || [], 25, tag || 0);
  }
  this.handleCssGetStyleDeclarations = function(status, message)
  {
    /*
    const
    COMPUTED_STYLE_LIST = 0,
    NODE_STYLE_LIST = 1,
    // sub message NodeStyle 
    OBJECT_ID = 0,
    ELEMENT_NAME = 1,
    STYLE_LIST = 2,
    // sub message StyleDeclaration 
    ORIGIN = 0,
    INDEX_LIST = 1,
    VALUE_LIST = 2,
    PRIORITY_LIST = 3,
    STATUS_LIST = 4,
    SELECTOR = 5,
    SPECIFICITY = 6,
    STYLESHEET_ID = 7,
    RULE_ID = 8,
    RULE_TYPE = 9;
    */
    opera.postError("NotBoundWarning: EcmascriptDebugger, CssGetStyleDeclarations");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#getselectedobject
  this.requestGetSelectedObject = function(tag, message)
  {
    opera.scopeTransmit('ecmascript-debugger', message || [], 26, tag || 0);
  }
  this.handleGetSelectedObject = function(status, message)
  {
    /*
    const
    OBJECT_ID = 0,
    WINDOW_ID = 1,
    RUNTIME_ID = 2;
    */
    opera.postError("NotBoundWarning: EcmascriptDebugger, GetSelectedObject");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#spotlightobjects
  this.requestSpotlightObjects = function(tag, message)
  {
    opera.scopeTransmit('ecmascript-debugger', message || [], 27, tag || 0);
  }
  this.handleSpotlightObjects = function(status, message)
  {
    opera.postError("NotBoundWarning: EcmascriptDebugger, SpotlightObjects");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#releaseobjects
  this.requestReleaseObjects = function(tag, message)
  {
    opera.scopeTransmit('ecmascript-debugger', message || [], 29, tag || 0);
  }
  this.handleReleaseObjects = function(status, message)
  {
    opera.postError("NotBoundWarning: EcmascriptDebugger, ReleaseObjects");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#onruntimestarted
  this.onRuntimeStarted = function(status, message)
  {
    /*
    const
    RUNTIME_ID = 0,
    HTML_FRAME_PATH = 1,
    WINDOW_ID = 2,
    OBJECT_ID = 3,
    URI = 4;
    */
    opera.postError("NotBoundWarning: EcmascriptDebugger, OnRuntimeStarted");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#onruntimestopped
  this.onRuntimeStopped = function(status, message)
  {
    /*
    const
    RUNTIME_ID = 0;
    */
    opera.postError("NotBoundWarning: EcmascriptDebugger, OnRuntimeStopped");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#onnewscript
  this.onNewScript = function(status, message)
  {
    /*
    const
    RUNTIME_ID = 0,
    SCRIPT_ID = 1,
    SCRIPT_TYPE = 2,
    SCRIPT_DATA = 3,
    URI = 4;
    */
    opera.postError("NotBoundWarning: EcmascriptDebugger, OnNewScript");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#onthreadstarted
  this.onThreadStarted = function(status, message)
  {
    /*
    const
    RUNTIME_ID = 0,
    THREAD_ID = 1,
    PARENT_THREAD_ID = 2,
    THREAD_TYPE = 3,
    EVENT_NAMESPACE = 4,
    EVENT_TYPE = 5;
    */
    opera.postError("NotBoundWarning: EcmascriptDebugger, OnThreadStarted");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#onthreadfinished
  this.onThreadFinished = function(status, message)
  {
    /*
    const
    RUNTIME_ID = 0,
    THREAD_ID = 1,
    STATUS = 2;
    */
    opera.postError("NotBoundWarning: EcmascriptDebugger, OnThreadFinished");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#onthreadstoppedat
  this.onThreadStoppedAt = function(status, message)
  {
    /*
    const
    RUNTIME_ID = 0,
    THREAD_ID = 1,
    SCRIPT_ID = 2,
    LINE_NUMBER = 3,
    STOPPED_REASON = 4,
    BREAKPOINT_ID = 5;
    */
    opera.postError("NotBoundWarning: EcmascriptDebugger, OnThreadStoppedAt");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#onhandleevent
  this.onHandleEvent = function(status, message)
  {
    /*
    const
    OBJECT_ID = 0,
    HANDLER_ID = 1,
    EVENT_TYPE = 2;
    */
    opera.postError("NotBoundWarning: EcmascriptDebugger, OnHandleEvent");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#onobjectselected
  this.onObjectSelected = function(status, message)
  {
    /*
    const
    OBJECT_ID = 0,
    WINDOW_ID = 1,
    RUNTIME_ID = 2;
    */
    opera.postError("NotBoundWarning: EcmascriptDebugger, OnObjectSelected");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptDebugger.html#onparseerror
  this.onParseError = function(status, message)
  {
    /*
    const
    RUNTIME_ID = 0,
    SCRIPT_ID = 1,
    LINE_NUMBER = 2,
    OFFSET = 3,
    CONTEXT = 4,
    DESCRIPTION = 5;
    */
    opera.postError("NotBoundWarning: EcmascriptDebugger, OnParseError");
  }
}
