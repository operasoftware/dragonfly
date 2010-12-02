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

window.eventHandlers.click['cookiemanager-update'] = function(event, target)
{
  window.views.cookie_manager._update();
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

/*
window.eventHandlers.click['cookiemanager-update'] = function(event, target)
{
  window.storages[event.target.parentNode.parentNode.parentNode.getAttribute('data-storage-id')].update();
};
*/