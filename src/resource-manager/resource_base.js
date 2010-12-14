window.cls = window.cls || {};


cls.GenericResourceDetail = function(res, service)
{
  this.resource = res;
  this.filename = cls.ResourceUtil.url_filename(res.urlload.url) || "<no name>";
  this.drawer = new MetadataDrawer(res);
  this.drawer.expanded = true;
  this.resourcedata = null;

  this.createView = function(container)
  {
    this.container = container;
    container.clearAndRender(this.drawer.render());
    if (!this.resourcedata)
    {
      var resptype = cls.ResourceUtil.mime_to_content_mode(this.resource.urlfinished.mimeType);
      service.fetch_resource_data(this.on_resource_data_bound,
                                  this.resource.urlload.resourceID,
                                  resptype);
    }
    else
    {
      this.container.render(templates.resource_contents(this.resource, this.resourcedata));
    }
  };

  this.on_resource_data_bound = function(type, data)
  {
    const CONTENT = 5, TEXTCONTENT = 3;
    this.resourcedata = data[CONTENT][TEXTCONTENT];
    this.update();
  }.bind(this);

  this.init(this.filename);
};

window.templates = window.templates || {};

window.templates.resource_contents = function(resource, data)
{
  var type = cls.ResourceUtil.mime_to_type(resource.urlfinished.mimeType);
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

cls.GenericResourceDetail.prototype = new TempView();
