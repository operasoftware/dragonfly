window.eventHandlers.click['cookiemanager-delete-all'] = function(event, target)
{
  // just delete cookies that are shown
  for (var i=0; i < window.views.cookie_manager.flattened_cookies.length; i++) {
    var cookie = window.views.cookie_manager.flattened_cookies[i];
    var tag = tagManager.set_callback(this, window.views.cookie_manager._handle_changed_cookies, []);
    services['cookie-manager'].requestRemoveCookie(tag,[cookie.domain, cookie.path, cookie.name]);
  };
};

window.eventHandlers.dblclick['cookiemanager-init-edit-mode'] = function(event, target)
{
  var editcontainer = target;
  while (!editcontainer.hasClass("edit_container") && editcontainer.parentNode) {
    editcontainer = editcontainer.parentNode;
  }
  target.addClass("hidden");
  var edit_formelem = editcontainer.getElementsByClassName("edit_formelem")[0];
  edit_formelem.removeClass("hidden");
  edit_formelem.focus();
}

window.eventHandlers.blur['cookiemanager-edit'] = function(event, target)
{
  var editcontainer = target;
  while (!editcontainer.hasClass("edit_container") && editcontainer.parentNode) {
    editcontainer = editcontainer.parentNode;
  }
  target.addClass("hidden");
  editcontainer.getElementsByClassName("edit_formelem")[0].removeClass("hidden");

  var objectref = target.getAttribute("data-objectref");
  var editproperty = target.getAttribute("data-editproperty");

  // need to find cookie object now that has all info
  var cookie;
  for (var i=0; i < window.views.cookie_manager.flattened_cookies.length; i++) {
    if(window.views.cookie_manager.flattened_cookies[i].objectref == objectref)
    {
      // todo: this will need to be done over the cookie service to work reliably.
      cookie = window.views.cookie_manager.flattened_cookies[i];
      // remove old cookie
      var remove_old_cookie_script = 'document.cookie="'
                    + cookie.name + '=' + cookie.value
                    + '; expires='+ (new Date(new Date().getTime()-1000).toUTCString())
                    + '; path=' + '/'+ cookie.path;
      remove_old_cookie_script += '";';
      // and add modified
      var add_modified_cookie_script = 'document.cookie="';
      if(editproperty === "name")
      {
        add_modified_cookie_script += target.value.trim() + '='
      }
      else
      {
        add_modified_cookie_script += cookie.name + '='
      }
      if(editproperty === "value")
      {
        add_modified_cookie_script += encodeURIComponent(target.value);
      }
      else
      {
        add_modified_cookie_script += cookie.value;
      }
      if(cookie.expires) // in case of 0 value the "expires" value should not be written, otherwise it would expire 1970.
      {
        add_modified_cookie_script += '; expires='+ (new Date(cookie.expires*1000).toUTCString());
      }
      add_modified_cookie_script += '; path=' + '/' + cookie.path;
      add_modified_cookie_script += '"';

      var script = remove_old_cookie_script + add_modified_cookie_script;
      var tag = tagManager.set_callback(this, window.views.cookie_manager._handle_changed_cookies, [cookie.runtimes[0]]);
      services['ecmascript-debugger'].requestEval(tag,[cookie.runtimes[0], 0, 0, script]);
    }
  };
}

window.eventHandlers.click['cookiemanager-delete-domain-path-cookies'] = function(event, target)
{
  var domain = target.getAttribute("data-cookie-domain");
  var path = target.getAttribute("data-cookie-path");
  var tag = tagManager.set_callback(this, window.views.cookie_manager._handle_changed_cookies, [domain]);
  services['cookie-manager'].requestRemoveCookie(tag,[domain,path]);
};

