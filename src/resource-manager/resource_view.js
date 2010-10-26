window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.ResourceManagerView = function(id, name, container_class, html, default_handler) {
  this._service = new cls.ResourceManagerService(this, this._data);
  this._container = null;

  this.ondestroy = function()
  {
    this._container = null;
  };

  this.createView = function(container)
  {
    this._container = container;
    this._render_main_view(container);
    return;
    container.clearAndRender(["textarea", JSON.stringify(this._service.get_current_document(), null, 2),
                              "style", "width: 90%; height: 90%"]);
  };

  this._render_main_view = function(container)
  {
    var width = container.clientWidth;
    var document = this._service.get_current_document();
    if (document)
    {
      container.clearAndRender(templates.resource_main(document, width));
    }
    else
    {
      container.innerHTML = "<div class='padding'><h1>No document loaded</h1></div>";
    }
  };

  this._handle_resource_select_bound = function(evt, target)
  {
    var resource = this._service.get_resource_for_id(target.getAttribute("resource-id"));
    this._container.clearAndRender(templates.resource_details(resource));
  }.bind(this);

  var eh = window.eventHandlers;
  eh.click["resource-select-resource"] = this._handle_resource_select_bound;


  this.init(id, name, container_class, html, default_handler);
};
cls.ResourceManagerView.prototype = ViewBase;


cls.ResourceManagerView.create_ui_widgets = function()
{

};
