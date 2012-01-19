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
    // if not a top resource, don't reset the context. This usually means it's an iframe or a redirect
    if (data.parentDocumentID) { return; }
    // todo: The last _on_abouttoloaddocument without parentDocumentID is not always the top document,
    // so we need a way of finding out which one it really is.
    // If the document was loaded because of a redirect, the redirect is the parentDocumentID.
    // Need to also check what happens in case of more top documents that were added to the context.

    // When paused, the context will still be reset and the paused status and what
    // you were looking at is trashed. Ideally, the new stuff should be kept on a new 
    // RequestContext object, and when unpausing, that one should be rendered. Hard.
    this._current_context = new cls.RequestContext();
    this._current_context.saw_main_document_abouttoloaddocument = true; // todo: it would be good to make an indicator in the view that all requests may be shown
  }.bind(this);

  this._on_documentnotification_bound = function(msg)
  {
/*
    message DocumentEvent 
{ 
    enum EventType 
    { 
        NAVIGATION_START = 0; // not handled currently - we have equivalent already: OnAboutToLoadDocument 
        DOMCONTENTLOADED_START = 1; // before DOMContentLoaded event ran 
        DOMCONTENTLOADED_END = 2; // after DOMContentLoaded ran 
        LOAD_START = 3; // before load event ran 
        LOAD_END = 4; // afer load event ran 
        UNLOAD_START = 5; // not handled currently - hard to do properly due to our flaky support for unload - core3 is supposed to address that 
        UNLOAD_END = 6; // same as above 
    } 

    required uint32 windowID = 1; 
    required uint32 frameID = 2; 
    required uint32 documentID = 3; 
    required uint32 resourceID = 4; 
    required EventType eventType = 5; 

     ** 
     * Milliseconds since Unix epoch. 
     *
    required double time = 6; 
}
*/
    if (this._current_context)
    {
      var data = {
        windowID: msg[0],
        frameID: msg[1],
        documentID: msg[2],
        resourceID: msg[3],
        eventType: msg[4],
        time: msg[5]
      };
      var event_name = [
        "NAVIGATION_START",
        "DOMCONTENTLOADED_START",
        "DOMCONTENTLOADED_END",
        "LOAD_START",
        "LOAD_END",
        "UNLOAD_START",
        "UNLOAD_END"][data.eventType];
      if (data.eventType === 1 || data.eventType === 3)
      {
        this._current_context._add_document_notification(event_name, data);
        this._view.update();
      }
    }
  }.bind(this);

  this._on_urlload_bound = function(msg)
  {
    if (!this._current_context)
    {
      this._current_context = new cls.RequestContext();
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
    this._doc_service.addListener("documentnotification", this._on_documentnotification_bound);
    messages.addListener('debug-context-selected', this._on_debug_context_selected_bound)
  };

  this.get_body = function(itemid, callback)
  {
    if (!this._current_context) { return; }
    var entry = this._current_context.get_entry(itemid);
    var contentmode = cls.ResourceUtil.mime_to_content_mode(entry.mime);
    var typecode = {datauri: 3, string: 1}[contentmode] || 1;
    var tag = window.tagManager.set_callback(null, this._on_get_resource_bound, [callback, entry.resource]);
    this._res_service.requestGetResource(tag, [entry.resource, [typecode, 1]]);
  };

  this._on_get_resource_bound = function(status, data, callback, resourceid)
  {
    if (status != 0)
    {
      if (!this._current_context) { return; }
      this._current_context.update("responsebody", {resourceID: resourceid}); // this is to set body_unavailable, the object passed represents empty event_data
      if (callback) { callback() }
    }
    else
    {
      var msg = new cls.ResourceManager["1.2"].ResourceData(data);
      if (!this._current_context) { return; }
      this._current_context.update("responsebody", msg);
      if (callback) { callback() }
    }
  }.bind(this);

  this.get_request_context = function()
  {
    return this._current_context;
  };

  this.clear_entries = function()
  {
    if (this._current_context)
      this._current_context.clear_entries();
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
  this._logger_entries = [];
  this._document_notifications = {};
  this._filters = [];

  // When this is constructed, the context is not paused. Reset the setting.
  settings.network_logger.set("pause", false);

  this._filter_function_bound = function(item)
  {
    var success = false;
    var filters = this._filters;
    if (!filters.length)
    {
      success = true;
    }
    else
    {
      for (var i = 0, filter; filter = filters[i]; i++)
      {
        if (filter && filter.value_list && filter.value_list.length)
        {
          var has_match = filter.value_list.contains(item.type) || 
                          filter.value_list.contains(item.load_origin) || 
                          filter.value_list.contains("");
          if (has_match !== filter.is_blacklist)
          {
            success = true;
            break;
          }
        }
      }
    }
    return success;
  }.bind(this);

  this._add_document_notification = function(event_name, data)
  {
    if (!this._document_notifications[data.documentID])
      this._document_notifications[data.documentID] = {};
    this._document_notifications[data.documentID][event_name] = data;
  }

  this._invalid_if_not_touched_network_filter = function(entry)
  {
    if (entry.invalid_if_not_touched_network && !entry.touched_network)
      return false;
    return true;
  }

  this.get_entries_filtered = function()
  {
    return this.get_entries().filter(this._filter_function_bound);
  }

  this.get_entries = function()
  {
    var entries = this._logger_entries;
    if (this.is_paused())
      entries = this._paused_entries;

    return entries.filter(this._invalid_if_not_touched_network_filter);
  }

  this.get_entries_with_res_id = function(res_id)
  {
    return this._logger_entries.filter(function(e){return e.resource === res_id});
  }

  this.set_filter = function(filters)
  {
    this._filters = [];
    for (var i = 0; i < filters.length; i++)
    {
      var filter = filters[i];
      var blacklist_split = filter.split("|");
      this._filters.push({
        value_list: blacklist_split[0].split(","),
        is_blacklist: (blacklist_split[1] === "true")
      })
    }
  }

  this.clear_entries = function()
  {
    this._paused_entries = [];
    this._logger_entries = [];
  }

  this.pause = function()
  {
    // this only freezes what entries are shown, but they still get updates themselves
    // this works good as long as we don't have things like streaming.
    this._paused_entries = this._logger_entries.slice(0);
    this._paused = true;
  }

  this.unpause = function()
  {
    this._paused_entries = null;
    this._paused = false;
  }

  this.is_paused = function()
  {
    return this._paused;
  };

  this.get_duration = function()
  {
    var entries = this.get_entries_filtered();
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
    return Math.min.apply(null, this.get_entries_filtered().map(function(e) { return e.starttime }));
  };

  this._event_changes_req_id = function(event, last_entry)
  {
    /* 
      Checks if the events requestID is different from the one in the last_entry.
      That shouldn't happen, because "urlload" doesn't have a requestID, and that
      will initiate a new entry.
    */
    return event.requestID &&
           (last_entry.requestID !== event.requestID);
  }

  this.update = function(eventname, event)
  {
    var logger_entry = this.get_entries_with_res_id(event.resourceID).last;
    if (!logger_entry && eventname !== "urlload")
    {
      // ignoring. Never saw an urlload, or it's already invalidated
      return;
    }

    if (logger_entry && logger_entry.requestID)
    {
      var changed_request_id = this._event_changes_req_id(event, logger_entry);
      if (changed_request_id)
      {
        opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                        " Unexpected change in requestID on " + eventname +
                        ": Change from " + logger_entry.requestID + " to " + 
                        event.requestID + ", URL: " + logger_entry.human_url);
      }
    }

    if (eventname == "urlload" || changed_request_id)
    {
      var id = event.resourceID + ":" + this._logger_entries.length;
      logger_entry = new cls.NetworkLoggerEntry(id, this, event.resourceID, event.documentID);
      if (this.get_entries_with_res_id(event.resourceID).length)
      {
        // A second request to a resource is only to be rendered when it touched network. 
        // Everything else is most likely an internal request, happens randomly and 
        // doesn't mean much. See CORE-43063.
        logger_entry.invalid_if_not_touched_network = true;
      }
      this._logger_entries.push(logger_entry);
    }
    logger_entry.requestID = event.requestID;

    // For the responsebody event, call update_event_responsebody directly, as this is not recorded in the events of an entry
    if (eventname === "responsebody")
      logger_entry.update_event_responsebody(event);
    else
      logger_entry.update(eventname, event);

    views.network_logger.update();
  };

  this.get_entry = function(id)
  {
    return this.get_entries_filtered().filter(function(e) { return e.id == id; })[0];
  };
};

