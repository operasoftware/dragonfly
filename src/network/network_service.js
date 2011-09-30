/**
 *
 */

cls.NetworkLoggerService = function(view)
{
  if (cls.NetworkLoggerService.instance)
  {
    return cls.NetworkLoggerService.instance;
  }
  cls.NetworkLoggerService.instance = this;

  this._view = view;
  this._current_context = null;

  this._on_abouttoloaddocument_bound = function(msg)
  {
    var data = new cls.DocumentManager["1.0"].AboutToLoadDocument(msg);
    // if not a top resource, just ignore. This usually means it's an iframe
    if (data.parentDocumentID) { return; }
    this._current_context = new cls.RequestContext();
  }.bind(this);

  this._on_urlload_bound = function(msg)
  {
    if (!this._current_context)
    {
      this._current_context = new cls.RequestContext();
      this._current_context.partial = true;
    }
    var data = new cls.ResourceManager["1.0"].UrlLoad(msg);

    this._current_context.update("urlload", data);
  }.bind(this);

  this._on_urlredirect_bound = function(msg)
  {
    if (!this._current_context) { return; }

    var data = new cls.ResourceManager["1.0"].UrlRedirect(msg);
    // a bit of cheating since further down we use .resouceID to determine
    // what resource the event applies to:
    data.resourceID = data.fromResourceID;
    this._current_context.update("urlredirect", data);
  }.bind(this);

  this._on_urlfinished_bound = function(msg)
  {
    if (!this._current_context) { return; }
    var data = new cls.ResourceManager["1.0"].UrlFinished(msg);
    this._current_context.update("urlfinished", data);
  }.bind(this);

  this._on_response_bound = function(msg)
  {
    if (!this._current_context) { return; }
    var data = new cls.ResourceManager["1.0"].Response(msg);
    this._current_context.update("response", data);
  }.bind(this);

  this._on_request_bound = function(msg)
  {
    if (!this._current_context) { return; }
    var data = new cls.ResourceManager["1.0"].Request(msg);
    this._current_context.update("request", data);
  }.bind(this);

  this._on_requestheader_bound = function(msg)
  {
    if (!this._current_context) { return; }
    var data = new cls.ResourceManager["1.0"].RequestHeader(msg);
    this._current_context.update("requestheader", data);
  }.bind(this);

  this._on_requestfinished_bound = function(msg)
  {
    if (!this._current_context) { return; }
    var data = new cls.ResourceManager["1.0"].RequestFinished(msg);
    this._current_context.update("requestfinished", data);
  }.bind(this);

  this._on_responseheader_bound = function(msg)
  {
    if (!this._current_context) { return; }
    var data = new cls.ResourceManager["1.0"].ResponseHeader(msg);
    this._current_context.update("responseheader", data);
  }.bind(this);

  this._on_responsefinished_bound = function(msg)
  {
    if (!this._current_context) { return; }
    var data = new cls.ResourceManager["1.0"].ResponseFinished(msg);
    this._current_context.update("responsefinished", data);
  }.bind(this);

  this._on_debug_context_selected_bound = function()
  {
    this._current_context = null;
    this._view.update();
  }.bind(this);

  this.init = function()
  {
    this._res_service = window.services['resource-manager'];
    this._res_service.addListener("urlload", this._on_urlload_bound);
    this._res_service.addListener("request", this._on_request_bound);
    this._res_service.addListener("requestheader", this._on_requestheader_bound);
    this._res_service.addListener("requestfinished", this._on_requestfinished_bound);
    this._res_service.addListener("responseheader", this._on_responseheader_bound);
    this._res_service.addListener("response", this._on_response_bound);
    this._res_service.addListener("responsefinished", this._on_responsefinished_bound);
    this._res_service.addListener("urlredirect", this._on_urlredirect_bound);
    this._res_service.addListener("urlfinished", this._on_urlfinished_bound);
    this._doc_service = window.services['document-manager'];
    this._doc_service.addListener("abouttoloaddocument", this._on_abouttoloaddocument_bound);
    messages.addListener('debug-context-selected', this._on_debug_context_selected_bound)
  };

  this.request_body = function(rid, callback)
  {
    var resource = this.get_resource(rid);
    var contentmode = cls.ResourceUtil.mime_to_content_mode(resource.mime);
    var typecode = {datauri: 3, string: 1}[contentmode] || 1;
    var tag = window.tagManager.set_callback(null, this._on_request_body_bound, [callback, rid]);
    this._res_service.requestGetResource(tag, [rid, [typecode, 1]]);
  };

  this._on_request_body_bound = function(status, data, callback, rid)
  {
    if (status != 0)
    {
      if (!this._current_context) { return; }
      this._current_context.update("responsebody", {resourceID: rid});
      if (callback) { callback() }
    }
    else
    {
      // fixme: generate class for this.
      var msg = {
        resourceID: data[0],
        mimeType: data[2],
        characterEncoding: data[3],
        contentLength: data[4],
        content: {
          length: data[5][0],
          characterEncoding: data[5][1],
          byteData: data[5][2],
          stringData: data[5][3]
        }
      };
      if (!this._current_context) { return; }
      this._current_context.update("responsebody", msg);
      if (callback) { callback() }
    }
  }.bind(this);

  this.get_request_context = function()
  {
    return this._current_context;
  };

  this.clear_resources = function()
  {
    this._current_context.resources = [];
  };

  this.get_resource = function(rid)
  {
    if (this._current_context)
    {
      return this._current_context.get_resource(rid);
    }
    return null;
  };

  this.init();
};


