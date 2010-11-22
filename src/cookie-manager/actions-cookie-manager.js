window.eventHandlers.click['cookiemanager-delete-all'] = function(event, target)
{
  var tag = tagManager.set_callback(this, window.views.cookie_manager._handle_removed_cookies);
  services['cookie-manager'].requestRemoveAllCookies(tag);
};

window.eventHandlers.click['cookiemanager-delete-domain-cookies'] = function(event, target)
{
  var find_element = target;
  while(!find_element.hasClass("domain") && find_element.previousSibling)
  {
    find_element = find_element.previousSibling;
  }
  var domain = find_element.getAttribute("data-domain");
  // console.log("will delete cookies for domain ",domain);
  var tag = tagManager.set_callback(this, window.views.cookie_manager._handle_removed_cookies,[domain]);
  services['cookie-manager'].requestRemoveCookie(tag,[domain]);
};

/*
window.eventHandlers.click['cookiemanager-update'] = function(event, target)
{
  window.storages[event.target.parentNode.parentNode.parentNode.getAttribute('data-storage-id')].update();
};
*/