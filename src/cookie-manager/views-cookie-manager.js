﻿window.cls || (window.cls = {});

cls.CookieManagerView = function(id, name, container_class)
{
  this._cookies = {};
  this._rts = {};
  this.createView = function(container)
  {
    var cookieData = [];
    for (var domain in this._cookies)
    {
      var domains_cookies = this._cookies[domain];
      if (domains_cookies.cookie_list)
      {
        for (var i=0; i < domains_cookies.cookie_list.length ;i++)
        {
          var current_cookie = domains_cookies.cookie_list[i];
          cookieData.push({
            runtimes:      domains_cookies.runtimes,
            host:          domains_cookies.host,
            hostname:      domains_cookies.hostname,
            domain:        current_cookie.domain,
            path:          current_cookie.path,
            name:          current_cookie.name,
            value:         current_cookie.value,
            expires:       current_cookie.expires,
            isSecure:      current_cookie.isSecure,
            isHTTPOnly:    current_cookie.isHTTPOnly
          });
        };
        // Add button that removes cookies of this domain
        // render_array.push(["button","RemoveCookiesOfDomain", "href", "#", "handler", "cookiemanager-delete-domain-cookies"]);
      }
    }
    
    var tabledef = {
      columns: {
        runtimes: {
          label: "Runtimes",
          getter: function(obj) {
            var str="";
            for (var i=0; i < obj.runtimes.length; i++) {
              str += obj.runtimes[i];
              if(i+1 < obj.runtimes.length)
              {
                str += ", ";
              }
            };
            return str;
          }
        },
        host: {
          label: "Host"
        },
        hostname: {
          label: "Hostname"
        },
        domain: {
          label: "Domain"
        },
        path: {
          label: "Path",
          getter: function(obj) { return "/"+obj.path; }
        },
        name: {
          label: "Name"
        },
        value: {
          label: "Value"
        },
        expires: {
          label: "Expires",
          getter: function(obj) {
            var parsedDate=new Date(obj.expires*1000);
            if(new Date().getTime() < parsedDate.getTime())
            {
              return parsedDate.toUTCString();
            }
            return "(when session is closed)";
          },
          sorter: function(obj1, obj2) {
            return obj1.expires < obj2.expires;
          }
        },
        isSecure: {
          label: "isSecure",
          getter: function(obj) { return ""+obj.isSecure; }
        },
        isHTTPOnly: {
          label: "isHTTPOnly",
          getter: function(obj) { return ""+obj.isHTTPOnly; }
        }
      }
    }
    container.clearAndRender(new SortableTable(tabledef, cookieData).render());
    
    // Add clear button
    container.render(["button","RemoveAllCookies", "href", "#", "handler", "cookiemanager-delete-all"]);
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
    
    // console.log("--- msg.activeTab",msg.activeTab);
    for (var i=0; i < msg.activeTab.length; i++)
    {
      var rt_id = msg.activeTab[i];
      if(!this._rts[rt_id])
      {
        this._rts[rt_id]={rt_id: rt_id, get_domain_is_pending: true};
        // console.log("added rt ",rt_id);
      }
      var script = "return JSON.stringify({host: location.host, hostname: location.hostname})";
      var tag = tagManager.set_callback(this, this._handle_get_domain,[rt_id]);
      services['ecmascript-debugger'].requestEval(tag,[rt_id, 0, 0, script]);
    };
  };
  
  this._handle_get_domain = function(status, message, rt_id)
  {
    var status = message[0];
    var type = message[1];
    
    var data = JSON.parse(message[2]);
    var host = data.host;
    var hostname = data.hostname;

    this._rts[rt_id].get_domain_is_pending = false;
    this._rts[rt_id].hostname = hostname;
    this._rts[rt_id].host = host;
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
      if(rt_domain) // avoids "" values occuring on opera:* pages for example
      {
        if(!this._cookies[rt_domain])
        {
          this._cookies[rt_domain] = {
            runtimes: [runtime.rt_id],
            host: runtime.host,
            hostname: runtime.hostname,
          }
        }
        else
        {
          if(this._cookies[rt_domain].runtimes.indexOf(runtime.rt_id) === -1)
          {
            this._cookies[rt_domain].runtimes.push(runtime.rt_id);
          }
        }
        
        // avoid repeating cookie requests for domains being in more than one runtime
        if(!this._cookies[rt_domain].get_cookies_is_pending)
        {
          this._cookies[rt_domain].get_cookies_is_pending = true;
          var tag = tagManager.set_callback(this, this._handle_cookies,[rt_domain]);
          services['cookie-manager'].requestGetCookie(tag,[rt_domain]);
        }
      }
    }
  }
  
  this._handle_cookies = function(status, message, domain)
  {
    this._cookies[domain].get_cookies_is_pending=false;
    if(message.length > 0)
    {
      var cookies = message[0];
      this._cookies[domain].cookie_list=[];
      for (var i=0; i < cookies.length; i++) {
        var cookie_info = cookies[i];
        this._cookies[domain].cookie_list.push({
          domain:     cookie_info[0],
          path:       cookie_info[1],
          name:       cookie_info[2],
          value:      cookie_info[3],
          expires:    cookie_info[4],
          isSecure:   cookie_info[5],
          isHTTPOnly: cookie_info[6]
        });
      };
      window.views.cookie_manager.update();
    }
  };
  
  this._handle_removed_cookies = function(status, message, domain)
  {
    // console.log("_handle_removed_cookies",status,message,domain);
    delete window.views.cookie_manager._cookies[domain];
    window.views.cookie_manager.update();
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
