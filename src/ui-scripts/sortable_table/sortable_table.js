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
function SortableTable(tabledef, data, cols, sortby, reversed, groupby)
{
  this._init = function()
  {
    window.cls.MessageMixin.apply(this);
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
    this.orgininal_columns = this.columns.slice(0);
    this.reversed = !!reversed;
    this.groupby = groupby;
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
      selected: !obj.groupby,
      handler: obj._make_group_handler(null)
    }];

    for (var group in obj.tabledef.groups)
    {
      menuitems.push({
        label: "Group by " + (obj.tabledef.groups[group].label || group),
        selected: obj.groupby == group,
        handler: obj._make_group_handler(group)
      });
    }


    // visible column selection stuff
    menuitems.push(ContextMenu.separator);

    var allcols = obj.tabledef.column_order;
    if (!allcols)
    {
      allcols = [];
      for (var key in obj.tabledef.columns)
      {
        allcols.push(key);
      }
    }

    for (var n=0, colname; colname=allcols[n]; n++)
    {
      coldef = obj.tabledef.columns[colname];
      menuitems.push({
        label: coldef.label,
        checked: obj.columns.indexOf(colname) != -1,
        handler: obj._make_colselect_handler(colname)
      });
    }
    return menuitems;
  }

  this._find_col_insertion_point = function(col)
  {
    var colpoint = this.tabledef.column_order.indexOf(col);
    for (var n=colpoint+1, current; current=this.tabledef.column_order[n]; n++)
    {
      var point = this.columns.indexOf(current);
      if (point != -1) {
        return point;
      }
    }
    return this.columns.length;
  }

  this._make_group_handler = function(group)
  {
    return function(evt) {
      var target = evt.target;
      while (target.nodeName.toLowerCase() != "table") { target = target.parentNode };
      var obj = ObjectRegistry.get_instance().get_object(target.getAttribute("data-object-id"));
      obj.group(group);
      obj.post_message("before-render");
      target.re_render(obj.render());
      obj.post_message("after-render");
    }
  }

  this._make_colselect_handler = function(col)
  {
    return function(evt) {
      var target = evt.target;
      while (target.nodeName.toLowerCase() != "table") { target = target.parentNode };
      var obj = ObjectRegistry.get_instance().get_object(target.getAttribute("data-object-id"));
      obj.togglecol(col);
      obj.post_message("before-render");
      target.re_render(obj.render());
      obj.post_message("after-render");
    }
  }

  this._sort_handler = function(evt, target)
  {
    var table = target.parentNode.parentNode;
    var obj = ObjectRegistry.get_instance().get_object(table.getAttribute("data-object-id"));
    obj.sort(target.getAttribute("data-column-id"));
    obj.post_message("before-render");
    table.re_render(obj.render());
    obj.post_message("after-render");
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

  this.restore_columns = function()
  {
    this.columns = this.orgininal_columns;
    this.post_message("before-render");
    document.querySelector(".sortable-table").re_render(this.render());
    this.post_message("after-render");
  }

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

  this.togglecol = function(col)
  {
    var index = this.columns.indexOf(col);
    if (index == -1)
    {
      var point = this._find_col_insertion_point(col);
      this.columns.splice(point, 0, col);
    }
    else
    {
      this.columns.splice(index, 1);
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
            var coldef = tabledef.columns[c];
            var tdclass = "";

            if (!coldef.sorter)
            {
              tdclass = "unsortable";
            }
            else
            {
              if (sortby==c)
              {
                tdclass = "sort-column";
              }

              if (reversed)
              {
                tdclass += " reversed";
              }
            }
            if (coldef.classname)
            {
              tdclass += " "+coldef.classname;
            }
            return ["th",
                    tabledef.columns[c].label,
                    "class", tdclass,
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

  var ret =  tpl.concat(data.map(function(item) {
    return templates.sortable_table_row(tabledef, item, cols)
  }));

  for (var n=0, col; col = cols[n]; n++)
  {
    if (tabledef.columns[col].summer)
    {
      ret.push(templates.sortable_table_sumrow(tabledef, groupname, data, cols));
      break;
    }
  }
  return ret;
}

templates.sortable_table_sumrow = function(tabledef, groupname, data, cols)
{
  return ["tr",
          cols.map(function(e) {
            var val = "";
            var summer = tabledef.columns[e].summer;
            if (summer) { val = summer(data, groupname) }
            return ["td", val];
          }),
          "class", "sortable-table-summation-row"
         ];
}

templates.sortable_table_row = function(tabledef, item, cols)
{
  return ["tr",
          cols.map(function(col) {
            var content = tabledef.columns[col].renderer(item, tabledef.columns[col].getter);

            if (typeof content !== "undefined" && typeof content !== "null")
            {
              if (typeof content == "string")
              {
                var title = content; // fixme: use custom title renderer.
              }
              else
              {
                title = "";
              }

              if (typeof content == "string" &&
                  tabledef.columns[col].maxlength &&
                  tabledef.columns[col].maxlength < content.length)
              {
                if (tabledef.columns[col].ellipsis=="start")
                {
                  content = "…" + content.slice(-tabledef.columns[col].maxlength);
                }
                else
                {
                  content = content.slice(0, tabledef.columns[col].maxlength) + "…";
                }
              }
              return ["td", content,
                    "title", title];
            }
            return [];
          }).concat(tabledef.handler ? ["handler", tabledef.handler] : [])
            .concat(tabledef.idgetter ? ["data-object-id", tabledef.idgetter(item) ] : [])
         ];
}
