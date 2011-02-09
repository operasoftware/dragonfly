window.templates || (window.templates = {});

templates.network_options_main = function(caching, tracking, headers)
{
  return ["div",
          ["div",
           ["h2", "Caching behaviour"],
           ["p", "This setting controls how caching works in Opera. When caching is disable, Opera will bypass all caching, always doing full reloads"],
           ["label",
             ["input", "type", "radio",
              "name", "network-options-caching",
              "value", "default",
              "handler", "network-options-toggle-caching",
              caching == "default" ? "checked" : "non-checked", "true"
             ],
             "Standard browser caching behaviour",
           ],
           ["br"],
           ["label",
            ["input", "type", "radio",
             "name", "network-options-caching",
             "value", "disabled",
             "handler", "network-options-toggle-caching",
             caching == "disabled" ? "checked" : "non-checked", "true"
            ],
            "Disable all caching",
           ]
          ],
          ["div",
           ["h2", "Content tracking behaviour"],
           ["p", "This setting controls if the bodies of responses will be available to Dragonfly when a page loads. Enabling it will make load operations slower, and use more memory. It will also make network body reporting more accurate"],
           ["label",
            ["input", "type", "radio",
             "name", "network-options-track-bodies",
             "value", "notrack",
             "handler", "network-options-toggle-body-tracking",
             tracking == "notrack" ? "checked" : "non-checked", "true"
            ],
            "Don't track content (default)",
            ],

           ["br"],
           ["label",
            ["input", "type", "radio",
             "name", "network-options-track-bodies",
             "value", "track",
             "handler", "network-options-toggle-body-tracking",
             tracking == "track" ? "checked" : "non-checked", "true"
            ],
            "Track content (affects speed/memory)",
           ]
          ],

          /*
          ["hr"],
          ["fieldset", ["legend", "Global header rewrites"],
           templates.network_options_header_table(headers)
          ],
          */
          "class", "padding network-options",
         ];
};

templates.network_options_header_table = function(headers)
{
  var fun = function(header) {
      return ["tr",
               ["td", "DEL"],
               ["td", "ON"],
               ["td", ["input", "", "value", header.name]],
               ["td", ["input", "", "value", header.value]]
             ];
  };

  var tpl = ["table",
              ["tr",
                ["th", "X"], ["th", "Y"], ["th", "Name"], ["th", "Value"]],
                headers.map(fun)
            ];
  return tpl;
};

templates.network_request_crafter_main = function(url, loading, request, response)
{
  return ["div",
          ["div",
           ["h2", "URL"],
           ["input", "type", "text",
            "value", url || "http://example.org",
            "handler", "request-crafter-url-change"],
           ["h2", "Request body"],
            ["textarea", request],
           ["button", "Send request", "handler", "request-crafter-send"],
           ["h2", "Response body"],
           (loading ? ["span", "Request in progress"] : ["div", ["pre", ["code", response]]]),
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
        "id", "right-side-content"
       ],
       "id", "right-side-container",
      ],
      "id", "main-scroll-content",
     ],
     "class", "network-log",
     "id", "main-scroll-container",
    ],
    ["div", ["div", "id", "scrollbar"], "id", "scrollbar-container"]
  ];
}


templates.network_log_details = function(ctx, selected)
{
  return  [
    ["div", templates.network_log_url_list(ctx, selected),
     "class", "network-details-url-list"
    ],
    ["div", templates.network_log_request_detail(ctx, selected),
     "class", "network-details-request"
    ]
  ]
}

templates.network_log_request_detail = function(ctx, selected)
{
  var req = ctx.get_resource(selected);
  return [
  ["div",
    ["button", "X", "handler", "close-request-detail", "unselectable", "on"],
    ["h2", "Summary"],
    ["table",
     ["tr", ["th", "URL:"], ["td", req.url]],
     ["tr", ["th", "Method:"], ["td", req.method || "-"],
      "data-spec", "http#" + req.method
     ],
     ["tr", ["th", "Status:"], ["td", String(req.responsecode || "-")],
      "data-spec", "http#" + req.responsecode
     ],
     ["tr", ["th", "Duration:"], ["td", String(req.duration ? "" + req.duration + "ms" : "-")]],
     "class", "resource-detail"
    ],
    ["h2", "Request details", ["button", "raw/cooked",
                               "type", "button",
                               // unselectable attribute works around bug CORE-35118
                               "unselectable", "on",
                               "handler", "toggle-raw-cooked-request"]],
    templates.request_details(req),
    ["h2", "Response details", ["button", "raw/cooked",
                                "type", "button",
                                // unselectable attribute works around bug CORE-35118
                                "unselectable", "on",
                                "handler", "toggle-raw-cooked-response"]],
    templates.response_details(req),
    ["h2", "Body"],
    templates.network_response_body(req),
    ],
    "data-resource-id", String(req.id),
    "data-menu", "request-context-options",
  ]
}

