window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * @constructor
  */

/*
  status: OK
  payload: 
    objectChainList:
      objectChain: 
        objectList:

          object: 
            value: 
              objectID: 2
              isCallable: 0
              type: "object"
              prototypeID: 3
              className: "HTMLDocument"

            propertyList:

              property: 
                name: "URL"
                type: "string"
                value: "opera:debug"

              property: 
                name: "activeElement"
                type: "object"
                value: 
                objectValue: 
                  objectID: 22
                  isCallable: 0
                  type: "object"
                  prototypeID: 37
                  className: "HTMLButtonElement"

*/

cls.EcmascriptDebugger["6.0"].InspectionBaseData = function()
{

  /* interface */



  
  this.setObject = function(rt_id, obj_id, virtualProperties){};
  this.getData = function(rt_id, obj_id, depth, org_args){};
  this.prettyPrint = function(data, target_depth, use_filter, filter_type){};
  this.clearData = function(rt_id, obj_id, depth, key){};

  /* private */
  this.parseXML = function(status, message, rt_id, obj_id, org_args){};
  this.getObject = function(obj_id, depth, key){};
  this.getCountVirtualProperties = function(index){};
  
  this.__getData = function(index, target_depth){};

  /* constants */

  const
  OBJECT_CHAIN_LIST = 0,
  // sub message ObjectList 
  OBJECT_LIST = 0,
  // sub message ObjectInfo 
  VALUE = 0,
  PROPERTY_LIST = 1,
  // sub message ObjectValue 
  OBJECT_ID = 0,
  IS_CALLABLE = 1,
  TYPE = 2,
  PROTOTYPE_ID = 3,
  CLASS_NAME = 4,
  FUNCTION_NAME = 5;
  // sub message Property 
  NAME = 0,
  PROPERTY_TYPE = 1,
  PROPERTY_VALUE = 2,
  OBJECT_VALUE = 3,
  // added fields
  PROPERTY_ITEM = 4,
  MAX_VALUE_LENGTH = 30;

  

  //this._obj_map = {};
  //this._queried_map = {};

  this.setObject = function(rt_id, obj_id, virtual_props)
  {
    this._obj_map = {};
    this._queried_map = {};
    this._expand_tree = {};
    this._rt_id = rt_id;
    this._obj_id = obj_id;
    // TODO sync format
    this._virtual_props = virtual_props;
    
  }

  this.getData = function(rt_id, obj_id, path, org_args)
  {
    if (this._obj_map[obj_id])
    {
      // TODO ensure that the argument is allways an array or undefined
      if (Object.prototype.toString.call(path) == "[object Array]")
      {
        for (var i = 0, cur = null, tree = this._expand_tree; cur = path[i]; i++)
          tree = tree[cur] || (tree[cur] = {});
      }
      else if (obj_id == this._obj_id && !this._expand_tree[obj_id])
        this._expand_tree[obj_id] = {};
      return this._obj_map[obj_id];
    }
    var tag = window.tag_manager.set_callback(this, this._handle_examine_object, [rt_id, obj_id, org_args]);
    window.services['ecmascript-debugger'].requestExamineObjects(tag, [rt_id, [obj_id], 1]); 
  }

  this._handle_examine_object = function(status, message, rt_id, obj_id, org_args)
  {
    var 
    proto_chain = null,
    property_list = null,
    i = 0,
    class_name = '',
    items = null,
    attributes = null,
    cursor = null,
    i = 0,
    re_d = /^\d+$/;

    if (status)
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + ' failed to examine object');
    else
    {
      proto_chain = message[OBJECT_CHAIN_LIST][0][OBJECT_LIST];
      for (; proto = proto_chain[i]; i++)
      {
        class_name = proto[VALUE][CLASS_NAME];
        property_list = proto[PROPERTY_LIST];
        if (property_list)
        {
          if (class_name == "Array" || /Collection/.test(class_name))
          {
            items = [];
            attributes = [];
            for (i = 0; cursor = property_list[i]; i++)
            {
              if (re_d.test(cursor[NAME]))
              {
                cursor[PROPERTY_ITEM] = parseInt(cursor[NAME]);
                items.push(cursor);
              }
              else
                attributes.push(cursor);
            }
            items.sort(this._sort_item);
            attributes.sort(this._sort_name);
            proto[PROPERTY_LIST] = items.concat(attributes);
          }
          else
            proto[PROPERTY_LIST].sort(this._sort_name);
        }
        if (i == 0 && obj_id == this._obj_id && this._virtual_props)
          proto[PROPERTY_LIST] = this._virtual_props.concat(proto[PROPERTY_LIST] || []);
          
      }

      this._obj_map[obj_id] = proto_chain;
      if (org_args && !this._queried_map[obj_id])
      {
        this._queried_map[obj_id] = true;
        org_args.callee.apply(null, org_args);
      }
    }
  }

  this._sort_name = function(a, b)
  {
    return a[NAME] < b[NAME] ? -1 : a[NAME] > b[NAME] ? 1 : 0;
  };


  this._sort_item = function(a, b)
  {
    return a[PROPERTY_ITEM] < b[PROPERTY_ITEM] ? -1 : a[PROPERTY_ITEM] > b[PROPERTY_ITEM] ? 1 : 0;
  };

  this.clearData = function(rt_id, obj_id, path)
  {
    var i = 0, cur = '', tree = this._expand_tree, dead_ids = null, ids = null;
    if (path)
    {
      for (; cur = path[i]; i++)
      {
        if (i == path.length -1)
        {
          dead_ids = [cur].concat(this._get_all_ids(tree[cur]));
          tree[cur] = null;
        }
        else
        {
          tree = tree[cur];
          if (!tree)
            throw 'not valid path in InspectionBaseData.clearData';
        }
      }
      ids = this._get_all_ids(this._expand_tree);
      for (i = 0; cur = dead_ids[i]; i++)
      {
        if (ids.indexOf(cur) == -1)
          this._obj_map[cur] = this._queried_map[cur] = null;
      }
    }
    else
    {
      this._obj_map =
      this._queried_map =
      this._expand_tree = 
      this._virtual_props = null;
      this._rt_id =
      this._obj_id = 0;
    }
  }

  this._get_all_ids = function get_all_ids(tree, ret)
  {
    ret || (ret = []);
    for (var id in tree)
    {
      if (tree[id])
      {
        ret.push(id);
        get_all_ids(tree[id], ret);
      }
    }
    return ret;
  }







  this.prettyPrint = function(data, path, use_filter, filter_type)
  {
    var ret = [], tree = this._expand_tree;
    // TODO try to ensure that path is either an array or null
    if (Object.prototype.toString.call(path) == "[object Array]")
    {
      for (var i = 0, cur = null; cur = path[i]; i++)
      {
        tree = tree[cur];
        if (!tree)
          throw 'not valid path in InspectionBaseData.prettyPrint';
      }
    }
    else if (path == -1)
      tree = tree[this._obj_id];
    this._pretty_print_protos(data, ret, tree);
    return ret.join('');
  }

  this._pretty_print_object = function(obj_id, ret, tree)
  {
    var data = this._obj_map[obj_id];
    if (data)
    {
      ret.push(
        "<examine-objects " +
          "rt-id='" + this._rt_id + "' " +
          "data-id=" + this.id + "' " +
          "obj-id='" + this._obj_id + "' " +
          ">"
      );
      this._pretty_print_protos(data, ret, tree);
      ret.push("</examine-objects>");
    }
  }

  this._pretty_print_protos = function(data, ret, tree)
  {
    for (var proto = null, i = 0; proto = data[i]; i++)
    {
      // skip the first object description
      if (i)
        ret.push("<div class='prototype-chain-object'>", proto[VALUE][CLASS_NAME], "</div>");
      this._pretty_print_properties(proto[PROPERTY_LIST] || [], ret, tree);
    }
  }

  this._pretty_print_properties = function(property_list, ret, tree)
  {
    var prop = null, i = 0, value = '', type = '', short_val = '', obj_id = 0;
    for (; prop = property_list[i]; i++)
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
            this._pretty_print_object(obj_id, ret, tree[obj_id]);
          ret.push("</item>");
          break;
        }
      }
    }
  }

