/**
 * @fileoverview
 * HTTP logger service
 */

var cls = window.cls || ( window.cls = {} );

/**
  * HTTP logger class
  * @constructor 
  * @extends ServiceBase
  */
cls.HTTPLoggerService = function(name)
{
    var self = this;
    var view = "http_logger";

    this.onreceive = function(xml) // only called if there is a xml
    {
        //opera.postError(xml.documentElement.nodeName);
        if( ini.debug )
        {
            debug.logEvents(xml);
        }

        if( self[xml.documentElement.nodeName] )
        {
            self[xml.documentElement.nodeName](xml)
        }
        else
        {
            opera.postError( "http-logger not handled: " + new XMLSerializer().serializeToString(xml))
        }
    }

  // events supported: request, response

    this['request'] = function(msg) 
    {
        var data = this.parseRequest(msg);
        //opera.postError("just parsed a request:\n" + JSON.stringify(data));
        HTTPLoggerData.addRequest(data);
    }

    this['response'] = function(msg) 
    {
        var data = this.parseResponse(msg);
        //opera.postError("just parsed a response:\n" + JSON.stringify(data))
        HTTPLoggerData.addResponse(data);
    }

    this.onconnect = function(xml)
    {
    }

    var onAplicationsetup = function()
    {
    }


    /**
     * Parse a request. Returns an object with the shape:
     * request = {
     *  request-id: 123,
     *  window-id: 234,
     *  time: 345,
     *  method: "GET/POST/..",
     *  path: "/foo/bar/baz",
     *  headers: {
     *            headername1, value: headerval1,
     *            headername2, value: [headerval2_a, headerval2_b]
     *           }
     * }
     *
     */
    this.parseRequest = function(request)
    {
        var retval = {};
        var children = request.documentElement.childNodes;
        for (var n=0, ele; ele=children[n]; n++)
        {
            if (ele.nodeName == "header")
            {
                var hd = this.parseRequestHeader(ele);
                retval.headers = hd.headers;
                retval.method = hd.method;
                retval.path = hd.path;
                retval.protocol = hd.protocol;
            }
            else
            {
                retval[ele.nodeName] = ele.textContent;
            }
        }
        
        retval.url = retval.headers.Host + retval.path
        return retval;
    }

    /**
     * Parse a response. Returns an object with the shape:
     * response = {
     *  request-id: 123,
     *  window-id: 234,
     *  time: 345,
     *  protocol: "HTTP 1/1",
     *  status: 200,
     *  reason: OK
     *  headers: {
     *            headername1, value: headerval1,
     *            headername2, value: [headerval2_a, headerval2_b]
     *           }
     * }
     *
     */
    this.parseResponse = function(response)
    {
        var retval = {};
        var children = response.documentElement.childNodes;
        for (var n=0, ele; ele=children[n]; n++)
        {
            if (ele.nodeName == "header")
            {
                var hd = this.parseResponseHeader(ele);
                if (!hd) {
                    opera.postError("could not parse response header!!!!111")
                    continue;
                }
                retval.protocol= hd.protocol;
                retval.status = hd.status;
                retval.reason = hd.reason;
                retval.headers = hd.headers;
            }
            else
            {
                retval[ele.nodeName] = ele.textContent;
            }
        }
        return retval;
    }

    this.parseRequestHeader = function(ele)
    {
        var retval = {};
        var txt = ele.textContent;
        var lines = txt.split("\n");

        var requestline = lines.shift();
        reqparts = requestline.match(/(\w*?) (.*) (.*)/);

        if (!reqparts || reqparts.length != 4) {
            opera.postError("COULD NOT PARSE REQUEST:\n" + requestline);
            return null;
        }

        
        retval.method = reqparts[1];
        retval.path = reqparts[2];
        retval.protocol = reqparts[3];
        retval.headers = this.parseHeaders(lines);
        
        return retval;
    }

    this.parseResponseHeader = function(ele)
    {
        var retval = {};
        var txt = ele.textContent;
        var lines = txt.split("\n");
        var respline = lines.shift();
        
        respparts = respline.match(/(\w*?) (\w*?) (.*)/);

        if (!respparts || respparts.length != 4) {
            opera.postError("COULD NOT PARSE RESPONSE:\n" + respline);
            return null;
        }
        
        retval.protocol = respparts[1];
        retval.status = respparts[2];
        retval.reason = respparts[3];
        retval.headers = this.parseHeaders(lines);
        
        return retval;
    }
    
    /**
     * Parse the raw request block, including method, path and headers
     * @argument {Element}
     */
    this.parseHeaders = function(lines)
    {
        var headers = {};
        for (var n=0, line; line=lines[n]; n++)
        {
            var parts = line.match(/(\w*?): (.*)/);
            var name = parts[1];
            var value = parts[2];

            if (name in headers) {
                if (typeof headers[name] == "string")
                {
                    headers[name] = [headers[name], parts[1]];
                }
                else
                {
                    headers[name].push(value);
                }
            }
            else
            {
                headers[name] = value;
            }
        }
        return headers;
    }

  // constructor calls

    this.initBase(name);
  
    if( ! client)
    {
        opera.postError('client does not exist');
        return;
    }
    client.addService(this);

  // messages.addListener('application-setup', onAplicationsetup);
}

cls.HTTPLoggerService.prototype = ServiceBase;
new cls.HTTPLoggerService('http-logger');
