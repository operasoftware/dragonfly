"use strict";

window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.NetworkLogView = function(id, name, container_class, html, default_handler, service)
{
  var MIN_RENDER_DELAY = 200;
  var DEFAULT = "default";
  var DETAILS = "details";

  this._service = service;
  this._container_scroll_top = 0;
  this._details_scroll_top = 0;
  this._details_scroll_left = 0;
  this._selected = null;
  this._rendertime = 0;
  this._render_timeout = 0;
  this._graph_tooltip_id = null;
  this._type_filters = null;
  this._last_render_speed = 0;
  this.needs_instant_update = false;
  this.required_services = ["resource-manager", "document-manager"];

  this.createView = function(container)
  {
    if (!this.needs_instant_update)
    {
      if (this._render_timeout)
      {
        return;
      }
      else
      {
        var timedelta = Date.now() - this._rendertime;
        var min_render_delay = Math.max(MIN_RENDER_DELAY, this._last_render_speed * 2);
        if (timedelta < min_render_delay)
        {
          this._render_timeout = window.setTimeout(this._create_delayed_bound,
                                                   min_render_delay - timedelta);
          return;
        }
      }
    }
    this.needs_instant_update = false;
    var started_rendering = Date.now();
    if (container)
      this._container = container;

    // In details, it would be better to not have .network_info and headlines searchable, but those can
    // occur on different levels, so it's too complicated to do with the current script-search.
    // Also searching accross spans (for syntax highlighting) is more important.
    if (this.mode == DETAILS)
      this.text_search.set_query_selector(null);
    else
      this.text_search.set_query_selector("[handler='select-network-request']");

    var ctx = this._service.get_request_context();
    if (ctx)
    {
      // The filters need to be set when creating the view, the request_context may have changed in between
      ctx.set_filters(this._type_filters || []);
      this._render_main_view(this._container);
      this.text_search.update_search();
    }
    else
    {
      this._render_click_to_fetch_view(this._container);
    }

    var now = Date.now();
    this._last_render_speed = now - started_rendering;
    this._rendertime = now;
  };

  this.create_disabled_view = function(container)
  {
    container.clearAndRender(window.templates.disabled_view());
  };

  this._create_delayed_bound = function()
  {
    this._render_timeout = 0;
    this.update();
  }.bind(this);

  this.onresize = function()
  {
    this.needs_instant_update = true;
    this.update();
  }.bind(this);

  this._render_details_view = function(entry)
  {
    var MINIMUM_DETAIL_WIDTH = 100;
    var left_val = settings.network_logger.get("detail-view-left-pos");
    left_val = Math.min(left_val, window.innerWidth - MINIMUM_DETAIL_WIDTH);
    var do_raw = settings.network_logger.get("view-raw");
    return templates.network.details(entry, left_val, do_raw);
  };

  this._render_click_to_fetch_view = function(container)
  {
    container.clearAndRender(
      ["div",
        ["span",
          "class", "ui-button reload-window",
          "handler", "reload-window",
          "tabindex", "1"],
        ["p", ui_strings.S_RESOURCE_CLICK_BUTTON_TO_FETCH_RESOURCES],
        "class", "info-box"
      ]
    );
  };

  this._render_main_view = function(container)
  {
    var selected_viewmode = settings.network_logger.get("selected-viewmode");
    var ctx = this._service.get_request_context();
    var entries = ctx.get_entries_filtered();
    var table_template;
    if (selected_viewmode === "data")
    {
      if (!this._table)
      {
        this._table = new SortableTable(
                        this._tabledef,
                        null,
                        ["method", "responsecode", "mime", "size_h", "waiting", "duration", "graph"],
                        null,
                        null,
                        null,
                        "network-inspector"
                      );
        this._table.add_listener("after-render", this._continue_render_main);
      }

      this._table.set_data(entries);
      table_template = this._table.render();
    }
    this._continue_render_main({template: table_template}, entries);
  };

  this._continue_render_main = function(after_render_object, entries)
  {
    var table_template = after_render_object && after_render_object.template;
    var is_data_mode = Boolean(table_template);
    var ctx = this._service.get_request_context();

    // In is_data_mode, the entries have to be retrieved from the table
    // to be in the correct order.
    if (is_data_mode)
      entries = this._table.get_data();

    /*
      hand-calculate network-url-list-container's width, so it only takes one rendering
      #network-url-list-container { width: 40%; min-width: 230px; }
    */
    if (!this._list_cont_width)
    {
      var style_dec = document.styleSheets.getDeclaration("#network-url-list-container");
      this._list_cont_width = parseInt(style_dec.getPropertyValue("width"), 10); // in %
      this._list_cont_min_width = parseInt(style_dec.getPropertyValue("min-width"), 10);
    }
    var url_list_width =
        Math.ceil(Math.max(
                            this._list_cont_min_width,
                            parseInt(this._container.style.width, 10) * this._list_cont_width / 100
                          )
                 );

    var detail_width = parseInt(this._container.style.width, 10) - url_list_width;

    var template = ["div", templates.network.main(
                     ctx, entries, this._selected, detail_width, table_template
                   ), "id", "network-outer-container",
                      "data-menu", "network-logger-context"];

    if (this._selected)
    {
      var entry = ctx.get_entry_from_filtered(this._selected);
      if (entry)
      {
        entry.check_to_get_body();
        template = [template, this._render_details_view(entry)];
      }
    }

    var rendered = this._container.clearAndRender(template);

    if (this._selected)
    {
      var details = rendered.querySelector(".entry-details");
      if (details)
      {
        if (this._details_scroll_top)
          details.scrollTop = this._details_scroll_top;

        if (this._details_scroll_left)
          details.scrollLeft = this._details_scroll_left;
      }

      if (is_data_mode)
      {
        var sel_row = rendered.querySelector("tr[data-object-id='" + this._selected + "']");
        if (sel_row)
          sel_row.addClass("selected");

      }
    }

    if (this._container_scroll_top)
    {
      var outer_container = rendered.getAttribute("id") === "network-outer-container" ?
                            rendered : rendered.firstChild;
      outer_container.scrollTop = this._container_scroll_top;
    }
  }.bind(this);

  this._tabledef = {
    column_order: ["method", "responsecode", "mime", "protocol", "size_h", "waiting", "duration", "started", "graph"],
    handler: "select-network-request",
    nowrap: true,
    idgetter: function(res) { return String(res.id) },
    columns: {
      method: {
        label: ui_strings.S_HTTP_LABEL_METHOD,
        getter: function(entry) { return (entry.current_request && entry.current_request.method) || ""; }
      },
      responsecode: {
        label: ui_strings.S_HTTP_LABEL_RESPONSECODE,
        headertooltip: ui_strings.S_HTTP_TOOLTIP_RESPONSECODE,
        renderer: function(entry) {
          return (entry.current_responsecode && String(entry.current_responsecode)) || "";
        },
        title_getter: function(entry, renderer) {
          var responsecode = cls.ResourceUtil.http_status_codes[entry.current_responsecode];
          return responsecode ? String(responsecode) : renderer(entry);
        },
        getter: function(entry) { return entry.current_responsecode || 0; }
      },
      mime: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_MIME,
        headertooltip: ui_strings.S_HTTP_TOOLTIP_MIME,
        getter: function(entry) { return entry.mime || ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE; },
        renderer: function(entry, getter) { return getter(entry); }
      },
      protocol: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_PROTOCOL,
        headertooltip: ui_strings.S_HTTP_TOOLTIP_PROTOCOL,
        getter: function(entry) { return entry.urltype_name.toLowerCase(); }
      },
      size_h: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_PPSIZE,
        headerlabel: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_SIZE,
        headertooltip: ui_strings.S_HTTP_TOOLTIP_SIZE_PRETTYPRINTED,
        align: "right",
        getter: function(entry) { return entry.size },
        renderer: function(entry) {
          return String(entry.size ?
                        cls.ResourceUtil.bytes_to_human_readable(entry.size) :
                        ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE);
        },
        title_getter: function(entry) {
          return entry.size ? String(entry.size) + " " + ui_strings.S_BYTES_UNIT
                            : ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE;
        }
      },
      waiting: {
        label: ui_strings.S_HTTP_LABEL_WAITING,
        headertooltip: ui_strings.S_HTTP_TOOLTIP_WAITING,
        align: "right",
        getter: function(entry)
        {
          return entry.waiting_time || "";
        },
        renderer: function(entry, getter)
        {
          var val = getter(entry);
          return val && val.toFixed(2) + " ms";
        }
      },
      started: {
        label: ui_strings.S_HTTP_LABEL_STARTED,
        headertooltip: ui_strings.S_HTTP_TOOLTIP_STARTED,
        align: "right",
        getter: function(entry)
        {
          return entry.starttime_relative;
        },
        renderer: function(entry)
        {
          return entry.starttime_relative.toFixed(2) + " ms";
        }
      },
      duration: {
        label: ui_strings.S_HTTP_LABEL_DURATION,
        headertooltip: ui_strings.S_HTTP_TOOLTIP_DURATION,
        align: "right",
        getter: function(entry) { return entry.duration },
        renderer: function(entry) {
          var dur = entry.duration;
          return (dur && dur.toFixed(2) + " ms") || "";
        }
      },
      graph: {
        label: ui_strings.S_HTTP_LABEL_GRAPH,
        headertooltip: ui_strings.S_HTTP_TOOLTIP_GRAPH,
        attributes: ["class", "network-graph-column"],
        getter: function(entry) { return entry.starttime },
        renderer: function(entry) {
          var FIXED_GRAPH_WIDTH = 50;
          return templates.network.graph_sections(entry, FIXED_GRAPH_WIDTH, entry.duration, true);
        }
      }
    }
  };

  this._on_clicked_close_bound = function(evt, target)
  {
    this._selected = null;
    this.mode = DEFAULT;
    this.needs_instant_update = true;
    this.update();
    // the arrow keys don't scroll the main container after this was closed.
    // dispatching a click event doesn't help either.
    return false;
  }.bind(this);

  this._on_start_resize_detail_bound = function(evt, target)
  {
    if (evt.target.hasClass("resize-request-detail"))
    {
      document.addEventListener("mousemove", this._on_drag_detail_bound, false);
      document.addEventListener("mouseup", this._on_stop_resize_detail_bound, false);
      if (!this._resize_interval)
        this._resize_interval = setInterval(this._on_drag_interval_bound, 30);

      evt.preventDefault();
    }
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
      this._detail_left = Math.min(this._detail_left, window.innerWidth - 100);
      container.style.left = this._detail_left + "px";
      settings.network_logger.set("detail-view-left-pos", this._detail_left);
    }
  }.bind(this);

  this._on_stop_resize_detail_bound = function(evt)
  {
    document.removeEventListener("mousemove", this._on_drag_detail_bound, false);
    document.removeEventListener("mouseup", this._on_stop_resize_detail_bound, false);
    this._resize_interval = clearInterval(this._resize_interval);
    this._resize_detail_evt = null;
  }.bind(this);

  var _make_selection_func = function(accessor)
  {
    if (this._selected)
    {
      var selected_node = document.querySelector("[data-object-id='" + this._selected + "']");
      if (selected_node &&
          selected_node[accessor] &&
          selected_node[accessor].dataset.objectId)
      {
        this._selected = selected_node[accessor].dataset.objectId;
        selected_node = document.querySelector("[data-object-id='" + this._selected + "']");
        if (selected_node)
        {
          var outer_container = this._container.firstChild;
          var selected_ypos = selected_node.offsetTop + selected_node.offsetHeight;
          if (selected_ypos > (outer_container.offsetHeight + this._container_scroll_top))
          {
            // scroll down to node
            this._container_scroll_top = selected_ypos - outer_container.offsetHeight;
          }
          else if (selected_node.offsetTop < this._container_scroll_top)
          {
            // scroll up to node
            this._container_scroll_top = selected_node.offsetTop;
          }
        }
        this.needs_instant_update = true;
        this.update();
        return false;
      }
    }
  };

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
  }.bind(this);

  this._on_mouseout_entry_bound = function(evt, target)
  {
    var item_id = target.get_attr("parent-node-chain", "data-object-id");
    var out = this._container.querySelectorAll("[data-object-id='" + item_id + "']");
    for (var n = 0, elem; elem = out[n]; n++)
      elem.removeClass("hovered");

  }.bind(this);

  this._on_scroll_bound = function(evt, target)
  {
    if (evt.target.hasClass("entry-details"))
    {
      this._details_scroll_top = evt.target.scrollTop;
      this._details_scroll_left = evt.target.scrollLeft;
    }
    else
    {
      this._container_scroll_top = target.firstChild.scrollTop;
    }
  }.bind(this);

  this._on_graph_tooltip_bound = function(evt, target)
  {
    var ctx = this._service.get_request_context();
    this._graph_tooltip_id = target.get_attr("parent-node-chain", "data-object-id");
    var entry = ctx.get_entry(this._graph_tooltip_id);
    if (!this.mono_lineheight)
      this._update_mono_lineheight();

    var template = templates.network.graph_tooltip(entry, this.mono_lineheight);
    this.graph_tooltip.show(template);
  }.bind(this);

  this._on_graph_tooltip_enter_bound = function(evt, target)
  {
    if (!this._graph_tooltip_id)
      return;

    var elems = this._container.querySelectorAll("[data-object-id='" + this._graph_tooltip_id + "']");
    for (var i = 0, elem; elem = elems[i]; i++)
      elem.addClass("hovered");

  }.bind(this);

  this._on_graph_tooltip_leave_bound = function(evt, target)
  {
    if (!this._graph_tooltip_id)
      return;

    var elems = this._container.querySelectorAll("[data-object-id='" + this._graph_tooltip_id + "']");
    for (var i = 0, elem; elem = elems[i]; i++)
      elem.removeClass("hovered");

    this._graph_tooltip_id = null;
  }.bind(this);

  this._on_url_tooltip_bound = function(evt, target)
  {
    var ctx = this._service.get_request_context();
    if (ctx)
    {
      var entry_id = target.get_attr("parent-node-chain", "data-object-id");
      var entry = ctx.get_entry(entry_id);
      if (entry)
      {
        var template = templates.network.url_tooltip(entry);
        this.url_tooltip.show(template);
      }
    }
  }.bind(this);

  this._update_mono_lineheight = function()
  {
    this.mono_lineheight = window.defaults["js-source-line-height"];
  }.bind(this);

  this.url_tooltip = Tooltips.register("network-url-list-tooltip", true, false);
  this.url_tooltip.ontooltip = this._on_url_tooltip_bound;

  this.graph_tooltip = Tooltips.register("network-graph-tooltip", true, false);
  this.graph_tooltip.ontooltip = this._on_graph_tooltip_bound;
  this.graph_tooltip.ontooltipenter = this._on_graph_tooltip_enter_bound;
  this.graph_tooltip.ontooltipleave = this._on_graph_tooltip_leave_bound;

  this._on_clear_log_bound = function(evt, target)
  {
    this._service.clear_request_context();
    this.needs_instant_update = true;
  }.bind(this);

  this._on_close_incomplete_warning_bound = function(evt, target)
  {
    var ctx = this._service.get_request_context();
    var window_id = Number(target.get_attr("parent-node-chain", "data-reload-window-id"));
    if (ctx && window_id)
      ctx.discard_incomplete_warning(window_id);

    this.needs_instant_update = true;
    this.update();
  }.bind(this);

  this._on_setting_changed_bound = function(message)
  {
    switch (message.id)
    {
      case "monospacefont":
      {
        this.mono_lineheight = null;
        break;
      }
      case "network_logger":
      {
        if (message.key === "pause")
        {
          var is_paused = this._service.is_paused;
          var pause = settings.network_logger.get(message.key);
          if (is_paused && !pause)
            this._service.unpause();
          else if (!is_paused && pause)
            this._service.pause();
        }
        else if (message.key === "network-profiler-mode")
        {
          var set_profile = settings.network_logger.get(message.key) ?
                            window.app.profiles.HTTP_PROFILER : window.app.profiles.DEFAULT;
          var current_profile = settings.general.get("profile-mode");
          if (current_profile !== set_profile)
            window.services.scope.enable_profile(set_profile);
        }

        if (message.key !== "detail-view-left-pos")
        {
          this.needs_instant_update = true;
          this.update();
        }
        break;
      }
      case "general":
      {
        if (message.key === "profile-mode")
        {
          var set_network_profiler = settings.general.get(message.key) === window.app.profiles.HTTP_PROFILER;
          var is_profiler_mode = settings.network_logger.get("network-profiler-mode");
          if (is_profiler_mode !== set_network_profiler)
            settings.network_logger.set("network-profiler-mode", set_network_profiler);

        }
      }
    }
  }.bind(this);

  this._map_filter_bound = function(filter_name)
  {
    return {
      all: {
        type_list: [],
        "is_blacklist": true
      },
      markup: {
        type_list: ["markup"]
      },
      css: {
        type_list: ["css"]
      },
      script: {
        type_list: ["script"]
      },
      image: {
        type_list: ["image"]
      },
      other_types: {
        type_list: ["markup", "css", "script", "image"],
        "is_blacklist": true
      },
      xhr: {
        origin_list: ["xhr"]
      }
    }[filter_name];
  }.bind(this);

  this._on_single_select_changed_bound = function(message)
  {
    if (message.view_id === "network_logger")
    {
      if (message.name === "selected-viewmode")
        settings.network_logger.set(message.name, message.values[0]);
      else if (message.name === "type-filter")
        this._type_filters = message.values.map(this._map_filter_bound);

      this.needs_instant_update = true;
      this.update();
    }
  }.bind(this);

  this._toggle_profile_mode = function(button)
  {
    var KEY = "network-profiler-mode";
    var set_active = !settings.network_logger.get(KEY);
    settings.network_logger.set(KEY, set_active);
    views.settings_view.syncSetting("network_logger", KEY, set_active);
    if (set_active)
      button.addClass("is-active");
    else
      button.removeClass("is-active");
  };

  this._on_toggle_network_profiler_bound = function(event)
  {
    var set_active = !event.target.hasClass("is-active");
    if (set_active)
    {
      new ConfirmDialog(ui_strings.S_CONFIRM_SWITCH_TO_NETWORK_PROFILER,
                        this._toggle_profile_mode.bind(this, event.target)).show();
    }
    else
    {
      this._toggle_profile_mode(event.target);
    }
  }.bind(this);

  var eh = window.eventHandlers;

  eh.click["select-network-request"] = this._on_clicked_request_bound;
  eh.mouseover["select-network-request"] = this._on_mouseover_entry_bound;
  eh.mouseout["select-network-request"] = this._on_mouseout_entry_bound;
  eh.scroll["network-logger"] = this._on_scroll_bound;

  eh.click["close-request-detail"] = this._on_clicked_close_bound;
  eh.mousedown["resize-request-detail"] = this._on_start_resize_detail_bound;

  eh.click["toggle-raw-cooked-response"] = this._on_clicked_toggle_response_bound;
  eh.click["toggle-raw-cooked-request"] = this._on_clicked_toggle_request_bound;
  eh.click["clear-log-network-view"] = this._on_clear_log_bound;

  messages.addListener("single-select-changed", this._on_single_select_changed_bound);
  messages.addListener("setting-changed", this._on_setting_changed_bound);
  messages.addListener("network-resource-updated", this.update.bind(this));
  messages.addListener("network-context-cleared", this.update.bind(this));
  eh.click["select-network-viewmode"] = this._on_select_network_viewmode_bound;
  eh.click["type-filter-network-view"] = this._on_change_type_filter_bound;
  eh.click["profiler-mode-switch"] = this._on_toggle_network_profiler_bound;

  eh.click["close-incomplete-warning"] = this._on_close_incomplete_warning_bound;

  ActionHandlerInterface.apply(this);
  this._handlers = {
    "select-next-entry": _make_selection_func.bind(this, "nextElementSibling"),
    "select-previous-entry": _make_selection_func.bind(this, "previousElementSibling"),
    "close-details": this._on_clicked_close_bound
  };
  this.id = id;
  ActionBroker.get_instance().register_handler(this);

  var contextmenu = ContextMenu.get_instance();
  contextmenu.register("network-logger-context", [
    {
      label: ui_strings.S_CLEAR_NETWORK_LOG,
      handler: this._on_clear_log_bound
    }
  ]);

  this._type_filters = ["all"].map(this._map_filter_bound);
  this.init(id, name, container_class, html, default_handler);
};
cls.NetworkLogView.prototype = ViewBase;

