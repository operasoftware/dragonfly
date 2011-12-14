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
    // if not a top resource, don't reset the context. This usually means it's an iframe

    // When paused, the context will still be reset and the paused status and what
    // you were looking at is trashed. Ideally, the new stuff should be kept on a new 
    // RequestContext object, and when unpausing, that one should be rendered. Hard.
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
    var data = new cls.ResourceManager["1.2"].UrlLoad(msg);

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

  this._on_requestretry_bound = function(msg)
  {
    if (!this._current_context) { return; }
    var data = new cls.ResourceManager["1.0"].RequestRetry(msg);
    this._current_context.update("requestretry", data);
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
    this._res_service.addListener("requestretry", this._on_requestretry_bound);
    this._res_service.addListener("responseheader", this._on_responseheader_bound);
    this._res_service.addListener("response", this._on_response_bound);
    this._res_service.addListener("responsefinished", this._on_responsefinished_bound);
    this._res_service.addListener("urlredirect", this._on_urlredirect_bound);
    this._res_service.addListener("urlfinished", this._on_urlfinished_bound);
    this._doc_service = window.services['document-manager'];
    this._doc_service.addListener("abouttoloaddocument", this._on_abouttoloaddocument_bound);
    messages.addListener('debug-context-selected', this._on_debug_context_selected_bound)
  };

  this.request_body = function(itemid, callback)
  {
    if (!this._current_context) { return; }
    var entry = this._current_context.get_logger_entry(itemid);
    var contentmode = cls.ResourceUtil.mime_to_content_mode(entry.mime);
    var typecode = {datauri: 3, string: 1}[contentmode] || 1;
    var resourceid = entry.resource.id;
    var tag = window.tagManager.set_callback(null, this._on_request_body_bound, [callback, resourceid]);
    this._res_service.requestGetResource(tag, [resourceid, [typecode, 1]]);
  };

  this._on_request_body_bound = function(status, data, callback, resourceid)
  {
    if (status != 0)
    {
      if (!this._current_context) { return; }
      this._current_context.update("responsebody", {resourceID: resourceid}); // this is to set body_unavailable, the object passed represents empty event_data
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
    if (this._current_context)
      this._current_context.clear_resources();
  };

  this.pause = function()
  {
    if (this._current_context)
      this._current_context.pause();
  };

  this.unpause = function()
  {
    if (this._current_context)
      this._current_context.unpause();
  };

  this.is_paused = function()
  {
    if (this._current_context)
      return this._current_context._paused;
  };
  this.init();
};


