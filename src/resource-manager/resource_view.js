window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.ResourceManagerView = function(id, name, container_class, html, default_handler) {
  this._service = new cls.ResourceManagerService(this, this._data);

  this.ondestroy = function()
  {

  };

  this.createView = function(container)
  {
    this._render_main_view(container);
    return;
    container.clearAndRender(["textarea", JSON.stringify(this._service.get_current_document(), null, 2),
                              "style", "width: 90%; height: 90%"]);
  };

  this._render_main_view = function(container)
  {
    var document = this._service.get_current_document();
    //opera.postError(JSON.stringify(document))
    container.innerHTML = "<pre>" + JSON.stringify(document, null, "    ") + "</pre>";

    templates.resource_main(document);
    return
    container.clearAndRender(templates.resource_main(document));
  };

  this.init(id, name, container_class, html, default_handler);
};
cls.ResourceManagerView.prototype = ViewBase;


cls.ResourceManagerView.create_ui_widgets = function()
{

};
