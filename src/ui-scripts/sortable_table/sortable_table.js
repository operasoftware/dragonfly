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
function SortableTable(tabledef, data, cols, sortby, groupby, reversed)
{
  this._init = function()
  {
    window.cls.MessageMixin.apply(this);
    if (!cols || !cols.length) {
      cols = [];
      for (var key in tabledef.columns) {
        cols.push(key);
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

    if (!sortby)
    {
      for (var n=0, key; key=cols[n]; n++)
      {
        if (tabledef.columns[key].sorter != "unsortable")
        {
          sortby = key;
          break;
        }
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
    var obj_id = evt.target.get_attr('parent-node-chain', 'data-table-object-id');
    var obj = ObjectRegistry.get_instance().get_object(obj_id);
    if (!obj.tabledef.groups) { return [] }

    var menuitems = [{
      label: ui_strings.M_SORTABLE_TABLE_CONTEXT_NO_GROUPING,
      selected: !obj.groupby,
      handler: obj._make_group_handler(null, obj._re_render_table)
    }];

    for (var group in obj.tabledef.groups)
    {
      menuitems.push({
        label: ui_strings.M_SORTABLE_TABLE_CONTEXT_GROUP_BY.replace("%s", obj.tabledef.groups[group].label || group),
        selected: obj.groupby == group,
        handler: obj._make_group_handler(group, obj._re_render_table)
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
        handler: obj._make_colselect_handler(colname, obj._re_render_table)
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

  this._make_group_handler = function(group, re_render_table)
  {
    return function(evt) {
      var obj_id = evt.target.get_attr('parent-node-chain', 'data-table-object-id');
      var obj = ObjectRegistry.get_instance().get_object(obj_id);
      obj.group(group);
      re_render_table(obj, evt.target.get_ancestor("table"));
    }
  }

  this._make_colselect_handler = function(col, re_render_table)
  {
    return function(evt) {
      var obj_id = evt.target.get_attr('parent-node-chain', 'data-table-object-id');
      var obj = ObjectRegistry.get_instance().get_object(obj_id);
      obj.togglecol(col);
      re_render_table(obj, evt.target.get_ancestor("table"));
    }
  }

  this._sort_handler = function(evt, target)
  {
    var obj_id = evt.target.get_attr('parent-node-chain', 'data-table-object-id');
    var obj = ObjectRegistry.get_instance().get_object(obj_id);
    var col_id = evt.target.get_attr('parent-node-chain', 'data-column-id')
    obj.sort(col_id);
    obj._re_render_table(obj, target.parentNode.parentNode);
  }

  this._re_render_table = function(obj, table)
  {
    if (table && table.parentNode)
    {
      obj.post_message("before-render", {table: table});
      table = table.re_render(obj.render());
      if (table)
        obj.post_message("after-render", {table: table[0]});
    }
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

  this.restore_columns = function(table)
  {
    this.columns = this.orgininal_columns.slice(0);
    this._re_render_table(this, table);
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
      if (typeof a === "number" && typeof b === "number") { return b - a }
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
  var table =  ["table",
                templates.sortable_table_header(tabledef, cols, sortby, reversed),
                templates.sortable_table_body(tabledef, data, cols, groupby, sortby, reversed),
                "class", "sortable-table",
                "data-table-object-id", objectid,
               ]
               
  if (!tabledef.options || !tabledef.options.no_default_menu)
  {
    table.push("data-menu", "sortable-table-grouper");
  }
  return table;
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
                    tabledef.columns[c].headerlabel !== undefined ? tabledef.columns[c].headerlabel : tabledef.columns[c].label,
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

  var render_group_headers = groupby && groupnames.length > 0;
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
    var row = ["tr",
                ["th", renderer(groupname, data),
                 "colspan", String(cols.length),
                 "class", "sortable-table-group-header"],
                "class", "header"
               ];
    if (tabledef.groups[groupby].idgetter)
    {
      row.push("data-object-id", tabledef.groups[groupby].idgetter(data));
    }
    tpl.push(row);
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
            var coldef = tabledef.columns[col];
            var content = coldef.renderer(item, coldef.getter);

            if (typeof content !== "undefined" && typeof content !== "null")
            {
              var title_templ=[];
              if (typeof content == "string")
              {
                title_templ = ["title", content]; // fixme: use custom title renderer.
              }

              if (typeof content == "string" && coldef.maxlength && coldef.maxlength < content.length)
              {
                if (coldef.ellipsis=="start")
                {
                  content = "…" + content.slice(-coldef.maxlength);
                }
                else
                {
                  content = content.slice(0, coldef.maxlength) + "…";
                }
              }
              return ["td", content].concat(title_templ).concat(coldef.align ? ["class", "align-" + coldef.align] : [])
            }
            return [];
          }).concat(tabledef.handler ? ["handler", tabledef.handler] : [])
            .concat(tabledef.idgetter ? ["data-object-id", tabledef.idgetter(item) ] : [])
         ];
}
