function MetadataDrawer(resource, title) {
  this.expanded = false;
  this.resource = resource;
  this.title = title;
  this._objectid = ObjectRegistry.get_instance().set_object(this);
  this._rules = {
    generic: [
      {label: "url", getter: function(res) { return ["a", (res.urltype == 4 ? "data:URI" : res.url), "href", res.url, "target", "_blank"] } },
      {label: "size", getter: function(res) { return  res.size
                                              ? "" + window.helpers.pretty_print_number(res.size) + " bytes"
                                              : "-"
                                            }
      },
      {label: "format", getter: function(res) { return res.type ? res.type : "-" }},
    ],
    image: [
      //{label: "dimensions", getter: function(res) { return "123 x 321" } },
      //{label: "colors", getter: function(res) { return "16 bit" } },
    ],
    markup: [
      //{label: "doctype", getter: function(res) { return "123 x 321" } },
      // encoding , doctype
    ],
    stylesheet: [
      //{label: "doctype", getter: function(res) { return "123 x 321" } },
      // encoding , doctype
    ],
  }

  this.render = function()
  {
    var t = null;
    var rules = this._rules.generic.concat(this._rules[t] || []);
    return window.templates.metadata_drawer(this.resource, this.expanded, this._objectid, rules, this.title);
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
    var container = div.parentNode;
    obj.toggle();
    div.re_render(obj.render());
    cls.ResourceDetailBase.sync_dimensions(container);
  }

  this._init_handlers();
}


window.templates = window.templates || {};

templates.metadata_drawer = function(resource, expanded, objectid, rules, title)
{
  var url = resource.urltype == 4 ? "data:URI" : resource.url;
  
  var content = [];
  if (expanded)
  {
    content = templates.metadata_drawer_list(resource, rules);
  }
  else
  {
    content = "URL: " + url;
  }

  return ["div",
          ["input",
           "handler", "metadata-drawer-toggle",
           "class", expanded ? "unfolded" : "",
           "unselectable", "on",
           "type", "button",
          ],
          content,
          (expanded && title ? ["h2", title] : []),
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
