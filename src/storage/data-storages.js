window.cls || (window.cls = {});

cls.StorageDataBase = new function()
{
  /* interface */
  this.get_storages = function(){};
  this.get_item = function(rt_id, key){};
  this.set_item = function(rt_id, key, value){};
  this.remove_item = function(rt_id, key){};
  this.clear = function(rt_id){};
  this.set_item_edit = function(rt_id, key, is_edit){};



  this.get_storages = function()
  {
    if (this.is_setup)
    {
      return this._rts;
    }
    else
    {
      for(var rt_id in this._rts)
      {
        if(this._rts[rt_id])
        {
          this._setup_local_storage(this._rts[rt_id].rt_id);
        }
      }
      return null;
    }
  }

  this.update = function()
  {
    for(var rt_id in this._rts)
    {
      if(this._rts[rt_id])
      {
        this._get_key_value_pairs(this._rts[rt_id].rt_id);
      }
    }
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

  this._encode_new_line_chars = (function()
  {
    /* from the ecma spec
      \u000A Line Feed <LF>
      \u000D Carriage Retu rn <CR>
      \u2028 Line separator <LS>
      \u2029 Paragraph separator <PS>
    */
    var 
    re = /(\u000A)|(\u000D)|(\u2028)|(\u2029)/g,
    fn = function(match, NL, CR, LS, PS)
    {
      return NL && "\\u000A" || CR && "\\u000D" || LS && "\\u2028" || PS && "\\u2029";
    };

    return function(str)
    {
      return str.replace(re, fn);
    }
  })();

  this.set_item = function(rt_id, key, value, success_callback)
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
    var script = "local_storage.set_item(\"" + item.key + "\",\"" + 
      this._encode_new_line_chars(value) + "\",\"" + item.type + "\")";
    var tag = tagManager.set_callback(this, this._handle_default,
      [success_callback, "failed set_item in LocalStorageData"]);
    services['ecmascript-debugger'].requestEval(tag, 
      [this._rts[rt_id].rt_id, 0, 0, script, 
        [["local_storage", this._host_objects[rt_id]]]]);
    return item;
  }

  this.remove_item = function(rt_id, key, success_callback)
  {
    var item = this.get_item(rt_id, key);
    if(item)
    {
      var script = "local_storage.remove_item(\"" + item.key + "\")";
      var tag = tagManager.set_callback(this, this._handle_remove,
        [success_callback, "failed remove_item in LocalStorageData", rt_id, item.key]);
      services['ecmascript-debugger'].requestEval(tag, 
        [this._rts[rt_id].rt_id, 0, 0, script, 
          [["local_storage", this._host_objects[rt_id]]]]);
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
          [["local_storage", this._host_objects[rt_id]]]]);
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

  this._handle_clear = function(status, message, rt_id)
  {
    this._get_key_value_pairs(rt_id);
  }

  this._handle_remove = function(status, message, success_callback, info, rt_id, key)
  {
    this._rts[rt_id].storage = this._rts[rt_id].storage.filter(function(item) {
      return item.key != key;
    });
    this._handle_default(status, message, success_callback, info)
  }

  this._handle_default = function(status, message, success_callback, info)
  {
    const STATUS = 0;
    success_callback(message[STATUS] == 'completed');
    if (message[STATUS] != 'completed')
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + info);
    }
  }

  this._on_active_tab = function(msg)
  {
    var i = 0, rt_id = 0, active_tab = msg.activeTab;
    for( ; i < active_tab.length; i++)
    {
      if (!this._rts[active_tab[i]])
      {
        this._rts[active_tab[i]] = {storage: [], rt_id: active_tab[i]};
        if (this.is_setup)
        {
          this._setup_local_storage(active_tab[i]);
        }
      }
    }
    for(i in this._rts)
    {
      if (active_tab.indexOf(parseInt(i)) == -1)
      {
        this._rts[i] = null;
      }
    }
    this.post('storage-update', {storage_id: this.id});
  }

  this._setup_local_storage = function(rt_id)
  {
    var script = this["return new _StorageHost()"]; 
    var tag = tagManager.set_callback(this, this._register_loacal_storage, [rt_id]);
    services['ecmascript-debugger'].requestEval(tag, [rt_id, 0, 0, script]);
  }

  this._register_loacal_storage = function(staus, message, rt_id)
  {
    const 
    STATUS = 0,
    TYPE = 1,
    VALUE = 2,
    OBJECT_VALUE = 3,
    // sub message ObjectValue 
    OBJECT_ID = 0;

    if (message[STATUS] == 'completed')
    {
      this.is_setup = true;
      if(message[TYPE] == "object")
      {
        this.exists = true;
        this._host_objects[rt_id] = message[OBJECT_VALUE][OBJECT_ID];
        this._get_key_value_pairs(rt_id);
      }
      else
      {
        this.exists = false;
        this.post('storage-update', {storage_id: this.id});
      }
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
      [rt_id, 0, 0, script, [["local_storage", this._host_objects[rt_id]]]]);
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
      this.post('storage-update', {storage_id: this.id});
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        "failed finalize_get_key_value_pairs in LocalStorageData");
    }
  }

  this._on_reset_state = function()
  {
    this._rts = {};
    this._host_objects = {};
    this.is_setup = false;
    this.post('storage-update', {storage_id: this.id});
  }

  this.init = function(id, update_event_name, title, storage_object)
  {
    this.id = id;
    this.storage_object = storage_object;
    this.update_event_name = update_event_name;
    this.title = title;
    this._rts = {};
    this._host_objects = {};
    this.is_setup = false;
    this["return new _StorageHost()"] = 
      "return new " + this._StorageHost.toString() + "(\"" + storage_object + "\").check_storage_object()";
    window.cls.Messages.apply(this);
    window.messages.addListener('active-tab', this._on_active_tab.bind(this));
    messages.addListener('reset-state', this._on_reset_state.bind(this));
  }


}


