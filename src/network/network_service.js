"use strict";

cls.NetworkLoggerService = function()
{
  this.CONTEXT_TYPE_LOGGER = this.CONTEXT_TYPE_MAIN = 1;
  this.CONTEXT_TYPE_CRAFTER = 2;

  this._get_matching_context = function(res_id)
  {
    var crafter_context = this._contexts[this.CONTEXT_TYPE_CRAFTER];
    if (crafter_context && res_id in crafter_context.allocated_res_ids)
      return crafter_context;

    var logger_context = this._contexts[this.CONTEXT_TYPE_LOGGER];
    return logger_context;
  };

  this._get_request_context = function(type, force)
  {
    var ctx = this._contexts[type];
    if (!ctx && force)
    {
      var is_main_context = type === this.CONTEXT_TYPE_MAIN;
      ctx = this._contexts[type] = new cls.RequestContext(this, is_main_context);
      this.post("context-added", {"context_type": type, "context": ctx});
    }
    return ctx;
  };

  this.get_logger_context = function()
  {
    return this._get_request_context(this.CONTEXT_TYPE_LOGGER);
  };

  this.get_logger_context = function(force)
  {
    return this._get_request_context(this.CONTEXT_TYPE_CRAFTER, force);
  };

  this._remove_request_context = function(type)
  {
    type = type || this.CONTEXT_TYPE_MAIN;
    this._contexts[type] = null;
    this.post("context-removed", {"context_type": type});
  };

  this.remove_logger_request_context = function()
  {
    return this._remove_request_context(this.CONTEXT_TYPE_LOGGER);
  };

  this.remove_crafter_request_context = function()
  {
    return this._remove_request_context(this.CONTEXT_TYPE_CRAFTER);
  };

  // get_window_contexts means "of the main context" here (on the service). That's in line
  // with messages of the main context firing here instead of on the context.
  this.get_window_contexts = function(type)
  {
    var ctx = this._get_request_context(this.CONTEXT_TYPE_MAIN);
    return ctx && ctx.get_window_contexts();
  };

  this._queue_message = function(listener, msg)
  {
    var crafter = this._contexts[this.CONTEXT_TYPE_CRAFTER];
    if (crafter && crafter.is_waiting_for_create_request)
    {
      // Store in a queue. Before we know what resourceID create_request
      // will return, messages can't be associated with the right context.
      this._message_queue.push([listener, msg]);
      return true;
    }
    else
    {
      // Play back the message queue.
      while (this._message_queue.length)
        this._playback_message_bound(this._message_queue.shift());
    }
    return false;
  };

  this._playback_message_bound = function(queued)
  {
    var LISTENER =  0;
    var MSG = 1;
    queued[LISTENER].call(this, queued[MSG], true);
  }.bind(this);

  this._on_abouttoloaddocument = function on_abouttoloaddocument(msg, is_playing_back)
  {
    if (!is_playing_back && this._queue_message(on_abouttoloaddocument, msg))
      return;

    var data = new cls.DocumentManager["1.0"].AboutToLoadDocument(msg);

    // For this event, the context is always of type CONTEXT_TYPE_LOGGER.
    // That needs to be static here, because a new context will be created if it doesn't exist.
    var ctx = this._get_request_context(this.CONTEXT_TYPE_LOGGER, true);

    // Without a parentDocumentID, this event means "unload" for the old content of this windowID.
    if (!data.parentDocumentID)
      ctx.remove_window_context(data.windowID);

    var window_context = ctx.get_window_context(data.windowID, true);
    if (!data.parentDocumentID)
      window_context.saw_main_document = true;

  };
  this._on_abouttoloaddocument_bound = this._on_abouttoloaddocument.bind(this);

  this._on_urlload = function on_urlload(msg, is_playing_back)
  {
    if (!is_playing_back && this._queue_message(on_urlload, msg))
      return;

    var data = new cls.ResourceManager["1.2"].UrlLoad(msg);
    var ctx = this._get_matching_context(data.resourceID);
    if (!ctx)
    {
      var type = this.CONTEXT_TYPE_LOGGER;
      var is_main_context = type === this.CONTEXT_TYPE_MAIN;
      ctx = this._contexts[type] = new cls.RequestContext(this, is_main_context);
      this.post("context-added", {"context_type": type, "context": ctx});
    }
    ctx.update("urlload", data);
  };
  this._on_urlload_bound = this._on_urlload.bind(this);

  this._on_urlredirect = function on_urlredirect(msg, is_playing_back)
  {
    if (!is_playing_back && this._queue_message(on_urlredirect, msg))
      return;

    var data = new cls.ResourceManager["1.0"].UrlRedirect(msg);
    var ctx = this._get_matching_context(data.fromResourceID);
    if (!ctx)
      return;

    // Allocate the resource_id we redirect to, to the same context.
    if (data.fromResourceID in ctx.allocated_res_ids)
      ctx.allocated_res_ids[data.toResourceID] = ctx.allocated_res_ids[data.fromResourceID];

    // a bit of cheating since further down we use .resouceID to determine
    // what resource the event applies to:
    data.resourceID = data.fromResourceID;

    ctx.update("urlredirect", data);
  };
  this._on_urlredirect_bound = this._on_urlredirect.bind(this);

  this._on_urlfinished = function on_urlfinished(msg, is_playing_back)
  {
    if (!is_playing_back && this._queue_message(on_urlfinished, msg))
      return;

    var data = new cls.ResourceManager["1.0"].UrlFinished(msg);
    var ctx = this._get_matching_context(data.resourceID);
    if (!ctx)
      return;

    ctx.update("urlfinished", data);
    // On a context of type CONTEXT_TYPE_CRAFTER, resource id now needs to be removed
    // from the allocated list. Furthcoming requests can have the same recourceID,
    // don't belong to the crafter.
    delete ctx.allocated_res_ids[data.resourceID];
  };
  this._on_urlfinished_bound = this._on_urlfinished.bind(this);

  this._on_response_bound = function on_response_bound(msg, is_playing_back)
  {
    if (!is_playing_back && this._queue_message(on_response_bound, msg))
      return;

    var data = new cls.ResourceManager["1.0"].Response(msg);
    var ctx = this._get_matching_context(data.resourceID);
    if (!ctx)
      return;

    ctx.update("response", data);
  }
  this._on_response_bound = this._on_response_bound.bind(this);

  this._on_request = function on_request(msg, is_playing_back)
  {
    if (!is_playing_back && this._queue_message(on_request, msg))
      return;

    var data = new cls.ResourceManager["1.0"].Request(msg);
    var ctx = this._get_matching_context(data.resourceID);
    if (!ctx)
      return;

    ctx.update("request", data);
  };
  this._on_request_bound = this._on_request.bind(this);

  this._on_requestheader = function on_requestheader(msg, is_playing_back)
  {
    if (!is_playing_back && this._queue_message(on_requestheader, msg))
      return;

    var data = new cls.ResourceManager["1.0"].RequestHeader(msg);
    var ctx = this._get_matching_context(data.resourceID);
    if (!ctx)
      return;

    ctx.update("requestheader", data);
  };
  this._on_requestheader_bound = this._on_requestheader.bind(this);

  this._on_requestfinished = function on_requestfinished(msg, is_playing_back)
  {
    if (!is_playing_back && this._queue_message(on_requestfinished, msg))
      return;

    var data = new cls.ResourceManager["1.0"].RequestFinished(msg);
    var ctx = this._get_matching_context(data.resourceID);
    if (!ctx)
      return;

    ctx.update("requestfinished", data);
  };
  this._on_requestfinished_bound = this._on_requestfinished.bind(this);

  this._on_requestretry = function on_requestretry(msg, is_playing_back)
  {
    if (!is_playing_back && this._queue_message(on_requestretry, msg))
      return;

    var data = new cls.ResourceManager["1.0"].RequestRetry(msg);
    var ctx = this._get_matching_context(data.resourceID);
    if (!ctx)
      return;

    ctx.update("requestretry", data);
  };
  this._on_requestretry_bound = this._on_requestretry.bind(this);

  this._on_responseheader = function on_responseheader(msg, is_playing_back)
  {
    if (!is_playing_back && this._queue_message(on_responseheader, msg))
      return;

    var data = new cls.ResourceManager["1.0"].ResponseHeader(msg);
    var ctx = this._get_matching_context(data.resourceID);
    if (!ctx)
      return;

    ctx.update("responseheader", data);
  };
  this._on_responseheader_bound = this._on_responseheader.bind(this);

  this._on_responsefinished = function on_responsefinished(msg, is_playing_back)
  {
    if (!is_playing_back && this._queue_message(on_responsefinished, msg))
      return;

    var data = new cls.ResourceManager["1.0"].ResponseFinished(msg);
    var ctx = this._get_matching_context(data.resourceID);
    if (!ctx)
      return;

    // Workaround CORE-47687: UrlFinished is missing for urls resulting in a 301 (Moved Permanently) response
    var remove_from_allocated_after_update = false;
    if (ctx)
    {
      // Guess what the matching entry is from here. This is normally much harder,
      // but we only want to do this workaround in this easy case anyway.
      var matching_entry = ctx.get_entries_with_res_id(data.resourceID)[0];
      if (matching_entry.events.last &&
          matching_entry.events.last.name == "urlredirect")
      {
        remove_from_allocated_after_update = true;
      }
    }

    ctx.update("responsefinished", data);

    if (remove_from_allocated_after_update)
      delete ctx.allocated_res_ids[data.resourceID];

  };
  this._on_responsefinished_bound = this._on_responsefinished.bind(this);

  this._on_urlunload = function on_urlunload(msg, is_playing_back)
  {
    if (!is_playing_back && this._queue_message(on_urlunload, msg))
      return;

    var data = new cls.ResourceManager["1.2"].UrlUnload(msg);
    var ctx = this._get_matching_context(data.resourceID);
    if (!ctx)
      return;

    ctx.update("urlunload", data);
  };
  this._on_urlunload_bound = this._on_urlunload.bind(this);

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

    messages.addListener("debug-context-selected", this._remove_request_context.bind(this, null));
    messages.addListener("setting-changed", this._on_setting_changed_bound);

    this._message_queue = [];
    this._contexts = {};
    window.cls.MessageMixin.apply(this);
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

  this.get_body = function(entry)
  {
    entry.called_get_body = true;
    var contentmode = cls.ResourceUtil.mime_to_content_mode(entry.mime);
    var typecode = {datauri: 3, string: 1}[contentmode] || 1;
    var tag = window.tagManager.set_callback(this, this._handle_get_resource, [entry.resource_id]);
    this._res_service.requestGetResource(tag, [entry.resource_id, [typecode, 1]]);
  };

  this._handle_get_resource = function(status, data, resource_id)
  {
    var ctx = this._get_request_context(this.CONTEXT_TYPE_LOGGER);
    if (status)
    {
      // the object passed to _current_context represents empty event_data. will set no_used_mimetype.
      ctx.update("responsebody", {resourceID: resource_id});
    }
    else
    {
      var msg = new cls.ResourceManager["1.2"].ResourceData(data);
      ctx.update("responsebody", msg);
    }
    // Post update message from here. This is only needed when the generic updating per event is paused.
    if (this.is_paused)
      ctx.post_on_context_or_service("resource-update", {id: event.resourceID});

  };

  this.init();
};

