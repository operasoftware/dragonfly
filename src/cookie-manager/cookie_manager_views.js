window.cls || (window.cls = {});

cls.CookieManagerView = function(id, name, container_class)
{
  this._cookie_dict = {};
  this.flattened_cookies = [];
  this._rts = {};
  this._tabledef = {
    groups: {
      hostandpath: {
        label:   "Host and path",
        grouper: function(obj) {
          return window.views.cookie_manager._rts[obj.runtimes[0]].hostname + window.views.cookie_manager._rts[obj.runtimes[0]].pathname;
        },
        renderer: function(groupvalue, obj) {
          var obj = obj[0];
          var runtime = window.views.cookie_manager._rts[obj.runtimes[0]];
          return window.templates.cookie_manager.hostname_group_render(runtime);
        }
      }
    },
    columns: {
      domain: {
        label:    ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_DOMAIN,
        renderer: function(obj) {
          return obj.domain || window.templates.cookie_manager.table_view.unknown_value();
        }
      },
      name: {
        label:    ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_NAME,
        renderer: function(obj) {
          if(obj.is_editable)
          {
            return window.templates.cookie_manager.table_view.editable_name(obj.name, obj.objectref);
          }
          else
          {
            return obj.name;
          }
        }
      },
      value: {
        label:    ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_VALUE,
        renderer: function(obj) {
          if(obj.is_editable)
          {
            return window.templates.cookie_manager.table_view.editable_value(decodeURIComponent(obj.value), obj.objectref);
          }
          else
          {
            return obj.value;
          }
        }
      },
      path: {
        label:    ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_PATH,
        renderer: function(obj) {
          if(typeof obj.path === "string")
          {
            return obj.path;
          }
          return window.templates.cookie_manager.table_view.unknown_value();
        }
      },
      expires: {
        label:    ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_EXPIRES,
        renderer: function(obj) {
          if(typeof obj.expires === "number")
          {
            if(obj.expires === 0)
            {
              return window.templates.cookie_manager.table_view.expires_0values()
            }
            // return empty container to be filled by _update_expiry func
            return window.templates.cookie_manager.table_view.expires_container(obj.objectref, new Date(obj.expires*1000));
          }
          else
          {
            return window.templates.cookie_manager.table_view.unknown_value();
          }
        }
      },
      isSecure: {
        label:    ui_strings.S_LABEL_COOKIE_MANAGER_SECURE_CONNECTIONS_ONLY,
        renderer: function(obj) {
          if(typeof obj.isSecure === "number")
          {
            return obj.isSecure? "Yes":"";
          }
          return window.templates.cookie_manager.table_view.unknown_value();
        }
      },
      isHTTPOnly: {
        label:    ui_strings.S_LABEL_COOKIE_MANAGER_HTTP_ONLY,
        renderer: function(obj) {
          if(typeof obj.isHTTPOnly === "number")
          {
            return obj.isHTTPOnly? "Yes":"";
          }
          return window.templates.cookie_manager.table_view.unknown_value();
        }
      },
      remove: {
        label:    "",
        renderer: function(obj) {
          if(obj.is_removable)
          {
            return window.templates.cookie_manager.table_view.remove_button(obj.objectref);
          }
        },
        sorter: "unsortable"
      }
    }
  };
  this.createView = function(container)
  {
    this.flattened_cookies = this._flatten_cookies(this._cookie_dict);
    this._table_elem = container.getElementsByClassName("sortable-table")[0];
    if(!this._table_elem)
    {
      this._table_elem = container.render(new SortableTable(this._tabledef, this.flattened_cookies).render());
      this._table_obj = ObjectRegistry.get_instance().get_object(this._table_elem.getAttribute("data-object-id"));
      this._table_obj.group("hostandpath");
      container.render(window.templates.cookie_manager.add_cookie_form(this._rts));
      window.eventHandlers.change["cookiemanager-add-cookie-domain-select"]();
      this.update_path_datalist();
      container.render(window.templates.cookie_manager.clear_and_refetch_button());
    }
    else
    {
      // replace domain select input as the runtime may have changed. ideally just do in that case, but skipping that for now.
      var domain_select_container = container.getElementsByClassName("domain_select_container")[0];
      if(domain_select_container) // seems initial rendering can not have resulted in a domain_select_container?
      {
        domain_select_container.clearAndRender(window.templates.cookie_manager.domain_selector(this._rts));
      }
    }
    this._table_obj = ObjectRegistry.get_instance().get_object(this._table_elem.getAttribute("data-object-id"));
    this._table_obj.data = this.flattened_cookies;
    this._table_elem.clearAndRender(this._table_obj.render());

    this._update_expiry();
    if(!this._update_expiry_interval)
    {
      this._update_expiry_interval = setInterval(this._update_expiry,15000);
    }
  };

  this._on_active_tab = function(msg)
  {
    // cleanup runtimes directory
    for(var item in this._rts)
    {
      // item is a string, rt_id is a number which can now be compared with what's in msg.activeTab
      var rt_id = this._rts[item].rt_id;
      if(msg.activeTab.indexOf(rt_id) === -1)
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

    for (var i=0; i < msg.activeTab.length; i++)
    {
      var rt_id = msg.activeTab[i];
      if(!this._rts[rt_id])
      {
        this._rts[rt_id]={rt_id: rt_id, get_domain_is_pending: true};
      }
      this._request_runtime_details(this._rts[rt_id]);
    };
  };

  this._update_expiry = function()
  {
    for (var i=0; i < window.views.cookie_manager.flattened_cookies.length; i++)
    {
      var obj = window.views.cookie_manager.flattened_cookies[i];
      var elem = document.getElementById("expires_container_"+obj.objectref);
      if(elem)
      {
        var parsed_date=new Date(obj.expires*1000);
        var compare_date = new Date();
        if(compare_date.getTime() < parsed_date.getTime())
        {
          var diff = parsed_date.getTime() - compare_date.getTime();
          var in_sec = diff / 1000;
          var in_min = in_sec / 60;
          var in_dec_min = in_min / 10;
          var in_hours = in_min / 60;
          var in_days = in_hours / 24;

          if(in_sec < 60)
          {
            elem.textContent = "Soon";
          }
          else if (Math.round(in_min) === 1)
          {
            elem.textContent = "In "+ Math.round(in_min) +" minute";
          }
          else if (in_min < 10)
          {
            elem.textContent = "In " + Math.round(in_min) + " minutes";
          }
          else if (in_dec_min < 5)
          {
            elem.textContent = "In " + Math.round(in_dec_min) * 10 + " minutes";
          }
          else if (Math.round(in_hours) === 1)
          {
            elem.textContent = "In " + Math.round(in_hours) + " hour";
          }
          else if (in_hours < 23)
          {
            elem.textContent = "In " + Math.round(in_hours) + " hours";
          }
          else if (Math.round(in_days) === 1)
          {
            elem.textContent = "In " + Math.round(in_days) + " day";
          }
          else
          {
            elem.textContent = "In " + Math.round(in_days) + " days";
          }
        }
        else
        {
          elem.clearAndRender(window.templates.cookie_manager.table_view.has_expired_value());
          // find row, add expired_cookie class
          while(elem.nodeName !== "tr" || !elem.parentNode)
          {
            elem = elem.parentNode;
          }
          if(elem.nodeName === "tr")
          {
            elem.addClass("expired_cookie");
          }
        }
      }
    }
  };

  this.refetch = function()
  {
    this._cookie_dict = {};
    for (var rt_id in this._rts) {
      this._rts[rt_id].get_domain_is_pending = true;
      this._request_runtime_details(this._rts[rt_id]);
    };
  };

  this._request_runtime_details = function(rt_object)
  {
    var script = "return JSON.stringify({hostname: location.hostname || '', pathname: location.pathname || ''})";
    var tag = tagManager.set_callback(this, this._handle_get_domain,[rt_object.rt_id]);
    services['ecmascript-debugger'].requestEval(tag,[rt_object.rt_id, 0, 0, script]);
  };

  this._handle_get_domain = function(status, message, rt_id)
  {
    const DATA = 2;
    var parsed_data = JSON.parse(message[2]);
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
        window.views.cookie_manager.update();
      }
    }
  };

  this._handle_cookies = function(status, message, domain, path)
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
          value:      cookie_info[3],
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
      for(var id in window.views.cookie_manager._rts)
      {
        var runtime = window.views.cookie_manager._rts[id];
        if(runtime.hostname === domain && runtime.pathname === path)
        {
          var script = "return document.cookie";
          var tag = tagManager.set_callback(this, window.views.cookie_manager._handle_js_retrieved_cookies, [domain, path]);
          services['ecmascript-debugger'].requestEval(tag,[parseInt(id), 0, 0, script]);
          break;
        }
      }
    }
    window.views.cookie_manager.update();
  };

  this._handle_js_retrieved_cookies = function(status, message, domain, path)
  {
    const DATA = 2;
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
      window.views.cookie_manager.update();
    }
  };

  this.handle_changed_cookies = function(status, message)
  {
    window.views.cookie_manager.refetch();
  };

  this._init = function(id, update_event_name)
  {
    window.messages.addListener('active-tab', this._on_active_tab.bind(this));
    this.init(id, name, container_class);
  };

  // Helpers
  this.update_path_datalist = function()
  {
    formelem = document.querySelector("form.add-cookie-form");
    var runtime_field = formelem.querySelector("input[name=add_cookie_runtime]") || formelem.querySelector("select[name=add_cookie_runtime_select]");
    var selected_runtime_ids = runtime_field.value.split(",");

    var pathvalues = [];
    for (var i=0; i < selected_runtime_ids.length; i++) {
      var pathname = window.views.cookie_manager._rts[selected_runtime_ids[i]].pathname;
      if(pathvalues.indexOf(pathname) === -1)
      {
        pathvalues.push(pathname);
      }
    };
    // Remove old
    var _old_path_list = formelem.querySelector("#cookiepathlist");
    if(_old_path_list) {
      formelem.removeChild(_old_path_list);
    }
    // Insert new
    var render_object = [];
    if(pathvalues.length > 0) {
      var option_arr = [];
      for (var i=0; i < pathvalues.length; i++) {
        option_arr.push(["option","value",pathvalues[i]]);
      };
      render_object.push(["datalist",option_arr,"id","cookiepathlist"]);
    }
    formelem.render(render_object);
  };

  this._flatten_cookies = function(cookies)
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
            objectref:    current_cookie.domain + "/" + current_cookie.path + current_cookie.name + (parseInt(Math.random()*99999)),
            runtimes:     domaincookies.runtimes,
            is_editable:  (function(cookie){
              /**
               * Decides if the cookie name & value can be edited.
               * The cookie.domain condition should be removed when a new "add cookie" interface as defined
               * in CORE-35370 is used, which will allow specifying the domain when creating cookies
              */
              if(
                cookie.isHTTPOnly ||
                cookie.path || // remove when CORE-35055 is fixed
                cookie.domain != window.views.cookie_manager._rts[domaincookies.runtimes[0]].hostname
              )
              {
                return false;
              }
              return true;
            })(current_cookie),
            is_removable: (function(cookie){
              /**
               * Cookie retrieved via JS can't reliably be removed because domain (and path) are unknown.
               * Also while path info is mostly incorrect when present (CORE-35055), cookie with path
               * won't be removable for now.
              */
              if(
                cookie.domain === undefined ||
                cookie.path === undefined ||
                cookie.path // remove when CORE-35055 is fixed
              )
              {
                return false;
              }
              return true;
            })(current_cookie)
          };
          for (var key in current_cookie) {
            flattened_cookie[key] = current_cookie[key];
          };
          flattened_cookies.push(flattened_cookie);
        };
      }
    }
    return flattened_cookies;
  };

  this.remove_cookie_by_objectref = function(objectref)
  {
    var cookie;
    for (var i=0; i < this.flattened_cookies.length; i++) {
      if(this.flattened_cookies[i].objectref === objectref)
      {
        cookie = this.flattened_cookies[i];
        var domain = cookie.domain;
        if(!domain) {
          // in case the cookies domain is undefined (cookie is retrieved via JS), try using the runtime domain
          domain = this._rts[cookie.runtimes[0]].hostname;
        }
        var path = cookie.path;
        if(!path) {
          // in case the cookies path is undefined (cookie is retrieved via JS), try using "/" which is most likely
          path = "/";
        }
        var tag = tagManager.set_callback(this, this.handle_changed_cookies, []);
        services['cookie-manager'].requestRemoveCookie(tag,[domain, path, cookie.name]);
      }
    }
  };
  // End Helpers
  this._init(id, name);
};

cls.CookieManagerView.prototype = ViewBase;
