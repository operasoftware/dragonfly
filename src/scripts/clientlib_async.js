/* Copyright 2006 Opera Software ASA.  */

/**
  * Convenience library for interacting with the httpd server in
  * the scope proxy.
  *
  * The "proxy" object is a singleton that encapsulates logic for
  * interacting with the debugging proxy.  It is built on top of
  * XMLHttpRequest.
  *
  * Every request to the proxy is synchronous, and the proxy may hold
  * it for up to 20 seconds before returning a value.  The value is
  * always XML data.  If no real data are available to return from the
  * service in 20 seconds, then the proxy returns "<timeout />", and
  * this code should (optionally) retry the request.
  *
  * Every access has a response value, which is normally "<ok />" if
  * nothing sensible can be returned.
  *
  * Properties of this object are read-only except where explicitly 
  * stated.
  *
  * @author Lars T Hansen
  */
var proxy = new function()
{
  var self = this;

  /** Configure the proxy connection and lookup the available
    * services.  This must be called initially.
    *
    * \param host (optional) The host name or IP for the proxy
    * \param port (optional) The port for the proxy
    * \return     Nothing.
    * \exceptions Throws if the access to /services failed
    */
  this.configure = function ( host, port ) 
  {
    if (host) __host = host;
    if (port) __port = port;
    this.GET("/services", parseConfigureResponse)
  }

  var parseConfigureResponse = function (xml)
  {
    var service_elts = xml.getElementsByTagName("service");
    var services = new Array();
    for ( var i=0 ; i < service_elts.length ; i++ )
    {
      services.push(service_elts[i].getAttribute("name"));
    }
    self.services = services;
    // opera.postError("services: "+services);
    self.onsetup();
  }

  this.onsetup = function(){}

  /** Enable a named service if possible.
    *
    * \param service_name  The name of the requested service.
    * \return      true if enabling succeeded, false otherwise
    * \exceptions  Throws if the access to the proxy failed
    */
  this.enable = function (service_name) 
  {
    var i;
    
    for ( i=0 ; i < this.services.length && this.services[i] != service_name ; i++ );
    if (i == this.services.length)
    {
      return false;
    }
    proxy.GET( "/enable/" + service_name, function(){} );  // ignore the response
    return true;
  }

  /** Send a GET message to the configured host/port, wait until
    * there's a response, then return the response data.
    *
    * This function will retry the operation if "<timeout />" is
    * returned from the proxy.
    *
    * \param msg  The full message to send, including leading "/"
    * \return     The responseXML property of the XMLHttpRequest 
    * \exceptions Throws an exception if the return code is not 200
    * changed the code to work in an asynchroneous environment
    */
  this.GET = function( msg, cb ) 
  {
    var x = new XMLHttpRequest;
    x.onload=function()
    {
      if (this.status != 200) 
      {
        throw "Message failed, Status: " + this.status;
      }
      /*
      var r = this.responseText;
      if(r.indexOf('hello') != -1 )
      {
        opera.postError(r);
      }
      */
      self.onReceive(x);
      var xml = this.responseXML;
      if (xml.documentElement == null)
      {
        if(client)
        {
          client.onquit();
          return;
        }
        else
        {
          throw "Message failed, GET, empty document: " + this.responseText;
        }
      }
      if(cb) 
      {
        cb(xml)
      }
      else
      {
        throw "Loop broken: "+ this.responseText;
      }
    }
    x.open("GET", "http://" + __host + ":" + __port + msg);
    x.send("");
  }


  /** Send a POST message to the configured host/port, wait until
    * there's a response, then return the response data.
    *
    * This function will *not* retry the operation if "<timeout />" is
    * returned from the proxy; it should only be used when the service
    * has been enabled and Opera is known to be listening for data.
    *
    * \param msg   The full message to send, including leading "/"
    * \param data  XML data to post
    * \return      The responseXML property of the XMLHttpRequest 
    * \exceptions Throws an exception if the return code is not 200
    */
    this.POST = function ( msg, data, cb ) 
    {
      // opera.postError("POST: " + msg+' '+ data+' '+cb)
      var x = new XMLHttpRequest;
      x.onload=function()
      {
        if (this.status != 200) 
        {
          throw "Message failed, Status: " + this.status;
        }
        //self.onReceive(x);
        var xml = this.responseXML;
        if (xml.documentElement == null)
        {
          throw "Message failed, POST, empty document: " + this.responseText;
        }
        if(cb) cb(xml);
        if( ini.debug )
        {
          debug.output('POST response: '+this.responseText);
        }
      }
      x.open("POST", "http://" + __host + ":" + __port + msg );
      x.send(data);
    }

    /** WRITABLE.
      * Installable handler that will be called every time a GET request 
      * times out.  By default this does nothing.
      *
      * A typical thing for a user handler to do here would be to update 
      * the UI (eg "waiting..."), or throw an exception to break out of the 
      * GET call.
      */
    this.onTimeout = function () 
    {
        // Do nothing by default
    }

    /** WRITABLE.
      * Installable handler that will be called with the XMLHttpRequest
      * object every time a send() completes, before any further processing
      * is done.
      *
      * Useful for logging, debugging, and ad-hoc correction of incoming data.
      */
    this.onReceive = function (x) 
    {
	    // Do nothing by default
    }

    /* Proxy host */
    var __host =  "127.0.0.1";

    /* Proxy port */
    var __port = "8002"; 

    /* Array of service names */
    this.services =  []
};
    