cls.NetworkLoggerService.WindowContext = function(window_id, service, context)
{
  this._service = service;
  this._context = context;
  this.id = window_id;
  this.saw_main_document = false;
  this.incomplete_warn_discarded = false;
  this.entry_ids = [];
};

cls.NetworkLoggerService.WindowContextPrototype = function()
{
  this._filter_entries = function(resource_ids, entry, index, entries)
  {
    // Skip an entry if an entry with the same resource_id is found further down the list.
    var same_resource_id = window.helpers.eq("resource_id", entry.resource_id);
    return this.entry_ids.contains(entry.id) &&
           (!resource_ids || resource_ids.contains(entry.resource_id)) &&
           entries.slice(index + 1).filter(same_resource_id).length == 0;
  }

  this.get_resources = function(resource_ids)
  {
    var filter_bound = this._filter_entries.bind(this, resource_ids);
    var entries = this._context.get_entries().filter(filter_bound);
    return entries.map(function(entry) { return new cls.ResourceInfo(entry);} );
  };

  this.discard_incomplete_warning = function()
  {
    this.incomplete_warn_discarded = true;
  };
};

cls.NetworkLoggerService.WindowContext.prototype = new cls.NetworkLoggerService.WindowContextPrototype();

cls.RequestContext = function(service, is_main_context)
{
  this.FILTER_ALLOW_ALL = {
    type_list: [],
    is_blacklist: true
  };
  this.allocated_res_ids = [];
  this.is_paused = false;
  this.is_waiting_for_create_request = false;
  this._logger_entries = [];
  this._filters = [this.FILTER_ALLOW_ALL];
  this._is_main_context = is_main_context;
  this._service = service;
  this._window_contexts = [];
  this._init();
};

