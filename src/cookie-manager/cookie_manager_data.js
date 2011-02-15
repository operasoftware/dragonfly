window.cls || (window.cls = {});
cls.CookieManager || (cls.CookieManager = {});
cls.CookieManager["1.0"] || (cls.CookieManager["1.0"] = {});
cls.CookieManager.StorageData || (cls.CookieManager.StorageData = {});

cls.CookieManager.StorageData.Base = function()
{
  this._on_active_tab = function(msg)
  {
    // cleanup runtimes directory
    for(var item in this._rts)
    {
      // item is a string, rt_id is a number which can now be compared with what's in msg.runtimes_with_dom
      var rt_id = this._rts[item].rt_id;
      if(msg.runtimes_with_dom.indexOf(rt_id) === -1)
      {
        // runtime was not active and is to be removed from this._rts
        delete this._rts[rt_id];
        // loop over existing cookies to remove the rt_id from the runtimes of each
        for(var domain_and_path in this._dict)
        {
          if(this._dict[domain_and_path].runtimes && (this._dict[domain_and_path].runtimes.indexOf(rt_id) !== -1))
          {
            var index = this._dict[domain_and_path].runtimes.indexOf(rt_id);
            this._dict[domain_and_path].runtimes.splice(index,1);
            // if no runtimes are left, delete from _dict
            if(this._dict[domain_and_path].runtimes.length < 1)
            {
              delete this._dict[domain_and_path];
            }
          }
        }
      }
    }

    for (var i=0; i < msg.runtimes_with_dom.length; i++)
    {
      var rt_id = msg.runtimes_with_dom[i];
      if(!this._rts[rt_id])
      {
        this._rts[rt_id]={rt_id: rt_id, get_domain_is_pending: true};
      }
      this._request_runtime_details(this._rts[rt_id]);
    };
  };
  this._update = function()
  {
    if(this._hold_redraw_mem.active)
    {
      this._hold_redraw_mem.callback = this.update.bind(this);
    }
    else
    {
      // console.log("_flatten_data", this._dict);
      this.item_list = this._flatten_data(this._dict, this._rts);
      this.view.update();
    }
  }

  this._is_min_service_version = function(compare_version)
  {
    var compare_version = compare_version.split(".").map(Number);
    var service_version = this.service_version.split(".").map(Number);
    for (var i=0; i < compare_version.length; i++) {
      if((service_version[i] || 0) < compare_version[i])
      {
        return false;
      }
    };
    return true;
  };

  this._flatten_data = function(cookies, runtimes)
  {
    var flattened_cookies = [];
    for (var id in cookies)
    {
      var domaincookies = cookies[id];
      if (domaincookies.cookies)
      {
        for (var i=0; i < domaincookies.cookies.length ;i++)
        {
          var current_cookie = domaincookies.cookies[i];
          var flattened_cookie = {
            objectref:    this.create_objectref(current_cookie, domaincookies.runtimes),
            runtimes:     domaincookies.runtimes,
            /**
             * Decide if the cookie can be edited.
             * The cookie.domain and .isHTTPOnly conditions should be removed when a new "add cookie"
             * interface is used, which will allow specifying the domain when creating cookies
             * cookie_service 1.0.2 fixes CORE-35055 -> correct paths, allows for editing
            */
            is_editable:  this._is_min_service_version("1.1") || (
                            !current_cookie.isHTTPOnly &&
                            (!current_cookie.path || this._is_min_service_version("1.0.2")) &&
                            current_cookie.domain === runtimes[domaincookies.runtimes[0]].hostname
                          ),
            /**
             * Decide if the cookie can be removed.
             * Cookie retrieved via JS can't reliably be removed because domain (and path) are unknown.
             * Also while path info is mostly incorrect when present (CORE-35055), cookie with path
             * won't be removable for now.
            */
            is_removable: (
                            current_cookie.domain !== undefined &&
                            current_cookie.path !== undefined &&
                            (!current_cookie.path || this._is_min_service_version("1.0.2"))
                          )
          };
          for (var key in current_cookie) {
            flattened_cookie[key] = current_cookie[key];
          };
          flattened_cookies.push(flattened_cookie);
        };
      }
      else
      {
        // There are no cookies for this domain/path. The group needs to be shown anyhow.
        flattened_cookies.push({
          runtimes:                domaincookies.runtimes,
          objectref:               this.create_objectref(this, domaincookies.runtimes, "domain_path_placeholder"),
          is_runtimes_placeholder: true
        });
      }
    }
    return flattened_cookies;
  };

  this.set_view = function(view)
  {
    this.view = view;
  }

  this.refetch = function()
  {
    this._dict = {};
    for (var rt_id in this._rts) {
      this._rts[rt_id].get_domain_is_pending = true;
      this._request_runtime_details(this._rts[rt_id]);
    };
  };

  this.remove_item = function(objectref, avoid_refresh)
  {
    var cookie;
    for (var i=0; i < this.item_list.length; i++)
    {
      if(this.item_list[i].objectref === objectref)
      {
        cookie = this.item_list[i];
        var domain = cookie.domain;
        if(!domain)
        {
          // in case the cookies domain is undefined (cookie is retrieved via JS), try using the runtime domain
          domain = this._rts[cookie.runtimes[0]].hostname;
        }
        var path = cookie.path;
        if(!path)
        {
          // in case the cookies path is undefined (cookie is retrieved via JS), try using "/" which is most likely
          path = "/";
        }
        var tag;
        if(!avoid_refresh)
        {
          tag = tagManager.set_callback(this, this.refetch.bind(this), []);
        }
        services['cookie-manager'].requestRemoveCookie(tag,[domain, path, cookie.name]);
      }
    }
  };

  this.write_item = function(c)
  {
    // select changed / created cookie after table had rendered
    // todo: find runtimes where this will probably end up to make the selection restore work
    // todo: need a way to access the views restore_selection array. hardcoding views.cookie_manager for now.
    window.views.cookie_manager._restore_selection = [
      this.create_objectref(
        {
          domain: c.domain,
          name:   c.name,
          value:  c.value,
          path:   c.path
        },
        c.runtime
      )
    ];
    
    var add_cookie_script = 'document.cookie="' + c.name + '=' + encodeURIComponent(c.value);
    if(c.expires) // in case of 0 value the "expires" value should not be written, represents "Session" value
    {
      add_cookie_script += '; expires='+ (new Date(c.expires).toUTCString());
    }
    add_cookie_script += '; path=' + c.path + '"';
    var script = add_cookie_script;
    var tag = tagManager.set_callback(this, this.refetch.bind(this), [c.runtime]);
    services['ecmascript-debugger'].requestEval(tag,[c.runtime, 0, 0, script]);
  }
  
  this.create_objectref = function(cookie, runtimes, fixed_name) // public only to be used directly from view
  {
    return ((fixed_name || (cookie.domain + "/" + cookie.path + "/" + cookie.name + "/")) + (runtimes || "")).replace(/'/g,"");
  };

  this.get_item_by_objectref = function(objectref)
  {
    for (var i=0; i < this.item_list.length; i++) {
      if(this.item_list[i].objectref === objectref)
      {
        return this.item_list[i];
      }
    };
  }

  this._request_runtime_details = function(rt_object)
  {
    // console.log("_request_runtime_details", rt_object);
    var script = "return JSON.stringify({hostname: location.hostname || '', pathname: location.pathname || ''})";
    var tag = tagManager.set_callback(this, this._handle_get_domain,[rt_object.rt_id]);
    services['ecmascript-debugger'].requestEval(tag,[rt_object.rt_id, 0, 0, script]);
  };

  this._handle_get_domain = function(status, message, rt_id)
  {
    // console.log("_handle_get_domain", status, message, rt_id);
    const STATUS = 0;
    const DATA = 2;
    if(status === 0 && message[STATUS] == "completed")
    {
      var parsed_data = JSON.parse(message[DATA]);
      var hostname = parsed_data.hostname;
      var pathname = parsed_data.pathname;
      this._rts[rt_id].get_domain_is_pending = false;
      this._rts[rt_id].hostname = hostname;
      this._rts[rt_id].pathname = pathname;
      
      (function(context)
      {
        for (var key in context._rts)
        {
          if(context._rts[key]["get_domain_is_pending"] !== false)
          {
            return;
          }
        };
        context._request_data.call(context,context._rts);
      })(this);
    }
  };

  this._request_data = function(runtime_list)
  {
    // go over runtimes and ask for cookies once per domain
    for (var str_rt_id in runtime_list)
    {
      var runtime = runtime_list[str_rt_id];
      var rt_domain = runtime.hostname;
      var rt_pathname = runtime.pathname;
      if(rt_domain)
      {
        if(!this._dict[rt_domain+rt_pathname])
        {
          this._dict[rt_domain+rt_pathname] = {
            runtimes: [runtime.rt_id]
          }
        }
        else
        {
          if(this._dict[rt_domain+rt_pathname].runtimes.indexOf(runtime.rt_id) === -1)
          {
            this._dict[rt_domain+rt_pathname].runtimes.push(runtime.rt_id);
          }
        }

        // avoid repeating cookie requests for domains being in more than one runtime
        if(!this._dict[rt_domain+rt_pathname].get_cookies_is_pending)
        {
          this._dict[rt_domain+rt_pathname].get_cookies_is_pending = true;
          var tag = tagManager.set_callback(this, this._handle_cookies,[rt_domain,rt_pathname]);
          services['cookie-manager'].requestGetCookie(tag,[rt_domain,rt_pathname]);
        }
      }
      else
      {
        // if runtime has no location.hostname, only update view. occurs on opera:* pages for example.
        this._update();
      }
    }
  };

  this._handle_cookies = function(status, message, domain, path)
  {
    if(status === 0)
    {
      const COOKIE = 0;
      this._dict[domain+path].get_cookies_is_pending=false;
      if(message.length > 0)
      {
        var cookies = message[COOKIE];
        this._dict[domain+path].cookies=[];
        for (var i=0; i < cookies.length; i++) {
          var cookie_info = cookies[i];
          this._dict[domain+path].cookies.push({
            domain:     cookie_info[0],
            path:       cookie_info[1],
            name:       cookie_info[2],
            value:      decodeURIComponent(cookie_info[3]),
            expires:    cookie_info[4],
            isSecure:   cookie_info[5],
            isHTTPOnly: cookie_info[6]
          });
        };
      }
      else
      {
        // In case no cookies come back, check via JS (workaround for CORE-35055)
        // Find runtime that has the appropriate domain and path
        for(var id in this._rts)
        {
          var runtime = this._rts[id];
          if(runtime.hostname === domain && runtime.pathname === path)
          {
            var script = "return document.cookie";
            var tag = tagManager.set_callback(this, this._handle_js_retrieved_cookies, [domain, path]);
            services['ecmascript-debugger'].requestEval(tag,[parseInt(id), 0, 0, script]);
            break;
          }
        }
      }
    }
    this._update();
  };

  this._handle_js_retrieved_cookies = function(status, message, domain, path)
  {
    const STATUS = 0;
    const DATA = 2;
    if(status === 0 && message[STATUS] == "completed")
    {
      var cookie_string = message[DATA];
      if(cookie_string && cookie_string.length > 0)
      {
        this._dict[domain+path].cookies=[];
        var cookies = cookie_string.split(';');
        for (var i=0; i < cookies.length; i++) {
          var cookie_info = cookies[i];
          var pos = cookie_info.indexOf('=', 0);
          this._dict[domain+path].cookies.push({
            name:  cookie_info.slice(0, pos),
            value: decodeURIComponent(cookie_info.slice(pos+1))
          });
        };
        this._update();
      }
    }
  };

  this._init = function(service_version)
  {
    this.service_version = service_version.version;
    this._dict = {};
    this.item_list = [];
    this._rts = {};
    window.messages.addListener('active-tab', this._on_active_tab.bind(this));
    this._hold_redraw_mem = {};
  };
};

cls.CookieManager.StorageData.CookieService = function(service_version)
{
  this._init(service_version);
  this._tabledef = {
    groups: {
      host_and_path: {
        label:   "Host and path",
        grouper: (function(obj) {
          // todo: check to avoid using this._rts (to skip the bind) by putting hostname etc on the cookie_object directly? would remove lots of this cryptic this._rts[obj.runtimes[0]].pathname stuff.
          return this._rts[obj.runtimes[0]].hostname + this._rts[obj.runtimes[0]].pathname;
        }).bind(this),
        renderer: (function(groupvalue, obj) {
          var obj = obj[0];
          var runtime = this._rts[obj.runtimes[0]];
          return window.templates.cookie_manager.hostname_group_render(runtime);
        }).bind(this)
      }
    },
    column_order: ["domain", "name", "value", "path", "expires", "isSecure", "isHTTPOnly"],
    idgetter: function(res) { return res.objectref },
    columns: {
      domain: {
        label:    ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_DOMAIN,
        classname: "col_domain",
        renderer: (function(obj) {
          if(obj.is_runtimes_placeholder)
          {
            return;
          }
          if(obj.domain)
          {
            return window.templates.cookie_manager.editable_domain(obj.runtimes[0], this._rts, obj.domain);
          }
          return window.templates.cookie_manager.unknown_value();
        }).bind(this),
        summer: function(values, groupname, getter) {
          return ["button", "Add Cookie", "class", "add_cookie_button", "handler", "cookiemanager-add-cookie-row"];
        }
      },
      name: {
        label:    ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_NAME,
        classname: "col_name",
        renderer: function(obj) {
          if(obj.is_runtimes_placeholder)
          {
            return;
          }
          return window.templates.cookie_manager.editable_name(obj.name);
        }
      },
      value: {
        label:    ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_VALUE,
        classname: "col_value",
        renderer: function(obj) {
          if(obj.is_runtimes_placeholder)
          {
            return;
          }
          return window.templates.cookie_manager.editable_value(obj.value);
        }
      },
      path: {
        label:    ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_PATH,
        classname: "col_path",
        renderer: function(obj) {
          if(obj.is_runtimes_placeholder)
          {
            return;
          }
          if(typeof obj.path === "string")
          {
            return window.templates.cookie_manager.editable_path(obj.path);
          }
          return window.templates.cookie_manager.unknown_value();
        }
      },
      expires: {
        label:    ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_EXPIRES,
        classname: "col_expires",
        renderer: function(obj) {
          if(obj.is_runtimes_placeholder)
          {
            return;
          }
          if(typeof obj.expires === "number")
          {
            return window.templates.cookie_manager.editable_expires(obj.expires, obj.objectref);
          }
          return window.templates.cookie_manager.unknown_value();
        }
      },
      isSecure: {
        label:    window.templates.cookie_manager.wrap_ellipsis(ui_strings.S_LABEL_COOKIE_MANAGER_SECURE_CONNECTIONS_ONLY),
        classname: "col_secure",
        renderer: function(obj) { return window.views.cookie_manager._is_secure_renderer(obj) }
      },
      isHTTPOnly: {
        label:    window.templates.cookie_manager.wrap_ellipsis(ui_strings.S_LABEL_COOKIE_MANAGER_HTTP_ONLY),
        classname: "col_httponly",
        renderer: function(obj) { return window.views.cookie_manager._is_http_only_renderer(obj) }
      }
    }
  };
  this.sortby = "domain";
  this.groupby = "host_and_path";
}
cls.CookieManager.StorageData.CookieService.prototype = new cls.CookieManager.StorageData.Base();

cls.CookieManager.StorageData.LocalStorage = function()
{
  this._init({version:"111.0"}); // todo: make version optional
  
  // overwrite _on_active_tab to organize dict by rt_id instead of domain_and_path
  this._on_active_tab = function(msg)
  {
    // console.log("LocalStorage _on_active_tab", msg);
    // cleanup runtimes directory
    /*
    for(var item in this._rts)
    {
      // item is a string, rt_id is a number which can now be compared with what's in msg.runtimes_with_dom
      var rt_id = this._rts[item].rt_id;
      if(msg.runtimes_with_dom.indexOf(rt_id) === -1)
      {
        // runtime was not active and is to be removed from this._rts
        delete this._rts[rt_id];
      }
    }
    */
    this._rts = [];
    for (var i=0; i < msg.runtimes_with_dom.length; i++)
    {
      var rt_id = msg.runtimes_with_dom[i];
      if(!this._rts[rt_id])
      {
        this._rts[rt_id]={rt_id: rt_id, get_domain_is_pending: true};
      }
      this._request_runtime_details(this._rts[rt_id]);
    };
  };
  
  this._request_data = function(runtime_list)
  {
    // go over runtimes and ask for localStorage
    // console.log("_request_data(LS)", runtime_list);
    for (var str_rt_id in runtime_list)
    {
      // todo: check other _request_data
      var runtime = parseInt(runtime_list[str_rt_id].rt_id);
      var script = "return JSON.stringify(window.localStorage)";
      var tag = tagManager.set_callback(this, this._handle_storage.bind(this), [runtime]);
      // var tag = tagManager.set_callback(this, this._handle_cookies,[rt_domain,rt_pathname]);
      services['ecmascript-debugger'].requestEval(tag,[runtime, 0, 0, script]);
    }
  };
  
  this._handle_storage = function(status, message, runtime)
  {
    const STATUS = 0;
    const DATA = 2;
    // console.log("_handle_storage(LS)", message[DATA], runtime);
    if(status === 0 && message[STATUS] == "completed")
    {
      var parsed_data = JSON.parse(message[DATA]);
      // console.log("parsed_data", parsed_data);
      // todo: this is just to match the structure with cookie, which are not directly organized by runtime.
      if(!this._dict[runtime])
      {
        this._dict[runtime] = {};
      }
      if(!this._dict[runtime].runtimes)
      {
        this._dict[runtime].runtimes=[];
      }
      this._dict[runtime].runtimes.push(runtime);
      
      if(!this._dict[runtime].cookies) // todo: make generic
      {
       this._dict[runtime].cookies = [];
      }
      for (var key in parsed_data) {
        if(key !== "length")
        {
          this._dict[runtime].cookies.push({
            key: String(key),
            value: String(parsed_data[key])
          });
        }
      };
      // console.log("updated dict",this._dict);
    }
    this._update();
  }
  
  this._tabledef = {
    groups: {
      runtime: {
        label:   "Runtime",
        grouper: function(obj) {
          var rts = views.new_local_storage._data_reference._rts;
          return rts[obj.runtimes[0]].hostname + rts[obj.runtimes[0]].pathname;
        }
      }
    },
    column_order: ["key", "value"],
    idgetter: function(res) { return res.objectref },
    columns: {
      key: {
        label:     "Key",
        classname: "col_key",
        renderer: function(obj) {
          if(obj.is_runtimes_placeholder)
          {
            return;
          }
          if(obj.key)
          {
            return obj.key; // window.templates.cookie_manager.editable_domain(obj.runtimes[0], this._rts, obj.domain);
          }
        },
        summer: function(values, groupname, getter) {
          return ["button", "Add Item", "class", "add_cookie_button", "handler", "cookiemanager-add-cookie-row"]; // todo: abstr
        }
      },
      value: {
        label:    ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_VALUE,
        classname: "col_value",
        renderer: function(obj) {
          if(obj.is_runtimes_placeholder)
          {
            return;
          }
          return obj.value; // window.templates.cookie_manager.editable_value(obj.value);
        }
      }
    }
  };
  
  this.sortby = "key";
  this.groupby = "runtime";
}
cls.CookieManager.StorageData.LocalStorage.prototype = new cls.CookieManager.StorageData.Base();
