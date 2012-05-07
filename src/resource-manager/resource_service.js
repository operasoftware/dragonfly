/**
 *
 */

cls.ResourceManagerService = function(view)
{
  if (cls.ResourceManagerService.instance)
  {
    return cls.ResourceManagerService.instance;
  }
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
    {
      this._context = new cls.ResourceContext(data);
    }
    if (this._context)
    {
      this._context.update("abouttoloaddocument", data);
    }
  }.bind(this);

  this._on_urlload_bound = function(msg)
  {
    if (!this._context){ return; }

    var data = new cls.ResourceManager["1.0"].UrlLoad(msg);
      //bail if we get dupes. Why do we get dupes? fixme
      //if (data.resourceID in this._current_document.resourcemap) { return }

    this._context.update("urlload", data);
    this._view.update();
  }.bind(this);

  this._on_urlredirect_bound = function(msg)
  {
    if (!this._context){ return; }

    var data = new cls.ResourceManager["1.0"].UrlRedirect(msg);
    // a bit of cheating since further down we use .resouceID to determine
    // what resource the event applies to:
    data.resourceID = data.fromResourceID;
    this._context.update("urlredirect", data);
  }.bind(this);

  this._on_urlfinished_bound = function(msg)
  {
    if (!this._context){ return; }

    var data = new cls.ResourceManager["1.0"].UrlFinished(msg);
    this._context.update("urlfinished", data);
  }.bind(this);

  this._on_response_bound = function(msg)
  {
    if (!this._context){ return; }

    var data = new cls.ResourceManager["1.0"].Response(msg);
    this._context.update("response", data);
  }.bind(this);

  this._on_debug_context_selected_bound = function()
  {
    this._context = null;
    this._view.update();
  }.bind(this);

  this.init = function()
  {
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

  /**
   * Returns an array of resource objects. The internal representation is to
   * keep separate lists of seen resources and a map of id/resource.
   */
  this.get_resource_list = function()
  {
    if (! this._current_context) { return []; }
    return this._current_context.resources;
  };

  this.get_resource_for_id = function(id)
  {
    if (this._topFrameID)
    {
      for (var i in this._frames)
      {
        var res = this._current_context.get_resource(id);
        if (res){ return res; }
      }
      //return this._current_context.get_resource(id);
    }
    return null;
  };

  this.get_resource_for_url = function(url)
  {
    if (this._current_context) {
      var filterfun = function(res) { return res.url == url };
      return this._current_context.resources.filter(filterfun).pop();
    }
    return null;
  };

  this.fetch_resource_data = function(callback, rid, type)
  {
    var typecode = {datauri: 3, string: 1}[type] || 1;
    var tag = window.tagManager.set_callback(null, callback);
    const MAX_PAYLOAD_SIZE = 10 * 1000 * 1000; // allow payloads of about 10 mb.
    this._res_service.requestGetResource(tag, [rid, [typecode, 1, MAX_PAYLOAD_SIZE]]);
  };

  this.init();
};

cls.ResourceContext = function(data)
{
//  this.resources = [];
  this.resourcesDict = {};
  this.frames = {};

  this.update = function(eventname, event)
  {
    if (eventname == "abouttoloaddocument")
    {
      var frame = event;
      frame.closed = !!event.parentFrameID;
      frame.groups =
      {
        markup: new cls.ResourceGroup('markup'),
        css: new cls.ResourceGroup('stylesheets'),
        script: new cls.ResourceGroup('scripts'),
        image: new cls.ResourceGroup('images'),
        font: new cls.ResourceGroup('fonts'),
        other: new cls.ResourceGroup('other')
      }

      this.frames[ event.frameID ] = frame;
      return;
    }

    var res = this.get_resource(event.resourceID);
    if (eventname == "urlload" && !res)
    {
      res = new cls.Resource(event.resourceID);
      res.frameID = event.frameID;
      this.resourcesDict[ res.id ] = res;
    }
    else if (!res)
    {
      // ignoring. Never saw an urlload, or it's allready invalidated
      return;
    }

    res.update(eventname, event);

    if (res.invalid)
    {
      delete this.resourcesDict[ res.id ];
//      this.resources.splice(this.resources.indexOf(res), 1);
    }
    else if (eventname == "urlfinished")
    {
      // push the resourceID into the proper group
      var frame = this.frames[res.frameID];
      var type = res.type;
      if (!frame.groups[type]){ type='other'; }

      frame.groups[type].push( res.id );
    }
  }

  this.get_resource = function(id)
  {
    return this.resourcesDict[ id ];
//    return this.resources.filter(function(e) { return e.id == id; })[0];
  };
/*
  this.get_resources_for_types = function()
  {
    var types = Array.prototype.slice.call(arguments, 0);
    var filterfun = function(e) { return types.indexOf(e.type) > -1;};
    return this.resources.filter(filterfun);
  };

  this.get_resources_for_mimes = function()
  {
    var mimes = Array.prototype.slice.call(arguments, 0);
    var filterfun = function(e) { return mimes.indexOf(e.mime) > -1; };
    return this.resources.filter(filterfun);
  };
/*
  this.get_resource_groups = function()
  {
    return this._groups;
    var imgs = this.get_resources_for_types("image");
    var stylesheets = this.get_resources_for_mimes("text/css");
    var markup = this.get_resources_for_mimes("text/html",
                                             "application/xhtml+xml");
    var scripts = this.get_resources_for_mimes("application/javascript",
                                              "text/javascript");

    var known = [].concat(imgs, stylesheets, markup, scripts);
    var other = this.resources.filter(function(e) {
      return known.indexOf(e) == -1;
    });
    return {
      markup: markup, images: imgs, stylesheets: stylesheets, 
      scripts: scripts, other: other
    }
  }
*/
}

cls.ResourceGroup = function(name)
{
  this.ids = [];
  this.name = null;
  this.closed = true;

  this._init = function(name)
  {
    this.name = name;
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

var ResourcePrototype = function()
{
  this._init = function(id)
  {
    this.id = id;
    this.finished = false;
    this.url = null;
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
      this.url = new URI( eventdata.url );
      this.urltype = eventdata.urlType;
      // fixme: complete list
      this.urltypeName = {0: "Unknown", 1: "HTTP", 2: "HTTPS", 3: "File", 4: "Data" }[eventdata.urlType];
      this._humanize_url();
    }
    else if (eventname == "urlfinished")
    {
      if (!this.url)
      {
        this.url = new URI( eventdata.url );
      }
      this.result = eventdata.result;
      this.mime = eventdata.mimeType;
      this.encoding = eventdata.characterEncoding;
      this.size = eventdata.contentLength || 0;
      this.finished = true;
      this._guess_type();
      this._humanize_url();
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
    else
    {
      opera.postError("got unknown event: " + eventname);
    }
  }

  this.get_source = function()
  {
    // cache, file, http, https ..
  }

  this._guess_type = function()
  {
    if (!this.finished || !this.mime)
    {
      this.type = undefined;
    }
    else if (this.mime.toLowerCase() == "application/octet-stream")
    {
      this.type = cls.ResourceUtil.path_to_type(this.url.filename);
    }
    else
    {
      this.type = cls.ResourceUtil.mime_to_type(this.mime);
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
      this.human_url = this.url.url;
    }
  }
}
cls.Resource.prototype = new ResourcePrototype();