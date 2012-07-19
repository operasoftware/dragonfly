window.cls || (window.cls = {});

cls.EventType = function(type)
{
  this.type = type;
  this.rt_listeners = null;
  this.is_expanded = false;
  this.rt_id = 0;
  this.obj_id = 0;
  this._init();
};

cls.EventTypePrototype = function()
{
  var SEARCH_TYPE_EVENT = 5;

  this.search_listeners = function(rt_id, obj_id, type, cb)
  {
    this.rt_id = this._data_runtime_id = rt_id;
    this.obj_id = this._root_obj_id = obj_id;
    this.search(type, SEARCH_TYPE_EVENT, 0, 0, cb);
  };

  this.collapse = function()
  {
    this._data = [];
    this.rt_listeners = null;
    this.is_expanded = false;
  };
};

cls.EventTypePrototype.prototype = cls.EcmascriptDebugger["6.0"].InspectableDOMNode.prototype;
cls.EventType.prototype = new cls.EventTypePrototype();

cls.RTListUpdateCTX = function(rt_id_list, cb)
{
  this._init(rt_id_list, cb);
};

cls.RTListUpdateCTX.prototype = new function()
{
  this._handle_expand_listener = function(ev_type)
  {
    var list = this.expanded_map[ev_type.rt_id];
    var index = list.indexOf(ev_type.type);
    if (index > -1)
      list.splice(index, 1);
    else
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      "_handle_expand_listener failed in cls.EventListeners.")

    this.check_is_updated();
  };

  this._check_rt = function(rt_id)
  {
    return this.rt_map.hasOwnProperty(rt_id) &&
           (!this.rt_map[rt_id] || (this.expanded_map[rt_id] &&
                                    this.expanded_map[rt_id].length === 0));
  };

  this.check_is_updated = function()
  {
    if (this.rt_id_list.every(this._check_rt, this))
      this._cb(this);
  };

  this._init = function(rt_id_list, cb)
  {
    this.rt_id_list = rt_id_list;
    this.rt_map = {};
    this.win_id_map = {};
    this.expanded_map = {};
    this.handle_expand_listener_bound = this._handle_expand_listener.bind(this);
    this._cb = cb;
  };
};

cls.EventListeners = function(view)
{
  this._init(view);
};

