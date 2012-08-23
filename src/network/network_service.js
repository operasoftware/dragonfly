"use strict";

cls.NetworkLoggerService = function()
{
  this._current_context = null;

  this._on_abouttoloaddocument_bound = function(msg)
  {
    var data = new cls.DocumentManager["1.0"].AboutToLoadDocument(msg);

    if (!this._current_context)
      this._current_context = new cls.RequestContext();

    if (!data.parentDocumentID)
    {
      // This basically means "unload" for that windowID, potentially
      // existing data for that windowID needs to be cleared now.
      this._current_context.remove_window_context(data.windowID);
    }

    var window_context = this._current_context.get_window_context(data.windowID);
    if (!window_context)
    {
      var window_context = new cls.NetworkLoggerService.WindowContext(data.windowID);
      this._current_context.window_contexts.push(window_context);
      if (!data.parentDocumentID)
      {
        window_context.saw_main_document = true;
      }
    }
  }.bind(this);

  this._on_urlload_bound = function(msg)
  {
    if (!this._current_context)
      this._current_context = new cls.RequestContext();

    var data = new cls.ResourceManager["1.2"].UrlLoad(msg);
    this._current_context.update("urlload", data);
  }.bind(this);

  this._on_urlredirect_bound = function(msg)
  {
    if (!this._current_context)
      return;


    var data = new cls.ResourceManager["1.0"].UrlRedirect(msg);
    // a bit of cheating since further down we use .resouceID to determine
    // what resource the event applies to:
    data.resourceID = data.fromResourceID;
    this._current_context.update("urlredirect", data);
  }.bind(this);

  this._on_urlfinished_bound = function(msg)
  {
    if (!this._current_context)
      return;

    var data = new cls.ResourceManager["1.0"].UrlFinished(msg);
    this._current_context.update("urlfinished", data);
  }.bind(this);

  this._on_response_bound = function(msg)
  {
    if (!this._current_context)
      return;

    var data = new cls.ResourceManager["1.0"].Response(msg);
    this._current_context.update("response", data);
  }.bind(this);

  this._on_request_bound = function(msg)
  {
    if (!this._current_context)
      return;

    var data = new cls.ResourceManager["1.0"].Request(msg);
    this._current_context.update("request", data);
  }.bind(this);

  this._on_requestheader_bound = function(msg)
  {
    if (!this._current_context)
      return;

    var data = new cls.ResourceManager["1.0"].RequestHeader(msg);
    this._current_context.update("requestheader", data);
  }.bind(this);

  this._on_requestfinished_bound = function(msg)
  {
    if (!this._current_context)
      return;

    var data = new cls.ResourceManager["1.0"].RequestFinished(msg);
    this._current_context.update("requestfinished", data);
  }.bind(this);

  this._on_requestretry_bound = function(msg)
  {
    if (!this._current_context)
      return;

    var data = new cls.ResourceManager["1.0"].RequestRetry(msg);
    this._current_context.update("requestretry", data);
  }.bind(this);

  this._on_responseheader_bound = function(msg)
  {
    if (!this._current_context)
      return;

    var data = new cls.ResourceManager["1.0"].ResponseHeader(msg);
    this._current_context.update("responseheader", data);
  }.bind(this);

  this._on_responsefinished_bound = function(msg)
  {
    if (!this._current_context)
      return;

    var data = new cls.ResourceManager["1.0"].ResponseFinished(msg);
    this._current_context.update("responsefinished", data);
  }.bind(this);

  this._on_urlunload_bound = function(msg)
  {
    if (!this._current_context)
      return;

    var data = new cls.ResourceManager["1.2"].UrlUnload(msg);
    this._current_context.update("urlunload", data);
  }.bind(this);

  this._on_debug_context_selected_bound = function()
  {
    this.clear_request_context();
  }.bind(this);

  this._setup_request_body_behaviour_bound = function()
  {
    var text_types = ["text/html", "application/xhtml+xml", "application/mathml+xml",
                     "application/xslt+xml", "text/xsl", "application/xml",
                     "text/css", "text/plain", "application/x-javascript",
                     "application/json", "application/javascript", "text/javascript",
                     "application/x-www-form-urlencoded", "text/json",
                     "text/xml",
                     ""]; // <- Yes really.
                     // It's frelling silly, but there's a bug with core not giving us content types
                     // for post data, even though core generates that itself. See CORE-39597

    var STRING = 1, DECODE = 1, OFF = 4;
    var reqarg = [[OFF],
                 text_types.map(function(e) { return [e, [STRING, DECODE]]})
                ];

    window.services["resource-manager"].requestSetRequestMode(null, reqarg);
    this.setup_content_tracking_bound();
  }.bind(this);

  this.init = function()
  {
    this._res_service = window.services["resource-manager"];
    this._res_service.addListener("enable-success", this._setup_request_body_behaviour_bound);

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
    this._res_service.addListener("urlunload", this._on_urlunload_bound);

    this._doc_service = window.services["document-manager"];
    this._doc_service.addListener("abouttoloaddocument", this._on_abouttoloaddocument_bound);

    messages.addListener("debug-context-selected", this._on_debug_context_selected_bound);
    messages.addListener("setting-changed", this._on_setting_changed_bound);
  };

  this._on_setting_changed_bound = function(message)
  {
    if (message.id === "network_logger" &&
        message.key === "track-content")
    {
      this.setup_content_tracking_bound();
    }
  }.bind(this);

  this.setup_content_tracking_bound = function()
  {
    var OFF = 4;
    var DATA_URI = 3;
    var STRING = 1;
    var DECODE = 1;
    this._track_bodies = settings.network_logger.get("track-content");

    if (this._track_bodies)
    {
      var text_types = ["text/html", "application/xhtml+xml", "application/mathml+xml",
                        "application/xslt+xml", "text/xsl", "application/xml",
                        "text/css", "text/plain", "application/x-javascript",
                        "application/json", "application/javascript", "text/javascript",
                        "application/x-www-form-urlencoded", "text/json"];

      var resparg = [[DATA_URI, DECODE],
                     text_types.map(function(e) { return [e, [STRING, DECODE]]})
                    ];
    }
    else
    {
      var resparg = [[OFF]];
    }
    this._res_service.requestSetResponseMode(cls.TagManager.IGNORE_RESPONSE, resparg);
  }.bind(this);

  this.get_resource_info = function(resource_id)
  {
    // Returns a ResourceInfo based on the most recent Entry with that resource_id.
    var entry = this._current_context &&
                this._current_context.get_entries_with_res_id(resource_id).last;
    if (entry && entry.current_response && entry.current_response.responsebody)
    {
      return new cls.ResourceInfo(entry);
    }
    return null;
  };

  this.get_request_context = function()
  {
    return this._current_context;
  };

  this.clear_request_context = function()
  {
    this._current_context = null;
    window.messages.post("network-context-cleared");
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

  this.__defineGetter__("is_paused", function()
  {
    if (this._current_context)
      return this._current_context.is_paused;
  });

  this.__defineSetter__("is_paused", function(){});

  this.init();
};

cls.NetworkLoggerService.WindowContext = function(window_id)
{
  this.id = window_id;
  this.saw_main_document = false;
  this.entry_ids = [];
}

cls.RequestContext = function()
{
  this._logger_entries = [];
  this._filters = [];
  this.window_contexts = [];
  this._init();
};

cls.RequestContextPrototype = function()
{
  this._init = function()
  {
    // When a new context is initiated, it's not paused by default. Reset the setting.
    // Todo: Ideally, when paused, the new context should be created in a different
    // place, so the old one can be kept while we're on pause.
    if (settings.network_logger.get("pause") != false)
      settings.network_logger.set("pause", false);

    this._filter_function_bound = this._filter_function.bind(this);
  };

  this._filter_function = function(item)
  {
    var success = false;
    for (var i = 0, filter; filter = this._filters[i]; i++)
    {
      filter.is_blacklist = Boolean(filter.is_blacklist);
      if (filter.type_list)
      {
        var has_match = filter.type_list.contains(item.type);
        if (has_match != filter.is_blacklist)
          success = true;
      }
      if (filter.origin_list)
      {
        var has_match = filter.origin_list.contains(item.load_origin_name);
        if (has_match != filter.is_blacklist)
          success = true;
      }
    }
    return success;
  };

  this.get_entries_filtered = function()
  {
    return this.get_entries().filter(this._filter_function_bound);
  };

  this.get_entries = function()
  {
    var entries = this._logger_entries;
    if (this.is_paused)
      entries = this._paused_entries;

    return entries;
  };

  this.get_entries_with_res_id = function(res_id)
  {
    return this._logger_entries.filter(
      function(e) {
        return e.resource_id === res_id
      }
    );
  };

  this.set_filters = function(filters)
  {
    this._filters = filters;
  };

  this.pause = function()
  {
    // this only freezes what entries are shown, but they still get updates themselves
    // this works good as long as we don't have things like streaming.
    this._paused_entries = this._logger_entries.slice(0);
    this.is_paused = true;
  };

  this.unpause = function()
  {
    this._paused_entries = null;
    this.is_paused = false;
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
    var entries = this.get_entries_filtered();
    if (entries.length)
      return Math.min.apply(null, entries.map(function(e) { return e.starttime }));
  };

  this._event_changes_req_id = function(event, current_entry)
  {
    /*
      Checks if the event's requestID is different from the one in current_entry.
      That should never be the case, since the "urlload" event initiates
      a new entry and that doesn't have a requestID. Note that current_entry is
      the last entry we saw with the event's resourceID.
    */
    return event.requestID &&
           (current_entry.request_id !== event.requestID);
  };

  this.update = function(eventname, event)
  {
    if (event.windowID)
    {
      var matching_window_context = this.get_window_context(event.windowID);
      if (!matching_window_context)
      {
        this.window_contexts.push(new cls.NetworkLoggerService.WindowContext(event.windowID));
      }
    }

    var logger_entries = this.get_entries_with_res_id(event.resourceID);
    if (!logger_entries.length && eventname !== "urlload")
    {
      // ignoring. Never saw an urlload, or it's already invalidated
      return;
    }

    var logger_entry = logger_entries.last;
    if (logger_entry && logger_entry.request_id)
    {
      /*
        The same resource id can be loaded several times, but then the request id changes.
        It's not loaded multiple times in parallel though, so the following check would
        emit errors if that would happen. There is at least one NetworkLoggerEntry per
        resource ID, but several entries can refer to the same.
        Note: Retry events change the request id, but the Entry stays the same.
      */
      var changed_request_id = this._event_changes_req_id(event, logger_entry);
      if (changed_request_id)
      {
        opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                        " Unexpected change in requestID on " + eventname +
                        ": Change from " + logger_entry.request_id + " to " +
                        event.requestID + ", URL: " + logger_entry.human_url);
      }
    }

    if (eventname == "urlload" || changed_request_id)
    {
      var id = this._get_uid();
      logger_entry = new cls.NetworkLoggerEntry(id, event.resourceID, event.documentID, this.get_starttime());
      this._logger_entries.push(logger_entry);
      // Store the id in the list of entries in the window_context
      var window_context = this.get_window_context(event.windowID);
      window_context.entry_ids.push(id);
    }
    logger_entry.request_id = event.requestID;
    logger_entry.update(eventname, event);

    if (!this.is_paused)
      window.messages.post("network-resource-updated", {id: event.resourceID});

  };

  this.remove_window_context = function(window_id)
  {
    var window_context = this.get_window_context(window_id);
    var ids_to_remove = window_context && window_context.entry_ids;
    // Remove entries
    if (ids_to_remove && ids_to_remove.length)
    {
      this._logger_entries = this._logger_entries.filter(
        function(entry){
          return !ids_to_remove.contains(entry.id);
        }
      );
    }
    // Remove the window_context itself
    this.window_contexts = this.window_contexts.filter(
      function(context)
      {
        return window_id != context.id;
      }
    );
  };

  this.get_entry_from_filtered = function(id)
  {
    return this.get_entries_filtered().filter(function(e) { return e.id == id; })[0];
  };

  this.get_entry = function(id)
  {
    return this.get_entries().filter(function(e) { return e.id == id; })[0];
  };

  this._get_uid = (function()
  {
    var count = 1;
    return function()
    {
      return "uid-" + count++;
    }
  })();

  this.discard_incomplete_warning = function(window_id)
  {
    for (var i = 0, window_context; window_context = this.window_contexts[i]; i++)
    {
      if (window_context.id === window_id)
        window_context.incomplete_warn_discarded = true;

    }
  };

  this.get_window_context = function(window_id)
  {
    return this.window_contexts.filter(helpers.eq("id", window_id))[0];
  };

};

