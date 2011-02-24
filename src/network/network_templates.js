window.templates || (window.templates = {});

templates.network_options_main = function(caching, tracking, headers, overrides)
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
          ["div",
           ["h2", "Global header overrides"],
           ["p", "Headers in the override box will be used for all requests in the debugged browser. They will override normal headers."],
           ["label", ["input", "type", "checkbox", "handler", "toggle-header-overrides"].concat(overrides ? ["checked", "checked"] : []), "Enable global header overides"],
            templates.network_options_override_list(headers, overrides),
          ],
          "class", "padding network-options",
         ];
};

templates.network_options_override_list = function(headers, overrides)
{
  var tpl = ["_auto_height_textarea", 
             headers.map(function(e) {return e.name + ": " + e.value}).join("\n"),
             "class", "header-override-input",
            ].concat(overrides ? [] : ["disabled", "disabled"]);
  return [
          ["br"],
          "Presets:", templates.network_options_override_presets(overrides),
          ["br"],
          tpl, 
          ["br"], 
          ["button", "save",
           "handler", "update-header-overrides"].concat(overrides ? [] : ["disabled", "disabled"])
         ];
}

templates.network_options_override_presets = function(overrides)
{
    return ["select", 
            cls.ResourceUtil.header_presets.map(function(e) { return ["option", e.name, "value", e.headers] }),
            "handler", "network-options-select-preset",
            ].concat(overrides ? [] : ["disabled", "disabled"]);
}

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
            ["_auto_height_textarea", request],
           ["button", "Send request", "handler", "request-crafter-send"],
           ["h2", "Response body"],
           (loading ? ["span", "Request in progress"] : ["div", ["textarea", response]]),
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
     ["tr", ["th", "URL:"], ["td", req.human_url]],
     ["tr", ["th", "Method:"], ["td", req.method || "-"],
      "data-spec", "http#" + req.method
     ],
     ["tr", ["th", "Status:"], ["td", String(req.responsecode || "-")],
      "data-spec", "http#" + req.responsecode
     ],
     ["tr", ["th", "Duration:"], ["td", String(req.duration ? "" + req.duration + "ms" : "-")]],
     "class", "resource-detail"
    ],
    ["h2", "Request details"],
    templates.request_details(req),
    ["h2", "Response details"],
    templates.response_details(req),
    ["h2", "Body"],
    templates.network_response_body(req),
    ],
    "data-resource-id", String(req.id),
    "data-menu", "request-context-options",
    "class", "request-details"
  ]
}

templates.request_details = function(req)
{
  if (!req.request_headers) { return [] }
  var firstline = req.request_raw.split("\n")[0];
  var parts = firstline.split(" ");
  if (parts.length == 3)
  {
    firstline = [
      ["span", parts[0] + " ", "data-spec", "http#" + parts[0]],
      ["span", parts[1] + " "],
      ["span", parts[2] + " "]
    ]
  }
  return templates.network_headers_list(req.request_headers, firstline);
}

templates.response_details = function(req)
{
  if (!req.response_headers) { return [] }
  var firstline = req.response_raw.split("\n")[0];
  var parts = firstline.split(" ", 2)
  if (parts.length == 2)
  {
    firstline = [
      ["span", parts[0] + " "],
      ["span", parts[1], "data-spec", "http#" + parts[1]],
      ["span", firstline.slice(parts[0].length + parts[1].length + 1)]
    ]
  }
  return templates.network_headers_list(req.response_headers, firstline);
}

templates.network_headers_list = function(headers, firstline)
{
  if (!headers) { return "No headers" }
  var tpl = [];
  var lis = headers.map(function(header) { return [
    ["li", ["span", header.name + ": "], header.value,  "data-spec", "http#" + header.name]
  ]});

  if (firstline)
  {
    lis.unshift(["li", firstline]);
  }
  return ["ol", lis, "class", "network-details-header-list"]  
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
      bodytpl = ["textarea", req.responsebody.content.stringData];
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
            ["span", res.human_url],
            ["span", String(res.responsecode),
             "class", "log-url-list-status " + statusclass,
             "title", String(res.responsecode)
             ],
            "handler", "select-network-request",
            "data-resource-id", String(res.id),
            "class", selected===res.id ? "selected" : "",
            "data-menu", "request-context-options",
            "title", res.human_url
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
  var rowheight = 25;
  var height = (ctx.resources.length + 1) * rowheight; // +1 accounts for time line in graph. Takes up a row

  var gradients = templates.network_graph_gradient_defs();
  var rows = templates.network_graph_rows(ctx, rowheight, width)
  var grid = templates.grid_lines(ctx, width, height, rowheight);


  var tpl = ["svg:svg",
             gradients,
             rows,
             grid,
             "data-menu", "request-context-options",
             "xmlns", "http://www.w3.org/2000/svg",
             "class", "resource-graph"];
    return tpl;
}


