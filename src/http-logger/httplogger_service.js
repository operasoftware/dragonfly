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
        //opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + xml.documentElement.nodeName);
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
            opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
              "http-logger not handled: " + new XMLSerializer().serializeToString(xml))
        }
    }

  // events supported: request, response

    this['request'] = function(msg) 
    {
        var data = this.parseRequest(msg);
        //opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + "just parsed a request:\n" + JSON.stringify(data));
        HTTPLoggerData.addRequest(data);
    }

    this['response'] = function(msg) 
    {
        var data = this.parseResponse(msg);
        //opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + "just parsed a response:\n" + JSON.stringify(data))
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
     *  query: "?asdf=morradi",
     *  queryDict: {asdf: "morradi"}
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
                retval.raw = ele.textContent;
                var hd = this.parseRequestHeader(ele);
                retval.headers = hd.headers;
                retval.method = hd.method;
                retval.path = hd.path;
                retval.query = hd.query;
                retval.queryDict = hd.queryDict;
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
                retval.raw = ele.textContent;
                var hd = this.parseResponseHeader(ele);
                if (!hd) {
                    opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
                      "could not parse response header")
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

    /**
     * Parse a request header, returns an object with the shape:
     *
     * requst was GET http://example.com/foo?bar=baz&meh=flabaten
     * 
     * header = {
     *            method: "GET",
     *            path: "/foo",
     *            protocol: "http",
     *            query: {
     *                  bar: "baz",
     *                  meh: "flabaten"
     *            }
     *            headers: {
     *                  name1: "value1",
     *                  name2: "value2
     *            }
     *  }
     *  
     *
     */
    this.parseRequestHeader = function(ele)
    {
        var retval = {};
        var txt = ele.textContent;
        var lines = txt.split("\n");

        var requestline = lines.shift();
        reqparts = requestline.match(/(\w*?) (.*) (.*)/);

        if (!reqparts || reqparts.length != 4) {
            opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
              "Could not parse request:\n" + txt);
            return null;
        }

        retval.method = reqparts[1];
        retval.query = "";
        retval.path = reqparts[2];
        
        var i;
        if ((i = retval.path.indexOf("?")) > 0)
        {
            retval.query = retval.path.slice(i);
            retval.queryDict = {};
            retval.query.substr(1).split("&").forEach(function(e)
            {
                var offset = e.indexOf("=");
                if (offset<1) { return }
                var key = e.substr(0, offset);
                var val = e.substr(offset+1);
                retval.queryDict[key] = val;
            })
            
            retval.path = retval.path.slice(0, i);
        }
        
        retval.protocol = reqparts[3];
        retval.headers = this.parseHeaders(lines);
        
        return retval;
    }

    /**
     * Parse a response header into a dictionary of the shape
     * header = {
     *     protocol: "http",
     *     status: "200",
     *     reason: "OK",
     *     headers: <dictionary of http headers parsed by parseHeaders()>
     * }
     *
     */
    this.parseResponseHeader = function(ele)
    {
        var retval = {};
        var txt = ele.textContent;
        var lines = txt.split("\n");
        var respline = lines.shift();
        
        respparts = respline.match(/(\w*?) (\w*?) (.*)/);

        if (!respparts || respparts.length != 4) {
            opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
              "Could not parse response:\n" + respline);
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
        var headerList = [];
        for (var n=0, line; line=lines[n]; n++)
        {
            if (line.indexOf(" ") == 0 || line.indexOf("\t") == 0) {
                // this is a continuation from the previous line
                // Replace all leading whitespace with a single space
                value = "line".replace(/^[ \t]+/, " ");

                if (headerList.length) {
                    old = headerList.pop();
                    headerList.push([old[0], old[1]+value]);
                } else { // should never happen with well formed headers
                    opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + "this header is malformed\n" + line)
                }
            }
            else
            {
                var parts = line.match(/([\w-]*?): (.*)/);
                if (!parts || parts.length!=3) {
                    opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + "Could not parse header!:\n" + line)
                    continue;
                }
                var name = parts[1];
                var value = parts[2];
                
                headerList.push([name, value]);
            }
        }

        // we now have a list of header, value tuples. Grab tuples out of
        // it and put it into a multidict like structure
        for (var n=0, tuple; tuple=headerList[n]; n++)
        {
            var name = tuple[0];
            var value = tuple[1];

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
        opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 'client does not exist');
        return;
    }
    client.addService(this);

  // messages.addListener('application-setup', onAplicationsetup);
}

cls.HTTPLoggerService.prototype = ServiceBase;
new cls.HTTPLoggerService('http-logger');
