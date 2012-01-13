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
           ["h2", ui_strings.S_NETWORK_CONTENT_TRACKING_SETTING_TITLE],
           ["p", ui_strings.S_NETWORK_CONTENT_TRACKING_SETTING_DESC],
           ["p", ["label",
            ["input", "type", "checkbox",
             "name", "network-options-track-bodies",
             "handler", "network-options-toggle-body-tracking",
             "checked", tracking ? true : false
            ],
            ui_strings.S_NETWORK_CONTENT_TRACKING_SETTING_TRACK_LABEL
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

templates.network_log_main = function(ctx, selected, selected_viewmode, detail_width, item_order)
{
  var viewmode_render = templates["network_viewmode_" + selected_viewmode];
  if (!viewmode_render)
    viewmode_render = templates["network_viewmode_graphs"];

  return [
    [
      "div", templates.network_log_url_list(ctx, selected, item_order),
      "id", "network-url-list"
    ],
    [
      "div", [
        "div", viewmode_render(ctx, detail_width),
        "class", "network-data-container " + selected_viewmode
      ],
      "class", "network-detail-container"
    ]
  ]
};

templates.network_viewmode_graphs = function(ctx, width)
{
  var basetime = ctx.get_starttime();
  var duration = ctx.get_coarse_duration(MIN_BAR_WIDTH, width);
  var rows = templates.network_graph_rows(ctx, width, basetime, duration);

  var template = [];
  if (duration)
  {
    var stepsize = templates.grid_info(duration, width, (TIMELINE_MARKER_WIDTH / 2) + MIN_BAR_WIDTH);
    var gridwidth = Math.round((width / duration) * stepsize);
    var headerrow = templates.network_timeline_row(width, stepsize, gridwidth);

    var domcontentloaded = -1;
    var load = -1;
    // place the domcontentloaded and load events if available
    if (ctx.saw_main_document_abouttoloaddocument)
    {
      var first_document_id = ctx.get_entries().map(function(entry){return entry.document_id})[0];
      // todo: in case of a redirect, there is a documentID on it, but it's not the top document. no notifications then.
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
                           "background-position: -1px 0%, ",
                            domcontentloaded + "px 0,",
                            load + "px 0;",
                           "background-repeat: repeat, no-repeat, no-repeat;",
                           "background-size: " + gridwidth + "px 100%;"].join("")
               ];
  }
  return template;
}

templates.network_viewmode_data = function(ctx, detail_width)
{
  return ["div", "class", "network-data-table-container"];
}

templates.network_log_details = function(ctx, selected)
{
  return [
    [
      "div", templates.network_log_request_detail(ctx, selected),
      "class", "network-details-request"
    ]
  ];
};

templates.network_log_request_detail = function(ctx, selected)
{
  var entry = ctx.get_entry(selected);
  if (entry)
  {
    var responsecode = entry && entry.responsecode && entry.responsecode in cls.ResourceUtil.http_status_codes ?
                  "" + entry.responsecode + " " + cls.ResourceUtil.http_status_codes[entry.responsecode] : null;
    return [
    ["div",
      ["span",
        "class", "close-request-detail container-button ui-button",
        "handler", "close-request-detail",
        "unselectable", "on",
        "tabindex", "1"
      ],
      ["table",
       ["tr", ["th", ui_strings.S_HTTP_LABEL_URL + ":"], ["td", entry.human_url]],
       ["tr", ["th", ui_strings.S_HTTP_LABEL_METHOD + ":"], ["td", entry.touched_network ? entry.method : ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE],
        "data-spec", "http#" + entry.method
       ],
       ["tr", ["th", ui_strings.M_NETWORK_REQUEST_DETAIL_STATUS + ":"], ["td", entry.touched_network && responsecode ? String(responsecode) : ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE],
        "data-spec", "http#" + entry.responsecode
       ],
       ["tr", ["th", ui_strings.M_NETWORK_REQUEST_DETAIL_DURATION + ":"], ["td", entry.touched_network && entry.duration ? "" + entry.duration + " ms" : "0"]],
       "class", "resource-detail"
      ],

      templates.request_details(entry),

      templates.network_request_body(entry),

      entry.touched_network ? [
        ["h2", ui_strings.S_NETWORK_REQUEST_DETAIL_RESPONSE_TITLE],
        templates.response_details(entry),
        ["h2", ""]
      ] : [],

      templates.network_response_body(entry)

      ],
      "data-object-id", String(entry.id),
      "class", "request-details"
    ];
  }
};

templates.request_details = function(req)
{
  if (!req.touched_network) { return ["p", ui_strings.S_NETWORK_SERVED_FROM_CACHE]; }
  if (!req.request_headers) { return ["p", ui_strings.S_NETWORK_REQUEST_NO_HEADERS_LABEL]; }
  var firstline = req.request_raw.split("\n")[0];
  var parts = firstline.split(" ");
  if (parts.length == 3)
  {
    firstline = [
      ["span", parts[0] + " ", "data-spec", "http#" + parts[0]],
      ["span", parts[1] + " "],
      ["span", parts[2] + " "]
    ];
  }

  return [["h2", ui_strings.S_NETWORK_REQUEST_DETAIL_REQUEST_TITLE],
          templates.network_headers_list(req.request_headers, firstline)
         ];
};

templates.response_details = function(req)
{
  if (!req.response_headers) { return ["p", ui_strings.S_NETWORK_REQUEST_NO_HEADERS_LABEL]; }
  var firstline = req.response_raw.split("\n")[0];
  var parts = firstline.split(" ", 2);
  if (parts.length == 2)
  {
    firstline = [
      ["span", parts[0] + " "],
      ["span", parts[1], "data-spec", "http#" + parts[1]],
      ["span", firstline.slice(parts[0].length + parts[1].length + 1)]
    ];
  }
  return templates.network_headers_list(req.response_headers, firstline);
};

templates.network_headers_list = function(headers, firstline)
{
  if (!headers) { return ui_strings.S_NETWORK_REQUEST_NO_HEADERS_LABEL; }
  var lis = headers.map(function(header) {
      return ["tr", [["th", header.name], ["td", header.value]], "data-spec", "http#" + header.name];
  });

  if (firstline)
  {
    lis.unshift(["tr", ["td", firstline, "colspan", "3"]]);
  }
  return ["table", lis, "class", "network-details-header-list mono"];
};


templates.network_request_body = function(req)
{
  var ret = [["h2", ui_strings.S_NETWORK_REQUEST_BODY_TITLE]];
  // when this is undefined/null the request was one that did not send data
  if (!req.requestbody)
  {
    ret.push(["p", ui_strings.S_NETWORK_NO_REQUEST_DATA]);
  }
  else if (req.requestbody.partList.length)
  {
    ret = [["h2", ui_strings.S_NETWORK_MULTIPART_REQUEST_BODY_TITLE]];
    for (var n=0, part; part=req.requestbody.partList[n]; n++)
    {
      ret.push(["h4", ui_strings.S_NETWORK_MULTIPART_PART.replace("%s", (n + 1))]);
      ret.push(templates.network_headers_list(part.headerList));
      if (part.content && part.content.stringData)
      {
        ret.push(["pre", part.content.stringData]);
      }
      else
      {
        ret.push(["pre", ui_strings.S_NETWORK_N_BYTE_BODY.replace("%s", part.contentLength)])
      }
    }
  }
  else if (req.requestbody.mimeType === "application/x-www-form-urlencoded")
  {
  // todo: hard to support for example "application/x-www-form-urlencoded; charset=windows-1252" -
  // req.requestbody.content.characterEncoding is properly set to iso-8859-1 then, but its hard to get
  // content.stringData into utf-8
    var parts = req.requestbody.content.stringData.split("&");
    var tab = ["table",
              ["tr", ["th", ui_strings.S_LABEL_NETWORK_POST_DATA_NAME],
              ["th", ui_strings.S_LABEL_NETWORK_POST_DATA_VALUE]]
    ].concat(parts.map(function(e) {
        e = e.replace(/\+/g, "%20").split("=");
        return ["tr",
            ["td", decodeURIComponent(e[0])],
            ["td", decodeURIComponent(e[1])]
        ];
    }));
    ret.push(tab);
  }
  // else // There is content, but we're not tracking
  // {
  //   ret.push(["p", ui_strings.S_NETWORK_ENABLE_CONTENT_TRACKING_FOR_REQUEST]);
  // }
  else // not multipart or form.
  {
    var tpl = [];
    var type = cls.ResourceUtil.mime_to_type(req.requestbody.mimeType);
    if (type == "markup")
    {
      tpl = window.templates.highlight_markup(req.requestbody.content.stringData);
    }
    else if (type == "script")
    {
      tpl = window.templates.highlight_js_source(req.requestbody.content.stringData);
    }
    else if (type == "css")
    {
      tpl = window.templates.highlight_css(req.requestbody.content.stringData);
    }
    else if (type == "text")
    {
      tpl = ["p", req.requestbody.content ? 
                  req.requestbody.content.stringData :
                  ""];
    }
    else
    {
      if (req.requestbody.mimeType)
      {
        ret.push(["p", ui_strings.S_NETWORK_CANT_DISPLAY_TYPE.replace("%s", req.requestbody.mimeType)]);
      }
      else
      {
        ret.push(["p", ui_strings.S_NETWORK_UNKNOWN_MIME_TYPE]);
      }
    }
    ret.push(tpl);
  }
  return ret;
};


templates.network_response_body = function(req)
{
  var ret = [["h2", ui_strings.S_NETWORK_REQUEST_DETAIL_BODY_TITLE]];

  if (req.body_unavailable)
  {
    return ["p", ui_strings.S_NETWORK_REQUEST_DETAIL_NO_RESPONSE_BODY];
  }
  else if (!req.responsebody && !req.is_finished)
  {
    return ["p", ui_strings.S_NETWORK_REQUEST_DETAIL_BODY_UNFINISHED];
  }
  else if (!req.responsebody)
  {
    ret.push(["p",
      ui_strings.S_NETWORK_REQUEST_DETAIL_BODY_DESC,
      ["p", ["span",
          ui_strings.M_NETWORK_REQUEST_DETAIL_GET_RESPONSE_BODY_LABEL,
          "data-object-id", String(req.id),
          // unselectable attribute works around bug CORE-35118
          "unselectable", "on",
          "handler", "get-response-body",
          "class", "container-button ui-button",
          "tabindex", "1"
      ]],
      "class", "response-view-body-container"
    ]);
  }
  else
  {
    var bodytpl;
    if (["script", "markup", "css", "text"].contains(req.type))
    {
      bodytpl = ["textarea", req.responsebody.content.stringData];
    }
    else if (req.type == "image")
    {
      bodytpl = ["img", "src", req.responsebody.content.stringData];
    }
    else
    {
      bodytpl = ["span", ui_strings.S_NETWORK_REQUEST_DETAIL_UNDISPLAYABLE_BODY_LABEL.replace("%s", req.mime)];
    }

    ret.push(["div",
                bodytpl,
               "class", "response-body-content"
             ]);
  }
  return ret;
};

templates.network_header_table = function(headers)
{
  if (!headers)
  {
    return ["table", ["tr", ["td", "No headers"]]];
  }

  var rowfun = function(header)
  {
    return ["tr",
            ["th", header.name],
            ["td", header.value],
            "data-spec", "http#" + header.name
           ];
  };

  var headers = headers.slice(0); // copy so we can sort withouth nuking original
  headers.sort(function(a, b) {
    if (a.name>b.name) { return 1; }
    else if (b.name>a.name) { return -1; }
    else { return 0; }
  });
  return ["table", headers.map(rowfun),
          "class", "header-list"];
};

templates.network_log_url_list = function(ctx, selected, item_order)
{
  var itemfun = function(req)
  {
    var statusclass = "status-" + req.responsecode; // todo: currently unused, may be useful to make error responses stand out mode?
    if (req.cached) { statusclass = "status-cached"; }

    var statusstring = req.responsecode || null; // todo: statusstring should probably be added to the (data-) item instead
    if (req.responsecode && req.responsecode in cls.ResourceUtil.http_status_codes)
    {
      statusstring += " " + cls.ResourceUtil.http_status_codes[req.responsecode];
    }
    return ["li",
            templates.network_request_icon(req),
            ["span",
              req.filename || req.human_url,
              "data-tooltip-text" , req.human_url,
              "data-tooltip", "network-url-list-tooltip"
            ], // todo: shorten the full url, even if filename can't be extracted
            "handler", "select-network-request",
            "data-object-id", String(req.id),
            "class", selected === req.id ? "selected" : ""
           ];
  };
  var items = ctx.get_entries_filtered().slice(0);
  // Could use copy_object instead, because the template doesn't need the methods of the resources.
  // But it's probably more overhead to copy the whole thing then it is to just make a new array pointing
  // to the old objects
  if (item_order)
  {
    item_order = item_order.split(","); // todo: this could also be passed as an array, but it needs to be joined to compare, and for easy copying
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
  if (request.load_origin) // === "xhr"
    classname += " request-origin-" + request.load_origin;
  return ["span", "class", classname];
};

templates.network_timeline_row = function(width, stepsize, gridwidth)
{
  var labels = [];
  var cnt = Math.ceil(width / gridwidth);
  var offset = -1; // background-position in #graph is adjusted by that, to hide the 0s line
  var max_val = stepsize * cnt;
  var unit = [1, "ms"];
  if (max_val > 1000)
    unit = [1000, "s"];
  
  while (stepsize && --cnt > 0) // skips last one on purpose (0s marker)
  {
    var left_val = gridwidth * cnt - TIMELINE_MARKER_WIDTH / 2 + offset;
    var val_str = (stepsize * cnt) / unit[0];
    val_str = Math.round(val_str * 100) / 100;
    labels.push(["span", "" + val_str + unit[1],
                 "style", "left: " + left_val + "px;",
                 "class", "timeline-marker"
                 ]);
  }

  return ["div", labels, "class", "network-timeline-row"];
};

templates.network_graph_rows = function(ctx, width, basetime, duration)
{
  var tpls = [];
  var entries = ctx.get_entries_filtered();

  for (var n = 0, entry; entry = entries[n]; n++)
  {
    tpls.push(templates.network_graph_row(entry, width, basetime, duration));
  }
  return tpls;
};

templates.network_gap_defs = [
  {
    classname: "blocked",
    from_to_pairs: [
      ["urlload", "request"], // [from, to]
      ["responseheader", "urlredirect"],
      ["urlload", "urlredirect"],
      ["requestfinished", "requestretry"],
      ["responseheader", "requestretry"],
      ["requestretry", "request"],
      ["responsefinished", "urlfinished"],
      ["urlredirect", "urlfinished"],
      ["urlredirect", "responsefinished"],
      ["urlload", "urlfinished"]
    ]
  },
  {
    classname: "request",
    from_to_pairs: [
      ["request", "requestheader"],
      ["requestheader", "requestfinished"]
    ]
  },
  {
    classname: "waiting",
    from_to_pairs: [
      ["requestfinished", "response"]
    ]
  },
  {
    classname: "receiving",
    from_to_pairs: [
      ["response", "responseheader"],
      ["responseheader", "responsefinished"]
    ]
  }
];

templates.network_error_store = {};

templates.network_get_event_gaps = function(events, gap_defs, collapse_same_classname)
{
  /*
    collapse_same_classname: collapses event_gaps with the same classname into one. saves domnodes.
    todo: right now the sections are never rendered individually, no this can probably always be done
  */
  var event_gaps = [];
  for (var i = 0; i < events.length - 1; i++)
  {
    var ev_from = events[i];
    var ev_to = events[i + 1];
    var gap_def = gap_defs.filter(function(def){
      return def.from_to_pairs.filter(function(from_to){
        return from_to[0] == ev_from.name && from_to[1] == ev_to.name;
      }).length;
    })[0];

    var classname = gap_def && gap_def.classname;

    if (collapse_same_classname && 
        classname && 
        event_gaps.last &&
        event_gaps.last.classname &&
        classname === event_gaps.last.classname)
    {
      event_gaps.last.val += (ev_to.time - ev_from.time);
    }
    else
    {
      if (!classname)
      {
        classname = "unexpected_network_event_sequence";
        var error_str = ui_strings.S_DRAGONFLY_INFO_MESSAGE +
              "Unexpected event sequence between " + ev_from.name + " and " + ev_to.name + " (" + (ev_to.time - ev_from.time) + "ms spent)";
        if (!templates.network_error_store[error_str])
        {
          opera.postError(error_str);
          templates.network_error_store[error_str] = true;
        }
        events.has_unexpected_events = true;
      }
      event_gaps.push({
        classname: classname,
        val: ev_to.time - ev_from.time,
        initiating_event: ev_from.name
      });
    }
  }
  return event_gaps;
}

templates.network_graph_row = function(entry, width, basetime, duration)
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
          "class", "network-graph-row",
          "handler", "select-network-request",
          "data-object-id", String(entry.id)];
}