templates.request_details = function(req)
{
  if (settings.network_logger.get("request-view-mode") == "raw")
  {
    return templates.network_raw(req.request_raw);
  }
  else
  {
    return templates.network_header_table(req.request_headers);
  }
}

templates.response_details = function(req)
{
  if (settings.network_logger.get("response-view-mode") == "raw")
  {
    return templates.network_raw(req.response_raw);
  }
  else
  {
    return templates.network_header_table(req.response_headers);
  }
}

templates.network_raw = function(raw)
{
  return ["pre", ["code", raw]];
}

templates.network_response_body = function(req)
{
  if (!req.responsebody)
  {
    return ["p",
            "Response body not tracked. To always fetch response bodies, toggle the response body option on the \"network options\" tab. To retrieve only this body, click the button.",
            ["button",
             "Get response body",
             "data-resource-id", String(req.id),
             // unselectable attribute works around bug CORE-35118
             "unselectable", "on",
             "handler", "get-response-body"
            ],
            "class", "response-view-body-container"
           ];
  }
  else
  {
    var bodytpl;
    if (["script", "markup", "css", "text"].indexOf(req.type) != -1)
    {
      bodytpl = ["code", ["pre", req.responsebody.content.stringData]];
    }
    else if (req.type == "image")
    {
      bodytpl = ["img", "src", req.responsebody.content.stringData];
    }
    else
    {
      bodytpl = ["span", "not able to show data of type " + req.mime];
    }

    return ["div",
            bodytpl,
            "class", "response-body-content"
           ];
  }
}


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
           ]
  }

  var headers = headers.slice(0); // copy so we can sort withouth nuking original
  headers.sort(function(a, b) {
    if (a.name>b.name) { return 1 }
    else if (b.name>a.name) { return -1 }
    else { return 0 }
  });
  return ["table", headers.map(rowfun),
          "class", "header-list"];
}

templates.network_log_url_list = function(ctx, selected)
{
  var itemfun = function(res) {
    var statusclass = "status-" + res.responsecode;
    if (res.cached) { statusclass = "status-cached" } 
    return ["li",
            templates.network_request_icon(res),
            ["span", res.url],
            ["span", String(res.responsecode),
             "class", "log-url-list-status " + statusclass,
             "title", String(res.responsecode)
             ],
            "handler", "select-network-request",
            "data-resource-id", String(res.id),
            "class", selected===res.id ? "selected" : "",
            "data-menu", "request-context-options"
           ]
  }
  return ["ol", ctx.resources.map(itemfun),
          "class", "network-log-url-list"];
}

templates.network_request_icon = function(request)
{
  return ["span", "class", "resource-icon resource-type-" + request.type];
}

templates.network_log_graph = function(ctx, width)
{
  width = width;
  var rowheight = 25;
  var height = ctx.resources.length * rowheight;

  var gradients = templates.network_graph_gradient_defs();
  var background = templates.network_log_background(ctx, rowheight);
  var bars = templates.graph_bars(ctx, width, rowheight);
  var grid = templates.grid_lines(ctx, width, height);

  var tpl = ["svg:svg",
             gradients,
             background,
             bars,
             grid,
             //'viewBox', '0 0 ' + 3000 + 'px ' + 500 +'px',
             "data-menu", "request-context-options",
             "xmlns", "http://www.w3.org/2000/svg",
             "class", "resource-graph"];

    return tpl;
}

templates.graph_bars = function(ctx, width, height)
{
  var bars = [];
  var basetime = ctx.get_starttime();
  var duration = ctx.get_duration();
  duration = Math.ceil(duration / 1000) * 1000

  for (var n=0, req; req=ctx.resources[n]; n++)
  {
    var bar = templates.request_bar(n, req, basetime, duration, width, height);
    bars.push(bar);
  }
  return bars;
}

