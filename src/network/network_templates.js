"use strict";

window.templates || (window.templates = {});

(function(templates) {

var MIN_BAR_WIDTH = 16;
var SECTIONS_HITAREA_PADDING = 6;
var TIMELINE_MARKER_WIDTH = 60;
var GRAPH_PADDING = (TIMELINE_MARKER_WIDTH / 2) + MIN_BAR_WIDTH + SECTIONS_HITAREA_PADDING;

var UNREFERENCED = "unreferenced";
var ERROR_RESPONSE = "error_response";
var NOT_REQUESTED = "not_requested";

templates.network_options_main = function(nocaching, tracking, headers, overrides)
{
  return ["div",
          ["div",
           ["h2", ui_strings.S_NETWORK_CACHING_SETTING_TITLE],
           ["p", ui_strings.S_NETWORK_CACHING_SETTING_DESC],
           ["p", ["label",
            ["input",
              "type", "checkbox",
              "class", "checkbox",
              "name", "network-options-caching",
              "handler", "network-options-toggle-caching",
              "checked", nocaching ? true : false
            ],
            ui_strings.S_NETWORK_CACHING_SETTING_DISABLED_LABEL
           ]],
           ["h2", ui_strings.S_NETWORK_HEADER_OVERRIDES_TITLE],
           ["p", ui_strings.S_NETWORK_HEADER_OVERRIDES_DESC],
           ["p",
             ["label",
              ["input",
                "type", "checkbox",
                "class", "checkbox",
                "handler", "toggle-header-overrides"
              ].concat(overrides ? ["checked", "checked"] : []), ui_strings.S_NETWORK_HEADER_OVERRIDES_LABEL],
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
           "class", "ui-button",
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
            "class", "ui-button",
            "tabindex", "1"]],
           ["h2", ui_strings.M_NETWORK_CRAFTER_RESPONSE_BODY],
           ["p", ["textarea", loading ? ui_strings.M_NETWORK_CRAFTER_SEND : response]],
           "class", "padding request-crafter"
          ]
         ];
};

templates.network_incomplete_warning = function()
{
  return ["div",
           ["span",
             ui_strings.S_HTTP_INCOMPLETE_LOADING_GRAPH
           ],
           ["div",
             ["span",
               ui_strings.S_MENU_RELOAD_DEBUG_CONTEXT_SHORT,
               "class", "text_handler",
               "handler", "reload-window"
             ]
           ],
           ["span",
             " ",
             "class", "close_incomplete_warning",
             "handler", "close-incomplete-warning"
           ],
           "class", "info-box network_incomplete_warning"
         ];
};

templates.network_log_main = function(ctx, entries, selected, detail_width, table_template)
{
  var show_incomplete_warning = !ctx.saw_main_document_abouttoloaddocument &&
                                !ctx.incomplete_warn_discarded;

  return [
    [
      "div", templates.network_log_url_list(ctx, entries, selected),
      "id", "network-url-list-container"
    ],
    [
      "div", [
        "div", table_template || templates.network_viewmode_graphs(
                                   ctx, entries, selected, detail_width
                                 ),
        "class", "network-data-container " + (table_template ? "data" : "graphs")
      ],
      "class", "network-main-container"
    ],
    [
      "div", templates.network_log_summary(entries), "class", "network-summary"
    ],
    show_incomplete_warning ?
      templates.network_incomplete_warning() : []
  ];
};

templates.network_viewmode_graphs = function(ctx, entries, selected, width)
{
  var basetime = ctx.get_starttime();
  var duration = ctx.get_coarse_duration(
                   MIN_BAR_WIDTH + SECTIONS_HITAREA_PADDING, width
                 );
  var rows = templates.network_graph_rows(
               ctx, entries, selected, width, basetime, duration
             );

  var template = [];
  if (duration)
  {
    var stepsize = templates.grid_info(duration, width);
    var gridwidth = Math.round((width / duration) * stepsize);
    var headerrow = templates.network_timeline_row(width, stepsize, gridwidth);

    template = ["div", headerrow, rows,
                  "id", "graph",
                  "style", "background-size: " + gridwidth + "px 100%;"
               ];
  }
  return template;
}

templates.network_log_url_list_entry = function(selected, entry)
{
  var had_error_response = entry.had_error_response;
  var not_requested = !entry.touched_network;

  return ["li",
           templates.network_request_icon(entry),
           ["span",
             entry.short_distinguisher || entry.human_url,
             "class", "network-url",
             "data-tooltip", "network-url-list-tooltip"
           ],
           "handler", "select-network-request",
           "data-object-id", String(entry.id),
           "class", (selected === entry.id ? "selected" : "") + 
                    (had_error_response ? " " + ERROR_RESPONSE : "") + 
                    (not_requested ? " " + NOT_REQUESTED : "")
         ];
};

templates.network_log_url_list = function(ctx, entries, selected)
{
  return [
    ["ol",
      entries.map(
        templates.network_log_url_list_entry.bind(null, selected)
      ),
      "class", "network-log-url-list sortable-table-style-list"]
  ]
};

templates.network_log_url_tooltip = function(entry)
{
  var URL_TYPE_DEF = cls.ResourceManager["1.2"].UrlLoad.URLType;
  var HTTP_STATUS_CODES = cls.ResourceUtil.http_status_codes;

  var template = [];
  var context_string = "";
  var context_type = "";

  if (entry.is_unloaded)
  {
    context_string = ui_strings.S_HTTP_UNREFERENCED;
    context_type = UNREFERENCED;
  }
  else if (entry.had_error_response)
  {
    context_string = entry.responsecode + 
                     " (" + HTTP_STATUS_CODES[entry.responsecode] + ")";
    context_type = ERROR_RESPONSE;
  }
  else if (entry.no_request_made)
  {
    if (entry.urltype_name === URL_TYPE_DEF[URL_TYPE_DEF.FILE])
    {
      context_string = ui_strings.S_HTTP_SERVED_OVER_FILE;
      context_type = NOT_REQUESTED;
    }
    else if (entry.urltype_name === URL_TYPE_DEF[URL_TYPE_DEF.DATA])
    {
      // data uri, the tooltip is explicit enough in these cases
    }
    else
    {
      // otherwise just not requested, probably chached
      context_string = ui_strings.S_HTTP_NOT_REQUESTED;
      context_type = NOT_REQUESTED;
    }
  }

  if (context_string && context_type)
  {
    template.push(["span", context_string, "class", context_type]);
  }
  template.push(["span", " " + entry.human_url]);

  if (entry.search)
  {
    template.push(
      ["table",
        entry.params.map(function(param){
          return ["tr",
                   ["td", param.key],
                   ["td", param.value],
                   "class", "string mono"
                 ];
        }),
        "class", "network_get_params"
      ]
    );
  }
  return template;
};

templates.network_log_summary = function(entries)
{
  var total_size = entries.map(function(entry){
                        return entry.size || 0
                      }).reduce(function(prev, curr){
                        return prev + curr;
                      }, 0);
  var length = entries.length;
  var str = length + " " + (length === 1 ? ui_strings.S_NETWORK_REQUEST
                                         : ui_strings.S_NETWORK_REQUESTS);

  if (total_size)
    str += ", " + cls.ResourceUtil.bytes_to_human_readable(total_size);

  return ["div", str];
};

templates.network_request_icon = function(entry)
{
  var classname = "resource-icon resource-type-" + entry.type;
  if (entry.load_origin_name)
    classname += " load-origin-" + entry.load_origin_name;

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
    var val_for_str = (stepsize * cnt) / unit[0];
    val_for_str = Math.round(val_for_str * 100) / 100;
    labels.push(["span", val_for_str + " " + unit[1],
                 "style", "left: " + left_val + "px;",
                 "class", "timeline-marker"
                 ]);
  }

  return ["div", labels, "class", "network-timeline-row"];
};

