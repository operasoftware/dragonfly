window.templates = window.templates || {};

templates.resource_main = function(ctx, selected, width, millis_to_render)
{
  var graphwidth = width - 190; // fixme <- hardcoded

  return [
    "div",
    ["div", templates.load_time_overview(ctx),
     templates.resource_list(ctx), "class", "resource-listwrapper"],
    ["div",
     ["div", "", "style", "height: 63px;"], // fixme: temporary padder
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
  var res = ctx.get_resource(resourceid);

  var tpl = [
    ["h1", "Request"],
    ["ul",
     ["li", ["strong", "URL: "], res.urlload.url],
     ["li", ["strong", "Method: "], (res.request ? res.request.method : "-")],
     ["li", ["strong", "Status: "], (res.response ? String(res.response.responseCode) : "-")],
     "class", "resource-detail"
     ],
  ["h1", "Request headers"],
  ["ul",
   [].concat(res.requestheader
             ? res.requestheader.headerList.map(function(e)
                                                {
                                                  return ["li", ["strong", e.name + ": "], e.value];
                                                })
             : []
            )
  ],
/*
    ["h1", "Query data"],
  ["ul",
    ["li", ["strong", "avcd:"], "adsf"],
    ["li", ["strong", "gers:"], "adsf"],
    "class", "resource-detail"
  ],
  */
  ["h1", "Response headers"],
  ["ul",
   [].concat(res.responseheader
             ? res.responseheader.headerList.map(function(e)
                                                {
                                                  return ["li", ["strong", e.name + ": "], e.value];
                                                })
             : []
            )

  ]
  ];

  return tpl;
};



templates.resource_icon = function(resource)
{
  return ["span", "class", "resource-icon resource-type-" + resource.type];
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
