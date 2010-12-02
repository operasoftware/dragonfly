cls.ReplService = function(view, data)
{
  if (cls.ReplService.instance)
  {
    return cls.ReplService.instance;
  }
  cls.ReplService.instance = this;

  this._count_map = {};
  
  this._msg_queue = [];
  this._is_processing = false;

  this._on_consolelog_bound = function(msg)
  {
    if (this._is_processing)
      this._msg_queue.push(msg);
    else
      this._process_on_consolelog(msg);
  }.bind(this);
  
  this._process_msg_queue = function()
  {
    while (!this._is_processing && this._msg_queue.length)
      this._process_on_consolelog(this._msg_queue.shift());
  }
    
  this._process_on_consolelog = function(msg)
  {
    const RUNTIME = 0, TYPE = 1;
    var rt_id = msg[RUNTIME];
    var type = msg[TYPE];
    /**
     * This value indicates which function was called:
     *
     * 1 - console.log
     * 2 - console.debug
     * 3 - console.info
     * 4 - console.warn
     * 5 - console.error
     * 6 - console.assert
     * 7 - console.dir
     * 8 - console.dirxml
     * 9 - console.group
     * 10 - console.groupCollapsed
     * 11 - console.groupEnded
     * 12 - console.count
     */

    switch(type)
    {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
        this._handle_log(msg, rt_id);
        break;
      case 7:
        this._handle_dir(msg, rt_id);
        break;
      case 8:
        this._handle_dirxml(msg, rt_id);
        break;
      case 9:
        this._handle_group(msg);
        break;
      case 10:
        this._handle_group(msg, "collapsed");
        break;
      case 11:
        this._handle_groupend(msg);
        break;
      case 12:
        this._handle_count(msg);
        break;
    }
  };

  this._on_consoletime_bound = function(msg)
  {
    const TITLE = 1;
    this._data.add_output_str("Started: " + msg[TITLE]);
  }.bind(this);

  this._on_consoletimeend_bound = function(msg)
  {
    const TITLE = 1, DURATION = 2;
    var dur = msg[DURATION];
    var ms = Math.round(dur / 1000);
    this._data.add_output_str(msg[TITLE] + ": " + ms + "ms (" + dur + "µsec)" );
  }.bind(this);

  this._on_consoleprofile_bound = function(msg)
  {
    this._data.add_output_str("console.profile called. Profiling is not yet supported.");
  }.bind(this);

  this._on_consoleprofileend_bound = function(msg)
  {
    this._data.add_output_str("console.profileEnd called. Profiling is not yet supported.");
  }.bind(this);

  this._on_consoletrace_bound = function(data)
  {
    var message = new cls.EcmascriptDebugger["6.0"].ConsoleTraceInfo(data);

    for (var n=0, frame; frame = message.frameList[n]; n++)
    {
      var script = window.runtimes.getScript(frame.scriptID);
      if (!script) { continue; };
      frame.script_type = script.script_type;
      frame.uri = script.uri;
    }

    this._data.add_output_trace(message);
  }.bind(this);

  this._handle_log = function(msg, rt_id, is_unpacked)
  {
    const VALUELIST = 2;
    if (is_unpacked ||
        !settings.command_line.get("unpack-list-alikes") ||
        !msg[VALUELIST])
    {
      var values = this._parse_value_list(msg[VALUELIST], rt_id);
      this._data.add_output_valuelist(rt_id, values);
      if (is_unpacked && this._is_processing)
      {
        this._is_processing = false;
        this._process_msg_queue();
      }
    }
    else
    {
      var fallback = this._handle_log.bind(this, msg, rt_id, true);
      this._is_processing = true;
      this._unpack_list_alikes(msg, rt_id, fallback);
    }
  };

  this._unpack_list_alikes = function(msg, rt_id, fallback)
  {
    const VALUE_LIST = 2, OBJECT_VALUE = 1, OBJECT_ID = 0;
    var obj_ids = (msg[VALUE_LIST]).map(function(value, index)
    {
      return value[OBJECT_VALUE] && value[OBJECT_VALUE][OBJECT_ID] || 0;
    });
    var call_list = obj_ids.map(function(object_id)
    {
      return object_id && "$_" + object_id || null;
    }).join(',');
    var arg_list = obj_ids.reduce(function(list, obj_id)
    {
      if (obj_id)
        list.push(["$_" + obj_id, obj_id]);
      return list;
    }, []);
    var tag = this._tagman.set_callback(this, this._handle_list_alikes_list,
                                        [msg, rt_id, obj_ids, fallback]);
    var script = this._is_list_alike.replace("%s", call_list);
    var msg = [rt_id, 0, 0, script, arg_list];
    this._service.requestEval(tag, msg);
  }

  // Boolean(document.all) === false
  this._is_list_alike = "(" + (function(list)
  {
    return list.map(function(item)
    {
      var _class = item === null ? "" : Object.prototype.toString.call(item);
      if (/(?:Array|Collection|List|Map)\]$/.test(_class))
        return 2;
      if (_class == "[object Object]" && typeof item.length == "number")
        return 1;
      return 0;
    }).join(',');
  }).toString() + ")([%s])";

  this._handle_list_alikes_list = function(status, msg, orig_msg,
                                           rt_id, obj_ids, fallback)
  {
    const STATUS = 0, VALUE = 2;
    if (status || msg[STATUS] != "completed")
    {
      fallback();
    }
    else
    {
      var log = msg[VALUE].split(',').map(Number);
      if (log.filter(Boolean).length)
      {
        var unpack = log.reduce(function(list, entry, index)
        {
          if (entry)
            list.push(obj_ids[index]);
          return list;
        }, []);
        var tag = this._tagman.set_callback(this, this._handle_unpacked_list,
                                            [orig_msg, rt_id, log]);
        this._service.requestExamineObjects(tag, [rt_id, unpack]);
      }
      else
      {
        fallback();
      }
    }
  }

  this._handle_unpacked_list = function(status, msg, orig_msg, rt_id, log)
  {
    const OBJECT_CHAIN_LIST = 0, VALUE_LIST = 2, DF_INTERN_TYPE = 3;
    if (status || !msg[OBJECT_CHAIN_LIST])
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
                      " ExamineObjects failed in _handle_unpacked_list in repl_service");
    }
    else
    {
      var object_list =
        (msg[OBJECT_CHAIN_LIST]).map(this._examine_objects_to_value_list, this);
      var orig_value_list = orig_msg[VALUE_LIST];
      orig_msg[VALUE_LIST] = log.reduce(function(list, log_entry, index)
      {
        if (log_entry)
        {
          var unpack_header = orig_value_list[index];
          unpack_header[DF_INTERN_TYPE] = "unpack-header";
          list.push(unpack_header);
          list.push.apply(list, object_list.shift());
          list.push(["", null, 0, "unpack-footer"]);
        }
        else
          list.push(orig_value_list[index]);
        return list;
      }, []);
      this._handle_log(orig_msg, rt_id, true);
    }
  }

  this._examine_objects_to_value_list = function(object_chain)
  {
    const
    // message ExamineObjects
    OBJECT_LIST = 0,
    // sub message ObjectInfo
    VALUE = 0, PROPERTY_LIST = 1,
    // sub message ObjectValue
    CLASS_NAME = 4,
    // sub message Property
    NAME = 0, PROPERTY_TYPE = 1, PROPERTY_VALUE = 2, OBJECT_VALUE = 3;

    var value_list = [];
    var object = object_chain[OBJECT_LIST] && object_chain[OBJECT_LIST][0];
    if (object && object[PROPERTY_LIST])
    {
      value_list = (object[PROPERTY_LIST]).reduce(function(list, prop)
      {
        if (prop[NAME].isdigit())
        {
          if (prop[PROPERTY_TYPE] == 'object')
            list.push([null, prop[OBJECT_VALUE], parseInt(prop[NAME])]);
          else
          {
            if (prop[PROPERTY_TYPE] == "string")
              prop[PROPERTY_VALUE] = "\"" + prop[PROPERTY_VALUE] + "\"";
            list.push([prop[PROPERTY_VALUE] || prop[PROPERTY_TYPE],
                      null, parseInt(prop[NAME])]);
          }
        }
        return list;
      }, []);
      value_list.sort(function(a, b)
      {
        return a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : 0;
      });
    }
    return value_list;
  };

  this._handle_count = function(msg)
  {
    const VALUELIST=2, POSITION=3, SCRIPTID=0, LINE=1;
    var key = String(msg[POSITION][SCRIPTID]) + "_" + msg[POSITION][LINE];
    if (!(key in this._count_map)) { this._count_map[key] = 0; }

    var label = null;
    if (msg[VALUELIST].length)
    {
      label = msg[VALUELIST][0][0];
    }

    this._count_map[key] += 1;
    this._data.add_output_count(this._count_map[key], label);
  };

  this._handle_group = function(msg, collapsed)
  {
    const VALUE=0, VALUELIST=2;
    this._data.add_output_groupstart({name: msg[VALUELIST][0][VALUE], collapsed: Boolean(collapsed)});
  };

  this._handle_groupend = function(msg)
  {
    this._data.add_output_groupend();
  };

  this._parse_value = function(value, rt_id)
  {
    const TYPE = 0;
    const VALUE = 0, OBJECTVALUE = 1;
    const ID = 0, OTYPE = 2, CLASSNAME = 4, FUNCTIONNAME = 5;
    const DF_INTERN_TYPE = 3;

    var ret = {
      df_intern_type: value[DF_INTERN_TYPE] || "",
      type:  value[0] === null ? "object" : "native",
      rt_id: rt_id
    };

    if (ret.type == "object") {
      var object = value[OBJECTVALUE];
      ret.obj_id = object[ID];
      ret.type = object[OTYPE];
      ret.name = object[CLASSNAME] || object[FUNCTIONNAME];
    }
    else
    {
      ret.value = value[VALUE];
    }
    return ret;
  };

  this._parse_value_list = function(valuelist, rt_id)
  {
    var pv = this._parse_value;
    var fun = function(v) { return pv(v, rt_id); }; // partial invocation wrapping rt_id
    return valuelist.map(fun);
  };

  this._handle_dirxml = function(msg, rt_id)
  {
    const VALUELIST = 2;
    var values = this._parse_value_list(msg[VALUELIST], rt_id);
    for (var n=0, e; e=values[n]; n++)
    {
      this._data.add_output_iele(rt_id, e.obj_id, e.name);
    }
  };

  this._handle_dir = function(msg, rt_id)
  {
    const VALUELIST = 2;
    var values = this._parse_value_list(msg[VALUELIST], rt_id);
    for (var n=0, e; e=values[n]; n++)
    {
      this._data.add_output_iobj(rt_id, e.obj_id, e.name);
    }
  };

  this._on_eval_done_bound = function(status, msg, rt_id, thread_id, frame_id)
  {
    const STATUS = 0, TYPE = 1, OBJECT_VALUE = 3;
    const BAD_REQUEST = 3, INTERNAL_ERROR = 4;

    if (status == BAD_REQUEST || status == INTERNAL_ERROR)
    {
      this._handle_raw(msg[0]);
    }
    else if (msg[STATUS] == "unhandled-exception")
    {
      this._handle_exception(msg, rt_id);
    }
    else if (msg[TYPE] == "object")
    {
      if (settings.command_line.get("unpack-list-alikes"))
      {
        var fallback = this._handle_object.bind(this, msg, rt_id);
        // convert Eval to OnConsoleLog
        // 1 - console.log
        var msg = [rt_id, 1, [[null, msg[OBJECT_VALUE]]]];
        this._unpack_list_alikes(msg, rt_id, fallback);
      }
      else
      {
        this._handle_object(msg, rt_id);
      }
    }
    else
    {
      this._handle_native(msg);
    }
  }.bind(this);

  this._on_element_selected_bound = function(msg)
  {
    this._prev_selected = this._cur_selected;
    this._cur_selected = msg.obj_id;
  }.bind(this);

  this._handle_exception = function(msg, rt_id)
  {
    const VALUE = 2;
    this._get_exception_info(rt_id, msg[3][0]);
  };

  this._handle_object = function(msg, rt_id)
  {
    const TYPE = 1, OBJVALUE = 3;
    const OBJID = 0, CLASS = 4; FUNCTION = 5;

    var obj = msg[OBJVALUE];
    this._data.add_output_pobj(rt_id, obj[OBJID], obj[CLASS] || obj[FUNCTION]);
  };

  this._handle_native = function(msg)
  {
    const VALUE = 2;
    const TYPE = 1;
    var type = msg[TYPE];
    var val = msg[VALUE];

    switch(type)
    {
      case "null":
      case "undefined":
        val = type;
        break;
      case "string":
        val = '"' + val + '"';
        break;
    }

    this._data.add_output_str(val);
  };

  this._handle_raw = function(val)
  {
    this._data.add_output_str(val);
  };

  this._get_exception_info = function(rt, obj)
  {
    var tag = this._tagman.set_callback(this, this._on_get_exception_info.bind(this));
    this._service.requestExamineObjects(tag, [rt, [obj], 0, 0, 1]);
  };

  this._on_get_exception_info = function(status, msg)
  {
    const NAME = 0, VALUE = 2;
    var props = {};

    // the following line looks up
    // msg -> objectchainlist -> objectchain -> objectlist -> objectinfo -> propertylist
    var propslist = msg[0][0][0][0][1];
    for (var n=0, e; e=propslist[n]; n++)
    {
      props[e[NAME]] = e[VALUE];
    }

    this._data.add_output_exception(props.message, props.stacktrace);
  };

  this.handle_input = function(input)
  {
    this._data.add_input(input);
    this.evaluate_input(input);
  }.bind(this);

  this.evaluate_input = function(input)
  {
    var cooked = this._transformer.transform(input);
    var command = this._transformer.get_command(cooked);

    if (command)
    {
      this._handle_clientcommand(command);
    }
    else
    {
      this._handle_hostcommand(cooked);
    }

  };

  this._handle_clientcommand = function(command)
  {
    command.call(this._transformer, this._view, this._data, this);
  };

  this._handle_hostcommand = function(cooked)
  {
    // ignore all whitespace commands
    if (cooked.trim() == "") {
      return;
    }

    var rt_id = runtimes.getSelectedRuntimeId();
    var thread = window.stop_at.getThreadId();
    var frame = window.stop_at.getSelectedFrameIndex();
    if (frame == -1)
    {
      thread = 0;
      frame = 0;
    }

    var tag = this._tagman.set_callback(this, this._on_eval_done_bound, [rt_id, thread, frame]);
    var magicvars = [];
    if (this._cur_selected) {
      magicvars.push(["$0", this._cur_selected]);
    }
    if (this._prev_selected) {
      magicvars.push(["$1", this._prev_selected]);
    }
    this._service.requestEval(tag, [rt_id, thread, frame, cooked, magicvars]);

  };

  this._get_host_info = function()
  {
    var tag = this._tagman.set_callback(this, this._on_host_info_bound);
    services.scope.requestHostInfo(tag);
  };

  this._on_host_info_bound = function(status, msg)
  {
    this.hostinfo = new cls.Scope["1.0"].HostInfo(msg);
  }.bind(this);

  this.init = function(view, data)
  {
    this._view = view;
    this._data = data;
    this._cur_selected = null;
    this._prev_selected = null;
    this._transformer = new cls.HostCommandTransformer();
    this._tagman = window.tagManager; //TagManager.getInstance(); <- fixme: use singleton
    this._service = window.services['ecmascript-debugger'];
    this._service.addListener("consolelog", this._on_consolelog_bound);
    this._service.addListener("consoletime", this._on_consoletime_bound);
    this._service.addListener("consoletimeend", this._on_consoletimeend_bound);
    this._service.addListener("consoleprofile", this._on_consoleprofile_bound);
    this._service.addListener("consoleprofileend", this._on_consoleprofileend_bound);
    this._service.addListener("consoletrace", this._on_consoletrace_bound);
    window.messages.addListener("element-selected", this._on_element_selected_bound);
    this._get_host_info();
  };

  this.init(view, data);
};