cls.LocalStorageData = function(id, update_event_name, title, storage_object)
{
  /**
    * _StorageHost is the class on the host side to 
    * expose a storage interface for a given storage type
    * it must implement 
    *    this.get_key_value_pairs() returns Array {key, value, type} 
    *    this.set_item(key, value, type)
    *    this.remove_item(key)
    *    this.clear()
    */

  this._StorageHost = function(storage_object)
  {
    this.get_key_value_pairs = function()
    {
      var 
      length = this._storage_object.length,
      ret = [],
      key = '',
      value = null,
      type = '',
      i = 0;

      for ( ; i < length; i++)
      {
        key = this._storage_object.key(i);
        value = this._storage_object.getItem(key);
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
      this._storage_object.setItem(key, value);
    };
    this.remove_item = function(key)
    {
      this._storage_object.removeItem(key);
    };
    this.clear = function()
    {
      this._storage_object.clear();
    };
    this.check_storage_object = function()
    {
      var nss = storage_object.split('.'), ns = '', i = 0;
      this._storage_object = window;
      for( ; (ns = nss[i]) && (this._storage_object = this._storage_object[ns]); i++);
      return this._storage_object && this || null;
    };
  };

  this.init(id, update_event_name, title, storage_object);
}

cls.LocalStorageData.prototype = cls.StorageDataBase;

cls.CookiesData = function(id, update_event_name, title)
{
  /**
    * _StorageHost is the class on the host side to 
    * expose a storage interface for a given storage type
    * it must implement 
    *    this.get_key_value_pairs() returns Array {key, value, type} 
    *    this.set_item(key, value, type)
    *    this.remove_item(key)
    *    this.clear()
    */

  /**
    * This is very basic. HTTP only cookies are not exposed.
    * Also delete cookies is not expected to work reliable.
    */

  this._StorageHost = function()
  {
    this.get_key_value_pairs = function()
    {
      var 
      cookies = document.cookie.split(';'),
      cookie = null,
      length = cookies.length,
      ret = [],
      key = '',
      value = '',
      pos = 0,
      type = '',
      i = 0;

      for ( ; i < length; i++)
      {
        cookie = cookies[i];
        pos = cookie.indexOf('=', 0);
        key = cookie.slice(0, pos);
        value = decodeURIComponent(cookie.slice(pos+1));
        type = 'string';
        if (key.length)
        {
          ret.push(key)
          ret.push(value);
          ret.push(type);
        }
      }
      return ret;
    };

    this.set_item = function(key, value, type)
    {
      document.cookie = (
        key + "=" + encodeURIComponent(value) +
        "; expires=" + 
        (new Date(new Date().getTime() + 360*24*60*60*1000)).toGMTString() + 
        "; path=/");
    };

    this.remove_item = function(key)
    {
      document.cookie = key + "=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/";
    };

    this.clear = function()
    {
      var cookies = this.get_key_value_pairs(), i = 0;
      for ( ; i < cookies.length; i += 3)
      {
        this.remove_item(cookies[i]);
      };
    };
    this.check_storage_object = function()
    {
      return this;
    };
  };

  this.init(id, update_event_name, title);
}

cls.CookiesData.prototype = cls.StorageDataBase;

