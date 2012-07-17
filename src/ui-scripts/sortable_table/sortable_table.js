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
var SortableTable = function(tabledef, data, cols, sortby, groupby, reversed, id)
{
  this._init(tabledef, data, cols, sortby, groupby, reversed, id);
};

var SortableTablePrototype = function()
{
  var NULL_STORAGE = "__null";
  if (window.cls && window.cls.MessageMixin)
    window.cls.MessageMixin.apply(this);

  this._init = function(tabledef, data, cols, sortby, groupby, reversed, id)
  {
    this._grouper_storage_id = "table-groupby-" + id,
    this._sorter_storage_id = "table-sort-col-" + id,
    this._sort_reverse_storage_id = "table-sort-reversed-" + id,
    this._columns_storage_id = "table-columns-" + id;

    // if cols is not passed or restored from localStorage, all tabledef.columns are shown by default
    if (!cols || !cols.length)
    {
      cols = [];
      for (var key in tabledef.columns)
      {
        cols.push(key);
      }
    }

    for (var key in tabledef.columns)
    {
      var col = tabledef.columns[key];
      if (!col.getter)
      {
        col.getter = window.helpers.prop(key);
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

    groupby = localStorage[this._grouper_storage_id] || groupby;
    if (groupby === NULL_STORAGE)
      groupby = null;

    sortby = localStorage[this._sorter_storage_id] || sortby;
    if (sortby === NULL_STORAGE)
      sortby = null;

    if (localStorage[this._columns_storage_id])
      var stored_cols = JSON.parse(localStorage[this._columns_storage_id]);

    if (
      localStorage[this._sort_reverse_storage_id] &&
      localStorage[this._sort_reverse_storage_id] !== NULL_STORAGE
    )
    {
      reversed = localStorage[this._sort_reverse_storage_id] === "true";
    }

    this.id = id;
    this.sortby = sortby;
    this.tabledef = tabledef;

    // visible columns
    this.columns = stored_cols || cols;
    // visible columns, as originally passed in. used for restore.
    this.default_columns = cols.slice(0);
    this.reversed = Boolean(reversed);
    this._wrapped_sorters = {};
    this.groupby = groupby;
    this._elem = null;
    this.objectid = ObjectRegistry.get_instance().set_object(this);
    this._re_render_bound = this._re_render.bind(this);
    this._init_handlers();
    if (data)
      this.set_data(data);

  }

  this.set_data = function(data)
  {
    if (this.tabledef.idgetter)
    {
      this._org_data_order = this._last_item_order = data.map(this.tabledef.idgetter);
    }
    this._data = data;
    this.reorder();
  };

  this.get_data = function()
  {
    return this._data;
  };

  this.reorder = function()
  {
    var sorter = this.sortby && this.tabledef.columns[this.sortby].sorter;
    if (sorter)
    {
      var wrapped_sorter = this._wrapped_sorters[this.sortby];
      if (!wrapped_sorter)
      {
        wrapped_sorter = this._wrapped_sorters[this.sortby]
                       = this._sort_wrapper.bind(this, sorter);
      }

      this._data.sort(wrapped_sorter);
      if (this.tabledef.idgetter)
        this._last_item_order = this._data.map(this.tabledef.idgetter);
    }
    else if (this.tabledef.idgetter)
    {
      this._reset_data_order();
    }
  };

  this._sort_wrapper = function(sorter, a, b)
  {
    var val = sorter(a, b);
    if (this.reversed)
      val *= -1;

    if (val === 0 && this._last_item_order)
    {
      var id = this.tabledef.idgetter;
      var order = this._last_item_order;
      val = order.indexOf(id(a)) < order.indexOf(id(b)) ? -1 : 1;
    }
    return val;
  }

  this._init_handlers = function()
  {
    if (!eventHandlers.click["sortable-table-sort"])
    {
      eventHandlers.click["sortable-table-sort"] = this._sort_handler;
    }

    // should be conditional, but doesn't matter as you don't get
    // dupes in the context menu registry anyhow.
    if (window.ContextMenu)
    {
      var contextmenu = ContextMenu.get_instance();
      contextmenu.register("sortable-table-menu", [
        { callback: this._make_context_menu }
      ]);
    }
    // and not in tooltips either
    if (window.Tooltips)
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
        handler: obj._generic_handler.bind(null, "group", null)
      });

      for (var group in obj.tabledef.groups)
      {
        menuitems.push({
          label: ui_strings.M_SORTABLE_TABLE_CONTEXT_GROUP_BY.replace("%s", obj.tabledef.groups[group].label || group),
          selected: obj.groupby == group,
          handler: obj._generic_handler.bind(null, "group", group)
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
    // the context menu. Could be an explicit option too, but right now, this is a good fit.
    if (allcols.join(",") !== obj.default_columns.join(","))
    {
      // visible column selection stuff
      if (menuitems.length)
        menuitems.push(ContextMenu.separator);

      for (var n = 0, colname; colname = allcols[n]; n++)
      {
        var coldef = obj.tabledef.columns[colname];
        menuitems.push({
          label: coldef.label,
          checked: obj.columns.indexOf(colname) != -1,
          handler: obj._generic_handler.bind(null, "togglecol", colname)
        });
      }

      var is_default_cols = obj.columns.join(",") === obj.default_columns.join(",");
      menuitems.push({
        label: ui_strings.M_SORTABLE_TABLE_CONTEXT_RESET_COLUMNS,
        handler: !is_default_cols && obj._generic_handler.bind(null, "togglecol", null),
        disabled: is_default_cols
      });
    }

    if (obj.sortby && obj._org_data_order)
    {
      if (menuitems.length)
        menuitems.push(ContextMenu.separator);

      menuitems.push({
        label: ui_strings.M_SORTABLE_TABLE_CONTEXT_RESET_SORT,
        handler: obj._generic_handler.bind(null, "change_sort", null)
      });
    }
    return menuitems;
  }

  this._find_col_insertion_point = function(col)
  {
    var colpoint = this.tabledef.column_order.indexOf(col);
    for (var n = colpoint + 1, current; current = this.tabledef.column_order[n]; n++)
    {
      var point = this.columns.indexOf(current);
      if (point != -1) {
        return point;
      }
    }
    return this.columns.length;
  }

  this._generic_handler = function(method_name, option, evt)
  {
    // method_name is the method_name that the chosen option is passed to.
    // group, togglecol, sort
    var table = evt.target.get_ancestor("[data-table-object-id]");
    var obj_id = table.getAttribute("data-table-object-id");
    var table_instance = ObjectRegistry.get_instance().get_object(obj_id);
    table_instance[method_name](option);
    table_instance._re_render_bound(table);
  }

  this._sort_handler = function(evt, target)
  {
    var table = evt.target.get_ancestor("[data-table-object-id]");
    var obj_id = table.getAttribute("data-table-object-id");
    var table_instance = ObjectRegistry.get_instance().get_object(obj_id);
    var col_id = evt.target.get_attr("parent-node-chain", "data-column-id");
    table_instance.change_sort(col_id);
    table_instance._re_render_bound(table);
  }

  this._re_render = function(table)
  {
    if (table && table.parentNode)
    {
      if (this.post_message)
        this.post_message("before-render", {table: table});

      var template = this.render();
      table = table.re_render(template);
      if (table && this.post_message)
        this.post_message("after-render", {table: table[0], template: template});
    }
  };

  this.render = function()
  {
    return templates.sortable_table(this.tabledef, this._data, this.objectid,
                                    this.columns, this.groupby, this.sortby,
                                    this.reversed);
  };

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

  this.change_sort = function(col)
  {
    if (col == this.sortby)
    {
      this.reversed = !this.reversed;
      if (this.id)
        localStorage[this._sort_reverse_storage_id] = this.reversed;

    }
    else
    {
      this.sortby = col;
      if (!this.sortby)
      {
        // reset sorting
        this.sortby = null;
        this.reversed = false;
        if (this.id)
          localStorage[this._sort_reverse_storage_id] = NULL_STORAGE;

      }

      if (this.id)
        localStorage[this._sorter_storage_id] = col || NULL_STORAGE;

    }
    this.reorder();
  };

  this._id_map = function(item)
  {
    return this.tabledef.idgetter(item);
  }

  this._reset_data_order = function()
  {
    var old_data_index = this._data.map(this._id_map, this);
    var new_data = [];
    this._last_item_order = this._org_data_order;
    for (var i = 0; i < this._org_data_order.length; i++)
    {
      var id = this._org_data_order[i];
      var index = old_data_index.indexOf(id);
      new_data.push(this._data[index]);
    }
    this._data = new_data;
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
      localStorage[this._grouper_storage_id] = this.groupby || NULL_STORAGE;

  }

  this.togglecol = function(col)
  {
    if (!col)
    {
      // reset columns
      this.columns = this.default_columns.slice(0);
    }
    else
    {
      var index = this.columns.indexOf(col);
      if (index == -1)
      {
        var point = this._find_col_insertion_point(col);
        this.columns.splice(point, 0, col);
      }
      else
        this.columns.splice(index, 1);

    }
    if (this.id)
      localStorage[this._columns_storage_id] = JSON.stringify(this.columns);

  }
};

SortableTable.prototype = new SortableTablePrototype();

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
              if (sortby == c)
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
              var ret = ["td", content];
              if (add_title_to_td)
                ret.push("data-tooltip", "sortable-table-tooltip", "data-tooltip-text", title);

              if (coldef.align)
                ret.push("class", "align-" + coldef.align)

              if (coldef.attributes)
                ret = ret.concat(coldef.attributes);

              return ret;
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
