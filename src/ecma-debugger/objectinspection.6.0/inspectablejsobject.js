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

cls.EcmascriptDebugger["6.0"].InspectionBaseData = 
function(rt_id, obj_id, identifier, _class, virtual_properties)
{

  /* interface */

  // expand and collapse.

  
  this.setObject = function(rt_id, obj_id, virtualProperties){};
  this.getSelectedObject = function(){};
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
  MAX_VALUE_LENGTH = 30,
  // path
  PATH_KEY = 0,
  PATH_OBJ_ID = 1,
  PATH_PROTO_INDEX = 2;

  /*
    TODO syntax?
    path format: 
      [[key, obj_id, proto_index]*]
    expand_tree :: =
    {
      "object_id": <int>,
      "protos":
      {
        (<index>: {<key>: expand_tree}) *
      }
    }

  */

  

  //this._obj_map = {};
  //this._queried_map = {};
  /*
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

  this.setObject = function(rt_id, obj_id, virtual_props, identifier, _class)
  {
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
    // TODO sync format
    this._virtual_props = virtual_props;
    
  }

  this.get_object =
  this.getSelectedObject = function()
  {
    return this._obj_id && {rt_id: this._rt_id, obj_id: this._obj_id} || null;
  }

  this.get_identifier = function()
  {
    return this._identifier;
  }

  this._id_counter = 0;
  this._get_id = function()
  {
    this._id_counter++;
    return "inspection-id-" + this._id_counter.toString();
  }


  this._init = function(id, views)
  {
    this.id = id || this._get_id();
    this._views = views || [];
    if (!window.inspections)
    {
      new cls.Namespace("inspections");
    }
    window.inspections.add(this);
  }

  this._update_views = function()
  {
    for (var view_id = '', i = 0; view_id = this._views[i]; i++)
    {
      if (window.views[view_id])
      {
        window.views[view_id].update();
      }
    }
  }

  this.collapse = this.clear = function(){};

  this.expand = 
  this.inspect =
  this.get_data = function(cb, path)
  {

    if (path === undefined)
    {
      path = [[this._identifier, this._obj_id, 0]];
    }
    if (path)
    { 
      var obj_id = path[path.length - 1][PATH_OBJ_ID];
      if (this._obj_map[obj_id])
      {
        cb();
      }
      else
      {
        var tag = window.tag_manager.set_callback(this, this._handle_examine_object, [path, cb]);
        window.services['ecmascript-debugger'].requestExamineObjects(tag, [this._rt_id, [obj_id], 1]);
      }
    }
  }

  this.get_subtree = function(path)
  {
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
      if (!tree.protos[index][key])
        tree.protos[index][key] = {object_id: obj_id, protos: {}};
      tree = tree.protos[index][key];
    }
    return tree;
  }

  this._remove_subtree = function(path)
  {
    var key = '', obj_id = 0, proto_index = 0, i = 0, tree = this._expand_tree, ret = null;
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

  this._handle_examine_object = function(status, message, path, cb)
  {
    var 
    
    obj_id = 0,
    
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
          proto[PROPERTY_LIST] = this._virtual_props.concat(proto[PROPERTY_LIST] || []);
          
      }
      this._obj_map[this.get_subtree(path).object_id] = proto_chain;
      if (cb)
      {
        cb();
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

  this.clear_data =
  this.clearData = function(path)
  {
    if (path)
    {
      var dead_ids = this._get_all_ids(this._remove_subtree(path));
      var ids = this._get_all_ids(this._expand_tree);
      for (var i = 0; dead_ids[i]; i++)
      {
        if (ids.indexOf(dead_ids[i]) == -1)
          this._obj_map[dead_ids[i]] = this._queried_map[dead_ids[i]] = null;
      }
    }
    else
    {
      // TODO this should not be needed anymore
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

  this.get_expand_tree = function()
  {
    return this._expand_tree;
  }

  this.get_data = function(obj_id)
  {
    return this._obj_map[obj_id];
  }

  this._init();
  this.setObject(rt_id, obj_id, virtual_properties || null, identifier, _class)

};

