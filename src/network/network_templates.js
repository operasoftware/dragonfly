window.templates || (window.templates = {});

(function(templates) {

const MIN_BAR_WIDTH = 16; // pixels

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
          ["button", ui_strings.S_NETWORK_HEADER_OVERRIDES_PRESETS_SAVE,
           "handler", "update-header-overrides", "class", "container-button"
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
           ["p", ["button", ui_strings.M_NETWORK_CRAFTER_SEND,
            "handler", "request-crafter-send",
            "unselectable", "on",
            "class", "container-button"]],
           ["h2", ui_strings.M_NETWORK_CRAFTER_RESPONSE_BODY],
           ["p", ["textarea", loading ? ui_strings.M_NETWORK_CRAFTER_SEND : response]],
           "class", "padding request-crafter"
          ]
         ];
};

templates.network_log_main = function(ctx, graphwidth)
{
  return [
    ["div",
     ["div",
      ["div", templates.network_log_url_list(ctx), "id", "left-side-content"],
      ["div",
       ["div", templates.network_log_graph(ctx, graphwidth),
        "id", "right-side-content",
         "style", "width: " + graphwidth + "px"
       ],
       "id", "right-side-container"
      ],
      "id", "main-scroll-content"
     ],
     "class", "network-log",
     "id", "main-scroll-container"
    ],
    ["div", ["div",
             "id", "scrollbar",
             "style", "width: " + graphwidth + "px"],
     "id", "scrollbar-container"
    ]
  ];
};

templates.network_log_details = function(ctx, selected, listwidth)
{
  return [
    ["div", templates.network_log_url_list(ctx, selected, listwidth),
     "class", "network-details-url-list",
     "style", "width: " + listwidth + "px"
    ],
    ["div", templates.network_log_request_detail(ctx, selected),
     "class", "network-details-request",
     "style", "left: " + listwidth + "px;"
    ]
  ];
};

