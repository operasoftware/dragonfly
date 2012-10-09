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
    'markup':ui_strings.S_HTTP_LABEL_FILTER_MARKUP,
    'css':ui_strings.S_HTTP_LABEL_FILTER_STYLESHEETS,
    'script':ui_strings.S_HTTP_LABEL_FILTER_SCRIPTS,
    'image':ui_strings.S_HTTP_LABEL_FILTER_IMAGES,
    'font':ui_strings.S_HTTP_LABEL_FILTER_FONTS,
    '*':ui_strings.S_HTTP_LABEL_FILTER_OTHER
  };


  this._view = view;
  this._network_logger = network_logger;


  this._handle_listDocuments = function(status,msg)
  {
    delete this._tag_requestListDocuments;
    this._documentList = new cls.DocumentManager["1.0"].DocumentList(msg).documentList;

    this._documentList.forEach(function(d)
    {
      //  use the URL class
      d.original_url = d.url;
      d.url = new URI(d.url);
    });


    this._update({type:'_handle_listDocuments'});
  };

  this._listDocuments = function()
  {
    this._tag_requestListDocuments = window.tagManager.set_callback(this, this._handle_listDocuments );
    window.services['document-manager'].requestListDocuments(this._tag_requestListDocuments, []);
  }.bind(this).throttle(THROTTLE_DELAY);;

  this._populate_document_resources = function(r)
  {
    var documentID = r.document_id;

    if (!this._documentResources[documentID])
      this._documentResources[documentID]=[];

    if (!this._documentResources[documentID].contains(r.uid))
      this._documentResources[documentID].push(r.uid);
  }

  this._update = function(msg)
  {
    //  bounce if _suppress_updates
    if (this._suppress_updates)
    {
      if (msg && msg.type=='resource-update')
      {
        //  suppress the uid altogether if its URL matches the one we are requesting
        var r = this._network_logger.get_resources([msg.id]);
        if (r && r[0] && r[0].url == this._suppress_updates_url)
          this._suppress_uids[msg.id] = true;
      }
      return setTimeout(this._update_bound, THROTTLE_DELAY);
    }

    // build the context
    var ctx = {};

    // get the order of the groups of resources
    ctx.groupOrder = this._view.get_group_order();

    // get list of window_contexts for which we saw the main_document
    ctx.windowList = (this._network_logger.get_window_contexts()||[])
    .filter(function(w)
    {
      return w.saw_main_document;
    });

    if (ctx.windowList.length)
    {
      // get all the (non-suppressed) resources
      ctx.resourceList = (this._network_logger.get_resources()||[])
      .filter(function(v)
      {
        return !this._suppress_uids.hasOwnProperty(v.uid);
      }, this);

      ctx.documentResourceHash = {};

      // mapping of the WindowIDs in the debugging context
      var windowID_index = {};
      ctx.windowList.forEach(function(w,i){ windowID_index[w.id] = i; });

      var documentID_index = {};
      // filter the documentId that belong in the windowIdList
      ctx.documentList  = this._documentList
      .filter(function(d,i,a)
      {
        var inContext = windowID_index.hasOwnProperty(d.windowID);

        if (inContext)
        {
          if (d.resourceID != null)
            ctx.documentResourceHash[ d.resourceID ] = d.documentID;

          //  populate documentID_index
          documentID_index[ d.documentID ] = i;

          //  set depth, pivotID and sameOrigin
          var p = a[ documentID_index[ d.parentDocumentID ] ]||{pivotID:d.windowID,depth:0};
          var id = p.pivotID+'_'+d.documentID;
          d.depth = p.depth+1;
          d.pivotID = id;
          d.sameOrigin = cls.ResourceUtil.sameOrigin(p.url, d.url);

          //  set the default collapsed flag
          var hash = this. _collapsedHash;
          if (!hash.hasOwnProperty(id))
          {
            hash[id] = d.depth>1;
            ctx.groupOrder.forEach( function(g){ hash[id+'_'+g] = true; } );
          }
        }

        return inContext;
      },this);

      // assign top resource to the right document
      // add group to each resource
      // sameOrigin flag to each resource
      ctx.resourceList
      .forEach(function(r)
      {
        // check if this is the top resource of a document
        var documentID = ctx.documentResourceHash[r.resource_id];
        if (documentID != null && documentID != r.document_id)
          r.document_id = documentID;

        this._populate_document_resources(r);

        r.group = TYPE_GROUP_MAPPING[r.type]||TYPE_GROUP_MAPPING['*'];
        var d = this._documentList[documentID_index[r.document_id]];
        r.sameOrigin = cls.ResourceUtil.sameOrigin(d&&d.url, r);
      },this);

      //  filter the list of window. Purge the ones with no documents
      ctx.windowList = ctx.windowList
      .filter(function(v)
      {
        return ctx.documentList
        .some(function(w)
        {
          return v.id == w.windowID;
        });
      });

      // request the list of documents if we have
      // an empty documentList
      // or a resource pointing to an unknown document
      // or a document does not have a documentID yet
      if(
          ctx.documentList.length == 0
          ||
          ctx.resourceList
          .some(function(v)
          {
           return v.document_id && !documentID_index[v.document_id];
          },this)
          ||
          ctx.documentList
          .some(function(v)
          {
            return v.documentID == null;
          })
      )
        this._listDocuments();

      ctx.selectedResourceUID = this._selectedResourceUID;
      ctx.documentResources = this._documentResources;
      ctx.collapsed = this._collapsedHash;
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

    var pivot = target.get_ancestor('[data-expand-collapse-id]');
    if (pivot)
    {
      var hash = this. _collapsedHash;
      var pivotID = pivot.getAttribute('data-expand-collapse-id');
      var pivotIDs = [pivotID];
      var collapsed = !hash[pivotID];

      if (event.shiftKey)
        pivotIDs.push.apply( pivotIDs, Object.keys(hash).filter( function(p)
        {
          return p.indexOf(pivotID+'_') == 0;
        }));

      pivotIDs.forEach(function(p){ hash[p] = collapsed; });

      this._view.update();
    }
  }.bind(this);


  this._handle_resource_detail_bound = function(event, target)
  {
    if (!this._context)
      return;

    var parent = target.get_ancestor('[data-resource-uid]');
    if (!parent)
      return;

    var uid = parent.getAttribute('data-resource-uid');
    this.highlight_resource(uid);
    cls.ResourceDetailView.instance.show_resource(uid);
  }.bind(this);

  this.highlight_resource = function(uid)
  {
    var e;
    if (this._selectedResourceUID == uid)
        return;

    if (this._selectedResourceUID)
    {
        e = document.querySelector('*[data-resource-uid="'+ this._selectedResourceUID +'"]');
        if (e)
          e.classList.remove('resource-highlight');
    }

    this._selectedResourceUID = uid;
    if (this._context)
      this._context.selectedResourceUID = uid;

    e = document.querySelector('*[data-resource-uid="'+ this._selectedResourceUID +'"]');
    if (e)
      e.classList.add('resource-highlight');
  }.bind(this);


  this._resource_request_update_bound = function(msg)
  {
    if (msg.type == 'resource-request-id')
      this._suppress_updates = true;
    else
      this._suppress_updates = false;
  }.bind(this);

  this._init = function()
  {
    var eh = window.eventHandlers;
    eh.click["resources-expand-collapse"] = this._handle_expand_collapse_bound;
    eh.click["resource-detail"] = this._handle_resource_detail_bound;

    eh.click['open-resource-tab'] = function(event, target)
    {
      var broker = cls.ResourceDisplayBroker.get_instance();
      broker.show_resource_for_ele(target);
    }

    var messages = window.messages;
    messages.addListener('debug-context-selected', this._on_debug_context_selected_bound);

    messages.addListener('resource-request-id', this._resource_request_update_bound);
    messages.addListener('resource-request-resource', this._resource_request_update_bound);
    messages.addListener('resource-request-fallback', this._resource_request_update_bound);

    this._network_logger.addListener("resource-update", this._update_bound);
    this._network_logger.addListener("window-context-added", this._update_bound);
    this._network_logger.addListener("window-context-removed", this._update_bound);

    window.services["window-manager"].addListener('windowclosed', this._update_bound );

    this._reset();
  };

  this._reset = function()
  {
    this._context = null;
    this._selectedResourceUID = null;

    this._documentList = [];
    this._documentURLHash = {};
    this._collapsedHash = {};
    this._documentResources = {};

    this._suppress_updates = false;
    this._suppress_uids = {};
    this._view.update();
  };

  this.get_resource_context = function()
  {
    return this._context;
  };

  this.get_resource = function(uid)
  {
    var ctx = this._context;
    if (!ctx)
        return null;

    var resource = ctx.resourceList.filter(function(v){return v.uid==uid;});
    return resource && resource.last;
  };

  this.get_resource_by_url = function(url)
  {
    var ctx = this._context;
    if (!ctx)
      return null;

    var resource = ctx.resourceList.filter(function(v){return v.url==url;});
    return resource && resource.last;
  };

  this.request_resource_data = function(url, callback, data, resourceInfo)
  {
    this._suppress_updates = true;
    this._suppress_updates_url = url;
    new cls.ResourceRequest(url, callback, data, resourceInfo);
  }

  this._init();
};

