function MetadataDrawer(resource) {
  this.expanded = false;
  this.resource = resource;
  this._objectid = ObjectRegistry.get_instance().set_object(this);
  this._rules = {
    generic: [
      {label: "url", getter: function(res) { return ["a", res.urlload.url, "href", res.urlload.url] } },
      {label: "size", getter: function(res) { return  res.urlfinished
                                              ? "" + res.urlfinished.contentLength + " bytes"
                                              : "-"
                                            }
      },
      {label: "format", getter: function(res) { return res.urlfinished ? res.urlfinished.mimeType : "-" }},
    ],
    image: [
      {label: "dimensions", getter: function(res) { return "123 x 321" } },
      {label: "colors", getter: function(res) { return "16 bit" } },
    ],
    markup: [
      {label: "doctype", getter: function(res) { return "123 x 321" } },
      // encoding , doctype
    ],
    stylesheet: [
      {label: "doctype", getter: function(res) { return "123 x 321" } },
      // encoding , doctype
    ],
  }

  this.render = function()
  {
    var t = null;
    var rules = this._rules.generic.concat(this._rules[t] || []);
    return window.templates.metadata_drawer(this.resource, this.expanded, this._objectid, rules);
  }

  this.toggle = function()
  {
    this.expanded = !this.expanded;
  }

  this._init_handlers = function()
  {
    if (!eventHandlers.click["metadata-drawer-toggle"])
    {
      eventHandlers.click["metadata-drawer-toggle"] = this._toggle_handler;
    }
  }

  this._toggle_handler = function(evt, target)
  {
    var div = target.parentNode;
    var obj = ObjectRegistry.get_instance().get_object(div.getAttribute("data-object-id"));
    obj.toggle();
    div.re_render(obj.render());
  }

  this._init_handlers();
}


window.templates = window.templates || {};

templates.metadata_drawer = function(resource, expanded, objectid, rules)
{
//  var type = resource.getType();

  var content = [];
  if (expanded)
  {
    content = templates.metadata_drawer_list(resource, rules);
  }
  else
  {
    content = "URL: " + resource.urlload.url;
  }
  
  return ["div",
          ["button",
           "handler", "metadata-drawer-toggle"
          ],
          content,
          "class", "metadata-drawer " + (expanded ? "expanded" : "collapsed"),
          "data-object-id", objectid,
         ]
}

templates.metadata_drawer_list = function(resource, rules)
{
  return ["table", rules.map(function(rule) {
    return ["tr", ["th", rule.label + ":"], ["td", rule.getter(resource) ]];
  })];
}
