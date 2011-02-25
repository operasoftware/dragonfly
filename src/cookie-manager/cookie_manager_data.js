window.cls || (window.cls = {});
cls.CookieManager || (cls.CookieManager = {});
cls.CookieManager["1.0"] || (cls.CookieManager["1.0"] = {});
cls.CookieManager["1.1"] || (cls.CookieManager["1.1"] = {});

cls.CookieManager.Cookie = function(cookie_details, data_reference)
{
  this._requested_domain    = cookie_details._requested_domain;
  this._requested_path      = cookie_details._requested_path;
  this._requested_rt_id     = cookie_details._requested_rt_id;
  this._requested_protocoll = cookie_details._requested_protocoll;

  this._is_runtime_placeholder = cookie_details._is_runtime_placeholder;
  if(!this._is_runtime_placeholder)
  {
    this.domain     = cookie_details.domain;
    this.path       = cookie_details.path;
    this.name       = cookie_details.name;
    this.value      = cookie_details.value;
    this.expires    = cookie_details.expires;
    this.isSecure   = cookie_details.isSecure;
    this.isHTTPOnly = cookie_details.isHTTPOnly;
    this._objectref = (this.domain + "/" + this.path + "/" + this.name + "/" + this._requested_rt_id).replace(/'/g,"")
  }
  else
  {
    this._objectref = "runtime_placeholder_"+this._requested_rt_id;
  }
  
  /**
   * Decide if the cookie can be edited.
   * The cookie.domain and .isHTTPOnly conditions applies only when the "add cookie"
   * interface is not used, which allows specifying the domain when creating cookies
   * cookie_service 1.0.2 fixes CORE-35055 -> correct paths, allows for editing
  */
  this._is_editable = 
    data_reference._is_min_service_version_1_1 || (
      !this.isHTTPOnly &&
      (!this.path || data_reference._is_min_service_version_1_0_2) &&
      this.domain === runtimes[domaincookies.runtimes[0]].hostname
    );
  /**
   * Decide if the cookie can be removed.
   * Cookie retrieved via JS can't reliably be removed because domain (and path) are unknown.
   * Also while path info is mostly incorrect when present (CORE-35055), cookie with path
   * won't be removable for service_versions < 1.0.2.
  */
  this._is_removable = (
    this.domain !== undefined &&
    this.path !== undefined &&
    (!this.path || data_reference._is_min_service_version_1_0_2)
  );
}

cls.CookieManager.CookieDataBase = function()
{
  this.refetch = function(){};
  this.remove_cookie = function(objectref, callback){};
  this.get_cookies = function(){};
  this.create_objectref = function(cookie, runtimes, fixed_name){};
  this.get_cookie_by_objectref = function(objectref){};
  this.set_cookie = function(cookie_details){};

  this.refetch = function()
  {
    this.cookie_list = [];
    for (var rt_id in this._rts) {
      this._request_runtime_details(this._rts[rt_id]);
    };
  };

  this.remove_cookie = function(objectref, callback)
  {
    var cookie;
    var callback = callback || this.refetch;
    for (var i=0; i < this.cookie_list.length; i++)
    {
      if(this.cookie_list[i]._objectref === objectref)
      {
        cookie = this.cookie_list[i];
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

  this.get_cookies = function()
  {
    return this.cookie_list;
  }

  this.get_cookie_by_objectref = function(objectref)
  {
    for (var i=0; i < this.cookie_list.length; i++) {
      if(this.cookie_list[i]._objectref === objectref)
      {
        return this.cookie_list[i];
      }
    };
  }

  this.set_cookie = function(cookie_details)
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
    var tag = tagManager.set_callback(this, this.refetch, [cookie_details.runtime]);
    services['ecmascript-debugger'].requestEval(tag,[cookie_details.runtime, 0, 0, add_cookie_script]);
  }

  this._on_active_tab = function(msg)
  {
    // cleanup runtimes directory
    for(var rt in this._rts)
    {
      // rt is a string, rt_id is a number which can now be compared with what's in msg.runtimes_with_dom
      var rt_id = this._rts[rt].rt_id;
      if(msg.runtimes_with_dom.indexOf(rt_id) === -1)
      {
        // runtime was not active and is to be removed from this._rts
        delete this._rts[rt_id];
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

  // todo: its a bit strange that data has _update and the view has update through the prototype.
  // consider rename or moving hold_redraw to view
  this._update = function()
  {
    if(this._hold_redraw_mem.active)
    {
      this._hold_redraw_mem.callback = this._bound_view_update;
    }
    else
    {
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
      if (domaincookies.cookies)
      {
        for (var i=0; i < domaincookies.cookies.length ;i++)
        {
          var current_cookie = domaincookies.cookies[i];
          var flattened_cookie = {
            
          };
          for (var key in current_cookie) {
            flattened_cookie[key] = current_cookie[key];
          };
          flattened_cookies.push(flattened_cookie);
        };
      }
      // Also add a placeholder which won't be rendered but makes sure the group shows up and the runtime can be referenced
      flattened_cookies.push({
        objectref:               this.create_objectref(null, domaincookies.runtimes, "domain_path_placeholder"),
        is_runtimes_placeholder: true
      });
    }
    return flattened_cookies;
  };

  this._request_runtime_details = function(rt_object)
  {
    var script = "return JSON.stringify({protocol: location.protocol || '', hostname: location.hostname || '', pathname: location.pathname || ''})";
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
      var protocol = parsed_data.protocol;
      var hostname = parsed_data.hostname;
      var pathname = parsed_data.pathname;
      this._rts[rt_id].protocol = protocol;
      this._rts[rt_id].hostname = hostname;
      this._rts[rt_id].pathname = pathname;

      this._request_data(rt_id); // todo: check to skip this._rts and just kill it. just hand the details along.
    }
  };

  this._request_data = function(rt_id)
  {
    var runtime = this._rts[rt_id];
    var rt_protocol = runtime.protocol;
    var rt_domain = runtime.hostname;
    var rt_pathname = runtime.pathname;
    if(rt_domain)
    {
      var tag = tagManager.set_callback(this, this._handle_cookies,[rt_id, rt_protocol, rt_domain, rt_pathname]);
      services['cookie-manager'].requestGetCookie(tag,[rt_domain,rt_pathname]);
    }
    else
    {
      // if runtime has no location.hostname, only update view. occurs on opera:* pages for example.
      this._update();
    }
  };

  this._handle_cookies = function(status, message, rt_id, rt_protocol, rt_domain, rt_pathname)
  {
    if(status === 0)
    {
      const COOKIE = 0;
      if(message.length > 0)
      {
        var cookies = message[COOKIE];
        for (var i=0; i < cookies.length; i++) {
          var cookie_info = cookies[i];
          this.cookie_list.push(
            new cls.CookieManager.Cookie({
              domain:     cookie_info[0],
              path:       cookie_info[1],
              name:       cookie_info[2],
              value:      decodeURIComponent(cookie_info[3]),
              expires:    cookie_info[4],
              isSecure:   cookie_info[5],
              isHTTPOnly: cookie_info[6],

              _requested_domain:   rt_domain,
              _requested_path:     rt_pathname,
              _requested_rt_id:    rt_id,
              _requested_protocol: rt_protocol,
            }, this)
          )
        };
      }
      else
      {
        // In case no cookies come back, check via JS (workaround for CORE-35055)
        var script = "return document.cookie";
        var tag = tagManager.set_callback(this, this._handle_js_retrieved_cookies, [rt_id, rt_domain, rt_pathname]);
        services['ecmascript-debugger'].requestEval(tag,[rt_id, 0, 0, script]);
      }
    }
    // add a placeholder per runtime to make the group show up
    this.cookie_list.push(
      new cls.CookieManager.Cookie({
        _is_runtime_placeholder: true,
        _requested_domain:   rt_domain,
        _requested_path:     rt_pathname,
        _requested_rt_id:    rt_id,
        _requested_protocol: rt_protocol,
      }, this)
    );
    this._update();
  };

  this._handle_js_retrieved_cookies = function(status, message, rt_id, rt_domain, rt_pathname)
  {
    const STATUS = 0;
    const DATA = 2;
    if(status === 0 && message[STATUS] == "completed")
    {
      var cookie_string = message[DATA];
      if(cookie_string && cookie_string.length > 0)
      {
        var cookies = cookie_string.split(';');
        for (var i=0; i < cookies.length; i++) {
          var cookie_info = cookies[i];
          var pos = cookie_info.indexOf('=', 0);
          
          this.cookie_list.push.push({
            name:  cookie_info.slice(0, pos),
            value: decodeURIComponent(cookie_info.slice(pos+1)),

            _requested_domain:  rt_domain,
            _requested_path:    rt_pathname,
            _requested_runtime: rt_id
          });
        };
      }
    }
    this._update();
  };

  this._init = function(service_version, view)
  {
    this.service_version = service_version || 0;
    this._is_min_service_version_1_0_2 = this._is_min_service_version("1.0.2");
    this._is_min_service_version_1_1 = this._is_min_service_version("1.1");
    this._view = view;
    this._domain_and_path_dict = {};
    this.cookie_list = [];
    this._rts = {};
    window.messages.addListener('active-tab', this._on_active_tab.bind(this));
    this._hold_redraw_mem = {};
    this._bound_view_update = this._view.update.bind(this);
    /* is practically
    this._bound_update = (function(context){
      return function context.update();
    }(this);
    */
  };
};

cls.CookieManager["1.0"].CookieManagerData = function(service_version, view)
{
  this._init(service_version, view);
}
cls.CookieManager["1.0"].CookieManagerData.prototype = new cls.CookieManager.CookieDataBase();

cls.CookieManager["1.1"].CookieManagerData = function(service_version, view)
{
  this.set_cookie = function(cookie_details)
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
    var cookie_detail_arr = [
      cookie_details.domain,
      cookie_details.name,
      (cookie_details.path || "/"),
      cookie_details.value,
      cookie_details.expires / 1000,
      cookie_details.is_secure,
      cookie_details.is_http_only
    ];
    services['cookie-manager'].requestAddCookie(tag, cookie_detail_arr);
  }
  this._init(service_version, view);
}
cls.CookieManager["1.1"].CookieManagerData.prototype = new cls.CookieManager.CookieDataBase();
