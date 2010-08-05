cls.ReplService = function(view, data)
{
  if (cls.ReplService.instance)
  {
    return cls.ReplService.instance;
  }
  cls.ReplService.instance = this;

  this._on_consolelog = function(msg)
  {
    var rt_id = msg[0];
    var type = msg[1];
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
    }
  };

  this._on_consoletime = function(msg)
  {
    const TITLE = 1;
    this._data.add_output_str("Started: " + msg[TITLE]);
  };

  this._on_consoletimeend = function(msg)
  {
    const TITLE = 1, DURATION = 2;
    var dur = msg[DURATION];
    var ms = Math.round(dur / 1000);
    this._data.add_output_str(msg[TITLE] + ": " + ms + "ms (" + dur + "µsec)" );
  };

  this._on_consoleprofile = function(msg)
  {
    this._data.add_output_str("console.profile called. Profiling is not yet supported.");
  };

  this._on_consoleprofileend = function(msg)
  {
    this._data.add_output_str("console.profileEnd called. Profiling is not yet supported.");
  };

  this._on_consoletrace = function(data)
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
  };

  this._handle_log = function(msg, rt_id)
  {
    const VALUELIST = 2;
    var values = this._parse_value_list(msg[VALUELIST]);
    this._data.add_output_valuelist(rt_id, values);
  };

  this._handle_group = function(msg, collapsed)
  {
    this._data.add_output_groupstart({name: msg[2][0][0], collapsed: Boolean(collapsed)});
  };

  this._handle_groupend = function(msg)
  {
    this._data.add_output_groupend();
  };

  this._parse_value = function(value, rt_id)
  {
      var ret = {
        type: value[0] === null ? "object" : "native"
      };

      if (ret.type == "object") {
        var object = value[1];
        ret.obj_id = object[0];
        ret.type = object[2];
        ret.name = object[4] || object[5];
        ret.rt_id = rt_id;
      }
      else
      {
        ret.value = value[0];
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

  this._on_eval_done = function(status, msg, rt_id, thread_id, frame_id)
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
  };

  this._on_element_selected = function(msg)
  {
    this._prev_selected = this._cur_selected;
    this._cur_selected = msg.obj_id;
  };

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
    var props = {};
    var propslist = msg[0][0][0][0][1];
    for (var n=0, e; e=propslist[n]; n++)
    {
      props[e[0]] = e[2];
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
    var rt_id = runtimes.getSelectedRuntimeId();
    var thread = window.stop_at.getThreadId();
    var frame = window.stop_at.getSelectedFrameIndex();
    if (frame == -1)
    {
      thread = 0;
      frame = 0;
    }

    var cooked = this._transformer.transform(input);
    var tag = this._tagman.set_callback(this, this._on_eval_done.bind(this), [rt_id, thread, frame]);
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
    this._service.addListener("consolelog", this._on_consolelog.bind(this));
    this._service.addListener("consoletime", this._on_consoletime.bind(this));
    this._service.addListener("consoletimeend", this._on_consoletimeend.bind(this));
    this._service.addListener("consoleprofile", this._on_consoleprofile.bind(this));
    this._service.addListener("consoleprofileend", this._on_consoleprofileend.bind(this));
    this._service.addListener("consoletrace", this._on_consoletrace.bind(this));
    window.messages.addListener("element-selected", this._on_element_selected.bind(this));
  };

  this.init(view, data);
};
