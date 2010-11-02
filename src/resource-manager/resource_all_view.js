window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.ResourceManagerAllView = function(id, name, container_class, html, default_handler) {
  this._service = new cls.ResourceManagerService();
  this._sort_by = "name";
  this._show_fields = [];

  this.createView = function(container)
  {
    this._render_main_view(container);
  };

  this._render_main_view = function(container)
  {
    var ctx = this._service.get_request_context();
    container.clearAndRender(templates.all_resources(ctx));
  };

  this._handle_open_resource_bound = function(evt, target)
  {
    var rid = target.getAttribute("resource-id");
    var resource = this._service.get_resource_for_id(rid);
    opera.postError("Should show " + rid);
  }.bind(this);

  var eh = window.eventHandlers;
  eh.click["resources-all-open"] = this._handle_open_resource_bound

  this.init(id, name, container_class, html, default_handler);
};
cls.ResourceManagerAllView.prototype = ViewBase;
