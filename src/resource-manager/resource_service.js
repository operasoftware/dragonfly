window.cls || (window.cls = {});

/**
 *
 */
cls.ResourceManagerService = function(view, network_logger)
{
  if (cls.ResourceManagerService.instance)
    return cls.ResourceManagerService.instance;

  cls.ResourceManagerService.instance = this;

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

    this._update({});
  };

  this._listDocuments = function()
  {
    this._tag_requestListDocuments = window.tagManager.set_callback(this, this._handle_listDocuments );
    window.services['document-manager'].requestListDocuments(this._tag_requestListDocuments, []);
  };

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
      ctx.documentList  = this._documentList.filter(function(d)
      {
        var inWindowContext = ctx.windowList.some( function(w)
        {
          return w.id==d.windowID;
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
      ctx.windowList = ctx.windowList.filter(function(v)
      {
        return ctx.documentList.some(function(w)
        {
          return v.id==w.windowID;
        });
      });

      // request the list of documents if we have
      // an empty documentList
      // or a resource pointing to an unknown document
      // or a document does not have a documentID yet
      if(
          ctx.documentList.length == 0
        ||
          ctx.resourceList.some(
            function(v)
            {
             return v.document_id && !this._documentURLHash[v.document_id];
            },this)
        ||
          ctx.documentList.some(
            function(v)
            {
              return v.documentID==null;
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

    this._selectedResourceID = id;

    if (this._context)
      this._context.selectedResourceID = id;

    this._view.update();
  }.bind(this);

  //  WIP: soon there will be some triggers to display a whole group of resource, e.g. gallery of images, videos, fonts, audios, ...
  this._handle_resource_group_bound = function(event, target)
  {
    var parent = target.get_ancestor('[data-frame-id]');
    if (!parent)
      return;

    var frameID = parent.getAttribute('data-frame-id');
    var groupName = parent.getAttribute('data-resource-group');

    var group = this._context.frames[ frameID ].groups[ groupName ];

    cls.ResourceDetailView.instance.show_resource_group(group);
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

    this._res_service = window.services['resource-manager'];
    window.messages.addListener('debug-context-selected', this._on_debug_context_selected_bound);
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


  this.request_resource_for_url = function(url,callback)
  {
    cls.ResourceRequest(url, callback, data);
  }


  this._init();
};

cls.ResourceRequest = function(url, callback,data)
{
  const
  TRANSPORT_STRING = 1,
  TRANSPORT_DATA_URI = 3,
  TRANSPORT_OFF = 4,
  DECODE_TRUE = 1,
  SIZE_LIMIT = 1e7;

  this._init = function(url, callback, data)
  {
    this._url = url;
    this._callback = callback;
    this._data = data;
    this._initialized = false;

    if (!this._resource_manager)
    {
      this._resource_manager = window.services['resource-manager'];
      this._tag_manager =  window.tagManager;
      this._ResourceData = cls.ResourceManager["1.0"].ResourceData;
      this._initialized = true;
    }
  }

  this._fallback = function()
  {
    window.open(this._url);
  }

  this._request_resource = function(url,callback)
  {
    if (this._resource_manager.requestGetResourceID)
    {
      var tag = window.tagManager.set_callback(this, this._on_request_resource_id);
      this._resource_manager.requestGetResourceID(tag, [this._url]);
    }
    else
      this._fallback();
  }

  this._on_request_resource_id = function(status, message)
  {
    if (status && this._resource_manager.requestCreateRequest)
    {
      var debugContext = window.window_manager_data.get_debug_context();
      var tag = this._tag_manager.set_callback(this, this._on_request_create_request);
      this._resource_manager.requestCreateRequest(tag, [debugContext, this._url, 'GET']);
    }
    else if(!status && this._resource_manager.requestGetResource)
    {
      const RESOURCE_ID = 0;
      this._resource_id = message[RESOURCE_ID];
      var tag = this._tag_manager.set_callback(this, this._on_request_get_resource);
      this._resource_manager.requestGetResource(tag, [this._resource_id, [TRANSPORT_OFF]]);
    }
    else
      this._fallback();
  }

  this._on_request_create_request = function(status, message)
  {
    if(!status && this._resource_manager.requestGetResource)
    {
      const RESOURCE_ID = 0;
      this._resource_id = message[RESOURCE_ID];
      var tag = this._tag_manager.set_callback(this, this._on_request_get_resource);
      this._resource_manager.requestGetResource(tag, [this._resource_id, [TRANSPORT_OFF]]);
    }
  }

  this._on_request_get_resource = function(status, message)
  {
    if (!status)
    {
      this._resource = new cls.Resource(this._resource_id);
      this._resource.update("urlfinished", new this._ResourceData(message));
      this._resource.fetch_data(this._on_fetch_data_bound);
    }
  }

  this._on_fetch_data_bound = function()
  {
    this._callback(this._resource,this._data);
  }.bind(this);


  this._init(url, callback, data);
  if (this._initialized)
    this._request_resource();
}


cls.Resource = function(id)
{
  this._init(id);
}

cls.ResourcePrototype = function()
{
  this._init = function(id)
  {
    this.id = id;
    this.finished = false;
    this.location = "No URL";
    this.result = null;
    this.mime = null;
    this.encoding = null;
    this.size = 0;
    this.type = null;
    this.urltype = null;
    this.invalid = false;
  }

  this.update = function(eventname, eventdata)
  {
    if (eventname == "urlload")
    {
      this.url = eventdata.url;
      this.urltype = eventdata.urlType;
      // fixme: complete list
      this.urltypeName = {0: "Unknown", 1: "HTTP", 2: "HTTPS", 3: "File", 4: "Data" }[eventdata.urlType];
      this._humanize_url();
    }
    else if (eventname == "urlfinished")
    {
      if (!this.url)
      {
        this.url = eventdata.url;
      }
      this.result = eventdata.result;
      this.mime = eventdata.mimeType;
      this.encoding = eventdata.characterEncoding;
      this.size = eventdata.contentLength || 0;
      this.finished = true;
      this._guess_type();
      this._humanize_url();

      if (eventdata.content)
      {
        this.update("responsefinished", eventdata);
      }
    }
    else if (eventname == "response")
    {
      // If it's one of these, it's not a real resource.
      if ([200, 206, 304].indexOf(eventdata.responseCode) == -1)
      {
//        this.invalid = true;
      }
    }
    else if (eventname == "urlredirect")
    {
      this.invalid = true;
    }
    else if (eventname == "responsefinished")
    {
      this.data = new cls.ResourceManager["1.0"].ResourceData( eventdata );
      this._get_meta_data();
    }
    else
    {
      opera.postError("got unknown event: " + eventname);
    }
  }

  this._get_meta_data = function()
  {
    if (this.type == 'image')
    {
      var i=new Image();
      i.src=this.data.content.stringData;
      if(i.naturalWidth)
      {
        this.data.meta = i.naturalWidth+'x'+i.naturalHeight;
      }
      else
      {
        this.data.meta = 'vectorial image';
      }
    }
  }

  this._guess_type = function()
  {
    if (!this.finished || !this.mime)
    {
      this.type = undefined;
    }
    else
    {
      if (this.mime.toLowerCase() == "application/octet-stream")
      {
        this.type = cls.ResourceUtil.extension_type_map[this.extension];
      }
      if (!this.type)
      {
        this.type = cls.ResourceUtil.mime_to_type(this.mime);
      }
    }
  }

  this._humanize_url = function()
  {
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
    else
    {
      this.human_url = this.url;
    }
  }

  this._on_fetch_data_bound = function(callback)
  {
    return function(status,message)
    {
      if(!status){ this.update("responsefinished", message); }
      if(callback){ callback(this); }
    }.bind(this);
  }

  this.fetch_data = function(callback)
  {
    const
    TRANSPORT_STRING = 1,
    TRANSPORT_DATA_URI = 3,
    TRANSPORT_OFF = 4,
    DECODE_TRUE = 1,
    SIZE_LIMIT = 1e7;

    if (!this.data)
    {
      var tag = window.tagManager.set_callback(null, this._on_fetch_data_bound(callback));
      var responseType = cls.ResourceUtil.type_to_content_mode(this.type);
      var transportType = {datauri: TRANSPORT_DATA_URI}[responseType]||TRANSPORT_STRING;

      window.services['resource-manager'].requestGetResource(tag, [this.id, [transportType, DECODE_TRUE, SIZE_LIMIT]]);
    }
    else if(callback)
    {
      callback(this);
    }
  };

}

window.cls.ResourcePrototype.prototype = new URIPrototype("url");
window.cls.Resource.prototype = new window.cls.ResourcePrototype();
