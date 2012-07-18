window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.ResourceManagerFontView = function(id, name, container_class, html, default_handler) {
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
    var fonts = this._service.get_resources_for_type("font");
    fonts = fonts.concat(this._service.get_resources_for_mime("application/x-font-otf"));
    container.clearAndRender(templates.font_list(fonts));
  };

  this.init(id, name, container_class, html, default_handler);
};
cls.ResourceManagerFontView.prototype = ViewBase;


window.templates = window.templates || {};

window.templates.font_list = function(fonts)
{
  var t = ["div", ["h1", "External fonts referenced in document"], ["div", templates.font_style(fonts),
                      ["ul", fonts.map(templates.font_entry)],
                  "class", "resource-font-view"
                 ],
          "class", "padding"
         ];
  return t;
};

window.templates.font_entry = function(font)
{
  var sampletext = "The quick brown fox jumps over the lazy dog";
  var fonturl = font.urlload.url;
  return ["li", ["div", fonturl], ["div", sampletext, "style", "font-family: resource-" + font.urlload.resourceID]];
};

window.templates.font_style = function(fonts)
{
  // fixme: use resource service to grab datauri of the font?
  var rule = '@font-face {\
                font-family: "resource-%name";\
                src: url("%url");\
              }';

  var fun = function(e)
  {
    return rule.replace("%name", e.urlload.resourceID).replace("%url", e.urlload.url);
  };

  var styletext = fonts.map(fun).join("\n");

  return ["style", styletext];
};
