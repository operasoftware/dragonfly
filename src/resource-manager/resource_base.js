window.cls = window.cls || {};


/**
 * Base class for views that show details about a resource
 */
cls.ResourceDetailBase = function()
{
  this.resourcedata = null;
  this.container = null;
  this.drawer = null;
  this.title = null

  // interface:

  /**
   * Override this method in subclasses to to the type specific rendering.
   * The method is called from the main createView function. If it returns
   * something, that is treated as a template and inserted.
   * If it returns something falsy, then the assumption is that the method
   * has inserted the approprate content into the container itself.
   */
  this.render_type_details = function(container, resource, resourcedata) {}


  this.createView = function(container)
  {
    container.clearAndRender(this.drawer.render());
    if (!this.resourcedata)
    {
      var resptype = cls.ResourceUtil.mime_to_content_mode(this.resource.mime);
      this.service.fetch_resource_data(this.on_resource_data.bind(this),
                                       this.resource.id,
                                       resptype);
    }
    else
    {
      var tpl = this.render_type_details(container, this.resource, this.resourcedata);
      if (tpl)
      {
        container.render(tpl);
        cls.ResourceDetailBase.sync_dimensions(container);
      }
    }

  }

  this.render_type_details = function(container, resource, resourcedata)
  {
    return ["h1", "No resource details"];
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
    this.drawer = new MetadataDrawer(res, "Details for " + (res.type || "unknown type"));
    this.drawer.expanded = true;
    cls.ResourceDetailBase.prototype.init.call(this, this.filename);
  }
}
cls.ResourceDetailBase.prototype = new TempView();

cls.ResourceDetailBase.sync_dimensions = function(container)
{
    var metadata_drawer = container.getElementsByClassName('metadata-drawer')[0];
    var resource_details = container.getElementsByClassName('resource-detail-container')[0];
    if (metadata_drawer && resource_details)
    {
        resource_details.style.borderTopWidth = metadata_drawer.offsetHeight + 'px';
    }
}

cls.GenericResourceDetail = function(res, service)
{
  this.render_type_details = function(container, resource, resourcedata)
  {
    return ["h1", "Don't know what this resource is"];
  }

  this.init(res, service);
}
cls.GenericResourceDetail.prototype = new cls.ResourceDetailBase();


// any textual resource, like html, js and css
cls.TextResourceDetail = function(res, service)
{
  this.render_type_details = function(container, resource, resourcedata)
  {
    return window.templates.text_resource_view(resource, resourcedata);
  }

  this.init(res, service);
}
cls.TextResourceDetail.prototype = new cls.ResourceDetailBase();

cls.JSResourceDetail = function(res, service)
{
  this.render_type_details = function(container, resource, resourcedata)
  {
    return window.templates.js_resource_view(resource, resourcedata);
  }

  this.init(res, service);
}
cls.JSResourceDetail.prototype = new cls.ResourceDetailBase();


cls.ImageResourceDetail = function(res, service)
{
  this.render_type_details = function(container, resource, resourcedata)
  {
    return window.templates.image_resource_view(resource, resourcedata);
  }

  this.init(res, service);
}
cls.ImageResourceDetail.prototype = new cls.ResourceDetailBase();


cls.FontResourceDetail = function(res, service)
{
  this.render_type_details = function(container, resource, resourcedata)
  {
    return window.templates.font_resource_view(resource, resourcedata);
  }

  this.init(res, service);
}
cls.FontResourceDetail.prototype = new cls.ResourceDetailBase();

cls.MarkupResourceDetail = function(res, service)
{
  this.render_type_details = function(container, resource, resourcedata)
  {
    return window.templates.markup_resource_view(resource, resourcedata);
  }

  this.init(res, service);
}

cls.MarkupResourceDetail.prototype = new cls.ResourceDetailBase();



window.templates = window.templates || {};


window.templates.text_resource_view = function(resource, resourcedata)
{
  return [
    ['pre',
        ["code", resourcedata],
        'class', 'resource-detail-container'
    ]
  ]
}

window.templates.js_resource_view = function(resource, resourcedata)
{
  var line_count = 1;
  var lines = [line_count++];
  var source = this.highlight_js_source(resourcedata, function()
  {
    lines.push(line_count++);
  });
  return ['code',
    ['div',
      source,
      ['div', lines.join('\n'), 'class', 'resource-line-numbers', 'unselectable', 'on'],
      'class', 'js-resource'
    ],
    'class', 'resource-detail-container js-source js-resource-content'
  ]
}

window.templates.markup_resource_view = function(resource, resourcedata)
{
  var line_count = 1;
  var lines = [line_count++];
  var source = this.highlight_markup(resourcedata, function()
  {
    lines.push(line_count++);
  });
  return ['code',
    ['div',
      source,
      ['div', lines.join('\n'), 'class', 'resource-line-numbers', 'unselectable', 'on'],
      'class', 'markup-resource'
    ],
    'class', 'resource-detail-container markup-source markup-resource-content'
  ]
}

window.templates.image_resource_view = function(resource, resourcedata)
{
  return [
      ['div',
       ["img", "src", resourcedata,
        'class', 'resource-image'
       ],
       'class', 'resource-detail-container resource-image-container'
      ]
  ]
}


window.templates.font_resource_view = function(resource, data)
{
  return ['div',
    templates.font_style(resource, data),
    ["h1", "Font details view"],
    ["div", "The quick brown fox jumped over the lazy dog",
     "style", "font-family: fontresource-" + resource.id],
    'class', 'resource-detail-container'
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