templates.network_graph_rows = function(ctx, rowheight, width)
{
  var basetime = ctx.get_starttime();
  var duration = ctx.get_duration();
  duration = Math.ceil(duration / 1000) * 1000;
  var tpls = [];
  for (var n=0, res; res=ctx.resources[n]; n++)
  {
    tpls.push(templates.network_graph_row(res, rowheight, width, n+1, basetime, duration));
  }
  return tpls;
}

templates.network_graph_row = function(resource, rowheight, width, index, basetime, duration)
{
  return ["g",
          templates.network_graph_row_background(resource, rowheight, width, index),
          templates.network_graph_row_bar(resource, rowheight, width, index, basetime, duration),
          "handler", "select-network-request-graph",
          "data-resource-id", String(resource.id)
  ];
}

templates.network_graph_row_background = function(resource, rowheight, width, index)
{
  return [
          ["rect", "x", "0",
           "y", String(index * rowheight),
           "width", "100%",
           "height", String(rowheight),
           "fill", (index % 2 ? "rgba(0,0,0,0.025)" : "white"),
           "class", "network-graph-bg-row",
          ],
          ["line",
           "x1", "0",
           "y1", String((index * rowheight) - 0.5),
           "x2", "100%",
           "y2", String((index * rowheight) - 0.5),
           "stroke", "rgba(0, 0, 0, 0.1)",
           "stroke-width", "1",
           "pointer-events", "none",
          ]
        ];
}

templates.network_graph_row_bar = function(request, rowheight, width, index, basetime, duration)
{
  var y = (rowheight * index);
  var barheight = 12;
  var min_bar_width = barheight;
  var bary = y + (rowheight / 2) - (barheight / 2);
  var multiplier = width / duration;

  if (!request.duration) {
    // fixme: request not done, so emit something saner here.
    return [];
  }

  var start = (request.starttime - basetime) * multiplier;
  var reqwidth = request.duration * multiplier;
  var resstart = ((request.requesttime || start) - basetime) * multiplier;
  var reswidth = (request.duration - (request.requesttime - request.starttime)) * multiplier;
  var texture = "gradient-" + (request.type || "unknown");

  if (reqwidth < min_bar_width) // too small bar looks ugly
  {
    reqwidth = barheight;
    resstart = start;
    reswidth = reqwidth;
  }

  if (reswidth < min_bar_width)
  {
    reswidth = barheight;
    resstart = start + reqwidth - reswidth;
  }

  var title = "";
  if (request.cached)
  {
    title = "Cached" + (request.duration ? " " + request.duration + "ms" : "")
  }
  else
  {
    title = "Total duration: " + request.duration + "\nRequest time: " + (request.requesttime - request.starttime) + "\nResponse time: " + (request.endtime - request.requesttime)
  }

  var tpl = [
    ["rect", 
      ["title", title],
      "x", String(start),
      "y", String(bary),
      "width", String(reqwidth),
      "height", String(barheight),
      "rx", "4",
      "ry", "4",
      "fill", "#dfdfdf",
      "stroke", "#969696",
      "stroke-width", "1.0",
    ],

    ["rect",
      "x", String(resstart),
      "y", String(bary),
      "width", String(reswidth),
      "height", String(barheight),
      "rx", "4",
      "ry", "4",
      "fill", "url(#" + texture + ")", 
      "stroke", "#333333", 
      "stroke-width", "1.0",
      "pointer-events", "none"
    ]
  ];
  return tpl;
}

templates.grid_lines = function(ctx, width, height, topoffset)
{
  topoffset = String(topoffset || 25);
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
                "y1", topoffset,
                "x2", String(n*multiplier),
                "y2", String(height),
                "stroke", color,
                "stroke-width", "1.0",
                "pointer-events", "none",
      ]);

      if (color == "black")
      {
        ret.push([
          "text", "" + (n/1000) + "s",
          "x", String(n*multiplier) + "px",
          "y", "20px",
        ]);
      }
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
