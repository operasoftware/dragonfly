window.cls || (window.cls = {});
cls.CookieManager || (cls.CookieManager = {});
cls.CookieManager["1.0"] || (cls.CookieManager["1.0"] = {});

cls.CookieManager["1.0"].Data = function(service_version)
{
  this.service_version = service_version;
  // console.log("service_version",service_version);
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
        for(var domain_and_path in this._cookie_dict)
        {
          if(this._cookie_dict[domain_and_path].runtimes && (this._cookie_dict[domain_and_path].runtimes.indexOf(rt_id) !== -1))
          {
            var index = this._cookie_dict[domain_and_path].runtimes.indexOf(rt_id);
            this._cookie_dict[domain_and_path].runtimes.splice(index,1);
            // if no runtimes are left, delete from _cookie_dict
            if(this._cookie_dict[domain_and_path].runtimes.length < 1)
            {
              delete this._cookie_dict[domain_and_path];
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

  this.refetch = function()
  {
    this._cookie_dict = {};
    for (var rt_id in this._rts) {
      this._rts[rt_id].get_domain_is_pending = true;
      this._request_runtime_details(this._rts[rt_id]);
    };
  };

  this._update = function()
  {
    if(this._hold_redraw_mem.active)
    {
      this._hold_redraw_mem.callback = this.update.bind(this);
      return;
    }
    this.flattened_cookies = this._flatten_cookies(this._cookie_dict, this._rts);
    window.views.cookie_manager.update();
  }

  this._is_min_service_version = function(compare_version)
  {
    // RRR this.service_version is for some reason missing, skipping for now
    return true;
    
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

  this._flatten_cookies = function(cookies, runtimes)
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
            objectref:    this._create_objectref(current_cookie, domaincookies.runtimes),
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
          objectref:               this._create_objectref(this, domaincookies.runtimes, "domain_path_placeholder"),
          is_runtimes_placeholder: true
        });
      }
    }
    return flattened_cookies;
  };
  
  this._create_objectref = function(cookie, runtimes, fixed_name)
  {
    return ((fixed_name || (cookie.domain + "/" + cookie.path + "/" + cookie.name + "/")) + (runtimes || "")).replace(/'/g,"");
  };

  this._request_runtime_details = function(rt_object)
  {
    var script = "return JSON.stringify({hostname: location.hostname || '', pathname: location.pathname || ''})";
    var tag = tagManager.set_callback(this, this._handle_get_domain,[rt_object.rt_id]);
    services['ecmascript-debugger'].requestEval(tag,[rt_object.rt_id, 0, 0, script]);
  };

  this._handle_get_domain = function(status, message, rt_id)
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
      (function(context)
      {
        for (var key in context._rts)
        {
          if(context._rts[key]["get_domain_is_pending"] !== false)
          {
            return;
          }
        };
        context._request_cookies.call(context,context._rts);
      })(this);
    }
  };

  this._request_cookies = function(runtime_list)
  {
    // go over runtimes and ask for cookies once per domain
    for (var str_rt_id in runtime_list)
    {
      var runtime = runtime_list[str_rt_id];
      var rt_domain = runtime.hostname;
      var rt_pathname = runtime.pathname;
      if(rt_domain)
      {
        if(!this._cookie_dict[rt_domain+rt_pathname])
        {
          this._cookie_dict[rt_domain+rt_pathname] = {
            runtimes: [runtime.rt_id]
          }
        }
        else
        {
          if(this._cookie_dict[rt_domain+rt_pathname].runtimes.indexOf(runtime.rt_id) === -1)
          {
            this._cookie_dict[rt_domain+rt_pathname].runtimes.push(runtime.rt_id);
          }
        }

        // avoid repeating cookie requests for domains being in more than one runtime
        if(!this._cookie_dict[rt_domain+rt_pathname].get_cookies_is_pending)
        {
          this._cookie_dict[rt_domain+rt_pathname].get_cookies_is_pending = true;
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
      this._cookie_dict[domain+path].get_cookies_is_pending=false;
      if(message.length > 0)
      {
        var cookies = message[COOKIE];
        this._cookie_dict[domain+path].cookies=[];
        for (var i=0; i < cookies.length; i++) {
          var cookie_info = cookies[i];
          this._cookie_dict[domain+path].cookies.push({
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
        this._cookie_dict[domain+path].cookies=[];
        var cookies = cookie_string.split(';');
        for (var i=0; i < cookies.length; i++) {
          var cookie_info = cookies[i];
          var pos = cookie_info.indexOf('=', 0);
          this._cookie_dict[domain+path].cookies.push({
            name:  cookie_info.slice(0, pos),
            value: decodeURIComponent(cookie_info.slice(pos+1))
          });
        };
        this._update();
      }
    }
  };

  this.handle_changed_cookies = function(status, message)
  {
    // todo: check why this.refetch doesn't exist here
    window.cookie_manager_data.refetch();
  };

  this._init = function(id, name, container_class, service_version)
  {
    this.service_version = service_version;
    this._cookie_dict = {};
    this.flattened_cookies = [];
    this._rts = {};
    window.messages.addListener('active-tab', this._on_active_tab.bind(this));
    this._hold_redraw_mem = {};
    this._tabledef = {
      groups: {
        hostandpath: {
          label:   "Host and path",
          grouper: function(obj) {
            return window.cookie_manager_data._rts[obj.runtimes[0]].hostname + window.cookie_manager_data._rts[obj.runtimes[0]].pathname;
          },
          renderer: function(groupvalue, obj) {
            var obj = obj[0];
            var runtime = window.cookie_manager_data._rts[obj.runtimes[0]];
            return window.templates.cookie_manager.hostname_group_render(runtime);
          }
        }
      },
      column_order: ["domain", "name", "value", "path", "expires", "isSecure", "isHTTPOnly"],
      idgetter: function(res) { return res.objectref },
      columns: {
        domain: {
          label:    ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_DOMAIN,
          classname: "col_domain",
          renderer: function(obj) {
            if(obj.is_runtimes_placeholder)
            {
              return;
            }
            if(obj.domain)
            {
              return window.templates.cookie_manager.editable_domain(obj.runtimes[0], window.cookie_manager_data._rts, obj.domain);
            }
            return window.templates.cookie_manager.unknown_value();
          },
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
    this.sortable_table = new SortableTable(this._tabledef, this.flattened_cookies, null, "domain", "hostandpath", true);
  };
  this._init();
};
