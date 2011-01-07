window.cls || (window.cls = {});

window.cls.ListUnpacker = function()
{

  this.unpack_list_alikes = function(msg, rt_id, error_callback, success_callback)
  {
    const VALUE_LIST = 2, OBJECT_VALUE = 1, OBJECT_ID = 0;
    var value_list = msg[VALUE_LIST];
    var obj_ids = [];
    var call_list = [];
    var arg_list = [];
    for (var i = 0, obj_id, obj_id_str, value; value = value_list[i]; i++)
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
    var tag = this._tagman.set_callback(this, this._handle_list_alikes_list,
                                        [msg, rt_id, obj_ids,
                                         error_callback, success_callback]);
    var script = this._is_list_alike_to_string.replace("%s", call_list.join(','));
    var msg = [rt_id, 0, 0, script, arg_list];
    this._edservice.requestEval(tag, msg);
  }

  // Boolean(document.all) === false
  this._is_list_alike = function(list)
  {
    return list.map(function(item)
    {
      var _class = item === null ? "" : Object.prototype.toString.call(item);
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

  this._handle_list_alikes_list = function(status, msg, orig_msg,
                                           rt_id, obj_ids,
                                           error_callback, success_callback)
  {
    const STATUS = 0, VALUE = 2;
    if (status || msg[STATUS] != "completed")
    {
      error_callback();
    }
    else
    {
      var log = msg[VALUE].split(',').map(Number);
      if (log.filter(Boolean).length)
      {
        var unpack = log.reduce(function(list, entry, index)
        {
          if (entry)
          {
            list.push(obj_ids[index]);
          }
          return list;
        }, []);
        var tag = this._tagman.set_callback(this, this._handle_unpacked_list,
                                            [orig_msg, rt_id, log,
                                             error_callback, success_callback]);
        this._edservice.requestExamineObjects(tag, [rt_id, unpack]);
      }
      else
      {
        error_callback();
      }
    }
  }

  this._handle_unpacked_list = function(status, msg, orig_msg, rt_id, log,
                                        error_callback, success_callback)
  {
    const OBJECT_CHAIN_LIST = 0, VALUE_LIST = 2, DF_INTERN_TYPE = 3;
    if (status || !msg[OBJECT_CHAIN_LIST])
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
                      " ExamineObjects failed in _handle_unpacked_list in ListUnpacker");
      error_callback();
    }
    else
    {
      var object_list =
        (msg[OBJECT_CHAIN_LIST]).map(this._examine_objects_to_value_list, this);
      var orig_value_list = orig_msg[VALUE_LIST];
      orig_msg[VALUE_LIST] = log.reduce(function(list, log_entry, index)
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
      success_callback();
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

  this.init = function()
  {
    this._tagman = window.tagManager;
    this._edservice = window.services["ecmascript-debugger"];
    this._is_list_alike_to_string =
      "(" + this._is_list_alike.toString() + ")([%s])";
  };

  this.init();

};
