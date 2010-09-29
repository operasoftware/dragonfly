

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

  this._on_documentload_bound = function(msg)
  {
    var data = new cls.DocumentManager["1.0"].DocumentLoad(msg)

    if (data.parentDocumentID === undefined) // new document load
    {
      this._seen_doc_ids = [];
      this._current_document = {
        id: null,
        topresource: data.resourceID,
        resourcelist: [],
        resourcemap: {}
      };
    }
    else
    {

    }

  }.bind(this);


  this._on_urlload_bound = function(msg)
  {
    var data = new cls.ResourceManager["1.0"].UrlLoad(msg);

    this._current_document.resourcelist.push(data.resourceID);
    this._current_document.resourcemap[data.resourceID] = {urlload: data};

    //opera.postError(JSON.stringify(data));

  }.bind(this);

  this._on_request_bound = function(msg)
  {
    var data = new cls.ResourceManager["1.0"].Request(msg);
    var resource = this._current_document.resourcemap[data.resourceID];
    if (!resource) {
      opera.postError("No exist! " + JSON.stringify(data));
    }
    resource.request = data;

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
    //opera.postError(JSON.stringify(this._current_document, null, 2));
  }.bind(this);

  this.init = function()
  {
    /*
    this._res_service = window.services['resource-manager'];
    this._res_service.addListener("urlload", this._on_urlload_bound);
    this._res_service.addListener("request", this._on_request_bound);
    this._res_service.addListener("requestheader", this._on_requestheader_bound);
    this._res_service.addListener("requestfinished", this._on_requestfinished_bound);
    this._res_service.addListener("response", this._on_response_bound);
    this._res_service.addListener("responseheader", this._on_responseheader_bound);
    this._res_service.addListener("responsefinished", this._on_responsefinished_bound);
    this._res_service.addListener("urlfinished", this._on_urlfinished_bound);
*/
    this._doc_service = window.services['document-manager'];
    this._doc_service.addListener("documentload", this._on_documentload_bound);
  };

  this.get_current_document = function()
  {
    return this._current_document;
  };

  this.init();
};

