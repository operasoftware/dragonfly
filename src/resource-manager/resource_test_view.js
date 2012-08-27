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

    if (ctx )//&& ctx.resourcesDict && Object.keys(ctx.resourcesDict).length)
    {
      container.clearAndRender( templates.resource_tree.update(ctx) );
    }
    else if (this._loading)
    {
      container.clearAndRender(
        ['div',
         ['p', "Loading page..."],
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



	this._type_class_map =
  {
    image: cls.ImageResourceDetail,
    font: cls.FontResourceDetail,
    script: cls.JSResourceDetail,
    markup: cls.MarkupResourceDetail,
    css: cls.CSSResourceDetail,
    text: cls.TextResourceDetail,
  };
	this._open_resource_views = {};

  this._open_resource_tab = function(resource, data)
  {
    var ui = UI.get_instance();

    if (!this._open_resource_views[resource.id])
    {
      var viewclass = this._type_class_map[resource.type]||cls.GenericResourceDetail;
      var view = new viewclass( resource, this._service );
      this._open_resource_views[resource.id] = view.id;
    }
    window.views[this._open_resource_views[resource.id]].data = data

    ui.get_tabbar("resources").add_tab(this._open_resource_views[resource.id]);
    ui.show_view(this._open_resource_views[resource.id]);
  }



  var doc_service = window.services['document-manager'];
  doc_service.addListener("abouttoloaddocument", this._on_abouttoloaddocument_bound);
  doc_service.addListener("documentloaded", this._on_documentloaded_bound);

  this.init(id, name, container_class, html, default_handler);
};

cls.ResourceTreeView.prototype = ViewBase;
