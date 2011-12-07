window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.NetworkLogView = function(id, name, container_class, html, default_handler) {
  this._service = new cls.NetworkLoggerService(this);
  this._content_scroll = 0;
  this._details_scroll = 0;
  this._selected = null;
  this._rendertime = 0;
  this._rendertimer = null;
  this._everrendered = false;
  this.needs_instant_update = false;

  this.createView = function(container)
  {
    var min_render_delay = 200;
    var timedelta = new Date().getTime() - this._rendertime;

    if (this._rendertimer)
      this._rendertimer = window.clearTimeout(this._rendertimer);

    if (!this.needs_instant_update && timedelta < min_render_delay)
    {
      this._rendertimer = window.setTimeout(this._create.bind(this), min_render_delay);
      return;
    }
    this._rendertime = new Date().getTime();
    if (this.needs_instant_update)
      this.needs_instant_update = false;

    this._container = container;
    if (this.query)
    {
      // this triggers _create via on_before_search
      this._text_search.update_search();
    }
    else
    {
      this._create();
    }
  }

  this._create = function()
  {
    var ctx = this._service.get_request_context();

    if (ctx) // todo: had a has_resources() check before, should maybe check for entries
    {
      this._render_tabbed_view(this._container);
      if (this._selected)
      {
        this._render_details_view(this._container, this._selected);
      }
    }
    else if (this._everrendered)
    {
      // todo: render template "No data to show." This is also for when service is paused and no resources are there now.
      this._container.innerHTML = "";
    }
    else
    {
      this._render_click_to_fetch_view(this._container);
    }

    var pause_button = document.querySelector(".toggle-paused-network-view");
    if (pause_button)
    {
      if (this._service.is_paused())
        pause_button.addClass("is-active");
      else
        pause_button.removeClass("is-active");
    }
  };
  this._update_bound = this.update.bind(this);

  this.onresize = this.createView;

  this._on_before_search_bound = function(message)
  {
    this.query = message.search_term;
    this._create();
  }.bind(this)

  this.ondestroy = function()
  {
    this._everrendered = false;
  };

  this._render_details_view = function(container)
  {
    var ctx = this._service.get_request_context();
    var rendered = container.render(templates.network_log_details(ctx, this._selected));
    var details = rendered.querySelector(".network-details-request");
    if (details)
      details.scrollTop = this._details_scroll;
  };

  this._render_click_to_fetch_view = function(container) // todo: templates
  {
    container.clearAndRender(
      ['div',
        ['span',
          'class', 'container-button ui-button',
          'handler', 'reload-window',
          'tabindex', '1'],
        ['p', ui_strings.S_RESOURCE_CLICK_BUTTON_TO_FETCH_RESOURCES],
          'class', 'info-box'
      ]
    );
  };

  this._render_tabbed_view = function(container)
  {
    this._everrendered = true;
    /*
      hand-calculate network-url-list's width, so it only takes one rendering
      #network-url-list { width: 40%; min-width: 230px; }
    */
    var url_list_width = Math.ceil(Math.max(230, parseInt(container.style.width) * 0.4));
    var detail_width = parseInt(container.style.width) - url_list_width;
    var selected_viewmode = settings.network_logger.get("selected_viewmode");

    var ctx = this._service.get_request_context();

    var filters = [];
    if (this._type_filters)
    {
      filters.push(
        {
          content: this._type_filters,
          is_blacklist: this._type_filter_is_blacklist
        }
      );
    };
    var filter_compare = filters.length ? 
                           JSON.stringify(filters) : undefined;
    if (this._current_filters !== filter_compare)
    {
      ctx.set_filters(filters);
      this._current_filters = filter_compare;
    }

    var item_order;
    if (selected_viewmode === "data")
    {
      item_order = this._item_order;
    }
    var template = templates.network_log_main(
                     ctx, this._selected, selected_viewmode, detail_width, item_order, this._type_filters
                   );
    var content = container.clearAndRender(template);
    content.scrollTop = this._content_scroll;

    // Render sortable table
    var table_container = content.querySelector(".network-data-table-container");
    if (table_container)
    {
      if (!this._table)
      {
        this._table = new SortableTable(
                        this._tabledef,
                        null,
                        ["method", "status", "mime", "protocol", "size", "latency", "duration"],
                        null,
                        null,
                        null,
                        "network-inspector"
                      );
        this._table.add_listener("after-render", this._catch_up_with_cols_and_sort_bound);
      }
      var data = ctx.get_logger_entries().slice(0);
      this._table.set_data(data);
      table_container.clearAndRender(this._table.render());
      this._catch_up_with_cols_and_sort_bound();
    }
  };

  this._tabledef = {
    column_order: ["method", "status", "mime", "protocol", "size", "size_h", "latency", "duration"],
    handler: "select-network-request",
    idgetter: function(res) { return String(res.id) },
    columns: {
      method: {
        label: "Method", // todo: strings
        headerlabel: ""
      },
      status: {
        label: "Status",
        renderer: function(entry) {
          return entry.responsecode && String(entry.responsecode);
        },
        title_getter: function(entry) { // todo: use this in sortable_table
          if (cls.ResourceUtil.http_status_codes[entry.responsecode])
            return entry.responsecode + " (" + cls.ResourceUtil.http_status_codes[entry.responsecode] +")";
        },
        sorter: function(obj_a, obj_b) { // todo: it would be better to let the getter return 0 and keep the sorter as default. but can't pass a number.
          var a = obj_a.responsecode || 0;
          var b = obj_b.responsecode || 0;
          return a > b;
        }
      },
      mime: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_MIME,
        getter: function(entry) { return entry.mime || ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE }
      },
      protocol: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_PROTOCOL,
        getter: function(entry) { return entry.urltypeName },
      },
      size: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_SIZE,
        align: "right",
        renderer: function(entry) { return entry.size ? String(entry.size) : ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE },
        getter: function(entry) { return entry.size }
      },
      size_h: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_PPSIZE,
        headerlabel: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_SIZE,
        align: "right",
        getter: function(entry) { return entry.size },
        renderer: function(entry) {
          return String(entry.size ?
                        cls.ResourceUtil.bytes_to_human_readable(entry.size) :
                        ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE)
        }
      },
      latency: {
        label: "Waiting",
        align: "right",
        getter: function(entry)
                {
                  if (entry.responsestart && entry.requesttime)
                    return new Number(entry.responsestart - entry.requesttime).toFixed(2) + "ms";

                  return "";
                }
      },
      duration: {
        label: "Duration",
        align: "right",
        getter: function(entry) { return entry.get_duration() },
        renderer: function(entry) {
          var dur = entry.get_duration();
          if (dur)
            return new Number(dur).toFixed(2) + "ms";

          return "";
        }
      }
    }
  }

  this._catch_up_with_cols_and_sort_bound = function()
  {
    var needs_update = false;
    if (this._table)
    {
      var data = this._table.get_data();
      if (data && data.length)
      {
        var old_item_order = this._item_order;

        this._item_order = data.map(function(res){return res.id}).join(",");
        if (this._item_order !== old_item_order)
        {
          needs_update = true; // todo: this causes another re-rendering for every added resource. optimize.
        }
      }
      // check if the visible columns are still the same, as the filters need updating if not.
      // it's good to do this, even if needs_update is already true, because it stores the _table_columns
      // for later reference. saves one redraw.
      var old_table_columns = this._table_columns;
      this._table_columns = this._table.columns.join(",");
      if (this._table_columns !== old_table_columns)
      {
        needs_update = true;
      }
    }
    if (needs_update)
    {
      this.needs_instant_update = true;
      this.update();
    }
  }.bind(this);

  this._on_clicked_close_bound = function(evt, target)
  {
    this._selected = null;
    this.needs_instant_update = true;
    this.update();
  }.bind(this);

  this._on_clicked_request_bound = function(evt, target)
  {
    var item_id = target.get_attr("parent-node-chain", "data-object-id");
    if (this._selected == item_id)
    {
      this._selected = null;
    }
    else
    {
      this._selected = item_id;
    }
    this.needs_instant_update = true;
    this.update();
    if (this.graph_tooltip)
    {
      this.graph_tooltip.hide();
    }
  }.bind(this);

  this._on_hover_request_bound = function(evt, target)
  {
    var item_id = target.get_attr("parent-node-chain", "data-object-id");
    var oldhovered = this._container.querySelectorAll(".hovered");
    var newhovered = this._container.querySelectorAll("[data-object-id='" + item_id + "']");
    for (var n=0, e; e=oldhovered[n]; n++) { e.removeClass("hovered"); }
    for (var n=0, e; e=newhovered[n]; n++) { e.addClass("hovered"); }
  }.bind(this);

  this._on_scroll_bound = function(evt, target)
  {
    this._content_scroll = target.scrollTop;
    if (evt.target.hasClass("network-details-request"))
      this._details_scroll = evt.target.scrollTop;

  }.bind(this)

  this._on_clicked_get_body = function(evt, target)
  {
    var item_id = target.getAttribute("data-object-id");
    this.needs_instant_update = true;
    this._service.request_body(item_id, this.update.bind(this));
  }.bind(this);

  this._on_tooltip = function(evt, target)
  {
    if (target.hasClass("network-graph-sections-hitarea")) // else it's the url tooltip
    {
      var ctx = this._service.get_request_context();
      var entry_id = target.get_attr("parent-node-chain", "data-object-id");
      var entry = ctx.get_logger_entry(entry_id);
      var template = templates.network_graph_entry_tooltip(entry, 150);
      this.graph_tooltip.show(template);
    }
  }

  Tooltips.register("network-url-list-tooltip", true);
  this.graph_tooltip = Tooltips.register("network-tooltip", true);
  this.graph_tooltip.ontooltip = this._on_tooltip.bind(this);
  
  this._on_clear_log_bound = function(evt, target)
  {
    if (this._service.is_paused())
      this._service.unpause();
    this._service.clear_resources();
    this.needs_instant_update = true;
    this.update();
  }.bind(this);

  this._on_toggle_paused_bound = function(evt, target)
  {
    if (this._service.is_paused())
      this._service.unpause();
    else
      this._service.pause();

    this.needs_instant_update = true;
    this.update();
  }.bind(this);

  this._on_select_network_viewmode_bound = function(evt, target)
  {
    settings.network_logger.set("selected_viewmode", target.getAttribute("data-select-viewmode"));
    this.needs_instant_update = true;
    this.update();
  }.bind(this);

  this._on_change_type_filter_bound= function(evt, target)
  {
    this._type_filters = target.getAttribute("data-type-filter");
    this._type_filter_is_blacklist = (target.getAttribute("data-filter-is-blacklist") === "true");
    this.needs_instant_update = true;
    this.update();
  }.bind(this);

  var eh = window.eventHandlers;
  // fixme: this is in the wrong place! Doesn't belong in UI and even if it
  // did, the event handler doesn't get added until the view is created
  // which means you can't open tabs from elsewhere if you haven't opened
  // the resources view first
  //  eh.click["resources-all-open"] = this._handle_open_resource_bound;

  eh.click["select-network-request"] = this._on_clicked_request_bound;
  eh.mouseover["select-network-request"] = this._on_hover_request_bound;
  eh.scroll["network-logger"] = this._on_scroll_bound;

  eh.click["close-request-detail"] = this._on_clicked_close_bound;
  eh.click["get-response-body"] = this._on_clicked_get_body;

  eh.click["toggle-raw-cooked-response"] = this._on_clicked_toggle_response_bound;
  eh.click["toggle-raw-cooked-request"] = this._on_clicked_toggle_request_bound;
  eh.click["clear-log-network-view"] = this._on_clear_log_bound;
  eh.click["toggle-paused-network-view"] = this._on_toggle_paused_bound;
  eh.click["select-network-viewmode"] = this._on_select_network_viewmode_bound;
  eh.click["type-filter-network-view"] = this._on_change_type_filter_bound;

  this.init(id, name, container_class, html, default_handler);
};
cls.NetworkLogView.prototype = ViewBase;

