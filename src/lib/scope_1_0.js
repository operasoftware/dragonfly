window.cls || (window.cls = {});
cls.Scope || (cls.Scope = {});
cls.Scope["1.0"] || (cls.Scope["1.0"] = {});
cls.Scope["1.0"].name = 'scope';

/**
  * @constructor 
  * @extends ServiceBase
  * generated with hob from the service definitions
  */

cls.Scope["1.0"].Service = function()
{
  /**
    * The name of the service used in scope in ScopeTransferProtocol
    */
  this.name = 'scope';
  this.version = '1.0';
  this.core_release = '2.5';


  // see http://dragonfly.opera.com/app/scope-interface/Scope.html#connect
  this.requestConnect = function(tag, message)
  {
    opera.scopeTransmit('scope', message || [], 3, tag || 0);
  }
  this.handleConnect = function(status, message)
  {
    opera.postError("NotBoundWarning: Scope, Connect");
  }

  // see http://dragonfly.opera.com/app/scope-interface/Scope.html#disconnect
  this.requestDisconnect = function(tag, message)
  {
    opera.scopeTransmit('scope', message || [], 4, tag || 0);
  }
  this.handleDisconnect = function(status, message)
  {
    opera.postError("NotBoundWarning: Scope, Disconnect");
  }

  // see http://dragonfly.opera.com/app/scope-interface/Scope.html#enable
  this.requestEnable = function(tag, message)
  {
    const
    NAME = 0;
    ( this._enable_requests || ( this._enable_requests = {} ) )[message[NAME]] = false;
    opera.scopeTransmit('scope', message || [], 5, tag || 0);
  }
  this.handleEnable = function(status, message)
  {
    const
    NAME = 0;
    
    var 
    all_enabled = true,
    service = message[NAME],
    service_name = '';

    if(status == 0)
    {
      services[service].post('enable-success');
      services[service].on_enable_success();
      this._enable_requests[service] = true;
      for(service_name in this._enable_requests)
      {
        all_enabled = all_enabled && this._enable_requests[service_name];
      }
      if(all_enabled)
      {
        window.app.post('services-enabled');
        if (window.app.on_services_enabled)
        {
          window.app.on_services_enabled();
        }
        if (this._on_services_enabled_callback)
        {
          this._on_services_enabled_callback();
        }
      }
    }
    else
    {
      opera.postError("enable service failed, message: " + service)
    }
    
  }

  // see http://dragonfly.opera.com/app/scope-interface/Scope.html#disable
  this.requestDisable = function(tag, message)
  {
    opera.scopeTransmit('scope', message || [], 6, tag || 0);
  }
  this.handleDisable = function(status, message)
  {
    /*
    const
    NAME = 0;
    */
    opera.postError("NotBoundWarning: Scope, Disable");
  }

  // see http://dragonfly.opera.com/app/scope-interface/Scope.html#info
  this.requestInfo = function(tag, message)
  {
    opera.scopeTransmit('scope', message || [], 7, tag || 0);
  }
  this.handleInfo = function(status, message)
  {
    /*
    const
    COMMAND_LIST = 0,
    EVENT_LIST = 1,
    // sub message CommandInfo 
    NAME = 0,
    NUMBER = 1,
    MESSAGE_ID = 2,
    RESPONSE_ID = 3;
    // sub message EventInfo 
    EVENTINFO_NAME = 0,
    EVENTINFO_NUMBER = 1,
    EVENTINFO_MESSAGE_ID = 2;
    */
    opera.postError("NotBoundWarning: Scope, Info");
  }

  // see http://dragonfly.opera.com/app/scope-interface/Scope.html#quit
  this.requestQuit = function(tag, message)
  {
    opera.scopeTransmit('scope', message || [], 8, tag || 0);
  }
  this.handleQuit = function(status, message)
  {
    opera.postError("NotBoundWarning: Scope, Quit");
  }

  // see http://dragonfly.opera.com/app/scope-interface/Scope.html#hostinfo
  this.requestHostInfo = function(tag, message)
  {
    opera.scopeTransmit('scope', message || [], 10, tag || 0);
  }
  this.handleHostInfo = function(status, message)
  {
    const
    STP_VERSION = 0,
    CORE_VERSION = 1,
    PLATFORM = 2,
    OPERATING_SYSTEM = 3,
    USER_AGENT = 4,
    SERVICE_LIST = 5,
    // sub message Service 
    NAME = 0,
    VERSION = 1;
    
    hello_message = 
    {
      stpVersion: message[STP_VERSION],
      coreVersion: message[CORE_VERSION],
      platform: message[PLATFORM],
      operatingSystem: message[OPERATING_SYSTEM],
      userAgent: message[USER_AGENT],
      serviceList: message[SERVICE_LIST],
    };
    service_descriptions = {};
    var service = null, _services = message[SERVICE_LIST], i = 0, tag = 0;
    for( ; service = _services[i]; i++)
    {
      service_descriptions[service[NAME]] = 
      {
        name: service[NAME],
        version: service[VERSION],
        index: i
      }
    }
    this._onHostInfoCallback(service_descriptions);
    for( i = 0; service = _services[i]; i++)
    {
      // ensure that the window-manager is the last service to get enabled
      if(service[NAME] in window.services && window.services[service[NAME]].is_implemented &&
        !(service[NAME] == "scope" || service[NAME] == "window-manager") )
      {
        window.services['scope'].requestEnable(0,[service[NAME]]);
      }
    }
    if ("window-manager" in services)
    {
      window.services['scope'].requestEnable(0,["window-manager"]);
    }
    hello_message.services = service_descriptions;    
  }

  // see http://dragonfly.opera.com/app/scope-interface/Scope.html#messageinfo
  this.requestMessageInfo = function(tag, message)
  {
    opera.scopeTransmit('scope', message || [], 11, tag || 0);
  }
  this.handleMessageInfo = function(status, message)
  {
    /*
    const
    MESSAGE_LIST = 0,
    // sub message MessageInfo 
    ID = 0,
    NAME = 1,
    FIELD_LIST = 2,
    PARENT_ID = 3,
    // sub message FieldInfo 
    FIELDINFO_NAME = 0,
    TYPE = 1,
    NUMBER = 2,
    QUANTIFIER = 3,
    MESSAGE_ID = 4;
    */
    opera.postError("NotBoundWarning: Scope, MessageInfo");
  }

  // see http://dragonfly.opera.com/app/scope-interface/Scope.html#onservices
  this.onServices = function(status, message)
  {
    /*
    const
    SERVICE_LIST = 0;
    */
    opera.postError("NotBoundWarning: Scope, OnServices");
  }

  // see http://dragonfly.opera.com/app/scope-interface/Scope.html#onquit
  this.onQuit = function(status, message)
  {
    /*
    */
    opera.postError("NotBoundWarning: Scope, OnQuit");
  }

  // see http://dragonfly.opera.com/app/scope-interface/Scope.html#onconnectionlost
  this.onConnectionLost = function(status, message)
  {
    /*
    */
    opera.postError("NotBoundWarning: Scope, OnConnectionLost");
  }

  // see http://dragonfly.opera.com/app/scope-interface/Scope.html#onerror
  this.onError = function(status, message)
  {
    /*
    const
    DESCRIPTION = 0;
    */
    opera.postError("NotBoundWarning: Scope, OnError");
  }

  var self = this;
  var services_avaible = [];
  var hello_message = {};
  var service_descriptions = {};

  this.get_hello_message = function()
  {
    return hello_message;
  }

  this.set_host_info_callback = function(on_host_info_callback)
  {
    this._onHostInfoCallback = on_host_info_callback;
  }

  this.set_services_enabled_callback = function(on_services_enabled)
  {
    this._on_services_enabled_callback = on_services_enabled;
  }
}