cls.EventListeners.prototype = new function()
{

  /* interface */

  this.update = function() {};
  this.get_data = function() {};
  this.expand_listeners = function(rt_id, obj_id, type, cb) {};
  this.collapse_listeners = function(rt_id, type) {};
  this.is_expanded = function(rt_id, type) {};

  var SUCCESS = 0;
  var SEARCH_TYPE_EVENT = 5;
  var DELAY = 150;
  var get_rt_id = function(rt) { return rt.rt_id };

  /*
    data structure:

    this._rts = [{rt_id: <rt-id>,
                  obj_id: <obj-id>,
                  event_types: [<EventType>, ...]}, ...]
  */

  this._on_new_rts = function()
  {
    if (!this._on_new_rts_timeout)
      this._on_new_rts_timeout = setTimeout(this._handle_new_rts_bound, DELAY);
  };

  this._handle_new_rts = function()
  {
    var rt_ids = window.runtimes.get_dom_runtime_ids();
    var cur_rt_ids = this._rts.map(get_rt_id);
    var new_rt_ids = rt_ids.filter(function(id) { return !cur_rt_ids.contains(id); });
    var live_rts = this._rts.filter(function(rt) { return rt_ids.contains(rt.rt_id); });
    if (live_rts.length != this._rts.length)
    {
      this._rts = live_rts;
      this._view.update();
    }
    if (new_rt_ids)
      this._update_rt_list(new_rt_ids);

    this._on_new_rts_timeout = 0;
  };

  this._update_rt_list = function(rt_id_list)
  {
    var ctx = new cls.RTListUpdateCTX(rt_id_list, this.on_rt_list_update_bound);
    rt_id_list.forEach(this._get_window_ids.bind(this, ctx));
  };

  this._on_rt_list_update = function(ctx)
  {
    for (var i = 0, id; id = ctx.rt_id_list[i]; i++)
    {
      this._rts[this._get_rt_index(id)] = ctx.rt_map[id];
    }
    this._view.update();
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
    if (status === SUCCESS && message[STATUS] === "completed" && message[OBJECT_VALUE])
    {
      this._win_id_map[rt_id] = ctx.win_id_map[rt_id] = message[OBJECT_VALUE][OBJECT_ID];
      if (ctx.rt_id_list.every(function(rt_id) { return ctx.win_id_map[rt_id]; }))
        ctx.rt_id_list.map(this._get_event_types.bind(this, ctx));
    }
    // Ignore failure. It's quite common that new runtimes get replace quickly
    // by some document.write.
  };

  this._get_event_types = function(ctx, rt_id)
  {
    var tag = this._tagman.set_callback(this, this._handle_get_event_types, [ctx]);
    var msg = [rt_id];
    this._esdb.requestGetEventNames(tag, msg);
  };

  this._handle_get_event_types = function(status, message, ctx)
  {
    if (status === SUCCESS)
    {
      var RUNTIME_ID = 0;
      var OBJECT_ID = 1;
      var EVENT_NAMES = 2;
      var rt_id = message[RUNTIME_ID];
      var obj_id = message[OBJECT_ID];
      var ev_list = message[EVENT_NAMES];
      var rt_listeners = {rt_id: rt_id,
                          obj_id: obj_id,
                          window_id: ctx.win_id_map[rt_id]};
      ctx.expanded_map[rt_id] = [];
      if (ev_list && ev_list.length)
      {
        rt_listeners.event_types = ev_list.map(function(type)
        {
          var ev_type = new cls.EventType(type);
          if (this.is_expanded(rt_id, type))
          {
            ctx.expanded_map[rt_id].push(type);
            var cb = this._handle_dom_search.bind(this, ev_type,
                                                  ctx.handle_expand_listener_bound);
            ev_type.search_listeners(rt_id, obj_id, type, cb);
          }
          return ev_type;
        }, this);
      }
      else
        rt_listeners.event_types = [];

      ctx.rt_map[rt_id] = rt_listeners;
      ctx.check_is_updated();
    }
    else
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      "failed to retrieve the event names in cls.EventListeners.")
  };

  this._handle_dom_search = function(ev_type, cb)
  {
    var tag = this._tagman.set_callback(this, this._handle_obj_search, [ev_type, cb]);
    var msg = [ev_type.rt_id, [this._win_id_map[ev_type.rt_id]]];
    this._esdb.requestGetEventListeners(tag, msg);
  };

  this._handle_obj_search = function(status, message, ev_type, cb)
  {
    if (status === SUCCESS)
    {
      var TARGET_LIST = 1;
      var OBJECT_ID = 0;
      var EVENT_LISTENERS = 1;
      var ev_target = message[TARGET_LIST] && message[TARGET_LIST][0];
      ev_type.window_listeners = ev_target
                               ? {win_id: ev_target[OBJECT_ID],
                                  listeners: ev_target[EVENT_LISTENERS]}
                               : null;
      ev_type.is_expanded = true;

      if (!this._expand_tree[ev_type.rt_id])
        this._expand_tree[ev_type.rt_id] = {};

      this._expand_tree[ev_type.rt_id][ev_type.type] = true;

      if (cb)
        cb(ev_type);
      else
        this._view.update();

    }
    else
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      "requestGetEventListeners failed in cls.EventListeners.")
  };

  this._get_ev_type = function(rt_id, type)
  {
    var rt = this._get_rt(rt_id);
    if (rt)
    {
      for (var i = 0, ev_type; ev_type = rt.event_types[i]; i++)
      {
        if (ev_type.type == type)
          return ev_type;
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
    var rt_id_list = window.runtimes.get_dom_runtime_ids();
    if (rt_id_list.length)
      this._update_rt_list(rt_id_list);
  };

  this.get_data = function()
  {
    if (this._rts)
      return this._rts;

    this.update();
    return null;
  };

  this.expand_listeners = function(rt_id, obj_id, type, cb)
  {
    var ev_type = this._get_ev_type(rt_id, type);
    if (ev_type)
    {
      var inner_cb = this._handle_dom_search.bind(this, ev_type, cb);
      ev_type.search_listeners(rt_id, obj_id, type, inner_cb);
    }
    else
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      "failed to find event names object in cls.EventListeners.")

  };

  this.collapse_listeners = function(rt_id, type)
  {
    var ev_type = this._get_ev_type(rt_id, type);
    if (ev_type)
    {
      ev_type.collapse();
      if (this._expand_tree[rt_id])
        this._expand_tree[rt_id][type] = false;
    }
  };

  this.is_expanded = function(rt_id, type)
  {
    return this._expand_tree[rt_id]
         ? Boolean(this._expand_tree[rt_id][type])
         : false;
  };

  this._init = function(view)
  {
    this._on_new_rts_timeout = 0;
    this._handle_new_rts_bound = this._handle_new_rts.bind(this);
    this.on_rt_list_update_bound = this._on_rt_list_update.bind(this);
    this._rts = [];
    this._win_id_map = {};
    this._expand_tree = {};
    this._view = view;
    this._tagman = window.tag_manager;
    this._esdb = window.services["ecmascript-debugger"];
    window.messages.add_listener("active-tab", this._on_new_rts.bind(this));
  };

};
