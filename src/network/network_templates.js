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
    return ["li", templates.resource_icon(res.mime), ["span", res.url]]
  }
  return ["ol", ctx.resources.map(itemfun)];
}

templates.network_log_graph = function(ctx)
{
  var itemfun = function(res) {
    return ["li", res.url]
  }
  return ["ol", ctx.resources.map(itemfun)];

}