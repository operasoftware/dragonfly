window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.ResourceManagerView = function(id, name, container_class, html, default_handler) {
  this._service = new cls.ResourceManagerService(this, this._data);
  opera.postError("got constructorized " + id + " " + name);
  this.ondestroy = function()
  {

  };

  this.createView = function(container)
  {
    container.clearAndRender(["textarea", JSON.stringify(this._service.get_current_document(), null, 2),
                              "style", "width: 90%; height: 90%"]);
  };

  this.init(id, name, container_class, html, default_handler);
};
cls.ResourceManagerView.prototype = ViewBase;


cls.ResourceManagerView.create_ui_widgets = function()
{

};