cls.RequestContext = function()
{
  this._resources = [];

  this._filter_function_bound = function(item)
  {
    var success = true;
    if (this._filters && this._filters.length)
    {
      for (var i = 0, filter; filter = this._filters[i]; i++)
      {
        if (filter.content)
        {
          var list = filter.content.split(",");

          // either type or load_origin matches. pass criteria then depends on is_blacklist.
          var has_match = list.contains(item.type) || list.contains(item.load_origin);
          if (has_match === filter.is_blacklist)
          {
            success = false;
          }
        }
      }
    }
    return success;
  }.bind(this);

  this.get_resources = function()
  {
    var resources = this._resources;
    if (this._paused)
    {
      resources = this._paused_resources;
    }
    return resources;
  }

  this.get_logger_entries = function()
  {
    var entries = [];
    var entries_per_resource = this.get_resources().map(function(res){return res.get_logger_entries()});
    if (entries_per_resource.length)
    {
      entries = entries_per_resource.reduce(function(first, second){return first.concat(second)});
    }
    return entries.filter(this._filter_function_bound);
  }

  this.set_filters = function(filters)
  {
    this._filters = filters;
  }

  this.clear_resources = function()
  {
    this._paused_resources = [];
    this._resources = [];
  }

  this.pause = function()
  {
    // this only pauses adding resources, so that updated info about a request will still show.
    // this works good as long as we don't have things like streaming.
    this._paused_resources = this._resources.slice(0);
    this._paused = true;
  }

  this.unpause = function()
  {
    this._paused_resources = null;
    this._paused = false;
  }

  this.get_duration = function()
  {
    var entries = this.get_logger_entries();
    if (entries.length)
    {
      var starttimes = entries.map(function(e) { return e.starttime });
      var endtimes = entries.map(function(e) { return e.endtime });
      return Math.max.apply(null, endtimes) - Math.min.apply(null, starttimes);
    }
    return 0;
  };

  /**
   * Return duration of request context.
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

    return t;
  };

  this.get_starttime = function()
  {
    return Math.min.apply(null, this.get_logger_entries().map(function(e) { return e.starttime }));
  };

  this.update = function(eventname, event)
  {
    var res = this.get_resource(event.resourceID);

    if (!res)
    {
      if (eventname == "urlload")
      {
        res = new cls.NetworkResource(event.resourceID);
        this._resources.push(res);
      }
      else
      {
        // ignoring. Never saw an urlload, or it's already invalidated
        return;
      }
    }

    // on every urlload, add a new request
    var logger_entry = res && res._logger_entries.last;

    // todo: move this to a verify req_id function (determines changed_request_id)
    var req_ids = res._logger_entries.filter(function(entry){return entry.requestID});
    var last_request_id = req_ids.last && req_ids.last.requestID;
    var event_request_id = event.requestID || event.fromRequestID; // fromRequestID is only for OnRequestRetry
    var changed_request_id = event.requestID &&
                             last_request_id &&
                             (last_request_id != event.requestID);
    if (changed_request_id)
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      " Unexpected change in requestID on " + eventname +
                      ": Change from " + last_request_id + " to " + 
                      event_request_id + ", URL: " + logger_entry.human_url);
    }

    if (eventname == "urlload" || changed_request_id)
    {
      var id = event.resourceID + ":" + res._logger_entries.length;
      logger_entry = new cls.NetworkLoggerEntry(id, res);
      if (res._logger_entries.length)
      {
        // From the second request on, it's only to be rendered when it touched network. Everything 
        // else is too much like an internal request, happens randomly and doesn't mean much.
        logger_entry.invalid_when_network_not_touched = true;
      }
      res._logger_entries.push(logger_entry);
    }
    // todo: this gets overwritten all the time, possibly keep this together with the updates as in "events"
    logger_entry.requestID = event_request_id; // order is important here, for OnRequestRetry requestID gets set again right away

    // for the responsebody event, call update_event_responsebody directly, as this is not recorded in the events of an entry
    if (eventname === "responsebody")
      logger_entry.update_event_responsebody(event);
    else
      logger_entry.update(eventname, event);
    // todo: maybe the request should post a message about having updated, also so the view could update only that
    views.network_logger.update();
  };

  this.get_resource = function(id)
  {
    // as this is to return a resource explicitely, it doesn't use get_resources()
    // because that returnes paused_resources while paused.
    return this._resources.filter(function(e) { return e.id == id; })[0];
  };

  this.get_logger_entry = function(id)
  {
    return this.get_logger_entries().filter(function(e) { return e.id == id; })[0];
  };
};

cls.NetworkResource = function(id)
{
  this.id = id;
  this._logger_entries = [];
  this.get_logger_entries = function()
  {
    return this._logger_entries.filter(function(entry)
    {
      if (entry.invalid_when_network_not_touched && !entry.touched_network)
        return false;
      return true;
    });
  }
}

cls.NetworkLoggerEntry = function(id, resource)
{
  this.id = id;
  this.resource = resource; // todo: apart from the debugging tooltips, this is probably unnecessarry
  this.partial = false;
  this.url = null;
  this.human_url = "No URL";
  this.result = null;
  this.mime = null;
  this.encoding = null;
  this.size = null;
  this.type = null;
  this.urltype = null;
  this.starttime = null;
  this.requesttime = null;
  this.endtime = null;
  this.cached = false;
  this.touched_network = false;
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
  this.is_finished = null;
  this.events = [];

  this.update = function(eventname, eventdata)
  {
    var updatefun = this["_update_event_" + eventname];

    if (!this.events.length)
    {
      this.starttime = eventdata.time;

      var d = new Date(this.starttime);
      var h = "" + d.getHours();
      if (h.length < 2)
        h = "0" + h;
      var m = "" + d.getMinutes();
      if (m.length < 2)
        m = "0" + m;
      var s = "" + d.getSeconds();
      if (s.length < 2)
        s = "0" + s;
      var ms = "" + d.getMilliseconds();
      while (ms.length < 3)
        ms = "0" + ms;
      this.start_time_string = h + ":" + m + ":" + s + ":" + ms;
    }
    if (eventdata.time) // todo: could probably always be done, except for the responsebody event, check if it really needs to be listened to.
    {
      this.endtime = eventdata.time;
    }
    this.events.push({name: eventname, time: eventdata.time, request_id: eventdata.requestID});

    if (updatefun)
    {
      updatefun.call(this, eventdata);
    }
    else
    {
      opera.postError("got unknown event: " + eventname);
    }
  };

  this.get_duration = function()
  {
    return this.events.length && this.endtime - this.starttime;
  }

  this._update_event_urlload = function(event)
  {
    this.url = event.url;
    this.filename = helpers.basename(event.url);
    this.urltype = event.urlType;
    if (event.loadOrigin)
      this.load_origin = {1: "xhr"}[event.loadOrigin];
    // fixme: complete list
    this.urltypeName = {0: "unknown", 1: "http", 2: "https", 3: "file", 4: "data" }[event.urlType];
    this._humanize_url();
    this._guess_type(); // may not yet be correct before mime is set, but will be guessed again anyhow
  };

  this._update_event_urlfinished = function(event)
  {
    this.result = event.result;
    this.mime = event.mimeType;
    this.encoding = event.characterEncoding;
    this.size = event.contentLength;

    // the assumption is that if we got this far, and there was no
    // response code, meaning no request was sent, the url was cached
    // fixme: special case for file URIs
    if (!this.responsecode) { this.cached = true }
    this.is_finished = true;
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
    this.requesttime = event.time;
  };

  this._update_event_requestretry = function(event)
  {
    this.requestID = event.toRequestID;
  };

  this._update_event_response = function(event)
  {
    this.responsestart = event.time;
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

  this.update_event_responsebody = function(event)
  {
    if (!event.mimeType) { this.body_unavailable = true; }
    this.responsebody = event;
  };

  this._update_event_urlredirect = function(event)
  {
      // code
  };

  this._guess_type = function()
  {
    this.type = cls.ResourceUtil.path_to_type(this.url);

    if (this.mime && this.mime.toLowerCase() !== "application/octet-stream")
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
