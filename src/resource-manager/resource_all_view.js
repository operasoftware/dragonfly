window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.ResourceManagerAllView = function(id, name, container_class, html, default_handler) {
  this._service = new cls.ResourceManagerService();
  this._sort_by = "name";
  this._reverse = false;
  this._columns = [];
  this._loading = false;

  this.createView = function(container)
  {
    this._render_main_view(container);
  };

  this._render_main_view = function(container)
  {
    var ctx = this._service.get_resource_context();
    if (ctx && ctx.resources.length)
    {
      if (!this._table)
      {
        this._table = new SortableTable(this._tabledef, null)
      }
      this._table.data = ctx.resources.slice(0);
      container.clearAndRender(this._table.render());
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
         ['button',
          'class', 'ui-button',
          'handler', 'reload-window'],
         ['p', "Click the reload button above to reload the debugged window and fetch its resources"],
         'class', 'info-box'
        ]
      );
    }
  };

  this._open_resource_tab = function(resource)
  {
    var type = resource.type;
    viewclasses = {
      image: cls.ImageResourceDetail,
      font: cls.FontResourceDetail,
      script: cls.TextResourceDetail,
      markup: cls.TextResourceDetail,
      css: cls.TextResourceDetail,
    }
    var viewclass = viewclasses[type] || cls.GenericResourceDetail;
    var view = new viewclass(resource, this._service);
    var ui = UI.get_instance();
    ui.get_tabbar("resources").add_tab(view.id);
    ui.show_view(view.id);
  }

  this._handle_open_resource_tab_bound = function(evt, target) {
    var rid = target.getAttribute("data-resource-id");
    if (rid)
    {
      var res = services.get_resource_for_id(rid);
    }
    else
    {
      var res = this._service.get_resource_for_url(target.getAttribute("data-resource-url"));
    }

    if (res)
    {
      this._open_resource_tab(res);
    }
  }.bind(this);

  this._handle_open_resource_bound = function(evt, target)
  {
    var rid = target.getAttribute("data-object-id");
    var obj = this._service.get_resource_for_id(rid);
    this._open_resource_tab(obj);
  }.bind(this);

  this._tabledef = {
    handler: "resources-all-open",
    column_order: ["icon", "protocol", "host", "path", "mime", "type", "size", "size_h"],
    idgetter: function(res) { return String(res.id) },
    groups: {
      hosts: {
        label: "Hosts",
        grouper: function(res) { return res.urltype == 4 ? "No host" : cls.ResourceUtil.url_host(res.url) }
      },
      types: {
        label: "Types",
        grouper: function(res) { return res.type || "unknown"}
      }
    },
    columns: {
      icon: {
        label: "Icon",
        sorter: "unsortable",
        renderer: function(res) { return templates.resource_icon(res.mime) }
      },
      protocol: {
        label: "Protocol",
        getter: function(res) { return res.urltypeName },
      },
      host: {
        label: "Host",
        getter: function(res) { return res.urltype == 4 ? "No host. Data URI" : cls.ResourceUtil.url_host(res.url) },
      },
      path: {
        label: "Path",
        getter: function(res) { return res.urltype == 4 ? "No path. Data URI" : cls.ResourceUtil.url_path(res.url) },
      },
      mime: {
        label: "Mime",
        getter: function(res) { return res.mime || "n/a" }
      },
      type: {
        label: "Type",
        getter: function(res) { return res.type || "n/a" }
      },
      size: {
        label: "Size",
        getter: function(res) { return res.size ? String(res.size) : "n/a" },
      },
      size_h: {
        label: "Size(h)",
        getter: function(res) {
          return String(res.size ?
                        cls.ResourceUtil.bytes_to_human_readable(res.size) :
                        "n/a")
        }
      }
    },
  }

  this._on_abouttoloaddocument_bound = function()
  {
    this._loading = true;
    this._table = null;
    this.update();
  }.bind(this);

  this._on_documentloaded_bound = function()
  {
    this._loading = false;
    this.update();
  }.bind(this);

  var eh = window.eventHandlers;
  // fixme: this is in the wrong place! Doesn't belong in UI and even if it
  // did, the event handler doesn't get added until the view is created
  // which means you can't open tabs from elsewhere if you haven't opened
  // the resources view first
  eh.click["resources-all-open"] = this._handle_open_resource_bound;
  eh.click["open-resource-tab"] = this._handle_open_resource_tab_bound;

  var doc_service = window.services['document-manager'];
  doc_service.addListener("abouttoloaddocument", this._on_abouttoloaddocument_bound);
  doc_service.addListener("documentloaded", this._on_documentloaded_bound);

  this.init(id, name, container_class, html, default_handler);
};
cls.ResourceManagerAllView.prototype = ViewBase;
