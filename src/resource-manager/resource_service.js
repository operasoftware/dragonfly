"use strict";

window.cls || (window.cls = {});

/**
 *
 */
cls.ResourceInspector = function(network_logger)
{
  var EXPAND_COLLAPSE_ATTRIBUTE = "data-expand-collapse-id";
  var RESOURCE_UID_ATTRIBUTE = "data-resource-uid";
  var HIGHLIGHT_CLASSNAME = "resource-highlight";

  var THROTTLE_DELAY = 250;

  this._network_logger = network_logger;

  this._handle_list_documents = function(status, msg)
  {
    this._document_list = new cls.DocumentManager["1.0"].DocumentList(msg).documentList;

    this._document_list = this._document_list.filter(function(d) {
      // discard documents that do not have a URL property yet
      return Boolean(d.url);
    });

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

  this.get_views = function()
  {
    if (this.tree_view == null)
      this.tree_view = window.views.resource_tree_view;

    if (this.detail_view == null)
      this.detail_view = window.views.resource_detail_view;
  };

  this.get_group_order = function()
  {
    this.get_views();
    if (this.group_order == null && this.tree_view != null)
    {
      this.group_order = this.tree_view.get_group_order();
      this.group_order_type_index = {};
      this.group_order.forEach(function(g, i) {
        this.group_order_type_index[g.type] = i;
      }, this);
    }
  }

  this._update = function(msg)
  {
    this.get_views();

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

    // get list of window_contexts for which we saw the main_document
    ctx.window_list = (this._network_logger.get_window_contexts() || []).filter(function(w) {
      return w.saw_main_document;
    });

    if (ctx.window_list.length)
    {
      // get all the (non-suppressed) resources with content
      ctx.resource_list = (this._network_logger.get_resources() || []).filter(function(resource) {
        return !this._suppress_uids.hasOwnProperty(resource.uid) && resource.responsecode != 204;
      }, this);

      ctx.selected_resource_uid = this._selected_resource_uid;
      ctx.collapsed = this._collapsed_hash;

      // get the order of the groups of resources,
      this.get_group_order();
      ctx.group_order = this.group_order;

      ctx.document_resource_hash = {};

      var lead = function(str, char, len)
      {
        str = String(str);
        return new Array((len || 8) - str.length + 1).join(char || "-") + str;
      };

      // mapping of the WindowIDs in the debugging context + pivot_id
      var window_id_index = {};
      ctx.window_list.forEach(function(w, i) {
        w.pivot_id = lead(w.id);
        window_id_index[w.id] = i;
      });

      var null_document_id = false;
      var document_id_index = {};
      // filter the documents that belong in the window_id list,
      // set null_document_id flag,
      // augment the document objects,
      // set the default collapsed flags
      ctx.document_list = this._document_list.filter(function(document, document_index, document_list) {
        var in_context = window_id_index.hasOwnProperty(document.windowID);

        if (in_context)
        {
          if (!null_document_id && !document.documentID)
            null_document_id = true;

          if (document.resourceID != null)
            ctx.document_resource_hash[document.resourceID] = document.documentID;

          // populate document_id_index
          document_id_index[document.documentID] = document_index;

          // set depth, pivot_id and same_origin
          var parent_document = document_list[document_id_index[document.parentDocumentID]];
          if (!parent_document)
          {
            parent_document = {
              "pivot_id": ctx.window_list[window_id_index[document.windowID]].pivot_id,
              "depth": 0
            };
          }
          var id = parent_document.pivot_id + lead(document.documentID);
          document.depth = parent_document.depth + 1;
          document.pivot_id = id;
          document.same_origin = cls.ResourceUtil.sameOrigin(parent_document.url, document.url);

          // set the default collapsed flag
          var hash = this._collapsed_hash;
          if (!hash.hasOwnProperty(id))
          {
            hash[id] = document.depth > 1;
            ctx.group_order.forEach(function(g) { hash[id + "_" + g.type] = true; });
          }
        }

        return in_context;
      }, this);

      var unknown_document_id = false;
      // filter out resources pointing to an unknown document_id,
      // set unknown_document_id flag,
      // assign top resource to the right document,
      // add group to each resource,
      // same_origin flag to each resource,
      // full_id ( pivot_id + group + uid ),
      // pivot_id
      ctx.resource_list = ctx.resource_list.filter(function(resource) {
        // check if this is the top resource of a document
        var document_id = ctx.document_resource_hash[resource.resource_id];
        if (document_id != null && document_id != resource.document_id)
          resource.document_id = document_id;

        var document = this._document_list[document_id_index[resource.document_id]];
        if (!document)
        {
          unknown_document_id = true;
          return false;
        }

        resource.group = this.group_order_type_index.hasOwnProperty(resource.type) ? resource.type : ctx.group_order.last.type;
        resource.same_origin = cls.ResourceUtil.sameOrigin(document.url, resource);

        resource.full_id = document.pivot_id + " " + lead(this.group_order_type_index[resource.group], " ") + "_" + resource.uid;
        resource.pivot_id = document.pivot_id + "_" + resource.group;
        resource.is_hidden = ctx.collapsed[resource.pivot_id] == true;

        return true;
      }, this);

      // sort the resource by their full_id ( pivot + uid )
      ctx.resource_list = ctx.resource_list.sort(function(a, b) {
        return a.full_id > b.full_id ? 1 : a.full_id == b.full_id ? 0 : -1;
      });

      // filter the list of window. Purge the ones with no documents
      ctx.window_list = ctx.window_list.filter(function(window) {
        return ctx.document_list.some(function(document) {
          return window.id == document.windowID;
        });
      });

      // sort the documents by their resources
      var document_id_order = {};
      ctx.resource_list.forEach(function(r, i) {
        document_id_order[r.document_id] = i;
      });
      ctx.document_list = ctx.document_list.sort(function(a, b) {
        return document_id_order[a.documentID] - document_id_order[b.documentID];
      });

      // request the list of documents if we have
      // an empty document_list
      // or a resource pointing to an unknown document
      // or a document does not have a document_id yet
      if (!ctx.document_list.length || unknown_document_id || null_document_id)
        this._list_documents();

      this._context = ctx;
    }
    else
    {
      this._context = null;
    }

    this.tree_view.update();
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

    var pivot = target.get_ancestor("[" + EXPAND_COLLAPSE_ATTRIBUTE + "]");
    if (pivot)
    {
      var hash = this._collapsed_hash;
      var pivot_id = pivot.getAttribute(EXPAND_COLLAPSE_ATTRIBUTE);
      var pivot_ids = [pivot_id];
      var collapsed = !hash[pivot_id];

      if (event.shiftKey)
      {
        pivot_ids.push.apply(pivot_ids, Object.keys(hash).filter(function(p) {
          return p.startswith(pivot_id);
        }));
      }

      pivot_ids.forEach(function(p) { hash[p] = collapsed; });

      this.tree_view.update();
    }
  }.bind(this);

  this._handle_resource_detail_bound = function(event, target)
  {
    if (!this._context)
      return;

    var parent = target.get_ancestor("[" + RESOURCE_UID_ATTRIBUTE + "]");
    if (parent == null)
      return;

    var uid = parent.getAttribute(RESOURCE_UID_ATTRIBUTE);
    this.highlight_resource(uid);
    this.detail_view.show_resource(uid);
  }.bind(this);

  this.highlight_resource = function(uid)
  {
    if (this._selected_resource_uid == uid)
      return;

    var e = document.querySelector("." + HIGHLIGHT_CLASSNAME);
    if (e)
      e.removeClass(HIGHLIGHT_CLASSNAME);

    this._selected_resource_uid = uid;
    if (this._context)
      this._context.selected_resource_uid = uid;

    e = document.querySelector("[" + RESOURCE_UID_ATTRIBUTE + "='" + this._selected_resource_uid + "']");
    if (e)
    {
      e.addClass(HIGHLIGHT_CLASSNAME);

      Tooltips.hide_tooltip();

      // scroll into view
      var container = this.tree_view.get_container().firstChild;
      var y = container.scrollTop;
      var max_y = e.offsetTop;
      var min_y = max_y + e.offsetHeight - container.clientHeight;

      if (y < min_y)
        container.scrollTop = min_y;
      else if (y > max_y)
        container.scrollTop = max_y;
    }
  }.bind(this);

  this._highlight_sibling_resource = function(inc)
  {
    if (!this._context)
      return;

    // walk the list of resources in the "inc" direction, looking for the last visible
    // resource before we reached the selected resource uid ( or the end of the list )
    var uid;
    var list = this._context.resource_list;
    var i = inc < 0 ? list.length - 1 : 0;

    while (list[i] != null && list[i].uid != this._selected_resource_uid)
    {
      if (list[i].is_selectable)
        uid = list[i].uid;

      i += inc;
    }

    if (uid != null)
    {
      this.highlight_resource(uid);
      this.detail_view.show_resource(uid);
      return true;
    }
  };

  this.highlight_next_resource_bound = function()
  {
    return !this._highlight_sibling_resource(-1);
  }.bind(this);

  this.highlight_previous_resource_bound = function()
  {
    return !this._highlight_sibling_resource(1);
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
    };

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

    this._suppress_uids = {};
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

    return ctx.resource_list.filter(function(v) { return v[key] == value; }).last;
  };

  this.get_resource = function(uid)
  {
    return this._get_resource_by_key_value("uid", uid);
  };

  this.get_resource_by_url = function(url)
  {
    return this._get_resource_by_key_value("url", url);
  };

  this.request_resource_data = function(url, callback, data, resource_info)
  {
    this._suppress_updates_url = url;
    new cls.ResourceRequest(url, callback, data, resource_info);
  };

  this._init();
};

