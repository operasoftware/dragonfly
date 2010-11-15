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
        if (!domains_cookies.isPending)
        {
          render_array.push(
            ["tr",
              ["td", ["h2",domain], "colspan","7"]
            ]
          );
          render_array.push(
            ["tr",
              ["th", "Domain"],
              ["th", "Path"],
              ["th","Name"],
              ["th","Value"],
              ["th","Expires"],
              ["th","isSecure"],
              ["th","isHTTPOnly"],
            "handler", "clickfunc"]
          );
          for (var i=0; i < domains_cookies.cookie_list.length ;i++)
          {
            var current_cookie = domains_cookies.cookie_list[i];
            render_array.push(
              ["tr",
                ["td",String(current_cookie.domain)],
                ["td",String("/"+current_cookie.path)],
                ["td",String(current_cookie.name)],
                ["td",String(current_cookie.value)],
                ["td",new Date(current_cookie.expires*1000).toUTCString()],
                ["td",String(current_cookie.isSecure)],
                ["td",String(current_cookie.isHTTPOnly)]
              ]
            )
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
    this._cookies={};
    
    // cleanup view
    window.views.cookie_manager.update();
    
    // console.log("--- msg.activeTab",msg.activeTab);
    for (var i=0; i < msg.activeTab.length; i++)
    {
      this._get_domain(msg.activeTab[i]);
    };
  };
  
  this._get_domain = function(rt_id)
  {
    var script = "return location.host";
    var tag = tagManager.set_callback(this, this._handle_get_domain,[rt_id]);
    services['ecmascript-debugger'].requestEval(tag,[rt_id, 0, 0, script]);
  }
  
  this._handle_get_domain = function(status,message,rt_id)
  {
    // console.log("handle_get_domain",status,message,rt_id);
    var status = message[0];
    var type = message[1];
    var domain = message[2];
    if(domain && (!this._cookies[domain] ||  !this._cookies[domain].isPending))
    {
      // console.log("asking for domain cookies of",domain);
      this._cookies[domain] = {isPending: true};
      var tag = tagManager.set_callback(this, this._handle_cookies,[rt_id,domain]);
      services['cookie-manager'].requestGetCookie(tag,[domain]);
    }
  }
  
  this._handle_cookies = function(status,message,rt_id,domain) {
    // console.log("handle_cookies",status,message,rt_id);
    if(message.length > 0) {
      var cookies = message[0];
      this._cookies[domain].isPending=false;
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
  }
  /*
  eventHandlers.click["clickfunc"]=function(event,target)
  {
    console.log(event,target);
  }
  */
  this._init = function(id, update_event_name, title)
  {
    this.update_event_name = update_event_name;
    this.title = title;
    this.is_setup = false;

    window.messages.addListener('active-tab', this._on_active_tab.bind(this));
    // messages.addListener('reset-state', this._on_reset_state.bind(this));
    
    this.init(id, name, container_class);
  };
  
  this._init(id, name, container_class);
};

cls.CookieManagerView.prototype = ViewBase;
