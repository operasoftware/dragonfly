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
        if (!domains_cookies.is_pending)
        {
          render_array.push(
            ["tr",
              ["td", ["h2",domain], "colspan", "7"]
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
              ["th", "isHTTPOnly"],
            "handler", "clickfunc"]
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
            render_array.push(row_array)
          };
        }
      };
      render_array=["table",render_array];
    }
    container.clearAndRender(render_array);
  };
  
  this._on_active_tab = function(msg)
  {
    // clear cookie dictionary
    // this._cookies={};
    
    // instead of clearing this on any change of runtimes, 
    // should look at what runtimes are added / removed and only update domains
    // regarding that.
    // most likely use case: iframe is added during runtime -> now causes all
    // cookies to be refetched. not cool.
    
    // clear runtimes dictionary
    this._rts={};
    
    // cleanup view
    // window.views.cookie_manager.update();
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
    
    // domain list first needs to complete, all collected, then cleaned up 
    // by removing domains from this._cookies when they are not in this._active_domains (?)
    this._rts[rt_id].get_domain_is_pending = false;
    this._rts[rt_id].domain = domain;
    console.log("stored domain:",domain,"type ",typeof domain);
    
    // Probably move the following to a seperate checkIfCollectedAllDomains func
    
    var collected_all_domains = true;
    for (var check_id in this._rts)
    {
      if(this._rts[check_id].get_domain_is_pending)
      {
        console.log("still waiting for domain of rt ",this._rts[check_id].rt_id);
        collected_all_domains = false;
      }
    };
    
    if(collected_all_domains)
    {
      console.log("collected_all_domains",this._rts);
      // check this._cookies for domains that aren't in any runtime anymore
      
      // maybe move the following check to a separate function to be able to return quicker
      
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
          console.log("not in runtime: ",checkdomain);
          delete this._cookies[checkdomain];
        }
        console.log("clead up cookie array:",this._cookies);
      };
      
      // request cookies, but only once per domain
      for (var requestcookiedomain in this._rts)
      {
        var domain = this._rts[requestcookiedomain].domain;
        if(domain && (!this._cookies[domain] ||  !this._cookies[domain].is_pending)) // no it's about cookies that can be pending..
        {
          console.log("asking for cookies for domain",domain);
          this._cookies[domain] = {is_pending: true};
          var tag = tagManager.set_callback(this, this._handle_cookies,[rt_id,domain]);
          services['cookie-manager'].requestGetCookie(tag,[domain]);
        }
        else {
          console.log("had already asked for cookies for domain OR domain is empty",domain);
        }
      }
    }
  }
  
  this._handle_cookies = function(status,message,rt_id,domain) {
    if(message.length > 0)
    {
      var cookies = message[0];
      this._cookies[domain].is_pending=false;
      this._cookies[domain].cookie_list=[];
      for (var i=0; i < cookies.length; i++) {
        var cookie_info = cookies[i];
        // console.log("GO name ",cookie_info[2],"expires ",cookie_info[4],"typeof expires ",(typeof cookie_info[4]));
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
        // console.log("added cookies. updated dictionary:",this._cookies);
      };
      window.views.cookie_manager.update();
    }
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
  
  this._init(id, name, container_class);
};

cls.CookieManagerView.prototype = ViewBase;
