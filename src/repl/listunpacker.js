window.cls || (window.cls = {});

window.cls.ListUnpacker = function(callback)
{

  const DF_INTERN_TYPE = cls.ReplService.DF_INTERN_TYPE;

  this.unpack_list_alikes = function(ctx) //value_list, rt_id, error_callback, success_callback)
  {
    ctx.is_unpacked = true;
    const OBJECT_VALUE = 1, OBJECT_ID = 0;
    var obj_ids = [];
    var call_list = [];
    var arg_list = [];
    for (var i = 0, obj_id, obj_id_str, value; value = ctx.value_list[i]; i++)
    {
      obj_id = value[OBJECT_VALUE] && value[OBJECT_VALUE][OBJECT_ID] || 0;
      obj_id_str = obj_id && "$_" + obj_id || "null";
      obj_ids.push(obj_id);
      call_list.push(obj_id_str);
      if (obj_id)
      {
        arg_list.push([obj_id_str, obj_id]);
      }
    };
    if (arg_list.length)
    {
      var tag = this._tagman.set_callback(this, this._handle_list_alikes_list,
                                          [ctx, obj_ids]);
      var script = this._is_list_alike_to_string.replace("%s", call_list.join(','));
      var msg = [ctx.rt_id, 0, 0, script, arg_list];
      this._edservice.requestEval(tag, msg);
    }
    else
    {
      this._callback(ctx);
    }
  }

  // Boolean(document.all) === false
  this._is_list_alike = function(list)
  {
    return list.map(function(item)
    {
      var _class = item === null ? "" : Object.prototype.toString.call(item);
      if (_class == "[object XPathResult]")
      {
        return 3;
      }
      if (/(?:Array|Collection|List|Map)\]$/.test(_class))
      {
        return 2;
      }
      if (_class == "[object Object]" && typeof item.length == "number")
      {
        return 1;
      }
      return 0;
    }).join(',');
  };

  this._xpathresult2array = function(result)
  {
    for (var i = 0, ret = []; i < result.snapshotLength; i++)
    {
      ret.push(result.snapshotItem(i));
    }
    return ret;
  };

  this._handle_list_alikes_list = function(status, msg, ctx, obj_ids)
  {
    const STATUS = 0, VALUE = 2;
    const XPATH_RESULT = 3;
    if (status || msg[STATUS] != "completed")
    {
      this._callback(ctx);
    }
    else
    {
      var log = msg[VALUE].split(',').map(Number);
      if (log.filter(Boolean).length)
      {
        var xpathresults = {};
        var has_xpathresult = false;
        for (var i = 0, tag, msg; i < log.length; i++)
        {
          if (log[i] == XPATH_RESULT)
          {
            has_xpathresult = true;
            xpathresults[i] = false;
            tag = this._tagman.set_callback(this, this._handle_xpathresult,
                                            [ctx, obj_ids, log, i, xpathresults]);
            msg = [ctx.rt_id, 0, 0,
                   this._xpathresult2array_to_string,
                   [["xpathresult", obj_ids[i]]]];
            this._edservice.requestEval(tag, msg);
          }
        }
        if (!has_xpathresult)
        {
          this._examine_list_alikes(ctx, obj_ids, log);
        }
      }
      else
      {
        this._callback(ctx);
      }
    }
  }

  this._handle_xpathresult = function(status, msg,
                                      ctx, obj_ids, log, index, xpathresults)
  {
    const STATUS = 0, OBJECT_VALUE = 3, OBJECT_ID = 0;
    if (status || msg[STATUS] != "completed" || !msg[OBJECT_VALUE])
    {
      this._callback(ctx);
    }
    else
    {
      obj_ids[index] = msg[OBJECT_VALUE][OBJECT_ID];
      xpathresults[index] = true;
      var all_returned_check = true;
      for (index in xpathresults)
      {
        all_returned_check = all_returned_check && xpathresults[index];
      }
      if (all_returned_check)
      {
        this._examine_list_alikes(ctx, obj_ids, log);
      }
    }
  }

  this._examine_list_alikes = function(ctx, obj_ids, log)
  {
    var unpack = log.reduce(function(list, entry, index)
    {
      if (entry)
      {
        list.push(obj_ids[index]);
      }
      return list;
    }, []);
    var tag = this._tagman.set_callback(this,
                                        this._handle_unpacked_list,
                                        [ctx, log]);
    this._edservice.requestExamineObjects(tag, [ctx.rt_id, unpack]);

  }

  this._handle_unpacked_list = function(status, msg, ctx, log)
  {
    const OBJECT_CHAIN_LIST = 0, VALUE_LIST = 2;
    if (status || !msg[OBJECT_CHAIN_LIST])
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      " ExamineObjects failed in _handle_unpacked_list in ListUnpacker");
      this._callback(ctx);
    }
    else
    {
      var object_list =
        (msg[OBJECT_CHAIN_LIST]).map(this._examine_objects_to_value_list, this);
      var orig_value_list = ctx.value_list;
      ctx.value_list = log.reduce(function(list, log_entry, index)
      {
        if (log_entry)
        {
          var unpack_header = orig_value_list[index];
          unpack_header[DF_INTERN_TYPE] = "unpack-header";
          list.push(unpack_header);
          list.push.apply(list, object_list.shift());
          list.push(["", null, 0, "unpack-footer"]);
        }
        else
        {
          list.push(orig_value_list[index]);
        }
        return list;
      }, []);
      this._callback(ctx);
    }

  }

  this._examine_objects_to_value_list = function(object_chain)
  {
    const
    // message ExamineObjects
    OBJECT_LIST = 0,
    // sub message ObjectInfo
    VALUE = 0, PROPERTY_LIST = 1,
    // sub message ObjectValue
    CLASS_NAME = 4,
    // sub message Property
    NAME = 0, PROPERTY_TYPE = 1, PROPERTY_VALUE = 2, OBJECT_VALUE = 3;

    var value_list = [];
    var object = object_chain[OBJECT_LIST] && object_chain[OBJECT_LIST][0];
    if (object && object[PROPERTY_LIST])
    {
      value_list = (object[PROPERTY_LIST]).reduce(function(list, prop)
      {
        if (prop[NAME].isdigit())
        {
          if (prop[PROPERTY_TYPE] == 'object')
          {
            list.push([null, prop[OBJECT_VALUE], parseInt(prop[NAME])]);
          }
          else
          {
            if (prop[PROPERTY_TYPE] == "string")
            {
              prop[PROPERTY_VALUE] = "\"" + prop[PROPERTY_VALUE] + "\"";
            }
            list.push([prop[PROPERTY_VALUE] || prop[PROPERTY_TYPE],
                      null, parseInt(prop[NAME])]);
          }
        }
        return list;
      }, []);
      value_list.sort(function(a, b)
      {
        return a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : 0;
      });
    }
    return value_list;
  };

  this.init = function(callback)
  {
    this._callback = callback;
    this._tagman = window.tagManager;
    this._edservice = window.services["ecmascript-debugger"];
    this._is_list_alike_to_string =
      "(" + this._is_list_alike.toString() + ")([%s])";
    this._xpathresult2array_to_string =
      "(" + this._xpathresult2array.toString() + ")(xpathresult)";
  };

  this.init(callback);

};
