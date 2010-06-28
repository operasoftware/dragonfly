cls.ReplService = function(view, data)
{
  if (cls.ReplService.instance)
  {
    return cls.ReplService.instance;
  }
  cls.ReplService.instance = this;

  this._on_consolelog = function(msg)
  {
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
        this._handle_log(msg);
        break;
      case 7:
        this._handle_dir(msg);
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


  this._handle_log = function(msg)
  {

  };

  this._handle_dir = function(msg)
  {
    var rt = msg[0];
    var obj = msg[2][0][1][0];
     this._data.add_output_iobj(rt, obj, "fixme");
  };

  this._on_eval_done = function(status, msg, rt_id, thread_id, frame_id)
  {
    const STATUS = 0, TYPE = 1;

    if (msg[STATUS] == "unhandled-exception")
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
    this._service.requestEval(tag, [rt_id, thread, frame, cooked]);
  };

  this.init = function(view, data)
  {
    this._view = view;
    this._data = data;
    this._transformer = new HostCommandTransformer();
    this._tagman = window.tagManager; //TagManager.getInstance(); <- fixme: use singleton
    this._service = window.services['ecmascript-debugger'];
    this._service.addListener("consolelog", this._on_consolelog.bind(this));
    this._service.addListener("consoletime", this._on_consoletime.bind(this));
    this._service.addListener("consoletimeend", this._on_consoletimeend.bind(this));
  };

  this.init(view, data);
};
