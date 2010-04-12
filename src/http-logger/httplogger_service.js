/**
 * @fileoverview
 * HTTP logger service
 */

window.cls || (window.cls = {});
cls.HttpLogger || (cls.HttpLogger = {});
cls.HttpLogger["2.0"] || (cls.HttpLogger["2.0"] = {});

/**
  * HTTP logger class
  * @constructor
  * @extends ServiceBase
  */
cls.HttpLogger["2.0"].ParseMessages = function(name)
{
    var self = this;
    var view = "http_logger";

    /**
     * Parse a request. Returns an object with the shape:
     * request = {
     *  request-id: 123,
     *  window-id: 234,
     *  time: 12341234, // time request event was received
     *  method: "GET/POST/..",
     *  path: "/foo/bar/baz",
     *  query: "?asdf=morradi",
     *  host: "foo.com"
     *  queryDict: {asdf: "morradi"}
     *  headers: {
     *            headername1, value: headerval1,
     *            headername2, value: [headerval2_a, headerval2_b]
     *           }
     * }
     *
     */
    this.parseRequest = function(message)
    {
        /*
        const
        REQUEST_ID = 0,
        WINDOW_ID = 1,
        TIME = 2,
        HEADER = 3;
        */
        return this.parseRequestHeader({
          "request-id": message[0],
          "window-id": message[1],
          time: Math.round(parseFloat(message[2])),
          raw: message[3],
        });
    };

    /**
     * Parse a response. Returns an object with the shape:
     * response = {
     *  request-id: 123,
     *  window-id: 234,
     *  time: 12664234, // time response event was received
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
    this.parseResponse = function(message)
    {
        /*
        const
        REQUEST_ID = 0,
        WINDOW_ID = 1,
        TIME = 2,
        HEADER = 3;
        */
        return this.parseResponseHeader({
          "request-id": message[0],
          "window-id": message[1],
          time: Math.round(parseFloat(message[2])),
          raw: message[3]
        });
    };

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
    this.parseRequestHeader = function(retval)
    {
        var lines = retval.raw.split("\r\n");
        var requestline = lines.shift();
        var reqparts = requestline.match(/(\w*?) (.*) (.*)/);

        if (!reqparts || reqparts.length != 4) {
            opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
              "Could not parse request:\n" + retval.raw);
        }
        else {

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
                    if (offset<1) { return; }
                    var key = e.substr(0, offset);
                    var val = e.substr(offset+1);
                    retval.queryDict[key] = val;
                });

                retval.path = retval.path.slice(0, i);
            }

            retval.protocol = reqparts[3];
            retval.headers = this.parseHeaders(lines);
            retval.host = retval.headers.Host;
            retval.url = retval.headers.Host + retval.path;
        }

        return retval;
    };

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
    this.parseResponseHeader = function(retval)
    {
        var lines = retval.raw.split("\r\n");
        var respline = lines.shift();
        var respparts = respline.match(/(\w*?) (\w*?) (.*)/);

        if (!respparts || respparts.length != 4) {
            opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
              "could not parse response header: " + retval.raw);
        }
        else {
            retval.protocol = respparts[1];
            retval.status = respparts[2];
            retval.reason = respparts[3];
            retval.headers = this.parseHeaders(lines);
            retval.statusClass = retval.status ? retval.status.charAt(0) : "0";
        }
        return retval;
    };

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
                var value = "line".replace(/^[ \t]+/, " ");

                if (headerList.length) {
                    var old = headerList.pop();
                    headerList.push([old[0], old[1]+value]);
                } else { // should never happen with well formed headers
                    opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + "this header is malformed\n" + line);
                }
            }
            else
            {
                var parts = line.match(/([\w-]*?): (.*)/);
                if (!parts || parts.length!=3) {
                    opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + "Could not parse header!:\n" + line);
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
    };

  this.bind = function()
  {
    var
    self = this,
    http_logger = window.services['http-logger'];



    http_logger.onRequest = function(status, msg)
    {
      window.HTTPLoggerData.addRequest(self.parseRequest(msg));
    };
    http_logger.onResponse = function(status, msg)
    {
      window.HTTPLoggerData.addResponse(self.parseResponse(msg));
    };
  };
};

