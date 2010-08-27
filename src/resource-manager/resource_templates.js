window.templates = window.templates || {};

templates.resource_main = function(doc)
{
  return [
    "div",
    templates.resource_list(doc), ["img", "src", "css.png"],
    "class", "resource-main"
  ];
};


templates.resource_item = function(resource)
{
  var tpl = [
    "li",
      ["span", ["img", "src", "css.png"]],
      ["span", resource.urlload.url],
      ["span", resource.response ?  resource.response.responseCode : "aa"]
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

