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

  const
  COMPLETE = 'complete',
  RUNTIME_ID = 0,
  STATE = 1,
  DOM_CONTENT_LOADED = 1,
  LOAD = 2;

  var
  __rts = {},
  __onload_handlers = {},
  __rts_checked = {},
  poll_interval = 50;

  var reset_state_handler = function()
  {
    __rts = {};
    __onload_handlers = {};
    __rts_checked = {};
  }

  var poll = function(rt_id)
  {
    if( blocked_rts[rt_id] )
    {
      setTimeout(poll, poll_interval, rt_id);
    }
    else
    {
      var tag = tagManager.set_callback(null, handleReadyState, [rt_id]);
      var script = "return document.readyState";
      services['ecmascript-debugger'].requestEval(tag, [rt_id, 0, 0, script]);
    }
  }

  var call_callbacks = function(rt_id)
  {
    var onload_handlers = __onload_handlers[rt_id];
    if (onload_handlers)
    {
      for (var i = 0, cb; cb = onload_handlers[i]; i++)
      {
        cb();
      }
    }
    __onload_handlers[rt_id] = null;
  }

  var handleReadyState = function(status, message, rt_id)
  {
    const STATUS = 0, VALUE = 2;
    if (message[STATUS] == 'completed')
    {
      __rts_checked[rt_id] = true;
      if (message[VALUE] == COMPLETE)
      {
        __rts[rt_id] = COMPLETE;
        call_callbacks(rt_id);
      }
    }
    else
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
        'getting readyState has failed in runtime_onload_handler handleReadyState');
    }
  }

  var register = function(rt_id, callback)
  {
    if (!__onload_handlers[rt_id])
    {
      __onload_handlers[rt_id] = [];
      if (!__rts_checked[rt_id])
        poll(rt_id);
    }
    var onload_handlers = __onload_handlers[rt_id];
    // if the callback already exists, it will be replaced
    var i = 0;
    for (var cb; (cb = onload_handlers[i]) && cb != callback; i++) {};
    onload_handlers[i] = callback;
  }

  this.is_loaded = function(rt_id)
  {
    return __rts[rt_id] == COMPLETE;
  };

  this.register_onload_handler = function(rt_id, callback)
  {
    register(rt_id, callback);
  }

  var blocked_rts = {};

  var onThreadStopped = function(msg)
  {
    blocked_rts[msg.stop_at.runtime_id] = true;
  }

  var onThreadContinue = function(msg)
  {
    blocked_rts[msg.stop_at.runtime_id] = false;
  }

  this._onloadhandler = function(message)
  {
    var rt_id = message[RUNTIME_ID];
    __rts_checked[rt_id] = true;
    if (message[STATE] == LOAD)
    {
      __rts[rt_id] = COMPLETE;
      if (__onload_handlers[rt_id])
        call_callbacks(rt_id);
    }
  }

  messages.addListener("thread-stopped-event", onThreadStopped);
  messages.addListener("thread-continue-event", onThreadContinue);
  messages.addListener('reset-state', reset_state_handler);
  window.services['ecmascript-debugger'].addListener('readystatechanged', this._onloadhandler.bind(this));

}
