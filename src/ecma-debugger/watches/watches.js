window.cls || (window.cls = {});

/**
  * @constructor
  * @extends InspectableJSObject
  */

cls.Watches = function(view)
{
  /* interface */
  /* inherits from InspectableJSObject */

  this.add_property = function(uid, key){};

  this.remove_property = function(uid){};

  this.update_watches = function(){};

  /* constants */

  const
  STATUS = 0,
  PROPERTY_LIST = 1,
  NAME = 0,
  TYPE = 1,
  VALUE = 2,
  OBJECT_VALUE = 3,
  OBJECT_ID = 0,
  IS_EDITABLE = 5,
  UID = 6,
  IS_UPDATED = 7,
  DFL_EVAL_ERROR = "__DFLEvalError__";

  /* private */

  /*
    example property list
    [
      ["a", "string", "a"],
      ["b", "string", "b"],
      ["activeElement", "object", null, [26, 0, "object", 41, "HTMLButtonElement"]],
      ["alinkColor", "string", ""],
      ["all", "object", null, [27, 1, "object", 42, "HTMLCollection"]],
      ...
    ]
  */

  this._update_prop = function(uid, key, update_list)
  {
    var frame = window.stop_at.getSelectedFrame() ||
                {
                  runtime_id: window.runtimes.getSelectedRuntimeId(),
                  thread_id: 0,
                  index: 0,
                };
    this._rt_id = frame.runtime_id;
    var tag = this._tagman.set_callback(this,
                                        this._handle_update_prop,
                                        [uid, key, update_list]);
    var script = "try{return " + key + "}" +
                 "catch(e){return \"" + DFL_EVAL_ERROR + "\"};";
    this._esdb.requestEval(tag, [frame.runtime_id,
                                 frame.thread_id,
                                 frame.index,
                                 key, [["dummy", 0]]]);
  }

  this._handle_update_prop = function(status, message, uid, prop, update_list)
  {
    /*
      examples
      ["completed","object",null,[2,0,"object",3,"HTMLDocument"]]
      ["unhandled-exception","object",null,[26,0,"object",27,"Error"]]
    */

    if (status)
    {
      opera.postError("Watching " + prop + " failed.");
    }
    else
    {
      update_list[uid] = true;
      var prop_list = this._obj_map.watches[0][PROPERTY_LIST];
      for (var i = 0; i < prop_list.length && prop_list[i][UID] != uid; i++);
      if (prop_list[i])
      {
        if (message[STATUS] == "completed")
        {
          prop_list[i][TYPE] = message[TYPE];
          prop_list[i][VALUE] = message[VALUE];
          prop_list[i][OBJECT_VALUE] = message[OBJECT_VALUE];
        }
        else
        {
          prop_list[i][TYPE] = "error";
          prop_list[i][VALUE] = "Error";
        }
      }
      else
      {
        opera.postError("Missing property in watches.");
      }
      var all_updated = true;
      for (var check in update_list)
      {
        all_updated = all_updated && update_list[check];
      }
      if (all_updated)
      {
        this._view.update();
      }
    }
  };

  this._get_uid = (function()
  {
    var uid = 0;
    return function() {return ++uid;};
  })();

  this._super_init = this._init;

  this._init = function(view)
  {
    this._super_init(0, "watches");
    this._obj_map =
    {
      "0": [[["watches"]]],
      "watches": [[[], []]]
    };
    this._expand_tree =
    {
      "object_id": 0,
      "protos": {"0": {"": {"object_id": "watches"}}}
    };
    this._esdb = window.services['ecmascript-debugger'];
    this._tagman = window.tag_manager;
    this._view = view;
  };

  /* implementation */

  this.add_property = function(uid, key)
  {
    var prop = [];
    var prop_list = this._obj_map.watches[0][PROPERTY_LIST];
    for (var i = 0; i < prop_list.length && prop_list[i][UID] != uid; i++);
    prop[NAME] = key;
    prop[IS_EDITABLE] = true;
    uid = prop[UID] = prop_list[i] && prop_list[i][UID] || this._get_uid();
    prop_list[i] = prop;
    var update_list = {};
    update_list[prop[UID]] = false;
    this._update_prop(uid, key, update_list);
  };

  this.remove_property = function(uid)
  {
    var prop_list = this._obj_map.watches[0][PROPERTY_LIST];
    for (var i = 0; i < prop_list.length && prop_list[i][UID] != uid; i++);
    if (prop_list[i])
    {
      var prop = prop_list[i];
      if (prop[TYPE] == "object")
      {
        this.collapse([[prop[NAME], prop[OBJECT_VALUE][OBJECT_ID], 0]]);
      }
      prop_list.splice(i, 1);
      this._view.update();
    }
  };

  this.update_watches = function()
  {
    var update_list = {};
    this._obj_map.watches[0][PROPERTY_LIST].forEach(function(prop)
    {
      if (prop[TYPE] == "object")
      {
        this.collapse([[prop[NAME], prop[OBJECT_VALUE][OBJECT_ID], 0]]);
      }
      update_list[prop[UID]] = false;
      this._update_prop(prop[UID], prop[NAME], update_list);
    }, this);
  };

  /* initialisation */

  this._init(view);

};

cls.Watches.prototype = cls.EcmascriptDebugger["6.0"].InspectableJSObject.prototype;
