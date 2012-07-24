(function()
{
  /* extends window.templates interface */

  this.inspected_js_object = function(model, show_root, path){};
  this.inspected_js_prototype = function(model, path, index){};

  /* constants */

  const
  // sub message ObjectInfo
  VALUE = 0,
  PROPERTY_LIST = 1,
  // sub message ObjectValue
  OBJECT_ID = 0,
  CLASS_NAME = 4,
  // sub message Property
  NAME = 0,
  PROPERTY_TYPE = 1,
  PROPERTY_VALUE = 2,
  OBJECT_VALUE = 3,
  // added fields
  MAX_VALUE_LENGTH = 30,
  STYLE_EXPANDED = "style='background-position: 0px -11px' ",
  IS_EDITABLE = 5,
  UID = 6,
  TOOLTIP_NAME = cls.JSInspectionTooltip.tooltip_name;

  /* private */

  var _has_own_prop = Object.prototype.hasOwnProperty;

  var _is_unfolded = function(tree, index, name, collapsed_protos)
  {
    if (!index) // the properties of the object itself
      return true;

    if (!_has_own_prop.call(tree.protos, index.toString()))
      return collapsed_protos[0] == '*'
           ? false
           :  (collapsed_protos.indexOf(name) == -1);

    return Boolean(tree.protos[index]);
  }

  var _pretty_print_object = function(model,
                                      tree,
                                      obj_id,
                                      collapsed_protos,
                                      filter,
                                      searchterm)
  {
    var ret = [];
    var data = model.get_data(obj_id);
    if (data)
    {
      for (var proto = null, i = 0; proto = data[i]; i++)
      {
        ret.extend(_pretty_print_proto(model,
                                       tree,
                                       proto,
                                       i,
                                       collapsed_protos,
                                       filter,
                                       searchterm,
                                       obj_id));
      }
      if (ret.length)
      {
        ret.unshift("<examine-objects data-id='" + model.id + "' data-menu='object-inspection-key'>");
        ret.push("</examine-objects>");
      }
    };
    return ret;
  };

  var _pretty_print_proto = function(model,
                                     tree,
                                     proto,
                                     index,
                                     collapsed_protos,
                                     filter, //name, index
                                     searchterm,
                                     parent_obj_id)
  {
    var ret = [];
    var name = proto[VALUE][CLASS_NAME] || "";
    var is_unfolded = _is_unfolded(tree, index, name, collapsed_protos);
    var expanded_props = is_unfolded &&
                         _pretty_print_properties(model,
                                                  tree.protos && tree.protos[index] || {},
                                                  proto[PROPERTY_LIST] || [],
                                                  collapsed_protos,
                                                  filter,
                                                  name,
                                                  index,
                                                  searchterm,
                                                  parent_obj_id);
    var has_match = !searchterm || name.toLowerCase().contains(searchterm);
    if (has_match || expanded_props.length)
    {
      ret.push("<div class='prototype' data-proto-index='" + index + "'>");
      // skip the first object description
      if (index)
      {
        ret.push(
          "<div handler='expand-prototype' class='prototype-chain-object" +
                                                 (has_match ? "" : " no-match") +
                                                 (is_unfolded ? " unfolded" : "") +
          "'>" +
            "<input type='button' " +
                   "class='folder-key' " +
                   "proto-index='" + index + "' " +
                   "/>",
            "<key>" + name + "</key>",
          "</div>");
      }
      if (is_unfolded)
      {
        ret.extend(expanded_props);
      }
      ret.push("</div>");
    }
    return ret;
  };

  var editable = function(prop)
  {
    if (prop[IS_EDITABLE])
    {
      return " data-prop-uid='" + prop[UID] + "' ";
    }
    return "";
  };

  var _pretty_print_properties = function(model,
                                          tree,
                                          property_list,
                                          collapsed_protos,
                                          filter,
                                          name,
                                          index,
                                          searchterm,
                                          parent_obj_id)
  {
    var
    ret = [],
    esc_name = '',
    value = '',
    type = '',
    short_val = '',
    obj_id = 0,
    filter_obj = !index && filter && filter[name],
    has_match = false,
    expanded_prop = null;

    for (var prop = null, i = 0; prop = property_list[i]; i++)
    {
      value = prop[PROPERTY_VALUE];
      esc_name = helpers.escapeAttributeHtml(prop[NAME]);
      switch (type = prop[PROPERTY_TYPE])
      {
        case "number":
        case "boolean":
        case "error":
        {
          if (!searchterm ||
              prop[NAME].toLowerCase().contains(searchterm) ||
              value.toLowerCase().contains(searchterm))
          {
            ret.push(
              "<item>" +
                "<key class='no-expander' data-spec='dom#" + esc_name + "'" +
                  editable(prop) + ">" +
                  esc_name +
                "</key>\u00A0" +
                "<value class='" + type + "'>" + value + "</value>" +
              "</item>"
            );
          }
          break;
        }
        case "script_getter":
        {
          if (!searchterm ||
              prop[NAME].toLowerCase().contains(searchterm) ||
              value.toLowerCase().contains(searchterm))
          {
            ret.push(
              "<item obj-id='" + parent_obj_id + "'>" +
                "<key class='no-expander' data-spec='dom#" + esc_name + "'" +
                  editable(prop) + ">" +
                  esc_name +
                "</key>\u00A0" +
                "<value class='" + type + "' handler='get-getter-value'>" +
                  "getter</value>" +
              "</item>"
            );
          }
          break;
        }
        case "string":
        {
          if (filter_obj &&
              (prop[NAME] in filter_obj) &&
              filter_obj[prop[NAME]].type == "string" &&
              filter_obj[prop[NAME]].value === value)
          {
            continue;
          }
          short_val = value.length > MAX_VALUE_LENGTH ?
                        value.slice(0, MAX_VALUE_LENGTH) + '…' : '';
          value = helpers.escapeAttributeHtml(value);
          if (short_val)
          {
            if (!searchterm ||
                prop[NAME].toLowerCase().contains(searchterm) ||
                short_val.toLowerCase().contains(searchterm))
            {
              ret.push(
                "<item>" +
                  "<input type='button' handler='expand-value' class='folder-key'/>" +
                  "<key data-spec='dom#" + esc_name + "'" +
                    editable(prop) + ">" + esc_name + "</key>\u00A0" +
                  "<value class='" + type + "' data-value='\"" + value + "\"'>" +
                    "\"" + helpers.escapeTextHtml(short_val) + "\"" +
                  "</value>" +
                "</item>"
              );
            }
          }
          else
          {
            if (!searchterm ||
                prop[NAME].toLowerCase().contains(searchterm) ||
                value.toLowerCase().contains(searchterm))
            {
              ret.push(
                "<item>" +
                  "<key class='no-expander' data-spec='dom#" + esc_name + "'" +
                    editable(prop) + ">" +
                    esc_name +
                  "</key>\u00A0" +
                  "<value class='" + type + "'>\"" + value + "\"</value>" +
                "</item>"
              );
            }
          }
          break;
        }
        case "null":
          if (filter_obj &&
              (prop[NAME] in filter_obj) &&
              filter_obj[prop[NAME]].type == "null")
            continue;
        case "undefined":
        {
          if (!searchterm ||
              prop[NAME].toLowerCase().contains(searchterm) ||
              type.toLowerCase().contains(searchterm))
          {
            ret.push(
              "<item>" +
                "<key class='no-expander' data-spec='dom#" + esc_name + "'" +
                  editable(prop) + ">" +
                  esc_name +
                "</key> " +
                "<value class='" + type + "'>" + type + "</value>" +
              "</item>"
            );
          }
          break;
        }
        case "object":
        {
          obj_id = prop[OBJECT_VALUE][OBJECT_ID];
          expanded_prop = _has_own_prop.call(tree, prop[NAME]) &&
                          _pretty_print_object(model,
                                               tree[prop[NAME]],
                                               obj_id,
                                               collapsed_protos,
                                               filter,
                                               searchterm);
          value = prop[OBJECT_VALUE][CLASS_NAME];
          has_match = !searchterm ||
                      prop[NAME].toLowerCase().contains(searchterm) ||
                      value.toLowerCase().contains(searchterm);
          if (has_match || expanded_prop.length)
          {
            ret.push(
              "<item obj-id='" + obj_id + "'>" +
              "<input " +
                "type='button' " +
                "handler='examine-object'  " +
                "class='folder-key" + (has_match ? "" : " no-match") + "' "
            );
            // 'in' is true for all non enumarables
            if (_has_own_prop.call(tree, prop[NAME]) && tree[prop[NAME]])
              ret.push(STYLE_EXPANDED);
            ret.push(
              "/>" +
              "<key " + (has_match ? "" : " class='no-match'") +
                        "data-spec='dom#" + esc_name + "'" + editable(prop) +
                        ">" + esc_name + "</key>" +
              (esc_name ? " " : "") +
              "<value class='object" + (has_match ? "" : " no-match") + "' " +
                     "data-spec='dom#" + value + "' " +
                     "data-tooltip='" + TOOLTIP_NAME + "' >" + value + "</value>"
            );

            if (_has_own_prop.call(tree, prop[NAME]))
              ret.extend(expanded_prop);

            ret.push("</item>");
          }
          break;
        }
      }
    }
    return ret;
  };

  /* implementation */

  this.inspected_js_object = function(model, show_root, path, searchterm)
  {
    searchterm = searchterm && searchterm.toLowerCase();
    var tree = model.get_expanded_tree(show_root, path);
    var setting = window.settings.inspection;
    var collapsed_protos = setting.get('collapsed-prototypes');
    var filter = !setting.get('show-default-nulls-and-empty-strings') &&
                 window.inspectionfilters;
    var ret = _pretty_print_object(model,
                                   tree,
                                   tree.object_id,
                                   collapsed_protos,
                                   filter,
                                   searchterm).join('');
    if (model.scope_list && model.scope_list.length && !path)
      ret += this.inspected_js_scope_chain(model, searchterm);
    return ret;
  }

  this.inspected_js_prototype = function(model, path, index, name)
  {
    var OBJ_ID = 1;
    var tree = model.get_expanded_tree(null, path);
    var data = tree && model.get_data(tree.object_id);
    var setting = window.settings.inspection;
    var collapsed_protos = setting.get('collapsed-prototypes');
    var filter = !setting.get('show-default-nulls-and-empty-strings') &&
                 window.inspectionfilters;
    return data ? _pretty_print_proto(model,
                                      tree,
                                      data[index],
                                      index,
                                      collapsed_protos,
                                      filter,
                                      null,
                                      path.last[OBJ_ID]).join('') : '';
  }

  this.inspected_js_scope_chain = function(model, searchterm)
  {
    var ret = [];
    var name = ui_strings.S_LABEL_SCOPE_CHAIN;
    var has_match = !searchterm || name.toLowerCase().contains(searchterm);
    if (model.scope_list_models)
    {
      for (var i = 0, scope, scope_props; scope = model.scope_list_models[i]; i++)
      {
        if (scope_props = this.inspected_js_object(scope, true, null, searchterm))
        {
          ret.push(scope_props);
        }
      }
    }
    if (has_match || ret.length)
    {
      ret.unshift(
        "<div class='scope-chain'>" +
          "<header handler='expand-scope-chain' " +
                  "data-id='" + model.id + "' " +
                  (has_match ? "" : " class='no-match'") + ">" +
            "<input type='button' " +
              "class='" + (model.scope_list_models ? "unfolded" : "") + "' >" +
            name +
          "</header>"
      );
      ret.push("</div>");
    };
    return ret.join('');
  }

}).apply(window.templates || (window.templates = {}));