cls.RequestContext.prototype = new cls.RequestContextPrototype();

cls.NetworkLoggerEntry = function(id, resource_id, document_id, context_starttime)
{
  this.id = id;
  this.request_id = 0;
  this.resource_id = resource_id;
  this.document_id = document_id;
  this.context_starttime = context_starttime;
  this.url = null;
  this.human_url = "No URL";
  this.result = null;
  this.mime = null;
  this.encoding = null;
  this.size = null;
  this.type = null;
  this.urltype = null;
  this.starttime = 0;
  this.starttime_relative = 0;
  this.endtime = null;
  this.is_unloaded = false;
  this.is_finished = false;
  this.events = [];
  this.event_sequence = [];
  this.requests_responses = [];
  this.current_responsecode = null;
  this.error_in_current_response = false;
  this.called_get_body = false;
  this.get_body_unsuccessful = false;
  this._current_request = null;
  this._current_response = null;
  this._set_is_finished_on_responsefinished = false;
};

cls.NetworkLoggerEntryPrototype = function()
{
  var unlisted_events = ["urlunload"];

  var CLASSNAME_BLOCKED = "blocked";
  var CLASSNAME_REQUEST = "request";
  var CLASSNAME_WAITING = "waiting";
  var CLASSNAME_RECEIVING = "receiving";
  var CLASSNAME_IRREGULAR = "irregular";

  /*  // gap_def format:
  {
     classname: type of sequence,
     sequences: {
       from_event_name: {
         to_event_name_one: string,
         to_event_name_two: string
       ]
     }
   } */

  var gap_defs = {
    "urlload": {
        "request": {
          title: ui_strings.S_HTTP_EVENT_SEQUENCE_INFO_SCHEDULING,
          classname: CLASSNAME_BLOCKED
        },
        "urlfinished": {
          title: ui_strings.S_HTTP_EVENT_SEQUENCE_INFO_READING_LOCAL_DATA,
          classname: CLASSNAME_BLOCKED
        },
        // The response-phase can be closed without ever seeing a response event, for
        // example because the request was aborted. See CORE-43284.
        "responsefinished": {
          title: ui_strings.S_HTTP_EVENT_SEQUENCE_INFO_CLOSING_RESPONSE_PHASE,
          classname: CLASSNAME_BLOCKED
        }
    },
    "requestretry": {
        "request": {
          title: ui_strings.S_HTTP_EVENT_SEQUENCE_INFO_SCHEDULING,
          classname: CLASSNAME_BLOCKED
        }
    },
    "responsefinished": {
        "urlfinished": {
          title: ui_strings.S_HTTP_EVENT_SEQUENCE_INFO_PROCESSING_RESPONSE,
          classname: CLASSNAME_BLOCKED
        }
        // responsefinished can occur twice, see CORE-43284. CI 277 has the fix.
    },
    "urlredirect": {
        "urlfinished": {
          title: ui_strings.S_HTTP_EVENT_SEQUENCE_INFO_READING_LOCAL_DATA,
          classname: CLASSNAME_BLOCKED
        },
        // This probably means that the request is closed because it was decided to redirect instead of waiting for a response
        "responsefinished": {
          title: ui_strings.S_HTTP_EVENT_SEQUENCE_INFO_CLOSING_RESPONSE_PHASE,
          classname: CLASSNAME_BLOCKED
        }
    },
    "requestheader": {
        "requestfinished": {
          title: ui_strings.S_HTTP_EVENT_SEQUENCE_WRITING_REQUEST_BODY,
          classname: CLASSNAME_REQUEST
        }
    },
    "request": {
        "requestheader": {
          title: ui_strings.S_HTTP_EVENT_SEQUENCE_WRITING_REQUEST_HEADER,
          classname: CLASSNAME_REQUEST
        },
        "requestfinished": {
          title: ui_strings.S_HTTP_EVENT_SEQUENCE_WRITING_REQUEST_BODY,
          classname: CLASSNAME_REQUEST
        }
    },
    "requestfinished": {
        "response": {
          title: ui_strings.S_HTTP_EVENT_SEQUENCE_WAITING_FOR_RESPONSE,
          classname: CLASSNAME_WAITING
        },
        "responsefinished": {
          title: ui_strings.S_HTTP_EVENT_SEQUENCE_INFO_CLOSING_RESPONSE_PHASE,
          classname: CLASSNAME_WAITING
        }
    },
    "response": {
        "responseheader": {
          title: ui_strings.S_HTTP_EVENT_SEQUENCE_READING_RESPONSE_HEADER,
          classname: CLASSNAME_RECEIVING
        }
    },
    "responseheader": {
        "responsefinished": {
          title: ui_strings.S_HTTP_EVENT_SEQUENCE_READING_RESPONSE_BODY,
          classname: CLASSNAME_RECEIVING
        },
        // Occurs when a 100-Continue response was sent. In this timespan the client has
        // ignored it and waits for another response to come in. See CORE-43264.
        "response": {
          title: ui_strings.S_HTTP_EVENT_SEQUENCE_WAITING_FOR_RESPONSE,
          classname: CLASSNAME_WAITING
        },
        // For example on a HEAD request, the url is finished after headers came in
        "urlfinished": {
          title: ui_strings.S_HTTP_EVENT_SEQUENCE_INFO_PROCESSING,
          classname: CLASSNAME_BLOCKED
        }
      }
  };

  // What is not defined as it's own case by the above, but it terminated by
  // urlredirect, requestretry or urlfinished, will be defined regardless of the preceding event

  /* // gap_def_to_phase format:
  {
     classname: type of sequence,
     sequences: {
       to_event_name: string
     }
   } */
  var gap_defs_to_phase = {
    "urlredirect": {
      title: ui_strings.S_HTTP_EVENT_SEQUENCE_INFO_REDIRECTING,
      classname: CLASSNAME_BLOCKED
    },
    "requestretry": {
      title: ui_strings.S_HTTP_EVENT_SEQUENCE_INFO_ABORT_RETRYING,
      classname: CLASSNAME_IRREGULAR
    },
    "urlfinished": {
      title: ui_strings.S_HTTP_EVENT_SEQUENCE_INFO_ABORTING_REQUEST,
      classname: CLASSNAME_IRREGULAR
    }
  };

  this.update = function(eventname, eventdata)
  {
    var updatefun = this["_update_event_" + eventname];

    if (!this.events.length)
    {
      this.starttime = eventdata.time;
      if (this.context_starttime)
        this.starttime_relative = this.starttime - this.context_starttime;

      var d = new Date(this.starttime);
      var h = String(d.getHours()).zfill(2);
      var m = String(d.getMinutes()).zfill(2);
      var s = String(d.getSeconds()).zfill(2);
      var ms = String(d.getMilliseconds()).zfill(3);
      this.start_time_string = h + ":" + m + ":" + s + "." + ms;
    }

    // unlisted_events are not relevant to the loading flow and are not stored
    if (!unlisted_events.contains(eventname))
    {
      this.endtime = eventdata.time;
      this._add_event(eventname, eventdata);
    }

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
    // When this is stored, properties inherited from URI can be accessed.
    this.url = event.url;

    this.urltype = event.urlType;
    this.document_id = event.documentID;
    if (event.loadOrigin)
      this.load_origin_name = cls.ResourceManager["1.2"].LoadOrigin[event.loadOrigin].toLowerCase();

    this.urltype_name = cls.ResourceManager["1.2"].UrlLoad.URLType[event.urlType];
    this._humanize_url();
    this._guess_response_type(); // may not be correct before mime is set, but will be guessed again when it is
  };

  this._update_event_urlunload = function(event)
  {
    this.is_unloaded = true;
  };

  this._update_event_urlfinished = function(event)
  {
    this.result = event.result;
    this.mime = event.mimeType;
    this.encoding = event.characterEncoding;
    this.size = event.contentLength;
    this.is_finished = true;
    // Responses keep duplicates of the finished state. It's only relevant on the last one.
    if (this._current_response)
      this._current_response.logger_entry_is_finished = true;
    this._guess_response_type();
    this._humanize_url();
  };

  this._update_event_request = function(event)
  {
    this._current_request = new cls.NetworkLoggerRequest(this);
    this.requests_responses.push(this._current_request);
    this._current_request._update_event_request(event);
  };

  this._update_event_requestheader = function(event)
  {
    if (!this._current_request)
    {
      // This means we didn't see a request before that, CORE-47076
      this._current_request = new cls.NetworkLoggerRequest(this);
      this.requests_responses.push(this._current_request);
    }
    this._current_request._update_event_requestheader(event);
  };

  this._update_event_requestfinished = function(event)
  {
    if (!this._current_request)
    {
      // There should always be a request by now, but keep the data anyway.
      this._current_request = new cls.NetworkLoggerRequest(this);
      this.requests_responses.push(this._current_request);
    }
    this._current_request._update_event_requestfinished(event);
  };

  this._update_event_requestretry = function(event)
  {
    // This means on the next request with event.toRequestID, we won't
    // make a new entry, but a new NetworkLoggerRequest on the same entry.
    this.request_id = event.toRequestID;
  };

  this._update_event_response = function(event)
  {
    if (this._current_request)
    {
      this._current_request.was_responded_to = true;
    }
    this.current_responsecode = event.responseCode;
    this.error_in_current_response = /^[45]/.test(this.current_responsecode);
    this._current_response = new cls.NetworkLoggerResponse(this);
    this.requests_responses.push(this._current_response);
    this._current_response.update_event_response(event);
  };

  this._update_event_responseheader = function(event)
  {
    // Sometimes we see no "response" event before we see responseheader,
    // therefore have to init NetworkLoggerResponse here. See CORE-43935.
    if (!this._current_response)
    {
      if (this._current_request)
      {
        this._current_request.was_responded_to = true;
      }
      this._current_response = new cls.NetworkLoggerResponse(this);
      this.requests_responses.push(this._current_response);
    }
    this._current_response.update_event_responseheader(event);
  };

  this._update_event_responsefinished = function(event)
  {
    if (this._current_response)
      this._current_response.update_event_responsefinished(event);

    if (event.data && event.data.mimeType)
      this.mime = event.data && event.data.mimeType;

    if (this._set_is_finished_on_responsefinished)
      this.is_finished = true;

    this._guess_response_type();
  };

  this._update_event_urlredirect = function(event)
  {
    // Workaround for CORE-47687
    this._set_is_finished_on_responsefinished = true;
  };

  this._guess_response_type = function()
  {
    // The first guess is made based on file extension. No response is needed for that.
    // The current response is updated though, at the time it will be the correct one.
    // Multiple responses can get different types in this way.
    if (!cls || !cls.ResourceUtil)
      return;

    // For "application/octet-stream" we check by extension even though we have a mime
    if (!this.mime || this.mime.toLowerCase() === "application/octet-stream")
      this.type = cls.ResourceUtil.extension_type_map[this.extension];
    else
      this.type = cls.ResourceUtil.mime_to_type(this.mime);

    if (this._current_response)
    {
      // This could be only on the response. But as only the last response has body
      // that would complicate it for nothing.
      this._current_response.logger_entry_mime = this.mime;
      this._current_response.logger_entry_type = this.type;
    }
  };

  this._humanize_url = function()
  {
    this.human_url = this.url;
    if (this.urltype == cls.ResourceManager["1.2"].UrlLoad.URLType.DATA)
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

  this.get_gap_def = function(gap)
  {
    var def = gap_defs[gap.from_event.name] &&
              gap_defs[gap.from_event.name][gap.to_event.name];

    if (!def)
      def = gap_defs_to_phase[gap.to_event.name];

    if (!def)
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
            "Unexpected event sequence between " + gap.from_event.name + " and " + gap.to_event.name);

    return def;
  };

  this._add_event = function(eventname, eventdata)
  {
    var evt = {
      name: eventname,
      time: eventdata.time,
      request_id: eventdata.requestID
    };
    if (this.events.length)
    {
      var gap = {
        from_event: this.events.last,
        to_event: evt,
        val: evt.time - this.events.last.time
      };
      var gap_def = this.get_gap_def(gap);
      gap.val_string = gap.val.toFixed(2) + " ms";
      gap.classname = gap_def && gap_def.classname || CLASSNAME_IRREGULAR;
      gap.title = gap_def && gap_def.title || "";

      this.event_sequence.push(gap);
    }
    this.events.push(evt);
  };

  this.check_to_get_body = function()
  {
    var should_get_body =
      this.is_finished &&
      !this.called_get_body &&
      (!this._current_response || !this._current_response.responsebody) &&
      // When we have a response, but didn't see responsefinished, there really is no
      // responsebody. Don't attempt to fetch it.
      (!this._current_response || this._current_response.saw_responsefinished);

    // Todo: The exception for !saw_responsefinished is AFAIR so we don't fetch a wrong result like a
    // placeholder from Opera, but thee's currently no testcase for that.
    // We could also avoid it when this.is_unloaded, but seems there it will
    // just be unsuccessful and we handle that.

    if (should_get_body)
    {
      // Decide if body should be fetched, for when content-tracking is off or it's a cached request.
      this.called_get_body = true;
      if (this._current_response)
        this._current_response.logger_entry_called_get_body = true;
      var content_mode = cls.ResourceUtil.mime_to_content_mode(this.mime);
      var transport_type = {"text": 1, "datauri": 3}[content_mode];
      var tag = window.tag_manager.set_callback(this, this._handle_get_resource);
      var CONTENT_MODE_STRING = 1;
      window.services["resource-manager"].requestGetResource(tag, [this.resource_id,
                                                                    [transport_type, CONTENT_MODE_STRING]]);
    }
  };

  this._handle_get_resource = function(status, msg)
  {
    if (!this._current_response)
    {
      // This means there wasn't a request, we add a "response" though because that's where that data lives.
      this._current_response = new cls.NetworkLoggerResponse(this);
      this.requests_responses.push(this._current_response);
    }

    var SUCCESS = 0;
    if (status == SUCCESS)
    {
      var data = new cls.ResourceManager["1.2"].ResourceData(msg);
      this.responsebody = data;
      this._current_response.update_responsebody(data);
    }
    else
    {
      this.get_body_unsuccessful = this._current_response.logger_entry_get_body_unsuccessful = true;
    }
    window.messages.post("network-resource-updated", {id: this.resource_id});
  };

  this.__defineGetter__("duration", function()
  {
    return (this.events.length && this.endtime - this.starttime) || 0;
  });
  this.__defineSetter__("duration", function(){});

  this.__defineGetter__("waiting_time", function()
  {
    var helpers = window.helpers;
    var waiting_time = this.event_sequence.filter(helpers.eq("classname", CLASSNAME_WAITING))
                                          .sum(helpers.prop("val"));
    return waiting_time || 0;
  });
  this.__defineSetter__("waiting_time", function(){});

  this.__defineGetter__("touched_network", function()
  {
    return Boolean(this._current_request);
  });
  this.__defineSetter__("touched_network", function(){});

  this.__defineGetter__("current_response", function()
  {
    return this._current_response;
  });
  this.__defineSetter__("current_response", function(){});

  this.__defineGetter__("current_request", function()
  {
    return this._current_request;
  });
  this.__defineSetter__("current_request", function(){});
};