window.eventHandlers.click['cookiemanager-delete-cookie'] = function(event, target)
{
  var objectref = target.getAttribute("data-objectref");
  var cookie;
  for (var i=0; i < window.views.cookie_manager.flattened_cookies.length; i++) {
    if(window.views.cookie_manager.flattened_cookies[i].objectref == objectref)
    {
      cookie = window.views.cookie_manager.flattened_cookies[i];
      var tag = tagManager.set_callback(this, window.views.cookie_manager._handle_changed_cookies, []);
      services['cookie-manager'].requestRemoveCookie(tag,[cookie.domain, cookie.path, cookie.name]);
    }
  }
};

window.eventHandlers.click['add-cookie-handler'] = function(event, target)
{
  event.preventDefault();

  // walk up to find form
  var formelem = target;
  while (formelem.nodeName !== "form" && formelem.parentNode) {
    formelem = formelem.parentNode;
  }

  var cookie_runtime;
  var domain_select  = formelem.querySelector("select[name=add_cookie_runtime_select]");
  if(domain_select)
  {
    cookie_runtime = parseInt(domain_select.options[domain_select.options.selectedIndex].value.split(",")[0]);
  }
  else {
    cookie_runtime = parseInt(formelem.querySelector("input[name=add_cookie_runtime]").value.split(",")[0]);
  }
  var name_val    = formelem.querySelector("input[name=cookiename]").value;
  var value_val   = formelem.querySelector("input[name=cookievalue]").value;
  var path_val_form_elem = formelem.querySelector("input[name=cookiepath]") || formelem.querySelector("select[name=cookie_path_select]");
  var path_val    = path_val_form_elem.value || "/";
  var expires_val = formelem.querySelector("input[name=cookieexpires]").value;

  if(name_val && cookie_runtime)
  {
    var add_cookie_script = 'document.cookie="';
    add_cookie_script += encodeURIComponent(name_val) + '='
    add_cookie_script += encodeURIComponent(value_val);
    add_cookie_script += '; expires='+ (new Date(expires_val).toUTCString());
    add_cookie_script += '; path=' + path_val+'"';
    /**
     * result should look sth like
     * var add_cookie_script = 'document.cookie="'
                  + "name" + '=' + "value"
                  + '; expires='+ (new Date(cookie.expires*1000).toUTCString())
                  + '; path=' + '/' + "path"+'"';
    */
    var script = add_cookie_script;
    var tag = tagManager.set_callback(this, window.views.cookie_manager._handle_changed_cookies, []);
    services['ecmascript-debugger'].requestEval(tag,[cookie_runtime, 0, 0, script]);
  }
  // todo: make domain, path and expires persist
  // todo: scroll down to newly added cookies
}

window.eventHandlers.click['cookiemanager-update'] = function(event, target)
{
  window.views.cookie_manager._refetch();
}

window.eventHandlers.change['cookiemanager-add-cookie-domain-select'] = function(event, target)
{
  // find selected, change name[cookiepath] input into select elem
  if(!target)
  {
    target = document.querySelector("form.add-cookie-form");
  }

  // walk up to find form
  var formelem = target;
  while (formelem.nodeName !== "form" && formelem.parentNode) {
    formelem = formelem.parentNode;
  }

  var runtime_field = formelem.querySelector("input[name=add_cookie_runtime]") || formelem.querySelector("select[name=add_cookie_runtime_select]");
  var selected_runtime_ids = runtime_field.value.split(",");

  var pathvalues = [];
  for (var i=0; i < selected_runtime_ids.length; i++) {
    var pathname = window.views.cookie_manager._rts[selected_runtime_ids[i]].pathname;
    if(pathvalues.indexOf(pathname) === -1)
    {
      pathvalues.push(pathname);
    }
  };

  // Remove old datatable
  if(document.getElementById("cookiepathlist")) {
    formelem.removeChild(document.getElementById("cookiepathlist"));
  }
  // Insert new datatable
  var render_object = [];
  if(pathvalues.length > 1) {
    var option_arr = [];
    for (var i=0; i < pathvalues.length; i++) {
      option_arr.push(["option","value",pathvalues[i]]);
    };
    render_object.push(["datalist",option_arr,"id","cookiepathlist"]);
  }
  formelem.render(render_object);
}