templates.network_graph_sections = function(entry, width, duration)
{
  var sections = [];
  var scale = width / duration;

  var gaps = templates.network_get_event_gaps(entry.events, templates.network_gap_defs, true);
  gaps.forEach(function(section){
    if (section.val)
    {
      sections.push([
        "span",
        "class", "network-section network-" + section.classname + " " + section.initiating_event,
        "style", "width:" + section.val * scale + "px;"
      ]);
    }
  });

  var item_classname = "network-graph-sections";
  if (entry.events.has_unexpected_events)
    item_classname += " has-unexpected-events";

  return ["span", sections,
           "class", item_classname,
           "data-tooltip", "network-graph-tooltip", // the tooltip is now on the sections and the hitarea.
           "data-object-id", String(entry.id)
         ];
};

templates.network_graph_entry_tooltip = function(entry, height)
{
  var duration = entry.get_duration();
  if (duration && entry.events)
  {
    var graphical_sections = [];
    var scale = height / duration;
    var total_length_string = new Number(duration).toFixed(2) + "ms";

    var gaps = templates.network_get_event_gaps(entry.events, templates.network_gap_defs);
    gaps.map(function(section){section.px = section.val * scale}); // or include this in the template
    gaps.forEach(function(section){
      if (section.val)
      {
        graphical_sections.push([
          "div",
          "class", "network-tooltip-section network-" + section.classname + " " + section.initiating_event,
          "style", "height:" + section.px + "px;"
        ]);
      }
    });

    var previous_event_ms;
    var event_rows = entry.events.map(function(ev)
    {
      var dist = 0;
      if (previous_event_ms)
      {
        dist = ev.time - previous_event_ms;
        ev.time_str = new Number(dist).toFixed(2) + "ms";
      }
      else
      {
        ev.time_str = "";
      }

      previous_event_ms = ev.time;
      return ["tr",
               ["td", ev.name],
               ini.debug ? ["td", ev.request_id ? "(" + ev.request_id + ")" : ""] : [],
               ["td", ev.time_str, "class", "time_data mono"]
             ];
    });
    const CHARWIDTH = 7; // todo: we probably have that around somewhere where its dynamic
    var base_width = 100.5;
    var svg_width = base_width;
    var svg_height = height;

    var pathes = [];
    var y_start = 0.5;
    var y_end = 0.5;
    var max_val_length = Math.max.apply(null, entry.events.map(function(ev){return ev.time_str.length}));
    max_val_length = Math.max(max_val_length, total_length_string.length);

    var pointer_extra_width = max_val_length * CHARWIDTH;

    entry.events.forEach(function(ev)
    {
      if (pathes.length)
      {
        y_start += Math.round(gaps[pathes.length - 1].px);
      }

      var x_end = base_width; // + ((max_val_length - ev.time_str.length) * CHARWIDTH);
      svg_width = Math.max(x_end, svg_width);

      y_end = (pathes.length * 21) + 10.5;
      svg_height = Math.max(y_start, y_end, svg_height);

      pathes.push(["path", "d", "M1.5 " + y_start + " L" + x_end + " " + y_end, "stroke", "#BABABA"]);
    });

    return ["div",
      [
        ini.debug ?
          ["h2", "Requested " + entry.resource + " at " +  entry.start_time_string] : ["h2", "Requested at " +  entry.start_time_string],
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