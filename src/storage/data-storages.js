window.cls || (window.cls = {});

cls.StorageDataBase = new function()
{
  /* interface */
  this.get_storages = function(){};
  this.get_item = function(rt_id, key){};
  this.set_item = function(rt_id, key, value){};
  this.remove_item = function(rt_id, key){};
  this.clear = function(rt_id){};
  this.set_item_edit = function(rt_id, key, is_edit){}; // deprecated

  this.get_storages = function()
  {
    if (this.is_setup)
    {
      return this._rts;
    }
    else
    {
      for (var rt_id in this._rts)
      {
        if (this._rts[rt_id])
        {
          this._setup_local_storage(this._rts[rt_id].rt_id);
        }
      }
      return null;
    }
  };

  this.get_storages_plain = function()
  {
    var items = [];
    var storages = this.get_storages();
    if (storages)
    {
      for (var id in storages) {
        var storage = storages[id];
        if (storage)
        {
          for (var item, j=0; item = storage.storage[j]; j++) {
            item._rt_id = storage.rt_id;
            item._object_id = item.key + "/" + storage.rt_id;
            items.push(item);
          };
          items.push({
            _is_runtime_placeholder: true,
            _rt_id: storage.rt_id,
            _object_id: "runtime_placeholder_" + storage.rt_id
          });
        }
      };
      return items;
    }
  }

  this.update = function()
  {
    for (var rt_id in this._rts)
    {
      if (this._rts[rt_id])
      {
        this._get_key_value_pairs(this._rts[rt_id].rt_id);
      }
    }
  };

  this.get_item = function(rt_id, key)
  {
    var
    storage = this._rts[rt_id] &&  this._rts[rt_id].storage,
    item = null,
    i = 0;

    for ( ; (item = storage[i]) && (item.key != key); i++);
    return item;
  };

  this._encode = (function()
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
      return str.replace(re, fn).replace(/\"/g, "\\\"");
    }
  })();

  this.set_item = function(rt_id, key, value, success_callback)
  {
    var item = this.get_item(rt_id, key);
    if (item)
    {
      item.value = value;
    }
    else if (this._rts[rt_id])
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
    var script = "local_storage.set_item(\"" + this._encode(item.key) + "\",\"" +
      this._encode(value) + "\",\"" + item.type + "\")";
    var tag = tagManager.set_callback(this, this._handle_default,
      [success_callback, "failed set_item in LocalStorageData"]);
    services['ecmascript-debugger'].requestEval(tag,
      [this._rts[rt_id].rt_id, 0, 0, script,
        [["local_storage", this._host_objects[rt_id]]]]);
    return item;
  };

  this.remove_item = function(rt_id, key, success_callback)
  {
    var item = this.get_item(rt_id, key);
    if (item)
    {
      var script = "local_storage.remove_item(\"" + item.key + "\")";
      var tag = tagManager.set_callback(this, this._handle_remove,
        [success_callback, "failed remove_item in LocalStorageData", rt_id, item.key]);
      services['ecmascript-debugger'].requestEval(tag,
        [this._rts[rt_id].rt_id, 0, 0, script,
          [["local_storage", this._host_objects[rt_id]]]]);
    }
  };

  this.clear = function(rt_id)
  {
    var storage = this._rts[rt_id];
    if (storage)
    {
      var script = "local_storage.clear()";
      var tag = tagManager.set_callback(this, this._handle_clear, [this._rts[rt_id].rt_id]);
      services['ecmascript-debugger'].requestEval(tag,
        [this._rts[rt_id].rt_id, 0, 0, script,
          [["local_storage", this._host_objects[rt_id]]]]);
    }
  };

  this.set_item_edit = function(rt_id, key, is_edit) // deprecated
  {
    var item = this.get_item(rt_id, key);
    if (item)
    {
      item.is_edit = is_edit;
    }
  };

  this._handle_clear = function(status, message, rt_id)
  {
    this._get_key_value_pairs(rt_id);
  };

  this._handle_remove = function(status, message, success_callback, info, rt_id, key)
  {
    this._rts[rt_id].storage = this._rts[rt_id].storage.filter(function(item) {
      return item.key != key;
    });
    this._handle_default(status, message, success_callback, info)
  };

  this._handle_default = function(status, message, success_callback, info)
  {
    const STATUS = 0;
    success_callback(message[STATUS] == 'completed');
    if (message[STATUS] != 'completed')
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE + info);
    }
  };

  this._on_active_tab = function(msg)
  {
    var i = 0, rt_id = 0, runtimes_with_dom = msg.runtimes_with_dom;
    for ( ; i < runtimes_with_dom.length; i++)
    {
      if (!this._rts[runtimes_with_dom[i]])
      {
        this._rts[runtimes_with_dom[i]] = {storage: [], rt_id: runtimes_with_dom[i]};
        if (this.is_setup)
        {
          this._setup_local_storage(runtimes_with_dom[i]);
        }
      }
    }

    for (i in this._rts)
    {
      if (runtimes_with_dom.indexOf(parseInt(i)) == -1)
      {
        this._rts[i] = null;
      }
    }

    this.post('storage-update', {storage_id: this.id});
  };

  this._setup_local_storage = function(rt_id)
  {
    var script = this["return new _StorageHost()"];
    var tag = tagManager.set_callback(this, this._register_local_storage, [rt_id]);
    services['ecmascript-debugger'].requestEval(tag, [rt_id, 0, 0, script]);
  };

  this._register_local_storage = function(staus, message, rt_id)
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
      if (message[TYPE] == "object")
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
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
        "failed _register_local_storage in LocalStorageData");
    }
  };

  this._get_key_value_pairs = function(rt_id)
  {
    var script = "local_storage.get_key_value_pairs()";
    var tag = tagManager.set_callback(this, this._handle_get_key_value_pairs, [rt_id]);
    services['ecmascript-debugger'].requestEval(tag,
      [rt_id, 0, 0, script, [["local_storage", this._host_objects[rt_id]]]]);
  };

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
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
        "failed handle_get_key_value_pairs in LocalStorageData");
    }
  };

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
  };

  this._get_storage_items = function(message)
  {
    const
    OBJECT_LIST = 0,
    // sub message ObjectInfo
    PROPERTY_LIST = 1,
    // sub message Property
    PROPERTY_NAME = 0,
    PROPERTY_VALUE = 2;

    var prop_list = null, i = 0, storage = [];

    if (message[OBJECT_LIST] &&
        message[OBJECT_LIST][0] &&
        (prop_list = message[OBJECT_LIST][0][PROPERTY_LIST]))
    {
      prop_list = prop_list.filter(this._is_digit);
      for ( ; i < prop_list.length; i += 3)
      {
        storage.push(
        {
          key: prop_list[i][PROPERTY_VALUE],
          value: prop_list[i + 1][PROPERTY_VALUE],
          type: prop_list[i + 2][PROPERTY_VALUE]
        });
      }
    }
    return storage;
  }

  this._finalize_get_key_value_pairs = function(status, message, rt_id)
  {
    if (status === 0)
    {
      var storage = this._get_storage_items(message);
      this._rts[rt_id].storage = storage.sort(this._sort_keys);
      this.post('storage-update', {storage_id: this.id});
    }
    else
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
        "failed finalize_get_key_value_pairs in LocalStorageData");
    }
  };

  this._on_reset_state = function()
  {
    this._rts = {};
    this._host_objects = {};
    this.is_setup = false;
    this.post('storage-update', {storage_id: this.id});
  };

  this._on_profile_disabled = function(msg)
  {
    if (msg.profile == window.app.profiles.DEFAULT)
      this._on_reset_state();
  };

  this._make_sorter = function(prop)
  {
    return function(obj_a, obj_b) {
      if (obj_a._is_runtime_placeholder)
      {
        return Infinity;
      }
      if (obj_b._is_runtime_placeholder)
      {
        return -Infinity;
      }
      if (obj_a[prop] < obj_b[prop])
      {
        return 1;
      }
      if (obj_a[prop] > obj_b[prop])
      {
        return -1;
      }
      return 0;
    }
  };

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

    /**
      * Would be great to update automatically, on any change of the storage object on the host side.
      * requestSetFunctionFilter could almost work, but it won't catch some changes aka localStorage.foo = "bar".
      * Also requestSetFunctionFilter should not be used directly in a data-model, since it's for all of the debug-context.
      * Also it would listeners to functioncallstarted and functioncallcompleted and a mapping between the events they receive,
      * since functioncallcompleted doesn't have much information on what function this is about.
      *   window.services["ecmascript-debugger"].requestSetFunctionFilter(null, ["Storage"]);
      *   window.services["ecmascript-debugger"].addListener("functioncallcompleted", this._handle_update);
      */

    window.cls.MessageMixin.apply(this);
    window.messages.addListener('active-tab', this._on_active_tab.bind(this));
    window.messages.addListener('profile-disabled', this._on_profile_disabled.bind(this));
    messages.addListener('reset-state', this._on_reset_state.bind(this));
    this.tabledef = {
      groups: {
        runtime: {
          label: ui_strings.S_LABEL_COOKIE_MANAGER_GROUPER_RUNTIME,
          grouper: function(obj) {
            return obj._rt_id;
          },
          renderer: function(groupvalue, obj) {
            return templates.storage.runtime_group_render(runtimes.getRuntime(obj[0]._rt_id).uri);
          },
          idgetter: function(obj) {
            return ""+obj[0]._rt_id;
          }
        }
      },
      column_order: ["key", "value"],
      idgetter: function(res) { return res._object_id },
      columns: {
        key: {
          label: templates.storage.wrap_ellipsis(ui_strings.S_LABEL_STORAGE_KEY),
          classname: "col_key",
          renderer: function(obj) {
            if (obj._is_runtime_placeholder)
            {
              return;
            }
            return templates.storage.edit_mode_switch_container(
              templates.storage.wrap_ellipsis(obj.key),
              [
                templates.storage.input_text_container("key", obj.key),
                templates.storage.input_hidden("original_key", obj.key),
                templates.storage.input_hidden("rt_id", obj._rt_id)
              ]
            );
          },
          summer: function(values, groupname, getter) {
            return window.templates.storage.add_item_button(title);
          },
          sorter: this._make_sorter("key")
        },
        value: {
          label: templates.storage.wrap_ellipsis(ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_VALUE),
          classname: "col_value",
          renderer: function(obj) {
            if (obj._is_runtime_placeholder)
            {
              return;
            }
            return templates.storage.edit_mode_switch_container(
              ["div", obj.value],
              templates.storage.input_textarea_container("value", obj.value)
            );
          },
          sorter: this._make_sorter("value")
        }
      },
      options: {
        no_group_changing: true,
      }
    }
  };
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
      for ( ; (ns = nss[i]) && (this._storage_object = this._storage_object[ns]); i++);
      return this._storage_object && this || null;
    };
  };

  this.init(id, update_event_name, title, storage_object);
};

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
    * This is only used if the Cookie Service is not available
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
      has_value = false,
      value = '',
      pos = 0,
      type = '',
      i = 0;

      for ( ; i < length; i++)
      {
        cookie = cookies[i];
        pos = cookie.indexOf('=', 0);
        has_value = pos !== -1;
        key = has_value ? cookie.slice(0, pos) : cookie;
        value = has_value ? decodeURIComponent(cookie.slice(pos+1)) : null;
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

cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

cls.EcmascriptDebugger["6.0"].StorageDataBase =  function()
{
  this._get_storage_items = function(message)
  {
    const
    OBJECT_CHAIN_LIST = 0,
    // sub message ObjectList
    OBJECT_LIST = 0,
    // sub message ObjectInfo
    PROPERTY_LIST = 1,
    // sub message Property
    PROPERTY_VALUE = 2;

    var prop_list = null, i = 0, storage = [];

    if (message[OBJECT_CHAIN_LIST] &&
        message[OBJECT_CHAIN_LIST][0] &&
        message[OBJECT_CHAIN_LIST][0][OBJECT_LIST] &&
        message[OBJECT_CHAIN_LIST][0][OBJECT_LIST][0] &&
        (prop_list = message[OBJECT_CHAIN_LIST][0][OBJECT_LIST][0][PROPERTY_LIST]))
    {
      prop_list = prop_list.filter(this._is_digit);
      for ( ; i < prop_list.length; i += 3)
      {
        storage.push(
        {
          key: prop_list[i][PROPERTY_VALUE],
          value: prop_list[i + 1][PROPERTY_VALUE],
          type: prop_list[i + 2][PROPERTY_VALUE]
        });
      }
    }
    return storage;
  }
}

cls.EcmascriptDebugger["6.0"].StorageDataBase.prototype = cls.StorageDataBase;
