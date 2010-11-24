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

  this.createView = function(container)
  {
    this._render_main_view(container);
  };

  this._render_main_view = function(container)
  {
    var ctx = this._service.get_request_context();
    this._table = new SortableTable(this._tabledef, ctx.resources.slice(0))
    container.clearAndRender(this._table.render())
  };

  this._handle_open_resource_bound = function(evt, target)
  {
    var rid = target.getAttribute("resource-id");
    var resource = this._service.get_resource_for_id(rid);
    opera.postError("Should show " + rid);
  }.bind(this);

  this._handle_sort_resources = function(evt, target)
  {
    var col = target.getAttribute("column-name");
    if (this._sort_by == col)
    {
      this._reverse = !this._reverse;
    }
    else
    {
      this._sort_by = col;
      this._reverse = false; // show unrevered when chosing new col.
    }
    this.update();
  }.bind(this);

  this._tabledef = {
    columns: {
      icon: {
        label: "Icon",
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

  var eh = window.eventHandlers;
  eh.click["resources-all-open"] = this._handle_open_resource_bound;
  eh.click["resources-all-sort"] = this._handle_sort_resources;

  this.init(id, name, container_class, html, default_handler);
};
cls.ResourceManagerAllView.prototype = ViewBase;
