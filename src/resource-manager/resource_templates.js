window.templates = window.templates || {};

templates.resource_main = function(ctx, selected, width, millis_to_render)
{
  var graphwidth = width - 190; // fixme <- hardcoded

  return [
    "div",
    ["div", templates.load_time_overview(ctx),
     templates.resource_list(ctx), "class", "resource-listwrapper"],
    ["div",
     selected == null ? templates.resource_graph(ctx, millis_to_render, graphwidth) : templates.resource_details(ctx, selected),
     "class", "resource-graphwrapper"],
    "class", "resource-main"
  ];
};

templates.resource_item = function(resource)
{
  var tpl = [
    "li",
      ["span", ["img", "src", "css.png"]],
      ["span", resource.urlload.url],
      ["span", resource.response && resource.response.responseCode
                    ? String(resource.response.responseCode) : "n/a"],
      "resource-id", String(resource.urlload.resourceID),
      "handler", "resource-select-resource"
  ];

  return tpl;
};

templates.resource_list = function(ctx)
{
  return ["ol",
          ctx.resources.map(templates.resource_item),
          "class", "request-list"];
};

templates.resource_details = function(ctx, resourceid)
{
  var resource = ctx.get_resource(resourceid);

  var tpl = [
  ["h1", "Request"],
  ["ul",
    ["li", ["strong", "URL:"], resource.urlload.url],
    ["li", ["strong", "Method"], "GET", ["a", "spec", "href", "#"]],
    ["li", ["strong", "Status"], "200 OK", ["a", "spec", "href", "#"]],
    "class", "resource-detail"
  ],
  ["h1", "Request headers"],
  ["ul",
    ["li", ["strong", "Accept-languages:"], "adsf"],
    ["li", ["strong", "Accept-languages:"], "adsf"],
    ["li", ["strong", "Accept-languages:"], "adsf"],
    ["li", ["strong", "Accept-languages:"], "adsf"],
    "class", "resource-detail"
  ],
  ["h1", "Query data"],
  ["ul",
    ["li", ["strong", "avcd:"], "adsf"],
    ["li", ["strong", "gers:"], "adsf"],
    "class", "resource-detail"
  ],
  ["h1", "Response headers"],
  ["ul",
    ["li", ["strong", "avcd:"], "adsf"],
    ["li", ["strong", "gers:"], "adsf"],
    "class", "resource-detail"
  ]
  ];

  return tpl;
};

templates.resource_graph = function(ctx, duration, contwidth, lineheight)
{
  duration = duration || 3000;
  lineheight = lineheight || 30;
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
                          "style", "border:solid thin red; background-color: blue"];


    return tpl;
};

