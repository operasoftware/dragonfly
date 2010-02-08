window.cls || ( window.cls = {} );

/**
 * @class
 * Implements the scope DOM API as a HTTP interface to dragonkeeper.
 * Mainly used for developing.
 * Instantiated as cls.ScopeHTTPInterface.call(opera).
 * @param {Boolean} force_stp_0 implement the DOM API STP/0 compatible 
 *                  to test the wrapping of STP/! in STP/0
 * http interface:
 *      /services
 *          to get the service list
 *      /enable/<service name>
 *         to enable a service with STP/0
 *      /post-command/<service name>/<command id>/<tag>, 
 *         message in the request body
 *         to dispatch a command
 *      /get-message
 *         to get a message ( command-response or event )
 */

cls.ScopeHTTPInterface = function(force_stp_0)
{
  var self = this;
  var _connect_callback = null;
  var _receive_callback = null;
  var _quit_callback = null;
  var _port = 0;
  var _cid = 0;
  var _proxy = new window.cls.Proxy();
  var _event_map = null;
  var _status_map = null;
  var _type_map = null;

  var _get_maps = function()
  {
    _event_map = cls.ServiceBase.get_event_map();
    _status_map = cls.ServiceBase.get_status_map();
    _type_map = cls.ServiceBase.get_type_map();
  }

  var _receive_dragonkeeper_STP_0 = function(xml, xhr)
  {
    if( !xml || !xml.documentElement || xml.documentElement.nodeName != 'timeout' )
    {
      _receive_callback('', xhr.responseText);
    }
    _proxy.GET( "/get-message?time=" + new Date().getTime(), _receive_dragonkeeper);
  }

  var _receive_dragonkeeper_STP_1 = function(xml, xhr)
  {
    if( !xml || !xml.documentElement || xml.documentElement.nodeName != 'timeout' )
    {
      var service = xhr.getResponseHeader("X-Scope-Message-Service");
      var command = parseInt(xhr.getResponseHeader("X-Scope-Message-Command"));
      var status = parseInt(xhr.getResponseHeader("X-Scope-Message-Status"));
      var tag = parseInt(xhr.getResponseHeader("X-Scope-Message-Tag"));
      var message = eval(xhr.responseText);
      try
      {
        _receive_callback(service, message, command, status, tag);
      }
      catch(e)
      {
        opera.postError(
          'failed to handle message\n' +
          '  service: ' + service + '\n' +
          '  command: ' + command + '\n' +
          '  message: ' + JSON.stringify(message) + '\n' +
          '  ------------------------------------\n' +
          '  error message: ' + e.message + '\n' +
          '  ------------------------------------\n' +
          '  error stacktrace: \n' + e.stacktrace + '\n' +
          '  ------------------------------------\n'
          )
      }
    }
    _proxy.GET( "/get-message?time=" + new Date().getTime(), _receive_dragonkeeper);
  }

  var _scopeTransmit_STP_0 = function(service, message, command_id, tag)
  {
    /** 
      * path format /post-command/<service-name>/<command-id>/<tag>, 
      * message in the request body 
      * format is JSON, encoding UTF-8
      */
    _proxy.POST("/post-command/" + service + "/" + command_id + "/" + tag,  message);
  }

  var _scopeTransmit_STP_1 = function(service, message, command_id, tag)
  {
    /** 
      * path format /http-interface-command-name/service-name/command-id/tag, msg
      * format 1 is JSON structures (UMS) , encoding UTF-8
      */
    
    _proxy.POST("/post-command/" + service + "/" + command_id + "/" + tag, 
                    JSON.stringify(message));
  }

  var _receive_dragonkeeper = null;

  var _on_stp_version = function(xml, xhr)
  {
    switch(self.stpVersion = xhr.responseText)
    {
      case undefined:
      case "STP/0":
      {
        _receive_dragonkeeper = _receive_dragonkeeper_STP_0;
        self.scopeTransmit = _scopeTransmit_STP_0;
        break;
      }
      case "STP/1":
      {
        _receive_dragonkeeper = _receive_dragonkeeper_STP_1;
        self.scopeTransmit = _scopeTransmit_STP_1;
        break;
      }
      default:
      {
        opera.postError("not able to handle STP version" + self.stpVersion + " in _on_stp_version");
      }
    }
    _connect_callback(_proxy.services.join(','));
    _proxy.GET( "/get-message?time=" + new Date().getTime(), _receive_dragonkeeper);
    if(window.ini.debug)
    {
      cls.debug.wrap_transmit();
    }
  }

  var _proxy_onsetup = function(xhr)
  {
    _proxy.GET( "/get-stp-version?time=" + new Date().getTime(), _on_stp_version);
  }

  this.scopeHTTPInterface = true;

  this.scopeAddClient = function(connect_callback, receive_callback, quit_callback, port)
  {
    _connect_callback = connect_callback;
    _receive_callback = receive_callback;
    _quit_callback = quit_callback;
    _port = port;
    var host = location.host.split(':');
    _proxy.onsetup = _proxy_onsetup;
    _proxy.configure(host[0], host[1]);
  }

  this.scopeEnableService = function(name, callback)
  {
    _proxy.enable(name);
  }

  window.ini || (window.ini = {debug: false});
  _get_maps();
    
}

