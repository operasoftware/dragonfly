﻿"use strict";

cls.NetworkLoggerService = function(view)
{
  this._view = view;
  this._current_context = null;

  this._on_abouttoloaddocument_bound = function(msg)
  {
    var data = new cls.DocumentManager["1.0"].AboutToLoadDocument(msg);
    // if not a top resource, don't reset the context. This usually means it's an iframe or a redirect.
    // todo: handle multiple top-runtimes
    if (data.parentDocumentID)
      return;

    this._current_context = new cls.RequestContext();
    this._current_context.saw_main_document_abouttoloaddocument = true;
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
    this._current_context = null;
    this._view.update();
  }.bind(this);

  this._setup_request_body_behaviour_bound = function()
  {
    var text_types = ["text/html", "application/xhtml+xml", "application/mathml+xml",
                     "application/xslt+xml", "text/xsl", "application/xml",
                     "text/css", "text/plain", "application/x-javascript",
                     "application/json", "application/javascript", "text/javascript",
                     "application/x-www-form-urlencoded",
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
                        "application/x-www-form-urlencoded"];

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

  this.get_body = function(itemid, callback)
  {
    if (!this._current_context)
      return;

    var entry = this._current_context.get_entry(itemid);
    entry.is_fetching_body = true;
    var contentmode = cls.ResourceUtil.mime_to_content_mode(entry.mime);
    var typecode = {datauri: 3, string: 1}[contentmode] || 1;
    var tag = window.tagManager.set_callback(this, this._handle_get_resource, [callback, entry]);
    this._res_service.requestGetResource(tag, [entry.resource_id, [typecode, 1]]);
  };

  this._handle_get_resource = function(status, data, callback, entry)
  {
    if (!this._current_context)
      return;

    entry.is_fetching_body = false;
    if (status)
    {
      // set body_unavailable for the resourceid, the object passed represents empty event_data
      this._current_context.update("responsebody", {resourceID: entry.resource_id});
      if (callback) { callback() }
    }
    else
    {
      var msg = new cls.ResourceManager["1.2"].ResourceData(data);
      this._current_context.update("responsebody", msg);
      if (callback) { callback() }
    }
  };

  this.get_request_context = function()
  {
    return this._current_context;
  };

  this.clear_request_context = function()
  {
    this._current_context = null;
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


cls.RequestContext = function()
{
  this._logger_entries = [];
  this._filters = [];

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

  this._event_changes_req_id = function(event, last_entry)
  {
    /*
      Checks if the event's requestID is different from the one in last_entry.
      That should never be the case, since the "urlload" event initiates
      a new entry and that doesn't have a requestID. Note that last_entry is
      the last entry we saw with the event's resourceID.
    */
    return event.requestID &&
           (last_entry.requestID !== event.requestID);
  };

  this.update = function(eventname, event)
  {
    var logger_entries = this.get_entries_with_res_id(event.resourceID);
    if (!logger_entries.length && eventname !== "urlload")
    {
      // ignoring. Never saw an urlload, or it's already invalidated
      return;
    }

    // For responsebody, all entries with that resourceID need to be updated.
    // Others are callbacks that belongs to the current (and last) entry of that resourceID.
    if (eventname === "responsebody")
    {
      for (var i = 0, logger_entry; logger_entry = logger_entries[i]; i++)
      {
        logger_entry.update(eventname, event);
      }
    }
    else
    {
      var logger_entry = logger_entries.last;
      if (logger_entry && logger_entry.requestID)
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
                          ": Change from " + logger_entry.requestID + " to " +
                          event.requestID + ", URL: " + logger_entry.human_url);
        }
      }

      if (eventname == "urlload" || changed_request_id)
      {
        var id = this._get_uid();
        logger_entry = new cls.NetworkLoggerEntry(id, event.resourceID, event.documentID, this.get_starttime());
        this._logger_entries.push(logger_entry);
      }
      logger_entry.requestID = event.requestID;
      logger_entry.update(eventname, event);
    }

    if (window.views && !this.is_paused)
      window.views.network_logger.update();

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
};

cls.RequestContext.prototype = new cls.RequestContextPrototype();

cls.NetworkLoggerEntry = function(id, resource_id, document_id, context_starttime)
{
  this.id = id;
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
  this.starttime = null;
  this.starttime_relative = null;
  this.requesttime = null;
  this.endtime = null;
  this.touched_network = false;
  this.request_headers = null;
  this.request_type = null;
  this.requestbody = null;
  this.responses = [];
  this.responsecode = null;
  this.request_raw = null;
  this.firstline = null;
  this.method = null;
  this.status = null;
  this.body_unavailable = false;
  this.is_unloaded = false;
  this.is_finished = false;
  this.events = [];
  this.event_sequence = [];
  this.is_fetching_body = false;
};

cls.NetworkLoggerEntryPrototype = function()
{
  var unlisted_events = ["responsebody", "urlunload"];

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
        },
        // responsefinished can occur twice, see CORE-43284.
        // This is fixed and stops showing up when integrated.
        "responsefinished": {
          title: "",
          classname: CLASSNAME_BLOCKED
        }
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
      else
        this.starttime_relative = 0;

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
    if (this._current_response)
      this._current_response._update_event_urlunload(event);
  };

  this._update_event_urlfinished = function(event)
  {
    this.result = event.result;
    this.mime = event.mimeType;
    this.encoding = event.characterEncoding;
    this.size = event.contentLength;

    if (this._current_response)
      this._current_response._update_event_urlfinished(event);

    this.is_finished = true;
    this._guess_response_type();
    this._humanize_url();
  };

  this._update_event_request = function(event)
  {
    // We assume that there is never more than one network-request,
    // as opposed to responses which are kept in a list.
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
    this.firstline = event.raw.split("\n")[0];
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
    if (!this.requesttime)
      this.requesttime = event.time;
  };

  this._update_event_requestretry = function(event)
  {
    this.requestID = event.toRequestID;
  };

  this._update_event_response = function(event)
  {
    // On every response, entry.responsecode is overwritten to reflect what
    // the "final" responsecode for the request was.
    // Each individual response is also stored as a NetworkLoggerResponse.
    this.responsecode = event.responseCode;
    this.had_error_response = /^[45]/.test(this.responsecode);
    if (!this.responsestart)
      this.responsestart = event.time;

    this._current_response = new cls.NetworkLoggerResponse(this);
    this.responses.push(this._current_response);
    this._current_response._update_event_response(event);
  };

  this._update_event_responseheader = function(event)
  {
    // Sometimes we see no "response" event before we see responseheader,
    // therefore have to init NetworkLoggerResponse here. See CORE-43935.
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

    if (event.data && event.data.mimeType)
      this.mime = event.data && event.data.mimeType;

    this._guess_response_type();
  };

  this._update_event_responsebody = function(event)
  {
    if (!this._current_response)
    {
      this._current_response = new cls.NetworkLoggerResponse(this);
      this.responses.push(this._current_response);
    }
    this._current_response._update_event_responsebody(event);
  };

  this._update_event_urlredirect = function(event)
  {
    // this does not add any information, the event is only used to change the requestID
  };

  this._guess_response_type = function()
  {
    if (!cls || !cls.ResourceUtil)
      return;

    // For "application/octet-stream" we check by extension even though we have a mime
    if (!this.mime || this.mime.toLowerCase() === "application/octet-stream")
      this.type = cls.ResourceUtil.extension_type_map[this.extension];
    else
      this.type = cls.ResourceUtil.mime_to_type(this.mime);

    if (this._current_response)
      this._current_response._update_mime_and_type(this.mime, this.type);
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

  this.__defineGetter__("has_responsebody", function()
  {
    return Boolean(this.responses.filter(helpers.prop("responsebody")).length);
  });

  this.__defineGetter__("duration", function()
  {
    return (this.events.length && this.endtime - this.starttime) || 0;
  });
};

