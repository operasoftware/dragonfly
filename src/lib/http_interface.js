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
      // TODO remove try catch
      try
      {
        var message = eval('('+xhr.responseText+')');
      }
      catch(e)
      {
        opera.postError(
          'eval failed: ' + 
          e.message + '\n' +
          xhr.getAllResponseHeaders() + '\n' +
          xhr.responseText
          );
      };
      _receive_callback(service, message, command, status, tag);

    }
    _proxy.GET( "/get-message?time=" + new Date().getTime(), _receive_dragonkeeper);
  }

  var _scopeTransmit_STP_0 = function(service, message, command_id, tag)
  {
    if( ini.debug )
    {
      debug.log_command(msg);
    }

    /** 
      * path format /post-command/<service-name>/<command-id>/<tag>, 
      * message in the request body 
      * format is JSON, encoding UTF-8
      */
    _proxy.POST("/post-command/" + service + "/" + command_id + "/" + tag,  message);
  }

  var _scopeTransmit_STP_1 = function(service, message, command_id, tag)
  {
    if( ini.debug )
    {
      debug.log_command(msg);
    }
    /** 
      * path format /http-interface-command-name/service-name/command-id/tag, msg
      * format 1 is JSON structures (UMS) , encoding UTF-8
      */
    
    _proxy.POST("/post-command/" + service + "/" + command_id + "/" + tag, 
                    JSON.stringify(message));
  }

  var _receive_dragonkeeper = null;

  var _proxy_onsetup = function(xhr)
  {
    _connect_callback(_proxy.services.join(','));
    _proxy.GET( "/get-message?time=" + new Date().getTime(), _receive_dragonkeeper);
  }

  if(force_stp_0)
  {
    _receive_dragonkeeper = _receive_dragonkeeper_STP_0;
    this.scopeTransmit = _scopeTransmit_STP_0;
  }
  else
  {
    _receive_dragonkeeper = _receive_dragonkeeper_STP_1;
    this.scopeTransmit = _scopeTransmit_STP_1;
    this.stpVersion = 1;
  }

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

  _get_maps();
    
}

