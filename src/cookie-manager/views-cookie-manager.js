window.cls || (window.cls = {});

cls.CookieManagerView = function(id, name, container_class)
{
  this._cookies = {};
  this._rts = {};
  this.createView = function(container)
  {
    var render_array = [];
    if (this._cookies)
    {
      for (var domain in this._cookies)
      {
        var domains_cookies = this._cookies[domain];
        if (domains_cookies.cookie_list)
        {
          render_array.push(
            ["tr",
              ["td", ["h2",domain], "colspan", "7"],
              "data-domain", domain,
              "class", "domain"
            ]
          );
          render_array.push(
            ["tr",
              ["th", "Domain"],
              ["th", "Path"],
              ["th", "Name"],
              ["th", "Value"],
              ["th", "Expires"],
              ["th", "isSecure"],
              ["th", "isHTTPOnly"]
            ]
          );
          var toggle_class=true;
          for (var i=0; i < domains_cookies.cookie_list.length ;i++)
          {
            var current_cookie = domains_cookies.cookie_list[i];
            var render_date;
            if(current_cookie.expires === 0) {
              render_date = "When session is closed";
            }
            else
            {
              render_date = new Date(current_cookie.expires*1000).toUTCString()
            }
            var row_array=["tr",
                ["td",String(current_cookie.domain)],
                ["td",String("/"+current_cookie.path)],
                ["td",String(current_cookie.name)],
                ["td",String(current_cookie.value)],
                ["td",render_date],
                ["td",String(Boolean(current_cookie.isSecure))],
                ["td",String(Boolean(current_cookie.isHTTPOnly))]
              ];
            if(toggle_class)
            {
              row_array.push("class","odd");
            }
            toggle_class=!toggle_class;
            render_array.push(row_array);
          };
          // Add button that removes cookies of this domain
          // Depends on CORE-34615
          // render_array.push(["button","RemoveCookiesOfDomain", "href", "#", "handler", "cookiemanager-delete-domain-cookies"]);
        }
      };
      render_array=["table",render_array];
    }
    container.clearAndRender(render_array);
    
    // Add clear button
    // Depends on CORE-34615
    // container.render(["button","RemoveAllCookies", "href", "#", "handler", "cookiemanager-delete-all"]);
  };
  
  this._on_active_tab = function(msg)
  {    
    // clear runtimes dictionary
    this._rts={};
    
    // cleanup view
    this.clearAllContainers();
    
    // console.log("--- msg.activeTab",msg.activeTab);
    for (var i=0; i < msg.activeTab.length; i++)
    {
      var rt_id = msg.activeTab[i];
      this._rts[rt_id]={rt_id: rt_id, get_domain_is_pending: true};
      var script = "return location.host";
      var tag = tagManager.set_callback(this, this._handle_get_domain,[rt_id]);
      services['ecmascript-debugger'].requestEval(tag,[rt_id, 0, 0, script]);
    };
  };
  
  this._handle_get_domain = function(status,message,rt_id)
  {
    // console.log("handle_get_domain",status,message,rt_id);
    var status = message[0];
    var type = message[1];
    var domain = message[2];
    
    this._rts[rt_id].get_domain_is_pending = false;
    this._rts[rt_id].domain = domain;
    
    if(this._check_if_all_domains_are_available())
    {
      // check this._cookies for domains that aren't in any runtime anymore
      this._clean_domain_list();
      
      // request cookies, but only once per domain
      for (var requestcookiedomain in this._rts)
      {
        var domain = this._rts[requestcookiedomain].domain;
        // avoid repeating cookie requests for domains being in more than one runtime
        if(domain && (!this._cookies[domain] ||  !this._cookies[domain].get_cookies_is_pending))
        {
          this._cookies[domain] = {get_cookies_is_pending: true};
          var tag = tagManager.set_callback(this, this._handle_cookies,[rt_id,domain]);
          services['cookie-manager'].requestGetCookie(tag,[domain]);
        }
      }
    }
  }
  
  this._handle_cookies = function(status,message,rt_id,domain)
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
          isHTTPOnly: cookie_info[6],
          size:       cookie_info[7]
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
