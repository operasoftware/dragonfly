window.cls || (window.cls = {});

/**
  * @constructor
  * @extends ViewBase
  */

cls.WatchesView = function(id, name, container_class)
{
  const
  MODE_DEFAULT = "default",
  MODE_EDIT = "edit";

  this._tmpl_main = function()
  {
    return (
    [
      ['div'],
      ['div',
        ['input',
          'type', 'button',
          'value', 'Add',
          'handler', 'watches-add'
        ],
        'class', 'watches-controls'
      ]
    ]);
  };

  this._tmpl_new_prop = function()
  {
    return ['item', ['key', 'class', 'no-expander', 'data-prop-uid','0']];
  }

  this.createView = function(container)
  {
    if (!this._watch_container)
    {
      container.clearAndRender(this._tmpl_main());
      this._watch_container = container.firstElementChild;
    }
    var tmpl = window.templates.inspected_js_object(this._data, false, null);
    this._watch_container.clearAndRender(tmpl);
  };

  this.ondestroy = function()
  {
    this._watch_container = null;
  }

  this.add_watch = function(uid, key)
  {
    if (key)
    {
      this._data.add_property(uid, key);
    }
    else
    {
      this._data.remove_property(uid);
    }
  }

  /* action handler interface */

  ActionHandlerInterface.apply(this);

  this.onclick = function(event)
  {
    if (this.mode == MODE_EDIT)
    {
      if (this._editor.onclick(event))
      {
        this.mode = MODE_DEFAULT;
        return true;
      }
      return false;
    }
    return true;
  }

  this._handlers['edit'] = function(event, target)
  {
    var ele = this._get_editable_item(event, target);
    if (ele)
    {
      this.mode = MODE_EDIT;
      this._editor.edit(event, ele);
    }
  }.bind(this);

  this._handlers['delete'] = function(event, target)
  {
    var ele = this._get_editable_item(event, target);
    if (ele)
    {
      this._data.remove_property(ele.getAttribute('data-prop-uid'));
    }
  }.bind(this);

  this._handlers['submit'] = function(event, target)
  {
    if (this.mode == MODE_EDIT)
    {
      this._editor.submit();
      return false;
    }
  }.bind(this);

  this._handlers['cancel'] = function(event, target)
  {
    if (this.mode == MODE_EDIT)
    {
      this._editor.cancel();
      return false;
    }
  }.bind(this);

  this._handlers['add'] = function(event, target)
  {
    if (this._watch_container)
    {
      var proto = this._watch_container.getElementsByClassName('prototype')[0];
      if (proto)
      {
        var key = proto.render(this._tmpl_new_prop()).firstElementChild;
        this.mode = MODE_EDIT;
        this._editor.edit(event, key);
      }
    }
  }.bind(this);

  this._onframeselected = function(msg)
  {
    if (msg.frame_index != -1 || this._last_selected_frame_index != -1)
    {
      this._data.update_watches();
    }
    this._last_selected_frame_index = msg.frame_index;
  }

  this._get_editable_item = cls.WatchesView.get_editable_item;

  this._init = function(id, name, container_class)
  {
    this.init(id, name, container_class, null, null, 'watches-edit-prop');
    this._last_selected_frame_index = 0;
    this._watch_container = null;
    this._data = new cls.WatchesData(this);
    this._editor = new cls.JSPropertyEditor(this);
    eventHandlers.dblclick['watches-edit-prop'] = this._handlers['edit'];
    eventHandlers.click['watches-add'] = this._handlers['add'];
    ActionBroker.get_instance().register_handler(this);
    messages.addListener('frame-selected', this._onframeselected.bind(this));
  };

  this._init(id, name, container_class);

};

cls.WatchesView.get_editable_item = function(event, target)
{
  var ele = event.target;
  while (ele && ele.nodeName.toLowerCase() != 'item' &&
        (ele = ele.parentNode) && ele != target);
  ele = ele && ele.getElementsByTagName('key')[0];
  if (ele && ele.hasAttribute('data-prop-uid'))
  {
    return ele;
  }
  return null;
};

cls.WatchesView.create_ui_widgets = function()
{

  var broker = ActionBroker.get_instance();
  var contextmenu = ContextMenu.get_instance();

  var watches_common_items =
  [
    {
      label: "Add watch",
      handler: function (event, target)
      {
        broker.dispatch_action("watches", "add", event, event.target);
      },
    },
  ];

  var watches_editable_items =
  [
    {
      label: "Edit",
      handler: function (event, target)
      {
        broker.dispatch_action("watches", "edit", event, target);
      },
    },
    {
      label: "Delete",
      handler: function (event, target)
      {
        broker.dispatch_action("watches", "delete", event, target);
      },
    },
  ]
  .concat(ContextMenu.separator)
  .concat(watches_common_items);

  var watches_menu =
  [
    {
      callback: function(event, target)
      {
        return (
        cls.WatchesView.get_editable_item(event, target) ?
        watches_editable_items :
        watches_common_items);
      }
    },
  ];

  contextmenu.register("watches", watches_menu);

};

cls.WatchesData = function(view)
{

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

  this._get_uid = (function()
  {
    var uid = 0;
    return function() {return ++uid;};
  })();

  this._super_init = this._init;

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
      else if(uid != 0)
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
  }

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

  this.set_data_list = function(list)
  {
    list.forEach(function(item)
    {
      item[IS_EDITABLE] = true;
      item[UID] = this._get_uid();
    }, this);
    this._obj_map.watches[0][PROPERTY_LIST] = list;
  };

  this._init(view);

}

cls.WatchesData.prototype =
  cls.EcmascriptDebugger["6.0"].InspectableJSObject.prototype;
