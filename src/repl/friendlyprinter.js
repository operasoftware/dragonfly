window.cls || (window.cls = {});

window.cls.FriendlyPrinter = function(callback)
{
  this.init(callback);
};

window.cls.FriendlyPrinter.prototype = new function()
{

  /*
    If you like to add more types to be friendly printed look into
        this._friendly_print_host
    to get the friendly string representation and
        this.templates
    to print it on the client side.
  */

  const VALUE_LIST = 2;
  const OBJECT_VALUE = 1;
  const OBJECT_ID = 0;
  const CLASS_NAME = 4;
  const MAX_ARGS = 60;
  const RE_DOM_OBJECT = cls.InlineExpander.RE_DOM_OBJECT;
  const IS_EXPAND_INLINE_KEY = "expand-objects-inline";
  const FRIENDLY_PRINTED = cls.ReplService.FRIENDLY_PRINTED;

  /*
    - create an object list
    - chunk the list
    - check each object to be friendly printed
    - examine each list chunk
    - examine each object of the list chunk
    - concatenate the chunks
  */

  this.get_friendly_print = function(ctx)
  {
    ctx.is_friendly_printed = true;
    var obj_list = ctx.value_list.reduce(this.value2objlist, []);
    var obj_ids = obj_list.map(this._obj2obj_id_list);
    var queue = [], queue_length = 0;

    // chunk the request, Eval is currently limited to 64 arguments
    // CORE-35198
    while (obj_ids.length > MAX_ARGS * queue_length)
    {
      queue.push(obj_ids.slice(queue_length++ * MAX_ARGS,
                               queue_length * MAX_ARGS));
    }

    var fp_ctx =
    {
      obj_list: obj_list,
      queue: [],
      queue_length: queue_length,
    };

    queue.forEach(function(obj_ids, index)
    {
      var call_list = obj_ids.map(this._obj_id2str).join(',');
      var arg_list = obj_ids.reduce(this._create_arg_list, []);
      var tag = this._tagman.set_callback(this,
                                          this._handle_chunk_list,
                                          [ctx, fp_ctx, index]);
      var script = this._friendly_print_host_str.replace("%s", call_list);
      var msg =
      [
        ctx.rt_id,
        ctx.thread_id || 0,
        ctx.frame_id || 0,
        script,
        arg_list
      ];

      this._service.requestEval(tag, msg);
    }, this);
  };

  this._handle_chunk_list = function(status, message, ctx, fp_ctx, index)
  {
    // This function handles the response of _friendly_print_host.
    // That function returns a list of null or lists with type specific strings
    // to friendly-print an object.
    // Here we make the examine call for the returned list.
    const OBJECT_ID = 0, OBJECT_VALUE = 3;
    if (status || !message[OBJECT_VALUE] || fp_ctx.failed)
    {
      opera.postError('Pretty printing failed: ' + JSON.stringify(message));
      fp_ctx.failed = true;
      this._finalize(ctx, fp_ctx);
    }
    else
    {
      var tag = this._tagman.set_callback(this,
                                          this._handle_examined_chunk_list,
                                          [ctx, fp_ctx, index]);
      var msg = [ctx.rt_id, [message[OBJECT_VALUE][OBJECT_ID]]];
      this._service.requestExamineObjects(tag, msg);
    }
  };

  this._handle_examined_chunk_list = function(status, message, ctx, fp_ctx, index)
  {
    // This function handles the examined list returned by _friendly_print_host.
    // Here we have to examine the objects in the returned list.
    if (status || fp_ctx.failed)
    {
      opera.postError('Pretty printing failed: ' + JSON.stringify(message));
      fp_ctx.failed = true;
      this._finalize(ctx, fp_ctx);
    }
    else
    {
      const
      OBJECT_CHAIN_LIST = 0,
      OBJECT_LIST = 0,
      PROPERTY_LIST = 1,
      OBJECT_ID = 0,
      OBJECT_VALUE = 3,
      NAME = 0;

      var prop_list = message &&
                      (message = message[OBJECT_CHAIN_LIST]) &&
                      (message = message[0]) &&
                      (message = message[OBJECT_LIST]) &&
                      (message = message[0]) &&
                      (message = message[PROPERTY_LIST]) || [];
      fp_ctx.queue[index] =
      {
        is_examined: false,
        prop_list: prop_list.reduce(function(list, prop)
        {
          if (prop[NAME].isdigit())
          {
            list[prop[NAME]] = prop[OBJECT_VALUE] &&
                               prop[OBJECT_VALUE][OBJECT_ID] || null;
          }
          return list;
        }, [])
      };
      var object_id_list = fp_ctx.queue[index].prop_list.filter(Boolean);
      if (object_id_list.length)
      {
        var tag = this._tagman.set_callback(this, this._handle_queue,
                                            [ctx, fp_ctx, index]);
        this._service.requestExamineObjects(tag, [ctx.rt_id, object_id_list]);
      }
      else
      {
        this._handle_queue(0, null, ctx, fp_ctx, index);
      }
    }
  };

  this._handle_queue = function(status, message, ctx, fp_ctx, index)
  {
    // This function handles the examined objects of the examined list
    // returned by _friendly_print_host.
    // The object_id of the examined list gets replaced
    // by the returned property lists for each object.
    // If all chunks are examined, the callback is called.
    if (status || fp_ctx.failed)
    {
      opera.postError('Pretty printing failed: ' + JSON.stringify(message));
      fp_ctx.failed = true;
      this._finalize(ctx, fp_ctx);
    }
    else
    {
      const
      OBJECT_CHAIN_LIST = 0,
      OBJECT_LIST = 0,
      OBJECT_VALUE = 0,
      OBJECT_ID = 0,
      PROPERTY_LIST = 1,
      NAME = 0,
      TYPE = 1,
      VALUE = 2;

      var chuncked_list = fp_ctx.queue[index].prop_list;
      var object_list = message && message[OBJECT_CHAIN_LIST];
      if (object_list)
      {
        object_list.forEach(function(object_chain)
        {
          var object = object_chain[OBJECT_LIST][0];
          var object_id = object[OBJECT_VALUE][OBJECT_ID];
          var index = chuncked_list.indexOf(object_id);
          chuncked_list[index] = object[PROPERTY_LIST].reduce(function(list, prop)
          {
            if (prop[NAME].isdigit())
            {
              list[prop[NAME]] = prop[TYPE] == "number" ?
                                 parseInt(prop[VALUE]) :
                                 prop[VALUE];
            }
            return list;
          }, []);
        });
      }
      fp_ctx.queue[index].is_examined = true;
    }
    for (var i = 0; i < fp_ctx.queue.length && fp_ctx.queue[i].is_examined; i++);
    if (i == fp_ctx.queue_length)
    {
      this._finalize(ctx, fp_ctx, fp_ctx.queue);
    }
  };

  this._finalize = function(ctx, fp_ctx, queue)
  {
    // concatenate the chunks to one list
    var friendly_list = queue && queue.reduce(function(list, friendly_list_chunk)
    {
      return list.extend(friendly_list_chunk.prop_list);
    }, []);

    if (friendly_list)
    {
      fp_ctx.obj_list.forEach(function(value, index)
      {
        value[FRIENDLY_PRINTED] = friendly_list[index];
      });
    }
    this._callback(ctx);
  };

  this._friendly_print_host = function(list)
  {
    const ELEMENT = 1;
    const DATE = 2;
    const FUNCTION = 3;
    const ERROR = 4;
    const REGEXP = 5;

    var ret = list.map(function(item)
    {
      var class_ = item === null ? "" : Object.prototype.toString.call(item);
      if (/Element\]$/.test(class_))
      {
        return (
        [
          ELEMENT,
          0, // expandable inline object (booleans are returned as string)
          item.nodeName.toLowerCase(),
          item.id,
          item.className,
          item.getAttribute('href'),
          item.getAttribute('src')
        ]);
      }
      else if (class_ == "[object Date]")
      {
        return [
          DATE,
          1, // expandable inline object (booleans are returned as string)
          !isNaN(item.getTime())
          ? new Date(item.getTime() - item.getTimezoneOffset() * 1000 * 60).toISOString().replace('Z','')
          : item.toString()
        ];
      }
      else if (class_ == "[object Function]")
      {
        return [
          FUNCTION,
          0, // expandable inline object (booleans are returned as string)
          item.toString()
        ];
      }
      else if (/(Error|Exception)\]$/.test(class_))
      {
        return [
          ERROR,
          1, // expandable inline object (booleans are returned as string)
          "Unhandled " + class_.slice(8, -1) + ": " + item.message
        ];
      }
      else if (class_ == "[object RegExp]")
      {
        return [
          REGEXP,
          1, // expandable inline object (booleans are returned as string)
          item.toString()
        ];
      }
      return null;
    });
    return ret;
  };

  this.templates = function()
  {
    const
    TYPE = 0,
    ELEMENT = 1,
    DATE = 2,
    FUNCTION = 3,
    ERROR = 4,
    REGEXP = 5;

    const
    ELE_NAME = 2,
    ELE_ID = 3,
    ELE_CLASS = 4,
    ELE_HREF = 5,
    ELE_SRC = 6;

    var ele_classes = {};
    ele_classes[ELE_NAME] = 'element-name';
    ele_classes[ELE_ID] = 'element-id';
    ele_classes[ELE_CLASS] = 'element-class';
    ele_classes[ELE_HREF] = 'element-href';
    ele_classes[ELE_SRC] = 'element-src';

    this._print_values = function(index, val)
    {
      switch (index)
      {
      case ELE_NAME:
        return val;

      case ELE_ID:
        return "#" + val;

      case ELE_CLASS:
        return "." + val.trim().replace(/\s+/g, ".");

      case ELE_HREF:
        return " " + val;

      case ELE_SRC:
        return " " + val;

      default:
        return " ";
      }
    };

    this.friendly_print = function(value_list)
    {
      return this._friendly_print[value_list[TYPE]](value_list);
    };

    this._friendly_print = {};

    this._friendly_print[ELEMENT] = function(value_list)
    {
      return value_list.reduce(function(list, prop, index)
      {
        if (index in ele_classes && prop)
        {
          list.push(['span', this._print_values(index, prop), 'class', ele_classes[index]]);
        }
        return list;
      }.bind(this), []);
    }.bind(this);

    this._friendly_print[DATE] = function(value_list)
    {
      const DATE_STRING = 2;
      return ["span", value_list[DATE_STRING], "class", "datetime"];
    };

    this._friendly_print[FUNCTION] = function(value_list)
    {
      const FUNCTION_EXPRESSION = 2;
      return window.templates.highlight_js_source(value_list[FUNCTION_EXPRESSION]).concat('class', 'function-expression');
    };

    this._friendly_print[ERROR] = function(value_list)
    {
      const MESSAGE = 2;
      return ["span", value_list[MESSAGE], "class", "severity-error"];
    };

    this._friendly_print[REGEXP] = function(value_list)
    {
      const REGEXP_STRING = 2;
      return ["span", value_list[REGEXP_STRING], "class", "reg_exp"];
    };
  };

  /* used for inline expandable pretty printed objects */

  this.friendly_string = function(value_list)
  {
    const
    TYPE = 0,
    ELEMENT = 1,
    DATE = 2,
    FUNCTION = 3,
    STRING_VALUE = 2,
    ERROR = 4,
    REGEXP = 5;

    switch (value_list[TYPE])
    {
      case DATE:
      case REGEXP:
        return value_list[STRING_VALUE];
      case ERROR:
        return value_list[STRING_VALUE];
    }
    return "";
  };

  this._obj2obj_id_list = function(obj, index)
  {
    return obj[OBJECT_ID];
  };

  this._obj_id2str = function(object_id)
  {
    return object_id && "$_" + object_id || null;
  };

  this._create_arg_list = function(list, obj_id)
  {
    if (obj_id)
    {
      list.push(["$_" + obj_id, obj_id]);
    }
    return list;
  };

  this._onsettingchange = function(msg)
  {
    if (msg.id == "command_line" && msg.key == IS_EXPAND_INLINE_KEY)
    {
      this._is_inline_expand = settings.command_line.get(IS_EXPAND_INLINE_KEY);
    }
  };

  this.list_has_object = function(list)
  {
    return list && list.some(function(item)
    {
      return item[OBJECT_VALUE] &&
             (!this._is_inline_expand ||
              !RE_DOM_OBJECT.test(item[OBJECT_VALUE][CLASS_NAME]))
    }, this);
  }

  this.value2objlist = function(list, item)
  {
    const OBJECT_VALUE = 1;
    // if 'expand-objects-inline' is enabled,
    // then it doesn't make sense to pretty print DOM objects
    if (item[OBJECT_VALUE] &&
        (!this._is_inline_expand ||
         !RE_DOM_OBJECT.test(item[OBJECT_VALUE][CLASS_NAME])))
    {
      list.push(item[OBJECT_VALUE]);
    }
    return list;
  };

  this.init = function(callback)
  {
    this._callback = callback;
    this._tagman = window.tagManager;
    this._service = window.services['ecmascript-debugger'];
    this.templates.apply(window.templates || (window.templates = {}));
    this._friendly_print_host_str = "(" +
                                    this._friendly_print_host.toString() +
                                    ")([%s])";
    messages.addListener('setting-changed', this._onsettingchange.bind(this));
    this._is_inline_expand = settings.command_line.get(IS_EXPAND_INLINE_KEY);
    this.value2objlist = this.value2objlist.bind(this);
  };

}
