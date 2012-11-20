"use strict";

window.cls || (window.cls = {});

/**
 * @constructor
 * @extends ViewBase
 */
cls.ResourceTreeView = function(id, name, container_class, html, default_handler, resource_inspector)
{
  //	const
  var THROTTLE_DELAY = 250;
  var GROUP_ORDER = [
    {"type": "markup", "ui_string": ui_strings.S_HTTP_LABEL_FILTER_MARKUP},
    {"type": "css", "ui_string": ui_strings.S_HTTP_LABEL_FILTER_STYLESHEETS},
    {"type": "script", "ui_string": ui_strings.S_HTTP_LABEL_FILTER_SCRIPTS},
    {"type": "image", "ui_string": ui_strings.S_HTTP_LABEL_FILTER_IMAGES},
    {"type": "font", "ui_string": ui_strings.S_HTTP_LABEL_FILTER_FONTS},
    {"type": "other", "ui_string": ui_strings.S_HTTP_LABEL_FILTER_OTHER}
  ];

  this._next_render_time = 0;
  this._resource_inspector = resource_inspector;
  this.required_services = ["resource-manager", "document-manager"];

  this.get_group_order = function()
  {
    return GROUP_ORDER;
  };

  this.instant_update = function()
  {
    // Reset the _next_render_time to force an immediate render
    this._next_render_time = 0;
    this.update();
  };

  this.update_bound = this.update.bind(this);

  this.createView = function(container)
  {
    var now = Date.now();
    if (now >= this._next_render_time)
    {
      if (this._bounced_update)
        this._bounced_update = clearTimeout(this._bounced_update);

      this._render_view(container);
      this._next_render_time = now + THROTTLE_DELAY;
    }
    else if (!this._bounced_update)
      this._bounced_update = setTimeout(this.update_bound, THROTTLE_DELAY);
	};

  this._render_view = function(container)
  {
    var tpl;
    var ctx = this._resource_inspector.get_resource_context();
    var target = container.firstElementChild;

    if (ctx)
    {
      ctx.search_term = this.search_term || "";
      tpl = templates.resource_tree.update(ctx);
    }
    else
    {
      tpl = (
        ["div",
         ["span",
          "class", "container-button ui-button reload-window",
          "handler", "reload-window",
          "tabindex", "1"],
         ["p", ui_strings.S_RESOURCE_CLICK_BUTTON_TO_FETCH_RESOURCES],
         "class", "info-box"
        ]
      );
    }

    //  Exit if the template has not changed since last time ( using its JSON representation as hash )
    var tpl_JSON = JSON.stringify(tpl);
    if (tpl_JSON == this.tpl_JSON)
      return;

    this.tpl_JSON = tpl_JSON;

    var scroll_top = target ? target.scrollTop : 0;
    var scroll_left = target ? target.scrollLeft : 0;

    container.clearAndRender(tpl);

    target = container.firstElementChild;
    if (target)
    {
      target.scrollTop = scroll_top;
      target.scrollLeft = scroll_left;
    }
  };

  this.ondestroy = function(container)
  {
    this.tpl_JSON = null;
  };

  this.create_disabled_view = function(container)
  {
    container.clearAndRender(window.templates.disabled_view());
  };

  this._init = function()
  {
    this.id = id;

    var messages = window.messages;
    messages.add_listener("debug-context-selected", this.update_bound);

    var doc_service = window.services["document-manager"];
    doc_service.add_listener("abouttoloaddocument", this.update_bound);
    doc_service.add_listener("documentloaded", this.update_bound);

    ActionHandlerInterface.apply(this);
    this._handlers = {
      "select-next-entry": this._resource_inspector.highlight_next_resource_bound,
      "select-previous-entry": this._resource_inspector.highlight_previous_resource_bound
    };
    ActionBroker.get_instance().register_handler(this);

    this.init(id, name, container_class, html, default_handler);
  };

  this._init(id, name, container_class, html, default_handler);
};

cls.ResourceTreeView.create_ui_widgets = function()
{
  new ToolbarConfig(
  {
    view: "resource_tree_view",
    groups:
    [
      {
        type: UI.TYPE_INPUT,
        items:
        [
          {
            handler: "resource-tree-text-search",
            shortcuts: "resource-tree-text-search",
            title: ui_strings.S_SEARCH_INPUT_TOOLTIP,
            label: ui_strings.S_INPUT_DEFAULT_TEXT_FILTER,
            type: "filter"
          }
        ]
      }
    ]
  });

  var view = window.views.resource_tree_view;
  var text_search = window.views.resource_tree_view.text_search = new TextSearch();

  text_search.add_listener("onbeforesearch", (function(msg)
  {
    view.last_view_event = "onbeforesearch";
    view.search_term = msg.search_term;
    view.instant_update();
  }).bind(text_search));

  window.event_handlers.input["resource-tree-text-search"] = function(event, target)
  {
    text_search.searchDelayed(target.value);
  };

  ActionBroker.get_instance().get_global_handler().register_shortcut_listener(
    "resource-tree-text-search",
    cls.Helpers.shortcut_search_cb.bind(text_search)
  );

  var on_view_created = function(msg)
  {
    if (msg.id == "resource_tree_view" && msg.container)
    {
      var scroll_container = msg.container.querySelector(".resource-tree");
      if (scroll_container)
      {
        text_search.setContainer(scroll_container);
        text_search.set_query_selector(".resource-tree-resource-label");

        if (view.last_view_event != "onbeforesearch")
          text_search.update();
      }
      view.last_view_event = "view-created";
    }
  };

  var on_view_destroyed = function(msg)
  {
    if (msg.id == "resource_tree_view")
    {
      text_search.cleanup();
      window.views.resource_tree_view.search_term = "";
    }
  };

  window.messages.add_listener("view-created", on_view_created);
  window.messages.add_listener("view-destroyed", on_view_destroyed);
};

cls.ResourceTreeView.prototype = ViewBase;
