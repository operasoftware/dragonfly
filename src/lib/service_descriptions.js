var service_descriptions = {commands:{}, responses: {}, events: {}};
service_descriptions.commands.ConsoleLogger = 
[
];
service_descriptions.commands.Exec = 
[
  "Exec",
  "GetActionInfoList",
  "SetupScreenWatcher",
  "SendMouseAction",
];
service_descriptions.commands.WindowManager = 
[
  "GetActiveWindow",
  "ListWindows",
  "ModifyFilter",
];
service_descriptions.commands.EcmascriptDebugger = 
[
  "ListRuntimes",
  "ContinueThread",
  "Eval",
  "ExamineObjects",
  "SpotlightObject",
  "AddBreakpoint",
  "RemoveBreakpoint",
  "AddEventHandler",
  "RemoveEventHandler",
  "SetConfiguration",
  "GetBacktrace",
  "Break",
  "InspectDom",
  "CssGetIndexMap",
  "CssGetAllStylesheets",
  "CssGetStylesheet",
  "CssGetStyleDeclarations",
  "GetSelectedObject",
  "SpotlightObjects",
  "ReleaseObjects",
  "SetPropertyFilter",
  "AddEventBreakpoint",
];
service_descriptions.commands.HttpLogger = 
[
];
service_descriptions.commands.Scope = 
[
  "Connect",
  "Disconnect",
  "Enable",
  "Disable",
  "Info",
  "Quit",
  "HostInfo",
  "MessageInfo",
];
service_descriptions.commands.UrlPlayer = 
[
  "CreateWindows",
  "LoadUrl",
];
service_descriptions.commands.EcmascriptLogger = 
[
  "Configure",
];
service_descriptions.events.ConsoleLogger = 
[
  "OnConsoleMessage",
];
service_descriptions.events.Exec = 
[
];
service_descriptions.events.WindowManager = 
[
  "OnWindowUpdated",
  "OnWindowClosed",
  "OnWindowActivated",
  "OnWindowLoaded",
];
service_descriptions.events.EcmascriptDebugger = 
[
  "OnRuntimeStarted",
  "OnRuntimeStopped",
  "OnNewScript",
  "OnThreadStarted",
  "OnThreadFinished",
  "OnThreadStoppedAt",
  "OnHandleEvent",
  "OnObjectSelected",
  "OnParseError",
  "OnReadyStateChanged",
  "OnConsoleLog",
  "OnConsoleTime",
  "OnConsoleTimeEnd",
  "OnConsoleTrace",
  "OnConsoleProfile",
  "OnConsoleProfileEnd",
];
service_descriptions.events.HttpLogger = 
[
  "OnRequest",
  "OnResponse",
];
service_descriptions.events.Scope = 
[
  "OnServices",
  "OnQuit",
  "OnConnectionLost",
  "OnError",
];
service_descriptions.events.UrlPlayer = 
[
  "OnUrlLoaded",
  "OnConnectionFailed",
];
service_descriptions.events.EcmascriptLogger = 
[
  "OnNewScript",
];
