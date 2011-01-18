window.templates || (window.templates = {});

templates.network_options_main = function(clearing_cache, caching, headers)
{
  var checked = true;
  return ["div",
          ["button", "Clear cache", "handler", "network-options-clear-cache"],
          clearing_cache ? ["span", "CLEARING"] : [],
          ["hr"],
          ["div", "Caching behaviour:",
           ["br"],
           ["label", "Standard browser caching behaviour",
            ["input", "type", "radio",
             "name", "network-options-caching",
             "value", "default",
             "handler", "network-options-toggle-caching",
             caching == "default" ? "checked" : "non-checked", "true"
            ]],

           ["br"],
           ["label", "Disable all caching",
            ["input", "type", "radio",
             "name", "network-options-caching",
             "value", "disabled",
             "handler", "network-options-toggle-caching",
             caching == "disabled" ? "checked" : "non-checked", "true"
            ]]
          ],
          /*
          ["hr"],
          ["fieldset", ["legend", "Global header rewrites"],
           templates.network_options_header_table(headers)
          ],
          */
          "class", "padding network-options"
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

templates.network_request_crafter_main = function(url, request, response)
{
  return ["div",
          ["div",
           ["label", "URL:", ["input", "type", "text",
                              "value", url || "",
                              "handler", "request-crafter-url-change"
                             ]
           ],
           ["textarea", request]
          ],
          ["button", "Send request", "handler", "request-crafter-send"],
          ["hr"],
          ["div", ["pre", ["code", response]]],
          "class", "padding request-crafter"
         ];
};


templates.network_log_main = function(ctx)
{
  return [
    ["div",
     ["div",
      ["div", templates.network_log_url_list(ctx), "id", "left-side-content"],
      ["div",
       ["div", templates.network_log_graph(ctx), "id", "right-side-content"],
       "id", "right-side-container"
      ],
      "id", "main-scroll-content"
     ],
     "class", "network-log",
     "id", "main-scroll-container"
    ],
    ["div", ["div", "id", "scrollbar"], "id", "scroll-bar-container"]
  ];
}


templates.network_log_main_table = function(ctx)
{
  return [
    ["div", templates.network_log_url_list(ctx),
     "style", "height:100%; width: 300px; position: absolute; overflow: hidden;",
     "class", "resourcelist"
    ],
    ["div", templates.network_log_url_list(ctx),
     "style", "height:100%; position: absolute; left: 310px; overflow: scroll",
     "class", "timeline"]
  ]
}

templates.network_log_url_list = function(ctx)
{
  var itemfun = function(res) {
    return ["li", templates.network_request_icon(res), ["span", res.url]]
  }
  return ["ol", ctx.resources.map(itemfun)];
}

templates.network_request_icon = function(request)
{
  return ["span", "class", "resource-icon resource-type-" + request.type];
}

templates.network_log_graph = function(ctx, width)
{
  width = width || 1000;
  var height = ctx.resources.length * 36;

  var gradients = templates.gradient_defs();
  var bars = templates.graph_bars(ctx, width, 30);
  var grid = templates.grid_lines(ctx, width, height);

  var tpl = ["svg:svg",
             gradients,
             bars,
             grid,
             "viewBox", "0 0 " + width + " " + height,
             "xmlns", "http://www.w3.org/2000/svg",
             "class", "resource-graph"];

    return tpl;
}


templates.graph_bars = function(ctx, width, height)
{
  var bars = [];
  var basetime = ctx.get_starttime();
  var duration = ctx.get_duration();
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
  var bary = y + (lineheight / 2);
  var multiplier = contwidth / totaltime;

  if (!request.duration) {
    opera.postError("Brokan! ");
    return [];
  }

  var start = request.starttime;


  var reqwidth = request.duration

  var resstart = start+10//entry.requestfinished.time;
  var reswidth = 30; // reqwidth - (resstart - reqstart);

  var gid = Math.floor(Math.random() * 3);
  var texture = ["gradient-css", "gradient-img", "gradient-js"][gid];

  var tpl = [
    ["rect", "x", String((start-basetime)*multiplier), "y", String(bary),
     "width", String(reqwidth*multiplier), "height", "16",
             "rx", "4", "ry", "4",
             "fill", "#e5e5e5", "stroke", "#969696", "stroke-width", "0.5"],

      ["rect", "x", String((resstart-basetime)*multiplier), "y", String(bary),
             "width", String(reswidth*multiplier), "height", "16",
             "rx", "4", "ry", "4",
             "fill", "url(#" + texture + ")", "stroke", "#4a507d", "stroke-width", "0.5"]

  ];
  return tpl;
};




templates.grid_lines = function(ctx, width, height)
{
  var ret = [];
  var millis = ctx.get_duration();
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
      color = "gray";
    }
    else if (secondwidth > THRESH_100MS && !(n % 100))
    {
      color = "silver";
    }

    if (color) {
      ret.push(["line", "x1", String(n*multiplier), "y1", "0",
                "x2", String(n*multiplier), "y2", String(height),
                "stroke", color,
                "stroke-width", "0.5",
                "opacity", "0.7"
      ]);
    }
  }

  return ret;
};


templates.gradient_defs = function()
{
  return ["defs",
    templates.gradient("img", "#e3ffff", "#92c5ff", "#70a5f0", "#8db8f2"),
    templates.gradient("js", "#d9dfff", "#828bbf", "#6269a0", "#7f88b4"),
    templates.gradient("css", "#ff7d7d", "#d21a1a", "#b40000", "#c32121")
  ];
};

templates.gradient = function(id, c1, c2, c3, c4)
{
  return ["linearGradient",
          ["stop", "offset", "5%", "stop-color", c1],
          ["stop", "offset", "50%", "stop-color", c2],
          ["stop", "offset", "50%", "stop-color", c3],
          ["stop", "offset", "100%", "stop-color", c4],
          "x1", "0",
          "x2", "0",
          "y1", "0",
          "y2", "100%",
          "id", "gradient-" + id
         ];
};


templates.resource_graph = function(ctx, duration, contwidth, lineheight)
{
  duration = duration || 3000;
  lineheight = lineheight || 36;
  contwidth = contwidth || 800;

  var bars = [];

  var requests = ctx.resources;
  var basetime = ctx.get_start_time();

  for (var n=0, req; req=requests[n]; n++)
  {
    var bar = templates.resource_bar(n, req, basetime, duration, contwidth, lineheight);
    bars.push(bar);
  }

  var defs = templates.bar_defs();
  var background = templates.graph_background(ctx.resources.length, lineheight);
  var grid = templates.grid_lines(duration, contwidth, n*lineheight);

    var tpl = ["svg:svg", defs, bars, grid, "viewBox", "0 0 " + contwidth + " " + (n*lineheight), "xmlns", "http://www.w3.org/2000/svg", "class", "resource-graph"];

    var tpl = ["svg:svg", defs, background, bars, grid, "xmlns", "http://www.w3.org/2000/svg",
                          "class", "resource-graph",
                          "width", "" + contwidth + "px",
                          "height", "" + n*lineheight + "px",
                          "style", ""];


    return tpl;
};
