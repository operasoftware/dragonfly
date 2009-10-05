window.cls || (window.cls = {});
cls.Exec || (cls.Exec = {});
cls.Exec["2.0"] || (cls.Exec["2.0"] = {});
cls.Exec["2.0"].name = 'exec';

/**
  * @constructor 
  * @extends ServiceBase
  * generated with opprotoc from the service definitions
  */

cls.Exec["2.0"].Service = function()
{
  /**
    * The name of the service used in scope in ScopeTransferProtocol
    */
  this.name = 'exec';
  this.version = '2.0';
  this.core_release = '2.4';


  // see http://dragonfly.opera.com/app/scope-interface/Exec.html#exec
  this.requestExec = function(tag, message)
  {
    opera.scopeTransmit('exec', message || [], 1, tag || 0);
  }
  this.handleExec = function(status, message)
  {
    opera.postError("NotBoundWarning: Exec, Exec");
  }

  // see http://dragonfly.opera.com/app/scope-interface/Exec.html#getactioninfolist
  this.requestGetActionInfoList = function(tag, message)
  {
    opera.scopeTransmit('exec', message || [], 2, tag || 0);
  }
  this.handleGetActionInfoList = function(status, message)
  {
    /*
    const
    ACTION_INFO_LIST = 0,
    // sub message ActionInfo 
    NAME = 0;
    */
    opera.postError("NotBoundWarning: Exec, GetActionInfoList");
  }

  // see http://dragonfly.opera.com/app/scope-interface/Exec.html#setupscreenwatcher
  this.requestSetupScreenWatcher = function(tag, message)
  {
    opera.scopeTransmit('exec', message || [], 3, tag || 0);
  }
  this.handleSetupScreenWatcher = function(status, message)
  {
    /*
    const
    WINDOW_ID = 0,
    MD5 = 1,
    PNG = 2,
    COLOR_MATCH_LIST = 3,
    // sub message ColorMatch 
    ID = 0,
    COUNT = 1;
    */
    opera.postError("NotBoundWarning: Exec, SetupScreenWatcher");
  }

  // see http://dragonfly.opera.com/app/scope-interface/Exec.html#sendmouseaction
  this.requestSendMouseAction = function(tag, message)
  {
    opera.scopeTransmit('exec', message || [], 5, tag || 0);
  }
  this.handleSendMouseAction = function(status, message)
  {
    opera.postError("NotBoundWarning: Exec, SendMouseAction");
  }
}