cls.ResourceRequest = function(url, callback, data, resourceInfo)
{
  const
  SUCCESS = 0,

  TRANSPORT_STRING = 1,
  TRANSPORT_DATA_URI = 3,
  TRANSPORT_OFF = 4,
  DECODE_TRUE = 1,
  SIZE_LIMIT = 1e7;

  var MAX_RETRIES = 3;

  this._init = function(url, callback, data, resourceInfo)
  {
    this.url = url;
    this.resourceInfo = resourceInfo;
    this._calback_data = data;
    this._callback = callback;
    this._retries = 0;

    this._tag_manager =  window.tagManager;
    this._resource_manager = window.services['resource-manager'];
    if (this._tag_manager && this._resource_manager)
      this._request_create_request();
    else
      this._fallback();
  }

  this._fallback = function()
  {
    //  broadcast that we fellback
    window.messages.post('resource-request-fallback', {resource_id: this.resource_id});

    window.open(this.url);
  }

  this._request_create_request = function()
  {
    if (this._resource_manager.requestCreateRequest)
    {
      var windowID = window.window_manager_data.get_debug_context();
      var tag = this._tag_manager.set_callback(this, this._on_request_resource_id);
      this._resource_manager.requestCreateRequest(tag, [windowID, this.url, 'GET']);
    }
    else
      this._fallback();
  }

  this._on_request_resource_id = function(status, message)
  {
    if(status == SUCCESS && this._resource_manager.requestGetResource)
    {
      // resource_id -> getResource => _on_request_get_resource
      const RESOURCE_ID = 0;
      this.resource_id = message[RESOURCE_ID];

        //  broadcast that we are working on the resource this.resource_id
      window.messages.post('resource-request-id', {resource_id: this.resource_id});

      this._request_get_resource();
    }
    else
      this._fallback();
  }

  this._request_get_resource = function()
  {
      var transport_type = TRANSPORT_OFF;
      if (this.type)
      {
        // resource of known type-> call with appropriate transport mode.
        var response_type = cls.ResourceUtil.type_to_content_mode(this./*nle.*/type);
        var transport_type = response_type=='datauri'?TRANSPORT_DATA_URI:TRANSPORT_STRING;
      }

      var tag = this._tag_manager.set_callback(this, this._on_request_get_resource);
      this._resource_manager.requestGetResource(tag, [this.resource_id, [transport_type, DECODE_TRUE, SIZE_LIMIT]]);
  }

  this._on_request_get_resource = function(status, message)
  {
    if (status == SUCCESS)
    {

      var resourceData = new  cls.ResourceManager["1.2"].ResourceData(message);
      if (this._retries == MAX_RETRIES || resourceData.content)
      {

        // content -> mock a cls.NetworkLoggerEntry and instanciate a cls.ResourceInfo
        this.requests_responses = [{responsebody:resourceData}];
        var resourceInfo = new cls.ResourceInfo(this);
        if(!this.resourceInfo)
            this.resourceInfo = resourceInfo;
          else
            this.resourceInfo.data = resourceInfo.data;

        //  broadcast that we got payload of the resource
        window.messages.post('resource-request-resource', {resource_id: this.resource_id});

        //  aaaand callback
        this._callback(this.resourceInfo, this._calback_data);
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
  }

  this._init(url, callback, data, resourceInfo);
}

cls.ResourceRequest.prototype = new URIPrototype("url");
