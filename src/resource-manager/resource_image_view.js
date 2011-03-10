window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.ResourceManagerImageView = function(id, name, container_class, html, default_handler) {
  this._service = new cls.ResourceManagerService(this, this._data);

  this.ondestroy = function()
  {

  };

  this.createView = function(container)
  {
    this._render_main_view(container);
  };

  this._render_main_view = function(container)
  {
    var images = this._service.get_resources_for_type("image");
    container.clearAndRender(templates.image_list(images));
  };

  this.init(id, name, container_class, html, default_handler);
};
cls.ResourceManagerImageView.prototype = ViewBase;


window.templates = window.templates || {};

window.templates.image_list = function(images)
{
  var t = ["div", ["div", ["h1", "Images referenced in document"], ["div", images.map(templates.image_entry)],
                  "class", "resource-image-view"
                 ],
          "class", "padding"
         ];
  return t;
};

window.templates.image_entry = function(image)
{
  return ["div", ["img", "src", image.urlload.url, "style", "width:100px"],
                 ["a", image.urlload.url, "href", image.urlload.url],
          "class", "resource-image-box"
         ];

};
