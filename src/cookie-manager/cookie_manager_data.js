window.cls || (window.cls = {});
cls.CookieManager || (cls.CookieManager = {});
cls.CookieManager["1.0"] || (cls.CookieManager["1.0"] = {});
cls.CookieManager["1.1"] || (cls.CookieManager["1.1"] = {});

cls.CookieManager.Cookie = function(details, data)
{
  this._rt_hostname = details._rt_hostname;
  this._rt_path     = details._rt_path;
  this._rt_id       = Number(details._rt_id);
  this._rt_protocol = details._rt_protocol;

  this._is_runtime_placeholder = details._is_runtime_placeholder;
  if(!this._is_runtime_placeholder)
  {
    this.domain     = details.domain || "";
    this.path       = details.path || "";
    this.name       = details.name;
    this.value      = details.value;
    this.expires    = details.expires;
    this.isSecure   = details.isSecure;
    this.isHTTPOnly = details.isHTTPOnly;
    this._objectref = (this.domain + "/" + this.path + "/" + this.name + "/" + this._rt_id).replace(/'/g,"")
  }
  else
  {
    this._objectref = "runtime_placeholder_"+this._rt_id;
  }

  /**
   * Decide if the cookie can be edited.
   * The cookie.domain and .isHTTPOnly conditions applies only when the "add cookie"
   * interface is not used, which allows specifying the domain when creating cookies
   * cookie_service 1.0.2 fixes CORE-35055 -> correct paths, allows for editing
  */
  this._is_editable =
    data._is_min_service_version_1_1 || (
      !this.isHTTPOnly &&
      (!this.path || data._is_min_service_version_1_0_2) &&
      this.domain === this._rt_hostname
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
    (!this.path || data._is_min_service_version_1_0_2)
  );
}

cls.CookieManager.CookieDataBase = function()
{
  this.refetch = function(){};
  this.remove_cookie = function(objectref, callback){};
  this.get_cookies = function(){};
  this.create_objectref = function(cookie, runtimes, fixed_name){};
  this.get_cookie_by_objectref = function(objectref){};
  this.set_cookie = function(cookie_instance, callback){};

  this.refetch = function()
  {
    this.cookie_list = [];
    for (var rt_id in this._rts) {
      this._request_runtime_details(Number(rt_id));
    };
  };

  this.get_cookies = function()
  {
    return this.cookie_list;
  };

  this.get_cookie_by_objectref = function(objectref)
  {
    for (var i=0, cookie; cookie = this.cookie_list[i]; i++) {
      if(cookie._objectref === objectref)
      {
        return cookie;
      }
    };
  };

  this.set_cookie = function(cookie_instance, callback)
  {
    this._view._restore_selection = [cookie_instance._objectref];

    var add_cookie_script = 'document.cookie="' + cookie_instance.name + '=' + encodeURIComponent(cookie_instance.value);
    if(cookie_instance.expires) // in case of 0 value the "expires" value should not be written, represents "Session" value
    {
      add_cookie_script += '; expires='+ (new Date(cookie_instance.expires).toUTCString());
    }
    add_cookie_script += '; path=' + (cookie_instance.path || "/") + '"';
    var tag = callback ? tagManager.set_callback(this, callback, []) : 0;
    services['ecmascript-debugger'].requestEval(tag,[cookie_instance._rt_id, 0, 0, add_cookie_script]);
  };

  this.remove_cookie = function(objectref, callback)
  {
    var cookie = this.get_cookie_by_objectref(objectref);
    if(cookie)
    {
      var domain = cookie.domain;
      if(!domain)
      {
        // in case the cookies domain is undefined (cookie is retrieved via JS), try using the runtime domain
        domain = this._rts[cookie._rt_id].hostname;
      }
      var path = cookie.path;
      if(!path)
      {
        // in case the cookies path is undefined (cookie is retrieved via JS), try using "/" which is most likely
        path = "/";
      }
      var tag = callback ? tagManager.set_callback(this, callback, []) : 0;
      services['cookie-manager'].requestRemoveCookie(tag,[domain, path, cookie.name]);
    }
  };

  this.remove_cookies = function(cookies)
  {
    for (var i=0, cookie; cookie = cookies[i]; i++)
    {
      var callback;
      if(i === cookies.length - 1)
      {
        callback = this.data.refetch;
      }
      this.data.remove_cookie(cookie._objectref, callback);
    }
  }

  this.remove_cookies_of_runtime = function(rt_id)
  {
    this.get_cookies().filter(
      function(cookie)
      {
        return cookie._rt_id === rt_id && !cookie._is_runtime_placeholder;
      }
    ).forEach(
      function(cookie, index, list) {
        this.remove_cookie(cookie._objectref, index === list.length - 1 ? this.refetch : null);
      },
    this);
  };

  this._on_active_tab = function(msg)
  {
    this.cookie_list = [];
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
        this._rts[rt_id]={rt_id: rt_id};
        this._request_runtime_details(rt_id);
      }
    };
  };

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

  this._request_runtime_details = function(rt_id)
  {
    var script = "return JSON.stringify({protocol: location.protocol || '', hostname: location.hostname || '', pathname: location.pathname || ''})";
    var tag = tagManager.set_callback(this, this._handle_runtime_details,[rt_id]);
    services['ecmascript-debugger'].requestEval(tag,[rt_id, 0, 0, script]);
  };

  this._handle_runtime_details = function(status, message, rt_id)
  {
    const STATUS = 0;
    const DATA = 2;
    if(status === 0 && message[STATUS] == "completed")
    {
      var rt = this._rts[rt_id];
      var parsed_data = JSON.parse(message[DATA]);
      rt.protocol = parsed_data.protocol;
      rt.hostname = parsed_data.hostname;
      rt.pathname = parsed_data.pathname;

      if(rt.hostname)
      {
        var tag = tagManager.set_callback(this, this._handle_cookies,[rt_id]);
        services['cookie-manager'].requestGetCookie(tag,[rt.hostname, rt.pathname]);
      }
      else
      {
        // if runtime has no location.hostname, only update view. occurs on opera:* pages for example.
        this._view.update();
      }
    }
  };

  this._handle_cookies = function(status, message, rt_id)
  {
    var rt = this._rts[rt_id];
    if(status === 0)
    {
      const COOKIE = 0;
      if(message.length > 0)
      {
        var cookies = message[COOKIE];
        for (var i=0, cookie_info; cookie_info = cookies[i]; i++) {
          // workaround: GetCookie doesn't allow to specify protocol, requested in CORE-35925
          var is_secure = cookie_info[5];
          if(is_secure && rt.protocol !== "https:")
          {
            continue;
          }
          this.cookie_list.push(
            new cls.CookieManager.Cookie({
              domain:     cookie_info[0],
              path:       cookie_info[1],
              name:       cookie_info[2],
              value:      decodeURIComponent(cookie_info[3]),
              expires:    cookie_info[4],
              isSecure:   cookie_info[5],
              isHTTPOnly: cookie_info[6],

              _rt_id:       rt_id,
              _rt_hostname: rt.hostname,
              _rt_path:     rt.pathname,
              _rt_protocol: rt.protocol
            }, this)
          )
        };
      }
      else
      {
        // In case no cookies come back, check via JS (workaround for CORE-35055)
        var script = "return document.cookie";
        var tag = tagManager.set_callback(this, this._handle_js_retrieved_cookies, [rt_id]);
        services['ecmascript-debugger'].requestEval(tag,[rt_id, 0, 0, script]);
      }
    }
    // add a placeholder per runtime to make the group show up even if there were no cookies
    this.cookie_list.push(
      new cls.CookieManager.Cookie({
        _is_runtime_placeholder: true,
        _rt_id:       rt_id,
        _rt_protocol: rt.protocol,
        _rt_hostname: rt.hostname,
        _rt_path:     rt.pathname
      }, this)
    );
    this._view.update();
  };

  this._handle_js_retrieved_cookies = function(status, message, rt_id)
  {
    const STATUS = 0;
    const DATA = 2;
    if(status === 0 && message[STATUS] == "completed")
    {
      var rt = this._rts[rt_id];
      var cookie_string = message[DATA];
      if(cookie_string && cookie_string.length > 0)
      {
        var cookies = cookie_string.split(';');
        for (var i=0, cookie_info; cookie_info = cookies[i]; i++) {
          var pos = cookie_info.indexOf('=', 0);
          this.cookie_list.push(
            new cls.CookieManager.Cookie(
              {
              name:  cookie_info.slice(0, pos),
              value: decodeURIComponent(cookie_info.slice(pos+1)),
              _rt_runtime:  rt_id,
              _rt_protocol: rt.protocol,
              _rt_hostname: rt.hostname,
              _rt_path:     rt.pathname
            }, this)
          );
        };
      }
    }
    this._view.update();
  };

  this._init = function(service_version, view)
  {
    this.service_version = service_version || 0;
    this._is_min_service_version_1_0_2 = this._is_min_service_version("1.0.2");
    this._is_min_service_version_1_1 = this._is_min_service_version("1.1");
    this._view = view;
    this.cookie_list = [];
    this._rts = {};
    window.messages.addListener('active-tab', this._on_active_tab.bind(this));
  };
};

cls.CookieManager["1.0"].CookieManagerData = function(service_version, view)
{
  this._init(service_version, view);
}
cls.CookieManager["1.0"].CookieManagerData.prototype = new cls.CookieManager.CookieDataBase();

cls.CookieManager["1.1"].CookieManagerData = function(service_version, view)
{
  this.set_cookie = function(cookie_instance, callback)
  {
    this._view._restore_selection = [cookie_instance._objectref];

    // work around CORE-36742, cookies with path "/" don't show up on document.cookie, "" to be used instead
    var path_val = cookie_instance.path;
    if(path_val && path_val.trim() === "/")
    {
      path_val = "";
    }
    var cookie_detail_arr = [
      cookie_instance.domain,
      cookie_instance.name,
      path_val,
      cookie_instance.value,
      cookie_instance.expires / 1000,
      cookie_instance.isSecure,
      cookie_instance.isHTTPOnly
    ];
    var tag = callback ? tagManager.set_callback(this, callback) : 0;
    services['cookie-manager'].requestAddCookie(tag, cookie_detail_arr);
  }
  this._init(service_version, view);
}
cls.CookieManager["1.1"].CookieManagerData.prototype = new cls.CookieManager.CookieDataBase();