templates.resource_bar = function(offset, entry, basetime, totaltime, contwidth, lineheight)
{
  var y = lineheight * offset;
  var bary = (lineheight/2 - 16/2) + y;
  var multiplier = contwidth / totaltime;

  if (!entry.request || !entry.responsefinished) {
//  opera.postError("Brokan! " + entry.urlload.resourceID);
    return [];
  }


  var reqstart = entry.urlload.time;


  var reqwidth = (entry.responsefinished.time - entry.request.time);
  var resstart = entry.requestfinished.time;
  var reswidth = reqwidth - (resstart - reqstart);

  var gid = Math.floor(Math.random() * 3);
  var texture = ["gradient-css", "gradient-img", "gradient-js"][gid];

  var tpl = [
    ["rect", "x", String((reqstart-basetime)*multiplier), "y", String(bary),
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

templates.graph_scale = function(duration, contwidth)
{
  var stepcnt = (contwidth / 100);

  return [

  ];
};

templates.graph_background = function(cnt, lineheight)
{
  var tpls = [];
  while (cnt--)
  {
    tpls.push(["rect", "x", "0",
                       "y", String(cnt*lineheight),
                       "width", "100%",
                       "height", String(lineheight),
                       "stroke-width", "0", "fill", (cnt%2 ? "white" : "#f2f2f2")]);
  }
  return tpls;
};

templates.bar_defs = function()
{
  return ["defs",
    templates.bar_gradient("img", "#e3ffff", "#92c5ff", "#70a5f0", "#8db8f2"),
    templates.bar_gradient("js", "#d9dfff", "#828bbf", "#6269a0", "#7f88b4"),
    templates.bar_gradient("css", "#ff7d7d", "#d21a1a", "#b40000", "#c32121")
  ];

};

templates.bar_gradient = function(id, c1, c2, c3, c4)
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


templates.grid_lines = function(millis, width, height)
{
  var ret = [];
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
    else if (secondwidth > THRESH_100MS && !(n % 100)) {
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



// all resources tab:

templates.all_resources = function(ctx, sorted_by, columns)
{
  columns = columns || ["host", "path", "mime", "size", "size_h"];
  resources = ctx.resources;

  var tpl = [
    ["div",
     ["table",
      ["tr",
       columns.map(function(e) { return ["th", e] }),
       "handler", "resources-all-sort"
      ],
      resources.map(function(e) { return templates.all_resources_row(e, columns)} )
     ],
     "class", "padding resources-all"
    ]
  ];
  return tpl;
}

templates.all_resources_row = function(resource, columns)
{
  // fixme: the urlfinished events should always be there, but is buggy atm
  var col_value_getters = {
    host: function(res) { return templates.url_host(res.urlload.url) },
    path: function(res) { return templates.url_path(res.urlload.url) },
    mime: function(res) { return res.urlfinished ? res.urlfinished.mimeType : "n/a" },
    size: function(res) { return String(res.urlfinished ? res.urlfinished.contentLength : "n/a") },
    size_h: function(res) { return String(res.urlfinished ? templates.human_readable_size(res.urlfinished.contentLength): "n/a") },
  }

  return [
    ["tr",
     columns.map(function(e) { return ["td", col_value_getters[e](resource)]}),
     "handler", "resources-all-open",
     "resource-id", String(resource.urlload.resourceID)
    ]
  ]
}

templates.url_path = function(url)
{
  var firstslash = url.replace("://", "xxx").indexOf("/");
  var querystart = url.indexOf("?");
  if (querystart == -1) { querystart = url.length; }
  var path = url.slice(firstslash, querystart);
  return path;
}

templates.url_host = function(url)
{
  var host = url.replace(/\w+?:\/\//, "");
  var firstslash = host.indexOf("/");
  host = host.slice(0, firstslash == -1 ? host.length : firstslash);
  return host;
}



/**
 * How many millis should be shown on the screen, as opposed to how many
 * are in the request list. Currently just rounds up to neares second.
 * Separated out here in case we want to get smarter. Also, more than
 * one template needs this information
 */
templates.millis_to_render = function(millis)
{
  return Math.ceil(millis / 1000) * 1000;
}

templates.pie_chart = function(categories)
{
  var width = 220;
  var height = 220;

  var values = [];
  for (var key in categories) {
    if (key != "total") { values.push(categories[key]) }
  }

  var sum = function(arr) { return arr.reduce(function(p, c) { return p+c })};
  var total = sum(values);
  var radius = 50;

  var circle = ["circle", "cx", String(radius),
                "cy", String(radius), "r", "50", "fill", "white",
                "stroke", "black", "stroke-width", "0.5"]
  var pies = [];

  var colors = ["#777fae", "#85c1f3", "#f94c4c", "#edde37", "#7a9f68"];
  var colorindex = 0;

  var prev = {x:radius*2, y:radius}
  var deg = 0;
  values.forEach(function(pie) {
    deg = pie / total * 360 + deg;
    var rad = deg * Math.PI / 180;
    var cur = {
      x: (parseInt(Math.cos(rad) * radius)) + radius,
      y: (parseInt(Math.sin(rad) * radius)) + radius
    };

    var arc = ((pie/total * 360) > 180) ? 1 : 0;

    pies.push(["path", "d", ["M", radius, radius,
                            "L", prev.x, prev.y,
                            "A", radius, radius, 0, arc, 1, cur.x, cur.y,
                            "Z"].join(" "),
                      "fill", colors[colorindex++],
                      "stroke", "black",
                      "stroke-width", "1"
    ]);
    prev = cur;

  })

  return ["svg:svg", circle, pies,
          "viewBox", "0 0 110 110",
          "style", "width: 60px; height:60px;"
         ]
};

templates.load_time_overview = function(ctx)
{
  return ["div", templates.pie_chart(ctx.get_resource_times(), 100, 100),
          "handler", "resource-select-graph"];
}

templates.human_readable_size = function(bytes)
{
  if (bytes >= 1048576) // megabytes
  {
    return "" + ((bytes / 1048576).toFixed(2)) + "MB";
  }
  else if (bytes >= 10240)
  {
    return "" + Math.ceil((bytes / 1024)) + "KB";
  }
  else
  {
    return "" + bytes + "B";
  }
}