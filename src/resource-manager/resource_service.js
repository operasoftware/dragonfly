/**
 *
 * A document as represented here looks like this
 *
 * var document = {
 *   id: <document id>,
 *   resourcelist: <list of resources in load order>
 *   resourcemap: <dict of resource id -> resource object>
 * }
 *
 * A resource looks like this:
 *
 * {
 *   documentID: doc id,
 *   resourceID: res id,
 *   // maps to resman events:
 *   urlload:
 *   request: requeststart object
 *   requestheader
 *   response
 *   responseheader
 *   urldone
 *
 */

cls.ResourceManagerService = function(view, data)
{
  if (cls.ResourceManagerService.instance)
  {
    return cls.ResourceManagerService.instance;
  }
  cls.ResourceManagerService.instance = this;

  this._seen_doc_ids = [];
  this._document_contexts = {}; // mapping document id -> list of requests
  this._current_document = null;


  this._enable_content_tracking = function()
  {
    this._res_service.requestSetResponseMode(null, [[3, 1]]);
  }

  this._on_abouttoloaddocument_bound = function(msg)
  {

    var data = new cls.DocumentManager["1.0"].AboutToLoadDocument(msg);

    this._seen_doc_ids = [];
    this._current_document = {
      id: null,
      topresource: data.resourceID,
      resourcelist: [],
      resourcemap: {},
      firsttime: data.time,
      lasttime: null
    };

  }.bind(this);

  this._on_urlload_bound = function(msg)
  {
    if (!this._current_document) { return; }
    var data = new cls.ResourceManager["1.0"].UrlLoad(msg);

    this._current_document.resourcelist.push(data.resourceID);
    this._current_document.resourcemap[data.resourceID] = {urlload: data};
  }.bind(this);

  this._on_request_bound = function(msg)
  {
    if (!this._current_document) { return; }
    var data = new cls.ResourceManager["1.0"].Request(msg);

    var resource = this._current_document.resourcemap[data.resourceID];
    if (!resource) {
      opera.postError("No exist! " + JSON.stringify(data));
    }
    resource.request = data;

  }.bind(this);

  this._on_requestheader_bound = function(msg)
  {
    if (!this._current_document) { return; }
    var data = new cls.ResourceManager["1.0"].RequestHeader(msg);
    var resource = this._current_document.resourcemap[data.resourceID];
    if (resource) {
      resource.requestheader = data;
    }
  }.bind(this);

  this._on_requestfinished_bound = function(msg)
  {
    if (!this._current_document) { return; }
    var data = new cls.ResourceManager["1.0"].RequestFinished(msg);
    var resource = this._current_document.resourcemap[data.resourceID];
    if (resource) {
      resource.requestfinished = data;
    }
  }.bind(this);

  this._on_response_bound = function(msg)
  {
    if (!this._current_document) { return; }
    var data = new cls.ResourceManager["1.0"].Response(msg);

    var resource = this._current_document.resourcemap[data.resourceID];
    if (resource) {
      resource.response = data;
    }
  }.bind(this);

  this._on_responseheader_bound = function(msg)
  {
    if (!this._current_document) { return; }
    var data = new cls.ResourceManager["1.0"].ResponseHeader(msg);
    var resource = this._current_document.resourcemap[data.resourceID];
    if (resource) {
      resource.responseheader = data;
    }
  }.bind(this);

  this._on_responsefinished_bound = function(msg)
  {
    if (!this._current_document) { return; }
    var data = new cls.ResourceManager["1.0"].ResponseFinished(msg);
    var resource = this._current_document.resourcemap[data.resourceID];
    if (resource) {
      resource.responsefinished = data;
    }
  }.bind(this);

  this._on_urlfinished_bound = function(msg)
  {
    if (!this._current_document) { return; }
    var data = new cls.ResourceManager["1.0"].UrlFinished(msg);
    var resource = this._current_document.resourcemap[data.resourceID];
    if (resource) {
      resource.urlfinished = data;
      this._current_document.lasttime = data.time;
    }
  }.bind(this);

  this.init = function()
  {
    this._res_service = window.services['resource-manager'];
    this._res_service.addListener("urlload", this._on_urlload_bound);
    this._res_service.addListener("request", this._on_request_bound);
    this._res_service.addListener("requestheader", this._on_requestheader_bound);
    this._res_service.addListener("requestfinished", this._on_requestfinished_bound);
    this._res_service.addListener("response", this._on_response_bound);
    this._res_service.addListener("responseheader", this._on_responseheader_bound);
    this._res_service.addListener("responsefinished", this._on_responsefinished_bound);
    this._res_service.addListener("urlfinished", this._on_urlfinished_bound);

    this._doc_service = window.services['document-manager'];
    this._doc_service.addListener("abouttoloaddocument", this._on_abouttoloaddocument_bound);
  };

  this.get_request_context = function()
  {
    if (this._current_document &&
        this._current_document.resourcelist &&
        this._current_document.resourcelist.length)
    {
      return new cls.RequestContext(this.get_resource_list());
    }
    return null;
  };

  /**
   * Returns an array of resource objects. The internal representation is to
   * keep separate lists of seen resources and a map of id/resource.
   */
  this.get_resource_list = function()
  {
    if (! this._current_document) { return []; }
    var mapfun = function(e)
    {
      return this._current_document.resourcemap[e];
    };

    return this._current_document.resourcelist.map(mapfun, this);
  };

  this.get_resource_for_id = function(id)
  {
    if (this._current_document && id in this._current_document.resourcemap)
    {
        return this._current_document.resourcemap[id];
    }
    return null;
  };

  this.init();
  };




