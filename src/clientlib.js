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
var proxy =
{
    /** Configure the proxy connection and lookup the available
      * services.  This must be called initially.
      *
      * \param host (optional) The host name or IP for the proxy
      * \param port (optional) The port for the proxy
      * \return     Nothing.
      * \exceptions Throws if the access to /services failed
      */
    configure : function ( host, port ) {
	if (host) this.host = host;
	if (port) this.port = port;

	var response = this.GET("/services");
	var service_elts = response.getElementsByTagName("service");
	var services = new Array();
	for ( var i=0 ; i < service_elts.length ; i++ )
	    services.push(service_elts[i].getAttribute("name"));

	this.services = services;
    },

    /** Enable a named service if possible.
      *
      * \param service_name  The name of the requested service.
      * \return      true if enabling succeeded, false otherwise
      * \exceptions  Throws if the access to the proxy failed
      */
    enable : function (service_name) {
	var i;
        for ( i=0 ; i < this.services.length && this.services[i] != service_name ; i++ )
            ;

        if (i == this.services.length)
	    return false;

        proxy.GET( "/enable/" + service_name );  // ignore the response
        return true;
    },

    /** Send a GET message to the configured host/port, wait until
      * there's a response, then return the response data.
      *
      * This function will retry the operation if "<timeout />" is
      * returned from the proxy.
      *
      * \param msg  The full message to send, including leading "/"
      * \return     The responseXML property of the XMLHttpRequest 
      * \exceptions Throws an exception if the return code is not 200
      */
    GET : function( msg ) {
        var x = new XMLHttpRequest;
        for (;;) {
            x.open("GET", "http://" + this.host + ":" + this.port + msg, false);
            x.send("");
	    this.onReceive(x);
            if (x.status != 200) 
                throw "Message failed: " + x.status;
	    var xml = x.responseXML;
            if (xml == null)
                throw "Message failed: " + x.responseText;
	    if (xml.documentElement.tagName != "timeout")
	        return xml;
            this.onTimeout();
        }
    },

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
    POST : function ( msg, data ) {
        var x = new XMLHttpRequest;
        x.open("POST", "http://" + this.host + ":" + this.port + msg, false);
        x.send("postdata=" + data);
	this.onReceive(x);
        if (x.status != 200) 
	    throw "Message failed: " + x.status;
        return x.responseXML;
    },

    /** WRITABLE.
      * Installable handler that will be called every time a GET request 
      * times out.  By default this does nothing.
      *
      * A typical thing for a user handler to do here would be to update 
      * the UI (eg "waiting..."), or throw an exception to break out of the 
      * GET call.
      */
    onTimeout : function () {
        // Do nothing by default
    },

    /** WRITABLE.
      * Installable handler that will be called with the XMLHttpRequest
      * object every time a send() completes, before any further processing
      * is done.
      *
      * Useful for logging, debugging, and ad-hoc correction of incoming data.
      */
    onReceive : function (x) {
	// Do nothing by default
    },

    /* Proxy host */
    host: "127.0.0.1",

    /* Proxy port */
    port: "8002",

    /* Array of service names */
    services: []
};
    
