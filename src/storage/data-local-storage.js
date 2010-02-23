var cls = window.cls || ( window.cls = {} );

cls.LocalStorageData = function()
{
  this.get_local_storages = function()
  {
    return this._rts;
  }

  this.get_item = function(rt_id, key)
  {
    var 
    storage = this._rts[rt_id] &&  this._rts[rt_id].storage,
    item = null, 
    i = 0;

    for( ; (item = storage[i]) && ( item.key != key); i++);
    return item;
  } 

  this.set_item = function(rt_id, key, value)
  {
    var item = this.get_item(rt_id, key);
    if(item)
    {
      item.value = value;
    }
    else if(this._rts[rt_id])
    {
      this._rts[rt_id].storage.push(
        item = 
        {
          key: key,
          value: value,
          type: 'string'
        }
      );
    }
    var script = "local_storage.set_item(\"" + item.key + "\",\"" + value + "\",\"" + item.type + "\")";
    var tag = tagManager.set_callback(this, this._handle_default,
      ["failed set_item in LocalStorageData"]);
    services['ecmascript-debugger'].requestEval(tag, 
      [this._rts[rt_id].rt_id, 0, 0, script, 
        [["local_storage", this._rts[rt_id].host_storage]]]);
    return item;
  }

  this.remove_item = function(rt_id, key)
  {
    var item = this.get_item(rt_id, key);
    if(item)
    {
      var script = "local_storage.remove_item(\"" + item.key + "\")";
      var tag = tagManager.set_callback(this, this._handle_default,
        ["failed remove_item in LocalStorageData"]);
      services['ecmascript-debugger'].requestEval(tag, 
        [this._rts[rt_id].rt_id, 0, 0, script, 
          [["local_storage", this._rts[rt_id].host_storage]]]);
    }
  }

  this.clear = function(rt_id)
  {
    var stoarge = this._rts[rt_id];
    if(stoarge)
    {
      var script = "local_storage.clear()";
      var tag = tagManager.set_callback(this, this._handle_clear, [this._rts[rt_id].rt_id]);
      services['ecmascript-debugger'].requestEval(tag, 
        [this._rts[rt_id].rt_id, 0, 0, script, 
          [["local_storage", this._rts[rt_id].host_storage]]]);
    }
  }

  this.set_item_edit = function(rt_id, key, is_edit)
  {
    var item = this.get_item(rt_id, key);
    if(item)
    {
      item.is_edit = is_edit;
    }
  }

  this._get_item_with_key = function(rt_id, key)
  {


  }

  this._handle_clear = function(status, message, rt_id)
  {
    this._get_key_value_pairs(rt_id);
  }

  this._handle_default = function(status, message, info)
  {
    const STATUS = 0;
    if (message[STATUS] != 'completed')
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + info);
    }
  }

  this._rts = {};

  this._on_active_tab = function(msg)
  {
    var i = 0, rt_id = 0, active_tab = msg.activeTab;
    for( ; i < active_tab; i++)
    {
      if (!this._rts[active_tab[i]])
      {
        this._rts[active_tab[i]] = {};
        this._setup_local_storage(active_tab[i]);
      }
    }
    for(i in this._rts)
    {
      if (active_tab.indexOf(parseInt(i)) == -1)
      {
        this._rts[i] = null;
      }
    }
    window.messages.post('local-storage-update', {data: this._rts});
  }

  this._setup_local_storage = function(rt_id)
  {
    var script = this["return new _LocalStorageHostr()"];
    var tag = tagManager.set_callback(this, this._register_loacal_storage, [rt_id]);
    services['ecmascript-debugger'].requestEval(tag, [rt_id, 0, 0, script]);
  }

  this._register_loacal_storage = function(staus, message, rt_id)
  {
    const 
    STATUS = 0,
    VALUE = 2,
    OBJECT_VALUE = 3,
    // sub message ObjectValue 
    OBJECT_ID = 0;

    if (message[STATUS] == 'completed')
    {
      this._rts[rt_id].host_storage = message[OBJECT_VALUE][OBJECT_ID];
      this._rts[rt_id].rt_id = rt_id;
      this._get_key_value_pairs(rt_id);

    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        "failed register_loacal_storage in LocalStorageData");
    }
  }

  this._get_key_value_pairs = function(rt_id)
  {
    var script = "local_storage.get_key_value_pairs()";
    var tag = tagManager.set_callback(this, this._handle_get_key_value_pairs, [rt_id]);
    services['ecmascript-debugger'].requestEval(tag, 
      [rt_id, 0, 0, script, [["local_storage", this._rts[rt_id].host_storage]]]);
  }

  this._handle_get_key_value_pairs = function(status, message, rt_id)
  {
    const 
    STATUS = 0,
    VALUE = 2,
    OBJECT_VALUE = 3,
    // sub message ObjectValue 
    OBJECT_ID = 0;

    if (message[STATUS] == 'completed')
    {
      var return_arr = message[OBJECT_VALUE][OBJECT_ID];
      var tag = tagManager.set_callback(this, this._finalize_get_key_value_pairs, [rt_id]);
      services['ecmascript-debugger'].requestExamineObjects(tag, [rt_id, [return_arr]]);

    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        "failed handle_get_key_value_pairs in LocalStorageData");
    }
  }

  this._is_digit = (function()
  {
    var is_digit = /^\d+$/;
    return function(i)
    {
      return is_digit.test(i[0]);
    }
  })();

  this._sort_keys = function(a, b)
  {
    return a.key > b.key && 1 || a.key < b.key && -1 || 0; 
  }

  this._finalize_get_key_value_pairs = function(status, message, rt_id)
  {
    const
    OBJECT_LIST = 0,
    // sub message ObjectInfo 
    PROPERTY_LIST = 1,
    // sub message Property 
    PROPERTY_NAME = 0,
    PROPERTY_VALUE = 2;

    var 
    prop_list = {}, 
    prop = null, 
    i = 0, 
    storage = [];

    if (status === 0 && message[OBJECT_LIST])
    {
      if(message[OBJECT_LIST][0] && (prop_list = message[OBJECT_LIST][0][PROPERTY_LIST]))
      {
        prop_list = prop_list.filter(this._is_digit);
        for( ; i < prop_list.length; i += 3)
        {
          storage.push(
          {
            key: prop_list[i][PROPERTY_VALUE],
            value: prop_list[i + 1][PROPERTY_VALUE],
            type: prop_list[i + 2][PROPERTY_VALUE]
          });
        }
      }
      this._rts[rt_id].storage = storage.sort(this._sort_keys);
      this.post('local-storage-update', {data: this._rts});
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        "failed finalize_get_key_value_pairs in LocalStorageData");
    }
  }

  this._LocalStorageHost = function()
  {
    this.get_key_value_pairs = function()
    {
      var 
      length = window.localStorage.length,
      ret = [],
      key = '',
      value = null,
      type = '',
      i = 0;

      for ( ; i < length; i++)
      {
        key = window.localStorage.key(i);
        value = window.localStorage.getItem(key);
        type = typeof value;
        if (value && type !== 'string')
        {
          value = JSON.stringify(value);
        }
        ret.push(key)
        ret.push(value);
        ret.push(type);
      }
      return ret;
    };
    this.set_item = function(key, value, type)
    {
      if (type == 'object')
      {
        value = JSON.parse(value);
      };
      window.localStorage.setItem(key, value);
    };
    this.remove_item = function(key)
    {
      window.localStorage.removeItem(key);
    };
    this.clear = function()
    {
      window.localStorage.clear();
    };
  };

  this["return new _LocalStorageHostr()"] = "return new " + this._LocalStorageHost.toString() + "()";

  this.init = function()
  {
    window.cls.Messages.apply(this);
    window.messages.addListener('active-tab', this._on_active_tab.bind(this));
  }

  this.init();
}

Function.prototype.bind = function(object)
{
  var method = this;
  return function()
  {
    method.apply(object, arguments);
  }
}