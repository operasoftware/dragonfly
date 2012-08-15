window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.RequestCraftingView = function(id, name, container_class, html, default_handler, service)
{
  this._service = service;
  this._input = null;
  this._output = null;
  this._urlfield = null;
  this._crafter_requests = [];
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
  /*
  this._prev_response = "No response";
  */
  this._prev_url = "";

  /*
  // todo: will see what do on send, resetting is probably annoying.
  this.ondestroy = function()
  {
    this._prev_url = this._urlfield ? this._urlfield.get_value() : "";
    this._prev_request = this._input ? this._input.get_value() : "";
  };
  */

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
    var ctx = this._service.get_request_context(this._service.CONTEXT_TYPE_CRAFTER);
    var entries = [];
    if (ctx)
      entries = ctx.get_entries_filtered();

    // render entries..
    container.clearAndRender(templates.network.request_crafter_main(this._prev_url,
                                                                    this._prev_request,
                                                                    entries));
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

  this._handle_send_request_bound = function()
  {
    var CONTEXT_TYPE_CRAFTER = this._service.CONTEXT_TYPE_CRAFTER;
    // todo: the old contexts will probably be kept for comparing previous requests.
    this._service.remove_request_context(CONTEXT_TYPE_CRAFTER);

    this._prev_url = this._urlfield.get_value();
    var data = this._input.get_value();
    var requestdata = this._parse_request(data);
    if (requestdata)
    {
      var ctx = this._service.get_request_context(CONTEXT_TYPE_CRAFTER, true);
      var crafter_request_id = ctx.send_request(this._prev_url, requestdata);
      this._crafter_requests.push(crafter_request_id);
    }
    else
    {
      // this._prev_response = ui_strings.S_INFO_REQUEST_FAILED;
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

  this._on_context_established_bound = function(message)
  {
    if (message.context_type === this._service.CONTEXT_TYPE_CRAFTER)
    {
      var ctx = this._service.get_request_context(message.context_type);
      ctx.addListener("resource-update", this.update.bind(this));
    }
  }.bind(this);

  var eh = window.eventHandlers;
  eh.click["request-crafter-send"] = this._handle_send_request_bound;
  eh.change["request-crafter-url-change"] = this._handle_url_change_bound;
  eh.keyup["request-crafter-url-change"] = this._handle_url_change_bound;

  this._service.addListener("context-added", this._on_context_established_bound);

  // for onchange and buffermanager  eh.click["request-crafter-send"] = this._handle_send_request_bound;

  this.required_services = ["resource-manager", "document-manager"];
  this.init(id, name, container_class, html, default_handler);
};
cls.RequestCraftingView.prototype = ViewBase;
