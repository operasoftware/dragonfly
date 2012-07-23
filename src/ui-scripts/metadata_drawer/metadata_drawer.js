function MetadataDrawer(resource, title, search_field) {
  this.expanded = false;
  this.resource = resource;
  this.title = title;
  this._objectid = ObjectRegistry.get_instance().set_object(this);
  this._rules = {
    generic: [
      {label: "size", getter: function(res) { return res.size
                                              ? "" + window.helpers.pretty_print_number(res.size) + " bytes"
                                              : "—"
                                            }
      },
      {label: "format", getter: function(res) { return res.type
                                                  ? (cls.ResourceUtil.type_to_string_map[res.type] || res.type.capitalize())
                                                  : ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE
                                              }
      },
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
    var objid = target.getAttribute('data-object-id');
    var obj = ObjectRegistry.get_instance().get_object(objid);
    var table = target.parentNode.parentNode.parentNode;
    var div = table.parentNode;
    var search_cell = div.getElementsByClassName('searchcell')[0];
    var container = div.parentNode;
    obj.toggle();
    var new_div = div.re_render(obj.render())[0];
    if (search_cell && search_cell.firstElementChild)
    {
      var new_search_cell = new_div.getElementsByClassName('searchcell')[0];
      new_search_cell.parentNode.replaceChild(search_cell, new_search_cell);
    }
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

  return ["div",
           ["table",
             ["tr",
               ["th",
                 ["input",
                  "handler", "metadata-drawer-toggle",
                  "class", expanded ? "unfolded" : "",
                  "unselectable", "on",
                  "type", "button",
                  "data-object-id", objectid
                  ],
                  "class", "expandercell"
               ],
               ["th", templates.network.icon(resource), "class", "iconcell"],
               ["th", url, "class", "urlcell"],
               ["td", "", "class", "searchcell"],
             ],
             "class", "metadata-drawer-summary-table"
           ],
           content,
           "class", "metadata-drawer"
         ]
}

templates.metadata_drawer_list = function(resource, rules)
{
  return ["table", rules.map(function(rule) {
    return ["tr", ["th", rule.label.capitalize() + ":"], ["td", rule.getter(resource) ]]
  }), "class", "details-table"];
}
