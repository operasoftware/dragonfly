window.eventHandlers.click['cookiemanager-delete-all'] = function(event, target)
{
  console.log("cookiemanager-delete-all");
  
  var tag = tagManager.set_callback(this, window.views.cookie_manager._handle_removed_cookies);
  services['cookie-manager'].requestRemoveAllCookies(tag);
  
  // do the following in callback instead
  // window.views.cookie_manager._cookies = {};
  // window.views.cookie_manager.update();
};

window.eventHandlers.click['cookiemanager-delete-domain-cookies'] = function(event, target)
{
  // RemoveCookie
  
  // var tag = tagManager.set_callback(this, this._handle_cookies,[rt_id,domain]);
  // services['cookie-manager'].requestGetCookie(tag,[domain]);
  
  var find_element = target.previousSibling;
  // console.log(target);
  // console.log(target,target.parentNode);
  // console.log(target,target.previousSibling);

  while(find_element.className="domain")
  {
    find_element = find_element.previousSibling;
    if(!find_element.previousSibling)
    {
      break;
    }
  }
  
  var domain = find_element.getAttribute("data-domain");
  
  var tag = tagManager.set_callback(this, window.views.cookie_manager._handle_removed_cookies,[domain]);
  services['cookie-manager'].requestRemoveCookie(tag,[domain]);
};


/*
window.eventHandlers.click['cookiemanager-update'] = function(event, target)
{
  window.storages[event.target.parentNode.parentNode.parentNode.getAttribute('data-storage-id')].update();
};
*/