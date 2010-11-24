window.cls || (window.cls = {});

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
            runtimes: domains_cookies.runtimes,
            displaydomain: current_cookie.domain,
            path: "/"+current_cookie.path,
            name: current_cookie.name,
            value: current_cookie.value,
            expires: current_cookie.expires,
            isSecure: current_cookie.isSecure,
            isHTTPOnly: current_cookie.isHTTPOnly
          });
        };
        // Add button that removes cookies of this domain
        // render_array.push(["button","RemoveCookiesOfDomain", "href", "#", "handler", "cookiemanager-delete-domain-cookies"]);
      }
    }
    
    var tabledef = {
      columns: {
        displaydomain: {
          label: "Domain"
        },
        /* originaldomain: {
          label: "Domain"
        }, */
        runtimes: {
          label: "Runtimes",
          getter: function(obj) { return JSON.stringify(obj.runtimes) }
        },
        path: {
          label: "Path"
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
          label: "isSecure"
        },
        isHTTPOnly: {
          label: "isHTTPOnly"
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
      var rt_id = this._rts[item].rt_id; // item is a stringed number, rt_id is a number which can now be compared with what's in msg.activeTab and potentially this._cookies[domain].runtimes
      if(msg.activeTab.indexOf(rt_id) === -1)
      {
        // runtime was not active and is to be removed from this._rts
        // console.log("removing rt ",rt_id);
        delete this._rts[rt_id];
        
        // loop over existing cookies to remove the rt_id from the runtimes of each
        for(var domain in this._cookies)
        {
          if(this._cookies[domain].runtimes && (this._cookies[domain].runtimes.indexOf(rt_id) !== -1))
          {
            var index = this._cookies[domain].runtimes.indexOf(rt_id);
            this._cookies[domain].runtimes.splice(index,1);
            // todo: check if there are no runtimes left for this cookie and remove the object if that's needed.
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
      var script = "return location.hostname";
      var tag = tagManager.set_callback(this, this._handle_get_domain,[rt_id]);
      services['ecmascript-debugger'].requestEval(tag,[rt_id, 0, 0, script]);
    };
  };
  
  this._handle_get_domain = function(status,message,rt_id)
  {
    var status = message[0];
    var type = message[1];
    var domain = message[2];
    // console.log("done finding domain for ",rt_id,": ",domain);

    this._rts[rt_id].get_domain_is_pending = false;
    this._rts[rt_id].domain = domain;
    if(this._check_if_all_domains_are_available())
    {
      // check this._cookies for domains that aren't in any runtime anymore
      this._clean_domain_list();
      
      // request cookies
      for (var runtime_object_id in this._rts)
      {
        var request_cookie_for_rt_id = this._rts[runtime_object_id].rt_id;
        var rt_domain = this._rts[request_cookie_for_rt_id].domain;
        if(!this._cookies[rt_domain])
        {
          this._cookies[rt_domain] = {runtimes:[request_cookie_for_rt_id]}
        }
        else
        {
          if(this._cookies[rt_domain].runtimes.indexOf(request_cookie_for_rt_id) === -1)
          {
            this._cookies[rt_domain].runtimes.push(request_cookie_for_rt_id);
          }
        }
        
        // avoid repeating cookie requests for domains being in more than one runtime
        if(!this._cookies[rt_domain].get_cookies_is_pending)
        {
          // console.log("requesting cookies for domain",rt_domain);
          this._cookies[rt_domain].get_cookies_is_pending = true;
          var tag = tagManager.set_callback(this, this._handle_cookies,[rt_domain]);
          services['cookie-manager'].requestGetCookie(tag,[rt_domain]);
        }
      }
    }
  }
  
  this._handle_cookies = function(status,message,domain)
  {
    // console.log("received",message.length,"cookies for domain",domain);
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
  
  this._handle_removed_cookies = function(status,message,domain)
  {
    // console.log("_handle_removed_cookies",status,message,domain);
    delete window.views.cookie_manager._cookies[domain];
    window.views.cookie_manager.update();
  };
  
  /*
  eventHandlers.click["clickfunc"]=function(event,target)
  {
    console.log(event,target);
  }
  */
  this._init = function(id, update_event_name, title)
  {
    this.title = title;
    // this.is_setup = false;

    window.messages.addListener('active-tab', this._on_active_tab.bind(this));    
    this.init(id, name, container_class);
  };
  
  // Helpers
  this._check_if_all_domains_are_available = function()
  {
    var collected_all_domains=true;
    for (var check_id in this._rts)
    {
      if(this._rts[check_id].get_domain_is_pending)
      {
        collected_all_domains = false;
      }
    };
    return collected_all_domains;
  };
  
  this._clean_domain_list = function()
  {
    for (var checkdomain in this._cookies)
    {
      var was_found_in_runtime = false;
      for (var _tmp_rtid in this._rts)
      {
        if(this._rts[_tmp_rtid].domain === checkdomain)
        {
          was_found_in_runtime = true;
        }
      };
      if(!was_found_in_runtime)
      {
        delete this._cookies[checkdomain];
      }
    };
  }

  // End Helpers
  
  this._init(id, name, container_class);
};

cls.CookieManagerView.prototype = ViewBase;
