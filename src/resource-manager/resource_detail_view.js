"use strict";

window.cls || (window.cls = {});

/**
 * @constructor
 * @extends ViewBase
 */
cls.ResourceDetailView = function(id, name, container_class, html, default_handler, resource_inspector)
{
  this.createView = function(container)
  {
    if (this.resource && this.resource.data)
      container.clearAndRender(templates.resource_detail.formatting_data(this.resource));

    container.clearAndRender(templates.resource_detail.update(this.resource));
    if (this.data)
      this.go_to_line(container, this.data);

    this.text_search.update_search();
  };

  this.create_disabled_view = function(container)
  {
    container.clearAndRender(window.templates.disabled_view());
  };

  this.TEXT_RESOURCE_DETAIL_CONTAINER_SELECTOR = ["markup", "css", "script", "text"].map(function(v) {
    return ".resource-detail-" + v + "-container";
  }).join(",");
  var HIGHLIGHTED_LINE_CLASSNAME = "highlighted-line";
  var TEXT = document.TEXT_NODE;
  var ELE = document.ELEMENT_NODE;
  var HIGHLIGHT_CONTEXT_SIZE = 8;
  var CR = "\r";
  var LF = "\n";
  this._span = document.createElement("span");
  this._span.textContent = " ";
  this._line_count = 0;
  this._line_found = false;
  this._target_line = 0;
  this._root_ele = null;
  this._tops = [];

  this._highlight_line = function(ele)
  {
    var child = ele.firstChild;
    while (child && !this._line_found)
    {
      if (child.nodeType == ELE)
      {
        this._highlight_line(child);
      }
      else if (child.nodeType == TEXT)
      {
        var value = child.nodeValue;
        for (var pos = 0, len = value.length; pos < len; pos++)
        {
          var c = value.charAt(pos);
          if ((c == CR) || (c == LF))
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
                  scroll_position -= HIGHLIGHT_CONTEXT_SIZE * window.defaults["js-source-line-height"];

                this._root_ele.scrollTop = scroll_position;
                this._line_found = true;
                return;
              }
            }

            if ((c == CR) && (value.charAt(pos + 1) == LF))
              pos++;
          }
        }
      }
      child = child && child.nextSibling;
    }
  };

  this.clear_line_highlight = function(container)
  {
    // reset all properties
    this._line_count = 0;
    this._line_found = false;
    this._target_line = 0;
    this._tops = [];
    var ele = container.querySelector("." + HIGHLIGHTED_LINE_CLASSNAME);
    if (ele)
      ele.removeClass(HIGHLIGHTED_LINE_CLASSNAME);
  };

  this.go_to_line = function(container, data)
  {
    if (!data || data.line == null)
      return;

    this._root_ele = container.querySelector(this.TEXT_RESOURCE_DETAIL_CONTAINER_SELECTOR);
    if (this._root_ele)
    {
      this.clear_line_highlight(this._root_ele);
      this._target_line = data.line;
      this._highlight_line(this._root_ele);
    }
  };

  this._show_resource = function(resource, data)
  {
    if (!resource || !resource.data)
      return false;

    this.data = data;
    this.resource = resource;
    this._resource_inspector.highlight_resource(resource.uid);
    this.update();

    return true;
  };

  this._show_resource_by_instance = function(resource, data)
  {
    if (!this._show_resource(resource, data))
      this._show_resource_by_key(resource.uid, data);
  };

  this._show_resource_by_key = function(key, data)
  {
    var inspector = this._resource_inspector;
    var resource = inspector.get_resource(key) || inspector.get_resource_by_url(key);

    var url = resource ? resource.url : key;

    if (!resource || !this._show_resource(resource, data))
      inspector.request_resource_data(url, this.show_resource.bind(this), data, resource);
  };

  /*
   *  The "key" can be the UID of or an instance of cls.ResourceInfo or a URL
   *
   *  This flexibility helps other services to display a resource regardless of its "form".
   */
  this.show_resource = function(key, data)
  {
    if (key instanceof cls.ResourceInfo)
      this._show_resource_by_instance(key, data);
    else
      this._show_resource_by_key(key, data);

    window.UI.instance.show_view(this.id);
  };

  this._on_debug_context_selected_bound = function()
  {
    this.resource = null;
    this.update();
  }.bind(this);

  this._init = function(id, name, container_class, html, default_handler, resource_inspector)
  {
    this.id = id;
    this._resource_inspector = resource_inspector;

    var messages = window.messages;
    messages.add_listener("debug-context-selected", this._on_debug_context_selected_bound);

    window.event_handlers.input["resource-detail-font"] = function(event, target)
    {
      window.settings.resource_detail_view.set("sample_string", target.value);
    };

    this.init(id, name, container_class, html, default_handler);
  };

  this._init(id, name, container_class, html, default_handler, resource_inspector)
};

cls.ResourceDetailView.create_ui_widgets = function()
{
  new Settings(
    "resource_detail_view",
    {
      "sample_string": "The quick brown fox jumps over the lazy dog. 0123456789"
    }
  );

  new ToolbarConfig(
  {
    view: "resource_detail_view",
    groups:
    [
      {
        type: UI.TYPE_INPUT,
        items:
        [
          {
            handler: "resource-text-search",
            shortcuts: "resource-text-search",
            title: ui_strings.S_SEARCH_INPUT_TOOLTIP,
            label: ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH
          }
        ]
      }
    ]
  });

  var text_search = window.views.resource_detail_view.text_search = new TextSearch();

  window.event_handlers.input["resource-text-search"] = function(event, target)
  {
    text_search.searchDelayed(target.value);
  };

  ActionBroker.get_instance().get_global_handler().register_shortcut_listener(
    "resource-text-search",
    cls.Helpers.shortcut_search_cb.bind(text_search)
  );

  var on_view_created = function(msg)
  {
    if (msg.id === "resource_detail_view")
    {
      var view = window.views.resource_detail_view;
      var scroll_container = msg.container.querySelector(view.TEXT_RESOURCE_DETAIL_CONTAINER_SELECTOR);

      if (scroll_container)
      {
        text_search.setContainer(scroll_container);
        text_search.setFormInput(
          view.getToolbarControl(msg.container, "resource-text-search")
        );
      }
    }
  };

  var on_view_destroyed = function(msg)
  {
    if (msg.id == "resource_detail_view")
      text_search.cleanup();
  };

  window.messages.add_listener("view-created", on_view_created);
  window.messages.add_listener("view-destroyed", on_view_destroyed);
}

cls.ResourceDetailView.prototype = ViewBase;