cls.RequestContext = function(reslist)
{
  this.resources = reslist;

  /**
   * Grab stuff based on mime type, ignoring subtype
   */
  this.get_resources_for_type = function()
  {
    // FIXME: this will change, as it will be using urlfinished not responsefinished
    var types = Array.prototype.slice.call(arguments, 0);

    var filterfun = function(e)
    {
      if (! e.responsefinished) { return false; }
      var type = e.responsefinished.data.mimeType.split("/")[0];
      return types.indexOf(type) > -1;
    };

    return this.resources.filter(filterfun);
  };
  // alias with plural name
  this.get_resources_for_types = this.get_resources_for_type;


  this.get_resources_for_mime = function()
  {
    // FIXME: this will change, as it will be using urlfinished not responsefinished
    var mimes = Array.prototype.slice.call(arguments, 0);

    var filterfun = function(e)
    {
      return e.responsefinished && mimes.indexOf(e.responsefinished.data.mimeType) > -1;
    };

    return this.resources.filter(filterfun);
  };


  this.get_resource_groups = function()
  {
    var imgs = this.get_resources_for_type("image");
    var stylesheets = this.get_resources_for_mime("text/css");
    var markup = this.get_resources_for_mime("text/html",
                                             "application/xhtml+xml");
    var scripts = this.get_resources_for_mime("application/javascript",
                                              "text/javascript");

    var known = [].concat(imgs, stylesheets, markup, scripts);
    var other = this.resources.filter(function(e) {
      return known.indexOf(e) == -1;
    });
    return {
      images: imgs, stylesheets: stylesheets, markup: markup,
      scripts: scripts, other: other
    }
  }

  this.get_resource_sizes = function()
  {
    var groups = this.get_resource_groups();

    var ret = {};
    var sum = function(list) { var ret = 0; list.forEach(function(e) { ret+=e }); return ret; };
    var sizefun = function(e) { return e.urlfinished.contentLength; };

    var total = 0;
    for (var key in groups)
    {
      var current = sum(groups[key].map(sizefun));
      total += current;
      ret[key] = current;
    }
    ret.total = total;
    return ret;
  }

  this.get_start_time = function()
  {
    return this.resources[0].urlload.time;
  }

  this.get_end_time = function()
  {
    return this.resources[this.resources.length-1].urlfinished.time;
  }

  this.get_load_times = function()
  {

  };

  this.get_duration = function()
  {
    return this.resources[this.resources.length-1].urlfinished.time - this.resources[0].urlload.time;
  };

}