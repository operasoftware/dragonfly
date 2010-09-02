cls.ReplService = function(view, data)
{
  if (cls.ReplService.instance)
  {
    return cls.ReplService.instance;
  }
  cls.ReplService.instance = this;

  this._count_map = {};

  this._on_consolelog_bound = function(msg)
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
  }.bind(this);

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

  this._handle_log = function(msg, rt_id)
  {
    const VALUELIST = 2;
    var values = this._parse_value_list(msg[VALUELIST]);
    this._data.add_output_valuelist(rt_id, values);
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
    var ret = {
      type: value[0] === null ? "object" : "native"
    };

    if (ret.type == "object") {
      var object = value[OBJECTVALUE];
      ret.obj_id = object[ID];
      ret.type = object[OTYPE];
      ret.name = object[CLASSNAME] || object[FUNCTIONNAME];
      ret.rt_id = rt_id;
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
    const STATUS = 0, TYPE = 1;

    if (status == 4)
    {
      this._handle_raw(msg[0]);
    }
    else if (msg[STATUS] == "unhandled-exception")
    {
      this._handle_exception(msg, rt_id);
    }
    else if (msg[TYPE] == "object")
    {
      this._handle_object(msg, rt_id);
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
    this._data.add_output_pobj(rt_id, obj[OBJID], obj[FUNCTION] || obj[CLASS]);
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
    this._evaluate_input(input);
  }.bind(this);

  this._evaluate_input = function(input)
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

  this._handle_clientcommand = function(command, cooked)
  {
    command(this._view, this._data, cooked);
  };

  this._handle_hostcommand = function(cooked)
  {
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
  };

  this.init(view, data);
};
