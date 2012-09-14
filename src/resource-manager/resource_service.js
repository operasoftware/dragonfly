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

  this._view = view;
  this._network_logger = network_logger;
  this._context = null;
  this._documentList = [];
  this._documentURLHash = {};
  this._collapsedHash = {};
  this._documentResources = {};

  this._handle_listDocuments = function(status,msg)
  {
    delete this._tag_requestListDocuments;
    this._documentList = new cls.DocumentManager["1.0"].DocumentList(msg).documentList;

    //  use the URL class
    //  populate this._documentURLHash
    this._documentURLHash = {};
    this._documentList.forEach(function(d)
    {
      d.url = new URI(d.url);
      this._documentURLHash[ d.documentID ] = d.url;
    },this);

    //  sameOrigin as parentDocument ?
    this._documentList.forEach(function(d)
    {
      d.sameOrigin = cls.ResourceUtil.sameOrigin(this._documentURLHash[d.parentDocumentID], d.url);
    },this);

    this._update({type:'_handle_listDocuments'});
  };

  this._listDocuments = function()
  {
    this._tag_requestListDocuments = window.tagManager.set_callback(this, this._handle_listDocuments );
    window.services['document-manager'].requestListDocuments(this._tag_requestListDocuments, []);
  }.bind(this).throttle(THROTTLE_DELAY);;

  this._populateDocumentResources = function(r)
  {
    var documentID = r.document_id;
    if (!this._documentResources[documentID])
      this._documentResources[documentID]=[];
    if (!this._documentResources[documentID].contains(r.id))
      this._documentResources[documentID].push(r.id);
  }

  this._update = function(msg)
  {
    var ctx = {};
    // get list of window_contexts for which we saw the main_document
    ctx.windowList = (this._network_logger.get_window_contexts()||[]).filter(function(w)
    {
      return w.saw_main_document;
    });

    if (ctx.windowList && ctx.windowList.length)
    {
      var typeGroupMapping =
      {
        'markup':'markup',
        'css':'stylesheets',
        'script':'scripts',
        'image':'images',
        'font':'fonts',
        '*':'others'
      };

      ctx.resourceList = [];
      ctx.documentResourceHash = {};

      // get all the resources
      ctx.windowList
      .forEach(function(w)
      {
        //  get resources of the current window
        var windowResources = w.get_resources();
        //  filter out the resources that are unloaded
        windowResources
        .filter(function(r)
        {
          return !r.is_unloaded;
        });
        //  concat the result to flat list of resource
        ctx.resourceList = ctx.resourceList.concat( windowResources );
      });

      // filter the documentId that belong in the windowIdList
      ctx.documentList  = this._documentList
      .filter(function(d)
      {
        var inWindowContext = ctx.windowList
        .some( function(w)
        {
          return w.id == d.windowID;
        });

        if (inWindowContext && d.resourceID != null)
          ctx.documentResourceHash[ d.resourceID ] = d.documentID;

        return inWindowContext;
      },this);

      // assign top resource to the right document
      // add group to each resource
      // sameOrigin flag to each resource
      ctx.resourceList
      .forEach(function(r)
      {
        this._populateDocumentResources(r);

        // check if this is the top resource of a document
        var documentID = ctx.documentResourceHash[r.id];
        if (documentID != null && documentID != r.document_id)
        {
          r.document_id = documentID;
          this._populateDocumentResources(r);
        }

        r.group = typeGroupMapping[r.type]||typeGroupMapping['*'];
        r.sameOrigin = cls.ResourceUtil.sameOrigin(this._documentURLHash[r.document_id], r);
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
           return v.document_id && !this._documentURLHash[v.document_id];
          },this)
          ||
          ctx.documentList
          .some(function(v)
          {
            return v.documentID == null;
          })
      )
        this._listDocuments();

      ctx.selectedResourceID = this._selectedResourceID;
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
    this._documentList = [];
    this._collapsedHash = {};
    this._documentResources = {};

    delete this._context;
    delete this._selectedResourceID
    this._view.update();
  }.bind(this);


  this._handle_expand_collapse_bound = function(event, target)
  {
    if (!this._context)
      return;

    var button = target.querySelector('.button-expand-collapse');
    var pivot = target.get_ancestor('[data-expand-collapse-id]');
    if (button && pivot)
    {
      var hash = this. _collapsedHash;
      var pivotID = pivot.getAttribute('data-expand-collapse-id');

      if (hash[pivotID] === true)
      {
        hash[pivotID] = false;
        pivot.classList.remove('close');
      }
      else
      {
        hash[pivotID] = true;
        pivot.classList.add('close');
      }
    }
  }.bind(this);


  this._handle_resource_detail_bound = function(event, target)
  {
    if (!this._context)
      return;

    var parent = target.get_ancestor('[data-resource-id]');
    if (!parent)
      return;

    var id = parent.getAttribute('data-resource-id');
    this.highlight_resource( id );
    cls.ResourceDetailView.instance.show_resource(id);
  }.bind(this);

  this.highlight_resource = function(id)
  {
    if (this._selectedResourceID == id)
        return;

    if (this._selectedResourceID)
    {
        var r = document.getElementById('resource-'+this._selectedResourceID);
        if (r)
          r.classList.remove('resource-highlight');
    }
    this._selectedResourceID = id;

    if (this._context)
      this._context.selectedResourceID = id;

    var r = document.getElementById('resource-'+this._selectedResourceID);
    if (r)
      r.classList.add('resource-highlight');

//    this._view.update();
  }.bind(this);


  this._resource_request_update_bound = function(msg)
  {
    1;
    if (msg.type == 'resource-request-id')
      this._suppressed_resource_update[msg.resource_id] = true;
    else if (msg.type == 'resource-request-resource')
      delete this._suppressed_resource_update[msg.resource_id];

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
    this._network_logger.addListener("resource-update", this._update_bound);
    this._network_logger.addListener("window-context-added", this._update_bound);
    this._network_logger.addListener("window-context-removed", this._update_bound);

  };

  this.get_resource_context = function()
  {
    return this._context;
  };

  this.get_resource = function(id)
  {
    var ctx = this._context;
    if (!ctx)
        return null;

    var resource = ctx.resourceList.filter(function(v){return v.id==id;});
    return resource && resource.last;
  };

  this.get_resource_for_url = function(url)
  {
    var ctx = this._context;
    if (!ctx)
      return null;

    var resource = ctx.resourceList.filter(function(v){return v.url==url;});
    return resource && resource.last;
  };

  this.request_resource = function(url, callback, data)
  {
    new cls.ResourceRequest(url, callback, data);
  }

  this._init();
};

cls.ResourceRequest = function(url, callback, data)
{
  const
  SUCCESS = 0,

  TRANSPORT_STRING = 1,
  TRANSPORT_DATA_URI = 3,
  TRANSPORT_OFF = 4,
  DECODE_TRUE = 1,
  SIZE_LIMIT = 1e7;

  var MAX_RETRIES = 3;

  this._init = function(url, callback, data)
  {
    this.url = url;
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
        this.resourceInfo = new cls.ResourceInfo(this);


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

  this._init(url, callback, data);
}

cls.ResourceRequest.prototype = new URIPrototype("url");
