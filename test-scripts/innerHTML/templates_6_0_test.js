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

  var _pretty_print_object = function(model, tree, obj_id)
  {
    var ret = [];
    var obj = model.get_object();
    var data = model.get_data(obj_id);
    if (obj && data)
    {
      for (var proto = null, i = 0; proto = data[i]; i++)
      {
        // skip the first object description
        if (i)
          ret.push(['div', proto[VALUE][CLASS_NAME], 'class', 'prototype-chain-object']);
        ret.push(_pretty_print_properties(model, tree, proto[PROPERTY_LIST] || []));
      }

    }
    return (
    ['examine-objects', 
      ret, 
      'rt-id', obj.rt_id.toString(),
      'data-id', model.id,
      'obj-id', obj.obj_id.toString()
    ]);
  };

  var _pretty_print_properties = function(model, tree, property_list)
  {
    var ret = [], value = '', type = '', short_val = '', obj_id = 0;
    for (var prop = null, i = 0; prop = property_list[i]; i++)
    {
      value = prop[PROPERTY_VALUE];
      switch (type = prop[PROPERTY_TYPE])
      {
        case "number":
        case "boolean":
        {
          ret.push(
          ['item',
            ['key', helpers.escapeTextHtml(prop[NAME]),  'class', 'no-expander'],
            ['value', value.toString(), 'class', type]
          ]);
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
            ['item',
              ['input', 'type', 'button', 'handler', 'expand-value', 'class', 'folder-key'],
              ['key', helpers.escapeTextHtml(prop[NAME])],
              ['value', helpers.escapeTextHtml(short_val), 'class', type, 'data-value', value]
            ]);
          }
          else
          {
            ret.push(
            ['item',
              ['key', helpers.escapeTextHtml(prop[NAME]), 'class', 'no-expander'],
              ['value', value, 'class', type]
            ]);
          }
          break;
        }
        case "null":
        case "undefined":
        {
          ret.push(
            ['item',
              ['key', helpers.escapeTextHtml(prop[NAME]), 'class', 'no-expander'],
              ['value', type, 'class', type]
          ]);
          break;
        }
        case "object":
        {
          obj_id = prop[OBJECT_VALUE][OBJECT_ID];
          ret.push(
          ['item', 
            ['input', 
              'type', 'button', 
              'handler', 'examine-object', 
              'class', 'folder-key'
            ].concat(obj_id in tree ? ['style', 'background-position: 0px -11px'] : []),
            ['key', helpers.escapeTextHtml(prop[NAME])],
            ['value', prop[OBJECT_VALUE][CLASS_NAME], 'class', 'object'],
            obj_id in tree ? _pretty_print_object(model, tree[obj_id], obj_id) : [],
            'obj-id', obj_id.toString()
          ]);
          break;
        }
      }
    }
    return ret;
  };

  this.inspected_js_object_test = function(model, show_root, path)
  {
    var tree = model.get_expand_tree();
    if (typeof show_root === 'boolean' && model.get_object())
      path = show_root ? null : [model.get_object().obj_id];
    for (var obj_id = 0, i = 0; path && path[i]; i++)
    {
      tree = tree[obj_id = path[i]];
      if (!tree)
        throw 'not valid path in InspectionBaseData.pretty_print';
    }
    return _pretty_print_object(model, tree, obj_id);
  }


}).apply(window.templates || (window.templates = {}));