cls.ResourceRequest = function(url, callback, data, resource_info)
{
  var SUCCESS = 0;
  var TRANSPORT_STRING = 1;
  var TRANSPORT_DATA_URI = 3;
  var TRANSPORT_OFF = 4;
  var DECODE_TRUE = 1;
  var SIZE_LIMIT = 1e7;

  var MAX_RETRIES = 3;

  this._init = function(url, callback, data, resource_info)
  {
    this.url = url;
    this.resource_info = resource_info;
    this._data = data || {};
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
      var window_id = this._data.window_id || window.window_manager_data.get_debug_context();
      var tag = window.tag_manager.set_callback(this, this._on_request_resource_id);
      this._resource_manager.requestCreateRequest(tag, [window_id, this.url, "GET"]);
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
      var resource_data = new cls.ResourceManager["1.2"].ResourceData(message);
      if (resource_data.content)
      {
        // content -> mock a cls.NetworkLoggerEntry and instanciate a cls.ResourceInfo
        this.requests_responses = [{responsebody: resource_data}];
        var resource_info = new cls.ResourceInfo(this);
        if (!this.resource_info)
          this.resource_info = resource_info;
        else
          this.resource_info.data = resource_info.data;

        // broadcast that we got payload of the resource
        window.messages.post("resource-request-resource", {resource_id: this.resource_id});

        // aaaand callback
        this._callback(this.resource_info, this._data);
      }
      else
      {
        // no content -> guess the type and request using the appropriate transport mode
        this.type = cls.ResourceUtil.guess_type(resource_data.mimeType, this.extension);
        this._request_get_resource();
        this._retries++;
      }
    }
    else
      this._fallback();
  };

  this._init(url, callback, data, resource_info);
};

cls.ResourceRequest.prototype = new URIPrototype("url");
