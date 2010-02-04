window.cls || ( window.cls = {} );

/**
 * @class
 * Re-implements the scope DOM API in STP/1 compatible format
 * on top of a STP/0 format. Requires a host which is able to send
 * STP/1 data format over a STP/0 connection, e.g. to handle
 * the situation with a STP/0 proxy between a STP/1 host and client.
 * Instantiate like cls.STP_0_Wrapper.call(opera).
 */

cls.STP_0_Wrapper = function()
{

  // store the existing interface
  var self = this;
  var _scopeAddClient = this.scopeAddClient;
  var _scopeEnableService = this.scopeEnableService;
  var _connect_callback = null;
  var _receive_callback = null;
  var _quit_callback = null;
  var _target_receive_callback = function(){};
  var _target_quit_callback = function(){};
  var _port = 0;
  var _service_list = null;
  var _event_map = null;
  var _status_map = null;
  var _type_map = null;

  var _get_maps = function()
  {
    _event_map = cls.ServiceBase.get_event_map();
    _status_map = cls.ServiceBase.get_status_map();
    _type_map = cls.ServiceBase.get_type_map();
  }

  var _handle_connect = function(status, message)
  {
    _connect_callback(_service_list);
  }

  var _wrapper_connect_callback = function(_services)
  {
    var servicelist = _services.split(',');
    switch(self.stpVersion)
    {
      case undefined:
      case "STP/0":
      {
        // the host must be a stp 1 host
        if(servicelist.indexOf('stp-1') != -1)
        {
          _get_maps();
          STP_0_MethodWrapper.call(self);
          _target_receive_callback = _wrapper_receive_callback_stp_0;
          _target_quit_callback = _wrapper_quit_callback_stp_0;
          // enable scope service as a common transport channel
          self.scopeEnableService('scope');
          services.scope.handleConnect = _handle_connect;
          _service_list = _services;
          services.scope.requestConnect(0, ["json"]);
          break;
        }
      }
      case "STP/1":
      {
        _target_receive_callback = _receive_callback;
        _target_quit_callback = _quit_callback;
        _connect_callback(_services);
        break;
      }
      default:
      {
        self.postError("not able to handle STP version" + self.stpVersion + " in _wrapper_connect_callback");
      }
    }
  }

  var _wrapper_receive_callback = function(service, message, command, status, tag)
  {
    _target_receive_callback(service, message, command, status, tag);
  }

  var _wrapper_quit_callback = function(service, message, command, status, tag)
  {
    _target_quit_callback(service, message, command, status, tag);
  }

  var _wrapper_receive_callback_stp_0 = function(service, message, command, status, tag)
  {
    /*
      DATA         :: = "STP/" VERSION TERMINATOR HEADER-SIZE TERMINATOR HEADER PAYLOAD
      VERSION      ::= INT
      HEADER-SIZE  ::= INT
      HEADER       ::= "[" SERVICE-NAME "," STP-TYPE "," COMMAND-ID "," FORMAT ("," TAG ("," STATUS)? )? "]"
      SERVICE-NAME ::= <json-string>
      STP-TYPE     ::= <json-int>
      COMMAND-ID   ::= <json-int>
      FORMAT       ::= <json-int>
      TAG          ::= <json-int>
      STATUS       ::= <json-int>
      INT          ::= "0"-"9"+
    */
    const
    SERVICE_NAME = 0,
    COMMAND_ID = 2,
    TAG = 4,
    STATUS = 5;

    var space_pos = message.indexOf(' ', 6);
    if( space_pos != -1 )
    {
      var header_count = parseInt(message.slice(6, space_pos++));
      var header = JSON.parse(message.slice(space_pos, space_pos + header_count));
      message = JSON.parse(message.slice(space_pos + header_count));
      _receive_callback(
          header[SERVICE_NAME], 
          message, 
          header[COMMAND_ID], 
          header[STATUS] || 0, 
          header[TAG]
          );
    }
    else
    {
      // TODO
    }

  }

  var _wrapper_quit_callback_stp_0 = function(service, message, command, status, tag)
  {
    // TODO
  }

  var STP_0_MethodWrapper = function()
  {
    var _scopeTransmit = this.scopeTransmit;
    /*
    this.scopeEnableService = function(name, callback)
    {
      // TODO ( if really needed )
    }
    */

    this.scopeTransmit = function(service, message, command_id, tag)
    {
      /*
        DATA         :: = "STP/" VERSION TERMINATOR HEADER-SIZE TERMINATOR HEADER PAYLOAD
        VERSION      ::= INT
        HEADER-SIZE  ::= INT
        HEADER       ::= "[" SERVICE-NAME "," STP-TYPE "," COMMAND-ID "," FORMAT ("," TAG ("," STATUS)? )? "]"
        SERVICE-NAME ::= <json-string>
        STP-TYPE     ::= <json-int>
        COMMAND-ID   ::= <json-int>
        FORMAT       ::= <json-int>
        TAG          ::= <json-int>
        STATUS       ::= <json-int>
        INT          ::= "0"-"9"+
      */
      var header = JSON.stringify([service, 1, command_id, 1, tag]);
      _scopeTransmit('scope', "STP/1 " + header.length + " " + header + JSON.stringify(message), '', '');
    }
  }

  this.scopeAddClient = function(connect_callback, receive_callback, quit_callback, port)
  {
    _connect_callback = connect_callback;
    _receive_callback = receive_callback;
    _quit_callback = quit_callback;
    _scopeAddClient(
        _wrapper_connect_callback, 
        _wrapper_receive_callback, 
        _wrapper_quit_callback, 
        port
      );
  }



}
