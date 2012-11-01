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
    ui_strings.S_HTTP_LABEL_FILTER_MARKUP,
    ui_strings.S_HTTP_LABEL_FILTER_STYLESHEETS,
    ui_strings.S_HTTP_LABEL_FILTER_SCRIPTS,
    ui_strings.S_HTTP_LABEL_FILTER_IMAGES,
    ui_strings.S_HTTP_LABEL_FILTER_FONTS,
    ui_strings.S_HTTP_LABEL_FILTER_OTHER
  ];

  this._resource_inspector = resource_inspector;
  this.required_services = ["resource-manager", "document-manager"];

  this.get_group_order = function()
  {
    return GROUP_ORDER;
  };

  // throttle the update
  this.update = this.update.bind(this).throttle(THROTTLE_DELAY);

  this.createView = function(container)
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
    delete this.tpl_JSON;
  };

  this.create_disabled_view = function(container)
  {
    container.clearAndRender(window.templates.disabled_view());
  };

  this._init = function()
  {
    this.id = id;

    var messages = window.messages;
    messages.add_listener("debug-context-selected", this.update);

    var doc_service = window.services["document-manager"];
    doc_service.add_listener("abouttoloaddocument", this.update);
    doc_service.add_listener("documentloaded", this.update);

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

  var text_search = window.views.resource_tree_view.text_search = new TextSearch();

  text_search.add_listener("onbeforesearch", (function(msg)
  {
    var view = window.views.resource_tree_view;
    if (view.search_term != msg.search_term)
    {
      view.search_term = msg.search_term;
      view.update();
    }
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
    if (msg.id == "resource_tree_view")
    {
      if (msg.container)
      {
        text_search.setContainer(msg.container);
        text_search.set_query_selector(".resource-tree-resource-label");
        text_search.setFormInput(
          views.resource_tree_view.getToolbarControl(msg.container, "resource-tree-text-search")
        );
        window.views.resource_tree_view.search_term = "";
      }
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
}

cls.ResourceTreeView.prototype = ViewBase;
