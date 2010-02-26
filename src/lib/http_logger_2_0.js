window.cls || (window.cls = {});
cls.HttpLogger || (cls.HttpLogger = {});
cls.HttpLogger["2.0"] || (cls.HttpLogger["2.0"] = {});
cls.HttpLogger["2.0"].name = 'http-logger';

/**
  * @constructor 
  * @extends ServiceBase
  * generated with hob from the service definitions
  */

cls.HttpLogger["2.0"].Service = function()
{
  /**
    * The name of the service used in scope in ScopeTransferProtocol
    */
  this.name = 'http-logger';
  this.version = '2.0';


  // see http://dragonfly.opera.com/app/scope-interface/HttpLogger.html#onrequest
  this.onRequest = function(status, message)
  {
    /*
    const
    REQUEST_ID = 0,
    WINDOW_ID = 1,
    TIME = 2,
    HEADER = 3;
    */
    opera.postError("NotBoundWarning: HttpLogger, OnRequest");
  }

  // see http://dragonfly.opera.com/app/scope-interface/HttpLogger.html#onresponse
  this.onResponse = function(status, message)
  {
    /*
    const
    REQUEST_ID = 0,
    WINDOW_ID = 1,
    TIME = 2,
    HEADER = 3;
    */
    opera.postError("NotBoundWarning: HttpLogger, OnResponse");
  }
}
