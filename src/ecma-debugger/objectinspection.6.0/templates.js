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
  STYLE_EXPANDED = "style='background-position: 0px -11px') ";

  /* private */

  var _is_unfolded = function(tree, index, name, collapsed_protos)
  {
    if (!index) // the properties of the object itself
      return true;
    if (collapsed_protos[0] == '*')
      return false;
    if (!tree.protos.hasOwnProperty(index.toString()))
      return collapsed_protos.indexOf(name) == -1;
    return Boolean(tree.protos[index]);
  }

  var _pretty_print_object = function(model, tree, obj_id, ret, collapsed_protos)
  {
    ret || (ret = []);
    collapsed_protos || (collapsed_protos = window.settings.inspection.get('collapsed-prototypes'));
    var data = model.get_data(obj_id);
    if (data)
    {
      ret.push("<examine-objects data-id='" + model.id + "' >");
      for (var proto = null, i = 0; proto = data[i]; i++)
        _pretty_print_proto(model, tree, proto, i, ret);
      ret.push("</examine-objects>");
    };
    return ret;
  };

  var _pretty_print_proto = function(model, tree, proto, index, ret, collapsed_protos)
  {
    ret || (ret = []);
    collapsed_protos || (collapsed_protos = window.settings.inspection.get('collapsed-prototypes'));
    var name = proto[VALUE][CLASS_NAME];
    var is_unfolded = _is_unfolded(tree, index, name, collapsed_protos);
    ret.push("<div class='prototype' data-proto-index='" + index + "'>");
    // skip the first object description
    if (index)
      ret.push(
        "<div class='prototype-chain-object'>" +
          "<input type='button' " +
                 "handler='expand-prototype' " +
                 "class='folder-key inverted' " +
                 "proto-index='" + index + "' " +
                 (is_unfolded ? STYLE_EXPANDED + "is-unfolded='true'" : "") +
                 "/>",
          "<key>" + name + "</key>", 
        "</div>");
    if (is_unfolded)
      _pretty_print_properties(model, tree.protos && tree.protos[index] || {}, proto[PROPERTY_LIST] || [], ret);
    ret.push("</div>");
    return ret;
  }



  var _pretty_print_properties = function(model, tree, property_list, ret, collapsed_protos)
  {
    var value = '', type = '', short_val = '', obj_id = 0;
    for (var prop = null, i = 0; prop = property_list[i]; i++)
    {
      value = prop[PROPERTY_VALUE];
      switch (type = prop[PROPERTY_TYPE])
      {
        case "number":
        case "boolean":
        {
          ret.push(
            "<item>" +
              "<key class='no-expander'>" + helpers.escapeTextHtml(prop[NAME]) + "</key>" +
              "<value class='" + type + "'>" + value + "</value>" +
            "</item>"
          );
          break;
        }
        case "string":
        {
          short_val = value.length > MAX_VALUE_LENGTH ? 
                        value.slice(0, MAX_VALUE_LENGTH) + '…"' : '';
          value = helpers.escapeTextHtml(value).replace(/'/g, '&#39;');
          if (short_val)
          {
            ret.push(
              "<item>" +
                "<input type='button' handler='expand-value'  class='folder-key'/>" +
                "<key>" + helpers.escapeTextHtml(prop[NAME]) + "</key>" +
                "<value class='" + type + "' data-value='" + value + "'>" +
                  "\"" + helpers.escapeTextHtml(short_val) +
                "</value>" +
              "</item>"
            );
          }
          else
          {
            ret.push(
              "<item>" +
                "<key class='no-expander'>" + helpers.escapeTextHtml(prop[NAME]) + "</key>" +
                "<value class='" + type + "'>\"" + value + "\"</value>" +
              "</item>"
            );
          }
          break;
        }
        case "null":
        case "undefined":
        {
          ret.push(
            "<item>" +
              "<key class='no-expander'>" + helpers.escapeTextHtml(prop[NAME]) + "</key>" +
              "<value class='" + type + "'>" + type + "</value>" +
            "</item>"
          );
          break;
        }
        case "object":
        {
          obj_id = prop[OBJECT_VALUE][OBJECT_ID];
          ret.push(
            "<item obj-id='" + obj_id + "'>" +
            "<input " +
              "type='button' " +
              "handler='examine-object'  " +
              "class='folder-key' "
          );
          if (tree.hasOwnProperty(prop[NAME])) // 'in' is true for all non enumarables
            ret.push(STYLE_EXPANDED);
          ret.push(
            "/>" +
            "<key>" + helpers.escapeTextHtml(prop[NAME]) + "</key>" +
            "<value class='object'>" + prop[OBJECT_VALUE][CLASS_NAME] + "</value>"
          );
          if (tree.hasOwnProperty(prop[NAME]))
            _pretty_print_object(model, tree[prop[NAME]], obj_id, ret);
          ret.push("</item>");
          break;
        }
      }
    }
  };

  /* implementation */

  this.inspected_js_object = function(model, show_root, path)
  {
    var tree = model.get_expanded_tree(show_root, path);
    return _pretty_print_object(model, tree, tree.object_id).join('');
  }

  this.inspected_js_prototype = function(model, path, index)
  {
    var tree = model.get_expanded_tree(null, path);
    var data = tree && model.get_data(tree.object_id);
    return data ? _pretty_print_proto(model, tree, data[index], index).join('') : '';
  }

}).apply(window.templates || (window.templates = {}));
