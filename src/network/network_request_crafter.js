"use strict";

cls.RequestCrafter = function(logger)
{
  this.network_logger = logger;
  this._requests = [];
  this._init();
};

cls.RequestCrafterPrototype = function()
{
  this.get_request = function(id)
  {
    var eq = window.helpers.eq("id", id);
    return this._requests.filter(eq)[0];
  };

  this.get_requests = function()
  {
    return this._requests;
  }

  this.add_entries_to_requests = function(message)
  {
    // Map entries to issued requests.
    // Todo: Better to check only the updated entry. Message has only resourceID, should probably have entry id too.
    var ctx = this.network_logger.get_crafter_context();
    var entries = ctx.get_entries();
    for (var i = 0, request; request = this._requests[i]; i++)
    {
      var matches_id = window.helpers.eq("crafter_request_id", request.crafter_request_id);
      request.entries = entries.filter(matches_id);
    }
    this.post_message("update");
  };

  this.update_request = function(url, headers)
  {
    // may go when moving this to the request
    var get_selected = window.helpers.eq("id", this.selected);
    var selected_request = this._requests.filter(get_selected)[0];
    if (selected_request.is_sent)
    {
      // Check if url, headers & body still matches the selected request.
      // May not even need to check, if update_request is only called from change event.

      // If something else is in sort of the drafting state, it should be discarded now.
      // But maybe I should be able to prepare a few requests and then fire them in a row.
      // Means they should probably be re-sendable.
      var match_sent = window.helpers.eq("is_sent", true);
      this._requests = this._requests.filter(match_sent);

      this.selected = this._get_uid();
      selected_request = new cls.RequestCrafter.Request(this, this.selected, url, headers);
      this._requests.push(selected_request);
    }
    selected_request.url = url;
    selected_request.headers = headers;
    selected_request.parse_request();
    if (selected_request.parsed_request)
      selected_request.method = selected_request.parsed_request.method;
    this.post_message("update-request-list");
  };

  this.send_request = function()
  {
    var get_selected = window.helpers.eq("id", this.selected);
    var current_request = this._requests.filter(get_selected)[0];
    current_request.send();
  };

  this.clear = function()
  {
    this.network_logger.remove_crafter_request_context();
  }

  this._get_uid = (function()
  {
    var count = 1;
    return function()
    {
      return "uid-" + count++;
    }
  })();

  this._on_context_added = function(message)
  {
    if (message.context_type === cls.NetworkLogger.CONTEXT_TYPE_CRAFTER)
      message.context.addListener("resource-update", this.add_entries_to_requests.bind(this));
  };

  this._init = function()
  {
    this.network_logger.addListener("context-added", this._on_context_added.bind(this));
    this.ua_string = window.services.scope.get_hello_message().userAgent;

    var id = this._get_uid();
    this._requests.push(new cls.RequestCrafter.Request(this, id));
    this.selected = id;
    window.cls.MessageMixin.apply(this);
  };
};

cls.RequestCrafter.prototype = new cls.RequestCrafterPrototype();

cls.RequestCrafter.Request = function(crafter, id, url, headers)
{
  this.is_sent = false;
  this.crafter = crafter;
  this.id = id;
  this.entries = [];
  this.method = "GET";
  this.crafter_request_id = 0;
  this.error_message = null;

  this.url = url || "http://echo.opera.com";
  this.headers = headers || [
    this.method + " / HTTP/1.1",
    "Host: echo.opera.com",
    "User-Agent: " + crafter.ua_string,
    "Accept: text/html, application/xml;q=0.9, application/xhtml xml, image/png, image/jpeg, image/gif, image/x-xbitmap, */*;q=0.1",
    "Accept-Language: en",
    "Accept-Charset: iso-8859-1, utf-8, utf-16, *;q=0.1",
    "Accept-Encoding: deflate, gzip, x-gzip, identity, *;q=0",
    "Connection: Keep-Alive, TE",
    "TE: deflate, gzip, chunked, identity, trailers"
  ].join("\r\n");
  this.parsed_request = null;

  this._init();
};

cls.RequestCrafter.RequestPrototype = function()
{
  this.send = function()
  {
    /*
    this._current_url = this._urlfield.get_value();
    this._current_request = this._headers_field.get_value();
    */
    if (this.parsed_request)
    {
      var ctx = this.crafter.network_logger.get_crafter_context(true);
      this.error_message = null;
      this.crafter_request_id = ctx.send_request(this.url, this.parsed_request);
      this.is_sent = true;
    }
    else
    {
      this.post_message("update");
    }
  };

  this.parse_request = function()
  {
    var requeststr = this.headers;
    var parsed_headers = {};
    var lines = requeststr.split(/\r?\n/);
    var requestline = lines.shift();
    var reqparts = requestline.match(/(\w*?) (.*) (.*)/);
    // .match will return the whole match as [0], slice it off.
    if (!reqparts || (reqparts = reqparts.slice(1)).length != 3)
    {
      // this.error_message = ui_strings.M_NETWORK_CRAFTER_FAILED_PARSE_REQUEST; // probably handle this differently
      return null;
    }

    parsed_headers.method = reqparts[0];
    parsed_headers.path = reqparts[1];
    parsed_headers.protocol = reqparts[2];
    parsed_headers.headers = this._parse_headers(lines);
    parsed_headers.host = parsed_headers.headers.Host;

    for (var n=0, header; header = parsed_headers.headers[n]; n++)
    {
      if (header[0] == "Host")
      {
        parsed_headers.host = header[1]; // don't break. pick up last header if dupes
      }
    }
    parsed_headers.url = this._protocol + parsed_headers.host + parsed_headers.path;

    this.parsed_request = parsed_headers;
  }

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
        if (!parts || parts.length != 3) {
          opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE + "Crafter could not parse header!:\n" + line);
          continue;
        }
        headers.push([parts[1], parts[2].trim()]);
      }
    }
    return headers;
  };

  this._init = function()
  {
    this.parse_request();
  };
};

cls.RequestCrafter.Request.prototype = new cls.RequestCrafter.RequestPrototype();
