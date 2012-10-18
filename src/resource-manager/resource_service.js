"use strict";

window.cls || (window.cls = {});

/**
 *
 */
cls.ResourceManagerService = function(view, network_logger)
{
  if (cls.ResourceManagerService.instance)
    return cls.ResourceManagerService.instance;

  cls.ResourceManagerService.instance = this;

  var THROTTLE_DELAY = 250;
  var TYPE_GROUP_MAPPING =
  {
    "markup": ui_strings.S_HTTP_LABEL_FILTER_MARKUP,
    "css": ui_strings.S_HTTP_LABEL_FILTER_STYLESHEETS,
    "script": ui_strings.S_HTTP_LABEL_FILTER_SCRIPTS,
    "image": ui_strings.S_HTTP_LABEL_FILTER_IMAGES,
    "font": ui_strings.S_HTTP_LABEL_FILTER_FONTS,
    "*": ui_strings.S_HTTP_LABEL_FILTER_OTHER
  };

  this._view = view;
  this._network_logger = network_logger;

  this._handle_list_documents = function(status, msg)
  {
    this._document_list = new cls.DocumentManager["1.0"].DocumentList(msg).documentList;

    this._document_list.forEach(function(d) {
      // use the URL class
      d.original_url = d.url;
      d.url = new URI(d.url);
    });

    this._update();
  };

  this._list_documents = function()
  {
    var tag = window.tag_manager.set_callback(this, this._handle_list_documents);
    window.services["document-manager"].requestListDocuments(tag, []);
  }.bind(this).throttle(THROTTLE_DELAY);

  this._populate_document_resources = function(r)
  {
    var document_id = r.document_id;

    if (!this._document_resources[document_id])
      this._document_resources[document_id] = [];

    if (!this._document_resources[document_id].contains(r.uid))
      this._document_resources[document_id].push(r.uid);
  };

  this._update = function(msg)
  {
    // bounce if _suppress_updates
    if (this._suppress_updates_url)
    {
      if (msg && msg.type == "resource-update")
      {
        // suppress the uid altogether if its URL matches the one we are requesting
        var r = this._network_logger.get_resources([msg.id])[0];
        if (r && r.url == this._suppress_updates_url)
          this._suppress_uids[msg.id] = true;

        // skip the update if it is about a suppressed uid
        if (this._suppress_uids[msg.id])
          return;
      }
    }

    // build the context
    var ctx = {};

    // get the order of the groups of resources
    ctx.group_order = this._view.get_group_order();

    // get list of window_contexts for which we saw the main_document
    ctx.windowList = (this._network_logger.get_window_contexts() || []).filter(function(w) {
      return w.saw_main_document;
    });

    if (ctx.windowList.length)
    {
      // get all the (non-suppressed) resources with content
      ctx.resourceList = (this._network_logger.get_resources() || []).filter(function(v) {
        return !this._suppress_uids.hasOwnProperty(v.uid) && v.responsecode != 204;
      }, this);

      ctx.document_resource_hash = {};

      // mapping of the WindowIDs in the debugging context
      var window_id_index = {};
      ctx.windowList.forEach(function(w, i) { window_id_index[w.id] = i; });

      var null_document_id = false;
      var document_id_index = {};

      // filter the documentId that belong in the windowIdList,
      // set null_document_id flag,
      // augment the document objects,
      // set the default collapsed flags
      ctx.documentList = this._document_list.filter(function(d, i, a) {
        var inContext = window_id_index.hasOwnProperty(d.windowID);

        if (inContext)
        {
          if (!null_document_id && !d.documentID)
            null_document_id = true;

          if (d.resourceID != null)
            ctx.document_resource_hash[d.resourceID] = d.documentID;

          // populate document_id_index
          document_id_index[d.documentID] = i;

          // set depth, pivotID and sameOrigin
          var p = a[document_id_index[d.parentDocumentID]] || {pivotID:d.windowID, depth:0};
          var id = p.pivotID + "_" + d.documentID;
          d.depth = p.depth + 1;
          d.pivotID = id;
          d.sameOrigin = cls.ResourceUtil.sameOrigin(p.url, d.url);

          // set the default collapsed flag
          var hash = this._collapsed_hash;
          if (!hash.hasOwnProperty(id))
          {
            hash[id] = d.depth > 1;
            ctx.group_order.forEach(function(g) { hash[id + "_" + g] = true; });
          }
        }

        return inContext;
      }, this);

      var unknown_document_id = false;

      // set unknown_document_id flag,
      // assign top resource to the right document,
      // add group to each resource,
      // sameOrigin flag to each resource
      // full_id ( pivot_ID + uid )
      ctx.resourceList.forEach(function(r) {
        if (!unknown_document_id && !document_id_index.hasOwnProperty(r.document_id))
          unknown_document_id = true;

        // check if this is the top resource of a document
        var documentID = ctx.document_resource_hash[r.resource_id];
        if (documentID != null && documentID != r.document_id)
          r.document_id = documentID;

        this._populate_document_resources(r);

        r.group = TYPE_GROUP_MAPPING[r.type] || TYPE_GROUP_MAPPING["*"];
        var d = this._document_list[document_id_index[r.document_id]];
        r.sameOrigin = cls.ResourceUtil.sameOrigin(d && d.url, r);
        r.full_id = ( d && d.pivotID ) + "_" + ctx.group_order.indexOf(r.group) + r.group + "_" + r.uid;

      }, this);

      // sort the resource by their full_id ( pivot + uid )
      ctx.resourceList = ctx.resourceList.sort(function(a, b) {
        return a.full_uid > b.full_uid ? 1 : a.full_uid == b.full_uid ? 0 : -1;
      });

      // filter the list of window. Purge the ones with no documents
      ctx.windowList = ctx.windowList.filter(function(v) {
        return ctx.documentList.some(function(w) {
          return v.id == w.windowID;
        });
      });


      // request the list of documents if we have
      // an empty documentList
      // or a resource pointing to an unknown document
      // or a document does not have a documentID yet
      if (!ctx.documentList.length || unknown_document_id || null_document_id)
        this._list_documents();

      ctx.selectedResourceUID = this._selected_resource_uid;
      ctx.documentResources = this._document_resources;
      ctx.collapsed = this._collapsed_hash;
      this._context = ctx;
    }
    else
    {
      this._context = null;
    }

    this._view.update();
  };

  this._update_bound = this._update.bind(this);

  this._on_debug_context_selected_bound = function()
  {
    this._reset();
  }.bind(this);

  this._handle_expand_collapse_bound = function(event, target)
  {
    if (!this._context)
      return;

    var pivot = target.get_ancestor("[data-expand-collapse-id]");
    if (pivot)
    {
      var hash = this._collapsed_hash;
      var pivotID = pivot.getAttribute("data-expand-collapse-id");
      var pivotIDs = [pivotID];
      var collapsed = !hash[pivotID];

      if (event.shiftKey)
      {
        pivotIDs.push.apply(pivotIDs, Object.keys(hash).filter(function(p) {
          return p.startswith(pivotID + "_");
        }));
      }

      pivotIDs.forEach(function(p) { hash[p] = collapsed; });

      this._view.update();
    }
  }.bind(this);

  this._handle_resource_detail_bound = function(event, target)
  {
    if (!this._context)
      return;

    var parent = target.get_ancestor("[data-resource-uid]");
    if (parent == null)
      return;

    var uid = parent.getAttribute("data-resource-uid");
    this.highlight_resource(uid);
    cls.ResourceDetailView.instance.show_resource(uid);
  }.bind(this);

  this.highlight_resource = function(uid)
  {
    var e;
    if (this._selected_resource_uid == uid)
      return;

    e = document.querySelector(".resource-highlight");
    if (e)
      e.removeClass("resource-highlight");

    this._selected_resource_uid = uid;
    if (this._context)
      this._context.selectedResourceUID = uid;

    e = document.querySelector("[data-resource-uid='" + this._selected_resource_uid + "']");
    if (e)
      e.addClass("resource-highlight");
  }.bind(this);

  this._highlight_sibling_resource = function(increment)
  {
    if (!this._context || !this._context.visibleResources || !this._context.visibleResources.length)
      return;

    var uid;
    var list = this._context.visibleResources;
    var pos = list.indexOf(this._selected_resource_uid);
    if (pos == -1)
      uid = list[increment > 0 ? 0 : list.length - 1];
    else
      uid = list[Math.min( Math.max(0, pos + increment), list.length - 1)];

    this.highlight_resource(uid);
    cls.ResourceDetailView.instance.show_resource(uid);
  };

  this.highlight_next_resource_bound = function()
  {
    this._highlight_sibling_resource(1);
  }.bind(this);

  this.highlight_previous_resource_bound = function()
  {
    this._highlight_sibling_resource(-1);
  }.bind(this);

  this._resource_request_update_bound = function(msg)
  {
    delete this._suppress_updates_url;
  }.bind(this);

  this._init = function()
  {
    var listener;
    var eh = window.event_handlers;
    eh.click["resources-expand-collapse"] = this._handle_expand_collapse_bound;
    eh.click["resource-detail"] = this._handle_resource_detail_bound;

    eh.click["open-resource-tab"] = function(event, target)
    {
      var broker = cls.ResourceDisplayBroker.get_instance();
      broker.show_resource_for_ele(target);
    }

    var messages = window.messages;
    messages.add_listener("debug-context-selected", this._on_debug_context_selected_bound);

    listener = this._resource_request_update_bound;
    messages.add_listener("resource-request-resource", listener);
    messages.add_listener("resource-request-fallback", listener);

    listener = this._update_bound;
    this._network_logger.add_listener("resource-update", listener);
    this._network_logger.add_listener("window-context-added", listener);
    this._network_logger.add_listener("window-context-removed", listener);

    window.services["window-manager"].add_listener("windowclosed", listener);

    this._reset();
  };

  this._reset = function()
  {
    this._context = null;
    this._selected_resource_uid = null;

    this._document_list = [];
    this._collapsed_hash = {};
    this._document_resources = {};

    this._suppress_uids = {};
    this._view.update();
  };

  this.get_resource_context = function()
  {
    return this._context;
  };

  this._get_resource_by_key_value = function(key, value)
  {
    var ctx = this._context;
    if (!ctx)
        return null;

    return ctx.resourceList.filter(function(v) { return v[key] == value; }).last;
  };

  this.get_resource = function(uid)
  {
    return this._get_resource_by_key_value('uid', uid);
  };

  this.get_resource_by_url = function(url)
  {
    return this._get_resource_by_key_value('url', url);
  };

  this.request_resource_data = function(url, callback, data, resourceInfo)
  {
    this._suppress_updates_url = url;
    new cls.ResourceRequest(url, callback, data, resourceInfo);
  };

  this._init();
};

