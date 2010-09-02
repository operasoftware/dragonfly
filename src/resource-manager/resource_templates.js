window.templates = window.templates || {};

templates.resource_main = function(doc, duration_to_render)
{
  return [
    "div",
    ["div", templates.resource_list(doc), "class", "resource-listwrapper"],
    ["div", templates.resource_graph(doc), "class", "resource-graphwrapper"],
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
                           ? String(resource.response.responseCode) : "n/a"]
  ];

  return tpl;
};

templates.resource_list = function(doc)
{
  var tpl = ["ol"];
  var ordered_resources = doc.resourcelist.map(function(r) { return doc.resourcemap[r]; });
  var lis = ordered_resources.map(templates.resource_item);
  return ["ol",
            ordered_resources.map(templates.resource_item),
          "class", "request-list"];

};

templates.resource_details = function(resource)
{
  var tpl = [
  ["h1", "Request"],
  ["ul",
    ["li", ["strong", "URL:"], "foo bar baz"],
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
  ],

  ];

  return tpl;
};

templates.resource_graph = function(doc, duration, contwidth, lineheight)
{
  duration = duration || 3000;
  lineheight = lineheight || 30;
  contwidth = contwidth || 800;
  var bars = [];

  var requests = doc.resourcelist.map(function(r) { return doc.resourcemap[r]; });

  var basetime = requests[0].request.time;
  for (var n=0, req; req=requests[n]; n++)
  {
    var bar = templates.resource_bar(n, req, basetime, 3000, contwidth, lineheight);
    bars.push(bar);
  }

  var defs = templates.bar_defs();
  var grid = templates.grid_lines(duration, contwidth, n*lineheight);

  var tpl = ["svg:svg", defs, bars, grid, "viewBox", "0 0 " + contwidth + " 1000", "xmlns", "http://www.w3.org/2000/svg", "class", "resource-graph"];
  return tpl;
};

templates.resource_bar = function(offset, entry, basetime, totaltime, contwidth, lineheight)
{
  var y = lineheight * offset;
  var bary = (lineheight/2 - 16/2) + y;
  var multiplier = contwidth / totaltime;

  var reqstart = entry.request.time;
  var reqwidth = (entry.responsefinished.time - entry.request.time);
  var resstart = reqstart + (reqwidth / 3); // HACKHACK! fixme: fake data until onrequestfinished works
  var reswidth = reqwidth - (resstart - reqstart);

  var gid = Math.floor(Math.random() * 3);
  var texture = ["gradient-css", "gradient-img", "gradient-js"][gid];

  var tpl = [
    ["rect", "x", "0", "y", String(y),
             "width", String(contwidth), "height", String(lineheight),
             "stroke-width", "0", "fill", (offset%2 ? "white" : "#f2f2f2")],
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


