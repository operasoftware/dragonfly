window.cls || (window.cls = {});

cls.CookieManagerView = function(id, name, container_class)
{
  this._cookie_dict = {};
  this._flattened_cookies = [];
  this._rts = {};
  this._tabledef = {
    groups: {
      hostandpath: {
        label:    "Host and path",
        grouper:  function(obj) {
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
        label: ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_DOMAIN
      },
      name: {
        label:    ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_NAME,
        renderer: function(obj) {
          if(!obj.isHTTPOnly)
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
          if(!obj.isHTTPOnly)
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
          return obj.path;
        }
      },
      expires: {
        label:    ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_EXPIRES,
        renderer: function(obj) {
          var parsedDate=new Date(obj.expires*1000);
          if(new Date().getTime() < parsedDate.getTime())
          {
            return parsedDate.toUTCString();
          }
          return window.templates.cookie_manager.table_view.expires_0values();
        }
      },
      isSecure: {
        label:    ui_strings.S_LABEL_COOKIE_MANAGER_SECURE_CONNECTIONS_ONLY,
        renderer: function(obj) { return obj.isSecure? "Yes":""; }
      },
      isHTTPOnly: {
        label:    ui_strings.S_LABEL_COOKIE_MANAGER_HTTP_ONLY,
        renderer: function(obj) { return obj.isHTTPOnly? "Yes":""; }
      },
      remove: {
        label:    "",
        renderer: function(obj) { return window.templates.cookie_manager.table_view.remove_button(obj.objectref); }
      }
    }
  };
  this.createView = function(container)
  {
    this._flattened_cookies = this._flatten_cookies(this._cookie_dict);
    container.clearAndRender(new SortableTable(this._tabledef, this._flattened_cookies).render());

    var table = document.getElementsByClassName("cookie_manager")[0].getElementsByClassName("sortable-table")[0];
    var obj = ObjectRegistry.get_instance().get_object(table.getAttribute("data-object-id"));
    // group by host and path as that is what's used for the actual query
    obj.group("hostandpath");
    table.re_render(obj.render());

    // render cookie adding
    container.render(window.templates.cookie_manager.add_cookie_form(this._rts));
    window.eventHandlers.change['cookiemanager-add-cookie-domain-select']();
    // render clear and update button. todo: move to where it always appears
    container.render(window.templates.cookie_manager.clear_and_refetch_button());
  };

  this._on_active_tab = function(msg)
  {
    // cleanup view
    this.clearAllContainers();

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
        for(var domain in this._cookie_dict)
        {
          if(this._cookie_dict[domain].runtimes && (this._cookie_dict[domain].runtimes.indexOf(rt_id) !== -1))
          {
            var index = this._cookie_dict[domain].runtimes.indexOf(rt_id);
            this._cookie_dict[domain].runtimes.splice(index,1);
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

  this._request_runtime_details = function(rt_object) {
    var script = "return JSON.stringify({hostname: location.hostname || '', pathname: location.pathname || ''})";
    var tag = tagManager.set_callback(this, this._handle_get_domain,[rt_object.rt_id]);
    services['ecmascript-debugger'].requestEval(tag,[rt_object.rt_id, 0, 0, script]);
  }

  this._refetch = function() {
    for (var rt_id in this._rts) {
      this._rts[rt_id].get_domain_is_pending = true;
      this._request_runtime_details(this._rts[rt_id]);
    };
  }

  this._handle_get_domain = function(status, message, rt_id)
  {
    var data = JSON.parse(message[2]);
    var hostname = data.hostname;
    var pathname = data.pathname;
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
      context._clean_domains_and_ask_for_cookies.call(context,context._rts)
    })(this);
  }

  this._clean_domains_and_ask_for_cookies = function(runtime_list)
  {
    // check this._cookies for domains that aren't in any runtime anymore, modifies "this._cookies" directly
    this._clean_domain_list(this._cookie_dict, runtime_list);
    // go over runtimes and ask for cookies once per domain
    for (var str_rt_id in runtime_list)
    {
      var runtime = runtime_list[str_rt_id];
      var rt_domain = runtime.hostname;
      var rt_pathname = runtime.pathname;
      if(rt_domain) // avoids "" values occuring on opera:* pages for example
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
    }
  }

  this._handle_cookies = function(status, message, domain, path)
  {
    this._cookie_dict[domain+path].get_cookies_is_pending=false;
    if(message.length > 0)
    {
      var cookies = message[0];
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
    window.views.cookie_manager.update();
  };

  this._handle_changed_cookies = function(status, message)
  {
    window.views.cookie_manager._refetch();
  };

  this._init = function(id, update_event_name)
  {
    window.messages.addListener('active-tab', this._on_active_tab.bind(this));
    this.init(id, name, container_class);
  };

  // Helpers
  this._clean_domain_list = function(cookies, runtime_list)
  {
    for (var domain in cookies)
    {
      var was_found_in_runtime = false;
      for (var rtid in runtime_list)
      {
        if(runtime_list[rtid].domain === domain)
        {
          was_found_in_runtime = true;
          break;
        }
      };
      if(!was_found_in_runtime)
      {
        delete cookies[domain];
      }
    };
  }
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
            objectref: current_cookie.domain + "/" + current_cookie.path + current_cookie.name + (parseInt(Math.random()*99999)),
            runtimes:  domaincookies.runtimes
          };
          for (var key in current_cookie) {
            flattened_cookie[key] = current_cookie[key];
          };
          flattened_cookies.push(flattened_cookie);
        };
      }
    }
    return flattened_cookies;
  }
  // End Helpers
  this._init(id, name);
};

cls.CookieManagerView.prototype = ViewBase;