cls.NetworkLoggerEntryPrototype.prototype = new URIPrototype("url");
cls.NetworkLoggerEntry.prototype = new cls.NetworkLoggerEntryPrototype();


cls.NetworkLoggerRequest = function(entry)
{
  this.method = null;
  this.request_headers = null;
  this.request_headers_raw = null;
  this.request_type = null;
  this.request_body = null;
  this.boundary = "";
  this.was_responded_to = false;
  // Set from template code, when first needed:
  this.header_tokens = null;
  // Belongs here, unused though:
  this.request_id = entry.request_id;
};

cls.NetworkLoggerRequestPrototype = function()
{
  this._update_event_request = function(event)
  {
    this.method = event.method;
  };

  this._update_event_requestheader = function(event)
  {
    this.request_headers = event.headerList;

    for (var n = 0, header; header = this.request_headers[n]; n++)
    {
      if (header.name.toLowerCase() == "content-type")
      {
        this.request_type = header.value;
        this.boundary = header.value.split("; boundary=")[1] || "";
        break;
      }
    }
    // The body can be contained in event.raw.
    // At the time of the this event, it's possible that more than the header
    // has been written to the socket already.
    this.request_headers_raw = event.raw.split("\r\n\r\n")[0];
  };

  this._update_event_requestfinished = function(event)
  {
    if (event.data)
    {
      this.request_body = event.data;
      // in time we can use the mime-type member here rather than grabbing it
      // from the headers. See CORE-39597
      this.request_body.mimeType = this.request_type;
    }
  };
};

