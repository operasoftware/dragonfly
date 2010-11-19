window.eventHandlers.click['cookiemanager-delete-all'] = function(event, target)
{
  console.log("cookiemanager-delete-all");
  // var tag = tagManager.set_callback(this, this._handle_cookies,[rt_id,domain]);
  services['cookie-manager'].requestRemoveAllCookies();
  window.views.cookie_manager._cookies = {};
  window.views.cookie_manager.update();
};

/*
window.eventHandlers.click['cookiemanager-update'] = function(event, target)
{
  window.storages[event.target.parentNode.parentNode.parentNode.getAttribute('data-storage-id')].update();
};
*/