/*

      if (typeof val == 'string')
      {
        // The escape of ' is for not messing up innerHTML down the line
        val = helpers.escapeTextHtml(val).replace(/'/g, '&#39;');
      }

      depth = forced_depth || prop[DEPTH];

      if (prop[TYPE] == 'object')
      {
        ret += "<item obj-id='" + prop[VALUE] + "' depth='" + depth + "'>" +
                 "<input type='button' handler='examine-object-2'  class='folder-key'/>" +
                 "<key>" + helpers.escapeTextHtml(prop[KEY]) + "</key>" +
                 "<value class='object'>" + prop[CONSTRUCTOR] + "</value>" +
                "</item>";
      }
      else
      {
        if (short_val)
        {
          ret += "<item>" +
                   "<input type='button' handler='expand-value'  class='folder-key'/>" +
                   "<key>" + helpers.escapeTextHtml(prop[KEY]) + "</key>" +
                   "<value class='" + prop[TYPE] + "' data-value='" + val + "'>" +
                     helpers.escapeTextHtml(short_val) +
                   "</value>" +
                 "</item>";
        }
        else
        {
          ret += "<item>" +
                   "<key class='no-expander'>" + helpers.escapeTextHtml(prop[KEY]) + "</key>" +
                   "<value class='" + prop[TYPE] + "'>" + val + "</value>" +
                 "</item>";
        }
      }
    }
    
  };


  
  
  
/*
  const
  KEY = 0,
  VALUE = 1,
  TYPE = 2,
  DEPTH = 3,
  QUERIED = 4,
  SEARCH = 5,
  CONSTRUCTOR = 6,
  IS_VIRTUAL = 7,
  ITEM = 8,
  MAX_VALUE_LENGTH = 30;

  this.rt_id = '';
  this.data = [];

  this.parseXML = function(status, message, rt_id, obj_id, org_args)
  {
    const
    OBJECT_LIST = 0,
    // sub message ObjectInfo
    VALUE = 0,
    PROPERTY_LIST = 1,
    // sub message ObjectValue
    OBJECT_ID = 0,
    IS_CALLABLE = 1,
    IS_FUNCTION = 2,
    TYPE = 3,
    PROTOTYPE_ID = 4,
    NAME = 5,
    // sub message Property
    PROPERTY_NAME = 0,
    PROPERTY_TYPE = 1,
    PROPERTY_VALUE = 2,
    OBJECT_VALUE = 3;

    var
    obj = message[OBJECT_LIST][0],
    class_name = obj[VALUE] && obj[VALUE][NAME],
    props = null,
    prop = null,
    i=0,
    prop_type = '',
    index = this.getObject(obj_id),
    data_splice_args = [index + 1 + this.getCountVirtualProperties(index), 0],
    unsorted = [],
    depth = 0;

    // each object should have a class attribute
    // this is a workaround
    this.data[index][CONSTRUCTOR] || (this.data[index][CONSTRUCTOR] = class_name);

    if (obj && index > -1)
    {
      props = obj[PROPERTY_LIST];
      depth = this.data[index][DEPTH] + 1;
      this.data[index][QUERIED] = 1;

      if (props)
      {
        for ( ; prop = props[i]; i++)
        {
          switch(prop[PROPERTY_TYPE])
          {
            case 'object':
            {
              unsorted[unsorted.length] =
              [
                prop[PROPERTY_NAME],
                prop[OBJECT_VALUE][OBJECT_ID],
                'object',
                depth,
                ,
                ,
                prop[OBJECT_VALUE][NAME]
              ]
              break;
            }
            case 'undefined':
            {
              unsorted[unsorted.length] =
              [
                prop[PROPERTY_NAME],
                'undefined',
                'undefined',
                depth
              ]
              break;
            }
            case 'null':
            {
              unsorted[unsorted.length] =
              [
                prop[PROPERTY_NAME],
                'null',
                'null',
                depth
              ]
              break;
            }
            case 'number':
            {
              unsorted[unsorted.length] =
              [
                prop[PROPERTY_NAME],
                prop[PROPERTY_VALUE].toString(),
                'number',
                depth
              ]
              break;
            }
            case 'string':
            {
              unsorted[unsorted.length] =
              [
                prop[PROPERTY_NAME],
                '"' + prop[PROPERTY_VALUE] + '"',
                'string',
                depth
              ]
              break;
            }
            case 'boolean':
            {
              unsorted[unsorted.length] =
              [
                prop[PROPERTY_NAME],
                prop[PROPERTY_VALUE],
                'boolean',
                depth
              ]
              break;
            }
          }
        }
      }

      var sort_key = function(a, b)
      {
        return a[KEY] < b[KEY] ? -1 : a[KEY] > b[KEY] ? 1 : 0;
      };

      var sort_item = function(a, b)
      {
        return a[ITEM] < b[ITEM] ? -1 : a[ITEM] > b[ITEM] ? 1 : 0;
      };

      if (class_name == "Array")
      {
        // not very efficent, but dunno how to do it better
        var
        items = [],
        attributes = [],
        cursor = null,
        i = 0,
        re_d = /\d+/;

        for ( ; cursor = unsorted[i]; i++)
        {
          if (re_d.test(cursor[KEY]))
          {
            cursor[ITEM] = parseInt(cursor[KEY]);
            items[items.length] = cursor;
          }
          else
          {
            attributes[attributes.length] = cursor;
          }
        }
        items = items.sort(sort_item);
        attributes = attributes.sort(sort_key);
        unsorted = items.concat(attributes);
      }
      else
      {
        unsorted.sort(sort_key);
      }
      this.data.splice.apply(this.data, data_splice_args.concat(unsorted));

      if (org_args && !org_args[0].__call_count)
      {
        org_args[0].__call_count = 1;
        org_args.callee.apply(null, org_args)
      }
    }
  };

  this.getObject = function(obj_id, depth, key)
  {
    var prop = null, i = 0;
    for ( ; prop = this.data[i]; i++)
    {
      if (prop[VALUE] == obj_id
          && (isNaN(depth) || prop[DEPTH] == depth)
          && (!key || prop[KEY] == key))
      {
        return i;
      }
    }
    return -1;
  };

  this.getCountVirtualProperties = function(index)
  {
    var prop = null, i = index + 1, depth = this.data[index][DEPTH] + 1, count = 0;

    for ( ; (prop = this.data[i]) && prop[IS_VIRTUAL] && prop[DEPTH] == depth ; i++)
    {
      count += 1;
    }
    return count;
  };

  this.setObject = function(rt_id, obj_id, virtualProperties)
  {
    this.rt_id = rt_id;
    this.__cache = null;
    this.__cached_index = 0;
    this.data =
    [
      [
        '',
        obj_id,
        'object',
        -1
      ]
    ]
    if (virtualProperties)
    {
      var prop = null, i = 0;
      for ( ; prop = virtualProperties[i]; i++)
      {
        prop[IS_VIRTUAL] = 1;
      }
      this.data = this.data.concat(virtualProperties);
    }
  };

  this.__cache = null;
  this.__cached_index = 0;

  this.__getData = function(index, target_depth)
  {

    var ret = [], i = index + 1, depth = this.data[index][DEPTH], prop = null;
    ret.object_index = index;
    // it's a back refernce, return only the properties from the current level
    // without the expanded properties
    if (target_depth > depth)
    {
      depth += 1;
      for ( ; (prop = this.data[i]); i++)
      {
        if (prop[DEPTH] == depth && !prop[IS_VIRTUAL])
        {
          ret[ret.length] = prop;
        }
      }
    }
    else
    {
      for ( ; (prop = this.data[i]) && prop[DEPTH] > depth; i++)
      {
        ret[ret.length] = prop;
      }
    }
    //this.__cache = ret;
    //this.__cached_index = index;
    return ret;
  };

  this.getData = function(rt_id, obj_id, depth, org_args)
  {
    var index = this.getObject(obj_id);
    if (rt_id == this.rt_id && index > -1)
    {
      if (this.data[index][QUERIED])
      {
        return this.__getData(index, depth);
      }
    }
    if (rt_id && obj_id)
    {
      var tag = tagManager.set_callback(this, this.parseXML, [rt_id, obj_id, org_args]);
      services['ecmascript-debugger'].requestExamineObjects(tag, [rt_id, [obj_id]]);
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
        "not valid id.\n  rt id: " + rt_id + "\n  object id: " + obj_id);
    }
    return null;
  };

  this.clearData = function(rt_id, obj_id, depth, key)
  {
    // obj_id is a string
    if (obj_id)
    {
      // back references can be tricky
      var index = this.getObject(obj_id, depth, key), i = 0, depth = 0, prop = null;
      if (rt_id == this.rt_id && index > -1)
      {
        i = index + 1;
        depth = this.data[index][DEPTH];
        for ( ; (prop = this.data[i]) && prop[DEPTH] > depth; i++);
        this.data.splice(index + 1, i - (index + 1));
        delete this.data[index][QUERIED];
      }
    }
    else
    {
      this.data = [];
    }
  };

  this.prettyPrint = function(data, target_depth, use_filter, filter_type)
  {
    var
    ret = "",
    prop = null,
    i = 0,
    val = "",
    short_val = "",
    filter = {};
    // TODO: create for each Interface a filter with the default value
    if (use_filter)
    {
      if (filter_type == VALUE)
      {
        filter = { '""': 1, "null" : 1 };
      }
      else
      {
        filter = js_object_filters[ this.data[data.object_index][CONSTRUCTOR]] || {};
      }
    }

    // in case of a back reference
    var forced_depth = data[0] && target_depth >= data[0][DEPTH] && target_depth + 1 || 0;
    var depth = 0;

    for ( ; prop = data[i]; i++)
    {
      val = prop[VALUE];

      short_val = "";
      if (filter && prop[filter_type] in filter)
      {
        if (filter_type == KEY)
        {
          switch (prop[TYPE])
          {
            case 'object':
            case 'null':
            case 'undefined':
            {
              if (prop[TYPE] == filter[prop[KEY]])
              {
                continue;
              }
            }
            case 'string':
            {
              if (val  == '"' + filter[prop[KEY]] + '"')
              {
                continue;
              }
            }
            case 'number':
            case 'boolean':
            {
              if (val == filter[prop[KEY]])
              {
                continue;
              }
            }
          }
        }
        else
        {
          continue;
        }
      }

      // Should be done with text-overflow: ellipsis
      if (val.length > MAX_VALUE_LENGTH)
      {
        short_val = val.slice(0, MAX_VALUE_LENGTH) + "…\"";
      }

      if (typeof val == 'string')
      {
        // The escape of ' is for not messing up innerHTML down the line
        val = helpers.escapeTextHtml(val).replace(/'/g, '&#39;');
      }

      depth = forced_depth || prop[DEPTH];

      if (prop[TYPE] == 'object')
      {
        ret += "<item obj-id='" + prop[VALUE] + "' depth='" + depth + "'>" +
                 "<input type='button' handler='examine-object-2'  class='folder-key'/>" +
                 "<key>" + helpers.escapeTextHtml(prop[KEY]) + "</key>" +
                 "<value class='object'>" + prop[CONSTRUCTOR] + "</value>" +
                "</item>";
      }
      else
      {
        if (short_val)
        {
          ret += "<item>" +
                   "<input type='button' handler='expand-value'  class='folder-key'/>" +
                   "<key>" + helpers.escapeTextHtml(prop[KEY]) + "</key>" +
                   "<value class='" + prop[TYPE] + "' data-value='" + val + "'>" +
                     helpers.escapeTextHtml(short_val) +
                   "</value>" +
                 "</item>";
        }
        else
        {
          ret += "<item>" +
                   "<key class='no-expander'>" + helpers.escapeTextHtml(prop[KEY]) + "</key>" +
                   "<value class='" + prop[TYPE] + "'>" + val + "</value>" +
                 "</item>";
        }
      }
    }
    return ret;
  };

  */
};

