window.eventHandlers.click['cookiemanager-delete-all'] = function(event, target)
{
  // just delete cookies that are shown
  for (var i=0; i < window.views.cookie_manager._flattened_cookies.length; i++) {
    var cookie = window.views.cookie_manager._flattened_cookies[i];
      
    var domain = cookie.domain;
    var path = cookie.path;
    var name = cookie.name;

    var remove_cookie_instructions = [domain];
    if(path)
    {
      remove_cookie_instructions.push(path);
    }
    if(name)
    {
      remove_cookie_instructions.push(name);
    }
    var tag = tagManager.set_callback(this, window.views.cookie_manager._handle_changed_cookies, remove_cookie_instructions);
    services['cookie-manager'].requestRemoveCookie(tag,[domain, path, name]);
  };
};

window.eventHandlers.blur['cookiemanager-edit'] = function(event, target)
{
  var objectref = target.getAttribute("data-objectref");
  var editproperty = target.getAttribute("data-editproperty");
  
  // need to find cookie object now that has all info
  var cookie;
  for (var i=0; i < window.views.cookie_manager._flattened_cookies.length; i++) {
    if(window.views.cookie_manager._flattened_cookies[i].objectref == objectref)
    {
      cookie = window.views.cookie_manager._flattened_cookies[i];
      // remove old cookie
      var remove_old_cookie_script = 'document.cookie="'
                    + cookie.name + '=' + cookie.value
                    + '; expires='+ (new Date(new Date().getTime()-1000).toUTCString())
                    + '; path=' + '/'+ cookie.path;
      remove_old_cookie_script += '";';
      // and add modified
      // todo: probably can be removed by just using all the values from the forms.
      // todo: check if encodeURIComponent is used correctly
      
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
      // todo: looks like in cases where the path was not set explicitely, it needs to be ommited. question is how I should know.
      add_modified_cookie_script += '; path=' + '/' + cookie.path;
      add_modified_cookie_script += '"';
      
      /*
      // result should look sth like
      var add_modified_cookie_script = 'document.cookie="'
                    + "name" + '=' + "value" 
                    + '; expires='+ (new Date(cookie.expires*1000).toUTCString())
                    + '; path=' + '/' + "path"+'"';
      */
      var script = remove_old_cookie_script + add_modified_cookie_script;
      var tag = tagManager.set_callback(this, window.views.cookie_manager._handle_changed_cookies, [cookie.runtimes[0]]);
      services['ecmascript-debugger'].requestEval(tag,[cookie.runtimes[0], 0, 0, script]);
    }
  };
}

/*
window.eventHandlers.click['cookiemanager-delete-domain-path-cookies'] = function(event, target)
{
  var find_element = target;
  while(!find_element.hasClass("domain") && find_element.previousSibling)
  {
    find_element = find_element.previousSibling;
  }
  var domain = find_element.getAttribute("data-domain");
  // console.log("will delete cookies for domain ",domain);
  var tag = tagManager.set_callback(this, window.views.cookie_manager._handle_changed_cookies, [domain]);
  services['cookie-manager'].requestRemoveCookie(tag,[domain]);
};
*/

window.eventHandlers.click['cookiemanager-delete-cookie'] = function(event, target)
{
  var objectref = target.getAttribute("data-objectref");
  var cookie;
  for (var i=0; i < window.views.cookie_manager._flattened_cookies.length; i++) {
    if(window.views.cookie_manager._flattened_cookies[i].objectref == objectref)
    {
      cookie = window.views.cookie_manager._flattened_cookies[i];
      
      var domain = cookie.domain;
      var path = cookie.path;
      var name = cookie.name;
  
      var remove_cookie_instructions = [domain];
      if(path)
      {
        remove_cookie_instructions.push(path);
      }
      if(name)
      {
        remove_cookie_instructions.push(name);
      }
      var tag = tagManager.set_callback(this, window.views.cookie_manager._handle_changed_cookies, remove_cookie_instructions);
      services['cookie-manager'].requestRemoveCookie(tag,[domain, path, name]);
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
  var domain_select  = formelem.querySelector("select[name=add_cookie_domain_select]");
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
  var path_val    = path_val_form_elem.value || "/"; // TODO: Make sure it starts with a path if it's given
  var expires_val = formelem.querySelector("input[name=cookieexpires]").value;
  
  if(name_val && cookie_runtime)
  {
    var add_cookie_script = 'document.cookie="';
    add_cookie_script += encodeURIComponent(name_val) + '='
    add_cookie_script += encodeURIComponent(value_val);
    add_cookie_script += '; expires='+ (new Date(expires_val).toUTCString());
    add_cookie_script += '; path=' + path_val+'"';
    /*
    // result should look sth like
    var add_cookie_script = 'document.cookie="'
                  + "name" + '=' + "value" 
                  + '; expires='+ (new Date(cookie.expires*1000).toUTCString())
                  + '; path=' + '/' + "path"+'"';
    */
    var script = add_cookie_script;
    // console.log("add_cookie_script",add_cookie_script);
    var tag = tagManager.set_callback(this, window.views.cookie_manager._handle_changed_cookies, []);
    services['ecmascript-debugger'].requestEval(tag,[cookie_runtime, 0, 0, script]);
  }
  else
  {
    // todo: show a warning or sth?
  }
  // todo: make domain, path and expires persist
  // todo: scroll down to newly added cookies
}

window.eventHandlers.click['cookiemanager-update'] = function(event, target)
{
  window.views.cookie_manager._update();
}

window.eventHandlers.change['cookiemanager-add-cookie-domain-select'] = function(event, target)
{
  console.log("cookiemanager-add-cookie-domain-select", event, target);
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
  
  // function will also be called initial, so it needs to be
  // checked if there is add_cookie_domain_select (the selected item of that has the runtimes (value))
  // or there is add_cookie_runtime directly, it has the runtimes directly (value)
  var selected_runtime_ids = [];
  var add_cookie_runtime = formelem.querySelector("input[name=add_cookie_runtime]");
  var domain_select = formelem.querySelector("select[name=add_cookie_domain_select]");
  if(add_cookie_runtime) {
    selected_runtime_ids = add_cookie_runtime.value.split(",");
  }
  else if(domain_select) {
    selected_runtime_ids = domain_select.value.split(",");
    console.log("selected_runtime_ids",selected_runtime_ids);
  }
  var pathvalues = ["/"];
  for (var i=0; i < selected_runtime_ids.length; i++) {
    var pathname = window.views.cookie_manager._rts[selected_runtime_ids[i]].pathname;
    if(pathvalues.indexOf(pathname) === -1)
    {
      pathvalues.push(pathname);
    }
  };
  // console.log("pathvalues",pathvalues);
  
  // Remove old
  var path_select_elem = formelem.querySelector("input[name=cookiepath]") || formelem.querySelector("select[name=cookie_path_select]");
  
  var parent = path_select_elem.parentNode;
  if(path_select_elem) {
    parent.removeChild(path_select_elem);
  }
  // Insert new
  var render_object = [];
  if(pathvalues.length > 1) {
    var option_arr = [];
    for (var i=0; i < pathvalues.length; i++) {
      option_arr.push(["option",pathvalues[i],"value",pathvalues[i]]);
    };
    render_object.push(["select",option_arr,"name","cookie_path_select","class","add_cookie_dropdown"]);
  }
  else
  {
    render_object.push(["input","value",pathvalues[0],"name","cookiepath"]);
  }
  parent.render(render_object);
}