cls.NetworkLog = {};
cls.NetworkLog.create_ui_widgets = function()
{
  new Settings(
    // view_id
    "network_logger",
    // key-value map
    {
      "selected-viewmode": "graphs",
      "pause": false,
      "network-profiler-mode": false,
      "detail-view-left-pos": 120,
      "track-content": true,
      "view-raw": false
    },
    // key-label map
    {
      "pause": ui_strings.S_TOGGLE_PAUSED_UPDATING_NETWORK_VIEW,
      "network-profiler-mode": ui_strings.S_BUTTON_SWITCH_TO_NETWORK_PROFILER,
      "track-content": ui_strings.S_NETWORK_CONTENT_TRACKING_SETTING_TRACK_LABEL,
      "view-raw": ui_strings.S_NETWORK_RAW_VIEW_LABEL
    },
    // settings map
    {
      checkboxes: ["track-content", "view-raw"]
    },
    // templates
    {
    },
    // group
    "general"
  );

  new ToolbarConfig(
    {
      view: "network_logger",
      groups: [
        {
          type: UI.TYPE_BUTTONS,
          items: [
            {
              handler: "clear-log-network-view",
              icon: "clear-log-network-view",
              title: ui_strings.S_CLEAR_NETWORK_LOG
            }
          ]
        },
        {
          type: UI.TYPE_SWITCH,
          items: [
            {
              key: "network_logger.pause",
              icon: "pause-network-view"
            }
          ]
        },
        {
          type: UI.TYPE_SINGLE_SELECT,
          name: "selected-viewmode",
          default_value: window.settings.network_logger.get("selected-viewmode"),
          items: [
            {
              value: "graphs",
              title: ui_strings.S_HTTP_LABEL_GRAPH_VIEW,
              icon: "network-view-toggle-graphs"
            },
            {
              value: "data",
              title: ui_strings.S_HTTP_LABEL_DATA_VIEW,
              icon: "network-view-toggle-data"
            }
          ]
        },
        {
          type: UI.TYPE_SINGLE_SELECT,
          name: "type-filter",
          allow_multiple_select: true,
          items: [
            {
              text: ui_strings.S_HTTP_LABEL_FILTER_ALL,
              title: ui_strings.S_HTTP_TOOLTIP_FILTER_ALL,
              value: "all"
            },
            {
              text: ui_strings.S_HTTP_LABEL_FILTER_MARKUP,
              title: ui_strings.S_HTTP_TOOLTIP_FILTER_MARKUP,
              value: "markup"
            },
            {
              text: ui_strings.S_HTTP_LABEL_FILTER_STYLESHEETS,
              title: ui_strings.S_HTTP_TOOLTIP_FILTER_STYLESHEETS,
              value: "css"
            },
            {
              text: ui_strings.S_HTTP_LABEL_FILTER_SCRIPTS,
              title: ui_strings.S_HTTP_TOOLTIP_FILTER_SCRIPTS,
              value: "script"
            },
            {
              text: ui_strings.S_HTTP_LABEL_FILTER_IMAGES,
              title: ui_strings.S_HTTP_TOOLTIP_FILTER_IMAGES,
              value: "image"
            },
            {
              text: ui_strings.S_HTTP_LABEL_FILTER_OTHER,
              title: ui_strings.S_HTTP_TOOLTIP_FILTER_OTHER,
              value: "other_types"
            },
            {
              text: ui_strings.S_HTTP_LABEL_FILTER_XHR,
              title: ui_strings.S_HTTP_TOOLTIP_FILTER_XHR,
              value: "xhr"
            }
          ]
        },
        {
          type: UI.TYPE_SWITCH_CUSTOM_HANDLER,
          items: [
            {
              key: "network_logger.network-profiler-mode",
              icon: ""
            }
          ],
          handler: "profiler-mode-switch"
        },
        {
          type: UI.TYPE_SWITCH,
          items: [
            {
              key: "network_logger.view-raw",
              icon: "view-raw-requests-responses"
            }
          ]
        },
        {
          type: UI.TYPE_INPUT,
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

  var text_search = window.views.network_logger.text_search = new TextSearch();

  window.eventHandlers.input["network-text-search"] = function(event, target)
  {
    text_search.searchDelayed(target.value);
  };
  ActionBroker.get_instance().get_global_handler().
      register_shortcut_listener("network-text-search", cls.Helpers.shortcut_search_cb.bind(text_search));

  var on_view_created = function(msg)
  {
    if (msg.id === "network_logger")
    {
      var scroll_container = msg.container.querySelector(".entry-details");
      if (!scroll_container)
        scroll_container = msg.container.querySelector("#network-outer-container");

      if (scroll_container)
      {
        text_search.setContainer(scroll_container);
        text_search.setFormInput(
          views.network_logger.getToolbarControl(msg.container, "network-text-search")
        );
      }
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
