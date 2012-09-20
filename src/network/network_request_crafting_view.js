window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.RequestCraftingView = function(id, name, container_class, html, default_handler) {
  this._input = null;
  this._output = null;
  this._urlfield = null;
  this._is_listening = false;
  this._listening_for = null;
  this._resources = {};
  this._uastring = window.services.scope.get_hello_message().userAgent;

  this._request_template = [
    "GET / HTTP/1.1",
    "Host: example.org",
    "User-Agent: " + this._uastring,
    "Accept: text/html, application/xml;q=0.9, application/xhtml xml, image/png, image/jpeg, image/gif, image/x-xbitmap, */*;q=0.1",
    "Accept-Language: en",
    "Accept-Charset: iso-8859-1, utf-8, utf-16, *;q=0.1",
    "Accept-Encoding: deflate, gzip, x-gzip, identity, *;q=0",
    "Connection: Keep-Alive, TE",
    "TE: deflate, gzip, chunked, identity, trailers"
  ].join("\r\n");

  this._prev_request = this._request_template;
  this._prev_response = "No response";
  this._prev_url = "";

  this.ondestroy = function()
  {
    this._prev_url = this._urlfield ? this._urlfield.get_value() : "";
    this._prev_request = this._input ? this._input.get_value() : "";
  };

  this.createView = function(container)
  {
    this._render_main_view(container);
  };

  this.create_disabled_view = function(container)
  {
    container.clearAndRender(window.templates.disabled_view());
  };

  this._render_main_view = function(container)
  {
    container.clearAndRender(templates.network.request_crafter_main(this._prev_url,
                                                                    this._is_listening,
                                                                    this._prev_request,
                                                                    this._prev_response));
    this._urlfield = new cls.BufferManager(container.querySelector("input"));
    this._input = new cls.BufferManager(container.querySelector("textarea"));
    this._output = container.querySelector("code");
  };

  this._parse_url = function(url)
  {
    // Regex! Woo!
    // this one tries to figure out if url is indeed something like a url.
    // Pulls out proto, if it's http(s), host and path if there is one.
    var match = url.match(/^(?:(http(?:s)?):\/\/)(\S*?)(?:\/|$)(?:(.*))/);
    if (match)
    {
      return {protocol: match[1].toUpperCase(), host: match[2], path: "/" + (match[3] || "")};
    }
    return null;
  };

  this._parse_request = function(requeststr)
  {
    var retval = {};
    var lines = requeststr.split(/\r?\n/);
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

        if (headers.length)
        {
          var old = headers.pop();
          headers.push([old[0], old[1]+value]);
        }
        else
        { // should never happen with well formed headers
          opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE + " Crafter: this header is malformed\n" + line);
        }
      }
      else
      {
        var parts = line.match(/([\w-]*?):(.*)/);
        if (!parts || parts.length!=3) {
          opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE + "Crafter could not parse header!:\n" + line);
          continue;
        }
        headers.push([parts[1], parts[2].trim()]);
      }
    }

    return headers;
  };

  this._send_request = function(requestdata)
  {
    var url = this._urlfield.get_value();
    var windowid = window_manager_data.get_debug_context();
    var request = [
      windowid,
      url,
      requestdata.method,
      requestdata.headers,
      null, // payload
      3, // header policy. 2 == overwrite, 3 == replace
      2, // reload policy. 2 == no cache, always reload from network
      null, // request content mode
      [1, 1] // response content mode 1 == string, 1 == decodee
    ];
    this._listening_for = null;
    this._resources = [];
    this._is_listening = true;
    this.ondestroy(); // saves state of in/out
    var tag = window.tagManager.set_callback(null, this._on_send_request_bound)
    this._service.requestCreateRequest(tag, request);
    this.update();
  };

  this._handle_send_request_bound = function()
  {
    var data = this._input.get_value();
    var requestdata = this._parse_request(data);
    if (requestdata)
    {
      this._send_request(requestdata);
    }
    else
    {
      this._prev_response = ui_strings.S_INFO_REQUEST_FAILED;
      this.update();
    }
  }.bind(this);

  this._on_send_request_bound = function(status, msg)
  {
    if (status == 0)
    {
      const RESOURCEID = 0;
      this._listening_for = msg[RESOURCEID];
    }
    else
    {
      this._stop_loading();
      this._prev_response = msg[0];
      this.update();
    }
  }.bind(this);

  this._handle_url_change_bound = function(evt, target)
  {
    var urlstr = target.value;
    this._add_url_info_to_request(this._parse_url(urlstr));
  }.bind(this);

  this._add_url_info_to_request = function(urldata)
  {
    if (!urldata) { return; }
    var current = this._input.get_value();
    current = current.replace(/^(\w+? )(.*?)( .*)/, function(s, m1, m2, m3, all) {return m1 + urldata.path + " " + urldata.protocol + "/1.1" ; });
    current = current.replace(/^Host: .*$?/m, "Host: " + urldata.host);
    this._input.set_value(current);
  };

  /**
   * Since we might get network events before we know what resource we've
   * requested, we need to keep track of all of them until we figure it out.
   * This method determines if the event in data is still relevant.
   */
  this._is_relevant = function(rid)
  {
    if (!this._is_listening) { return false; }
    else if (this._listening_for !== null && rid != this._listening_for) { return false; }
    else if (! (rid in this._resources)) { return false; }
    else { return true; }
  };

  this._on_urlload_bound = function(msg)
  {
    var data = new cls.ResourceManager["1.2"].UrlLoad(msg);
    if (!this._is_listening) { return; }
    if (this._listening_for !== null && this._listening_for != data.resourceID) { return; }
    this._resources[data.resourceID] = {urlload: data};
  }.bind(this);

  this._on_response_bound = function(msg)
  {
    var data = new cls.ResourceManager["1.0"].Response(msg);
    if (!this._is_relevant(data.resourceID)) { return; }
    this._resources[data.resourceID].response = data;
  }.bind(this);

  this._on_responseheader_bound = function(msg)
  {
    var data = new cls.ResourceManager["1.0"].ResponseHeader(msg);
    if (!this._is_relevant(data.resourceID)) { return; }
    this._resources[data.resourceID].responseheader = data;
  }.bind(this);

  this._on_responsefinished_bound = function(msg)
  {
    var data = new cls.ResourceManager["1.0"].ResponseFinished(msg);
    if (!this._is_relevant(data.resourceID)) { return; }
    this._resources[data.resourceID].responsefinished = data;
  }.bind(this);

  this._on_urlfinished_bound = function(msg)
  {
    var data = new cls.ResourceManager["1.0"].UrlFinished(msg);
    if (!this._is_relevant(data.resourceID)) { return; }
    this._resources[data.resourceID].urlfinished = data;
    if (this._listening_for == data.resourceID)
    {
      this._on_got_relevant_response(data);
    }
  }.bind(this);

  this._on_urlredirect_bound = function(msg)
  {
    var data = new cls.ResourceManager["1.0"].UrlRedirect(msg);
    if (!this._is_relevant(data.fromResourceID)) { return; }
    this._resources[data.fromResourceID].urlredirect = data;
    if (this._listening_for == data.fromResourceID)
    {
      this._on_got_relevant_response();
    }
  }.bind(this);

  this._on_got_relevant_response = function()
  {
    var resource = this._resources[this._listening_for];
    this._stop_loading();

    var response = "";

    if (resource.urlfinished && resource.urlfinished.result != 1) // 1 == success
    {
      response = ui_strings.S_INFO_REQUEST_FAILED;
    }
    else
    {
      response = resource.responseheader.raw;
      if (!resource.urlredirect)
      {
        if (resource.responsefinished &&
            resource.responsefinished.data &&
            resource.responsefinished.data.content &&
            resource.responsefinished.data.content.stringData)
        {
          response += resource.responsefinished.data.content.stringData;
        }
      }
    }

    this._prev_response = response;
    this.update();
  };

  this._stop_loading = function()
  {
    this._is_listening = false;
    this._listening_for = null;
    this._resources = {};
  };

  var eh = window.eventHandlers;
  eh.click["request-crafter-send"] = this._handle_send_request_bound;
  eh.change["request-crafter-url-change"] = this._handle_url_change_bound;
  eh.keyup["request-crafter-url-change"] = this._handle_url_change_bound;

  // for onchange and buffermanager  eh.click["request-crafter-send"] = this._handle_send_request_bound;

  this.required_services = ["resource-manager", "document-manager"];
  this._service = window.services['resource-manager'];
  this._service.addListener("urlload", this._on_urlload_bound);
  this._service.addListener("response", this._on_response_bound);
  this._service.addListener("responseheader", this._on_responseheader_bound);
  this._service.addListener("responsefinished", this._on_responsefinished_bound);
  this._service.addListener("urlredirect", this._on_urlredirect_bound);
  this._service.addListener("urlfinished", this._on_urlfinished_bound);

  this.init(id, name, container_class, html, default_handler);
};
cls.RequestCraftingView.prototype = ViewBase;