cls.RequestContextPrototype = function()
{
  this._init = function()
  {
    // When a new context is initiated, it's not paused by default. Reset the setting.
    // Todo: Ideally, when paused, the new context should be created in a different
    // place, so the old one can be kept while we're on pause.
    if (this._is_main_context && settings.network_logger.get("pause") != false)
      settings.network_logger.set("pause", false);

    this._filter_function_bound = this._filter_function.bind(this);
    window.cls.MessageMixin.apply(this);
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
    var res_id = event.resourceID;
    var logger_entries = this.get_entries_with_res_id(res_id);
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
        var window_context = (event.windowID && this.get_window_context(event.windowID, true));
        if (window_context)
          window_context.entry_ids.push(id);
      }
      logger_entry.request_id = event.requestID;

      // Add a mapped crafter_request_id when applicable
      var crafter_request_id = this.allocated_res_ids[res_id];
      if (crafter_request_id && !logger_entry.crafter_request_id)
        logger_entry.crafter_request_id = crafter_request_id;

      if (res_id in this.allocated_res_ids)
        logger_entry.crafter_request_id = this.allocated_res_ids[res_id];

      logger_entry.update(eventname, event);
    }

    if (!this.is_paused)
    {
      this.post_on_context_or_service("resource-update", {id: event.resourceID});
    }
  };

  this.post_on_context_or_service = function(name, body)
  {
    // Find out where to post the update message.
    // Messages of main_contexts are posted on the service, not the context.
    var posting_object = this._is_main_context ? this._service : this;
    posting_object.post(name, body);
  };

  this.get_window_contexts = function(type)
  {
    return this._window_contexts;
  };

  this.get_window_context = function(window_id, force)
  {
    var helpers = window.helpers;
    var window_context = this._window_contexts.filter(helpers.eq("id", window_id))[0];
    if (!window_context && force)
    {
      window_context = new cls.NetworkLoggerService.WindowContext(window_id, this._service, this);
      this._window_contexts.push(window_context);
      this.post_on_context_or_service("window-context-added", {"window-context": window_context});
    }
    return window_context;
  };

  this.remove_window_context = function(window_id)
  {
    var window_context = this.get_window_context(window_id);
    var ids_to_remove = window_context && window_context.entry_ids;
    // Remove entries
    if (ids_to_remove && ids_to_remove.length)
    {
      this._logger_entries = this._logger_entries.filter(
        function(entry) {
          return !ids_to_remove.contains(entry.id);
        }
      );
    }
    // Remove the window_context itself
    this._window_contexts = this._window_contexts.filter(
      function(context) {
        return window_id != context.id;
      }
    );
    this.post_on_context_or_service("window-context-removed", {"window-id": window_id});
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

  this.send_request = function(url, requestdata)
  {
    var windowid = window.window_manager_data.get_debug_context();
    var request = [
      windowid,
      url,
      requestdata.method,
      requestdata.headers,
      null, // payload
      3, // header policy. 2 == overwrite, 3 == replace
      2, // reload policy. 2 == no cache, always reload from network
      null, // request content mode
      [1, 1] // response content mode 1 == string, 1 == decode
    ];
    this.is_waiting_for_create_request = true;
    var id = this._get_uid();
    var tag = window.tag_manager.set_callback(this, this._handle_create_request, [id]);
    window.services["resource-manager"].requestCreateRequest(tag, request);
    return id;
  };

  this._handle_create_request = function(status, msg, id)
  {
    this.is_waiting_for_create_request = false;
    var SUCCESS = 0;
    if (status == SUCCESS)
    {
      var data = new cls.ResourceManager["1.3"].ResourceID(msg);
      this.allocated_res_ids[data.resourceID] = id;
    }
    else
    {
      // todo: talk back to request_crafting_view. handle the error.
    }
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
  this._current_request = null;
  this._current_response = null;
  this._set_is_finished_on_responsefinished = false;
  this.crafter_request_id = null;
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
    if (this._current_response)
      this._current_response.update_event_urlunload(event);
  };

  this._update_event_urlfinished = function(event)
  {
    this.result = event.result;
    this.mime = event.mimeType;
    this.encoding = event.characterEncoding;
    this.size = event.contentLength;
    this.is_finished = true;
    // Responses keep duplicates of the finished state. It's only relevant on the last one though.
    if (this._current_response)
      this._current_response.update_event_urlfinished(event);

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

  this._update_event_responsebody = function(event)
  {
    if (!this._current_response)
    {
      // This should mean there wasn't a request, but it was fetched over GetResource.
      this._current_response = new cls.NetworkLoggerResponse(this);
      this.requests_responses.push(this._current_response);
    }
    this._current_response.update_event_responsebody(event);
  };

  this._update_event_urlredirect = function(event)
  {
    // Workaround CORE-47687: UrlFinished is missing for urls resulting in a 301 (Moved Permanently) response
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
      this._current_response.update_mime_and_type(this.mime, this.type);
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

  this.check_to_request_body = function(service)
  {
    // Decide if body should be fetched, for when content-tracking is off or it's a cached request.
    if (
      this.is_finished &&
      !this.called_get_body &&
      (!this._current_response || !this._current_response.responsebody) &&
      // When we have a response, but didn't see responsefinished, it means there's really no
      // responsebody. Don't attempt to fetch it.
      (!this._current_response || this._current_response.saw_responsefinished)
    )
    {
      service.get_body(this);
    }
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
    // In 99% of the cases, _current_response is used. It's only
    // exposed for getting the ResourceInfo from the service directly.
    return this._current_response;
  });
  this.__defineSetter__("current_response", function(){});
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
  this.request_id = entry.requestID;
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
  this.no_used_mimetype = false;

  // The following are duplicated from the entry to have them available directly on the response
  this.logger_entry_type = entry.type;
  this.logger_entry_id = entry.id;
  this.logger_entry_mime = entry.mime;
  this.logger_entry_is_finished = entry.is_finished;
  this.logger_entry_touched_network = entry.touched_network;
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
      // From here, no_used_mimetype is not set to true when there is no mimeType.
      // A later call to get_resource will set it from update_event_responsebody.
      this.responsebody = event.data;
    }
  };

  this.update_event_responsebody = function(event)
  {
    // event.mimeType is the used mime type here.
    if (!event.mimeType) { this.no_used_mimetype = true; }
    this.responsebody = event;
  };

  this.update_event_urlunload = function(event)
  {
    this.is_unloaded = true;
  };

  // The following are to reflect changes that happened on Entry.
  this.update_event_urlfinished = function(event)
  {
    this.logger_entry_is_finished = true;
  };

  this.update_mime_and_type = function(mime, type)
  {
    // This could actually be per response too. But as only the last response has body, it can be on the entry.
    this.logger_entry_mime = mime;
    this.logger_entry_type = type;
  };
};

cls.NetworkLoggerResponse.prototype = new cls.NetworkLoggerResponsePrototype();

cls.ResourceInfo = function(entry)
{
  this.url = entry.url;
  this.document_id = entry.document_id;
  this.type = entry.type;
  this.is_unloaded = entry.is_unloaded;
};

cls.ResourceInfo.prototype = new URIPrototype("url");
