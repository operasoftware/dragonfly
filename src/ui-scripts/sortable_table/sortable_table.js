"use strict";

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
function SortableTable(tabledef, data, cols, sortby, groupby, reversed, id)
{
  // consts for where the table-options are stored
  var GROUPER = "table-groupby-" + id,
      SORTER = "table-sort-col-" + id,
      SORT_REVERSE = "table-sort-reversed-" + id,
      COLUMNS = "table-columns-" + id;

  this._init = function()
  {
    window.cls.MessageMixin.apply(this);

    // if cols is not passed or restored from localStorage, all tabledef.columns are shown by default
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

    groupby = localStorage[GROUPER] || groupby;
    sortby = localStorage[SORTER] || sortby;
    if (localStorage[COLUMNS])
      var stored_cols = localStorage[COLUMNS].split(",");

    if (
      localStorage[SORT_REVERSE] !== null &&
      localStorage[SORT_REVERSE] !== undefined
    )
    {
      reversed = localStorage[SORT_REVERSE] === "true";
    }

    this.id = id;
    this.sortby = sortby;
    this.tabledef = tabledef;
    if (data)
      this.set_data(data);

    // visible columns
    this.columns = stored_cols || cols;
    // visible columns, as originally passed in. used for restore.
    this.default_columns = cols.slice(0);
    this.reversed = !!reversed;
    this.groupby = groupby;
    this._elem = null;
    this.objectid = ObjectRegistry.get_instance().set_object(this);
    this._init_handlers();
  }

  this.set_data = function(data)
  {
    if (this.tabledef.idgetter)
    {
      this._org_data_order = data.map(this.tabledef.idgetter);
    }
    this._data = data;
  };

  this.get_data = function()
  {
    return this._data;
  };

  this._init_handlers = function()
  {
    if (!eventHandlers.click["sortable-table-sort"])
    {
      eventHandlers.click["sortable-table-sort"] = this._sort_handler;
    }

    // should be conditional, but doesn't matter as you don't get
    // dupes in the context menu registry anyhow.
    var contextmenu = ContextMenu.get_instance();
    contextmenu.register("sortable-table-menu", [
      { callback: this._make_context_menu }
    ]);
    // and not in tooltips either
    Tooltips.register("sortable-table-tooltip", true, false);
  }

  this._make_context_menu = function(evt)
  {
    var obj_id = evt.target.get_attr('parent-node-chain', 'data-table-object-id');
    var obj = ObjectRegistry.get_instance().get_object(obj_id);

    var menuitems = [];
    if (obj.tabledef.groups &&
        !(obj.tabledef.options && obj.tabledef.options.no_group_changing))
    { 
      menuitems.push({
        label: ui_strings.M_SORTABLE_TABLE_CONTEXT_NO_GROUPING,
        selected: !obj.groupby,
        handler: obj._make_group_handler(null, obj._re_render_table)
      });

      for (var group in obj.tabledef.groups)
      {
        menuitems.push({
          label: ui_strings.M_SORTABLE_TABLE_CONTEXT_GROUP_BY.replace("%s", obj.tabledef.groups[group].label || group),
          selected: obj.groupby == group,
          handler: obj._make_group_handler(group, obj._re_render_table)
        });
      }
    }

    var allcols = obj.tabledef.column_order;
    if (!allcols)
    {
      allcols = [];
      for (var key in obj.tabledef.columns)
      {
        allcols.push(key);
      }
    }

    // When all columns are shown by default, there will be no column selection in
    // the context menu. Could be an explicite option too, but right now, this is a good fit.
    if (allcols.join(",") !== obj.default_columns.join(","))
    {
      // visible column selection stuff
      if (menuitems.length)
        menuitems.push(ContextMenu.separator);

      for (var n=0, colname; colname = allcols[n]; n++)
      {
        coldef = obj.tabledef.columns[colname];
        menuitems.push({
          label: coldef.label,
          checked: obj.columns.indexOf(colname) != -1,
          handler: obj._make_colselect_handler(colname, obj._re_render_table)
        });
      }

      var is_default_cols = obj.columns.join(",") === obj.default_columns.join(",");
      menuitems.push({
        label: ui_strings.M_SORTABLE_TABLE_CONTEXT_RESET_COLUMNS,
        handler: !is_default_cols && obj._make_restore_columns_handler(obj._re_render_table),
        disabled: is_default_cols
      });
    }

    if (obj.sortby && obj._org_data_order)
    {
      if (menuitems.length)
        menuitems.push(ContextMenu.separator);

      menuitems.push({
        label: ui_strings.M_SORTABLE_TABLE_CONTEXT_RESET_SORT,
        handler: obj._make_reset_sort_handler(obj._re_render_table)
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

  this._make_restore_columns_handler = function(re_render_table)
  {
    return function(evt) {
      var obj_id = evt.target.get_attr("parent-node-chain", "data-table-object-id");
      var obj = ObjectRegistry.get_instance().get_object(obj_id);
      obj.restore_columns();
      re_render_table(obj, evt.target.get_ancestor("table"));
    }
  }

  this._make_reset_sort_handler = function(re_render_table)
  {
    var make_sort_function = function(idgetter, data_order)
    {
      return function(a, b) {
        var ind_a = data_order.indexOf(idgetter(a));
        var ind_b = data_order.indexOf(idgetter(b));
        
        if (ind_a === ind_b)
          return 0;

        if (ind_a > ind_b)
          return 1;

        return -1;
      }
    }
    return function(evt) {
      var obj_id = evt.target.get_attr("parent-node-chain", "data-table-object-id");
      var obj = ObjectRegistry.get_instance().get_object(obj_id);
      if (obj._org_data_order)
      {
        obj.reversed = localStorage[SORT_REVERSE] = null;
        obj.sortby = localStorage[SORTER] = null;
        var sort_func = make_sort_function(obj.tabledef.idgetter, obj._org_data_order);
        obj.set_data(obj.get_data().sort(sort_func));
        re_render_table(obj, evt.target.get_ancestor("table"));
      }
    }
  }

  this._sort_handler = function(evt, target)
  {
    var obj_id = evt.target.get_attr('parent-node-chain', 'data-table-object-id');
    var obj = ObjectRegistry.get_instance().get_object(obj_id);
    var col_id = evt.target.get_attr('parent-node-chain', 'data-column-id');
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
    return templates.sortable_table(this.tabledef, this._data, this.objectid,
                                    this.columns, this.groupby, this.sortby,
                                    this.reversed);
  };

  this.restore_columns = function()
  {
    this.columns = this.default_columns.slice(0);
    localStorage[COLUMNS] = this.columns.join(",");
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
      if (this.id)
        localStorage[SORT_REVERSE] = this.reversed;

    }
    else
    {
      this.sortby = col;
      if (this.id)
        localStorage[SORTER] = col;

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
    if (this.id)
      localStorage[GROUPER] = this.groupby;

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
    if (this.id)
      localStorage[COLUMNS] = this.columns.join(",");
  }

  this._init();
};

window.templates = window.templates || {};

templates.sortable_table = function(tabledef, data, objectid, cols, groupby, sortby, reversed)
{
  var table =  ["table",
                templates.sortable_table_header(tabledef, cols, sortby, reversed),
                templates.sortable_table_body(tabledef, data, cols, groupby, sortby, reversed),
                "class", "sortable-table" + (tabledef.nowrap ? " nowrap" : ""),
                "data-table-object-id", objectid,
               ]
               
  if (!tabledef.options || !tabledef.options.no_default_menu)
  {
    table.push("data-menu", "sortable-table-menu");
  }
  return table;
}

templates.sortable_table_header = function(tabledef, cols, sortby, reversed)
{
  return ["tr",
          cols.map(function(c) {
            var coldef = tabledef.columns[c];
            if (!coldef)
              return [];

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
            var headerlabel = tabledef.columns[c].headerlabel !== undefined ? 
                              tabledef.columns[c].headerlabel : tabledef.columns[c].label;
            headerlabel = templates.sortable_table_wrap_ellipsis(headerlabel, coldef.headertooltip);
            return ["th", headerlabel,
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
    groupnames.sort();
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
  var sorter = sortby && tabledef.columns[sortby].sorter;
  if (sorter) { data.sort(sorter); }
  if (reversed) { data.reverse() }

  var tpl = [];
  if (render_header) {
    var groupdef = tabledef.groups[groupby];
    var renderer = groupdef.renderer || function(g) { return g };
    var content = renderer(groupname, data);
    content = templates.sortable_table_wrap_ellipsis(content);
    var row = ["tr",
                ["th", content,
                 "colspan", String(cols.length),
                 "class", "sortable-table-group-header"],
                "class", "header"
               ];
    if (groupdef.idgetter)
    {
      row.push("data-object-id", groupdef.idgetter(data));
    }
    tpl.push(row);
  }

  var ret = tpl.concat(data.map(function(item) {
    return templates.sortable_table_row(tabledef, item, cols)
  }));

  for (var n=0, col; col = cols[n]; n++)
  {
    var coldef = tabledef.columns[col];
    if (coldef && coldef.summer)
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
            var coldef = tabledef.columns[e];
            var val = "";
            var summer = coldef.summer;
            if (summer)
              val = summer(data, groupname)

            if (coldef.use_ellipsis)
              val = templates.sortable_table_wrap_ellipsis(val);

            return ["td", val, "class", coldef.align ? "align-" + coldef.align : ""];
          }),
          "class", "sortable-table-summation-row"
         ];
}

templates.sortable_table_row = function(tabledef, item, cols)
{
  return ["tr",
          cols.map(function(col) {
            var coldef = tabledef.columns[col];
            if (!coldef)
              return [];
            var content = coldef.renderer(item, coldef.getter);

            if (typeof content !== "undefined" && typeof content !== "null")
            {
              var title;
              if (coldef.title_getter)
                title = coldef.title_getter(item, coldef.renderer);

              if (coldef.use_ellipsis)
                content = templates.sortable_table_wrap_ellipsis(content, title);

              var add_title_to_td = !coldef.use_ellipsis && title;
              return ["td", content]
                        .concat(add_title_to_td ? ["data-tooltip", "sortable-table-tooltip",
                                                   "data-tooltip-text", title] : [])
                        .concat(coldef.align ? ["class", "align-" + coldef.align] : [])
                        .concat(coldef.attributes ? coldef.attributes : [])
            }
            return [];
          }).concat(tabledef.handler ? ["handler", tabledef.handler] : [])
            .concat(tabledef.idgetter ? ["data-object-id", tabledef.idgetter(item) ] : [])
         ];
}

templates.sortable_table_wrap_ellipsis = function(content, title)
{
  var title = title || (typeof content === "string" && content);
   return [
    "div",
      [
        "div", content,
        "class", "ellipsis"
      ],
    "class", "ellipsis_cont"
  ].concat(title ? ["data-tooltip", "sortable-table-tooltip",
                    "data-tooltip-text", title] : []);
}