cls.RequestContext = function()
{
  this.resources = [];
  this.get_duration = function()
  {
    var starttimes = this.resources.map(function(e) { return e.starttime });
    var endtimes = this.resources.map(function(e) { return e.endtime });
    return Math.max.apply(null, endtimes) - Math.min.apply(null, starttimes);
  };

  /**
   * Return duration of request context, rounded upp to closest full second.
   * if width and padlen is set, add the ammount of milliseconds needed to
   * the duration needed to accomodate padlen pixels.
   */
  this.get_coarse_duration = function(padlen, width)
  {
    var t = this.get_duration();

    if (padlen && width)
    {
      var millis_per_px = t / width;
      t += (millis_per_px * padlen);
    }

    return Math.ceil(t/1000)*1000;
  };

  this.get_starttime = function()
  {
    return Math.min.apply(null, this.resources.map(function(e) { return e.starttime }));
  };

  this.update = function(eventname, event)
  {
    var res = this.get_resource(event.resourceID);

    if (!res && eventname == "urlload")
    {
      res = new cls.Request(event.resourceID);
      if (this.resources.length == 0) { this.topresource = event.resourceID; }
      this.resources.push(res);
    }
    else if (!res)
    {
      // ignoring. Never saw an urlload, or it's allready invalidated
      return
    }
    res.update(eventname, event);
  };

  this.get_resource = function(id)
  {
    return this.resources.filter(function(e) { return e.id == id; })[0];
  };

  this.get_resources_for_types = function()
  {
    var types = Array.prototype.slice.call(arguments, 0);
    var filterfun = function(e) { return types.indexOf(e.type) > -1;};
    return this.resources.filter(filterfun);
  };

  this.get_resources_for_mimes = function()
  {
    var mimes = Array.prototype.slice.call(arguments, 0);
    var filterfun = function(e) { return mimes.indexOf(e.mime) > -1; };
    return this.resources.filter(filterfun);
  };

  this.get_resource_groups = function()
  {
    var imgs = this.get_resources_for_type("image");
    var stylesheets = this.get_resources_for_mime("text/css");
    var markup = this.get_resources_for_mime("text/html",
                                             "application/xhtml+xml");
    var scripts = this.get_resources_for_mime("application/javascript",
                                              "text/javascript");

    var known = [].concat(imgs, stylesheets, markup, scripts);
    var other = this.resources.filter(function(e) {
      return known.indexOf(e) == -1;
    });
    return {
      images: imgs, stylesheets: stylesheets, markup: markup,
      scripts: scripts, other: other
    };
  };
};

