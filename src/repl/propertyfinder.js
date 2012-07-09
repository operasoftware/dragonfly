/**
 * Resolve the properties of an object in a runtime.
 *
 * Singleton. Every instantiation will return the same instance. Contains
 * no state apart from the caching, which should be shared.
 */

window.cls = window.cls || {};
window.cls.PropertyFinder = function(rt_id) {
  if (window.cls.PropertyFinder.instance) {
    return window.cls.PropertyFinder.instance;
  }
  else {
    window.cls.PropertyFinder.instance = this;
  }

  // this cond is here so we can instanciate the class even without running
  // with scope. Means we can run tests on functions that don't require
  // scope.
  if (window.services)
  {
    this._service = window.services['ecmascript-debugger'];
  }

  this._cache = {};

  this._parser = window.simple_js_parser || new window.cls.SimpleJSParser();

  const PUNCTUATOR = cls.SimpleJSParser.PUNCTUATOR;
  const IDENTIFIER = cls.SimpleJSParser.IDENTIFIER;
  const TYPE = 0;
  const VALUE = 1;

  this._get_last_token = function(tokens, token_type, token_value)
  {
    if (tokens)
    {
      for (var i = tokens.length - 1, token; token = tokens[i]; i--)
      {
        if (token[TYPE] == token_type && token[VALUE] == token_value)
        {
          for (var j = 0, index = 0; j <= i; j++)
            index += tokens[j][VALUE].length;
          return index;
        }
      }
    }
    return -1;
  };

  /**
   * Figure out the object to which input belongs.
   * foo.bar -> foo
   * window.bleh.meh -> window.bleh
   * phlebotinum -> this
   * phlebotinum. -> phlebotinum
   * foo(bar.bleh -> bar
   * foo[window -> window
   * foo[bar].a -> foo[bar]
   */
  this._find_input_parts = function(input)
  {
    var tokens = [];
    this._parser.tokenize(input, function(token_type, token)
    {
      tokens.push([token_type, token]);
    });
    var last_bracket = this._get_last_token(tokens, PUNCTUATOR, '[');
    var last_brace = this._get_last_token(tokens, PUNCTUATOR, '(');
    last_brace = this._get_last_token(tokens, PUNCTUATOR, ')') <= last_brace
               ? last_brace
               : -1;
    last_bracket = this._get_last_token(tokens, PUNCTUATOR, ']') <= last_bracket
                 ? last_bracket
                 : -1;
    var pos = Math.max(last_brace,
                       last_bracket,
                       this._get_last_token(tokens, PUNCTUATOR, '='),
                       this._get_last_token(tokens, IDENTIFIER, 'in'));
    if (pos > -1)
      input = input.slice(pos);
    input = input.replace(/^\s+/, '');
    var last_dot = input.lastIndexOf('.');
    var new_path = '';
    var new_id = '';
    var ret = '';
    if(last_dot > -1)
    {
      new_path = input.slice(0, last_dot);
      new_id = input.slice(last_dot + 1).replace(/^\s+/, '');
    }
    else
    {
      new_id = input;
    }
    return {scope: new_path, identifier: new_id, input: input};
  };


  /**
   * Returns a list of properties that match the input string in the given
   * runtime.
   *
   */
  this.find_props = function(callback, input, frameinfo, context)
  {
    var rt_id = runtimes.getSelectedRuntimeId();
    var rt = runtimes.getRuntime(rt_id);
    if (rt)
    {
      frameinfo = frameinfo ||
      {
        runtime_id: rt_id,
        thread_id: 0,
        scope_id: rt.object_id,
        index: 0,
        scope_list: []
      };

      frameinfo.stopped = Boolean(frameinfo.thread_id);
      var parts = this._find_input_parts(input);
      var props = this._cache_get(parts.scope, frameinfo);


      if (props)
      {
        props.input = input;
        props.identifier = parts.identifier;
        callback(props);
      }
      else
      {
        if (parts.scope)
        {
          this._get_subject_id(callback, parts.scope, frameinfo, parts, context);
        }
        else
        {
          var scopes = [frameinfo.scope_id].extend(frameinfo.scope_list || []);
          this._get_object_props(callback, frameinfo, scopes, parts);
        }
      }
    }
  };

  /**
   * Tell the caching mechanism that it need no longer keep track of data
   * about a particular runtime. Can be hooked up to messages about closed
   * tabs/runtimes
   */
  this.clear_cache = function(rt_id) {
    this._cache = {};
  };

  this._cache_key = function(scope, frameinfo) {
    return "" + scope + "." + frameinfo.runtime_id + "." + frameinfo.thread_id + "." + frameinfo.index;
  };

  this._cache_put = function(result)
  {
    var key = this._cache_key(result.scope, result.frameinfo);
    this._cache[key] = result;
  };

  this._cache_get = function(scope, frameinfo) {
    var key = this._cache_key(scope, frameinfo);
    return this._cache[key];
  };

  this._get_subject_id = function(callback, scope, frameinfo, parts, context)
  {
    var js = "" + scope;

    var varlist = [];
    if (context)
    {
      for (var key in context)
      {
        varlist.push([key, context[key]]);
      }
    }

    var tag = tagManager.set_callback(this, this._got_subject_id,
                                      [callback, frameinfo, parts]);
    this._service.requestEval(
      tag, [frameinfo.runtime_id, frameinfo.thread_id, frameinfo.index, js, varlist]
    );
  }

  this._got_subject_id = function(status, msg, callback, frameinfo, parts)
  {
    const EVALRESULT = 0; OBJVALUE = 3, OBJID = 0;
    var objid = null;
    if (msg && msg[EVALRESULT] == "completed" && msg[OBJVALUE])
    {
      objid = msg[OBJVALUE][OBJID];
      this._get_object_props(callback, frameinfo, [objid], parts)
    }
    else
    {
      var ret = {
        props: [],
        scope: parts.scope,
        input: parts.input,
        identifier: parts.identifier,
      };
      callback(ret);
    }
  }

  this._get_object_props = function(callback, frameinfo, objids, parts)
  {
    var tag = tagManager.set_callback(this, this._got_object_props, [callback, parts]);
    this._service.requestExamineObjects(tag, [frameinfo.runtime_id, objids, 1, 0]);
  }

  this._got_object_props = function(status, msg, callback, parts)
  {
    if (status)
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      'ExamineObjects failed in _got_object_props in PropertyFinder');
    }
    else
    {
      var ret = {
        props: this._parse_prop_list(msg) || [],
        scope: parts.scope,
        input: parts.input,
        identifier: parts.identifier,
      };

      if (! ret.props.contains("this"))
      {
          ret.props.push("this");
      }

      // fixme: is "arguments" in the props when stopped?
      //this._cache_put(ret);
      callback(ret);
    }
  }

  this._parse_prop_list = function(msg)
  {
    var names = [];
    const OBJECT_CHAIN_LIST = 0, OBJECT_LIST = 0, PROPERTY_LIST = 1, NAME = 0;

    (msg[OBJECT_CHAIN_LIST] || []).forEach(function(chain){
      var objectlist = chain[OBJECT_LIST] || [];
      objectlist.forEach(function(obj) {
        names.extend((obj[PROPERTY_LIST] || []).map(function(prop) {
          return prop[NAME];
        }));
      });
    });

    return names.unique();
  }

  this.toString = function() {
    return "[PropertyFinder singleton instance]";
  };
};

cls.PropertyFinder.prop_sorter = function(a, b)
{
  a = a.toLowerCase();
  b = b.toLowerCase();

  if (a.isdigit() && b.isdigit())
  {
    return parseInt(a, 10) - parseInt(b, 10);
  }
  else if (a>b)
  {
    return 1;
  }
  else if (a<b)
  {
    return -1;
  }
  return 0;
};
