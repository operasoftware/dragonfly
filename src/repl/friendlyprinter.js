window.cls || (window.cls = {});

window.cls.FriendlyPrinter = function()
{
  const
  VALUE_LIST = 2,
  OBJECT_VALUE = 1,
  OBJECT_ID = 0,
  MAX_ARGS = 60;

  this._friendly_print = function(obj_list, rt_id, thread_id, frame_id, fallback)
  {
    var obj_ids = obj_list.map(this._obj2obj_id_list);
    var queue_cb = this._friendly_print_chunked_cb.bind(this, obj_list, rt_id,
                                                        obj_ids, fallback);
    var queue = [], queue_length = 0, processed_queue = [];
    // chunk the request, Eval is currently limited to 64 arguments
    // CORE-35198
    while (obj_ids.length > MAX_ARGS * queue_length)
    {
      queue.push(obj_ids.slice(queue_length++ * MAX_ARGS,
                               queue_length * MAX_ARGS));
    }
    queue.forEach(function(obj_ids, index)
    {
      var call_list = obj_ids.map(this._obj_id2str).join(',');
      var arg_list = obj_ids.reduce(this._create_arg_list, []);
      var tag = this._tagman.set_callback(this,
                                          this._handle_queue,
                                          [
                                            processed_queue,
                                            index,
                                            queue_length,
                                            queue_cb
                                          ]);
      var script = this._friendly_print_host_str.replace("%s", call_list);
      var msg = [rt_id, thread_id, frame_id, script, arg_list];
      this._service.requestEval(tag, msg);
    }, this);
  };

  this._friendly_print_chunked_cb = function(obj_list, rt_id, obj_ids,
                                             fallback, queue)
  {
    const
    STATUS = 0,
    MESSAGE = 1,
    VALUE = 2,
    VALUE_LIST = 2,
    DF_INTERN_TYPE = 3,
    FRIENDLY_PRINTED = 6,
    OBJECT_VALUE = 1;

    var ret = queue.reduce(function(list, response)
    {
      var status = response[STATUS], msg = response[MESSAGE];
      if (status || msg[STATUS] != "completed")
      {
        opera.postError('Pretty printing failed: ' + JSON.stringify(msg));
        return null;
      }
      if(list)
      {
        list.extend(JSON.parse(msg[VALUE]));
      }
      return list;
    }, []);

    if (ret)
    {
      obj_list.forEach(function(value, index)
      {
        value[FRIENDLY_PRINTED] = ret[index];
      });
    }
    fallback();
  };

  this._handle_queue = function(status, message, queue, index, queue_length, cb)
  {
    queue[index] = [status, message];
    if (queue.filter(Boolean).length == queue_length)
    {
      cb(queue);
    }
  };

  this._friendly_print_host = function(list)
  {
    const ELEMENT = 1;
    const DATE = 2;
    var ret = list.map(function(item)
    {
      var class_ = item === null ? "" : Object.prototype.toString.call(item);
      if (/Element\]$/.test(class_))
      {
        return (
        [
          ELEMENT,
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
          item.toISOString()
        ];
      }
      return null;
    });
    return JSON.stringify(ret);
  };

  this.templates = function()
  {
    const
    ELE_NAME = 1,
    ELE_ID = 2,
    ELE_CLASS = 3,
    ELE_HREF = 4,
    ELE_SRC = 5;

    var classes = {};
    classes[ELE_NAME] = 'element-name';
    classes[ELE_ID] = 'element-id';
    classes[ELE_CLASS] = 'element-class';
    classes[ELE_HREF] = 'element-href';
    classes[ELE_SRC] = 'element-src';

    var print_val = {};
    print_val[ELE_NAME] = function(val) {return val;};
    print_val[ELE_ID] = function(val) {return '#' + val;};
    print_val[ELE_CLASS] = function(val)
    {
      return (' ' + val).replace(/\s+/g, '.');
    };
    print_val[ELE_HREF] = function(val) {return ' ' + val;};
    print_val[ELE_SRC] = function(val) {return ' ' + val;};

    this._friendly_print_element = function(value_list)
    {
      return value_list.reduce(function(list, prop, index)
      {
        if (index in classes && prop)
        {
          list.push(['span', print_val[index](prop), 'class', classes[index]]);
        }
        return list
      }, []);
    };

    this._friendly_print_date = function(value_list)
    {
      const DATE_STRING = 1;
      return ["span", value_list[DATE_STRING], "class", "datetime"];
    };

    this.friendly_print = function(value_list)
    {
      const
      TYPE = 0,
      ELEMENT = 1,
      DATE = 2;

      var ret = [];
      switch (value_list[TYPE])
      {
        case ELEMENT:
          return this._friendly_print_element(value_list);

        case DATE:
          return this._friendly_print_date(value_list);
      }
    };

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

  this.value2objlist = function(list, item)
  {
    const OBJECT_VALUE = 1;
    if (item[OBJECT_VALUE])
    {
      list.push(item[OBJECT_VALUE]);
    }
    return list;
  };

  this.init = function()
  {
    this._tagman = window.tagManager;
    this._service = window.services['ecmascript-debugger'];
    this.templates.apply(window.templates || (window.tempoates = {}));
    this._friendly_print_host_str = "(" +
                                    this._friendly_print_host.toString() +
                                    ")([%s])";
  };

  this.init();

}
