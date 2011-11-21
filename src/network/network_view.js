window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.NetworkLogView = function(id, name, container_class, html, default_handler) {
  this._service = new cls.NetworkLoggerService(this);
  this._loading = false;
  this._contentscroll = 0;
  this._selected = null;
  this._rendertime = 0;
  this._rendertimer = null;
  this._everrendered = false;

  this.createView = function(container)
  {
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

    if (ctx && ctx.has_resources())
    {
      this._render_tabbed_view(this._container);
      if (this._selected)
      {
        this._render_details_view(this._container, this._selected);
      }
    }
    else if (this._loading)
    {
      this._render_loading_view(this._container);
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
    this._contentscroll = this._container ? this._container.scrollTop : 0;
    this._everrendered = false;
  };

  this._render_details_view = function(container)
  {
    var ctx = this._service.get_request_context();
    var content = container.render(templates.network_log_details(ctx, this._selected));
    if (content && this._contentscroll)
      content.scrollTop = this._contentscroll;
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

  this._render_loading_view = function(container) // todo: templates
  {
    container.clearAndRender(
      ['div',
        ['p', "Loading page..."],
         'class', 'info-box'
      ]
    );
  };

  this._render_tabbed_view = function(container)
  {
    this._everrendered = true;
    var min_render_delay = 200;
    var timedelta = new Date().getTime() - this._rendertime;
    
    // an optimization here is extremely difficult. 
    // most likely because after a rendering, search-highlighting can cause another render-flow, 
    // and often the timeout caused by previous, comes back after that. that causes another timeout
    // and as soon as it comes back, re-rendering starts, and it kicks the search-highlight again
    // .. causes near-infinite callbacks.
/*
    if (this._rendertimer)
      this._rendertimer = window.clearTimeout(this._rendertimer);

    if (timedelta < min_render_delay)
    {
      // this._rendertimer = window.setTimeout(this._update_bound, min_render_delay); // this causes update_search, causes _create .. and I don't know why this results in nearly infinite loops.
      this._rendertimer = window.setTimeout(this._create.bind(this), min_render_delay);
      return;
    }
    this._rendertime = new Date().getTime();
*/
    /*
      hand-calculate network-url-list's width, so it only takes one rendering
      #network-url-list { width: 40%; min-width: 175px; }
    */
    var url_list_width = Math.ceil(Math.max(175, parseInt(container.style.width) * 0.4));
    var detail_width = parseInt(container.style.width) - url_list_width;
    var selected_viewmode = settings.network_logger.get("selected_viewmode");

    var ctx = this._service.get_request_context();

    var filters = [];
    if (this.query)
    {
      var props_whitelist = ["url"];
      if (selected_viewmode === "data")
      {
        var columns = [];
        if (this._table)
          columns = this._table.columns;

        props_whitelist = props_whitelist.concat(columns);
      }

      filters.push(
        {
          type: "text",
          content: this.query,
          props: props_whitelist.map(
            function(id)
            {
              return {
                        id: id,
                        get_val: this._tabledef.columns[id] && (
                          this._tabledef.columns[id].renderer ||
                          this._tabledef.columns[id].getter
                        )
                     }
            }, this)
        }
      );
    }
    if (this._type_filters)
    {
      filters.push(
        {
          type: "type",
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

    var resource_order;
    if (selected_viewmode === "data")
    {
      resource_order = this._resource_order;
    }
    var template = templates.network_log_main(
                     ctx, this._selected, selected_viewmode, detail_width, resource_order, this._type_filters
                   );
    var rendered = container.clearAndRender(template);

    // Render sortable table
    var table_container = rendered.querySelector(".network-data-table-container");
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
      this._table.set_data(ctx.get_resources().slice(0));
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
        renderer: function(req) {
          return req.responsecode && String(req.responsecode);
        },
        title_getter: function(req) { // todo: use this in sortable_table
          if (cls.ResourceUtil.http_status_codes[req.responsecode])
            return req.responsecode + " (" + cls.ResourceUtil.http_status_codes[req.responsecode] +")";
        },
        sorter: function(obj_a, obj_b) {
          return obj_a.responsecode > obj_b.responsecode;
        }
      },
      mime: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_MIME,
        getter: function(req) { return req.mime || ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE }
      },
      protocol: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_PROTOCOL,
        getter: function(req) { return req.urltypeName },
      },
      size: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_SIZE,
        align: "right",
        renderer: function(req) { return req.size ? String(req.size) : ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE },
        getter: function(req) { return req.size }
      },
      size_h: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_PPSIZE,
        headerlabel: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_SIZE,
        align: "right",
        getter: function(req) { return req.size },
        renderer: function(req) {
          return String(req.size ?
                        cls.ResourceUtil.bytes_to_human_readable(req.size) :
                        ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE)
        }
      },
      latency: {
        label: "Latency",
        align: "right",
        getter: function(req)
                {
                  if (req.responsestart && req.requesttime)
                    return req.responsestart - req.requesttime + "ms" 
                  
                  return "";
                }
      },
      duration: {
        label: "Duration",
        align: "right",
        getter: function(req) { return req.duration },
        renderer: function(req) {
          if (req.duration)
            return req.duration + "ms"

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
        var old_resource_order = this._resource_order;

        this._resource_order = data.map(function(res){return res.id}).join(",");
        if (this._resource_order !== old_resource_order)
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
      this.update();
    }
  }.bind(this);

  this._on_clicked_close_bound = function(evt, target)
  {
    this._selected = null;
    this.update();
  }.bind(this);

  this._on_clicked_request_bound = function(evt, target)
  {
    var rid = target.get_attr("parent-node-chain", "data-object-id");
    rid = parseInt(rid);
    if (this._selected == rid)
    {
      this._selected = null;
    }
    else
    {
      this._selected = rid;
    }
    this.update();
  }.bind(this);

  this._on_hover_request_bound = function(evt, target)
  {
    var rid = target.get_attr("parent-node-chain", "data-object-id");
    var oldhovered = this._container.querySelectorAll(".hovered");
    var newhovered = this._container.querySelectorAll("[data-object-id='" + rid + "']");
    for (var n=0, e; e=oldhovered[n]; n++) { e.removeClass("hovered"); }
    for (var n=0, e; e=newhovered[n]; n++) { e.addClass("hovered"); }
  }.bind(this);

  this._on_clicked_get_body = function(evt, target)
  {
    var rid = target.getAttribute("data-object-id");
    rid = parseInt(rid);
    this._service.request_body(rid, this.update.bind(this));
  }.bind(this);

  this._on_tooltip = function(evt, target)
  {
    var ctx = this._service.get_request_context();
    var resource_id = target.get_attr("parent-node-chain", "data-object-id");
    var template = ["ol"];
    var data = ctx.get_resource(resource_id)._my_dbg || [];
    for (var i = 0, entry; entry = data[i]; i++)
    {
      template.push(["li", entry[1] + ": " + entry[0]]);
    }
    tooltip.show(template);
  }

  var tooltip = Tooltips.register("network-tooltip", true);
  tooltip.ontooltip = this._on_tooltip.bind(this);

  this._on_clear_log_bound = function(evt, target)
  {
    if (this._service.is_paused())
      this._service.unpause();
    this._service.clear_resources();
    this.update();
  }.bind(this);

  this._on_toggle_paused_bound = function(evt, target)
  {
    if (this._service.is_paused())
      this._service.unpause();
    else
      this._service.pause();

    this.update();
  }.bind(this);

  this._on_select_network_viewmode_bound = function(evt, target)
  {
    settings.network_logger.set("selected_viewmode", target.getAttribute("data-select-viewmode"));
    this.update();
  }.bind(this);

  this._on_change_type_filter_bound= function(evt, target)
  {
    this._type_filters = target.getAttribute("data-type-filter");
    this._type_filter_is_blacklist = (target.getAttribute("data-filter-is-blacklist") === "true");
    this.update();
  }.bind(this);

  this._on_abouttoloaddocument_bound = function()
  {
    if (!this._service.is_paused())
    {
      this._loading = true;
      this.update();
    }
  }.bind(this);

  this._on_documentloaded_bound = function()
  {
    if (!this._service.is_paused())
    {
      this._loading = false;
      this.update();
    }
  }.bind(this);

  this._on_urlfinished_bound = function()
  {
    if (!this._service.is_paused() && !this._loading)
    {
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
  eh.mouseover["select-network-request"] = this._on_hover_request_bound;

  eh.click["close-request-detail"] = this._on_clicked_close_bound;
  eh.click["get-response-body"] = this._on_clicked_get_body;

  eh.click["toggle-raw-cooked-response"] = this._on_clicked_toggle_response_bound;
  eh.click["toggle-raw-cooked-request"] = this._on_clicked_toggle_request_bound;


  // todo: is it really just these few events that trigger update?
  // should be triggered whenever the data modell is updated, right?

  var doc_service = window.services['document-manager'];
  var res_service = window.services['resource-manager'];
  doc_service.addListener("abouttoloaddocument", this._on_abouttoloaddocument_bound);
  doc_service.addListener("documentloaded", this._on_documentloaded_bound);
  res_service.addListener("urlfinished", this._on_urlfinished_bound);

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
        label: ui_strings.S_INPUT_DEFAULT_TEXT_FILTER,
        type: "filter"
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