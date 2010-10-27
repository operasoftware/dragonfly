window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.RequestCraftingView = function(id, name, container_class, html, default_handler) {
  this._input = null;
  this._output = null;
  this._protocol = "http://";
  this._is_listening = false;
  this._listening_for = null;
  this._resources = {};

  this._request_template = [
    "GET / HTTP/1.1",
    "User-Agent: Opera/9.80 (Windows NT 5.1; U; en) Presto/2.2.15 Version/10.00",
    "Host: www.opera.com",
    "Accept: text/html, application/xml;q=0.9, application/xhtml xml, image/png, image/jpeg, image/gif, image/x-xbitmap, */*;q=0.1",
    "Accept-Language: nb-NO,nb;q=0.9,no-NO;q=0.8,no;q=0.7,en;q=0.6",
    "Accept-Charset: iso-8859-1, utf-8, utf-16, *;q=0.1",
    "Accept-Encoding: deflate, gzip, x-gzip, identity, *;q=0",
    "Connection: Keep-Alive, TE",
    "TE: deflate, gzip, chunked, identity, trailers"
  ].join("\r\n");

  this._prev_request = this._request_template;
  this._prev_response = "No response";

  this.ondestroy = function()
  {

  };

  this.createView = function(container)
  {
    this._render_main_view(container);
  };

  this._render_main_view = function(container)
  {
    container.clearAndRender(templates.network_request_crafter_main(this._prev_request,
                                                                    this._prev_response));
    this._input = new cls.BufferManager(container.querySelector("textarea"));
    this._output = container.querySelector("code");
  };

  this._check_raw_request = function()
  {

  };

  this._parse_request = function(requeststr)
  {
    var retval = {};
    var lines = requeststr.split("\r\n");
    var requestline = lines.shift();
    var reqparts = requestline.match(/(\w*?) (.*) (.*)/);

    if (!reqparts || reqparts.length != 4) {
        return null; // fixme: tell what's wrong
    }

    retval.method = reqparts[1];
    retval.path = reqparts[2];
    retval.protocol = reqparts[3];
    retval.headers = this._parse_headers(lines);
    retval.host = retval.headers.Host;

    for (var n=0, header; header=retval.headers[n]; n++)
    {
      if (header[0] == "Host")
      {
        retval.host = header[1]; // don't break. pick up last header if dupes
      }
    }
    retval.url = this._protocol + retval.host + retval.path;
    return retval;
  };

  this._parse_headers = function(lines)
  {
    var headers = [];

    for (var n=0, line; line=lines[n]; n++)
    {
      if (line.indexOf(" ") == 0 || line.indexOf("\t") == 0)
      {
        // this is a continuation from the previous line
        // Replace all leading whitespace with a single space
        var value = "line".replace(/^[ \t]+/, " ");

        if (header.length)
        {
          var old = headers.pop();
          headers.push([old[0], old[1]+value]);
        }
        else
        { // should never happen with well formed headers
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

        headers.push([parts[1], parts[2]]);
      }
    }

    return headers;
  };

  this._send_request = function(requestdata)
  {
    var windowid = window_manager_data.get_debug_context();
    var request = [
      windowid,
      requestdata.url,
      requestdata.method,
      requestdata.headers,
      null, // payload
      3, // header policy. 3 == replace
      2, // reload policy. 2 == no cache, always reload from network
      null, // request content mode
      [3, 1]
    ];
    this._listening_for = null;
    this._resources = [];
    this._is_listening = true;

    var tag = window.tagManager.set_callback(null, this._on_send_request_bound)
    this._service.requestCreateRequest(tag, request);
  };

  this._handle_send_request_bound = function()
  {
    var data = this._input.get_value();
    var requestdata = this._parse_request(data);
    this._send_request(requestdata);
  }.bind(this);

  this._on_send_request_bound = function(status, msg)
  {
    const RESOURCEID = 0;
    this._listening_for = msg[RESOURCEID];
  }.bind(this);

  /**
   * Since we might get network events before we know what resource we've
   * requested, we need to keep track of all of them until we figure it out.
   * This method determines if the event in data is still relevant.
   */
  this._is_relevant = function(data)
  {
    if (!this._is_listening) { return false; }
    else if (this._listening_for !== null &&
             data.resourceID != this._listening_for) { return false; }
    else if (! (data.resourceID in this._resources)) { return false; }
    else { return true; }
  }

  this._on_urlload_bound = function(msg)
  {
    var data = new cls.ResourceManager["1.0"].UrlLoad(msg);
    if (!this._is_listening) { return; }
    if (this._listening_for !== null && this._listening_for != data.resourceID) { return; }
    this._resources[data.resourceID] = {urlload: data};
  }.bind(this);

  this._on_response_bound = function(msg)
  {
    var data = new cls.ResourceManager["1.0"].Response(msg);
    if (!this._is_relevant(data)) { return; }
    this._resources[data.resourceID].response = data;
  }.bind(this);

  this._on_responseheader_bound = function(msg)
  {
    var data = new cls.ResourceManager["1.0"].ResponseHeader(msg);
    if (!this._is_relevant(data)) { return; }
    this._resources[data.resourceID].responseheader = data;
  }.bind(this);

  this._on_responsefinished_bound = function(msg)
  {
    var data = new cls.ResourceManager["1.0"].ResponseFinished(msg);
    if (!this._is_relevant(data)) { return; }
    this._resources[data.resourceID].responsefinished = data;
  }.bind(this);

  this._on_urlfinished_bound = function(msg)
  {
    var data = new cls.ResourceManager["1.0"].UrlFinished(msg);
    if (!this._is_relevant(data)) { return; }
    this._resources[data.resourceID].urlfinished = data;
    if (this._listening_for == data.resourceID)
    {
      this._on_got_relevant_response(data);
    }
  }.bind(this);

  this._on_got_relevant_response = function(data)
  {
    this._is_listening = false;
    var resource = this._resources[this._listening_for]
    this._listening_for = null;
    this._resources = {};
    var response = resource.responseheader.raw + resource.responsefinished.resourceData
    this._prev_response = response;
    this.update();
  };

  var eh = window.eventHandlers;
  eh.click["request-crafter-send"] = this._handle_send_request_bound;
// for onchange and buffermanager  eh.click["request-crafter-send"] = this._handle_send_request_bound;


  this._service = window.services['resource-manager'];
  this._service.addListener("urlload", this._on_urlload_bound);
  this._service.addListener("request", this._on_request_bound);
  this._service.addListener("requestheader", this._on_requestheader_bound);
  this._service.addListener("requestfinished", this._on_requestfinished_bound);
  this._service.addListener("response", this._on_response_bound);
  this._service.addListener("responseheader", this._on_responseheader_bound);
  this._service.addListener("responsefinished", this._on_responsefinished_bound);
  this._service.addListener("urlfinished", this._on_urlfinished_bound);

  this.init(id, name, container_class, html, default_handler);
};
cls.RequestCraftingView.prototype = ViewBase;