cls.Request = function(id)
{
  this.id = id;
  this.partial = false;
  this.finished = false;
  this.url = null;
  this.human_url = "No URL";
  this.result = null;
  this.mime = null;
  this.encoding = null;
  this.size = null;
  this.type = null;
  this.urltype = null;
  this.invalid = false;
  this.starttime = null;
  this.requesttime = null;
  this.endtime = null;
  this.cached = false;
  this.touched_network = false;
  this.duration = null;
  this.request_headers = null;
  this.request_type = null;
  this.requestbody = null;
  this.response_headers = null;
  this.request_raw = null;
  this.response_raw = null;
  this.method = null;
  this.status = null;
  this.body_unavailable = false;
  this.responsecode = null;
  this.responsebody = null;

  this.update = function(eventname, eventdata)
  {
    var updatefun = this["_update_event_" + eventname];
    if (updatefun)
    {
      updatefun.call(this, eventdata);
    }
    else
    {
      opera.postError("got unknown event: " + eventname);
    }
  };

  this._update_event_urlload = function(event)
  {
    this.url = event.url;
    this.urltype = event.urlType;
    this.starttime = Math.round(event.time);
    // fixme: complete list
    this.urltypeName = {0: "unknown", 1: "http", 2: "https", 3: "file", 4: "data" }[event.urlType];
    this._humanize_url();
  };

  this._update_event_urlfinished = function(event)
  {
    this.result = event.result;
    this.mime = event.mimeType;
    this.encoding = event.characterEncoding;
    this.size = event.contentLength;
    this.endtime = Math.round(event.time);
    this.duration = this.endtime - this.starttime;

    // the assumption is that if we got this far, and there was no
    // response code, meaning no request was sent, the url was cached
    // fixme: special case for file URIs
    if (!this.responsecode) { this.cached = true }
    this.finished = true;
    this._guess_type();
    this._humanize_url();
  };

  this._update_event_request = function(event)
  {
    this.method = event.method;
    this.touched_network = true;
  };

  this._update_event_requestheader = function(event)
  {
    this.request_headers = event.headerList;
    this.request_raw = event.raw;
    for (var n=0, header; header = this.request_headers[n]; n++)
    {
      if (header.name.toLowerCase() == "content-type")
      {
        this.request_type = header.value;
        break;
      }
    }
  };

  this._update_event_requestfinished = function(event)
  {
    if (event.data)
    {
      this.requestbody = event.data;
      // in time we can use the mime-type member here rather than grabbing it
      // from the headers. See CORE-39597
      this.requestbody.mimeType = this.request_type;
    }
    this.requesttime = Math.round(event.time);
  };

  this._update_event_response = function(event)
  {
    this.responsestart = Math.round(event.time);
    this.responsecode = event.responseCode;
    if (this.responsecode == "304") { this.cached = true }
  };

  this._update_event_responseheader = function(event)
  {
    this.response_headers = event.headerList;
    this.response_raw = event.raw;
  };

  this._update_event_responsefinished = function(event)
  {
    if (event.data && event.data.content)
    {
      this.responsebody = event.data;
    }
  };

  this._update_event_responsebody = function(event)
  {
    if (!event.mimeType) { this.body_unavailable = true; }
    this.responsebody = event;
  };

  this._update_event_urlredirect = function(event)
  {
      // code
  };

  this.get_source = function()
  {
    // cache, file, http, https ..
  };

  this._guess_type = function()
  {
    if (!this.finished || !this.mime)
    {
      this.type = undefined;
    }
    else if (this.mime.toLowerCase() == "application/octet-stream")
    {
      this.type = cls.ResourceUtil.path_to_type(this.url);
    }
    else
    {
      this.type = cls.ResourceUtil.mime_to_type(this.mime);
    }
  };

  this._humanize_url = function()
  {
    this.human_url = this.url;
    if (this.urltype == 4) // data URI
    {
      if (this.type)
      {
        this.human_url = this.type + " data URI";
      }
      else
      {
        this.human_url = "data URI";
      }
    }
  };
};
