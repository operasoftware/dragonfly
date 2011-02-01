window.eventHandlers.click['cookiemanager-delete-all'] = function(event, target)
{
  // just delete cookies that are shown
  for (var i=0; i < window.views.cookie_manager.flattened_cookies.length; i++) {
    var cookie = window.views.cookie_manager.flattened_cookies[i];
    window.views.cookie_manager.remove_cookie_by_objectref(cookie.objectref);
  };
};

window.eventHandlers.dblclick['cookiemanager-init-edit-mode'] = function(event, target)
{
  window.views.cookie_manager.enter_edit_mode(target.getAttribute("data-object-id"), event);
}

window.eventHandlers.click['cookiemanager-row-select'] = function(event, target)
{
  window.views.cookie_manager.select_row(event, target);
  event.stopPropagation();
}

window.eventHandlers.keyup['cookiemanager-edit'] = function(event, target)
{
  // blur (and save) on <enter>
  if(event.keyCode === 13)
  {
    target.blur();
  }
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
      var tag = tagManager.set_callback(this, window.views.cookie_manager.handle_changed_cookies, [cookie.runtimes[0]]);
      services['ecmascript-debugger'].requestEval(tag,[cookie.runtimes[0], 0, 0, script]);
    }
  };
}

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
  var name_form_elem    = formelem.querySelector("input[name=cookiename]");
  var name_val          = name_form_elem.value;
  var value_form_elem   = formelem.querySelector("input[name=cookievalue]");
  var value_val         = value_form_elem.value;
  var path_form_elem    = formelem.querySelector("input[name=cookiepath]") || formelem.querySelector("select[name=cookie_path_select]");
  var path_val          = path_form_elem.value || "/";
  var expires_form_elem = formelem.querySelector("input[name=cookieexpires]")
  var expires_val       = expires_form_elem.value;

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
    var tag = tagManager.set_callback(this, window.views.cookie_manager.handle_changed_cookies, []);
    services['ecmascript-debugger'].requestEval(tag,[cookie_runtime, 0, 0, script]);
  }
  // reset form fields
  name_form_elem.value    = "";
  value_form_elem.value   = "";
  path_form_elem.value    = "/";
  expires_form_elem.value = ""; // todo: seems this has no effect
  // todo: scroll in case newly added cookies aren't visible
}