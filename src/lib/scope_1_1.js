window.cls || (window.cls = {});
cls.Scope || (cls.Scope = {});
cls.Scope["1.1"] || (cls.Scope["1.1"] = {});
cls.Scope["1.1"].name = 'scope';

/**
  * @constructor
  * @extends ServiceBase
  * generated with hob from the service definitions
  */

cls.Scope["1.1"].Service = function()
{
  var SUCCESS = 0;
  /**
    * The name of the service used in scope in ScopeTransferProtocol
    */
  this.name = 'scope';
  this.version = '1.1';


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

  this.requestEnable = function(tag, message)
  {
    var NAME = 0;
    opera.scopeTransmit("scope", message || [], 5, tag || 0);
  };

  this.handleEnable = function(status, message)
  {
    var NAME = 0;

    var all_enabled = true;
    var service = message[NAME];
    var service_name = "";

    if (status === SUCCESS)
    {
      if (window.services && window.services[service])
      {
        window.services[service].is_enabled = true;
        window.services[service].post("enable-success");
        window.services[service].on_enable_success();
      };

      if (this._enable_requests.contains(service))
        this._enable_requests.splice(this._enable_requests.indexOf(service), 1);

      if (!this._enable_requests.length)
        this._send_profile_enabled_msg();
    }
    else
      opera.postError("enable service failed, message: " + service);
  };

  this._send_profile_enabled_msg = function()
  {
    window.app.profiles[this._profile].is_enabled = true;
    var msg = {profile: this._profile,
               services: this._profiles[this._profile].slice()};
    window.messages.post("profile-enabled", msg);
    window.settings.general.set("profile-mode", this._profile);
  };

  this.requestDisable = function(tag, message)
  {
    opera.scopeTransmit("scope", message || [], 6, tag || 0);
  };

  this.handleDisable = function(status, message)
  {
    var NAME = 0;
    var service = message[NAME];
    if (status === SUCCESS)
    {
      window.services[service].is_enabled = false;
      if (this._disable_requests.contains(service))
        this._disable_requests.splice(this._disable_requests.indexOf(service), 1);

      if (!this._disable_requests.length)
        this._finalize_enable_profile();
    }
    else
      opera.postError("disable service failed, message: " + service)
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

    this._hello_message =
    {
      stpVersion: message[STP_VERSION],
      coreVersion: message[CORE_VERSION],
      platform: message[PLATFORM],
      operatingSystem: message[OPERATING_SYSTEM],
      userAgent: message[USER_AGENT],
      serviceList: message[SERVICE_LIST],
    };
    this._service_descriptions = {};
    var service = null, _services = message[SERVICE_LIST], i = 0, tag = 0;
    for( ; service = _services[i]; i++)
    {
      this._service_descriptions[service[NAME]] =
      {
        name: service[NAME],
        version: service[VERSION],
        index: i
      }
    }

    [
      window.app.profiles.DEFAULT,
      window.app.profiles.PROFILER,
      window.app.profiles.HTTP_PROFILER,
    ].forEach(function(profile)
    {
      this._profiles[profile] = window.app.profiles[profile].filter(function(service)
      {
        return this._service_descriptions.hasOwnProperty(service);
      }, this);
    }, this);
    this._onHostInfoCallback(this._service_descriptions, this._hello_message);
    this._hello_message.services = this._service_descriptions;
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
    MESSAGE_ID = 4,
    ENUM_ID = 5;
    */
    opera.postError("NotBoundWarning: Scope, MessageInfo");
  }

  // see http://dragonfly.opera.com/app/scope-interface/Scope.html#enuminfo
  this.requestEnumInfo = function(tag, message)
  {
    opera.scopeTransmit('scope', message || [], 12, tag || 0);
  }
  this.handleEnumInfo = function(status, message)
  {
    /*
    const
    ENUM_LIST = 0,
    // sub message Enum
    ID = 0,
    NAME = 1,
    VALUE_LIST = 2,
    // sub message Value
    VALUE_NAME = 0,
    NUMBER = 1;
    */
    opera.postError("NotBoundWarning: Scope, EnumInfo");
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

  this.get_hello_message = function()
  {
    return this._hello_message;
  }

  this.set_host_info_callback = function(on_host_info_callback)
  {
    this._onHostInfoCallback = on_host_info_callback;
  }

  this.set_services_enabled_callback = function(on_services_enabled)
  {
    this._on_services_enabled_callback = on_services_enabled;
  }

  this.enable_profile = function(profile)
  {
    if (this._enable_requests.length || this._disable_requests.length)
      return;

    var old_profile = this._profile;
    var current_enabled_services = this._profiles[old_profile] || [];
    var services_to_be_enabled = this._profiles[profile];
    this._profile = profile;
    current_enabled_services.forEach(function(service)
    {
      if (!services_to_be_enabled.contains(service))
        this._disable_requests.push(service);
    }, this);
    services_to_be_enabled.forEach(function(service)
    {
      if (!current_enabled_services.contains(service))
        this._enable_requests.push(service);
    }, this);

    if (old_profile)
    {
      var msg = {profile: old_profile,
                 disabled_services: this._disable_requests.slice()};
      window.app.profiles[old_profile].is_enabled = false;
      window.messages.post("profile-disabled", msg);
    }

    if (this._disable_requests.length)
    {
      this._disable_requests.forEach(function(service)
      {
        this.requestDisable(cls.TagManager.DEFAULT_HANDLER, [service]);
      }, this);
    }
    else
      this._finalize_enable_profile();
  };

  this._finalize_enable_profile = function()
  {
    if (this._enable_requests.length)
    {
      this._enable_requests.forEach(function(service)
      {
        this.requestEnable(cls.TagManager.DEFAULT_HANDLER, [service]);
      }, this);
    }
    else
      this._send_profile_enabled_msg();
  };

  this._init = function()
  {
    this._hello_message = {};
    this._service_descriptions = {};
    this._profile = null;
    this._profiles = window.app.profiles;
    this._enable_requests = [];
    this._disable_requests = [];
  };

  this.reset = this._init;
  this._init();
}
