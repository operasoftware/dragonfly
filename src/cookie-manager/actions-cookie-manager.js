window.eventHandlers.click['cookiemanager-delete-all'] = function(event, target)
{
  // just delete the one that are part of the current debug context  
  for (var domain in window.views.cookie_manager._cookies)
  {
    // console.log("removing cookies for domain",domain);
    var tag = tagManager.set_callback(this, window.views.cookie_manager._handle_changed_cookies,[domain]);
    services['cookie-manager'].requestRemoveCookie(tag, [domain]);
  }  
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
                    + '; path=' + cookie.path+'";';
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
      add_modified_cookie_script += '; expires='+ (new Date(cookie.expires*1000).toUTCString());
      add_modified_cookie_script += '; path=' + '/' + cookie.path+'"';
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
  // walk up to find form
  var formelem = target;
  while (formelem.nodename !== "form" && formelem.parentNode) {
    formelem = formelem.parentNode;
  }
  
  var domain_field  = formelem.querySelector("select[name=cookiedomain]");
  var cookie_runtime = parseInt(domain_field.options[domain_field.options.selectedIndex].getAttribute("data-runtimes").split(",")[0]);
  
  var domain_val  = domain_field.value;
  var name_val    = formelem.querySelector("input[name=cookiename]").value;
  var value_val   = formelem.querySelector("input[name=cookievalue]").value;
  var path_val    = formelem.querySelector("input[name=cookiepath]").value || "/"; // TODO: Make sure it starts with a path if it's given
  var expires_val = formelem.querySelector("input[name=cookieexpires]").value;
  
  if(domain_val && name_val && cookie_runtime!=="")
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
  event.preventDefault();
}

window.eventHandlers.click['cookiemanager-update'] = function(event, target)
{
  window.views.cookie_manager._update();
}