window.cls || (window.cls = {});
cls.WindowManager || (cls.WindowManager = {});
cls.WindowManager["2.0"] || (cls.WindowManager["2.0"] = {});
cls.WindowManager["2.0"].name = 'window-manager';

/**
  * @constructor 
  * @extends ServiceBase
  * generated with opprotoc from the service definitions
  */

cls.WindowManager["2.0"].Service = function()
{
  /**
    * The name of the service used in scope in ScopeTransferProtocol
    */
  this.name = 'window-manager';
  this.version = '2.0';
  this.core_release = '2.4';


  // see http://dragonfly.opera.com/app/scope-interface/WindowManager.html#getactivewindow
  this.requestGetActiveWindow = function(tag, message)
  {
    opera.scopeTransmit('window-manager', message || [], 1, tag || 0);
  }
  this.handleGetActiveWindow = function(status, message)
  {
    /*
    const
    WINDOW_ID = 0;
    */
    opera.postError("NotBoundWarning: WindowManager, GetActiveWindow");
  }

  // see http://dragonfly.opera.com/app/scope-interface/WindowManager.html#listwindows
  this.requestListWindows = function(tag, message)
  {
    opera.scopeTransmit('window-manager', message || [], 2, tag || 0);
  }
  this.handleListWindows = function(status, message)
  {
    /*
    const
    WINDOW_LIST = 0,
    // sub message WindowInfo 
    WINDOW_ID = 0,
    TITLE = 1,
    WINDOW_TYPE = 2,
    OPENER_ID = 3;
    */
    opera.postError("NotBoundWarning: WindowManager, ListWindows");
  }

  // see http://dragonfly.opera.com/app/scope-interface/WindowManager.html#modifyfilter
  this.requestModifyFilter = function(tag, message)
  {
    this._window_filter = message;
    opera.scopeTransmit('window-manager', message || [], 3, tag || 0);
  }
  this.handleModifyFilter = function(status, message)
  {
    if(status == 0)
    {
      for( var service in services )
      {
        if(services[service].is_implemented)
        {
          services[service].post('window-filter-change', {filter: this._window_filter});
          services[service].on_window_filter_change(this._window_filter);
        }
      }
    }
    else
    {
      // TODO
    }
  }

  // see http://dragonfly.opera.com/app/scope-interface/WindowManager.html#onwindowupdated
  this.onWindowUpdated = function(status, message)
  {
    /*
    const
    WINDOW_ID = 0,
    TITLE = 1,
    WINDOW_TYPE = 2,
    OPENER_ID = 3;
    */
    opera.postError("NotBoundWarning: WindowManager, OnWindowUpdated");
  }

  // see http://dragonfly.opera.com/app/scope-interface/WindowManager.html#onwindowclosed
  this.onWindowClosed = function(status, message)
  {
    /*
    const
    WINDOW_ID = 0;
    */
    opera.postError("NotBoundWarning: WindowManager, OnWindowClosed");
  }

  // see http://dragonfly.opera.com/app/scope-interface/WindowManager.html#onwindowactivated
  this.onWindowActivated = function(status, message)
  {
    /*
    const
    WINDOW_ID = 0;
    */
    opera.postError("NotBoundWarning: WindowManager, OnWindowActivated");
  }

  // see http://dragonfly.opera.com/app/scope-interface/WindowManager.html#onwindowloaded
  this.onWindowLoaded = function(status, message)
  {
    /*
    const
    WINDOW_ID = 0;
    */
    opera.postError("NotBoundWarning: WindowManager, OnWindowLoaded");
  }
}
