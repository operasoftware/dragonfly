cls.CookieManager.create_ui_widgets = function()
{
  window.eventHandlers.dblclick['cookiemanager-init-edit-mode'] = function(event, target)
  {
    this.broker.dispatch_action("cookie_manager", "enter-edit-mode", event, target);
  }

  window.eventHandlers.click['cookiemanager-row-select'] = function(event, target)
  {
    this.broker.dispatch_action("cookie_manager", "select-row", event, target);
  }

  window.eventHandlers.click['cookiemanager-container'] = function(event, target)
  {
    this.broker.dispatch_action("cookie_manager", "check-to-exit-edit-mode", event, target);
  }

  window.eventHandlers.click['cookiemanager-add-cookie-row'] = function(event, target)
  {
    this.broker.dispatch_action("cookie_manager", "add-cookie", event, target);
  }
}