cls.NetworkLog = {};
cls.NetworkLog.create_ui_widgets = function()
{

  new ToolbarConfig
  (
    'network_logger',
    [
      {
        handler: 'clear-log-network-view',
        title: ui_strings.S_CLEAR_NETWORK_LOG
      },
      {
        handler: 'toggle-paused-network-view',
        title: ui_strings.S_TOGGLE_PAUSED_UPDATING_NETWORK_VIEW
      }
    ],
    [
      {
        handler: "network-text-filter",
        shortcuts: "network-text-filter",
        title: ui_strings.S_SEARCH_INPUT_TOOLTIP,
        label: ui_strings.S_INPUT_DEFAULT_TEXT_FILTER
      }
    ],
    null,
    null,
    true
  );

  var text_search = window.views.network_logger._text_search = new TextSearch();
  text_search.add_listener("onbeforesearch", window.views.network_logger._on_before_search_bound);

  eventHandlers.input["network-text-filter"] = function(event, target)
  {
    text_search.searchDelayed(target.value);
  };
  ActionBroker.get_instance().get_global_handler().
      register_shortcut_listener("network-text-filter", cls.Helpers.shortcut_search_cb.bind(text_search));

  var on_view_created = function(msg)
  {
    if( msg.id === "network_logger" )
    {
      text_search.setContainer(msg.container);
      text_search.setFormInput(
        views.network_logger.getToolbarControl(msg.container, "network-text-filter")
      );
    }
  }

  var on_view_destroyed = function(msg)
  {
    if( msg.id == "network_logger" )
    {
      text_search.cleanup();
    }
  }

  messages.addListener("view-created", on_view_created);
  messages.addListener("view-destroyed", on_view_destroyed);

  new Settings
  (
    // id
    "network_logger",
    // key-value map
    {
      "selected_viewmode": "graphs"
    },
    // key-label map
    {
      "selected_viewmode": ui_strings.S_TOGGLE_PAUSED_UPDATING_NETWORK_VIEW // todo: fix string? does this ever show up?
    },
    // settings map
    {
      customSettings: ["selected_viewmode"]
    },
    null,
    null
  );
}