window.cls || (window.cls = {});

/**
 *
 */

cls.ResourceManagerService = function(view)
{
  if (cls.ResourceManagerService.instance)
    return cls.ResourceManagerService.instance;

  cls.ResourceManagerService.instance = this;

  this._view = view;
  this._context = null;

  this._enable_content_tracking = function()
  {
    this._res_service.requestSetResponseMode(null, [[3, 1]]);
  };

  this._on_abouttoloaddocument_bound = function(msg)
  {
    var data = new cls.DocumentManager["1.0"].AboutToLoadDocument(msg);

    if (!data.parentFrameID)
      this._context = new cls.ResourceContext(data);

    if (this._context)
      this._context.update("abouttoloaddocument", data);

  }.bind(this);

  this._on_urlload_bound = function(msg)
  {
    if (!this._context)
      return;

    var data = new cls.ResourceManager["1.2"].UrlLoad(msg);
      //bail if we get dupes. Why do we get dupes? fixme
      //if (data.resourceID in this._current_document.resourcemap) { return }

    this._context.update("urlload", data);
    this._view.update();

  }.bind(this);

  this._on_urlredirect_bound = function(msg)
  {
    if (!this._context)
      return;

    var data = new cls.ResourceManager["1.0"].UrlRedirect(msg);
    // a bit of cheating since further down we use .resouceID to determine
    // what resource the event applies to:
    data.resourceID = data.fromResourceID;
    this._context.update("urlredirect", data);
  }.bind(this);

  this._on_urlfinished_bound = function(msg)
  {
    if (!this._context)
      return;

    var data = new cls.ResourceManager["1.0"].UrlFinished(msg);
    var r = this._context.update("urlfinished", data);

    if (r && !r.data)
    {
        r.fetch_data();
    }

  }.bind(this);

  this._on_response_bound = function(msg)
  {
    if (!this._context)
      return;

    var data = new cls.ResourceManager["1.0"].Response(msg);
    this._context.update("response", data);
  }.bind(this);

  this._on_debug_context_selected_bound = function()
  {
    this._context = null;
    this._view.update();
  }.bind(this);


  this._handle_expand_collapse_bound = function(event, target)
  {
    if (!this._context)
      return;

    var button = target.querySelector('.button-expand-collapse');
    var target = target.parentNode;

    var frameID = target.getAttribute('data-frame-id');
    var data = this._context.frames[ frameID ];

    var groupName = target.getAttribute('data-resource-group');
    if (groupName){ data = data.groups[ groupName ]; }

    data.closed = !data.closed;
    if (data.closed)
    {
      target.addClass('collapsed');
    }
    else
    {
      target.removeClass('collapsed');
    }
  }.bind(this);


  this._handle_resource_detail_bound = function(event, target)
  {
    if (!this._context)
      return;

    var parent = target.get_ancestor('[data-resource-id]');
    if (!parent)
      return;
  
    var id = Number( parent.getAttribute('data-resource-id') );
    var resource = this.get_resource(id);

    if (!resource)
      return;

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
    
    this._res_service.addListener("urlload", this._on_urlload_bound);
    this._res_service.addListener("response", this._on_response_bound);
    this._res_service.addListener("urlredirect", this._on_urlredirect_bound);
    this._res_service.addListener("urlfinished", this._on_urlfinished_bound);
    this._doc_service = window.services['document-manager'];
    this._doc_service.addListener("abouttoloaddocument", this._on_abouttoloaddocument_bound);
    messages.addListener('debug-context-selected', this._on_debug_context_selected_bound);
  };


  this.get_resource_context = function()
  {
    return this._context;
  };


  this.get_resource = function(id)
  {
    if (!this._context)
      return null;

    return this._context.resourcesDict[id];
  };


  this.get_resource_for_url = function(url)
  {
    if (!this._context)
      return null;

    var id = this._context.resourcesUrlDict[url];
    if (id===undefined){ return null; }
    
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

cls.ResourceFrame = function( data )
{
  this._init( data );
}
cls.ResourceFramePrototype = function()
{
  this._init = function(data)
  {
    this.id = data.frameID;
    this.resourceID = data.resourceID;
    this.parentFrameID = data.parentFrameID;
    this.windowID = data.windowID;
    this.closed = !!data.parentFrameID;
    this.groups =
    {
      markup: new cls.ResourceGroup('markup','markup'),
      css: new cls.ResourceGroup('stylesheets','css'),
      script: new cls.ResourceGroup('scripts','script'),
      image: new cls.ResourceGroup('images','image'),
      font: new cls.ResourceGroup('fonts','font'),
      other: new cls.ResourceGroup('other','other')
    }
  }
}

window.cls.ResourceFrame.prototype = new window.cls.ResourceFramePrototype();


cls.ResourceContext = function(data)
{
  this.resourcesDict = {};
  this.resourcesUrlDict = {};
  this.frames = {};

  this.update = function(eventname, event)
  {
    if (eventname == "abouttoloaddocument")
    {
      var frame = new cls.ResourceFrame(event);
      this.frames[ frame.id ] = frame;
      return;
    }

    var res = this.get_resource(event.resourceID);
    if (eventname == "urlload" && !res && this.frames[event.frameID])
    {
      res = new cls.Resource(event.resourceID);
      res.frameID = event.frameID;
      this.resourcesDict[ res.id ] = res;
    }

    if (res)
    {
      res.update(eventname, event);

      var frame = this.frames[res.frameID];
      if (eventname == "urlload")
      {
        if (res.id == frame.resourceID)
          frame.resource = res;
      }

      if (eventname == "urlfinished")
      {
        // push the resourceID into the proper group
        if (frame && frame.resource)
        {
          var type = res.type;
          if (!frame.groups[type]){ type='other'; }

          frame.groups[type].push( res.id );
          this.resourcesUrlDict[ res.url ] = res.id;

          // sameOrigin check
          // TODO: sameOrigin check for iframes
          res.sameOrigin = false;
          if (frame.resource != null && frame.resource.protocol == res.protocol &&
            (
              frame.resource.host == res.host
              || frame.resource.host.match(new RegExp('\\.' + res.host + '$')) != null
            )
          )
            res.sameOrigin = true;

        }
        else
        {
          opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
            "Unknown frameID for the resource "+ res.id);
          res.invalid = true;
        }
      }

      if (res.invalid)
      {
        // delete the frame and all its resources if the top resource of a frame is invalid
        if (frame && frame.resource.id==res.id)
        {
          delete this.frames[frame.id];
          for(var rid in this.resourcesDict)
          {
            var r = this.resourcesDict[ rid ];
            if(r.frameID == frame.id)
              delete this.resourcesDict[ rid ];
          }
        }
        delete this.resourcesDict[ res.id ];
      }
      else
      {
        return res;
      }
    }

  }

  this.get_resource = function(id)
  {
    return this.resourcesDict[ id ];
  };
}

cls.ResourceGroup = function(name,type)
{
  this.ids = [];
  this.name = null;
  this.type = null;
  this.closed = true;

  this._init = function(name,type)
  {
    this.name = name;
    this.type = type;
    this.ids.length = 0;
  }
  this.push = function( id )
  {
    if( this.ids.indexOf(id)===-1 )
      this.ids.push(id);
  }

  this._init(name);
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
        this.invalid = true;
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
