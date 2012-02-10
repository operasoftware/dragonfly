window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.NetworkLogView = function(id, name, container_class, html, default_handler)
{
  this._service = new cls.NetworkLoggerService(this);
  this._content_scroll = 0;
  this._details_scroll = 0;
  this._selected = null;
  this._rendertime = 0;
  this._rendertimer = null;
  this.needs_instant_update = false;

  // modes
  var DEFAULT = "default";
  var DETAILS = "details";

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
    if (this.needs_instant_update)
      this.needs_instant_update = false;

    this._container = container;

    // the query_selector for the mode needs to be set even when there is currently no query.
    if (this.mode == DETAILS)
      this._text_search.set_query_selector("tbody:not(.network_info)");
    else
      this._text_search.set_query_selector("[handler='select-network-request']");

    if (this.query)
    {
      // this triggers _create via on_before_search
      this._text_search.update_search();
    }
    else
    {
      this._create();
    }
    this._rendertime = new Date().getTime();
  }

  this._create = function()
  {
    var ctx = this._service.get_request_context();
    if (ctx) // todo: had a has_resources() check before, should maybe check for entries. bug when switching debug context, stays empty
    {
      // the filters need to be set when creating the view, the request_context may have changed in between
      ctx.set_filter(this._type_filters || []);

      this._render_tabbed_view(this._container);
      if (this._selected)
      {
        this._render_details_view(this._container, this._selected);
      }
    }
    else
    {
      this._render_click_to_fetch_view(this._container);
    }
  };
  this._update_bound = this.update.bind(this);

  this.onresize = this.createView;

  this._on_before_search_bound = function(message)
  {
    this.query = message.search_term;
    this._create();
  }.bind(this)

  this._render_details_view = function(container, selected)
  {
    var ctx = this._service.get_request_context();
    var left_val = settings.network_logger.get("detail-view-left-pos");
    var rendered = container.render(templates.network_log_details(ctx, selected, left_val));
    var details = rendered.querySelector(".network-details-container");
    this._details_scroll && (details.scrollTop = this._details_scroll);
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
    /*
      hand-calculate network-url-list's width, so it only takes one rendering
      #network-url-list { width: 40%; min-width: 230px; }
    */
    var url_list_width = Math.ceil(Math.max(230, parseInt(container.style.width) * 0.4));
    var detail_width = parseInt(container.style.width) - url_list_width;
    var selected_viewmode = settings.network_logger.get("selected-viewmode");

    var ctx = this._service.get_request_context();

    var item_order;
    if (selected_viewmode === "data")
    {
      item_order = this._item_order;
    }
    var template = templates.network_log_main(
                     ctx, this._selected, selected_viewmode, detail_width, item_order
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
                        ["method", "status", "mime", "size", "latency", "duration", "graph"],
                        null,
                        null,
                        null,
                        "network-inspector"
                      );
        this._table.add_listener("after-render", this._catch_up_with_cols_and_sort_bound);
      }
      var data = ctx.get_entries_filtered().slice(0);
      this._table.set_data(data);
      table_container.clearAndRender(this._table.render());
      if (this._selected)
      {
        var sel_row = table_container.querySelector("[data-object-id='" + this._selected + "']");
        sel_row && sel_row.addClass("selected");
      }
      this._catch_up_with_cols_and_sort_bound();
    }
  };

  this._tabledef = {
    column_order: ["method", "status", "mime", "protocol", "size", "size_h", "latency", "duration", "started", "graph"],
    handler: "select-network-request",
    idgetter: function(res) { return String(res.id) },
    columns: {
      method: {
        label: "Method", // todo: strings
        headerlabel: "",
        use_ellipsis: true,
        renderer: function(entry) {
          return entry.method;
        }
      },
      status: {
        label: "Status",
        use_ellipsis: true,
        renderer: function(entry) {
          return (entry.responsecode && String(entry.responsecode)) || "";
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
        use_ellipsis: true,
        getter: function(entry) { return entry.mime || ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE },
        renderer: function(entry, getter) {
          return getter(entry)
        }
      },
      protocol: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_PROTOCOL,
        use_ellipsis: true,
        getter: function(entry) { return entry.urltypeName }
      },
      size: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_SIZE,
        align: "right",
        use_ellipsis: true,
        getter: function(entry) { return entry.size },
        renderer: function(entry) {
          return entry.size ? String(entry.size) : ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE
        },
        summer: function(data, groupname) {
          return String(data.map(function(entry){return entry.size || 0}).reduce(function(prev, curr) {
              return prev + curr;
            }
          ));
        }
      },
      size_h: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_PPSIZE,
        headerlabel: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_SIZE,
        align: "right",
        use_ellipsis: true,
        getter: function(entry) { return entry.size },
        renderer: function(entry) {
          return String(entry.size ?
                        cls.ResourceUtil.bytes_to_human_readable(entry.size) :
                        ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE)
        },
        summer: function(data, groupname) {
          var size = (data.map(function(entry){return entry.size || 0}).reduce(function(prev, curr) {
              return prev + curr;
            }
          ))
          return size ? cls.ResourceUtil.bytes_to_human_readable(size) :
                        ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE
        }
      },
      latency: {
        label: "Waiting",
        align: "right",
        use_ellipsis: true,
        getter: function(entry)
        {
          if (entry.responsestart && entry.requesttime)
            return entry.responsestart - entry.requesttime;
          return "";
        },
        renderer: function(entry, getter)
        {
          var val = getter(entry);
          return val && val.toFixed(2) + "ms";
        }
      },
      started: {
        label: "Started",
        align: "right",
        use_ellipsis: true,
        getter: function(entry)
        {
          return entry.starttime_relative;
        },
        renderer: function(entry)
        {
          return entry.starttime_relative.toFixed(2) + "ms";
        }
      },
      duration: {
        label: "Duration",
        align: "right",
        use_ellipsis: true,
        getter: function(entry) { return entry.get_duration() },
        renderer: function(entry) {
          var dur = entry.get_duration();
          return (dur && dur.toFixed(2) + "ms") || "";
        },
        summer: function(data, groupname) {
          var ctx = this._service.get_request_context();
          return (ctx && ctx.get_duration().toFixed(2) + "ms") || 0;
        }.bind(this)
      },
      graph: {
        label: "Graph",
        use_ellipsis: true,
        attributes: ["class", "network-graph-column"],
        getter: function(entry) { return entry.starttime },
        renderer: function(entry) {
          return templates.network_graph_sections(entry, 50, entry.get_duration(), true);
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
    this.mode = DEFAULT;
    this.needs_instant_update = true;
    this.update();
    return false;
  }.bind(this);

  this._on_start_resize_detail_bound = function(evt, target)
  {
    document.addEventListener("mousemove", this._on_drag_detail_bound, false);
    document.addEventListener("mouseup", this._on_stop_resize_detail_bound, false);
    this._resize_interval = setInterval(this._on_drag_interval_bound, 30);
    evt.preventDefault();
  }.bind(this);

  this._on_drag_detail_bound = function(evt)
  {
    this._resize_detail_evt = evt;
  }.bind(this);

  this._on_drag_interval_bound = function()
  {
    var container = document.querySelector(".network-details-container");
    if (container && this._resize_detail_evt)
    {
      this._detail_left = Math.max(this._resize_detail_evt.clientX, 15);
      container.style.left = this._detail_left + "px";
    }
  }.bind(this);

  this._on_stop_resize_detail_bound = function(evt)
  {
    document.removeEventListener("mousemove", this._on_drag_detail_bound, false);
    document.removeEventListener("mouseup", this._on_stop_resize_detail_bound, false);
    settings.network_logger.set("detail-view-left-pos", this._detail_left);
    this._resize_interval = clearInterval(this._resize_interval);
    this._resize_detail_evt = null;
  }.bind(this);

  this._on_select_next_bound = function(evt, target)
  {
    if (this._selected)
    {
      var selected_node = document.querySelector("[data-object-id='" + this._selected + "']");
      if (selected_node && 
          selected_node.nextElementSibling && 
          selected_node.nextElementSibling.dataset.objectId)
      {
        this._selected = selected_node.nextElementSibling.dataset.objectId;
        this.needs_instant_update = true;
        this.update();
        return false;
      }
    }
  }.bind(this);

  this._on_select_previous_bound = function(evt, target)
  {
    if (this._selected)
    {
      var selected_node = document.querySelector("[data-object-id='" + this._selected + "']");
      if (selected_node && 
          selected_node.previousElementSibling && 
          selected_node.previousElementSibling.dataset.objectId)
      {
        this._selected = selected_node.previousElementSibling.dataset.objectId;
        this.needs_instant_update = true;
        this.update();
        return false;
      }
    }
  }.bind(this);

  this._on_clicked_request_bound = function(evt, target)
  {
    var item_id = target.get_attr("parent-node-chain", "data-object-id");
    if (this._selected == item_id)
    {
      this._selected = null;
      this.mode = DEFAULT;
    }
    else
    {
      this._selected = item_id;
      this.mode = DETAILS;
    }
    this.needs_instant_update = true;
    this.update();
    if (this.graph_tooltip)
    {
      this.graph_tooltip.hide();
    }
  }.bind(this);

  this._on_mouseover_entry_bound = function(evt, target)
  {
    var item_id = target.get_attr("parent-node-chain", "data-object-id");
    var over = this._container.querySelectorAll("[data-object-id='" + item_id + "']");
    for (var n=0, e; e = over[n]; n++) { e.addClass("hovered"); }
    // todo: store here and restore when re-rendering
  }.bind(this);

  this._on_mouseout_entry_bound = function(evt, target)
  {
    var item_id = target.get_attr("parent-node-chain", "data-object-id");
    var out = this._container.querySelectorAll("[data-object-id='" + item_id + "']");
    for (var n=0, e; e = out[n]; n++) { e.removeClass("hovered"); }
  }.bind(this);

  this._on_scroll_bound = function(evt, target)
  {
    this._content_scroll = target.scrollTop;
    if (evt.target.hasClass("network-details-container"))
      this._details_scroll = evt.target.scrollTop;

  }.bind(this)

  this._on_clicked_get_body = function(evt, target)
  {
    var item_id = target.getAttribute("data-object-id");
    this.needs_instant_update = true;
    this._service.get_body(item_id, this.update.bind(this));
  }.bind(this);

  this._on_graph_tooltip = function(evt, target)
  {
    var ctx = this._service.get_request_context();
    var entry_id = target.get_attr("parent-node-chain", "data-object-id");
    var entry = ctx.get_entry(entry_id);
    var template = templates.network_graph_entry_tooltip(entry);
    this.graph_tooltip.show(template);
  }

  Tooltips.register("network-url-list-tooltip", true);
  this.graph_tooltip = Tooltips.register("network-graph-tooltip", true);
  this.graph_tooltip.ontooltip = this._on_graph_tooltip.bind(this);

  this._on_clear_log_bound = function(evt, target)
  {
    this._service.clear_request_context();
    this.needs_instant_update = true;
    this.update();
  }.bind(this);

  this._on_close_incomplete_warning_bound = function(evt, target)
  {
    var ctx = this._service.get_request_context();
    if (ctx)
      ctx.incomplete_warn_discarded = true;

    this.needs_instant_update = true;
    this.update();
  }.bind(this);

  this._on_turn_off_incomplete_warning = function(evt, target)
  {
    settings.network_logger.set("show-incomplete-warning", false);
  };

  this._on_setting_changed_bound = function(message)
  {
    if (message.id === "network_logger")
    {
      if (message.key === "pause")
      {
        var is_paused = this._service.is_paused();
        var pause = settings.network_logger.get(message.key);
        if (is_paused && !pause)
          this._service.unpause();
        else if (!is_paused && pause)
          this._service.pause();
      }
      this.needs_instant_update = true;
      this.update();
    }
  }.bind(this);

  this._on_single_select_changed_bound = function(message)
  {
    if (message.view_id === "network_logger")
    {
      if (message.name === "selected-viewmode")
      {
        settings.network_logger.set(message.name, message.values[0]);
      }
      else if (message.name === "type-filter")
      {
        this._type_filters = message.values;
      }
      this.needs_instant_update = true;
      this.update();
    }
  }.bind(this);

  var eh = window.eventHandlers;
  // fixme: this is in the wrong place! Doesn't belong in UI and even if it
  // did, the event handler doesn't get added until the view is created
  // which means you can't open tabs from elsewhere if you haven't opened
  // the resources view first
  //  eh.click["resources-all-open"] = this._handle_open_resource_bound;

  eh.click["select-network-request"] = this._on_clicked_request_bound;
  eh.mouseover["select-network-request"] = this._on_mouseover_entry_bound;
  eh.mouseout["select-network-request"] = this._on_mouseout_entry_bound;
  eh.scroll["network-logger"] = this._on_scroll_bound;

  eh.click["close-request-detail"] = this._on_clicked_close_bound;
  eh.mousedown["resize-request-detail"] = this._on_start_resize_detail_bound;
  eh.click["get-response-body"] = this._on_clicked_get_body;

  eh.click["toggle-raw-cooked-response"] = this._on_clicked_toggle_response_bound;
  eh.click["toggle-raw-cooked-request"] = this._on_clicked_toggle_request_bound;
  eh.click["clear-log-network-view"] = this._on_clear_log_bound;
  
  messages.addListener("single-select-changed", this._on_single_select_changed_bound);
  messages.addListener("setting-changed", this._on_setting_changed_bound);
  eh.click["select-network-viewmode"] = this._on_select_network_viewmode_bound;
  eh.click["type-filter-network-view"] = this._on_change_type_filter_bound;

  eh.click["close-incomplete-warning"] = this._on_close_incomplete_warning_bound;
  eh.click["turn-off-incomplete-warning"] = this._on_turn_off_incomplete_warning;

  ActionHandlerInterface.apply(this);
  this._handlers = {
    "select-next-entry": this._on_select_next_bound,
    "select-previous-entry": this._on_select_previous_bound,
    "close-details": this._on_clicked_close_bound
  };
  this.id = id;
  ActionBroker.get_instance().register_handler(this);

  this.init(id, name, container_class, html, default_handler);
};
cls.NetworkLogView.prototype = ViewBase;

