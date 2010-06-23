(function()
{
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
  MAX_VALUE_LENGTH = 30;

  var _pretty_print_object = function(model, tree, obj_id, ret)
  {
    ret || (ret = []);
    var data = model.get_data(obj_id), obj = model.get_object();
    if (obj && data)
    {
      ret.push(
        "<examine-objects " +
          "rt-id='" + obj.rt_id + "' " +
          "data-id='" + model.id + "' " +
          "obj-id='" + obj.obj_id + "' " +
          ">"
      );
      for (var proto = null, i = 0; proto = data[i]; i++)
      {
        // skip the first object description
        if (i)
          ret.push("<div class='prototype-chain-object'>", proto[VALUE][CLASS_NAME], "</div>");
        _pretty_print_properties(model, tree, proto[PROPERTY_LIST] || [], ret);
      }
      ret.push("</examine-objects>");
    };
    return ret;
  };

  var _pretty_print_properties = function(model, tree, property_list, ret)
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
          if (obj_id in tree)
            ret.push("style='background-position: 0px -11px') ");
          ret.push(
            "/>" +
            "<key>" + helpers.escapeTextHtml(prop[NAME]) + "</key>" +
            "<value class='object'>" + prop[OBJECT_VALUE][CLASS_NAME] + "</value>"
          );
          if (obj_id in tree)
            _pretty_print_object(model, tree[obj_id], obj_id, ret);
          ret.push("</item>");
          break;
        }
      }
    }
  };

  this.inspected_js_object = function(model, show_root, path)
  {
    var tree = model.get_expand_tree();
    if (typeof show_root === 'boolean' && model.get_object())
      path = show_root ? null : [model.get_object().obj_id];
    for (var obj_id = 0, i = 0; path && path[i]; i++)
    {
      tree = tree[obj_id = path[i]];
      if (!tree)
        throw 'not valid path in templates.inspected_js_object';
    }
    return _pretty_print_object(model, tree, obj_id).join('');
  }

}).apply(window.templates || (window.templates = {}));