cls.NetworkLoggerRequest.prototype = new cls.NetworkLoggerRequestPrototype();


cls.NetworkLoggerResponse = function(entry)
{
  this.responsecode = null;
  this.response_headers = null;
  this.response_headers_raw = null;
  this.responsebody = null;
  this.header_tokens = null; // This is set from template code, when it's first needed
  this.is_response = true; // Simpler for recognizing than dealing with comparing the constructor
  this.saw_responsefinished = false;

  // The following are duplicated from the entry to have them available directly on the response.
  // They are accessed and updated directly from the entry.
  this.logger_entry_type = entry.type;
  this.logger_entry_id = entry.id;
  this.logger_entry_mime = entry.mime;
  this.logger_entry_is_finished = entry.is_finished;
  this.logger_entry_touched_network = entry.touched_network;
  this.logger_entry_called_get_body = entry.called_get_body;
  this.logger_entry_get_body_unsuccessful = entry.get_body_unsuccessful;
};

cls.NetworkLoggerResponsePrototype = function()
{
  this.update_event_response = function(event)
  {
    this.responsecode = event.responseCode;
  };

  this.update_event_responseheader = function(event)
  {
    this.response_headers = event.headerList;
    // The body can be contained in event.raw.
    // At the time of the this event, it's possible that more than the header
    // has been read from the socket already.
    this.response_headers_raw = event.raw.split("\r\n\r\n")[0];
  };

  this.update_event_responsefinished = function(event)
  {
    this.saw_responsefinished = true;
    if (event.data && event.data.content)
    {
      // event.data is of type ResourceData here.
      this.responsebody = event.data;
    }
  };

  this.update_responsebody = function(responsebody)
  {
    this.responsebody = responsebody;
  };
};

cls.NetworkLoggerResponse.prototype = new cls.NetworkLoggerResponsePrototype();

cls.ResourceInfo = function(entry)
{
  this.url = entry.url;
  this.responseheaders = entry.current_response.response_headers;
  this.responsebody = entry.current_response.responsebody;
};
