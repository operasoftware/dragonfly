/* Copyright 2006 Opera Software ASA.
 *
 * Convenience library for interacting with the httpd server in
 * the scope proxy.
 *
 * The "proxy" object is a singleton that encapsulates logic for
 * interacting with the debugging proxy.  It is built on top of
 * XmlHttpRequest.
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
 * --
 *
 * Conventions:
 *  - properties starting with "$" should not be written by
 *    clients of the proxy object.
 */
var proxy =
{
    /* Configure the proxy connection and lookup the available
     * services.  This must be called initially.
     *
     * \param host (optional) The host name or IP for the proxy
     * \param port (optional) The port for the proxy
     * \return     Nothing.
     * \exceptions Throws if the access to /services failed
     */
    configure : function ( host, port ) {
       if (host) this.$host = host;
       if (port) this.$port = port;

       var response = this.GET("/services");
       var service_elts = response.getElementsByTagName("service");
       var services = new Array();
       for ( var i=0 ; i < service_elts.length ; i++ )
          services.push(service_elts[i].innerText);

       this.$services = services;
    },

    /* Enable a named service if possible.
     *
     * \param service_name  The name of the requested service.
     * \return      true if enabling succeeded, false otherwise
     * \exceptions  Throws if the access to the proxy failed
     */
    enable : function (service_name) {
       var s;
       for ( s in this.$services )
          if (s == service_name)
             break;

       if (s != service_name)
           return false;

       proxy.GET( "/enable/" + service_name );  // ignore the response
       return true;
    },

    /* Send a GET message to the configured host/port, wait until
     * there's a response, then return the response data.
     *
     * This function will retry the operation if "<timeout />" is
     * returned from the proxy.
     *
     * \param msg  The full message to send, including leading "/"
     * \return     The responseXML property of the XmlHttpRequest 
     * \exceptions Throws an exception if the return code is not 200
     */
    GET : function( msg ) {
        var x = new XmlHttpRequest;
        x.open("GET", "http://" + this.$host + ":" + this.$port + msg);
        x.send("");
        if (x.status != 200) 
            throw "Message failed: " + x.status;
        // FIXME: x.responseText may be "EAGAIN"
        return x.responseXML;
    },

    /* Send a POST message to the configured host/port, wait until
     * there's a response, then return the response data.
     *
     * This function will *not* retry the operation of "<timeout />" is
     * returned from the proxy; it should only be used when the service
     * has been enabled and Opera is known to be listening for data.
     *
     * \param msg   The full message to send, including leading "/"
     * \param data  XML data to post
     * \return      The responseXML property of the XmlHttpRequest 
     * \exceptions Throws an exception if the return code is not 200
     */
    POST : function ( msg, data ) {
        var x = new XmlHttpRequest;
        x.open("POST", "http://" + this.$host + ":" + this.$port + msg);
        x.send(data);
        if (x.status != 200) 
            throw "Message failed: " + x.status;
        return x.responseXML;
    },

    /* Proxy host */
    $host: "127.0.0.1",

    /* Proxy port */
    $port: "7002",

    /* Array of service names */
    $services: []
};
    