cls.NetworkLoggerEntryPrototype.prototype = new URIPrototype("url");

cls.NetworkLoggerEntry.prototype = new cls.NetworkLoggerEntryPrototype();

cls.NetworkLoggerResponse = function(entry)
{
  this.responsestart = null;
  this.responsecode = null;
  this.response_headers = null;
  this.response_raw = null;
  this.firstline = null;
  this.responsebody = null;

  // The following are duplicated from the entry to have them available directly on the response
  this.logger_entry_type = entry.type;
  this.logger_entry_id = entry.id;
  this.logger_entry_mime = entry.mime;
  this.logger_entry_is_finished = entry.is_finished;
  this.logger_entry_touched_network = entry.touched_network;
};

cls.NetworkLoggerResponsePrototype = function()
{
  this._update_event_response = function(event)
  {
    this.responsecode = event.responseCode;
  };

  this._update_event_responseheader = function(event)
  {
    this.response_headers = event.headerList;
    this.response_raw = event.raw;
    this.firstline = this.response_raw.split("\n")[0];
  };

  this._update_event_responsefinished = function(event)
  {
    if (event.data && event.data.content)
    {
      this.responsebody = event.data;
    }
  };

  this._update_event_urlfinished = function(event)
  {
    this.logger_entry_is_finished = true;
  };

  this._update_event_responsebody = function(event)
  {
    if (!event.mimeType) { this.body_unavailable = true; }
    this.responsebody = event;
  };

  this._update_event_urlunload = function(event)
  {
    this.is_unloaded = true;
  };

  this._update_mime_and_type = function(mime, type)
  {
    this.logger_entry_mime = mime;
    this.logger_entry_type = type;
  };
};

cls.NetworkLoggerResponse.prototype = new cls.NetworkLoggerResponsePrototype();
