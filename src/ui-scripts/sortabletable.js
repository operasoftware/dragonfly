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
      for (var key in tabledef.columns) { cols.push(key) }
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

      if (!col.sorter)
      {
        col.sorter = this._prop_sorter(col.getter);
      }
    }

    this.tabledef = tabledef;
    this.data = data;
    this.columns = cols;
    this.sortby = sortby || cols[0];
    this.reversed = !!reversed;
    this.groupby = null;
    this._elem = null;
    this.objectid = ObjectRegistry.get_instance().set_object(this);
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
          "data-object-id", objectid
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
                    "handler", "sortable-table-sort",
                   ]
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

  render_group_headers = groupnames.length > 1;
  return groupnames.map(function(g) {
      return templates.sortable_table_group(tabledef, g,
                                            render_group_headers,
                                            groups[g], cols, sortby,
                                            reversed)
  });
}

templates.sortable_table_group = function(tabledef, groupname, render_header, data, cols, sortby, reversed)
{
  var sorter = tabledef.columns[sortby].sorter;
  data.sort(sorter);
  if (reversed) { data.reverse() }
  var tpl = [];

  if (render_header) {
    tpl.push(["tr",
              ["th", groupname,
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
          })
         ];
}
