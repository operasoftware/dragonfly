"use strict";

window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.NetworkLogView = function(id, name, container_class, html, default_handler, network_logger)
{
  var MIN_RENDER_DELAY = 200;
  var DEFAULT = "default";
  var DETAILS = "details";
  this.network_logger = network_logger;
  this._container_scroll_top = 0;
  this.selected = null;
  this._rendertime = 0;
  this._render_timeout = 0;
  this._graph_tooltip_id = null;
  this._type_filters = null;
  this._last_render_speed = 0;
  this._last_updated_entry = "";
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
          this._last_updated_entry = "";
          this._render_timeout = window.setTimeout(this._create_delayed_bound,
                                                   min_render_delay - timedelta);
          return;
        }
      }
    }
    this.needs_instant_update = false;
    var started_rendering = Date.now();
    this.text_search.set_query_selector("[handler='select-network-request']");
    if (container)
      this._container = container;

    var ctx = this.network_logger.get_logger_context();
    if (ctx && !ctx.after_clear)
    {
      if (this._type_filters)
        ctx.set_filters(this._type_filters);
      this._render_main_view(this._container);
      this.text_search.update_search();
    }
    else
    {
      this._overlay.hide();
      this._render_click_to_fetch_view(this._container);
    }

    this._last_updated_entry = "";
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
    var ctx = this.network_logger.get_logger_context();
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
    var ctx = this.network_logger.get_logger_context();

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
    var window_contexts = ctx.get_window_contexts();
    var template = ["div", templates.network.main(
                     ctx, window_contexts, entries, this.selected, detail_width, table_template
                   ), "id", "network-outer-container",
                      "data-menu", "network-logger-context"];
    var rendered = this._container.clearAndRender(template);

    if (this.selected && ctx.get_entry_from_filtered(this.selected))
    {
      if (this._overlay.is_active)
      {
        if (!this._last_updated_entry || this._last_updated_entry == this.selected)
          this._overlay.update();
      }
      else
        this._overlay.show();

      if (is_data_mode)
      {
        var sel_row = rendered.querySelector("tr[data-object-id='" + this.selected + "']");
        if (sel_row)
          sel_row.addClass("selected");

      }
    }
    else
    {
      this._overlay.hide();
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

  var selection_func = function(accessor)
  {
    if (this.selected)
    {
      var selected_node = document.querySelector("[data-object-id='" + this.selected + "']");
      if (selected_node &&
          selected_node[accessor] &&
          selected_node[accessor].dataset.objectId)
      {
        this.selected = selected_node[accessor].dataset.objectId;
        selected_node = document.querySelector("[data-object-id='" + this.selected + "']");
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
    if (this.selected == item_id)
      this.selected = null;
    else
      this.selected = item_id;

    this.needs_instant_update = true;
    this.update();
    if (this.graph_tooltip)
      this.graph_tooltip.hide();

    if (this.url_tooltip)
      this.url_tooltip.hide();
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
    if (target.firstElementChild)
      this._container_scroll_top = target.firstElementChild.scrollTop;
  }.bind(this);

  this._on_graph_tooltip_bound = function(evt, target)
  {
    var ctx = this.network_logger.get_logger_context();
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
    var ctx = this.network_logger.get_logger_context();
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
    // this.network_logger.remove_logger_request_context();
    var ctx = this.network_logger.get_logger_context();
    if (ctx)
    {
      ctx.clear();
      this.needs_instant_update = true;
      this.update();
    }
  }.bind(this);

  this._on_close_incomplete_warning_bound = function(evt, target)
  {
    var ctx = this.network_logger.get_logger_context();
    var window_id = Number(target.get_attr("parent-node-chain", "data-reload-window-id"));
    var window_context = ctx.get_window_context(window_id);
    if (window_context)
      window_context.discard_incomplete_warning();
    this.needs_instant_update = true;
    this.update();
  }.bind(this);

  this._close_detail_overlay_bound = function(evt, target)
  {
    if (this.selected)
    {
      this.selected = null;
      this.needs_instant_update = true;
      this.update();
      return false;
    }
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
          var ctx = this.network_logger.get_logger_context();
          if (ctx)
          {
            var is_paused = ctx.is_paused;
            var pause = settings.network_logger.get(message.key);
            if (is_paused && !pause)
              ctx.unpause();
            else if (!is_paused && pause)
              ctx.pause();
          }
        }
        else if (message.key === "network-profiler-mode")
        {
          var set_profile = settings.network_logger.get(message.key) ?
                            window.app.profiles.HTTP_PROFILER : window.app.profiles.DEFAULT;
          var current_profile = settings.general.get("profile-mode");
          if (current_profile !== set_profile)
            window.services.scope.enable_profile(set_profile);
        }
        this.needs_instant_update = true;
        this.update();
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
        is_blacklist: true
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
        is_blacklist: true
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

  this._on_context_established_bound = function(message)
  {
    if (message.context_type === cls.NetworkLogger.CONTEXT_TYPE_LOGGER)
    {
      var ctx = this.network_logger.get_logger_context();
      if (this._type_filters)
        ctx.set_filters(this._type_filters);
    }
  }.bind(this);

  this._view_hidden_bound = function(message)
  {
    if (message.id != "network-detail-overlay")
      return;

    if (!this._overlay.is_active)
    {
      this.selected = null;
      this.needs_instant_update = true;
      this.update();
    }
  }.bind(this);

  this._on_context_removed_bound = function(message)
  {
    if (message.context_type === cls.NetworkLogger.CONTEXT_TYPE_LOGGER)
      this.update();
  }.bind(this);

  this._on_resource_update_bound = function(message)
  {
    if (message.is_paused)
      return;

    if (message.id)
      this._last_updated_entry = message.id;
    this.update();
  }.bind(this);

  this._init = function(id, name, container_class, html, default_handler)
  {
    var eh = window.event_handlers;
    var messages = window.messages;

    eh.click["select-network-request"] = this._on_clicked_request_bound;
    eh.mouseover["select-network-request"] = this._on_mouseover_entry_bound;
    eh.mouseout["select-network-request"] = this._on_mouseout_entry_bound;
    eh.scroll["network-logger"] = this._on_scroll_bound;

    messages.addListener("single-select-changed", this._on_single_select_changed_bound);
    messages.addListener("setting-changed", this._on_setting_changed_bound);
    messages.addListener("hide-view", this._view_hidden_bound);
    eh.click["select-network-viewmode"] = this._on_select_network_viewmode_bound;
    eh.click["type-filter-network-view"] = this._on_change_type_filter_bound;
    eh.click["profiler-mode-switch"] = this._on_toggle_network_profiler_bound;
    eh.click["close-incomplete-warning"] = this._on_close_incomplete_warning_bound;

    eh.click["toggle-raw-cooked-response"] = this._on_clicked_toggle_response_bound;
    eh.click["toggle-raw-cooked-request"] = this._on_clicked_toggle_request_bound;
    eh.click["clear-log-network-view"] = this._on_clear_log_bound;

    this.network_logger.addListener("context-added", this._on_context_established_bound);
    this.network_logger.addListener("context-removed", this._on_context_removed_bound);
    this.network_logger.addListener("resource-update", this._on_resource_update_bound);

    ActionHandlerInterface.apply(this);
    this._handlers = {
      "select-next-entry": selection_func.bind(this, "nextElementSibling"),
      "select-previous-entry": selection_func.bind(this, "previousElementSibling"),
      "close-details": this._close_detail_overlay_bound
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

    this._overlay = this.register_overlay(new cls.NetworkDetailOverlayView("network-detail-overlay",
                                                                           "network-detail-overlay scroll",
                                                                           null,
                                                                           "network-detail-overlay"));
    this._overlay.shared_shortcuts = this.id;
    cls.NetworkDetailOverlayView.create_ui_widgets();

    this._type_filters = ["all"].map(this._map_filter_bound);
    this.init(id, name, container_class, html, default_handler);
  }

  this._init(id, name, container_class, html, default_handler);
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
      "track-content": true
    },
    // key-label map
    {
      "pause": ui_strings.S_TOGGLE_PAUSED_UPDATING_NETWORK_VIEW,
      "network-profiler-mode": ui_strings.S_BUTTON_SWITCH_TO_NETWORK_PROFILER,
      "track-content": ui_strings.S_NETWORK_CONTENT_TRACKING_SETTING_TRACK_LABEL
    },
    // settings map
    {
      checkboxes: ["track-content"]
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

  window.event_handlers.input["network-text-search"] = function(event, target)
  {
    text_search.searchDelayed(target.value);
  };
  ActionBroker.get_instance().get_global_handler().
      register_shortcut_listener("network-text-search", cls.Helpers.shortcut_search_cb.bind(text_search));

  var on_view_created = function(msg)
  {
    if (msg.id === "network_logger")
    {
      var scroll_container = msg.container.querySelector("#network-outer-container");
      if (scroll_container)
      {
        text_search.set_container(scroll_container);
        text_search.set_form_input(
          views.network_logger.getToolbarControl(msg.container, "network-text-search")
        );
      }
    }
  };

  var on_view_destroyed = function(msg)
  {
    if (msg.id == "network_logger")
    {
      text_search.cleanup();
    }
  };

  var messages = window.messages;
  messages.addListener("view-created", on_view_created);
  messages.addListener("view-destroyed", on_view_destroyed);
}

cls.NetworkDetailOverlayView = function(id, container_class, html, default_handler, service)
{
  this._details_scroll_top = 0;
  this._details_scroll_left = 0;
  this._init(id, container_class, html, default_handler);
};

cls.NetworkDetailOverlayViewPrototype = function()
{
  this.createView = function(container)
  {
    var parent_view = window.views[this.parent_view_id];
    if (parent_view && parent_view.selected)
    {
      var ctx = parent_view.network_logger.get_logger_context();
      var entry = ctx.get_entry_from_filtered(parent_view.selected);
      if (entry)
      {
        var get_body = entry.should_get_body();
        if (get_body)
          ctx.get_resource(entry);

        container.clearAndRender(this._render_details_view(entry));
        this.text_search.update_search();
        if (this._details_scroll_top)
          container.scrollTop = this._details_scroll_top;

        if (this._details_scroll_left)
          container.scrollLeft = this._details_scroll_left;
      }
    }
  };

  this._render_details_view = function(entry)
  {
    return templates.network.details(entry);
  };

  this._on_toggle_expand_request_response = function(event, target)
  {
    var key = target.dataset.isResponse ? "expand-responses" : "expand-requests";
    var set_active = !settings["network-detail-overlay"].get(key);
    settings["network-detail-overlay"].set(key, set_active);
    this.needs_instant_update = true;
    this.update();
  };

  this._on_scroll = function(evt, target)
  {
    this._details_scroll_top = evt.target.scrollTop;
    this._details_scroll_left = evt.target.scrollLeft;
  };

  this._on_setting_changed = function(message)
  {
    switch (message.id)
    {
      case "network-detail-overlay":
      {
        this.needs_instant_update = true;
        this.update();
        break;
      }
    }
  };

  this._init = function(id, container_class, html, default_handler)
  {
    var messages = window.messages;
    messages.addListener("setting-changed", this._on_setting_changed.bind(this));

    var eh = window.event_handlers;
    eh.scroll["network-detail-overlay"] = this._on_scroll.bind(this);
    eh.click["toggle-expand-request-response"] = this._on_toggle_expand_request_response.bind(this);

    ActionHandlerInterface.apply(this);
    this.handle = function(action_id, event, target)
    {
      var parent_view = window.views[this.parent_view_id];
      if (parent_view)
        return parent_view.handle(action_id, event, target);
    }
    this.id = id;
    ActionBroker.get_instance().register_handler(this);

    this.init(id, container_class, html, default_handler);
  }
}

cls.NetworkDetailOverlayViewPrototype.prototype = new OverlayView();
cls.NetworkDetailOverlayView.prototype = new cls.NetworkDetailOverlayViewPrototype();

cls.NetworkDetailOverlayView.create_ui_widgets = function()
{
  new Settings(
    // view_id
    "network-detail-overlay",
    // key-value map
    {
      "view-parsed": true,
      "wrap-detail-view": true,
      "expand-requests": true,
      "expand-responses": true
    },
    // key-label map
    {
      "view-parsed": ui_strings.S_NETWORK_PARSED_VIEW_LABEL,
      "wrap-detail-view": ui_strings.S_NETWORK_WRAP_LINES_LABEL
    }
  );

  new ToolbarConfig({
    view: "network-detail-overlay",
    groups: [
      {
        type: UI.TYPE_SWITCH,
        items: [
          {
            key: "network-detail-overlay.view-parsed",
            icon: "view-parsed"
          }
        ]
      },
      {
        type: UI.TYPE_SWITCH,
        items: [
          {
            key: "network-detail-overlay.wrap-detail-view",
            icon: "wrap-detail-view"
          }
        ]
      },
      {
        type: UI.TYPE_INPUT,
        items: [
          {
            handler: "network-details-text-search",
            shortcuts: "network-details-text-search",
            title: ui_strings.S_SEARCH_INPUT_TOOLTIP,
            label: ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH
          }
        ]
      }
    ]
  });

  var text_search = window.views["network-detail-overlay"].text_search = new TextSearch();
  window.event_handlers.input["network-details-text-search"] = function(event, target)
  {
    text_search.searchDelayed(target.value);
  };
  ActionBroker.get_instance().get_global_handler().
      register_shortcut_listener("network-details-text-search", cls.Helpers.shortcut_search_cb.bind(text_search));

  var on_view_created = function(msg)
  {
    if (msg.id === "network-detail-overlay")
    {
      var scroll_container = msg.container;
      if (scroll_container)
      {
        text_search.set_container(scroll_container);
        text_search.set_form_input(
          views["network-detail-overlay"].getToolbarControl(msg.container, "network-details-text-search")
        );
      }
    }
  };

  var on_view_destroyed = function(msg)
  {
    if (msg.id == "network-detail-overlay")
    {
      text_search.cleanup();
    }
  };

  var messages = window.messages;
  messages.addListener("view-created", on_view_created);
  messages.addListener("view-destroyed", on_view_destroyed);
};