templates.network_graph_rows = function(ctx, entries, selected, width, basetime, duration)
{
  return entries.map(function(entry) {
    return templates.network_graph_row(entry, selected, width, basetime, duration);
  });
};

templates.network_graph_row = function(entry, selected, width, basetime, duration)
{
  var scale = width / duration;
  var start = (entry.starttime - basetime) * scale;
  var PADDING_LEFT_HITAREA = 3;
  var item_container = ["span",
                        templates.network_graph_sections(entry, width, duration),
                        "class", "network-graph-sections-hitarea",
                        "data-tooltip", "network-graph-tooltip",
                        "style", "margin-left:" + (start - PADDING_LEFT_HITAREA) + "px;"];

  return ["div", item_container,
          "class", "network-graph-row " + (selected === entry.id ? "selected " : ""),
          "handler", "select-network-request",
          "data-object-id", String(entry.id)];
}

templates.network_graph_section_colors = {
  waiting: "#7381FF",
  request: "#de5b5b",
  receiving: "#79db86",
  blocked: "#adadad",
  irregular: "#ebcc78"
}

templates.network_graph_sections = function(entry, width, duration, do_tooltip)
{
  if (!duration)
    return;

  var scale = width / duration;
  var px_duration = entry.duration * scale;

  return ["span",
           "class", "network-graph-sections",
           "data-tooltip", do_tooltip ? "network-graph-tooltip" : "",
           "style", "width: " + px_duration + "px;" +
                    "background-image: " +
                        "-o-linear-gradient(90deg," +
                                  "transparent 0%," +
                                  "rgba(255, 255, 255, 0.25) 100%), " +
                        "-o-linear-gradient(0deg," +
                          templates.network_graph_sections_style(entry, width, duration) +
                        ");"
         ];
};

