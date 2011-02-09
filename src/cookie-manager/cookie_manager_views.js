window.cls || (window.cls = {});

cls.CookieManagerView = function(id, name, container_class, service_version)
{
  this.service_version = service_version;
  this._cookie_dict = {};
  this.flattened_cookies = [];
  this._rts = {};
  this._tabledef = {
    groups: {
      hostandpath: {
        label:   "Host and path",
        grouper: function(obj) {
          return views.cookie_manager._rts[obj.runtimes[0]].hostname + window.views.cookie_manager._rts[obj.runtimes[0]].pathname;
        },
        renderer: function(groupvalue, obj) {
          var obj = obj[0];
          var runtime = window.views.cookie_manager._rts[obj.runtimes[0]];
          return window.templates.cookie_manager.hostname_group_render(runtime);
        }
      }
    },
    column_order: ["domain", "name", "value", "path", "expires", "isSecure", "isHTTPOnly"],
    idgetter: function(res) { return res.objectref },
    columns: {
      domain: {
        label:    ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_DOMAIN,
        classname: "col_domain",
        renderer: function(obj) {
          if(obj.is_runtimes_placeholder)
          {
            return;
          }
          if(obj.domain)
          {
            return window.templates.cookie_manager.editable_domain(obj.runtimes[0], window.views.cookie_manager._rts, obj.domain);
          }
          return window.templates.cookie_manager.unknown_value();
        },
        summer: function(values, groupname, getter) {
          return ["button", "Add Cookie", "class", "add_cookie_button", "handler", "cookiemanager-add-cookie-row"];
        }
      },
      name: {
        label:    ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_NAME,
        classname: "col_name",
        renderer: function(obj) {
          if(obj.is_runtimes_placeholder)
          {
            return;
          }
          return window.templates.cookie_manager.editable_name(obj.name);
        }
      },
      value: {
        label:    ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_VALUE,
        classname: "col_value",
        renderer: function(obj) {
          if(obj.is_runtimes_placeholder)
          {
            return;
          }
          return window.templates.cookie_manager.editable_value(obj.value);
        }
      },
      path: {
        label:    ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_PATH,
        classname: "col_path",
        renderer: function(obj) {
          if(obj.is_runtimes_placeholder)
          {
            return;
          }
          if(typeof obj.path === "string")
          {
            return window.templates.cookie_manager.editable_path(obj.path);
          }
          return window.templates.cookie_manager.unknown_value();
        }
      },
      expires: {
        label:    ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_EXPIRES,
        classname: "col_expires",
        renderer: function(obj) {
          if(obj.is_runtimes_placeholder)
          {
            return;
          }
          if(typeof obj.expires === "number")
          {
            return window.templates.cookie_manager.editable_expires(obj.expires, obj.objectref);
          }
          return window.templates.cookie_manager.unknown_value();
        }
      },
      isSecure: {
        label:    window.templates.cookie_manager.wrap_ellipsis(ui_strings.S_LABEL_COOKIE_MANAGER_SECURE_CONNECTIONS_ONLY),
        classname: "col_secure",
        renderer: function(obj) {
          if(obj.is_runtimes_placeholder)
          {
            return;
          }
          if(typeof obj.isSecure === "number")
          {
            return obj.isSecure? "Yes":"";
          }
          return window.templates.cookie_manager.unknown_value();
        }
      },
      isHTTPOnly: {
        label:    window.templates.cookie_manager.wrap_ellipsis(ui_strings.S_LABEL_COOKIE_MANAGER_HTTP_ONLY),
        classname: "col_httponly",
        renderer: function(obj) {
          if(obj.is_runtimes_placeholder)
          {
            return;
          }
          if(typeof obj.isHTTPOnly === "number")
          {
            return obj.isHTTPOnly? "Yes":"";
          }
          return window.templates.cookie_manager.unknown_value();
        }
      }
    }
  };
  this.createView = function(container)
  {
    container.setAttribute("handler", "cookiemanager-container");
    container.setAttribute("data-menu", "cookie_refetch");
    var contextmenu = ContextMenu.get_instance();
    contextmenu.register("cookie_refetch", [
      {
        callback: (function(context){
          return function(){
            return [
              {
                label: "Refresh",
                handler: function(){context.refetch()}
              }
            ]
          }
        })(this)
      }
    ]);
    this.flattened_cookies = this._flatten_cookies(this._cookie_dict, this._rts);
    if(!this._sortable_table)
    {
      this._sortable_table = new SortableTable(this._tabledef, this.flattened_cookies, null, "domain", "hostandpath", true);
      this._sortable_table.add_listener("before-render", this._before_table_render.bind(this, container));
      this._sortable_table.add_listener("after-render", this._after_table_render.bind(this, container));
    }
    else
    {
      this._sortable_table.data = this.flattened_cookies;
    }
    if(!this._update_expiry_interval)
    {
      this._update_expiry_interval = setInterval(this._update_expiry, 15000);
    }
    this._before_table_render(container);
    this._table_container = container.clearAndRender(["div",this._sortable_table.render(),"class","table_container"]);
    this._after_table_render(container);
  };

  this._before_table_render = function(container)
  {
    // save selection
    var selection = document.querySelectorAll(".sortable-table .selected");
    this._restore_selection = this._restore_selection || [];
    for (var i=0; i < selection.length; i++) {
      this._restore_selection.push(selection[i].getAttribute("data-object-id"));
    };
  }

  this._after_table_render = function(container)
  {
    this._update_expiry();
    // restore selection
    if(this._restore_selection)
    {
      for (var i=0; i < this._restore_selection.length; i++) {
        var objectref = this._restore_selection[i];
        var elem = container.querySelector("[data-object-id='"+objectref+"']");
        if(elem)
        {
          elem.addClass("selected");
        }
      };
      this._restore_selection = null;
    }
    // context menus
    var contextmenu = ContextMenu.get_instance();
    // add delete cookie context menu per tr
    this._table_elem = this._table_container.firstChild;
    for(var i=0; i < this._table_elem.childNodes.length; i++)
    {
      this._table_elem.childNodes[i].setAttribute("data-menu", "cookie_context");
    }
    var cookie_row_context = [
      {
        callback: function(event, target)
        {
          window.views.cookie_manager.check_to_exit_edit_mode(event, target);
          var row = target;
          while(row.nodeName !== "tr" || !row.parentNode) // todo: remove when it's fixed on menus
          {
            row = row.parentNode;
          }
          var options = [];
          var cookie_obj;
          // if row has an object-id, add edit and remove options
          var objectref = row.getAttribute("data-object-id");
          if(objectref)
          {
            // row represents a cookie, so it can be selected
            window.views.cookie_manager.select_row(event, row);
          }
          var selection = document.querySelectorAll(".sortable-table .selected");
          var selected_cookie_objects = [];
          for (var i=0; i < selection.length; i++) {
            var sel_cookie_obj = window.views.cookie_manager.get_cookie_by_objectref(selection[i].getAttribute("data-object-id"));
            selected_cookie_objects.push(sel_cookie_obj);
          };

          if(selected_cookie_objects.length === 1)
          {
            // Add cookie
            options.push(
              {
                label: "Add cookie",
                handler: function() {
                  // todo: add runtime
                  var runtime = selected_cookie_objects[0].runtimes[0];
                  var inserted = window.views.cookie_manager.insert_add_cookie_row(row, runtime);
                  window.views.cookie_manager.select_row(null, inserted);
                }
              }
            );
            // single selection
            var sel_cookie_obj = selected_cookie_objects[0];
            if(sel_cookie_obj.is_editable)
            {
              options.push(
                {
                  label: "Edit cookie",
                  handler: function() {
                    window.views.cookie_manager.enter_edit_mode(sel_cookie_obj.objectref);
                  }
                }
              );
            }
            if(sel_cookie_obj.is_removable)
            {
              options.push(
                {
                  label: "Remove cookie",
                  handler: function() {
                    window.views.cookie_manager.remove_cookie_by_objectref(sel_cookie_obj.objectref);
                  }
                }
              );
            }
            // Add "Remove all from domain-and-path"
            var runtime = window.views.cookie_manager._rts[sel_cookie_obj.runtimes[0]];
            options.push(
              {
                label: "Remove cookies of " + runtime.hostname + runtime.pathname,
                handler: (function(runtime_id){
                  return function() {
                    for (var i=0; i < window.views.cookie_manager.flattened_cookies.length; i++) {
                      var cookie = window.views.cookie_manager.flattened_cookies[i];
                      if(cookie.runtimes.indexOf(runtime_id) > -1)
                      {
                        window.views.cookie_manager.remove_cookie_by_objectref(cookie.objectref);
                      }
                    };
                  }
                })(runtime.rt_id)
              }
            );
          }
          else
          {
            // multiple selection
            var removable_cookies = [];
            for (var j=0; j < selected_cookie_objects.length; j++) {
              if(selected_cookie_objects[j].is_removable)
              {
                removable_cookies.push(selected_cookie_objects[j]);
              }
            };
            if(removable_cookies.length === 1)
            {
              options.push(
                {
                  label: "Remove cookie "+(removable_cookies[0].name || ""),
                  handler: function() {
                    window.views.cookie_manager.remove_cookie_by_objectref(removable_cookies[0].objectref);
                  }
                }
              );
            }
            else
            {
              options.push(
                {
                  label: "Remove selected cookies",
                  handler: (function(cookie_list) {
                    return function()
                    {
                      for (var i=0; i < cookie_list.length; i++)
                      {
                        window.views.cookie_manager.remove_cookie_by_objectref(cookie_list[i].objectref);
                      }
                    }
                  })(removable_cookies)
                }
              );
            }
          }
          return options;
        }
      }
    ];
    contextmenu.register("cookie_context", cookie_row_context);

    // select and dbl-click to edit
    var rows = container.querySelectorAll("tr[data-object-id]");
    for (var i=0; i < rows.length; i++) {
      rows[i].setAttribute("handler", "cookiemanager-row-select");
      if(this.get_cookie_by_objectref(rows[i].getAttribute("data-object-id")).is_editable)
      {
        rows[i].setAttribute("edit-handler", "cookiemanager-init-edit-mode");
      }
    };
  }

  this._update_expiry = function()
  {
    for (var i=0; i < window.views.cookie_manager.flattened_cookies.length; i++)
    {
      var obj = window.views.cookie_manager.flattened_cookies[i];
      var elem = document.getElementById("expires_container_"+obj.objectref);
      if(elem)
      {
        if(new Date().getTime() < new Date(obj.expires*1000))
        {
          var fuzzy_date = function(date)
          {
            var compare_date = new Date();
            var diff = date.getTime() - compare_date.getTime();
            var in_sec     = diff / 1000;
            var in_min     = in_sec / 60;
            var in_5_min   = in_min / 20;
            var in_hours   = in_min / 60;
            var in_days    = in_hours / 24;
            var in_weeks   = in_days / 7;
            var in_months  = in_weeks / 4.3;
            var in_years   = in_months / 12;

            if(in_sec < 60)
              return "< 1 minute";
            else if (Math.round(in_min) === 1)
              return "In " + Math.round(in_min)        +" minute";
            else if (in_min < 15)
              return "In " + Math.round(in_min)        + " minutes";
            else if (in_5_min < 11)
              return "In " + Math.round(in_5_min) * 5  + " minutes";

            else if (Math.round(in_hours) === 1)
              return "In " + Math.round(in_hours)      + " hour";
            else if (in_hours < 23)
              return "In " + Math.round(in_hours)      + " hours";

            else if (Math.round(in_days) === 1)
              return                                     "Tomorrow";
            else if (in_days < 7)
              return "In " + Math.round(in_days)       + " days";

            else if (Math.round(in_weeks) === 1)
              return "In " + Math.round(in_weeks)      + " week";
            else if (in_weeks < 4.3)
              return "In " + Math.round(in_weeks)      + " weeks";

            else if (Math.round(in_months) === 1)
              return "In " + Math.round(in_months)     + " month";
            else if (in_months < 11)
              return "In " + Math.round(in_months)     + " months";

            else if (Math.round(in_years) === 1)
              return "In " + Math.round(in_years)      + " year";
            else
              return "In " + Math.round(in_years)      + " years";
          };
          elem.textContent = fuzzy_date(new Date(obj.expires*1000));
        }
        else
        {
          elem.clearAndRender(window.templates.cookie_manager.expired_value());
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

  this.select_row = function(event, elem)
  {
    var event = event || {};
    var was_selected = elem.hasClass("selected");
    var is_in_edit_mode = elem.hasClass("edit_mode");
    // unselect everything, as long as
    //   not doing multiple selection. that's when:
    //     cmd / ctrl key is used
    //     more than 1 item selected and event is a right-click
    //   not currently editing this row
    var selection = document.querySelectorAll(".sortable-table .selected");
    if(!( event.ctrlKey || (event.button === 2 && selection.length > 1) ))
    {
      for (var i=0; i < selection.length; i++) {
        selection[i].removeClass("selected");
      };
    }
    elem.addClass("selected");
  };

  this.insert_add_cookie_row = function(row, runtime)
  {
    var templ = document.documentElement.render(window.templates.cookie_manager.add_cookie_row(runtime, window.views.cookie_manager._rts));
    var inserted = row.parentElement.insertBefore(templ, row);
    inserted.querySelector("[name=name]").focus();
    return inserted;
  }

  this._on_active_tab = function(msg)
  {
    // cleanup runtimes directory
    for(var item in this._rts)
    {
      // item is a string, rt_id is a number which can now be compared with what's in msg.runtimes_with_dom
      var rt_id = this._rts[item].rt_id;
      if(msg.runtimes_with_dom.indexOf(rt_id) === -1)
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
    const STATUS = 0;
    const DATA = 2;
    if(status === 0 && message[STATUS] == "completed")
    {
      var parsed_data = JSON.parse(message[DATA]);
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
    }
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
    if(status === 0)
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
            value:      decodeURIComponent(cookie_info[3]),
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
    }
    window.views.cookie_manager.update();
  };

  this._handle_js_retrieved_cookies = function(status, message, domain, path)
  {
    const STATUS = 0;
    const DATA = 2;
    if(status === 0 && message[STATUS] == "completed")
    {
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
    }
  };

  this.handle_changed_cookies = function(status, message)
  {
    window.views.cookie_manager.refetch();
  };

  this.enter_edit_mode = function(objectref, event)
  {
    var table_elem = document.querySelector(".sortable-table");
    var sortable_table = ObjectRegistry.get_instance().get_object(table_elem.getAttribute("data-object-id"));
    sortable_table.restore_columns();
    var row = document.querySelector(".sortable-table tr[data-object-id='"+objectref+"']").addClass("edit_mode");
    this.select_row(event, row);
    // Todo: focus input in clicked td if applicable
  }

  this.check_to_exit_edit_mode = function(event, target)
  {
    if(document.querySelector(".edit_mode"))
    {
      // find out if target is within some .edit_mode node. don't exit then.
      var walk_up = target;
      while(walk_up)
      {
        if(walk_up.hasClass("edit_mode"))
        {
          return;
        }
        walk_up = walk_up.parentElement;
      }
      this.exit_edit_and_save();
    }
  }

  this.exit_edit_and_save = function()
  {
    var edit_tr = document.querySelector("tr.edit_mode");
    if(edit_tr)
    {
      edit_tr.removeClass("edit_mode");
      var name    = edit_tr.querySelector("[name=name]").value.trim();
      var value   = edit_tr.querySelector("[name=value]").value;
      var expires = new Date(edit_tr.querySelector("[name=expires]").value).getTime();
      var path    = edit_tr.querySelector("[name=path]").value.trim();
      var runtime = parseInt(edit_tr.querySelector("[name=add_cookie_runtime]").value.split(",")[0]);

      var cookie;
      var object_id = edit_tr.getAttribute("data-object-id");
      if(object_id)
      {
        cookie = window.views.cookie_manager.get_cookie_by_objectref(object_id);
      }
      // check if unmodified
      // fixme: the cookie.runtimes check should check if the hostname of that rt is actually correct,
      // not is the id matches. the following check finds more differences then it should.
      if(cookie &&
          (
            name === cookie.name &&
            value === cookie.value &&
            expires === new Date(cookie.expires*1000).getTime() &&
            path === cookie.path &&
            cookie.runtimes.indexOf(runtime) > -1
          )
      )
      {
        return;
      }
      /* // dbg
      if(cookie)
      {
        console.log("no old cookie, or old cookie modified.");
        if(name !== cookie.name)
          console.log("NAME CHANGED ","\n"+name, "\n"+cookie.name);
        if(value !== cookie.value)
          console.log("VALUE CHANGED","\n"+value,"\n"+cookie.value);
        if(expires !== new Date(cookie.expires*1000).getTime())
          console.log("EXPIRY CHANGED", "\n"+expires, "\n"+new Date(cookie.expires*1000).getTime());
        if(path !== cookie.path)
          console.log("PATH CHANGED", "\n"+path, "\n"+cookie.path);
        if(cookie.runtimes.indexOf(runtime) === -1)
          console.log("RUNTIME CHANGED", "\n"+cookie.runtimes, "\n"+runtime);
      }
      end dbg */

      // remove old cookie
      if(cookie)
      {
        window.views.cookie_manager.remove_cookie_by_objectref(cookie.objectref, true);
      }
      // and add modified / new
      var add_cookie_script = 'document.cookie="' + name + '=' + encodeURIComponent(value);
      if(expires) // in case of 0 value the "expires" value should not be written, represents "Session" value
      {
        add_cookie_script += '; expires='+ (new Date(expires).toUTCString());
      }
      add_cookie_script += '; path=' + '/' + path + '"';
      // select changed / created cookie
      this._restore_selection = [
        this._create_objectref(
          {
            domain: this._rts[runtime].hostname,
            name: name,
            value: value,
            path: path
          },
          runtime
        )
      ];
      var script = add_cookie_script;
      var tag = tagManager.set_callback(this, window.views.cookie_manager.handle_changed_cookies, [runtime]);
      services['ecmascript-debugger'].requestEval(tag,[runtime, 0, 0, script]);
    }
  }

  this._init = function(id, update_event_name)
  {
    window.messages.addListener('active-tab', this._on_active_tab.bind(this));
    this.init(id, name, container_class);
  };

  // Helpers
  this._create_objectref = function(cookie, runtimes)
  {
    return cookie.domain + "/" + cookie.path + "/" + cookie.name + "/" + (runtimes || "");
  };
  
  this._flatten_cookies = function(cookies, runtimes)
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
            objectref:    this._create_objectref(current_cookie, domaincookies.runtimes),
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
                cookie.domain != runtimes[domaincookies.runtimes[0]].hostname
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
      else
      {
        // There are no cookies for this domain/path. The group needs to be shown anyhow.
        flattened_cookies.push({
          runtimes:                domaincookies.runtimes,
          objectref:               ""+parseInt(Math.random()*99999),
          is_runtimes_placeholder: true
        });
      }
    }
    return flattened_cookies;
  };

  this.get_cookie_by_objectref = function(objectref)
  {
    for (var i=0; i < window.views.cookie_manager.flattened_cookies.length; i++) {
      if(window.views.cookie_manager.flattened_cookies[i].objectref === objectref)
      {
        return window.views.cookie_manager.flattened_cookies[i];
      }
    };
  }

  this.remove_cookie_by_objectref = function(objectref, avoid_refresh)
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
        var tag;
        if(!avoid_refresh)
        {
          tag = tagManager.set_callback(this, this.handle_changed_cookies, []);
        }
        services['cookie-manager'].requestRemoveCookie(tag,[domain, path, cookie.name]);
      }
    }
  };

  this._is_min_version = function(compare_version)
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

  // End Helpers
  this._init(id, name);
};

cls.CookieManagerView.prototype = ViewBase;
