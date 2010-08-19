window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * A data model to inspect objects to any depth.
  * @constructor
  * @param {Int} rt_id runtime id
  * @param {Int} obj_id object id
  * @param {String} identifier a identifief for the object, e.g. "document", optional
  * @param {String} _class the class of the object, e.g. "HTMLDocument", optional
  * @param {PropertyList} pseudo_properties properties which are shown like
  * any other property a given object, but are not real properties, like e.g.
  * 'this' or 'arguments' of a given scope of a stopped at event, optional
  */

cls.EcmascriptDebugger["6.0"].InspectableJSObject =
function(rt_id, obj_id, identifier, _class, pseudo_properties)
{
  this._init(rt_id, obj_id, pseudo_properties || null, identifier, _class);
}

cls.EcmascriptDebugger["6.0"].InspectableJSObject.prototype = new function()
{
  /* interface */

  /**
    * To expand a given level of the inspected object.
    * @param {Function} cb callback called when the properties are retrieved.
    * @param {PATH} path a unique path in the expanded property tree of the object, optional.
    * without a path argument the first level will be expanded.
    */
  this.expand = function(cb, path){};
  /**
    * To collapse a given level of the inspected object.
    * @param {PATH} path, optional.
    * without path argument it will erase any data.
    */
  this.collapse = function(path){};
  /**
    * To get the properties of a given object.
    * @param {Int} obj_id the id of the object
    */
  this.get_data = function(obj_id){};
  /**
    * To get the expanded property tree.
    * @param {Boolean} with_root, optional. If set,
    * it will overwrite path and either return the whole tree or the whole tree without the root object.
    * @param {PATH} path to return the subtree of the given path, optional.
    */
  this.get_expanded_tree = function(with_root, path){};

  this.expand_prototype = function(path){};
  this.collapse_prototype = function(path){};

  /* private */

  /*
    format for path and expand_tree:

    PATH_FORMAT :: = "[" { "[" KEY ", " OBJ_ID ", " PROTO_INDEX "]" } "]"
    EXPAND_TREE :: =
    "{"
      "object_id:" OBJ_ID,
      "protos: {" { PROTO_INDEX ": {" { KEY ": " EXPAND_TREE ", " } "}, " } "}"
    "}"
  */

  this._init = function(rt_id, obj_id, virtual_props, identifier, _class)
  {
    this.id = this._get_id();
    if (!window.inspections)
    {
      new cls.Namespace("inspections");
    }
    window.inspections.add(this);
    this._obj_map =
    {
      0:
      [
        [
          [obj_id],
          [
            [
              identifier || '',
              'object',
              ,
              [obj_id, , , , _class || '']
            ]
          ]
        ]
      ]
    };
    this._queried_map = {};
    this._expand_tree = {object_id: 0, protos: {}};
    this._rt_id = rt_id;
    this._obj_id = obj_id;
    this._identifier = identifier || '';
    this._virtual_props = virtual_props;
    this._root_path = [this._identifier, this._obj_id, 0];
    this._root_path_joined = this._root_path.join();
  }

  this._get_subtree = function(path)
  {
    const PATH_KEY = 0, PATH_OBJ_ID = 1, PATH_PROTO_INDEX = 2;
    var key = '', obj_id = 0, proto_index = 0, i = 0, tree = this._expand_tree;
    for ( ; path && path[i]; i++)
    {
      key = path[i][PATH_KEY];
      obj_id = path[i][PATH_OBJ_ID];
      index = path[i][PATH_PROTO_INDEX];
      if (i < (path.length - 1) && !(tree.protos[index] && tree.protos[index][key]))
      {
        throw 'not valid path in InspectionBaseData._handle_examine_object';
      }
      if (!tree.protos)
        tree.protos = {};
      if (!tree.protos[index])
        tree.protos[index] = {};
      /* the last element of a prototype path has no object id */
      if (!tree.protos[index][key] && !isNaN(obj_id))
        tree.protos[index][key] = {object_id: obj_id, protos: {}};
      tree = tree.protos[index][key];
    }
    return tree;
  }

  // removes the subtree given by the path in the expanded tree
  // returns the removed tree
  this._remove_subtree = function(path)
  {
    const PATH_KEY = 0, PATH_OBJ_ID = 1, PATH_PROTO_INDEX = 2;
    var
    key = '',
    obj_id = 0,
    proto_index = 0,
    i = 0,
    tree = this._expand_tree,
    ret = null;

    for ( ; path && path[i]; i++)
    {
      key = path[i][PATH_KEY];
      obj_id = path[i][PATH_OBJ_ID];
      index = path[i][PATH_PROTO_INDEX];
      if (!(tree.protos[index] && tree.protos[index][key]))
      {
        throw 'not valid path in InspectionBaseData._remove_subtree';
      }
      if (i == path.length - 1)
      {
        ret = tree.protos[index][key];
        tree.protos[index][key] = null;
        break;
      }
      tree = tree.protos[index][key];
    }
    return ret;
  }

  /*
  pretty printed example data for ExamineObjects

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

  this._handle_examine_object = function(status, message, path, obj_id, cb)
  {
    const
    OBJECT_CHAIN_LIST = 0,
    // sub message ObjectList
    OBJECT_LIST = 0,
    // sub message ObjectInfo
    VALUE = 0,
    PROPERTY_LIST = 1,
    // sub message ObjectValue
    CLASS_NAME = 4,
    // sub message Property
    NAME = 0,
    // added fields
    PROPERTY_ITEM = 4;

    var
    tree = this._expand_tree,
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
      for (i = 0; proto = proto_chain[i]; i++)
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
        {
          proto[PROPERTY_LIST] = this._virtual_props.concat(proto[PROPERTY_LIST] || []);
        }

      }
      this._obj_map[this._get_subtree(path).object_id] = proto_chain;
      if (cb)
        cb();
    }
  }

  /* helpers */

  this._sort_name = function(a, b)
  {
    const NAME = 0;
    return a[NAME] < b[NAME] ? -1 : a[NAME] > b[NAME] ? 1 : 0;
  };

  this._sort_item = function(a, b)
  {
    const PROPERTY_ITEM = 4;
    return a[PROPERTY_ITEM] < b[PROPERTY_ITEM] ? -1 : a[PROPERTY_ITEM] > b[PROPERTY_ITEM] ? 1 : 0;
  };

  this._get_all_ids = function get_all_ids(tree, ret)
  {
    ret || (ret = []);
    ret.push(tree.object_id);
    for (var index in tree.protos)
    {
      for (var key in tree.protos[index])
      {
        if (tree.protos[index][key])
        {
          get_all_ids(tree.protos[index][key], ret);
        }
      }
    }
    return ret;
  }

  this._get_id = (function()
  {
    var id_counter = 0;
    return function()
    {
      id_counter++;
      return "inspection-id-" + id_counter.toString();
    }
  })();

  this._norm_path = function(path)
  {
    if (path[0] && path[0].join() != this._root_path_joined)
      path.splice(0, 0, this._root_path);
    return path;
  }

  this._cleanup_maps = function(removed_tree)
  {
    var dead_ids = this._get_all_ids(removed_tree);
    var ids = this._get_all_ids(this._expand_tree);
    for (var i = 0; dead_ids[i]; i++)
    {
      if (ids.indexOf(dead_ids[i]) == -1)
        this._obj_map[dead_ids[i]] = this._queried_map[dead_ids[i]] = null;
    }
  }

  /* implementation */

  this.expand = function(cb, path)
  {
    const PATH_OBJ_ID = 1;
    if (path === undefined)
    {
      path = [this._root_path];
    }
    if (path)
    {
      this._norm_path(path);
      var obj_id = path[path.length - 1][PATH_OBJ_ID];
      if (this._obj_map[obj_id])
      {
        cb();
      }
      else
      {
        var tag = window.tag_manager.set_callback(this,
                                                  this._handle_examine_object,
                                                  [path, obj_id, cb]);
        var skip_nonenumerables =
          window.settings.inspection.get('show-non-enumerables') ? 0 : 1;
        // TODO add a setting to use the property filter
        // filter feature is currently blocked by CORE-32113 bug
        var msg = [this._rt_id, [obj_id], 1, skip_nonenumerables /*, use filter flag */];
        window.services['ecmascript-debugger'].requestExamineObjects(tag, msg);
      }
    }
  }

  this.collapse = function(path)
  {
    if (path)
    {
      this._norm_path(path);
      this._cleanup_maps(this._remove_subtree(path));
    }
    else
    {
      this._obj_map = null;
      this._queried_map = null;
      this._expand_tree = null;
      this._virtual_props = null;
      this._rt_id = 0;
      this._obj_id = 0;
    }
  }

  this.expand_prototype = function(path)
  {
    this._norm_path(path);
    this._get_subtree(path);
  };

  this.collapse_prototype = function(path)
  {
    const PATH_PROTO_INDEX = 2;
    path = this._norm_path(path).slice(0);
    var index = path.pop()[PATH_PROTO_INDEX];
    var top = this._get_subtree(path);
    var removed = top.protos[index];
    top.protos[index] = null;
    this._cleanup_maps(removed);
  };

  this.get_data = function(obj_id)
  {
    return this._obj_map[obj_id];
  }

  this.get_expanded_tree = function(with_root, path)
  {
    if (typeof with_root === 'boolean')
      path = with_root ? null : [this._root_path];
    return this._get_subtree(path);
  }

};