templates.request_bar = function(index, request, basetime, totaltime, contwidth, lineheight)
{
  var y = lineheight * index;
  var barheight = 12;
  var bary = y + (lineheight / 2) - (barheight / 2);
  var multiplier = contwidth / totaltime;

  if (!request.duration) {
    // fixme: request not done, so emit something saner here.
    return [];
  }

  var start = request.starttime;
  var reqwidth = request.duration
  var resstart = request.requesttime || start
  var reswidth = reqwidth - (resstart - start);

  var texture = "gradient-" + (request.type || "unknown");

  var tpl = [
    ["rect", 
      "x", String((start-basetime)*multiplier), 
      "y", String(bary),
      "width", String(reqwidth*multiplier),
      "height", String(barheight),
      "rx", "4",
      "ry", "4",
      "fill", "#dfdfdf",
      "stroke", "#969696",
      "stroke-width", "1.0",
      "pointer-events", "none",
      "data-resource-id", String(request.id),      
    ],

    ["rect",
      "x", String((resstart-basetime)*multiplier),
      "y", String(bary),
      "width", String(reswidth*multiplier),
      "height", String(barheight),
      "rx", "4",
      "ry", "4",
      "fill", "url(#" + texture + ")", 
      "stroke", "#333333", 
      "stroke-width", "1.0",
      "pointer-events", "none",
      "data-resource-id", String(request.id),
    ]
  ];
  return tpl;
};




templates.grid_lines = function(ctx, width, height)
{
  var ret = [];
  var millis = ctx.get_duration();
  millis = Math.ceil(millis / 1000) * 1000
  var secondwidth = width / (millis / 1000);
  var multiplier = width / millis;

  // Thresholds for whether or not to render grid for every 100 and 500ms.
  // The number is how many pixels per second. So if every second is
  // alloted more than 200px, render the 100ms bars
  const THRESH_100MS = 200;
  const THRESH_500MS = 100;

  ret.push(["line",
            "x1", "0",
            "y1", "0",
            "x2", "0",
            "y2", String(height),
            "stroke", "black",
            "stroke-width", "1",
            "pointer-events", "none",
           ]);

  for (var n=100; n<millis; n+=100)
  {
    var color = null;
    if (!(n % 1000))
    {
      color = "black";
    }
    else if (secondwidth > THRESH_500MS && !(n % 500))
    {
      color = "rgba(0,0,0,0.3)";
    }
    else if (secondwidth > THRESH_100MS && !(n % 100))
    {
      color = "rgba(0,0,0,0.1)";
    }

    if (color) {
      ret.push(["line",
                "x1", String(n*multiplier),
                "y1", "0",
                "x2", String(n*multiplier),
                "y2", String(height),
                "stroke", color,
                "stroke-width", "1.0",
                "pointer-events", "none",
                "opacity", "1.0"
      ]);
    }
  }

  return ret;
};


templates.network_graph_gradient_defs = function()
{
  return ["defs",
          templates.network_graph_gradient("image", "#ff7c7c", "#cb1313", "#b40000", "#c42222"),
          templates.network_graph_gradient("script", "#ffffeb","#e2dd9a","#c6bf7a", "#d1cd95"),
          templates.network_graph_gradient("css", "#e6ffff", "#91c4ff", "#71a6f0", "#8eb8f3"),
          templates.network_graph_gradient("markup", "#d9deff", "#7c85b9", "#6972a6", "#8088b4"),
          templates.network_graph_gradient("unknown", "#ffffff", "#c0c0c0", "#aaaaaa", "#b8b8b8")
         ];
};

templates.network_graph_gradient = function(id, c1, c2, c3, c4)
{
  return ["linearGradient",
          ["stop", "offset", "5%", "stop-color", c1],
          ["stop", "offset", "49%", "stop-color", c2],
          ["stop", "offset", "50%", "stop-color", c3],
          ["stop", "offset", "100%", "stop-color", c4],
          "x1", "0",
          "x2", "0",
          "y1", "0",
          "y2", "100%",
          "id", "gradient-" + id
         ];
};


templates.network_log_background = function(ctx, lineheight)
{
  var cnt = ctx.resources.length;
  var tpls = [];
  while (cnt--)
  {
    tpls.push(["rect", "x", "0",
               "y", String(cnt*lineheight),
               "width", "100%",
               "height", String(lineheight-1),
               "stroke-width", "0", 
               "fill", (cnt%2 ?  "rgba(0,0,0,0.025)" : "white"),
               "data-resource-id", String(ctx.resources[cnt].id),
               "class", "network-graph-bg-row",
               "handler", "select-network-request-graph",
               ]);

    tpls.push(["line",
               "x1", "0",
               "y1", String((cnt*lineheight) + lineheight - 0.5),
               "x2", "100%",
               "y2", String((cnt*lineheight) + lineheight - 0.5),
               "stroke", "rgba(0, 0, 0, 0.1)",
               "stroke-width", "1",
              ]);
  }
  return tpls;
};