cls.NetworkLoggerEntry = function(id, context, resource, document_id)
{
  this.id = id;
  this.context = context;
  this.resource = resource;
  this.document_id = document_id;
  this.url = null;
  this.human_url = "No URL";
  this.result = null;
  this.mime = null;
  this.encoding = null;
  this.size = null;
  this.type = null;
  this.urltype = null;
  this.starttime = null;
  this.starttime_relative = null;
  this.requesttime = null;
  this.endtime = null;
  this.touched_network = false;
  this.request_headers = null;
  this.request_type = null;
  this.requestbody = null;
  this.responses = []; // this should probably be .request_response_flow and contain the requests too.
                       // for example when we get the authentication requests or the SSL handshake, 
                       // or also when a 100-continue response is actually followed by another request.
  this.request_raw = null;
  this.method = null;
  this.status = null;
  this.body_unavailable = false;
  this.is_finished = null;
  this.events = [];

  this.update = function(eventname, eventdata)
  {
    var updatefun = this["_update_event_" + eventname];

    if (!this.events.length)
    {
      this.starttime = eventdata.time;
      this.starttime_relative = this.starttime - this.context.get_starttime();

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
    this.endtime = eventdata.time;
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
    this.document_id = event.documentID;
    if (event.loadOrigin)
      this.load_origin = cls.ResourceManager["1.2"].LoadOrigin[event.loadOrigin].toLowerCase();
    this.urltypeName = cls.ResourceManager["1.2"].UrlLoad.URLType[event.urlType].toLowerCase();
    this._humanize_url();
    this._guess_type(); // may not be correct before mime is set, but will be guessed again when it is
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

    // todo: decide if the cached flag should be for the whole entry or per response. the former may make more sense.
    if (this._current_response && !this._current_response.responsecode) { this._current_response.cached = true }
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
    this._current_response = new cls.NetworkLoggerResponse(this);
    this.responses.push(this._current_response);
    this._current_response._update_event_response(event);
  };

  this._update_event_responseheader = function(event)
  {
    // Sometimes we see no "response" event before we see responseheader,
    // therefor have to init NetworkLoggerResponse here. See CORE-43935.
    if (!this._current_response)
    {
      this._current_response = new cls.NetworkLoggerResponse(this);
      this.responses.push(this._current_response);
    }
    this._current_response._update_event_responseheader(event);
  };

  this._update_event_responsefinished = function(event)
  {
    if (this._current_response)
      this._current_response._update_event_responsefinished(event);
  };

  this.update_event_responsebody = function(event)
  {
    if (this._current_response)
      this._current_response.update_event_responsebody(event);
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

cls.NetworkLoggerResponse = function(entry)
{
  this.responsestart = null;
  this.responsecode = null;
  this.response_headers = null;
  this.response_raw = null;
  this.responsebody = null;
  this.cached = false;

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
    // This is only fired for the last response, and it always has the entire payload.
    // Not really sure if that means that the payload has to be all from the last response.
    // Because of that, we set is_finished on the Entry
    if (event.data && event.data.content)
    {
      this.responsebody = event.data;
    }
    entry.is_finished = true;
  };

  this.update_event_responsebody = function(event)
  {
    if (!event.mimeType) { this.body_unavailable = true; }
    this.responsebody = event;
  };
}