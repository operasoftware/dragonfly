window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
 * @fileoverview
  runtime_onload_handler is a workaround because some apis do not
  take into account if the document has finished loading
  like e.g the api to get the stylesheets.
  */

window.cls.EcmascriptDebugger["6.0"].RuntimeOnloadHandler = function()
{
  // this is a workaround because some apis do not
  // take into account if the document has finished loading
  // like e.g the api to get the stylesheets

  var COMPLETE = "complete";
  var RUNTIME_ID = 0;
  var STATE = 1;
  var DOM_CONTENT_LOADED = 1;
  var LOAD = 2;
  var POLL_INTERVAL = 50;

  this._reset_state_handler = function()
  {
    this._rts = {};
    this._onload_handlers = {};
    this._error_handlers = {};
    this._rts_checked = {};
  };

  this._poll = function(rt_id)
  {
    this._rts_is_checking[rt_id] = true;
    if (this._blocked_rts[rt_id])
      setTimeout(this._poll.bind(this, rt_id), POLL_INTERVAL);
    else
    {
      var tag = this._tagman.set_callback(this, this._handle_ready_state, [rt_id]);
      var script = "return document.readyState";
      this._esde.requestEval(tag, [rt_id, 0, 0, script]);
    }
  };

  this._call_callbacks = function(callbacks)
  {
    while (callbacks && callbacks.length)
    {
      callbacks.shift()()
    }
  };

  this._handle_ready_state = function(status, message, rt_id)
  {
    var SUCCESS = 0;
    var STATUS = 0;
    var VALUE = 2;
    this._rts_is_checking[rt_id] = false;
    if (status == SUCCESS && message[STATUS] == "completed")
    {
      this._rts_checked[rt_id] = true;
      if (message[VALUE] == COMPLETE)
      {
        this._rts[rt_id] = COMPLETE;
        this._call_callbacks(this._onload_handlers[rt_id]);
      }
    }
    else
      this._call_callbacks(this._error_handlers[rt_id]);
  };

  this.register = function(rt_id, callback, error_callback, timeout)
  {
    if (!this._onload_handlers[rt_id])
    {
      this._onload_handlers[rt_id] = [];
      this._error_handlers[rt_id] = [];
      if (!this._rts_checked[rt_id] && !this._rts_is_checking[rt_id])
        this._poll(rt_id);
    }
    var callbacks = this._onload_handlers[rt_id];
    // if the callback already exists, it will be replaced
    for (var i = 0, cb; (cb = callbacks[i]) && cb != callback; i++);
    callbacks[i] = callback;
    if (error_callback)
    {
      callbacks = this._error_handlers[rt_id];
      for (var i = 0, cb; (cb = callbacks[i]) && cb != callback; i++);
      callbacks[i] = error_callback;
    }
    if (timeout)
    {
      var handler = this._timeout_handler.bind(this, rt_id, callback);
      setTimeout(handler, timeout);
    }
  };

  this.register_onload_handler = this.register;

  this._timeout_handler = function(rt_id, callback, error_callback)
  {
    var cbs = this._onload_handlers[rt_id];
    if (cbs)
    {
      var pos = cbs.indexOf(callback);
      if (pos > -1)
        cbs.splice(pos, 1)[0]();
    }
  };

  this.is_loaded = function(rt_id)
  {
    return this._rts[rt_id] == COMPLETE;
  };

  this._on_thread_stopped = function(msg)
  {
    this._blocked_rts[msg.stop_at.runtime_id] = true;
  };

  this._on_thread_continue = function(msg)
  {
    this._blocked_rts[msg.stop_at.runtime_id] = false;
  };

  this._onloadhandler = function(message)
  {
    var rt_id = message[RUNTIME_ID];
    this._rts_checked[rt_id] = true;
    if (message[STATE] == LOAD)
    {
      this._rts[rt_id] = COMPLETE;
      if (this._onload_handlers[rt_id])
        this._call_callbacks(this._onload_handlers[rt_id]);
    }
  };

  this._init = function()
  {
    this._rts = {};
    this._onload_handlers = {};
    this._error_handlers = {};
    this._rts_checked = {};
    this._rts_is_checking = {};
    this._blocked_rts = {};
    this._timeouts = {};
    this._esde = window.services['ecmascript-debugger'];
    this._tagman = window.tag_manager;
    var msgs = window.messages;
    msgs.addListener("thread-stopped-event", this._on_thread_stopped.bind(this));
    msgs.addListener("thread-continue-event", this._on_thread_continue.bind(this));
    msgs.addListener('reset-state', this._reset_state_handler.bind(this));
    this._esde.addListener('readystatechanged', this._onloadhandler.bind(this));
  };

  this._init();
};
