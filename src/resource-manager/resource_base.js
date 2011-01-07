window.cls = window.cls || {};


cls.ResourceDetailBase = function()
{
  this.resourcedata = null;
  this.container = null;
  this.drawer = null;

  this.createView = function(container)
  {
    container.clearAndRender(this.drawer.render());
    if (!this.resourcedata)
    {
      var resptype = cls.ResourceUtil.mime_to_content_mode(this.resource.mime);
      this.service.fetch_resource_data(this.on_resource_data.bind(this),
                                       this.resource.id,
                                       resptype);
      // fixme: show progress thingy
    }
    else
    {
      var tpl = this.render_type_details(container, this.resource, this.resourcedata);
      container.render(tpl);
    }
  }

  this.render_type_details = function(container, resource, resourcedata)
  {
    return templates.resource_contents(resource, resourcedata)
  }

  this.on_resource_data = function(type, data)
  {
    const CONTENT = 5, TEXTCONTENT = 3;
    this.resourcedata = data[CONTENT][TEXTCONTENT];
    this.update();
  }

  this.init = function(res, service)
  {
    this.service = service;
    this.resource = res;
    this.resourcedata = null;
    this.filename = cls.ResourceUtil.url_filename(res.url) || "<no name>";
    this.drawer = new MetadataDrawer(res);
    this.drawer.expanded = true;
    cls.ResourceDetailBase.prototype.init.call(this, this.filename);
  }
}
cls.ResourceDetailBase.prototype = new TempView();

cls.GenericResourceDetail = function(res, service)
{
  this.init(res, service);
}
cls.GenericResourceDetail.prototype = new cls.ResourceDetailBase();


window.templates = window.templates || {};


window.templates.font_resource = function(resource, data)
{
  return [
    templates.font_style(resource, data),
    ["h2", "font name"],
    ["div", "asdf qwr sdgh sdfgs",
     "style", "font-family: fontresource-" + resource.id]
  ]
}

window.templates.font_style = function(resource, data)
{
  var rule = [
    "@font-face {",
      'font-family: "fontresource-' + resource.id + '";',
      "src: url(" + data + ");",
    "}"
  ].join("\n\n");
  return ["style", rule];
};

window.templates.resource_contents = function(resource, data)
{
  var type = cls.ResourceUtil.mime_to_type(resource.mime);
  var tpl = null;

  switch (type) {
  case "image":
    tpl = ["img", "src", data];
    break
  case "script":
  case "css":
  case "markup":
    tpl = ["code", ["pre", data]];
    break;
  default:
    tpl = ["strong", "Unknown type"];
    break;
  }

  return ["div",
          ["div",
           tpl
          ],
          "class", "padding resource-data-wrapper " + type
         ];
}
