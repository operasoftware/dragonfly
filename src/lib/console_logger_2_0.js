window.cls || (window.cls = {});
cls.ConsoleLogger || (cls.ConsoleLogger = {});
cls.ConsoleLogger["2.0"] || (cls.ConsoleLogger["2.0"] = {});
cls.ConsoleLogger["2.0"].name = 'console-logger';

/**
  * @constructor 
  * @extends ServiceBase
  * generated with hob from the service definitions
  */

cls.ConsoleLogger["2.0"].Service = function()
{
  /**
    * The name of the service used in scope in ScopeTransferProtocol
    */
  this.name = 'console-logger';
  this.version = '2.0';


  // see http://dragonfly.opera.com/app/scope-interface/ConsoleLogger.html#onconsolemessage
  this.onConsoleMessage = function(status, message)
  {
    /*
    const
    WINDOW_ID = 0,
    TIME = 1,
    DESCRIPTION = 2,
    URI = 3,
    CONTEXT = 4,
    SOURCE = 5,
    SEVERITY = 6;
    */
    opera.postError("NotBoundWarning: ConsoleLogger, OnConsoleMessage");
  }
}
