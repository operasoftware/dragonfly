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

  const HIGHLIGHTED_LINE_CLASSNAME = 'highlighted-line';
  const RESOURCE_DETAIL_CONTAINER_CLASSNAME = 'resource-detail-container'
  const TEXT = document.TEXT_NODE;
  const ELE  = document.ELEMENT_NODE;
  this._span = document.createElement('span');
  this._span.textContent = ' ';
  this._line_count = 0;
  this._line_found = false;
  this._target_line = 0;
  this._root_ele = null;
  this._tops = [];
  this.required_services = ["resource-manager", "document-manager"];

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
        var value = child.nodeValue;
        for (var pos = 0, len = value.length; pos < len; pos++)
        {
          var c = value.charAt(pos);
          // Linefeed recognition will not support Acorn BBC spooled text output
          if ((c == CR ) || (c == LF))
          {
            this._line_count++;
            if (this._line_count == this._target_line)
            {
              var target_pos = child.splitText(pos);
              child.parentNode.insertBefore(this._span, target_pos);
              this._tops.push(this._span.getBoundingClientRect().top);
              child.parentNode.removeChild(this._span);
              child.parentNode.normalize();
              if (this._tops.length < 2)
              {
                this._target_line += 1;
              }
              else
              {
                var scroll_container = ele;
                var container_top = scroll_container.getBoundingClientRect().top;
                var delta = this._tops[1] - this._tops[0];
                var scroll_top = scroll_container.scrollTop;
                ele.addClass(HIGHLIGHTED_LINE_CLASSNAME);
                ele.style.cssText =
                  "background-size: 100% " + delta + "px;" +
                  "background-position: 0 " +
                    (this._tops[0] - container_top + scroll_top) + "px;";

                var scroll_position = scroll_top + this._tops[0] - container_top;
                if (scroll_position <= this._root_ele.parentNode.clientHeight)
                {
                  scroll_position-=64;
                }
                this._root_ele.scrollTop = scroll_position;
                this._line_found = true;
                return;
              }
            }
            if ((c == CR) && (value.charAt(pos+1) == LF))
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
    this._target_line = 0;
    this._tops = [];
    var _ele = container.querySelectorAll('.'+HIGHLIGHTED_LINE_CLASSNAME)[0];
    if (_ele)
    {
      _ele.removeClass(HIGHLIGHTED_LINE_CLASSNAME)
    }
  }

  this.go_to_line = function(container, data)
  {

    if (!data || !(data.lines && data.lines[0])) return;
    this._root_ele = container.getElementsByClassName(RESOURCE_DETAIL_CONTAINER_CLASSNAME)[0];
    if (this._root_ele)
    {
      this.clear_line_numbers(this._root_ele)
      this._target_line = parseInt(data.lines[0]);
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

  this.create_disabled_view = function(container)
  {
    container.clearAndRender(window.templates.disabled_view());
  };

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
    this.filename = cls.ResourceUtil.url_filename(res.url) || ui_strings.S_RESOURCE_ALL_TABLE_NO_FILENAME;
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
    return ["div",
            ["h1", "Don't know what this resource is"],
            "class", "resource-detail-container"];
  }

  this.init(res, service);
}
cls.GenericResourceDetail.prototype = new cls.ResourceDetailBase();


cls.ResourceDetailSearch = function(res, service)
{
  this.init(res, service);
};

cls.ResourceDetailSearchPrototype = function()
{

  var init_super = this.init;
  var create_view_super = this.createView;
  var ondestroy_super = this.ondestroy;

  const SEARCHFIELD = 0;
  const MOVE_HIGHLIGHT_UP = 1;
  const MOVE_HIGHLIGHT_DOWN = 2;

  this.createView = function(container)
  {
    create_view_super.call(this, container);
    var search_cell = container.getElementsByClassName('searchcell')[0];
    search_cell.clearAndRender(window.templates.advanced_search_field(this))
    var info_ele = search_cell.getElementsByClassName('search-info-badge')[0];
    var scroll_container = container.getElementsByClassName('resource-detail-container')[0];
    this._text_search.set_info_element(info_ele);
    if (scroll_container)
    {
      var query = '[handler="' + this.controls[SEARCHFIELD].handler + '"]';
      this._search_input = search_cell.querySelector(query);
      this._text_search.setContainer(scroll_container);
      this._text_search.setFormInput(this._search_input);
    }
  };

  this.ondestroy = function()
  {
    ondestroy_super.call(this);
    this._text_search.cleanup();
  };

  this._oninput = function(event, target)
  {
    this._text_search.searchDelayed(target.value);
  };

  this.focus_search_field = function()
  {
    if (this._search_input)
    {
      this._search_input.focus();
    }
  };

  this.init = function(res, service)
  {
    init_super.call(this, res, service);
    this._text_search = new DetailResourceSearch(2); // minimal search term length
    this.controls =
    [
      {
        handler: this.id + '-text-search',
        class: 'panel-search-input-container',
        shortcuts: this.id + '-text-search',
        title: ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH
      },
      {
        handler: this.id + '-move-highlight-up',
        type: "search_control",
        class: "search-move-highlight-up",
        title: ui_strings.S_LABEL_MOVE_HIGHLIGHT_UP
      },
      {
        handler: this.id + '-move-highlight-down',
        type: "search_control",
        class: "search-move-highlight-down",
        title: ui_strings.S_LABEL_MOVE_HIGHLIGHT_DOWN
      },
    ];

    var broker = ActionBroker.get_instance();
    var global_handler = broker.get_global_handler();

    ActionHandlerInterface.apply(this);
    this.shared_shortcuts = "search";
    this._handlers['highlight-next-match'] = function(event, target)
    {
      this._text_search.highlight_next();
      return false;
    }.bind(this);
    this._handlers['highlight-previous-match'] = function(event, target)
    {
      this._text_search.highlight_previous();
      return false;
    }.bind(this);
    broker.register_handler(this);
    eventHandlers.click[this.controls[MOVE_HIGHLIGHT_DOWN].handler] =
      this._handlers['highlight-next-match'];
    eventHandlers.click[this.controls[MOVE_HIGHLIGHT_UP].handler] =
      this._handlers['highlight-previous-match'];
    eventHandlers.input[this.controls[SEARCHFIELD].handler] =
      this._oninput.bind(this);
    global_handler.register_search_panel(this.id);
  };

};

cls.ResourceDetailSearchPrototype.prototype = new cls.ResourceDetailBase();
cls.ResourceDetailSearch.prototype = new cls.ResourceDetailSearchPrototype();

// any textual resource, like html, js and css
cls.TextResourceDetail = function(res, service)
{
  this.render_type_details = function(container, resource, resourcedata)
  {
    return window.templates.text_resource_view(resource, resourcedata);
  }

  this.init(res, service);
}
cls.TextResourceDetail.prototype = cls.ResourceDetailSearch.prototype;

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

cls.JSResourceDetail.prototype = cls.ResourceDetailSearch.prototype;


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
cls.MarkupResourceDetail.prototype = cls.ResourceDetailSearch.prototype;

cls.CSSResourceDetail = function(res, service)
{
  this.render_type_details = function(container, resource, resourcedata)
  {
    return window.templates.css_resource_view(resource, resourcedata);
  }

  this.init(res, service);
}
cls.CSSResourceDetail.prototype = cls.ResourceDetailSearch.prototype;



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
