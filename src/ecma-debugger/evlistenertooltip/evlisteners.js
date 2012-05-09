window.cls || (window.cls = {});

/**
  * @constructor
  * @extends ViewBase
  */

cls.EventName = function(name)
{
  this.name = name;
  this.model = null;
  this.rt_listeners = null,
  this.expanded = null;
  this.rt_id = 0;
  this.obj_id = 0;
};

cls.EvenetListeners = function(view)
{
  /* interface */

  this.update = function() {};
  this.get_data = function() {};
  this.expand_listeners = function(rt_id, obj_id, ev_name, cb) {};

  var SUCCESS = 0;
  var SEARCH_TYPE_EVENT = 5;

  /*
    data structure
    
    this._rts =
    [
      {
        rt_id: <rt-id>,
        obj_id: <obj-id>,
        event_names: 
        [
          {
            name: <name>,
            expanded: <boolean>,
          },
          ...
        ]
      },
      ...
    ]

  */

  this._update_rt_list = function(rt_id_list)
  {
    var ctx = {rt_id_list: rt_id_list, rt_map: {}, win_id_map: {}};
    rt_id_list.forEach(this._get_window_ids.bind(this, ctx));
  };

  this._get_window_ids = function(ctx, rt_id)
  {
    var sel_rt_id = window.runtimes.getSelectedRuntimeId();
    var thread_id = window.stop_at.getThreadId();
    var frame_index = window.stop_at.getSelectedFrameIndex();
    if (sel_rt_id != rt_id || frame_index == -1)
    {
      thread_id = 0;
      frame_index = 0;
    }
    var tag = this._tagman.set_callback(this, this._handle_window_ids, [ctx, rt_id]);
    var msg = [rt_id, thread_id, frame_index, "window"];
    this._esdb.requestEval(tag, msg);
  };

  this._handle_window_ids = function(status, message, ctx, rt_id)
  {
    var STATUS = 0;
    var OBJECT_VALUE = 3;
    var OBJECT_ID = 0;
    if (status === SUCCESS && message[STATUS] == "completed" && message[OBJECT_VALUE])
    {
      this._win_id_map[rt_id] = ctx.win_id_map[rt_id] = message[OBJECT_VALUE][OBJECT_ID];
      if (ctx.rt_id_list.every(function(rt_id) { return ctx.win_id_map[rt_id]; }))
        ctx.rt_id_list.map(this._get_event_names.bind(this, ctx));
    }
    else
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      "failed to get the window object in cls.EvenetListeners.")
  };

  this._get_event_names = function(ctx, rt_id)
  {
    var tag = this._tagman.set_callback(this, this._handle_get_event_names, [ctx, rt_id]);
    var msg = [rt_id];
    this._esdb.requestGetEventNames(tag, msg);
  };

  this._handle_get_event_names = function(status, message, ctx, rt_id)
  {
    if (status === SUCCESS)
    {
      var RUNTIME_ID = 0;
      var OBJECT_ID = 1;
      var EVENT_NAMES = 2;
      ctx.rt_map[message[RUNTIME_ID]] = null;
      if (message[EVENT_NAMES] && message[EVENT_NAMES].length)
      {
        ctx.rt_map[message[RUNTIME_ID]] =
        {
          rt_id: message[RUNTIME_ID],
          obj_id: message[OBJECT_ID],
          window_id: ctx.win_id_map[rt_id],
          event_names: message[EVENT_NAMES].map(function(name)
          {
            return new cls.EventName(name);
          }),
        };
      }

      if (ctx.rt_id_list.every(function(rt_id) {return ctx.rt_map.hasOwnProperty(rt_id); }))
      {
        for (var i = 0, id; id = ctx.rt_id_list[i]; i++)
        {
          this._rts[this._get_rt_index(id)] = ctx.rt_map[id];
        }
        this._view.update();
      }
    }
    else
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      "failed to retrieve the event names in cls.EvenetListeners.")
  };

  this._handle_dom_search = function(ev_name_obj, cb)
  {
    var tag = this._tagman.set_callback(this, this._handle_obj_search, [ev_name_obj, cb]);
    var msg = [ev_name_obj.rt_id, [this._win_id_map[ev_name_obj.rt_id]]];
    this._esdb.requestGetEventListeners(tag, msg);
  };

  this._handle_obj_search = function(status, message, ev_name_obj, cb)
  {
    if (status === SUCCESS)
    {
      var TARGET_LIST = 1;
      var OBJECT_ID = 0;
      var EVENT_LISTENERS = 1;
      var ev_target = message[TARGET_LIST] && message[TARGET_LIST][0];
      ev_name_obj.model.window_listeners = ev_target
                                         ? {win_id: ev_target[OBJECT_ID],
                                            listeners: ev_target[EVENT_LISTENERS]}
                                         : null;
      ev_name_obj.expanded = true;
      if (cb)
        cb(ev_name_obj);
      else
        this._view.update();
    }
    else
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      "requestGetEventListeners failed in cls.EvenetListeners.")
  };

  this._get_ev_name_obj = function(rt_id, ev_name)
  {
    var rt = this._get_rt(rt_id);
    if (rt)
    {
      for (var i = 0, ev_n; ev_n = rt.event_names[i]; i++)
      {
        if (ev_n.name == ev_name)
          return ev_n;
      }
    }
    return null;
  };

  this._get_rt = function(rt_id)
  {
    if (this._rts)
    {
      for (var i = 0, rt; rt = this._rts[i]; i++)
      {
        if (rt.rt_id == rt_id)
          return rt;
      }
    }
    return null;
  };

  this._get_rt_index = function(rt_id)
  {
    for (var i = 0; i < this._rts.length && this._rts[i].rt_id !== rt_id; i++);
    return i;
  };

  /* implementation */
  
  this.update = function()
  {
    this._rts = [];
    this._win_id_map = {};
    var rt_id_list = window.runtimes.get_runtime_ids();
    if (rt_id_list.length)
    {
      window.messages.remove_listener('new-top-runtime', this._update_bound);
      this._update_rt_list(rt_id_list);
    }
    else
      window.messages.add_listener('new-top-runtime', this._update_bound);
  };

  this.get_data = function()
  {
    if (this._rts)
      return this._rts;

    this.update();
    return null;
  };

  this.expand_listeners = function(rt_id, obj_id, ev_name, cb)
  {
    var ev_n = this._get_ev_name_obj(rt_id, ev_name);
    if (ev_n)
    {
      ev_n.rt_id = rt_id;
      ev_n.obj_id = obj_id;
      ev_n.model = new cls.InspectableDOMNode(rt_id, obj_id);
      var cb = this._handle_dom_search.bind(this, ev_n, cb);
      ev_n.model.search(ev_name, SEARCH_TYPE_EVENT, 0, 0, cb);
    }
    else
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      "failed to find event names object in cls.EvenetListeners.")

  };

  this._init = function(view)
  {
    this._view = view;
    this._tagman = window.tag_manager;
    this._esdb = window.services["ecmascript-debugger"];
    this._update_bound = this.update.bind(this);
  }

  this._init(view);
};