templates.network_graph_sections_style = function(entry, size, duration)
{
  if (!entry.event_sequence.length)
    return "transparent 0, transparent 100%";

  var scale = size / duration;
  var to = 0;
  var gradient_vals = entry.event_sequence.map(function(section) {
    var from = to;
    var val = section.val * scale;
    to += val;

    var color = templates.network_graph_section_colors[section.classname];
    return color + " " + Math.round(from) + "px," +  color + " " + Math.round(to) + "px";
  }).join(",");
  // End transparent. This will let the fallback background-color show in case min-width applies.
  gradient_vals += ",transparent " + Math.round(to) + "px";
  return gradient_vals;
};

templates.network_graph_tooltip_tr = function(stop, index, arr)
{
  return ["tr",
           ["td", stop.val_string, "class", "time_data mono"],
           ["td", stop.title, "class", "gap_title"],
           (window.ini && ini.debug)
             ? ["td", "(" + stop.from_event.name + " to " + stop.to_event.name + ")", "class", "gap_title"]
             : []
         ];
};

templates.network_graph_tooltip = function(entry, mono_lineheight)
{
  if (!entry)
    return;

  var HEIGHT = 155;
  var duration = entry.duration;
  var scale = HEIGHT / duration;
  if (duration && entry.events)
  {
    var event_rows = entry.event_sequence.map(templates.network_graph_tooltip_tr);
    event_rows.push(["tr",
                      ["td", duration.toFixed(2) + " ms", "class", "time_data mono"],
                      ["td", ui_strings.S_HTTP_LABEL_DURATION], "class", "sum"]);

    if (!templates.network_tt_vert_padding)
    {
      var padd = document.styleSheets.getDeclaration(".network-tooltip-legend .time_data")
                  .getPropertyValue("padding")
                  .split(" ").map(function(n){return parseInt(n, 10)});
      templates.network_tt_vert_padding = padd[0] + padd[2];
    }

    var lineheight = mono_lineheight + templates.network_tt_vert_padding;
    var svg_width = 100.5;
    var x_start = 1.5;
    var y_start = 0.5;
    var y_ref = 0;
    var x_end = svg_width;
    var y_end = 0;

    var pathes = entry.event_sequence.map(function(row, index, arr)
    {
      if (!row.val)
        return "";

      var height = Math.round(row.val * scale);
      y_start = y_ref + (height / 2);
      y_ref += height;
      y_end = (index * lineheight) + (lineheight / 2) + 0.5;

      return(["path", "d", "M" + x_start + " " + y_start + " L" + x_end + " " + y_end, "stroke", "#BABABA"]);
    });

    var svg_height = Math.max(y_start, y_end, y_ref);

    return ["div",
      [
        (window.ini && ini.debug) ?
          ["h2", "Requested " + entry.resource_id + " at " +  entry.start_time_string] : 
          ["h2", ui_strings.S_HTTP_REQUESTED_HEADLINE.replace("%s", entry.start_time_string)],
        ["div",
          ["div",
            ["div",
              "style", "height: " + HEIGHT + "px; " +
                       "background-image: -o-linear-gradient(270deg," +
                          templates.network_graph_sections_style(entry, HEIGHT, duration) +
                        ");",
              "class", "network-tooltip-graph"
            ],
            "class", "network-tooltip-col"
          ],
          ["div",
            ["svg:svg", pathes,
              "width",  Math.ceil(svg_width) + "px",
              "height", Math.ceil(svg_height) + "px",
              "version", "1.1"
            ], "class", "network-tooltip-col network-tooltip-pointers"],
          ["div",
            ["table", event_rows],
            "class", "network-tooltip-col network-tooltip-legend"
          ],
        "class", "network-tooltip-row"]
      ], "class", "network-tooltip-container"
    ];
  }
}

templates.grid_info = function(duration, width)
{
  if (duration > 0)
  {
    var draw_line_every = 150; // px
    var draw_lines = Math.round(width / draw_line_every);

    // Find the duration of one section in milliseconds.
    // Round the value to 10 ^ (pre-decimal-point number of digits - 1)
    // for example 321.12 > 300, 16 > 20, 0.234 > 0.2
    var value = Number((duration / draw_lines).toPrecision(1));
    var val_in_px = width / duration * value;

    // When the last label's position is too close to the edge, it causes
    // horizontal scrollbars. Decrease the value until it fits.
    while (width % (val_in_px * draw_lines) < GRAPH_PADDING)
    {
      value--;
      val_in_px = width / duration * value;
    }

    return value;
  }
}

})(window.templates);