templates.network_log_request_detail = function(ctx, selected)
{
  var req = ctx.get_resource(selected);
  var responsecode = req && req.responsecode && req.responsecode in cls.ResourceUtil.http_status_codes ?
                "" + req.responsecode + " " + cls.ResourceUtil.http_status_codes[req.responsecode] : null;
  return [
  ["div",
    ["button", "class", "close-request-detail container-button", "handler", "close-request-detail", "unselectable", "on"],
    ["table",
     ["tr", ["th", ui_strings.S_HTTP_LABEL_URL + ":"], ["td", req.human_url]],
     ["tr", ["th", ui_strings.S_HTTP_LABEL_METHOD + ":"], ["td", req.touched_network ? req.method : ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE],
      "data-spec", "http#" + req.method
     ],
     ["tr", ["th", ui_strings.M_NETWORK_REQUEST_DETAIL_STATUS + ":"], ["td", req.touched_network && responsecode ? String(responsecode) : ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE],
      "data-spec", "http#" + req.responsecode
     ],
     ["tr", ["th", ui_strings.M_NETWORK_REQUEST_DETAIL_DURATION + ":"], ["td", req.touched_network && req.duration ? "" + req.duration + " ms" : "0"]],
     "class", "resource-detail"
    ],

    templates.request_details(req),

    templates.network_request_body(req),

    req.touched_network ? [
      ["h2", ui_strings.S_NETWORK_REQUEST_DETAIL_RESPONSE_TITLE],
      templates.response_details(req),
      ["h2", ""]
    ] : [],

    templates.network_response_body(req)

    ],
    "data-resource-id", String(req.id),
    "class", "request-details"
  ];
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
      return [["li", ["span", header.name + ": "], header.value,  "data-spec", "http#" + header.name]];
  });

  if (firstline)
  {
    lis.unshift(["li", firstline]);
  }
  return ["ol", lis, "class", "network-details-header-list mono"];
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
  else if (req.requestbody.mimeType == "application/x-www-form-urlencoded")
  {
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
  else if (!req.responsebody)
  {
    ret.push(["p",
      ui_strings.S_NETWORK_REQUEST_DETAIL_BODY_DESC,
      ["p", ["button",
          ui_strings.M_NETWORK_REQUEST_DETAIL_GET_RESPONSE_BODY_LABEL,
          "data-resource-id", String(req.id),
          // unselectable attribute works around bug CORE-35118
          "unselectable", "on",
          "handler", "get-response-body",
          "class", "container-button"
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

templates.network_log_url_list = function(ctx, selected)
{
  var itemfun = function(res) {
    var statusclass = "status-" + res.responsecode;
    var statusstring = res.responsecode || null;
    if (res.responsecode && res.responsecode in cls.ResourceUtil.http_status_codes)
    {
      statusstring += " " + cls.ResourceUtil.http_status_codes[res.responsecode];
    }

    if (res.cached) { statusclass = "status-cached"; }
    return ["li",
            templates.network_request_icon(res),
            ["span", res.human_url],
            ["span", res.touched_network && res.responsecode ? String(res.responsecode) : ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE,
             "class", "log-url-list-status " + statusclass,
             "title", String(statusstring || ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE)
             ],
            "handler", "select-network-request",
            "data-resource-id", String(res.id),
            "class", selected===res.id ? "selected" : "",
            "title", res.human_url
           ];
  };
  return ["ol", ctx.resources.map(itemfun),
          "class", "network-log-url-list"];
};

templates.network_request_icon = function(request)
{
  return ["span", "class", "resource-icon resource-type-" + request.type];
};

templates.network_log_graph = function(ctx, width)
{
  var rows = templates.network_graph_rows(ctx, width);
  var duration = ctx.get_coarse_duration(MIN_BAR_WIDTH, width);
  var stepsize = templates.grid_info(duration, width);
  var gridwidth = Math.round((width / duration) * stepsize);
  var headerrow = templates.network_timeline_row(width, stepsize, gridwidth);
  return ["div", headerrow, rows, "id", "graph", "style", "width: " + width + "px; background-size: " + gridwidth + "px 100%, 50px 50px;"];
};

templates.network_timeline_row = function(width, stepsize, gridwidth)
{
  var labels = [];
  var cnt = Math.round(width / gridwidth);

  while (stepsize && --cnt > 0) // skips last one on purpose
  {
    labels.push(["span", "" + ((stepsize * cnt) / 1000) + "s",
                 "style", "left: " + ((gridwidth * cnt)-30) + "px;",
                 "class", "timeline-marker"
                 ]);
  }

  return ["div", labels, "class", "network-graph-row"];
};

templates.network_graph_rows = function(ctx, width)
{
  var basetime = ctx.get_starttime();
  var duration = ctx.get_coarse_duration(MIN_BAR_WIDTH, width);

  var tpls = [];
  for (var n=0, res; res=ctx.resources[n]; n++)
  {
    tpls.push(templates.network_graph_row_bar(res, width, basetime, duration));
  }
  return tpls;
};

templates.network_graph_row_bar = function(request, width, basetime, duration)
{
  var scale = width / duration;
  var ret = [];

  if (request.duration)
  {
    var reqwidth = (request.endtime - request.starttime) * scale;
    var start = (request.starttime - basetime) * scale;
    var latency = (request.responsestart - request.requesttime) * scale;
    var req_duration = reqwidth - latency;

    var gradientmap = {
      css: "blue",
      script: "yellow",
      markup: "purple",
      image: "red",
      audio: "green",
      video: "green"
    };

    var min_bar_width = 14; // in px
    if (req_duration < min_bar_width)
    {
      req_duration = min_bar_width;
    }

    var title = "";
    if (request.cached)
    {
      title = ui_strings.S_NETWORK_GRAPH_DURATION_HOVER_CACHED.replace("%s", request.duration || 0);
    }
    else
    {
      title = ui_strings.S_NETWORK_GRAPH_DURATION_HOVER_NORMAL;
      title = title.replace("%(total)s", request.duration);
      title = title.replace("%(request)s", (request.requesttime - request.starttime));
      title = title.replace("%(response)s", (request.endtime - request.requesttime));
    }

    var type = request.type in gradientmap ? request.type : 'unknown';
    ret.push([
              ["span",
                ["span", "class", "network-graph-time network-" + type,
                          "style", "margin-left:" + latency + "px; width: " + req_duration + "px;"],
                "class", "network-graph-latency",
                "style", "margin-left:" + start + "px;", "title", title
              ]
      ]);
  }

  return ["div", ret,
          "class", "network-graph-row",
          "data-resource-id", String(request.id),
          "handler", "select-network-request"];
};


templates.grid_info = function(duration, width)
{
  var density = (width / duration) * 1000;
  var step = 2000;

  if (density > 1000) {
    step = 100;
  }
  else if (density > 600)
  {
    step = 200;
  }
  else if (density > 400)
  {
    step = 500;
  }
  else if (density > 160)
  {
    step = 1000;
  }
  else if (density > 120)
  {
    step = 2000;
  }
  else if (density > 90)
  {
    step = 5000;
  }
  else if (density > 40)
  {
    step = 10000;
  }
  else if (density > 25)
  {
    step = 15000;
  }
  else if (density > 5)
  {
    step = 20000;
  }
  else if (density > 2)
  {
    step = 30000;
  }
  else {
    step = 0; // don't render lines. too much crap on the screen
  }

  return step;
}

})(window.templates);