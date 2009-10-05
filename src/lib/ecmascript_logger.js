window.cls || (window.cls = {});
cls.EcmascriptLogger || (cls.EcmascriptLogger = {});
cls.EcmascriptLogger["2.0"] || (cls.EcmascriptLogger["2.0"] = {});
cls.EcmascriptLogger["2.0"].name = 'ecmascript-logger';

/**
  * @constructor 
  * @extends ServiceBase
  * generated with opprotoc from the service definitions
  */

cls.EcmascriptLogger["2.0"].Service = function()
{
  /**
    * The name of the service used in scope in ScopeTransferProtocol
    */
  this.name = 'ecmascript-logger';
  this.version = '2.0';
  this.core_release = '2.4';


  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptLogger.html#configure
  this.requestConfigure = function(tag, message)
  {
    opera.scopeTransmit('ecmascript-logger', message || [], 1, tag || 0);
  }
  this.handleConfigure = function(status, message)
  {
    opera.postError("NotBoundWarning: EcmascriptLogger, Configure");
  }

  // see http://dragonfly.opera.com/app/scope-interface/EcmascriptLogger.html#onnewscript
  this.onNewScript = function(status, message)
  {
    /*
    const
    CONTEXT = 0,
    URL = 1,
    SOURCE = 2;
    */
    opera.postError("NotBoundWarning: EcmascriptLogger, OnNewScript");
  }
}
