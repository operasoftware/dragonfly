window.cls || (window.cls = {});
cls.CookieManager || (cls.CookieManager = {});
cls.CookieManager["1.0"] || (cls.CookieManager["1.0"] = {});

cls.CookieManager.CookieManagerViewBase = function()
{
  this.createView = function(container){};
  this.insert_add_cookie_row = function(row, runtime){};
  this.enter_edit_mode = function(objectref, event){};
  this.check_to_exit_edit_mode = function(event, target){};
  this.exit_edit_and_save = function(){};

  this._init = function(id, name, container_class, data_reference)
  {
    this.data = data_reference;
    this._bound_update_expiry = this._update_expiry.bind(this);

    var contextmenu = ContextMenu.get_instance();
    contextmenu.register("cookie_refetch", [
      {
        callback: (function()
        {
          return [
            {
              label: ui_strings.S_LABEL_STORAGE_UPDATE,
              handler: (function(){ this.data.refetch() }).bind(this)
            }
          ]
        }).bind(this)
      }
    ]);

    contextmenu.register("cookie_context", [
      {
        callback: (function(event, target)
        {
          this.check_to_exit_edit_mode(event, target);
          var row = target;
          while(row.nodeName !== "tr" || !row.parentNode) // todo: remove when it's fixed on menus
          {
            row = row.parentNode;
          }
          // if row has an object-id, add edit and remove options
          var objectref = row.getAttribute("data-object-id");
          if(objectref)
          {
            // row represents a cookie, so it can be selected
            this.select_row(event, row);
          }
          var selection = this._table_elem.querySelectorAll(".selected");
          var selected_cookie_objects = [];
          for (var i=0; i < selection.length; i++) {
            var sel_cookie_obj = this.data.get_cookie_by_objectref(selection[i].getAttribute("data-object-id"));
            selected_cookie_objects.push(sel_cookie_obj);
          };

          var options = [
            {
              label: ui_strings.S_LABEL_COOKIE_MANAGER_ADD_COOKIE,
              handler: (function() {
                var runtime_id = selected_cookie_objects[0]._rt_id;
                var inserted = this.insert_add_cookie_row(row, runtime_id);
                this.select_row(null, inserted);
              }).bind(this)
            }
          ];
          if(selected_cookie_objects.length === 1)
          {
            var sel_cookie_obj = selected_cookie_objects[0];
            if(sel_cookie_obj._is_editable)
            {
              options.push(
                {
                  label: ui_strings.S_LABEL_COOKIE_MANAGER_EDIT_COOKIE,
                  handler: (function() { // TODO: check to remove binds and put sel_cookie_obj on the view instead
                    this.enter_edit_mode(sel_cookie_obj._objectref);
                  }).bind(this)
                }
              );
            }
            if(sel_cookie_obj._is_removable)
            {
              options.push(
                {
                  label: ui_strings.S_LABEL_COOKIE_MANAGER_REMOVE_COOKIE,
                  handler: (function() {
                    this.data.remove_cookie(sel_cookie_obj._objectref);
                  }).bind(this)
                }
              );
            }
            // Add "Remove all from domain-and-path"
            var runtime_id = sel_cookie_obj._rt_id;
            options.push(
              {
                // todo: would like to show the protocol too, would have to use sel_cookie_obj._rt_protocol + "://" though, but only for http / https cases
                label: ui_strings.S_LABEL_COOKIE_MANAGER_REMOVE_COOKIES_OF.replace(/%s/, sel_cookie_obj._rt_hostname + sel_cookie_obj._rt_path),
                handler: (function(runtime_id, context){
                  return function() {
                    var items = context.data.get_cookies();
                    for (var i=0; i < items.length; i++) {
                      var cookie = items[i];
                      if(cookie._rt_id == runtime_id)
                      {
                        context.data.remove_cookie(cookie._objectref);
                      }
                    };
                  }
                })(runtime_id, this)
              }
            );
          }
          else
          {
            // multiple selection
            var removable_cookies = [];
            for (var j=0; j < selected_cookie_objects.length; j++) {
              if(selected_cookie_objects[j]._is_removable)
              {
                removable_cookies.push(selected_cookie_objects[j]);
              }
            };
            if(removable_cookies.length === 1)
            {
              options.push(
                {
                  label: ui_strings.S_LABEL_COOKIE_MANAGER_REMOVE_COOKIE,
                  handler: (function() {
                    this.data.remove_cookie(removable_cookies[0]._objectref);
                  }).bind(this)
                }
              );
            }
            else
            {
              options.push(
                {
                  label: ui_strings.S_LABEL_COOKIE_MANAGER_REMOVE_COOKIES,
                  handler: (function(removable_cookies, context) {
                    return function()
                    {
                      for (var i=0; i < removable_cookies.length; i++)
                      {
                        context.data.remove_cookie(removable_cookies[i]._objectref);
                      }
                    }
                  })(removable_cookies, this)
                }
              );
            }
          }
          return options;
        }).bind(this)
      }
    ]);

    this._tabledef = {
      groups: {
        host_and_path: {
          label:   ui_strings.S_LABEL_COOKIE_MANAGER_GROUPER_HOST_AND_PATH,
          grouper: function(obj) {
            return obj._rt_hostname + obj._rt_path;
          },
          renderer: function(groupvalue, obj) {
            return window.templates.cookie_manager.hostname_group_render(obj[0]._rt_protocol, obj[0]._rt_hostname, obj[0]._rt_path);
          }
        }
      },
      column_order: ["domain", "name", "value", "path", "expires", "isSecure", "isHTTPOnly"],
      idgetter: function(res) { return res._objectref },
      columns: {
        domain: {
          label:    ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_DOMAIN,
          classname: "col_domain",
          renderer: this._domain_renderer.bind(this),
          summer: function(values, groupname, getter) {
            return ["button", "Add Cookie", "class", "add_cookie_button", "handler", "cookiemanager-add-cookie-row"];
          }
        },
        name: {
          label:    ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_NAME,
          classname: "col_name",
          renderer: function(obj) {
            if(obj._is_runtime_placeholder)
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
            if(obj._is_runtime_placeholder)
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
            if(obj._is_runtime_placeholder)
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
            if(obj._is_runtime_placeholder)
            {
              return;
            }
            if(typeof obj.expires === "number")
            {
              return window.templates.cookie_manager.editable_expires(obj.expires, obj._objectref);
            }
            return window.templates.cookie_manager.unknown_value();
          }
        },
        isSecure: {
          label:    window.templates.cookie_manager.wrap_ellipsis(ui_strings.S_LABEL_COOKIE_MANAGER_SECURE_CONNECTIONS_ONLY),
          classname: "col_secure",
          renderer: this._is_secure_renderer.bind(this)
        },
        isHTTPOnly: {
          label:    window.templates.cookie_manager.wrap_ellipsis(ui_strings.S_LABEL_COOKIE_MANAGER_HTTP_ONLY),
          classname: "col_httponly",
          renderer: this._is_http_only_renderer.bind(this)
        }
      }
    };
    this.sortby = "domain";
    this.groupby = "host_and_path";

    this.init(id, name, container_class);
  };

  this.createView = function(container)
  {
    this._container = container;
    container.setAttribute("handler", "cookiemanager-container");
    container.setAttribute("data-menu", "cookie_refetch");
    var storage_data = this.data.get_cookies();
    var sortby = this.sortby;
    var groupby = this.groupby;
    if(!this._sortable_table)
    {
      this._sortable_table = new SortableTable(this._tabledef, storage_data, null, sortby, groupby, true);
      this._sortable_table.add_listener("before-render", this._before_table_render.bind(this));
      this._sortable_table.add_listener("after-render", this._after_table_render.bind(this));
    }
    if(!this._update_expiry_interval)
    {
      this._update_expiry_interval = setInterval(this._bound_update_expiry, 15000);
    }
    this._sortable_table.data = storage_data;
    this._before_table_render();
    this._table_container = container.clearAndRender(["div", this._sortable_table.render(), "class", "table_container"]);
    this._table_elem = this._table_container.firstChild;
    this._after_table_render();
    window.messages.addListener("debug-context-selected", this._clear_container);
  };

  this.ondestroy = function()
  {
    delete this._container;
    if(this._update_expiry_interval)
    {
      this._update_expiry_interval = clearInterval(this._update_expiry_interval);
    }
  }

  this.select_row = function(event, elem) // public just towards actions
  {
    var event = event || {};
    /**
      * unselect everything while not doing multiple selection mode.
      * that's when:
      *   cmd / ctrl key is pressed
      *   OR
      *   more than 1 item is already selected and event is a right-click
      */
    var selection = this._table_elem.querySelectorAll(".selected");
    if(!( event.ctrlKey || (selection.length > 1 && event.button === 2) ))
    {
      for (var i=0; i < selection.length; i++) {
        selection[i].removeClass("selected");
      };
    }
    elem.addClass("selected");
  };

  this.insert_add_cookie_row = function(row, runtime)
  {
    var templ = document.documentElement.render(window.templates.cookie_manager.add_cookie_row(runtime, this.data._rts));
    var inserted = row.parentElement.insertBefore(templ, row);
    inserted.querySelector("[name=name]").focus();
    this.select_row(null, inserted);
    return inserted;
  }

  this.click_add_cookie_button = function(event, target)
  {
    this.check_to_exit_edit_mode(event, target);
    // find runtime the row relates to
    var row = target.parentElement.parentElement;
    var row_with_data_id = row.previousElementSibling;
    while(!row_with_data_id.getAttribute("data-object-id"))
    {
      row_with_data_id = row_with_data_id.previousElementSibling;
    }
    var objectref = row_with_data_id.getAttribute("data-object-id");
    var runtime_id = this.data.get_cookie_by_objectref(objectref)._rt_id;
    this.insert_add_cookie_row(row, runtime_id);
  }

  this.enter_edit_mode = function(objectref, event)
  {
    var table_elem = document.querySelector(".sortable-table");
    var sortable_table = ObjectRegistry.get_instance().get_object(table_elem.getAttribute("data-object-id"));
    sortable_table.restore_columns(table_elem);
    var row = document.querySelector(".sortable-table tr[data-object-id='"+objectref+"']").addClass("edit_mode");
    this.select_row(event, row);
    // Todo: focus input in clicked td if applicable
  }

  this.check_to_exit_edit_mode = function(event, target)
  {
    if(document.querySelector(".edit_mode") && !target.hasClass("add_cookie_button"))
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
    var edit_trs = document.querySelectorAll("tr.edit_mode");
    for (var i=0; i < edit_trs.length; i++) {
      var edit_tr = edit_trs[i];
      edit_tr.removeClass("edit_mode");

      var is_secure_input    = edit_tr.querySelector("[name=is_secure]");
      var is_http_only_input = edit_tr.querySelector("[name=is_http_only]");
      var runtime_elem       = edit_tr.querySelector("[name=add_cookie_runtime]");
      var domain_input       = edit_tr.querySelector("[name=domain]");

      var name         = edit_tr.querySelector("[name=name]").value.trim();
      var value        = edit_tr.querySelector("[name=value]").value;
      var expires      = new Date(edit_tr.querySelector("[name=expires]").value || 0).getTime();
      var path         = edit_tr.querySelector("[name=path]").value.trim();
      var is_secure    = !!(is_secure_input && is_secure_input.checked);
      var is_http_only = !!(is_http_only_input && is_http_only_input.checked);
      // "runtime" is val of [select] or [input type=hidden] (no add_cookie service)
      var runtime      = runtime_elem && parseInt(runtime_elem.value.split(",")[0]);
      // "domain" is val of [input] (with add_cookie service present), or runtimes .hostname
      var domain       = domain_input && domain_input.value.trim() || runtime && this.data._rts[runtime].hostname;

      var object_id = edit_tr.getAttribute("data-object-id");
      var old_cookie;
      if(object_id)
      {
        old_cookie = this.data.get_cookie_by_objectref(object_id);
        // check if unmodified
        if(old_cookie &&
          (
            name         === old_cookie.name &&
            value        === old_cookie.value &&
            expires      === new Date(old_cookie.expires*1000).getTime() &&
            path         === old_cookie.path &&
            is_secure    === old_cookie.isSecure &&
            is_http_only === old_cookie.isHTTPOnly &&
            domain       === (old_cookie.domain || old_cookie._rt_hostname)
          )
        )
        {
          return;
        }
      }

      if(domain && name)
      {
        var new_cookie = new cls.CookieManager.Cookie({
                           domain:         domain,
                           name:           name,
                           path:           path,
                           value:          value,
                           expires:        expires,
                           is_secure:      +is_secure,
                           is_http_only:   +is_http_only,
                           _rt_id: runtime 
                          }, this.data);

        if(!new_cookie._rt_id)
        {
          /**
            * Try to find runtime where this might end up to be able to highlight it. Using endsWith 
            * makes it work for subdomains, it can get the wrong one too, but chances are good
            * and it doesnt matter too much. Todo: Improve by making a runtimes list with those that fit.
            */
          for (var id in this.data._rts) {
            // check if runtime hostname endsWith cookie-domain val
            var hostname = this.data._rts[id].hostname;
            var last_index = hostname.lastIndexOf(new_cookie.domain);
            if(last_index !== -1 && last_index + new_cookie.domain.length == hostname.length)
            {
              new_cookie.runtime = this.data._rts[id].rt_id;
              break;
            }
          };
        }

        if(old_cookie)
        {
          // remove old_cookie, on finished add new cookie
          this.data.remove_cookie(old_cookie._objectref, this.data.set_cookie.bind(this.data, new_cookie));
        }
        else
        {
          this.data.set_cookie(new_cookie);
        }
      }
      else
      {
        // todo: missing required info, needs feedback in UI. will refetch and discard for now.
        this.data.refetch();
      }
    }
  }

  this._clear_container = function()
  {
    if(this._container)
    {
      this._container.innerHTML = "";
    }
  }

  this._before_table_render = function(message)
  {
    var message = message || {};
    // save selection
    if(this._table_elem)
    {
      var selection = this._table_elem.querySelectorAll(".selected");
      this._restore_selection = this._restore_selection || [];
      for (var i=0; i < selection.length; i++) {
        this._restore_selection.push(selection[i].getAttribute("data-object-id"));
      };
    }
  }

  this._after_table_render = function()
  {
    this._update_expiry();
    // restore selection
    if(this._restore_selection)
    {
      for (var i=0; i < this._restore_selection.length; i++) {
        var objectref = this._restore_selection[i];
        var elem = this._container.querySelector("[data-object-id='"+objectref+"']");
        if(elem)
        {
          elem.addClass("selected");
        }
      };
      this._restore_selection = null;
    }
    // add context menus per tr
    for(var i=0; i < this._table_elem.childNodes.length; i++)
    {
      this._table_elem.childNodes[i].setAttribute("data-menu", "cookie_context");
    }

    // select and dbl-click to edit
    var rows = this._container.querySelectorAll("tr[data-object-id]");
    for (var i=0; i < rows.length; i++) {
      rows[i].setAttribute("handler", "cookiemanager-row-select");
      var objectref = rows[i].getAttribute("data-object-id");
      // todo: find out why this sometimes doesn't work on startup
      // console.log("this.data",this.data,"this.data.get_cookie_by_objectref", this.data.get_cookie_by_objectref, "this.data.get_cookie_by_objectref(objectref)", this.data.get_cookie_by_objectref(objectref));
      if(this.data.get_cookie_by_objectref(objectref)._is_editable)
      {
        rows[i].setAttribute("edit-handler", "cookiemanager-init-edit-mode");
      }
      else
      {
        rows[i].addClass("non-editable");
      }
    };
  }

  this._fuzzy_date = function(date) // todo: move to templates?
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
      return ui_strings.COOKIE_MANAGER_SOONER_THEN_1_MINUTE;
    if (Math.round(in_min) === 1)
      return ui_strings.COOKIE_MANAGER_IN_1_MINUTE;
    if (in_min < 15)
      return ui_strings.COOKIE_MANAGER_IN_X_MINUTES.replace(/%s/, Math.round(in_min));
    if (in_5_min < 11)
      return ui_strings.COOKIE_MANAGER_IN_X_MINUTES.replace(/%s/, Math.round(in_5_min) * 5);

    if (Math.round(in_hours) === 1)
      return ui_strings.COOKIE_MANAGER_IN_1_HOUR;
    if (in_hours < 23)
      return ui_strings.COOKIE_MANAGER_IN_X_HOURS.replace(/%s/, Math.round(in_hours));

    if (Math.round(in_days) === 1)
      return ui_strings.COOKIE_MANAGER_TOMORROW;
    if (in_days < 7)
      return ui_strings.COOKIE_MANAGER_IN_X_DAYS.replace(/%s/, Math.round(in_days));

    if (Math.round(in_weeks) === 1)
      return ui_strings.COOKIE_MANAGER_IN_1_WEEK;
    if (in_weeks < 4.3)
      return ui_strings.COOKIE_MANAGER_IN_X_WEEKS.replace(/%s/, Math.round(in_weeks));

    if (Math.round(in_months) === 1)
      return ui_strings.COOKIE_MANAGER_IN_1_MONTH;
    if (in_months < 11)
      return ui_strings.COOKIE_MANAGER_IN_X_MONTHS.replace(/%s/, Math.round(in_months));

    if (Math.round(in_years) === 1)
      return ui_strings.COOKIE_MANAGER_IN_1_YEAR;
    return ui_strings.COOKIE_MANAGER_IN_X_YEARS.replace(/%s/, Math.round(in_years))
  };

  this._update_expiry = function()
  {
    var items = this.data.get_cookies();
    for (var i=0; i < items.length; i++)
    {
      var obj = items[i];
      var elem = document.getElementById("expires_container_"+obj._objectref);
      if(elem)
      {
        if(new Date().getTime() < new Date(obj.expires*1000))
        {
          elem.textContent = this._fuzzy_date(new Date(obj.expires*1000));
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

  // DEPENDEND ON SERVICE VERSION - those might get overwritten
  this._domain_renderer = function(obj)
  {
    if(obj._is_runtime_placeholder)
    {
      return;
    }
    if(obj.domain)
    {
      return window.templates.cookie_manager.editable_domain(obj._rt_id, this.data._rts, obj.domain);
    }
    return window.templates.cookie_manager.unknown_value();
  }

  this._is_secure_renderer = function(obj)
  {
    if(obj._is_runtime_placeholder)
    {
      return;
    }
    if(typeof obj.isSecure === "number")
    {
      return window.templates.cookie_manager.boolean_value(obj.isSecure);
    }
    return window.templates.cookie_manager.unknown_value();
  }

  this._is_http_only_renderer = function(obj)
  {
    if(obj._is_runtime_placeholder)
    {
      return;
    }
    if(typeof obj.isHTTPOnly === "number")
    {
      // this will depend on the service version, it gets editable with 1.1
      return window.templates.cookie_manager.boolean_value(obj.isHTTPOnly);
    }
    return window.templates.cookie_manager.unknown_value();
  }
  // END DEPENDEND ON SERVICE VERSION
};
cls.CookieManager.CookieManagerViewBase.prototype = ViewBase;

cls.CookieManager["1.0"].CookieManagerView = function(id, name, container_class, data_reference, service_version)
{
  var data = data_reference;
  if(typeof data_reference === "function")
  {
    data = new data_reference(service_version, this);
  }
  this._init(id, name, container_class, data);
}
cls.CookieManager["1.0"].CookieManagerView.prototype = new cls.CookieManager.CookieManagerViewBase();

cls.CookieManager["1.1"] || (cls.CookieManager["1.1"] = {});
cls.CookieManager["1.1"].CookieManagerView = function(id, name, container_class, data_reference, service_version)
{
  var data = data_reference;
  if(typeof data_reference === "function")
  {
    data = new data_reference(service_version, this);
  }

  this._domain_renderer = function(obj)
  {
    if(obj._is_runtime_placeholder)
    {
      return;
    }
    if(obj.domain)
    {
      return window.templates.cookie_manager.all_editable_domain(obj.domain);
    }
    return window.templates.cookie_manager.unknown_value();
  }

  this._is_secure_renderer = function(obj)
  {
    if(obj._is_runtime_placeholder)
    {
      return;
    }
    if(typeof obj.isSecure === "number")
    {
      return window.templates.cookie_manager.editable_secure(obj.isSecure);
    }
    return window.templates.cookie_manager.unknown_value();
  }

  this._is_http_only_renderer = function(obj)
  {
    if(obj._is_runtime_placeholder)
    {
      return;
    }
    if(typeof obj.isHTTPOnly === "number")
    {
      return window.templates.cookie_manager.editable_http_only(obj.isHTTPOnly);
    }
    return window.templates.cookie_manager.unknown_value();
  }

  this.insert_add_cookie_row = function(row, runtime)
  {
    var table_elem = document.querySelector(".sortable-table");
    var sortable_table = ObjectRegistry.get_instance().get_object(table_elem.getAttribute("data-object-id"));
    sortable_table.restore_columns(table_elem);

    var default_domain = this.data._rts[runtime].hostname;
    var templ = document.documentElement.render(window.templates.cookie_manager.add_cookie_row_all_editable(default_domain));
    var inserted = row.parentElement.insertBefore(templ, row);
    inserted.querySelector("[name=name]").focus();
    this.select_row(null, inserted);
    return inserted;
  }

  this._init(id, name, container_class, data);
}
cls.CookieManager["1.1"].CookieManagerView.prototype = new cls.CookieManager.CookieManagerViewBase();
