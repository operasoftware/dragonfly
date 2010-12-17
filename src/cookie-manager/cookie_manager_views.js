window.cls || (window.cls = {});

cls.CookieManagerView = function(id, name, container_class)
{
  this._cookies = {};
  this._flattened_cookies = [];
  this._rts = {};
  this.createView = function(container)
  {
    this._flattened_cookies = [];
    for (var id in this._cookies)
    {
      var domains_cookies = this._cookies[id];
      if (domains_cookies.cookie_list)
      {
        for (var i=0; i < domains_cookies.cookie_list.length ;i++)
        {
          var current_cookie = domains_cookies.cookie_list[i];
          
          // Instead of creating a new cookie ob that just uses most of the old one,
          // info should probably just be added to it. When editing it, there should be only one list
          // that's globally accessible from actions.
          
          this._flattened_cookies.push({
            runtimes:      domains_cookies.runtimes,
            domain:        current_cookie.domain,
            path:          current_cookie.path,
            name:          current_cookie.name,
            value:         current_cookie.value,
            expires:       current_cookie.expires,
            isSecure:      current_cookie.isSecure,
            isHTTPOnly:    current_cookie.isHTTPOnly,
            objectref:     current_cookie.domain + "/" + current_cookie.path + current_cookie.name + (parseInt(Math.random()*99999))
          });
        };
      }
    }
    var tabledef = {
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
    }
    container.clearAndRender(new SortableTable(tabledef, this._flattened_cookies).render());
    
    var table = document.getElementsByClassName("cookie_manager")[0].getElementsByClassName("sortable-table")[0];
    var obj = ObjectRegistry.get_instance().get_object(table.getAttribute("data-object-id"));
    // group by host and path as that is what what was part of the actual query
    obj.group("hostandpath");
    table.re_render(obj.render());
    
    // render cookie adding
    container.render(window.templates.cookie_manager.add_cookie_form(this._rts));
    window.eventHandlers.change['cookiemanager-add-cookie-domain-select']();
    // render clear and update button. todo: move to where it always appears
    container.render(window.templates.cookie_manager.clear_and_update_button());
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
        for(var domain in this._cookies)
        {
          if(this._cookies[domain].runtimes && (this._cookies[domain].runtimes.indexOf(rt_id) !== -1))
          {
            var index = this._cookies[domain].runtimes.indexOf(rt_id);
            this._cookies[domain].runtimes.splice(index,1);
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
  
  this._update = function() {
    for (var rt_id in this._rts) {
      this._rts[rt_id].get_domain_is_pending = true;
      this._request_runtime_details(this._rts[rt_id]);
    };
  }
  
  this._handle_get_domain = function(status, message, rt_id)
  {
    var status = message[0];
    var type = message[1];
    
    var data = JSON.parse(message[2]);
    var hostname = data.hostname;
    var pathname = data.pathname;
    this._rts[rt_id].get_domain_is_pending = false;
    this._rts[rt_id].hostname = hostname;
    this._rts[rt_id].pathname = pathname;
    
    this._check_all_members_of_obj_to_be(this._rts, "get_domain_is_pending", false, this._clean_domains_and_ask_for_cookies);
  }
  
  this._clean_domains_and_ask_for_cookies = function(runtime_list)
  {
    // check this._cookies for domains that aren't in any runtime anymore, modifies "this._cookies" directly
    this._clean_domain_list(this._cookies, runtime_list);
    // go over runtimes and ask for cookies once per domain
    for (var str_rt_id in runtime_list)
    {
      var runtime = runtime_list[str_rt_id];
      var rt_domain = runtime.hostname;
      var rt_pathname = runtime.pathname;
      if(rt_domain) // avoids "" values occuring on opera:* pages for example
      {
        if(!this._cookies[rt_domain+rt_pathname])
        {
          this._cookies[rt_domain+rt_pathname] = {
            runtimes: [runtime.rt_id]
          }
        }
        else
        {
          if(this._cookies[rt_domain+rt_pathname].runtimes.indexOf(runtime.rt_id) === -1)
          {
            this._cookies[rt_domain+rt_pathname].runtimes.push(runtime.rt_id);
          }
        }
        
        // avoid repeating cookie requests for domains being in more than one runtime
        if(!this._cookies[rt_domain+rt_pathname].get_cookies_is_pending)
        {
          this._cookies[rt_domain+rt_pathname].get_cookies_is_pending = true;
          var tag = tagManager.set_callback(this, this._handle_cookies,[rt_domain,rt_pathname]);
          services['cookie-manager'].requestGetCookie(tag,[rt_domain,rt_pathname]);
        }
      }
    }
  }
  
  this._handle_cookies = function(status, message, domain, path)
  {
    this._cookies[domain+path].get_cookies_is_pending=false;
    if(message.length > 0)
    {
      var cookies = message[0];
      this._cookies[domain+path].cookie_list=[];
      for (var i=0; i < cookies.length; i++) {
        var cookie_info = cookies[i];
        this._cookies[domain+path].cookie_list.push({
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
    window.views.cookie_manager._update();
  };
  
  this._init = function(id, update_event_name, title)
  {
    this.title = title;
    window.messages.addListener('active-tab', this._on_active_tab.bind(this));    
    this.init(id, name, container_class);
  };
  
  // Helpers
  this._check_all_members_of_obj_to_be = function(list, member_name, val, callback)
  {
    // checks for all members of 'list' to have a member 'member_name'
    // with a value of 'val' and in that case calls 'callback' with 'list'
    var good_to_go = true;
    for (var iterator in list)
    {
      if(list[iterator][member_name] !== val)
      {
        good_to_go = false;
      }
    };
    if(good_to_go)
    {
      callback.call(this,list);
    }
  };
  
  this._clean_domain_list = function(cookies, runtime_list)
  {
    for (var checkdomain in cookies)
    {
      var was_found_in_runtime = false;
      for (var _tmp_rtid in runtime_list)
      {
        if(runtime_list[_tmp_rtid].domain === checkdomain)
        {
          was_found_in_runtime = true;
        }
      };
      if(!was_found_in_runtime)
      {
        delete cookies[checkdomain];
      }
    };
  }
  // End Helpers
  this._init(id, name, container_class);
};

cls.CookieManagerView.prototype = ViewBase;
