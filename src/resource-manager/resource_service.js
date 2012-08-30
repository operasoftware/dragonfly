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

  this._getNetworkContext = function()
  {
    return this._network_logger.get_window_contexts();
  }

  this._update = function(msg)
  {
    var ctx = {};

    ctx.windowList = this._network_logger.get_window_contexts();
    if (ctx.windowList.length)
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

      // get all the resources
      ctx.resourceList = [];
      ctx.windowList.
      forEach(function(w){
        var wr = w.get_resources();
        ctx.resourceList = ctx.resourceList.concat( wr );
      });

      ctx.resourceHash_id = {};

      // filter the documentId that belong in the windowIdList
      ctx.documentList  = this._documentList.
      filter(function(d){
        var inTheContext = ctx.windowList.
        some( function(w){
          return w.id==d.windowID;
        });

        if (inTheContext && d.resourceID != null)
          ctx.resourceHash_id[ d.resourceID ] = d.documentID;

        return inTheContext;
      },this);

      // add group to each resource
      // sameOrigin flag to each resource
      ctx._resourceHash = {};
      ctx.resourceList.
      forEach(function(r, i){
        var tmp = ctx.resourceHash_id[r.resource_id];
        if (tmp!=null)
        {
          console.log(r.id +' aka '+r.resource_id +' from d.'+ r.document_id +' to d.'+ tmp +' // '+ r.url);
          r.document_id = tmp;
        }

        ctx._resourceHash[ r.id ] = i;
        r.group = typeGroupMapping[r.type]||typeGroupMapping['*'];
        r.sameOrigin = cls.ResourceUtil.sameOrigin(this._documentURLHash[r.document_id], r);
      },this);

      //  filter the list of window. Purge the ones with no documents
      ctx.windowList = ctx.windowList.
      filter(function(v){
        return ctx.documentList.
        some( function(w){ return v.id==w.windowID;} );
      });

      // request the list of documents if we have
      // an empty documentList
      // or a resource pointing to an unknown document
      // or a document does not have a documentID yet
      if ( ctx.documentList.length == 0
        || ctx.resourceList.some(function(v){ return v.document_id && !this._documentURLHash[v.document_id]; },this)
        || ctx.documentList.some(function(v){ return v.documentID==null; }))
        this._listDocuments();

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

    delete this._context;
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
      if (hash[pivotID])
      {
        pivot.classList.remove('close');
        delete hash[pivotID];
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
    var resource;
    if (!this._context)
      return;

    var parent = target.get_ancestor('[data-resource-id]');
    if (!parent)
      return;


    if (this._selectedResourceId)
    {
      resource = this.get_resource(this._selectedResourceId);
      if(resource)
        resource.selected = false;
    }

    var id = parent.getAttribute('data-resource-id');
    resource = this.get_resource(id);

    if (!resource)
      return;

    this._selectedResourceId = id;
    resource.selected = true;
    this._view.update();
    cls.ResourceDetailView.instance.show_resource(resource);

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
    eh.click["resource-group"] = this._handle_resource_group_bound;

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
    if (!ctx || ctx._resourceHash[id]==null)
      return null;

    return ctx.resourceList[ctx._resourceHash[id]];
  };


  this.get_resource_for_url = function(url)
  {
    if (!this._context)
      return null;

    var id = this._context.resourcesUrlDict[url];
    if (id===undefined)
      return null;

    return this.get_resource(id);
  };

  this._fetch_resource_data = function(callback, id, type)
  {
    var resource = this.get_resource(id);

    var typecode = {datauri: 3, string: 1}[type] || 1;
    var tag = window.tagManager.set_callback(null, callback);
    const MAX_PAYLOAD_SIZE = 10 * 1000 * 1000; // allow payloads of about 10 mb.
    this._res_service.requestGetResource(tag, [id, [typecode, 1, MAX_PAYLOAD_SIZE]]);
  };

  this._on_resource_data_bound = function(type, data)
  {
    var id = data[0];
    var resource = this.get_resource(id);
    if(resource)
    {
      resource.data = new cls.ResourceManager["1.0"].ResourceData( data );
      if(resource.type=='image')
      {
        var i=new Image();
        i.src=resource.data.content.stringData;
        resource.data.meta = i.naturalWidth+'x'+i.naturalHeight;
      }
    }
    this._view.update();
  }.bind(this);



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
