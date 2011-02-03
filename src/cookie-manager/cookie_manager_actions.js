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
  window.views.cookie_manager.check_to_exit_edit_mode(event, target);
  window.views.cookie_manager.select_row(event, target);
}

window.eventHandlers.keyup['cookiemanager-edit'] = function(event, target)
{
  // blur (and save) on <enter>
  if(event.keyCode === 13)
  {
    target.blur();
  }
}

window.eventHandlers.click['cookiemanager-container'] = function(event, target)
{
  window.views.cookie_manager.check_to_exit_edit_mode(event, target);
}

window.eventHandlers.click['cookiemanager-add-cookie-row'] = function(event, target)
{
  window.views.cookie_manager.insert_add_cookie_row(target);
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