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
    this._hold_redraw_mem = {};
    this._data_reference = data_reference;
    this._bound_update_expiry = this._update_expiry.bind(this);

    var contextmenu = ContextMenu.get_instance();
    contextmenu.register("cookie_refetch", [
      {
        callback: (function()
        {
          return [
            {
              label: ui_strings.S_LABEL_STORAGE_UPDATE,
              handler: (function(){ this._data_reference.refetch() }).bind(this)
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
          var options = [];
          var cookie_obj;
          // if row has an object-id, add edit and remove options
          var objectref = row.getAttribute("data-object-id");
          if(objectref)
          {
            // row represents a cookie, so it can be selected
            this.select_row(event, row);
          }
          var selection = document.querySelectorAll(".sortable-table .selected");
          var selected_cookie_objects = [];
          for (var i=0; i < selection.length; i++) {
            var sel_cookie_obj = this._data_reference.get_cookie_by_objectref(selection[i].getAttribute("data-object-id"));
            selected_cookie_objects.push(sel_cookie_obj);
          };

          if(selected_cookie_objects.length === 1)
          {
            // Add cookie
            options.push(
              {
                label: ui_strings.S_LABEL_COOKIE_MANAGER_ADD_COOKIE,
                handler: (function() {
                  var runtime = selected_cookie_objects[0].runtimes[0];
                  var inserted = this.insert_add_cookie_row(row, runtime);
                  this.select_row(null, inserted);
                }).bind(this)
              }
            );
            // single selection
            var sel_cookie_obj = selected_cookie_objects[0];
            if(sel_cookie_obj.is_editable)
            {
              options.push(
                {
                  label: ui_strings.S_LABEL_COOKIE_MANAGER_EDIT_COOKIE,
                  handler: (function() {
                    this.enter_edit_mode(sel_cookie_obj.objectref);
                  }).bind(this)
                }
              );
            }
            if(sel_cookie_obj.is_removable)
            {
              options.push(
                {
                  label: ui_strings.S_LABEL_COOKIE_MANAGER_REMOVE_COOKIE,
                  handler: (function() {
                    this._data_reference.remove_cookie(sel_cookie_obj.objectref);
                  }).bind(this)
                }
              );
            }
            // Add "Remove all from domain-and-path"
            var runtime = this._data_reference._rts[sel_cookie_obj.runtimes[0]];
            options.push(
              {
                label: ui_strings.S_LABEL_COOKIE_MANAGER_REMOVE_COOKIES_OF.replace(/%s/, runtime.hostname + runtime.pathname),
                handler: (function(runtime_id, context){
                  return function() {
                    var items = context._data_reference.get_cookies();
                    for (var i=0; i < items.length; i++) {
                      var cookie = items[i];
                      if(cookie.runtimes.indexOf(runtime_id) > -1)
                      {
                        context._data_reference.remove_cookie(cookie.objectref);
                      }
                    };
                  }
                })(runtime.rt_id, this)
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
                  label: ui_strings.S_LABEL_COOKIE_MANAGER_REMOVE_COOKIE,
                  handler: (function() {
                    this._data_reference.remove_cookie(removable_cookies[0].objectref);
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
                        context._data_reference.remove_cookie(removable_cookies[i].objectref);
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
          grouper: (function(obj) {
            // todo: check to avoid using this._rts (to skip the bind) by putting hostname etc on the cookie_object directly?
            // would remove lots of this cryptic this._rts[obj.runtimes[0]].pathname stuff.
            return this._rts[obj.runtimes[0]].hostname + this._rts[obj.runtimes[0]].pathname;
          }).bind(this._data_reference),
          renderer: (function(groupvalue, obj) {
            var obj = obj[0];
            var runtime = this._rts[obj.runtimes[0]];
            return window.templates.cookie_manager.hostname_group_render(runtime);
          }).bind(this._data_reference)
        }
      },
      column_order: ["domain", "name", "value", "path", "expires", "isSecure", "isHTTPOnly"],
      idgetter: function(res) { return res.objectref },
      columns: {
        domain: {
          label:    ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_DOMAIN,
          classname: "col_domain",
          renderer: (function(obj) { return this._domain_renderer(obj) }).bind(this),
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
          renderer: (function(obj) { return this._is_secure_renderer(obj) }).bind(this)
        },
        isHTTPOnly: {
          label:    window.templates.cookie_manager.wrap_ellipsis(ui_strings.S_LABEL_COOKIE_MANAGER_HTTP_ONLY),
          classname: "col_httponly",
          renderer: (function(obj) { return this._is_http_only_renderer(obj) }).bind(this)
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
    var storage_data = this._data_reference.get_cookies();
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
      *
      * unselect everything while not doing multiple selection mode.
      * that's when:
      *   cmd / ctrl key is pressed
      *   OR
      *   more than 1 item is already selected and event is a right-click
      *
      */
    var selection = document.querySelectorAll(".sortable-table .selected");
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
    var templ = document.documentElement.render(window.templates.cookie_manager.add_cookie_row(runtime, this._data_reference._rts));
    var inserted = row.parentElement.insertBefore(templ, row);
    inserted.querySelector("[name=name]").focus();
    this.select_row(null, inserted);
    this._hold_redraw();
    return inserted;
  }

  this.click_add_cookie_button = function(event, target)
  {
    window.views.cookie_manager.check_to_exit_edit_mode(event, target);
    // find runtime the row relates to
    var row = target.parentElement.parentElement;
    var row_with_data_id = row.previousElementSibling;
    while(!row_with_data_id.getAttribute("data-object-id"))
    {
      row_with_data_id = row_with_data_id.previousElementSibling;
    }
    var objectref = row_with_data_id.getAttribute("data-object-id");
    var runtime_id = this._data_reference.get_cookie_by_objectref(objectref).runtimes[0];
    this.insert_add_cookie_row(row, runtime_id);
  }

  this.enter_edit_mode = function(objectref, event)
  {
    var table_elem = document.querySelector(".sortable-table");
    var sortable_table = ObjectRegistry.get_instance().get_object(table_elem.getAttribute("data-object-id"));
    sortable_table.restore_columns(table_elem);
    var row = document.querySelector(".sortable-table tr[data-object-id='"+objectref+"']").addClass("edit_mode");
    this.select_row(event, row);
    this._hold_redraw();
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
    this._resume_redraw();
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
      var domain       = domain_input && domain_input.value.trim() || runtime && this._data_reference._rts[runtime].hostname;

      var object_id = edit_tr.getAttribute("data-object-id");
      var old_cookie;
      if(object_id)
      {
        old_cookie = this._data_reference.get_cookie_by_objectref(object_id);
        // check if unmodified
        if(old_cookie &&
            (
              name         === old_cookie.name &&
              value        === old_cookie.value &&
              expires      === new Date(old_cookie.expires*1000).getTime() &&
              path         === old_cookie.path &&
              is_secure    === old_cookie.isSecure &&
              is_http_only === old_cookie.isHTTPOnly &&
              domain       === (old_cookie.domain || this._data_reference._rts[old_cookie.runtimes[0]].hostname)
            )
        )
        {
          return;
        }
      }

      if(domain && name)
      {
        var new_cookie_desc = {
          domain:       domain,
          name:         name,
          path:         path,
          value:        value,
          expires:      expires,
          is_secure:    +is_secure,
          is_http_only: +is_http_only,
          runtime:      runtime
        }

        if(!new_cookie_desc.runtime)
        {
          /**
            * Try to find runtime where this might end up to be able to highlight it. Using endsWith 
            * makes it work for subdomains, it can get the wrong one too, but chances are good
            * and it doesnt matter too much. Todo: Improve by making a runtimes list with those that fit.
            */
          for (var id in this._data_reference._rts) {
            // check if runtime hostname endsWith cookie-domain val
            var hostname = this._data_reference._rts[id].hostname;
            var last_index = hostname.lastIndexOf(new_cookie_desc.domain);
            if(last_index !== -1 && last_index + new_cookie_desc.domain.length == hostname.length)
            {
              new_cookie_desc.runtime = this._data_reference._rts[id].rt_id;
              break;
            }
          };
        }

        if(old_cookie)
        {
          // remove old_cookie, on finished add new cookie
          this._data_reference.remove_cookie(old_cookie.objectref, this._data_reference.set_cookie.bind(this._data_reference, new_cookie_desc));
        }
        else
        {
          this._data_reference.set_cookie(new_cookie_desc);
        }
      }
      else
      {
        // todo: missing required info, needs feedback in UI. will refetch and discard for now.
        this._data_reference.refetch();
      }
    }
  }

  this._clear_container = function()
  {
    this._container.innerHTML = "";
  }

  this._before_table_render = function(message)
  {
    var message = message || {};
    if(this._hold_redraw_mem.active && message.target)
    {
      message.target.discard_next_render();
    }
    else
    {
      // save selection
      var selection = document.querySelectorAll(".sortable-table .selected");
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
    // context menus
    // todo: check to include in template
    // add delete cookie context menu per tr
    this._table_elem = this._table_container.firstChild;
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
      // console.log("this._data_reference",this._data_reference,"this._data_reference.get_cookie_by_objectref", this._data_reference.get_cookie_by_objectref, "this._data_reference.get_cookie_by_objectref(objectref)", this._data_reference.get_cookie_by_objectref(objectref));
      if(this._data_reference.get_cookie_by_objectref(objectref).is_editable)
      {
        rows[i].setAttribute("edit-handler", "cookiemanager-init-edit-mode");
      }
      else
      {
        rows[i].addClass("non-editable");
      }
    };
  }

  this._fuzzy_date = function(date)
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
      return ui_strings.S_LABEL_COOKIE_MANAGER_TODAY;
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
    var items = this._data_reference.get_cookies();
    for (var i=0; i < items.length; i++)
    {
      var obj = items[i];
      var elem = document.getElementById("expires_container_"+obj.objectref);
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

  this._hold_redraw = function()
  {
    this._hold_redraw_mem.active = true;
    this._hold_redraw_mem.timeout = setTimeout(this._resume_redraw.bind(this), 15000);
  }

  this._resume_redraw = function()
  {
    if(this._hold_redraw_mem.timeout)
    {
      clearTimeout(this._hold_redraw_mem.timeout);
    }
    if(this._hold_redraw_mem.callback)
    {
      this._hold_redraw_mem.callback();
    }
    this._hold_redraw_mem = {};
  }

  // DEPENDEND ON SERVICE VERSION - those might get overwritten
  this._domain_renderer = function(obj)
  {
    if(obj.is_runtimes_placeholder)
    {
      return;
    }
    if(obj.domain)
    {
      return window.templates.cookie_manager.editable_domain(obj.runtimes[0], this._data_reference._rts, obj.domain);
    }
    return window.templates.cookie_manager.unknown_value();
  }

  this._is_secure_renderer = function(obj)
  {
    if(obj.is_runtimes_placeholder)
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
    if(obj.is_runtimes_placeholder)
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
    if(obj.is_runtimes_placeholder)
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
    if(obj.is_runtimes_placeholder)
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
    if(obj.is_runtimes_placeholder)
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
    // this is called from the context menu
    /*            
                  var runtime = selected_cookie_objects[0].runtimes[0];
                  var inserted = this.insert_add_cookie_row(row, runtime);
    */
    this._hold_redraw();
    var table_elem = document.querySelector(".sortable-table");
    var sortable_table = ObjectRegistry.get_instance().get_object(table_elem.getAttribute("data-object-id"));
    sortable_table.restore_columns(table_elem);

    var default_domain = this._data_reference._rts[runtime].hostname;
    var templ = document.documentElement.render(window.templates.cookie_manager.add_cookie_row_all_editable(default_domain));
    var inserted = row.parentElement.insertBefore(templ, row);
    inserted.querySelector("[name=name]").focus();
    this.select_row(null, inserted);
    return inserted;
  }

  this._init(id, name, container_class, data);
}
cls.CookieManager["1.1"].CookieManagerView.prototype = new cls.CookieManager.CookieManagerViewBase();