/* static methods of cls.EcmascriptDebugger["6.0"].InspectableJSObject */
(function()
{
  this.register_enabled_listener = function()
  {
    window.services['ecmascript-debugger'].addListener('enable-success',
                                                       this.set_property_filter);
  };

  this.set_property_filter = function(filter)
  {
    var tag = window.tag_manager.set_callback(this, function(status, message)
    {
      if (status)
        opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
                        'static method InspectableJSObject.set_property_filter failed, ' +
                        JSON.stringify(message));
    });
    var msg = [[cls.EcmascriptDebugger["6.0"].property_filter]];
    window.services['ecmascript-debugger'].requestSetPropertyFilter(tag, msg);
  };

  this.create_filters = function()
  {
    // client side filters, a temporary workaround for CORE-32113
    var filters = cls.EcmascriptDebugger["6.0"].inspection_filters;
    window.inspectionfilters = {};
    for (var _class in filters)
    {
      if (_class.indexOf('_') != 0)
        window.inspectionfilters[_class] = new filters[_class]();
    }
  }

  /* the following methods are to print a message filter and store it as js file */

  this.create_filter = function(type) // type "scope" or "js"
  {
    var script = "[" +
    [
      "this",
      "document.createElement('test')",
      "document.implementation.createDocument('', 'test', null)",
      "document.implementation.createHTMLDocument('')",
      "document.createAttribute('foo')",
      "document.createTextNode('')",
      "document.createCDATASection('')",
      "document.createComment('')",
      "document.createDocumentFragment()",
      "document.createElement('div').getElementsByTagName('*')",
      "document.createElement('div').attributes",
      "document.createEvent('Events')",
      "document.createElement('html')",
      "document.createElement('head')",
      "document.createElement('link')",
      "document.createElement('title')",
      "document.createElement('meta')",
      "document.createElement('base')",
      "document.createElement('style')",
      "document.createElement('body')",
      "document.createElement('foo')",
      "document.createElement('input')",
      "document.createElement('isindex')",
      "document.createElement('form')",
      "document.createElement('select')",
      "document.createElement('optgroup')",
      "document.createElement('option')",
      "document.createElement('textarea')",
      "document.createElement('button')",
      "document.createElement('label')",
      "document.createElement('fieldset')",
      "document.createElement('legend')",
      "document.createElement('ul')",
      "document.createElement('ol')",
      "document.createElement('dl')",
      "document.createElement('dir')",
      "document.createElement('menu')",
      "document.createElement('li')",
      "document.createElement('div')",
      "document.createElement('p')",
      "document.createElement('h1')",
      "document.createElement('q')",
      "document.createElement('blockquote')",
      "document.createElement('pre')",
      "document.createElement('br')",
      "document.createElement('basefont')",
      "document.createElement('font')",
      "document.createElement('ins')",
      "document.createElement('a')",
      "document.createElement('image')",
      "document.createElement('object')",
      "document.createElement('param')",
      "document.createElement('applet')",
      "document.createElement('map')",
      "document.createElement('area')",
      "document.createElement('script')",
      "document.createElement('table')",
      "document.createElement('caption')",
      "document.createElement('col')",
      "document.createElement('thead')",
      "document.createElement('tbody')",
      "document.createElement('tr')",
      "document.createElement('td')",
      "document.createElement('frameset')",
      "document.createElement('frame')",
      "document.createElement('iframe')",
    ].join(',') + "]";
    var rt_id = window.runtimes.getSelectedRuntimeId();
    var tag = window.tag_manager.set_callback(this, this.handle_create_filter, [rt_id, type]);
    window.services['ecmascript-debugger'].requestEval(tag, [rt_id, 0, 0, script]);
  };

  this.handle_create_filter = function(status, message, rt_id, type)
  {
    const STATUS = 0, OBJECT_VALUE = 3, OBJECT_ID = 0;
    if (status || !(message[STATUS] == "completed" && message[OBJECT_VALUE]))
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
                      "static method InspectableJSObject.create_filter failed, " +
                      status + ', ' + JSON.stringify(message));
    else
    {
      var obj_id = message[OBJECT_VALUE][OBJECT_ID];
      var tag = window.tag_manager.set_callback(this, this.handle_get_objects, [rt_id, type]);
      var msg = [rt_id, [obj_id], 0, 1, 0];
      window.services['ecmascript-debugger'].requestExamineObjects(tag, msg);
    }
  };

  this.handle_get_objects = function(status, message, rt_id, type)
  {
    const STATUS = 0, OBJECT_VALUE = 3, OBJECT_ID = 0;
    if (status)
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
                      "static method InspectableJSObject.handle_create_filter failed, " +
                      status + ', ' + JSON.stringify(message));
    else
    {
      const
      OBJECT_CHAIN_LIST = 0,
      OBJECT_LIST = 0,
      PROPERTY_LIST = 1,
      OBJECT_VALUE = 3,
      OBJECT_ID = 0;

      var obj_list = (message &&
        (message = message[OBJECT_CHAIN_LIST]) &&
        (message = message[0]) &&
        (message = message[OBJECT_LIST]) &&
        (message = message[0]) &&
        (message = message[PROPERTY_LIST]) ||
        []).map(function(prop)
        {
          return prop[OBJECT_VALUE] ? prop[OBJECT_VALUE][OBJECT_ID] : 0;
        });

      var obj_id = message[OBJECT_VALUE][OBJECT_ID];
      var tag = window.tag_manager.set_callback(this, this.print_filter, [rt_id, type]);
      var msg = [rt_id, obj_list, 0, 1, 0];
      window.services['ecmascript-debugger'].requestExamineObjects(tag, msg);
    }
  };


  this.print_filter = function(status, message, rt_id, type)
  {

    const
    OBJECT_CHAIN_LIST = 0,
    // sub message ObjectList
    OBJECT_LIST = 0,
    // sub message ObjectInfo
    VALUE = 0,
    PROPERTY_LIST = 1,
    // sub message ObjectValue
    CLASS_NAME = 4,
    // sub message Property
    NAME = 0,
    PROPERTY_TYPE = 1,
    PROPERTY_VALUE = 2,
    OBJECT_VALUE = 3;

    var
    object = null,
    proto_chain = null,
    property_list = null,
    i = 0,
    j = 0,
    class_name = '',
    proto = null,
    filters = [],
    filter = null,
    print = [];

    if (status)
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
                      "static method InspectableJSObject.handle_get_objects " +
                      status + ', ' + JSON.stringify(message));
    else
    {
      for ( ; object = message[OBJECT_CHAIN_LIST][i]; i++)
      {
        proto_chain = object[OBJECT_LIST];
        proto = proto_chain && proto_chain[0];
        filter = [];
        if (proto)
        {

          class_name = proto[VALUE][CLASS_NAME];
          property_list = proto[PROPERTY_LIST];
          if (property_list)
          {
            for (j = 0; prop = property_list[j]; j++)
            {
              if (prop[PROPERTY_TYPE] == "null")
                filter.push([prop[NAME], 1])
              else if (prop[PROPERTY_TYPE] == "string" && prop[PROPERTY_VALUE] == "")
                filter.push([prop[NAME], 5, null, null, ""])
            }
          }
        }
        if (filter.length)
          filters.push([class_name, filter]);
      }
    }
    const NAME = 0, FILTERED_PROPS = 1;
    // filter out Element
    var is_equal = function(a, b)
    {
      if (a.length != b.length)
        return false;
      for (var i = 0; i < a.length && (a[i] == b[i]); i++);
      return i == a.length;
    };
    var is_normal_element = function(class_name)
    {
      var black_list = ["HTMLObjectElement", "HTMLAppletElement"];
      return class_name.indexOf("Element") > -1 && black_list.indexOf(class_name) == -1;
    };
    var Element = null;
    for (i = 0; filter = filters[i]; i++)
    {
      if (is_normal_element(filter[NAME]))
      {
        if (Element)
          Element = Element.filter(function(prop)
          {
            for (var prop_2, j = 0; prop_2 = filter[FILTERED_PROPS][j]; j++)
            {
              if (is_equal(prop, prop_2))
                return true;
            }
            return false;
          });
        else
          Element = filter[FILTERED_PROPS];
      }
    }
    // remove properties which are in Element
    for (i = 0; filter = filters[i]; i++)
    {
      if (is_normal_element(filter[NAME]))
      {
        filter[FILTERED_PROPS] = filter[FILTERED_PROPS].filter(function(prop)
        {
          for (var prop_2, j = 0; prop_2 = Element[j]; j++)
          {
            if (is_equal(prop, prop_2))
              return false;
          }
          return true;
        });
      }
    }
    // pretty print
    const 
    INDENT = "  ", 
      NL = '\n', 
      Q = "\"", 
      NS = "cls.EcmascriptDebugger[\"6.0\"]",
      NSF = "cls.EcmascriptDebugger[\"6.0\"].inspection_filters" ;

    var indent = function(indent_count)
    {
      return (new Array(indent_count + 1)).join(INDENT);
    };

    var props_to_string = function(prop)
    {
      return indent(this) + JSON.stringify(prop) + ',';
    };

    var props_to_js_string = function(prop)
    {
      const NAME = 0, TYPE = 1, NULL = 1, STRING = 5, STRING_VAL = 4;
      // types in ExamineObjects are strings, not enums
      if (prop[TYPE] == NULL)
        return indent(this) + "this." + prop[NAME] + " = {type: \"null\"};";
      if (prop[TYPE] == STRING)
        return indent(this) + "this." + prop[NAME] + 
               " = {type: \"string\", value: \"" + prop[STRING_VAL] + "\"};";
    };

    if (type == "js")
    {
      print.push("/**\n" +
                 "  * created with cls.EcmascriptDebugger[\"6.0\"].InspectableJSObject.create_filter(\"js\")\n" +
                 "  * filters work the same way as the according scope filters:\n" +
                 "  * if a property has the same type and optionally the same value\n" +
                 "  * as the one in the filter, it will not be displayed.\n" +
                 "  * documentation of the scope filters:\n" +
                 "  *   http://dragonfly.opera.com/app/scope-interface/services/EcmascriptDebugger/EcmascriptDebugger_6_0.html#setpropertyfilter\n" +
                 "  *\n" +
                 "  * 1: // null\n" +
                 "  * 2: // undefined\n" +
                 "  * 3: // boolean\n" +
                 "  * 4: // number\n" +
                 "  * 5: // string\n" +
                 "  * 6: // object\n" +
                 "  */", NL, NL, NL);
      print.push("window.cls || (window.cls = {});", NL);
      print.push("cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});", NL);
      print.push(NS, " || (", NS, " = {});", NL);
      print.push(NSF, " = {};", NL, NL);
      print.push(NSF, "._Element = new function()", NL, "{", NL);
      print.push(Element.map(props_to_js_string, 1).join(NL), NL, "};", NL, NL);
      for (i = 0; filter = filters[i]; i++)
        print.push(NSF, ".", filter[NAME], " = function()", NL, 
                   "{", NL,
                   filter[FILTERED_PROPS].map(props_to_js_string, 1).join(NL), NL,
                   "};", NL, NL,
                   is_normal_element(filter[NAME]) ?
                   (NSF + "." + filter[NAME] + ".prototype = " + NL +
                   indent(2) + NSF + "._Element;" + NL + NL) : "");
    }
    else
    {
      print.push("/**\n" +
                 "  * created with cls.EcmascriptDebugger[\"6.0\"].InspectableJSObject.create_filter()\n" +
                 "  * documentation of the filter see\n" +
                 "  *   http://dragonfly.opera.com/app/scope-interface/services/EcmascriptDebugger/EcmascriptDebugger_6_0.html#setpropertyfilter\n" +
                 "  *\n" +
                 "  * 1: // null\n" +
                 "  * 2: // undefined\n" +
                 "  * 3: // boolean\n" +
                 "  * 4: // number\n" +
                 "  * 5: // string\n" +
                 "  * 6: // object\n" +
                 "  */", NL, NL, NL);
      print.push("window.cls || (window.cls = {});", NL);
      print.push("cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});", NL);
      print.push(NS, " || (", NS, " = {});", NL);
      print.push(NS, ".ElementFilter =", NL);
      print.push("[", NL, Element.map(props_to_string, 1).join(NL), NL, "]", NL, NL);
      print.push(NS, ".property_filter =", NL);
      print.push("[", NL);
      for (i = 0; filter = filters[i]; i++)
        print.push(indent(1), "[",  Q, filter[NAME], Q, ",", NL,
                   indent(2), "[", NL,
                   filter[FILTERED_PROPS].map(props_to_string, 3).join(NL), NL,
                   indent(2), "]", is_normal_element(filter[NAME]) ?
                                   ".concat(" + NS + ".ElementFilter)" :
                                   "", NL,
                   indent(1), "],", NL);
      print.push("];", NL, NL);
    }
    window.open("data:text/plain," + encodeURIComponent(print.join('')));
  };

}).apply(cls.EcmascriptDebugger["6.0"].InspectableJSObject);
