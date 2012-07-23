﻿/**
 * @fileoverview
 */

window.cls || ( window.cls = {} );

/**
  * @constructor
  */

window.cls.ServiceBase = function ()
{
  // singleton
  if(cls.ServiceBase.instance)
  {
    return cls.ServiceBase.instance;
  }
  cls.ServiceBase.instance = this;

  window.cls.MessageMixin.apply(this); // mix in message handler behaviour.

  this.on_enable_success = function() {};
  this.on_window_filter_change = function(filter) {};
  this.on_quit = function() {};
  this.is_implemented = false;
  this.is_enabled = false;

  this.create_and_expose_interface = function(version, map)
  {
    if (map)
    {
      this.version = version;
      version = version.split('.').map(Number);
      this.major_version = version[0];
      this.minor_version = version[1] || 0;
      this.major_minor_version = this.major_version + .1 * this.minor_version;
      this.patch_version = version[2] || 0;
      for (var cmd_id in map)
      {
        this._expose_method(parseInt(cmd_id), map[cmd_id].name);
      };
      return true;
    }
    return false;
  };

  this.satisfies_version = function(major, minor)
  {
    return this.major_version > major || (this.major_version === major && this.minor_version >= minor);
  };

  this._expose_method = function(id, name)
  {
    if (name.slice(0, 2) == 'On')
    {
      this['on' + name.slice(2)] = function(status, message){};
    }
    else
    {
      this['handle' + name] = function(status, message){};
      this['request' + name] = function(tag, message)
      {
        opera.scopeTransmit(this.name, message || [], id, tag || 0);
      };
    }
  };

  var _services = null;
  var _event_map = {};

  _event_map['scope'] = [];
  _event_map['scope'][3] = 'handleConnect';
  _event_map['scope'][4] = 'handleDisconnect';
  _event_map['scope'][5] = 'handleEnable';
  _event_map['scope'][6] = 'handleDisable';
  _event_map['scope'][7] = 'handleInfo';
  _event_map['scope'][8] = 'handleQuit';
  _event_map['scope'][10] = 'handleHostInfo';
  _event_map['scope'][11] = 'handleMessageInfo';
  _event_map['scope'][12] = 'handleEnumInfo';
  _event_map['scope'][0] = 'onServices';
  _event_map['scope'][1] = 'onQuit';
  _event_map['scope'][2] = 'onConnectionLost';
  _event_map['scope'][9] = 'onError';


  var _status_map = [];
  _status_map[0] = "OK";
  _status_map[1] = "Conflict";
  _status_map[2] = "Unsupported Type";
  _status_map[3] = "Bad Request";
  _status_map[4] = "Internal Error";
  _status_map[5] = "Command Not Found";
  _status_map[6] = "Service Not Found";
  _status_map[7] = "Out Of Memory";
  _status_map[8] = "Service Not Enabled";
  _status_map[9] = "Service Already Enabled";

  var _type_map = [];
  _type_map[1] = "command";
  _type_map[2] = "response";
  _type_map[3] = "event";
  _type_map[4] = "error";

  var _handle_scope_message = function(service, message, command, status, tag)
  {
    var msg_name = _event_map[service][command], service_obj = _services[service];
    if (msg_name.indexOf('on') == 0)
    {
      service_obj[msg_name](status, message);
      service_obj.post_message(msg_name.slice(2).toLowerCase(), message);
    }
    else if (!tagManager.handle_message(tag, status, message))
    {
      service_obj[msg_name](status, message);
    }
  };

  var _handle_scope_message_debug = function(service, message, command, status, tag)
  {
    window.debug.log_message(service, message, command, status, tag);
    _handle_scope_message(service, message, command, status, tag);
  };

  // static methods

  (function()
  {

    this.get_event_map = function()
    {
      return _event_map;
    };

    this.get_status_map = function()
    {
      return _status_map;
    };

    this.get_type_map = function()
    {
      return _type_map;
    };

    this.get_generic_message_handler = function()
    {
      return window.ini && window.ini.debug && _handle_scope_message_debug || _handle_scope_message;
    };

    this.register_services = function(namespace)
    {
      _services = namespace;
    };

    this.populate_map = function(map)
    {
      for (var service in map)
      {
        if (service == "scope")
          continue;
        var cmd_map = _event_map[service] = [];
        for (var cmd_id in map[service])
        {
          if (map[service][cmd_id].name.slice(0, 2) == "On")
            cmd_map[cmd_id] = "on" + map[service][cmd_id].name.slice(2);
          else
            cmd_map[cmd_id] = "handle" + map[service][cmd_id].name;
        }
      }
    };

  }).apply(cls.ServiceBase);

};
