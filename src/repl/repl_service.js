window.cls = window.cls || {};

cls.ReplService = function(view, data)
{
  this._count_map = {};

  // Ignore these contexts to avoid duplicate messages in the console
  // when we get the results from both the ecmascript service and th
  // console logger service.
  const CONTEXT_BLACKLIST = [ "console.log", "console.debug",
     "console.info", "console.warn", "console.error", "console.assert",
     "console.dir", "console.dirxml", "console.group",
     "console.groupCollapsed", "console.groupEnded", "console.count"
  ];

  const DF_INTERN_TYPE = cls.ReplService.DF_INTERN_TYPE;
  const FRIENDLY_PRINTED = cls.ReplService.FRIENDLY_PRINTED;
  const INLINE_MODEL = cls.ReplService.INLINE_MODEL;
  const INLINE_MODEL_TMPL = cls.ReplService.INLINE_MODEL_TMPL;
  const FRIENDLY_PRINTED = cls.ReplService.FRIENDLY_PRINTED;
  const RE_DOM_OBJECT = cls.InlineExpander.RE_DOM_OBJECT;
  const IS_EXPAND_INLINE_KEY = "expand-objects-inline";
  const CLASS_NAME = 4;

  this._on_consolemessage_bound = function(msg)
  {
    var data = new cls.ConsoleLogger["2.0"].ConsoleMessage(msg);

    if (data.source != "ecmascript" ||
        CONTEXT_BLACKLIST.contains(data.context))
    {
      return;
    }
    else
    {
      this._data.add_output_errorlog(data.description);
    }
  }.bind(this);

  this._process_on_consolelog = function(msg)
  {
    const RUNTIME = 0, TYPE = 1;
    var rt_id = msg[RUNTIME];
    var type = msg[TYPE];
    var ctx = {};
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
     * 11 - console.groupEnd
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
        ctx = 
        {
          is_unpacked: true,
          is_friendly_printed: true,
          expand: true,
          is_dir: true,
        }
        this._handle_log(msg, rt_id, ctx);
        break;
      case 8:
        ctx = 
        {
          is_unpacked: true,
          is_friendly_printed: true,
          traversal: "subtree",
        }
        this._handle_log(msg, rt_id, ctx);
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

  this._handle_log = function(msg, rt_id, ctx)
  {
    const VALUELIST = 2;
    const POSITION = 3;
    const SCRIPTID = 0;
    const SCRIPTLINE = 1;
    const SEVERITY = 1;

    var pos = null;
    if (msg[POSITION])
    {
      pos =
      {
        scriptid: msg[POSITION][SCRIPTID],
        scriptline: msg[POSITION][SCRIPTLINE],
      };
    }

    ctx || (ctx = {});
    ctx.callback = this._handle_explored_list.bind(this, rt_id, pos, msg[SEVERITY]);
    ctx.value_list = msg[VALUELIST];
    ctx.rt_id = rt_id;

    this._explore_value_list(ctx);
  };

  this._explore_value_list = function(ctx)
  {

    var do_unpack = settings.command_line.get("unpack-list-alikes") &&
                    !ctx.is_unpacked &&
                    ctx.value_list;

    var do_friendly_print = !do_unpack &&
                            settings.command_line.get("do-friendly-print") &&
                            !ctx.is_friendly_printed &&
                            this._friendly_printer.list_has_object(ctx.value_list);

    var do_inline_expand = !do_unpack && !do_friendly_print &&
                           settings.command_line.get("expand-objects-inline") &&
                           !ctx.is_inline_expanded;

    // this._list_unpacker, this._friendly_printer and this._inline_expander
    // have all the same generic callback, this._explore_value_list,
    // the callee itself, bound to this instance here.
    // They will set the according flagg of is_unpacked, is_friendly_printed,
    // or is_inline_expanded on the ctx and call the callback with ctx as argument.

    if (do_unpack)
    {
      this._msg_queue.stop_processing();
      this._list_unpacker.unpack_list_alikes(ctx);
    }
    else if (do_friendly_print)
    {
      this._msg_queue.stop_processing();
      this._friendly_printer.get_friendly_print(ctx);
    }
    else if (do_inline_expand)
    {
      this._msg_queue.stop_processing();
      this._inline_expander.expand(ctx);
    }
    else
    {
      ctx.callback(ctx.value_list);
      this._msg_queue.continue_processing();
    }
  };

  this._handle_explored_list = function(rt_id, position, severity, value_list)
  {
    var values = this._parse_value_list(value_list, rt_id);
    this._data.add_output_valuelist(rt_id, values, position, severity);
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

  this._parse_value_list = function(valuelist, rt_id)
  {
    return valuelist.map(function(value)
    {
      return new cls.JSValue(value, rt_id);
    });
  };

  this._process_on_eval_done = function(status, msg, rt_id, thread_id, frame_id)
  {
    const STATUS = 0, TYPE = 1, OBJECT_VALUE = 3;
    const BAD_REQUEST = 3, INTERNAL_ERROR = 4;
    const VALUELIST = 2;

    if (status == BAD_REQUEST || status == INTERNAL_ERROR)
    {
      // hackhack: If there are errors when evaluation, as in syntax
      // errors, we get the literal error message here. However, we
      // also get it through the console-log service. To avoid showing
      // duplicates, we swallow the error message here if the user
      // has enabled showing errors in the repl. The error message
      // will still be printed, but as a result of the console-log
      // event.
      if (!settings.command_line.get('show-js-errors-in-repl')) {
        this._handle_raw(msg[0]);
      }
    }
    else if (msg[STATUS] == "unhandled-exception")
    {
      this._handle_exception(msg, rt_id);
    }
    else if (msg[TYPE] == "object")
    {
      this._handle_object(msg, rt_id, thread_id, frame_id);
    }
    else
    {
      this._handle_native(msg);
    }
  };

  this._on_element_selected_bound = function(msg)
  {
    if (msg.obj_id == 0)
    {
      this._prev_selected = null;
      this._cur_selected = null;
    }
    else
    {
      this._prev_selected = this._cur_selected;
      this._cur_selected = msg.obj_id;
    }
  }.bind(this);

  this._handle_exception = function(msg, rt_id)
  {
    const VALUE = 2, OBJECTVALUE = 3, CLASSNAME = 4;
    if (msg[OBJECTVALUE])
    {
      this._handle_object(msg, rt_id);
    }
    else
    {
      this._data.add_output_str("Unhandled exception:");
      this._handle_native(msg, rt_id);
    }
  };

  this._handle_object = function(msg, rt_id, thread_id, frame_id)
  {
    const OBJECT_VALUE = 3;
    var ctx =
    {
      callback: this._handle_explored_list.bind(this, rt_id, null, null),
      value_list: [[null, msg[OBJECT_VALUE]]],
      rt_id: rt_id,
      thread_id: thread_id,
      frame_id: frame_id,
    };
    this._explore_value_list(ctx);
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

  this.get_selected_objects = function()
  {
    var selection = [];
    if (this._cur_selected) { selection.push(this._cur_selected) }
    if (this._prev_selected) { selection.push(this._prev_selected) }
    return selection;
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

    var magicvars = [];
    if (this._cur_selected) {
      magicvars.push(["$0", this._cur_selected]);
    }
    if (this._prev_selected) {
      magicvars.push(["$1", this._prev_selected]);
    }

    var msg = [rt_id, thread, frame, cooked, magicvars];
    this._eval(msg, this._on_eval_done_bound, [rt_id, thread, frame]);
  };

  this._eval = function(msg, callback, cbargs)
  {
    var tag = this._tagman.set_callback(null, callback, cbargs);
    var wantdebugging = 1;
    /* The wantdebugging flag is not behaving as expected, so disabling this for 1.0. See DFL-1736
    if (msg.length == 5)
    {
      msg.push(wantdebugging);
    }
    */
    this._edservice.requestEval(tag, msg);
  }

  this._get_host_info = function()
  {
    var tag = this._tagman.set_callback(this, this._on_host_info_bound);
    services.scope.requestHostInfo(tag);
  };

  this._on_host_info_bound = function(status, msg)
  {
    this.hostinfo = new cls.Scope["1.0"].HostInfo(msg);
  }.bind(this);

  this._onsettingchange = function(msg)
  {
    if (msg.id == "command_line" && msg.key == IS_EXPAND_INLINE_KEY)
    {
      this._is_inline_expand = settings.command_line.get(IS_EXPAND_INLINE_KEY);
    }
  };

  this.init = function(view, data)
  {
    this._view = view;
    this._data = data;
    this._cur_selected = null;
    this._prev_selected = null;
    this._transformer = new cls.HostCommandTransformer();
    this._msg_queue = new Queue(this);
    var value_list_callback = this._explore_value_list.bind(this);
    this._list_unpacker = new cls.ListUnpacker(value_list_callback);
    this._friendly_printer = new cls.FriendlyPrinter(value_list_callback);
    this._inline_expander = new cls.InlineExpander(value_list_callback);
    this._on_consolelog_bound = this._msg_queue.queue(this._process_on_consolelog);
    this._on_eval_done_bound = this._msg_queue.queue(this._process_on_eval_done);
    this._tagman = window.tagManager; //TagManager.getInstance(); <- fixme: use singleton
    this._edservice = window.services["ecmascript-debugger"];
    this._edservice.addListener("consolelog", this._on_consolelog_bound);
    this._edservice.addListener("consoletime", this._on_consoletime_bound);
    this._edservice.addListener("consoletimeend", this._on_consoletimeend_bound);
    this._edservice.addListener("consoleprofile", this._on_consoleprofile_bound);
    this._edservice.addListener("consoleprofileend", this._on_consoleprofileend_bound);
    this._edservice.addListener("consoletrace", this._on_consoletrace_bound);

    this._clservice = window.services["console-logger"];
    this._clservice.addListener("consolemessage", this._on_consolemessage_bound);

    window.messages.addListener("element-selected", this._on_element_selected_bound);

    this._is_inline_expand = settings.command_line.get(IS_EXPAND_INLINE_KEY);
    messages.addListener('setting-changed', this._onsettingchange.bind(this));

    this._get_host_info();
  };

  this.init(view, data);
};

cls.ReplServicePre6_3 = function(view, data) {
  cls.ReplService.call(this, view, data);

  this._eval = function(msg, callback, cbargs)
  {
    var tag = this._tagman.set_callback(null, callback, cbargs);
    this._edservice.requestEval(tag, msg);
  }
}

cls.ReplServicePre6_3.prototype = cls.ReplService;

// custom fields in the scope messages
cls.ReplService.DF_INTERN_TYPE = 3;
cls.ReplService.FRIENDLY_PRINTED = 6;
cls.ReplService.IS_EXPANDABLE = 1;
cls.ReplService.INLINE_MODEL = 7;
cls.ReplService.INLINE_MODEL_TMPL = 8;
cls.ReplService.INLINE_MODEL_TMPL_JS = "inspected_js_object",
cls.ReplService.INLINE_MODEL_TMPL_DOM = "inspected_dom_node";