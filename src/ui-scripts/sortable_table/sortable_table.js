/**
 *
 * Sortable table component for dragonfly.
 *
 * Component is configured by a tabledef object. A tabledef
 * contains a map describing all the columns, and optional
 * functions used for getting values, sorting and rendering.
 * An example looks like this:
 *
 * var tabledef = {
 *         columns: {
 *
 */
function SortableTable(tabledef, data, cols, sortby, reversed)
{
  this._init = function()
  {
    if (!cols || !cols.length) {
      cols = [];
      for (var key in tabledef.columns) {
        cols.push(key);
        if (!sortby && tabledef.columns[key].sorter != "unsortable")
        {
          sortby = key;
        }
      }
    }

    for (var key in tabledef.columns)
    {
      var col = tabledef.columns[key];
      if (!col.getter)
      {
        col.getter = this._prop_getter(key);
      }

      if (!col.renderer)
      {
        col.renderer = col.getter;
      }

      if (col.sorter === undefined)
      {
        col.sorter = this._prop_sorter(col.getter);
      }
      else if (col.sorter === "unsortable")
      {
        col.sorter = null;
      }
    }

    this.sortby = sortby;
    this.tabledef = tabledef;
    this.data = data;
    this.columns = cols;
    this.reversed = !!reversed;
    this.groupby = null;
    this._elem = null;
    this.objectid = ObjectRegistry.get_instance().set_object(this);
    this._init_handlers();
  }

  this._init_handlers = function()
  {
    if (!eventHandlers.click["sortable-table-sort"])
    {
      eventHandlers.click["sortable-table-sort"] = this._sort_handler;
    }

    // should be conditional, but doesn't matter as you don't get
    // dupes in the context menu registry anyhow.
    var contextmenu = ContextMenu.get_instance();
    contextmenu.register("sortable-table-grouper", [
      { callback: this._make_context_menu }
    ]);
  }

  this._make_context_menu = function(evt)
  {
    var table = evt.target;
    while (table.nodeName.toLowerCase() != "table") { table = table.parentNode };
    var obj = ObjectRegistry.get_instance().get_object(table.getAttribute("data-object-id"));
    if (!obj.tabledef.groups) { return [] }

    var menuitems = [{
      label: "No grouping",
      handler: obj._make_group_handler(null)
    }];

    for (var group in obj.tabledef.groups)
    {
      menuitems.push({
        label: "Group by " + (obj.tabledef.groups[group].label || group) + (obj.groupby == group ? " (selected)" : ""),
        handler: obj._make_group_handler(group)
      });
    }
    return menuitems;
  }

  this._make_group_handler = function(group)
  {
    return function(evt) {
      var target = evt.target;
      while (target.nodeName.toLowerCase() != "table") { target = target.parentNode };
      var obj = ObjectRegistry.get_instance().get_object(target.getAttribute("data-object-id"));
      obj.group(group);
      target.re_render(obj.render());
    }
  }

  this._sort_handler = function(evt, target)
  {
    var table = target.parentNode.parentNode;
    var obj = ObjectRegistry.get_instance().get_object(table.getAttribute("data-object-id"));
    obj.sort(target.getAttribute("data-column-id"));
    table.re_render(obj.render());
  }

  this._default_sorters = {
    "number": function(getter) { return function(a, b) { return b-a; } }
  }

  this.render = function()
  {
    return templates.sortable_table(this.tabledef, this.data, this.objectid,
                                    this.columns, this.groupby, this.sortby,
                                    this.reversed);
  };

  this._prop_getter = function(name)
  {
    return function(obj) { return obj[name]; }
  }

  this._prop_sorter = function(getter)
  {
    return function(a, b)
    {
      a = getter(a);
      b = getter(b);
      if (a > b) { return 1 }
      else if (a < b) { return -1 }
      else { return 0 }
    }
  }

  this.sort = function(col)
  {
    if (col == this.sortby) {
      this.reversed = !this.reversed;
    }
    else
    {
      this.sortby = col;
    }
  };

  this.group = function(group)
  {
    if (!group || !this.tabledef.groups || !(group in this.tabledef.groups))
    {
      this.groupby = null;
    }
    else
    {
      this.groupby = group;
    }
  }

  this._init();
}

window.templates = window.templates || {};

templates.sortable_table = function(tabledef, data, objectid, cols, groupby, sortby, reversed)
{
  return ["table",
          templates.sortable_table_header(tabledef, cols, sortby, reversed),
          templates.sortable_table_body(tabledef, data, cols, groupby, sortby, reversed),
          "class", "sortable-table",
          "data-object-id", objectid,
          "data-menu", "sortable-table-grouper"
         ]
}

templates.sortable_table_header = function(tabledef, cols, sortby, reversed)
{
  return ["tr",
           cols.map(function(c) {
            return ["th",
                    tabledef.columns[c].label,
                    "class", (sortby==c ? "sort-column" : "") + (reversed ? " reversed" : ""),
                    "data-column-id", c,
                   ].concat(tabledef.columns[c].sorter ? ["handler", "sortable-table-sort"] : [])
          }),
          "class", "header"
          ];
}

templates.sortable_table_body = function(tabledef, data, cols, groupby, sortby, reversed)
{
  var groups = {};

  if (groupby)
  {
    var grouper = tabledef.groups[groupby].grouper;
    data.forEach(function(e) {
      var g = grouper(e);
      if (g in groups) { groups[g].push(e) }
      else { groups[g] = [e] }
    });
  }
  else
  {
    groups = {nogroup:data};
  }

  var groupnames = [];
  for (var key in groups) { groupnames.push(key) }

  if (groupby && tabledef.groups[groupby].sorter)
  {
    groupnames.sort(tabledef.groups[groupby].sorter);
  }
  else
  {
    groupnames.sort()
  }

  var render_group_headers = groupnames.length > 1;
  return groupnames.map(function(g) {
      return templates.sortable_table_group(tabledef, g,
                                            render_group_headers,
                                            groups[g], cols, groupby, sortby,
                                            reversed)
  });
}

templates.sortable_table_group = function(tabledef, groupname, render_header, data, cols, groupby, sortby, reversed)
{
  var sorter = tabledef.columns[sortby].sorter;
  if (sorter) { data.sort(sorter) }
  if (reversed) { data.reverse() }
  var tpl = [];
  if (render_header) {
    var renderer = tabledef.groups[groupby].renderer || function(g) { return g };
    tpl.push(["tr",
              ["th", renderer(groupname, data),
               "colspan", String(cols.length),
               "class", "sortable-table-group-header"],
              "class", "header"
             ]);
  }

  return tpl.concat(data.map(function(item) {
    return templates.sortable_table_row(tabledef, item, cols)
  }));
}

templates.sortable_table_row = function(tabledef, item, cols)
{
  return ["tr",
          cols.map(function(col) {
            return ["td", tabledef.columns[col].renderer(item, tabledef.columns[col].getter)];
          }).concat(tabledef.handler ? ["handler", tabledef.handler] : [])
            .concat(tabledef.idgetter ? ["data-object-id", tabledef.idgetter(item) ] : [])
         ];
}
