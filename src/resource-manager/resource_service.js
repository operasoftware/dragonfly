

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
  this._seen_doc_ids = [];
  this._document_contexts = {}; // mapping document id -> list of requests
  this._current_document = {};

  this._on_urlload_bound = function(msg)
  {
    var data = new cls.ResourceManager["1.0"].UrlLoad(msg);

    if (this._seen_doc_ids.indexOf(data.documentID) == -1 ) // not seen id before!
    {
      this._seen_doc_ids.unshift(data.documentID);
      this._current_document = {
        id: data.documentID,
        topresource: data.resourceID,
        resourcelist: [],
        resourcemap: {}
      };
    }

    // at this point, _current_document and seen list is up to date.

    if (data.documentID != this._current_document.id)
    {
      opera.postError("this shouldn't happen. Old documentID encountered");
      return;
    }

    this._current_document.resourcelist.push(data.resourceID);
    this._current_document.resourcemap[data.resourceID] = {urlload: data};

    //opera.postError(JSON.stringify(data));

  }.bind(this);

  this._on_request_bound = function(msg)
  {
    var data = new cls.ResourceManager["1.0"].Request(msg);
    var resource = this._current_document.resourcemap[data.resourceID];
    if (resource) {
      resource.request = data;
    }

  }.bind(this);

  this._on_requestheader_bound = function(msg)
  {
    var data = new cls.ResourceManager["1.0"].RequestHeader(msg);
    var resource = this._current_document.resourcemap[data.resourceID];
    if (resource) {
      resource.requestheader = data;
    }
  }.bind(this);

  this._on_requestfinished_bound = function(msg)
  {
    var data = new cls.ResourceManager["1.0"].RequestFinished(msg);
    var resource = this._current_document.resourcemap[data.resourceID];
    if (resource) {
      resource.requestfinished = data;
    }
  }.bind(this);

  this._on_response_bound = function(msg)
  {
    var data = new cls.ResourceManager["1.0"].Response(msg);
    var resource = this._current_document.resourcemap[data.resourceID];
    if (resource) {
      resource.response = data;
    }
  }.bind(this);

  this._on_responseheader_bound = function(msg)
  {
    var data = new cls.ResourceManager["1.0"].ResponseHeader(msg);
    var resource = this._current_document.resourcemap[data.resourceID];
    if (resource) {
      resource.responseheader = data;
    }
  }.bind(this);

  this._on_responsefinished_bound = function(msg)
  {
    var data = new cls.ResourceManager["1.0"].ResponseFinished(msg);
    var resource = this._current_document.resourcemap[data.resourceID];
    if (resource) {
      resource.responsefinished = data;
    }
  }.bind(this);

  this._on_urlfinished_bound = function(msg)
  {
    var data = new cls.ResourceManager["1.0"].UrlFinished(msg);
    var resource = this._current_document.resourcemap[data.resourceID];
    if (resource) {
      resource.urlfinished = data;
    }
    opera.postError(JSON.stringify(this._current_document, null, 2));
  }.bind(this);

  this.init = function()
  {
    this._service = window.services['resource-manager'];
    this._service.addListener("urlload", this._on_urlload_bound);
    this._service.addListener("request", this._on_request_bound);
    this._service.addListener("requestheader", this._on_requestheader_bound);
    this._service.addListener("requestfinished", this._on_requestfinished_bound);
    this._service.addListener("response", this._on_response_bound);
    this._service.addListener("responseheader", this._on_responseheader_bound);
    this._service.addListener("responsefinished", this._on_responsefinished_bound);
    this._service.addListener("urlfinished", this._on_urlfinished_bound);

//    this._service.addListener("urlload", this._on_urlload_bound);

  };

  this.get_current_document = function()
  {
    return this._current_document;
  };

  this.init();
};

