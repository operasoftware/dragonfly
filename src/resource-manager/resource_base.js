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

  const TEXT = document.TEXT_NODE;
  const ELE  = document.ELEMENT_NODE;
  this._span = document.createElement('span');
  this._span.textContent = ' ';
  this._line_count = 0;
  this._line_found = false;
  this._line = 0;
  this._root_ele = null;
  this._tops = [];

  this._traverse_ele = function(ele)
  {
    const CR = "\r";
    const LF = "\n";
    var child = ele.firstChild;
    while (child && !this._line_found)
    {
      if (child.nodeType == ELE)
      {
        this._traverse_ele(child);
      }
      else if (child.nodeType == TEXT)
      {
        var pos;
        for (pos = 0; pos < child.nodeValue.length; pos++)
        {
          var c = child.nodeValue.charAt(pos);
          // Linefeed recognition will not support Acorn BBC spooled text output 
          if ((c == CR )|| (c == LF))
          {
            this._line_count++;
            if (this._line_count == this._line)
            {
              var target_pos = child.splitText(pos);
              child.parentNode.insertBefore(this._span, target_pos);
              this._tops.push(this._span.getBoundingClientRect().top);
              child.parentNode.removeChild(this._span);
              if (this._tops.length < 2)
              {
                this._line+=2;
              }
              else
              {
                var scroll_container = ele;
                var container_top = scroll_container.getBoundingClientRect().top;
                var delta = this._tops[1] - this._tops[0];
                var scroll_top = scroll_container.scrollTop;
                ele.addClass('highlighted-line');
                ele.style.cssText = 
                  "background-size: 100% " + delta + "px;" +
                  "background-position: 0 " + 
                    (this._tops[0] - container_top + scroll_top) + "px;";
                
                var _to = scroll_top + this._tops[0] - container_top;
                if (_to <= this._root_ele.parentNode.clientHeight) _to = _to-64;
                this._root_ele.scrollTop = _to;

                child.parentNode.normalize();
                this._line_found = true;
                return;
              }
            }
            if ((c == CR) && (child.nodeValue.charAt(pos+1) == LF))
            {
              pos++;
            }
          }
        }
      }
      child = child && child.nextSibling;
    }

  }
  this.clear_line_numbers = function(container)
  {
    // reset all properties
    this._line_count = 0;
    this._line_found = false;
    this._line = 0;
    this._tops = [];
    var _ele = container.querySelectorAll('.highlighted-line')[0];
    if (_ele)
    {
      _ele.removeClass('highlighted-line')
    }
  }

  var x = 0

  this.go_to_line = function(container, data)
  {

    if (!data || !data.lines[0]) return;
    this._root_ele = container.getElementsByClassName('resource-detail-container')[0];
    this.clear_line_numbers(this._root_ele)
    this._line = parseInt(data.lines[0]);
    if (this._root_ele)
    {
      this._current_line = 1;
      this._traverse_ele(this._root_ele);
    }

  }

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
    if (this.resourcedata === null)
    {
      var resptype = cls.ResourceUtil.mime_to_content_mode(this.resource.mime);
      this.service.fetch_resource_data(this.on_resource_data.bind(this),
                                       this.resource.id, resptype);
    }
    else
    {
      var tpl = this.render_type_details(container, this.resource, this.resourcedata);
      if (tpl)
      {
        container.render(tpl);
        cls.ResourceDetailBase.sync_dimensions(container);
        this.go_to_line(container, this.data);
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
    this.resourcedata = data[CONTENT] ? data[CONTENT][TEXTCONTENT] : "";

    this.update();
  }

  this.init = function(res, service)
  {
    this.service = service;
    this.resource = res;
    this.resourcedata = null;
    this.filename = cls.ResourceUtil.url_filename(res.url) || "<no name>";
    this.drawer = new MetadataDrawer(res);
    this.drawer.expanded = false;
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

cls.JSResourceDetail = function(res, service, options)
{
  options = options || {};
  this.line = options.line;

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

cls.CSSResourceDetail = function(res, service)
{
  this.render_type_details = function(container, resource, resourcedata)
  {
    return window.templates.css_resource_view(resource, resourcedata);
  }

  this.init(res, service);
}
cls.CSSResourceDetail.prototype = new cls.ResourceDetailBase();



window.templates = window.templates || {};


window.templates.text_resource_view = function(resource, resourcedata)
{
  return [
    ['div',
        ["code", ["pre", resourcedata]],
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
  return (
  ['div',
    source,
    ['div', lines.join('\n'), 'class', 'resource-line-numbers', 'unselectable', 'on'],
    'class', 'resource-detail-container mono line-numbered-resource js-resource-content'
  ]);
}

window.templates.markup_resource_view = function(resource, resourcedata)
{
  var line_count = 1;
  var lines = [line_count++];
  var source = this.highlight_markup(resourcedata, function()
  {
    lines.push(line_count++);
  });
  return (
    ['div',
      source,
      ['div', lines.join('\n'), 'class', 'resource-line-numbers', 'unselectable', 'on'],
      'class', 'resource-detail-container mono line-numbered-resource markup-resource-content'
    ])
}
window.templates.css_resource_view = function(resource, resourcedata)
{
  var line_count = 1;
  var lines = [line_count++];

  var source = this.highlight_css(resourcedata, function()
  {
    lines.push(line_count++);
  });
  return (
    ['div',
      source,
      ['div', lines.join('\n'), 'class', 'resource-line-numbers', 'unselectable', 'on'],
      'class', 'resource-detail-container mono line-numbered-resource css-resource-content'
    ])
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
    ["div", "The quick brown fox jumped over the lazy dog", ["br"], "1234567890",
     "style", "font-family: fontresource-" + resource.id,
     "class", "font-preview",
     "contenteditable", "true"],
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
