/**
 * @fileoverview
  runtime_onload_handler is a workaround because some apis do not 
  take into account if the document has finished loading
  like e.g the api to get the stylesheets.
  */

/**
  * @constructor 
  */

var runtime_onload_handler = new function()
{
  // this is a workaround because some apis do not 
  // take into account if the document has finished loading
  // like e.g the api to get the stylesheets

  const
  COMPLETE = 'complete';

  var 
  __rts = {},
  __onload_handlers = {},
  poll_interval = 50;

  var reset_state_handler = function()
  {
    __rts = {};
    __onload_handlers = {};
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

  var handleReadyState = function(status, message, rt_id)
  {
    const STATUS = 0, VALUE = 2;
    if( message[STATUS] == 'completed' )
    {
      if( message[VALUE] == COMPLETE)
      {
        __rts[rt_id] = COMPLETE;
        var onload_handlers = __onload_handlers[rt_id],  cur = null, i = 0;
        for( ; cur = onload_handlers[i]; i++)
        {
          // the call back must be hardcoded, without any this refernce
          cur.callee.apply(null, cur);
        }
        delete __onload_handlers[rt_id];
      }
      else
      {
        setTimeout(poll, poll_interval, rt_id);
      }
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
        'getting readyState has failed in runtime_onload_handler handleReadyState');
    }
  }

  var register = function(rt_id, org_args)
  {
    if( !__onload_handlers[rt_id] )
    {
      __onload_handlers[rt_id] = [];
      poll(rt_id);
    }
    var onload_handlers = __onload_handlers[rt_id],  cur = null, i = 0;
    // if there the callback already exists, it will be replaced
    for( ; ( cur = onload_handlers[i] ) && cur.callee != org_args.callee ; i++);
    onload_handlers[i] = org_args;

  }

  this.check = function(rt_id, org_args)
  {
    // org_args is an arguments object
    // org_args.callee is the callback
    if( __rts[rt_id] == COMPLETE )
    {
      return true;
    }
    else
    {
      register(rt_id, org_args);
      return false;
    }
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

  messages.addListener("thread-stopped-event", onThreadStopped);
  messages.addListener("thread-continue-event", onThreadContinue);
  messages.addListener('reset-state', reset_state_handler);

}