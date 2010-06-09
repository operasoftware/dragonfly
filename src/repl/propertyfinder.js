/**
 * Resolve the properties of an object in a runtime.
 *
 * Singleton. Every instanciation will return the same instance. Contains
 * no state apart from the caching, which should be shared.
 */
function PropertyFinder(rt_id) {
  if (window.PropertyFinder.instance) {
    return window.PropertyFinder.instance;
  }
  else {
    window.PropertyFinder.instance = this;
  }

  this._service = services['ecmascript-debugger'];
  this._cache = {};

  /**
   * Method that does The Right Thing with regards to what method is
   * available for requesting an eval() in a connected Opera instance.
   *
   * Subclasses that adds support for never ecma service versions can
   * override this method
   *
   */
  this._requestEval = function(callback, js, scope, input, rt_id, thread_id, frame_id) {
    var tag = tagManager.set_callback(this, this._onRequestEval,
                                      [callback, scope, input, rt_id, thread_id, frame_id]);

    this._service.requestEval(
      tag, [rt_id, thread_id, frame_id, js]
    );
  };

  /**
   * Figure out the object to which input belongs.
   * foo.bar -> foo
   * window.bleh.meh -> window.bleh
   * phlebotinum -> this
   * phlebotinum. -> phlebotinum
   */
  this._find_input_scope = function(input)
  {
    var scope = "";
    var index = input.lastIndexOf(".");

    if (index > 0) {
      scope = input.substring(0, index);
    }

    return scope;
  };

  this._onRequestEval = function(status, message, callback, scope, input, rt_id, thread_id, frame_id) {
    var ret = {
      props: [],
      scope: scope,
      rt_id: rt_id,
      thread_id: thread_id,
      frame_id: frame_id
    };

    if (status == 0) {
      const STATUS = 0, TYPE = 1, VALUE = 2, OBJECT_VALUE = 3;
      if(message[STATUS] == 'completed')
      {
        if(message[VALUE])
        {
          ret.props = message[VALUE].split('_,_');
        }
      }
    }

    this._cache_put(ret);

    ret.input = input;
    callback(ret);
  };

  /**
   * Returns a list of properties that match the input string in the given
   * runtime.
   *
   */
  this.find_props = function(callback, input, rt_id, thread_id, frame_id) {
    thread_id = thread_id || 0;
    rt_id = rt_id || runtimes.getSelectedRuntimeId();
    frame_id = frame_id || 0;
    var scope = this._find_input_scope(input);

    var props = this._cache_get(scope, rt_id, thread_id, frame_id);
    if (props) {
      props.input = input;
      callback(props);
    }
    else {
      this._get_scope_contents(callback, scope, input, rt_id, thread_id, frame_id);
    }
  };

  /**
   * Tell the caching mechanism that it need no longer keep track of data
   * about a particular runtime. Can be hooked up to messages about closed
   * tabs/runtimes
   */
  this.forget_runtime = function(rt_id) {
    // fixme
  };

  this._cache_key = function(scope, rt_id, thread_id, frame_id) {
    var key = "" + scope + "." + rt_id + "." + thread_id + "." + frame_id;
  };

  this._cache_put = function(result)
  {
    var key = this._cache_key(result.scope, result.rt_id, result.thread_id, result.frame_id);
    this._cache[key] = result;
  };

  this._cache_get = function(scope, rt_id, thread_id, frame_id) {
    var key = this._cache_key(scope, rt_id, thread_id, frame_id);
    return this._cache[key];
  };

  this._get_scope_contents = function(callback, scope, input, rt_id, thread_id, frame_id) {
    var script = "(function(){var a = '', b= ''; for( a in %s ){ b += a + '_,_'; }; return b;})()";
    var eval_str = script.replace("%s", scope||"this");

    if (frame_id !== undefined) {
      this._requestEval(callback, eval_str, scope, input, rt_id, thread_id, frame_id);
    }
  };

  this.toString = function() {
    return "[PropertyFinder singleton instance]";
  };
};