cls.ResourceRequest = function(url, callback, data, resourceInfo)
{
  var SUCCESS = 0;
  var TRANSPORT_STRING = 1;
  var TRANSPORT_DATA_URI = 3;
  var TRANSPORT_OFF = 4;
  var DECODE_TRUE = 1;
  var SIZE_LIMIT = 1e7;

  var MAX_RETRIES = 3;

  this._init = function(url, callback, data, resourceInfo)
  {
    this.url = url;
    this.resourceInfo = resourceInfo;
    this._data = data||{};
    this._callback = callback;
    this._retries = 0;

    this._resource_manager = window.services["resource-manager"];
    if (this._resource_manager)
      this._request_create_request();
    else
      this._fallback();
  };

  this._fallback = function()
  {
    // broadcast that we fellback
    window.messages.post("resource-request-fallback", {resource_id: this.resource_id});

    window.open(this.url);
  };

  this._request_create_request = function()
  {
    if (this._resource_manager.requestCreateRequest)
    {
      var windowID = this._data.window_id || window.window_manager_data.get_debug_context();
      var tag = window.tag_manager.set_callback(this, this._on_request_resource_id);
      this._resource_manager.requestCreateRequest(tag, [windowID, this.url, "GET"]);
    }
    else
      this._fallback();
  };

  this._on_request_resource_id = function(status, message)
  {
    if (status == SUCCESS && this._resource_manager.requestGetResource)
    {
      // resource_id -> getResource => _on_request_get_resource
      var RESOURCE_ID = 0;
      this.resource_id = message[RESOURCE_ID];

      this._request_get_resource();
    }
    else
      this._fallback();
  };

  this._request_get_resource = function()
  {
      var transport_type = TRANSPORT_OFF;
      if (this.type)
      {
        // resource of known type-> call with appropriate transport mode.
        var response_type = cls.ResourceUtil.type_to_content_mode(this.type);
        var transport_type = response_type == "datauri" ? TRANSPORT_DATA_URI : TRANSPORT_STRING;
      }

      var tag = window.tag_manager.set_callback(this, this._on_request_get_resource);
      this._resource_manager.requestGetResource(tag, [this.resource_id, [transport_type, DECODE_TRUE, SIZE_LIMIT]]);
  };

  this._on_request_get_resource = function(status, message)
  {
    if (status == SUCCESS && this._retries < MAX_RETRIES)
    {
      var resourceData = new cls.ResourceManager["1.2"].ResourceData(message);
      if (resourceData.content)
      {
        // content -> mock a cls.NetworkLoggerEntry and instanciate a cls.ResourceInfo
        this.requests_responses = [{responsebody: resourceData}];
        var resourceInfo = new cls.ResourceInfo(this);
        if (!this.resourceInfo)
            this.resourceInfo = resourceInfo;
          else
            this.resourceInfo.data = resourceInfo.data;

        // broadcast that we got payload of the resource
        window.messages.post("resource-request-resource", {resource_id: this.resource_id});

        // aaaand callback
        this._callback(this.resourceInfo, this._data);
      }
      else
      {
        // no content -> guess the type and request using the appropriate transport mode
        this.type = cls.ResourceUtil.guess_type(resourceData.mimeType, this.extension);
        this._request_get_resource();
        this._retries++;
      }
    }
    else
      this._fallback();
  };

  this._init(url, callback, data, resourceInfo);
};

cls.ResourceRequest.prototype = new URIPrototype("url");
