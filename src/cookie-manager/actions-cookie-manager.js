window.eventHandlers.click['cookiemanager-delete-all'] = function(event, target)
{
  // instead of really deleting all cookies, just delete the one that are part of the current debug context
  // var tag = tagManager.set_callback(this, window.views.cookie_manager._handle_removed_cookies);
  // services['cookie-manager'].requestRemoveAllCookies(tag);
  
  for (var domain in window.views.cookie_manager._cookies)
  {
    // console.log("removing cookies for domain",domain);
    var tag = tagManager.set_callback(this, window.views.cookie_manager._handle_removed_cookies,[domain]);
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
      // console.log("foundcookie for objectref",objectref,cookie);
      
      // remove old cookie
      var remove_old_cookie_script = 'document.cookie="'
                    + cookie.name + '=' + cookie.value 
                    + '; expires='+ (new Date(new Date().getTime()-1000).toUTCString())
                    + '; path=' + '/' + cookie.path+'";';
      
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
        add_modified_cookie_script += target.value.trim();
      }
      else
      {
        add_modified_cookie_script += cookie.value;
      }
      
      add_modified_cookie_script += '; expires='+ (new Date(cookie.expires*1000).toUTCString());
      
      if(editproperty === "path")
      {
        add_modified_cookie_script += '; path=' +       target.value.trim()+'"';
      }
      else
      {
        add_modified_cookie_script += '; path=' + '/' + cookie.path+'"';
      }
      
      /*
      // result should look sth like
      var add_modified_cookie_script = 'document.cookie="'
                    + target.value + '=' + cookie.value 
                    + '; expires='+ (new Date(cookie.expires*1000).toUTCString())
                    + '; path=' + '/' + cookie.path+'"';
      */
      
      var script = remove_old_cookie_script + add_modified_cookie_script;
      var tag = tagManager.set_callback(this, window.views.cookie_manager._handle_changed_cookies, [cookie.runtimes[0]]);
      services['ecmascript-debugger'].requestEval(tag,[cookie.runtimes[0], 0, 0, script]);
    }
  };
}

/*
window.eventHandlers.click['cookiemanager-delete-domain-cookies'] = function(event, target)
{
  var find_element = target;
  while(!find_element.hasClass("domain") && find_element.previousSibling)
  {
    find_element = find_element.previousSibling;
  }
  var domain = find_element.getAttribute("data-domain");
  // console.log("will delete cookies for domain ",domain);
  var tag = tagManager.set_callback(this, window.views.cookie_manager._handle_removed_cookies, [domain]);
  services['cookie-manager'].requestRemoveCookie(tag,[domain]);
};
*/
window.eventHandlers.click['cookiemanager-delete-cookie'] = function(event, target)
{
  /*
     * @param domain Name of domain to remove cookies from, e.g. "opera.com"
     * @param path   If specified only removes cookies from specified path or subpath.
     * @param name   Name of cookie to remove, if unspecified removes all cookies matching domain/path.
  */
  var domain = target.getAttribute("data-cookie-domain");
  var path = target.getAttribute("data-cookie-path");
  var name = target.getAttribute("data-cookie-name");
  
  var remove_cookie_instructions = [domain];
  if(path)
  {
    remove_cookie_instructions.push(path);
  }
  if(name)
  {
    remove_cookie_instructions.push(name);
  }
  
  var tag = tagManager.set_callback(this, window.views.cookie_manager._handle_removed_cookies, remove_cookie_instructions);
  services['cookie-manager'].requestRemoveCookie(tag,[domain, path, name]);
};

window.eventHandlers.click['cookiemanager-update'] = function(event, target)
{
  window.views.cookie_manager._update();
}