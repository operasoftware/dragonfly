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
  var _scopeAddClient = this.scopeAddClient;
  var _scopeEnableService = this.scopeEnableService;
  var _scopeTransmit = this.scopeTransmit;
  var _connect_callback = null;
  var _receive_callback = null;
  var _quit_callback = null;
  var _port = 0;
  var _cid = 0;
  var _uuid = cookies.get("uuid") || 
    cookies.set("uuid", ( ( Math.random() * 1e12 ) >> 0 ).toString(32), 2*60*60*1000 );
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
    _cid = message[0];
    _connect_callback(_service_list);
  }

  var _wrapper_connect_callback = function(_services)
  {
    // enable scope service as a common transport channel
    opera.scopeEnableService('scope');
    services.scope.handleConnect = _handle_connect;
    _service_list = _services;
    services.scope.requestConnect(0, ["json",_uuid]);
  }

  var _wrapper_receive_callback = function(service, message, command, status, tag)
  {
    /*
      DATA         :: = "STP/" VERSION TERMINATOR HEADER-SIZE TERMINATOR HEADER PAYLOAD
      VERSION      ::= INT
      HEADER-SIZE  ::= INT
      HEADER       ::= "[" SERVICE-NAME "," STP-TYPE "," COMMAND-ID "," FORMAT ("," CLIENT-ID ("," TAG ("," STATUS ("," UUID)? )? )? )? "]"
      SERVICE-NAME ::= <json-string>
      STP-TYPE     ::= <json-int>
      COMMAND-ID   ::= <json-int>
      FORMAT       ::= <json-int>
      CLIENT-ID    ::= <json-int>
      TAG          ::= <json-int>
      STATUS       ::= <json-int>
      UUID         ::= <json-string>
      INT          ::= "0"-"9"+
    */
    const
    SERVICE_NAME = 0,
    COMMAND_ID = 2,
    TAG = 5,
    STATUS = 6;

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

  var _wrapper_quit_callback = function(service, message, command, status, tag)
  {
    // TODO
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
      HEADER       ::= "[" SERVICE-NAME "," STP-TYPE "," COMMAND-ID "," FORMAT ("," CLIENT-ID ("," TAG ("," STATUS ("," UUID)? )? )? )? "]"
      SERVICE-NAME ::= <json-string>
      STP-TYPE     ::= <json-int>
      COMMAND-ID   ::= <json-int>
      FORMAT       ::= <json-int>
      CLIENT-ID    ::= <json-int>
      TAG          ::= <json-int>
      STATUS       ::= <json-int>
      UUID         ::= <json-string>
      INT          ::= "0"-"9"+
    */
    var header = JSON.stringify([service, 1, command_id, 1, _cid || null ,tag, , !_cid && _uuid || null ]);
    _scopeTransmit('scope', "STP/1 " + header.length + " " + header + JSON.stringify(message), '', '');
  }

  _get_maps();

}
