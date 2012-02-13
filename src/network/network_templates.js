window.templates || (window.templates = {});

(function(templates) {

const MIN_BAR_WIDTH = 22; // todo: this is 16 + 6 padding from network-graph-sections-hitarea, should be done separately
const TIMELINE_MARKER_WIDTH = 60;

templates.network_options_main = function(nocaching, tracking, headers, overrides)
{
  return ["div",
          ["div",
           ["h2", ui_strings.S_NETWORK_CACHING_SETTING_TITLE],
           ["p", ui_strings.S_NETWORK_CACHING_SETTING_DESC],
           ["p", ["label",
            ["input", "type", "checkbox",
             "name", "network-options-caching",
             "handler", "network-options-toggle-caching",
             "checked", nocaching ? true : false
            ],
            ui_strings.S_NETWORK_CACHING_SETTING_DISABLED_LABEL
           ]],
           ["h2", ui_strings.S_NETWORK_HEADER_OVERRIDES_TITLE],
           ["p", ui_strings.S_NETWORK_HEADER_OVERRIDES_DESC],
           ["p", ["label", ["input", "type", "checkbox", "handler", "toggle-header-overrides"].concat(overrides ? ["checked", "checked"] : []), ui_strings.S_NETWORK_HEADER_OVERRIDES_LABEL],
            templates.network_options_override_list(headers, overrides)
           ]
          ],
         "class", "network-options"
         ];
};

templates.network_options_override_list = function(headers, overrides)
{
  var tpl = ["_auto_height_textarea",
             headers.map(function(e) {return e.name + ": " + e.value}).join("\n"),
             "class", "header-override-input"
            ].concat(overrides ? [] : ["disabled", "disabled"]);
  return [
          ["br"],
          ui_strings.S_NETWORK_HEADER_OVERRIDES_PRESETS_LABEL + ":", templates.network_options_override_presets(overrides),
          ["br"],
          tpl,
          ["br"],
          ["span", ui_strings.S_NETWORK_HEADER_OVERRIDES_PRESETS_SAVE,
           "handler", "update-header-overrides",
           "class", "container-button ui-button",
           "tabindex", "1"
          ].concat(overrides ? [] : ["disabled", "disabled"])
         ];
};

templates.network_options_override_presets = function(overrides)
{
    return ["select",
            cls.ResourceUtil.header_presets.map(function(e) { return ["option", e.name, "value", e.headers] }),
            "handler", "network-options-select-preset"
            ].concat(overrides ? [] : ["disabled", "disabled"]);
};

templates.network_request_crafter_main = function(url, loading, request, response)
{
  // fixme: replace request in progress text with spinner or similar.
  return ["div",
          ["div",
           ["h2", ui_strings.S_HTTP_LABEL_URL],
           ["p", ["input", "type", "text",
            "value", url || "http://example.org",
            "handler", "request-crafter-url-change"]],
           ["h2", ui_strings.M_NETWORK_CRAFTER_REQUEST_BODY],
            ["p", ["_auto_height_textarea", request]],
           ["p", ["span", ui_strings.M_NETWORK_CRAFTER_SEND,
            "handler", "request-crafter-send",
            "unselectable", "on",
            "class", "container-button ui-button",
            "tabindex", "1"]],
           ["h2", ui_strings.M_NETWORK_CRAFTER_RESPONSE_BODY],
           ["p", ["textarea", loading ? ui_strings.M_NETWORK_CRAFTER_SEND : response]],
           "class", "padding request-crafter"
          ]
         ];
};

templates.network_incomplete_warning = function()
{
  return ["div", // todo: strings
           [
             ["span", "This only shows resources that were loaded while Dragonfly was open. "], ["span", "Reload", "class", "text_handler", "handler", "reload-window"], ["span", " to see the complete page-load. "],
             ["span", "Don't show again", "class", "text_handler", "handler", "turn-off-incomplete-warning"],
             ["span", " ", "class", "close_incomplete_warning", "handler", "close-incomplete-warning"]
           ],
         "class", "network_incomplete_warning"];
};

templates.network_log_main = function(ctx, selected, selected_viewmode, detail_width, item_order)
{
  var viewmode_render = templates["network_viewmode_" + selected_viewmode];
  if (!viewmode_render)
    viewmode_render = templates["network_viewmode_graphs"];

  var show_incomplete_warning = settings.network_logger.get("show-incomplete-warning") &&
                                !ctx.saw_main_document_abouttoloaddocument &&
                                !ctx.incomplete_warn_discarded;

  return [
    show_incomplete_warning ?
    templates.network_incomplete_warning() : [],
    [
      "div", templates.network_log_url_list(ctx, selected, item_order),
      "id", "network-url-list"
    ],
    [
      "div", [
        "div", viewmode_render(ctx, selected, detail_width),
        "class", "network-data-container " + selected_viewmode
      ],
      "class", "network-main-container"
    ]
  ]
};

templates.network_viewmode_graphs = function(ctx, selected, width)
{
  var basetime = ctx.get_starttime();
  var duration = ctx.get_coarse_duration(MIN_BAR_WIDTH, width);
  var rows = templates.network_graph_rows(ctx, selected, width, basetime, duration);

  var template = [];
  if (duration)
  {
    var stepsize = templates.grid_info(duration, width, (TIMELINE_MARKER_WIDTH / 2) + MIN_BAR_WIDTH);
    var gridwidth = Math.round((width / duration) * stepsize);
    var headerrow = templates.network_timeline_row(width, stepsize, gridwidth);

    var domcontentloaded = -1;
    var load = -1;
    // place the domcontentloaded and load events if available
    // todo: very much work in progress
    if (ctx.saw_main_document_abouttoloaddocument)
    {
      var first_document_id = ctx.get_entries().map(function(entry){return entry.document_id})[0];
      // todo: an initial redirect look like the top document, but it's not. no notifications are shown then.
      var notifications = ctx._document_notifications[first_document_id];
      if (notifications)
      {
        var scale = width / duration;
        if (notifications["DOMCONTENTLOADED_START"])
        {
          domcontentloaded = (notifications["DOMCONTENTLOADED_START"].time - basetime) * scale;
          // console.log("DOMCONTENTLOADED_START of main resource:", notifications["DOMCONTENTLOADED_START"].time - basetime, "after basetime");
        }
        if (notifications["LOAD_START"])
        {
          load = (notifications["LOAD_START"].time - basetime) * scale;
          // console.log("LOAD_START of main resource:", notifications["LOAD_START"].time - basetime, "after basetime");
        }
      }
    }

    template = ["div", headerrow, rows,
                  "id", "graph",
                  "style", ["background-image: -o-linear-gradient(",
                                               "0deg,",
                                               "#e5e5e5 0px,",
                                               "#e5e5e5 1px,",
                                               "transparent 1px",
                                              "),",
                                              "-o-linear-gradient(",
                                               "0deg,",
                                               "#5acaec 0px,",
                                               "#5acaec 1px,",
                                               "transparent 1px",
                                              "),",
                                              "-o-linear-gradient(",
                                               "0deg,",
                                               "#64b56b 0px,",
                                               "#64b56b 1px,",
                                               "transparent 1px",
                                              ");",
                           "background-position: 0 21px, ",
                            domcontentloaded + "px 21px,",
                            load + "px 21px;",
                           "background-repeat: repeat-x, no-repeat, no-repeat;",
                           "background-size: " + gridwidth + "px 100%;"].join("")
               ];
  }
  return template;
}

templates.network_viewmode_data = function(ctx, selected, detail_width)
{
  return ["div", "class", "network-data-table-container"];
}

templates.network_log_url_list = function(ctx, selected, item_order)
{
  var itemfun = function(req)
  {
    var error_responses = /5\d{2}|4\d{2}/;
    var had_error_response = error_responses.test(req.responsecode);
    var disqualified = !req.touched_network || req.unloaded;

    var url_tooltip = req.human_url;
    var context_info;
    if (req.unloaded)
      context_info = ui_strings.S_HTTP_UNREFERENCED;
    else if (req.no_request_made)
      context_info = ui_strings.S_HTTP_NOT_REQUESTED;
    else if (had_error_response)
      context_info = req.responsecode + " (" + cls.ResourceUtil.http_status_codes[req.responsecode] + ")";

    if (context_info)
      url_tooltip = context_info + " - " + url_tooltip;

    return ["li",
            templates.network_request_icon(req),
            ["span",
              req.filename || req.human_url,
              "data-tooltip-text" , url_tooltip,
              "data-tooltip", "network-url-list-tooltip"
            ],
            "handler", "select-network-request",
            "data-object-id", String(req.id),
            "class", (selected === req.id ? "selected " : " ") + 
                     (had_error_response ? "network-error " : " ") + 
                     (disqualified ? "disqualified " : "")
           ];
  };

  var items = ctx.get_entries_filtered().slice(0);
  // Could use copy_object instead, because the template doesn't need the methods of the resources.
  // But it's probably more overhead to copy the whole thing then it is to just make a new array pointing
  // to the old objects
  if (item_order)
  {
    item_order = item_order.split(",");
    items.sort(function(a, b)
      {
        var ind_a = item_order.indexOf(a.id);
        var ind_b = item_order.indexOf(b.id);

        if (ind_a === ind_b)
          return 0;

        if (ind_a > ind_b)
          return 1;

        return -1;
      }
    );
  }
  return [
    ["ol", items.map(itemfun),
      "class", "network-log-url-list"]
  ]
};

templates.network_request_icon = function(request)
{
  var classname = "resource-icon resource-type-" + request.type;
/*
  // todo: long lasting discussion to add some XHR indicator to the icon
  if (request.load_origin) // === "xhr"
    classname += " request-origin-" + request.load_origin;
*/
  return ["span", "class", classname];
};

templates.network_timeline_row = function(width, stepsize, gridwidth)
{
  var labels = [];
  var cnt = Math.ceil(width / gridwidth);
  var max_val = stepsize * cnt;
  var unit = [1, "ms"];
  if (max_val > 1000)
    unit = [1000, "s"];
  
  while (stepsize && --cnt >= 0)
  {
    var left_val = gridwidth * cnt - TIMELINE_MARKER_WIDTH / 2;
    var val_str = (stepsize * cnt) / unit[0];
    val_str = Math.round(val_str * 100) / 100;
    labels.push(["span", "" + val_str + unit[1],
                 "style", "left: " + left_val + "px;",
                 "class", "timeline-marker"
                 ]);
  }

  return ["div", labels, "class", "network-timeline-row"];
};

templates.network_graph_rows = function(ctx, selected, width, basetime, duration)
{
  var tpls = [];
  var entries = ctx.get_entries_filtered();

  for (var n = 0, entry; entry = entries[n]; n++)
  {
    tpls.push(templates.network_graph_row(entry, selected, width, basetime, duration));
  }
  return tpls;
};

templates.network_graph_row = function(entry, selected, width, basetime, duration)
{
  var scale = width / duration;
  var start = (entry.starttime - basetime) * scale;
  var padding_left_hitarea = 3;
  var item_container = ["span",
                        templates.network_graph_sections(entry, width, duration),
                        "class", "network-graph-sections-hitarea",
                        "data-tooltip", "network-graph-tooltip",
                        "style", "margin-left:" + (start - padding_left_hitarea) + "px;"];

  return ["div", item_container,
          "class", "network-graph-row " + (selected === entry.id ? "selected " : ""),
          "handler", "select-network-request",
          "data-object-id", String(entry.id)];
}

templates.network_graph_sections = function(entry, width, duration, do_tooltip)
{
  var scale = width / duration;
  var gaps = entry.event_gaps;
  var sections = entry.event_gaps.map(function(section){
    if (section.val)
    {
      return [
        "span",
        "class", "network-section network-" + section.classname,
        "style", "width:" + section.val * scale + "px;"
      ];
    }
  });

  return ["span", sections.length && sections || [],
           "class", "network-graph-sections",
           "data-tooltip", do_tooltip && "network-graph-tooltip",
           "data-object-id", String(entry.id)
         ];
};

templates.network_graph_entry_tooltip = function(entry)
{
  if (!entry)
    return;

  const height = 155;
  var duration = entry.get_duration();
  if (duration && entry.events)
  {
    var graphical_sections = [];
    var scale = height / duration;
    var total_length_string = new Number(duration).toFixed(2) + "ms";

    entry.event_gaps.forEach(function(section){
      if (section.val)
      {
        graphical_sections.push([
          "div",
          "class", "network-tooltip-section network-" + section.classname,
          "style", "height:" + section.val * scale + "px;"
        ]);
      }
    });

    var event_rows = entry.event_gaps.map(function(gap, index, arr)
    {
      if (gap.val_string)
      {
        return ["tr", 
                 ["td", gap.val_string, "class", "time_data mono"],
                 ["td", gap.title, "class", "gap_title"],
                 ini.debug ? ["td", "(" + gap.from_event.name + " to " + gap.to_event.name + ")", "class", "gap_title"] : []
               ];
      }
      return [];
    });
    event_rows.push(["tr", ["td", total_length_string, "class", "time_data mono"], ["td", "Total time"], "class", "sum"]);

    const CHARWIDTH = 7; // todo: we probably have that around somewhere where its dynamic
    const LINEHEIGHT = 19;

    var svg_width = 100.5;
    var x_start = 1.5;
    var y_start = 0.5;
    var y_ref = 0;
    var x_end = svg_width;
    var y_end = 0;

    var pathes = entry.event_gaps.map(function(gap, index, arr)
    {
      if (gap.val)
      {
        var height = Math.round(gap.val * scale);
        y_start = y_ref + (height / 2);
        y_ref += height;
        y_end = (index * LINEHEIGHT) + (LINEHEIGHT / 2) + 0.5;
        return ["path", "d", "M" + x_start + " " + y_start + " L" + x_end + " " + y_end, "stroke", "#BABABA"]
      }
    });

    var svg_height = Math.max(y_start, y_end, y_ref);

    return ["div",
      [
        ini.debug ?
          ["h2", "Requested " + entry.resource + " at " +  entry.start_time_string] : 
          ["h2", "Requested at " +  entry.start_time_string],
        ["div",
          ["div",
            ["div", graphical_sections, "class", "network-tooltip-graph-sections"],
            "class", "network-tooltip-graph"
          ],
          ["div",
            ["svg:svg", pathes,
              "width",  Math.ceil(svg_width) + "px",
              "height", Math.ceil(svg_height) + "px",
              "version", "1.1",
              "style", "position: absolute;"
            ], "class", "network-tooltip-pointers"],
          ["div",
            ["table", event_rows],
            "class", "network-tooltip-legend"
          ],
        "class", "network-tooltip-row"]
      ], "class", "network-tooltip-container"
    ];
  }
}


templates.grid_info = function(duration, width, padding)
{
  if (duration > 0)
  {
    var draw_line_every = 150; // px
    var draw_lines = Math.round(width / draw_line_every);
    
    var value = oldval = Number(Number(duration / draw_lines).toPrecision(1)); // what this returns is the duration of one section
    var val_in_px = width / duration * Number(value);

    // if the last line comes too close to the edge, the value until it fits.
    // need to modify the actual ms value to keep it nice labels on the result,
    // at least while it gets shown in ms
    while (width % (val_in_px * draw_lines) < padding)
    {
      value--;
      val_in_px = width / duration * value;
    }

    return value;
  }
}

})(window.templates);