cls.NetworkLog = {};
cls.NetworkLog.create_ui_widgets = function()
{
  new Settings( // view_id, key_map, label_map, setting_map, template, group, callback_map)
    // view_id
    "network_logger",
    // key-value map
    {
      "selected-viewmode": "graphs",
      "pause": false,
      "show-incomplete-warning": true,
      "track-content": true,
      "detail-view-left-pos": 120
    },
    // key-label map
    {
      "selected-viewmode": ui_strings.S_TOGGLE_PAUSED_UPDATING_NETWORK_VIEW, // todo: fix strings
      "pause": "",
      "show-incomplete-warning": "Warn me when not all Network requests are shown",
      "track-content": ui_strings.S_NETWORK_CONTENT_TRACKING_SETTING_TRACK_LABEL, // todo: maybe add ui_strings.S_NETWORK_CONTENT_TRACKING_SETTING_DESC,
      "detail-view-left-pos": ""
    },
    // settings map
    {
      customSettings: ["selected-viewmode", "pause", "detail-view-left-pos"],
      checkboxes: ["show-incomplete-warning", "track-content"]
    },
    // templates
    {
      "selected-viewmode": function(){return ""},
      "pause": function(){return ""},
      "detail-view-left-pos": function(){return ""}
    },
    // group
    "general"
  );

  window.views.network_logger.toolbar_config = new ToolbarConfig(
    {
      view: "network_logger",
      groups: [
        {
          type: "buttons",
          items: [
            {
              handler: "clear-log-network-view",
              icon: "clear-log-network-view",
              title: ui_strings.S_CLEAR_NETWORK_LOG
            }
          ]
        },
        {
          type: "switch",
          items: [
            {
              key: "network_logger.pause",
              icon: "pause-network-view",
              title: ui_strings.S_TOGGLE_PAUSED_UPDATING_NETWORK_VIEW // todo: this has no effect, since the title comes from the setting
            }
          ]
        },
        {
          type: "single-select", // UI CONSTANTS
          name: "selected-viewmode",
          default_value: window.settings.network_logger.get("selected-viewmode"),
          items: [
            {
              value: "graphs",
              title: "Graph view", // todo: strings
              icon: "network-view-toggle-graphs"
            },
            {
              value: "data",
              title: "Data view", // todo: strings
              icon: "network-view-toggle-data"
            }
          ]
        },
        {
          type: "single-select", // UI CONSTANTS
          name: "type-filter",
          allow_multiple_select: true,
          items: [
            {
              text: "All",
              value: ""
            },
            {
              text: "Markup",
              value: "markup"
            },
            {
              text: "Stylesheets",
              value: "css"
            },
            {
              text: "Scripts",
              value: "script"
            },
            {
              text: "Images",
              value: "image"
            },
            {
              text: "Other",
                      // the value it the comma-sparated list of strings to match type or load_origin,
                      // "|is_blacklist" can optionally be appended.
                      // This is parsed in network_service, in the data model in set_filter
              value: "markup,css,script,image|true"
            },
            {
              text: "XHR",
              value: "xhr"
            }
          ]
        },
        {
          type: "input", // UI CONSTANTS
          items: [
            {
              handler: "network-text-search",
              shortcuts: "network-text-search",
              title: ui_strings.S_SEARCH_INPUT_TOOLTIP,
              label: ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH
            }
          ]
        }
      ]
    }
  );

  var text_search = window.views.network_logger._text_search = new TextSearch();
  text_search.add_listener("onbeforesearch", window.views.network_logger._on_before_search_bound);

  eventHandlers.input["network-text-search"] = function(event, target)
  {
    text_search.searchDelayed(target.value);
  };
  ActionBroker.get_instance().get_global_handler().
      register_shortcut_listener("network-text-search", cls.Helpers.shortcut_search_cb.bind(text_search));

  var on_view_created = function(msg)
  {
    if (msg.id === "network_logger")
    {
      text_search.setContainer(msg.container);
      text_search.setFormInput(
        views.network_logger.getToolbarControl(msg.container, "network-text-search")
      );
    }
  }

  var on_view_destroyed = function(msg)
  {
    if (msg.id == "network_logger")
    {
      text_search.cleanup();
    }
  }

  messages.addListener("view-created", on_view_created);
  messages.addListener("view-destroyed", on_view_destroyed);
}