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
    var ctx = this._service.get_request_context();

    if (ctx)
    {
      if (!this._table)
      {
        this._table = new SortableTable(this._tabledef, ctx.resources.slice(0))
      }
      container.clearAndRender(this._table.render())
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
    var view = new cls.GenericResourceDetail(resource, this._service);
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
    idgetter: function(res) { return String(res.urlload.resourceID) },
    groups: {
      hosts: {
        label: "Hosts",
        grouper: function(res) { return cls.ResourceUtil.url_host(res.urlload.url) }
      },
      types: {
        label: "Types",
        grouper: function(res) { return cls.ResourceUtil.mime_to_type(res.urlfinished ?
                                                                      res.urlfinished.mimeType :
                                                                      "unknown")}
      }
    },
    columns: {
      icon: {
        label: "Icon",
        sorter: "unsortable",
        renderer: function(res) {
          return templates.resource_icon(res.urlfinished ?
                                         res.urlfinished.mimeType :
                                         null) },
      },
      host: {
        label: "Host",
        getter: function(res) { return cls.ResourceUtil.url_host(res.urlload.url) },
      },
      path: {
        label: "Path",
        getter: function(res) { return cls.ResourceUtil.url_path(res.urlload.url) },
      },
      mime: {
        label: "Mime",
        getter: function(res) { return res.urlfinished ? res.urlfinished.mimeType : "n/a" }
      },
      type: {
        label: "Type",
        getter: function(res) { return res.urlfinished ? cls.ResourceUtil.mime_to_type(res.urlfinished.mimeType) : "n/a" }
      },
      size: {
        label: "Size",
        getter: function(res) { return String(res.urlfinished ? res.urlfinished.contentLength : "n/a") },
      },
      size_h: {
        label: "Size(h)",
        getter: function(res) {
          return String(res.urlfinished ?
                        cls.ResourceUtil.bytes_to_human_readable(res.urlfinished.contentLength) :
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
