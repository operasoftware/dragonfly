window.cls || (window.cls = {});
cls.CookieManager || (cls.CookieManager = {});
cls.CookieManager["1.0"] || (cls.CookieManager["1.0"] = {});
cls.CookieManager["1.1"] || (cls.CookieManager["1.1"] = {});

cls.CookieManager.StorageDataBase = function()
{
  /**
    * StorageDataBase
    *
    * this.refetch = function()
    * this.remove_item = function(objectref, callback)
    * this.get_items = function()
    * this.create_objectref = function(cookie, runtimes, /fixed_name/)
    * this.get_item_by_objectref = function(objectref)
    * this.write_item = function(cookie_details)
    *
    */
  this.refetch = function()
  {
    this._dict = {};
    for (var rt_id in this._rts) {
      this._rts[rt_id].get_domain_is_pending = true;
      this._request_runtime_details(this._rts[rt_id]);
    };
  };

  this.remove_item = function(objectref, callback)
  {
    var cookie;
    var callback = callback || this.refetch;
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
        var tag = tagManager.set_callback(this, callback, []);
        services['cookie-manager'].requestRemoveCookie(tag,[domain, path, cookie.name]);
      }
    }
  };

  this.get_items = function()
  {
    return this.item_list;
  }

  this.create_objectref = function(cookie, runtimes, fixed_name)
  {
    return ((fixed_name || cookie.domain + "/" + cookie.path + "/" + cookie.name + "/") + (runtimes || "")).replace(/'/g,"");
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

  this.write_item = function(cookie_details)
  {
    this._view._restore_selection = [
      this.create_objectref(
        {
          domain: cookie_details.domain,
          name:   cookie_details.name,
          value:  cookie_details.value,
          path:   cookie_details.path
        },
        cookie_details.runtime
      )
    ];

    var add_cookie_script = 'document.cookie="' + cookie_details.name + '=' + encodeURIComponent(cookie_details.value);
    if(cookie_details.expires) // in case of 0 value the "expires" value should not be written, represents "Session" value
    {
      add_cookie_script += '; expires='+ (new Date(cookie_details.expires).toUTCString());
    }
    add_cookie_script += '; path=' + (cookie_details.path || "/") + '"';
    var script = add_cookie_script;
    var tag = tagManager.set_callback(this, this.refetch, [cookie_details.runtime]);
    services['ecmascript-debugger'].requestEval(tag,[cookie_details.runtime, 0, 0, script]);
  }

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
      this.item_list = this._flatten_data(this._dict, this._rts);
      this._view.update();
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
      if (domaincookies.items)
      {
        for (var i=0; i < domaincookies.items.length ;i++)
        {
          var current_cookie = domaincookies.items[i];
          var flattened_cookie = {
            objectref:    this.create_objectref(current_cookie, domaincookies.runtimes),
            runtimes:     domaincookies.runtimes,
            /**
             * Decide if the cookie can be edited.
             * The cookie.domain and .isHTTPOnly conditions applies only when the "add cookie"
             * interface is not used, which allows specifying the domain when creating cookies
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
             * won't be removable for service_versions < 1.0.2.
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
          objectref:               this.create_objectref(null, domaincookies.runtimes, "domain_path_placeholder"),
          is_runtimes_placeholder: true
        });
      }
    }
    return flattened_cookies;
  };

  this._request_runtime_details = function(rt_object)
  {
    var script = "return JSON.stringify({hostname: location.hostname || '', pathname: location.pathname || ''})";
    var tag = tagManager.set_callback(this, this._handle_runtime_details,[rt_object.rt_id]);
    services['ecmascript-debugger'].requestEval(tag,[rt_object.rt_id, 0, 0, script]);
  };

  this._handle_runtime_details = function(status, message, rt_id)
  {
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

      // wait for domain info for runtime details of all runtimes
      var do_request_data = true;
      for (var key in this._rts)
      {
        if(this._rts[key].get_domain_is_pending === true)
        {
          do_request_data = false;
        }
      };
      if(do_request_data)
      {
        this._request_data(this._rts);
      }
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
        this._dict[domain+path].items=[];
        for (var i=0; i < cookies.length; i++) {
          var cookie_info = cookies[i];
          this._dict[domain+path].items.push({
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
        this._dict[domain+path].items=[];
        var cookies = cookie_string.split(';');
        for (var i=0; i < cookies.length; i++) {
          var cookie_info = cookies[i];
          var pos = cookie_info.indexOf('=', 0);
          this._dict[domain+path].items.push({
            name:  cookie_info.slice(0, pos),
            value: decodeURIComponent(cookie_info.slice(pos+1))
          });
        };
        this._update();
      }
    }
  };

  this._init = function(service_version, view)
  {
    this.service_version = service_version || 0;
    this._view = view;
    this._dict = {};
    this.item_list = [];
    this._rts = {};
    window.messages.addListener('active-tab', this._on_active_tab.bind(this));
    this._hold_redraw_mem = {};
  };
};

cls.CookieManager["1.0"].CookieManagerData = function(service_version, view)
{
  this._init(service_version, view);
}
cls.CookieManager["1.0"].CookieManagerData.prototype = new cls.CookieManager.StorageDataBase();

cls.CookieManager["1.1"].CookieManagerData = function(service_version, view)
{
  this.write_item = function(cookie_details)
  {
    this._view._restore_selection = [
      this.create_objectref(
        {
          domain: cookie_details.domain,
          name:   cookie_details.name,
          value:  cookie_details.value,
          path:   cookie_details.path
        },
        cookie_details.runtime
      )
    ];
    var tag = tagManager.set_callback(this, this.refetch);
    var cookie_detail_arr = [cookie_details.domain, cookie_details.name, (cookie_details.path || "/"), cookie_details.value, cookie_details.expires / 1000, cookie_details.is_secure, cookie_details.is_http_only];
    services['cookie-manager'].requestAddCookie(tag, cookie_detail_arr);
  }
  this._init(service_version, view);
}
cls.CookieManager["1.1"].CookieManagerData.prototype = new cls.CookieManager.StorageDataBase();
