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

  this._service = ""; // fixme get service or raise
  this._property_cache = {};


  /**
   * Method that does The Right Thing with regards to what method is
   * available for requesting an eval() in a connected Opera instance.
   *
   * Subclasses that adds support for never ecma service versions can
   * override this method
   *
   */
  this._requestEval = function(callback, js, input, rt_id, thread_id, frame_id) {
    var tag = tagManager.set_callback(this, this._onRequestEval,
                                      [callback, input, rt_id, thread_id, frame_id]);

    services['ecmascript-debugger'].requestEval(
      tag, [rt_id, thread_id, frame_id, js]
    );
  };

  this._onRequestEval = function(status, message, callback, input, rt_id, thread_id, frame_id) {
    var ret = {
      props: [],
      input: input,
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

    // fixme : add caching.
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
    frame_id = frame_id ||0;

    var props = this._cache_get(input, rt_id, thread_id, frame_id);
    if (props) {
      callback(props);
    }
    else {
      this._get_scope_contents(callback, input, rt_id, thread_id, frame_id);
    }

  };


  /**
   * Tell the caching mechanism that it need no longer keep track of data
   * about a particular runtime. Can be hooked up to messages about closed
   * tabs/runtimes
   */
  this.forget_runtime = function(rt_id) {

  };

  this._cache_key = function(input, rt_id, thread_id, frame_id) {
    var key = "" + input + "." + rt_id + "." + thread_id + "." + frame_id;
  };

  this._cache_put = function(input, matches, rt_id, frame_id, values) {
    var key = this._cache_key(input, matches, rt_id, frame_id);
  };

  this._cache_get = function(input, rt_id, thread_id, frame_id) {
    return null;
  };

  this._get_scope_contents = function(callback, input, rt_id, thread_id, frame_id) {
    var script = "(function(){var a = '', b= ''; for( a in %s ){ b += a + '_,_'; }; return b;})()";
    var eval_str = script.replace("%s", input);

    if (frame_id !== undefined) {
      this._requestEval(callback, eval_str, input, rt_id, thread_id, frame_id);
    }
  };

  this.toString = function() {
    return "[PropertyFinder singleton instance]";
  };

};
