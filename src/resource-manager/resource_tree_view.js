window.cls || (window.cls = {});

/**
 * @constructor
 * @extends ViewBase
 */
cls.ResourceTreeView = function(id, name, container_class, html, default_handler, network_logger) {
  if (cls.ResourceTreeView.instance)
  {
    return cls.ResourceTreeView.instance;
  }
  cls.ResourceTreeView.instance = this;

  //	const
  const THROTTLE_DELAY = 500;

    // "private"
  this._service = new cls.ResourceManagerService(this, network_logger);
  this._loading = false;


  // public

  // throttle the update
  this.update = this.update.bind(this).throttle(THROTTLE_DELAY);

  this.createView = function(container)
  {
    var service = this._service;
    var ctx = this._service.get_resource_context();
    var scrollTop = container.firstElementChild?container.firstElementChild.scrollTop:0;

    if (ctx )//&& ctx.resourcesDict && Object.keys(ctx.resourcesDict).length)
    {
      container.clearAndRender( templates.resource_tree.update(ctx) );
    }
    else if (this._loading)
    {
      container.clearAndRender(
        ['div',
         ['p', ui_strings.S_RESOURCE_LOADING_PAGE],
         'class', 'info-box'
        ]
      );
    }
    else
    {
      container.clearAndRender(
        ['div',
         ['span',
          'class', 'container-button ui-button reload-window',
          'handler', 'reload-window',
          'tabindex', '1'],
         ['p', ui_strings.S_RESOURCE_CLICK_BUTTON_TO_FETCH_RESOURCES],
         'class', 'info-box'
        ]
      );
    }

    container.firstElementChild.scrollTop = scrollTop;
	};

  this.create_disabled_view = function(container)
  {
    container.clearAndRender(window.templates.disabled_view());
  };

  this._on_abouttoloaddocument_bound = function()
  {
    this._loading = true;
    this.update();
  }.bind(this);

  this._on_documentloaded_bound = function()
  {
    this._loading = false;
    this.update();
  }.bind(this);

  var doc_service = window.services['document-manager'];
  doc_service.addListener("abouttoloaddocument", this._on_abouttoloaddocument_bound);
  doc_service.addListener("documentloaded", this._on_documentloaded_bound);

  this.init(id, name, container_class, html, default_handler);
};

cls.ResourceTreeView.create_ui_widgets = function()
{
  new ToolbarConfig(
  {
    view:'resource_tree_view',
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
            label: ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH
          }
        ]
      }
    ]
  });

  var text_search = window.views.resource_detail_view.text_search = new TextSearch();

  window.eventHandlers.input["resource-tree-text-search"] = function(event, target)
  {
    text_search.searchDelayed(target.value);
  };

  ActionBroker.
    get_instance().
    get_global_handler().
      register_shortcut_listener
      (
        "resource-tree-text-search",
        cls.Helpers.shortcut_search_cb.bind(text_search)
      );

  var on_view_created = function(msg)
  {
    if (msg.id === "resource_tree_view")
    {
      var scroll_container = msg.container;
      if (scroll_container)
      {
        text_search.setContainer(scroll_container);
        text_search.set_query_selector('.resource-tree-resource-label');
        text_search.setFormInput(
          views.resource_tree_view.getToolbarControl(msg.container, "resource-tree-text-search")
        );
      }
    }
  }

  var on_view_destroyed = function(msg)
  {
    if (msg.id == "resource_tree_view")
      text_search.cleanup();
  }

  window.messages.addListener("view-created", on_view_created);
  window.messages.addListener("view-destroyed", on_view_destroyed);
}

cls.ResourceTreeView.prototype = ViewBase;
