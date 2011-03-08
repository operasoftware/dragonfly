cls.CookieManager.create_ui_widgets = function()
{
  window.eventHandlers.dblclick['cookiemanager-init-edit-mode'] = function(event, target)
  {
    window.views.cookie_manager.enter_edit_mode(target.getAttribute("data-object-id"), event);
  }

  window.eventHandlers.click['cookiemanager-row-select'] = function(event, target)
  {
    window.views.cookie_manager.check_to_exit_edit_mode(event, target);
    window.views.cookie_manager.select_row(event, target);
  }

  window.eventHandlers.click['cookiemanager-input-field'] = function(event, target)
  {
    // Empty for now, but preventing click['cookiemanager-container']
    // which exits editing
  }

  window.eventHandlers.click['cookiemanager-container'] = function(event, target)
  {
    window.views.cookie_manager.check_to_exit_edit_mode(event, target);
  }

  window.eventHandlers.click['cookiemanager-add-cookie-row'] = function(event, target)
  {
    window.views.cookie_manager.click_add_cookie_button(event, target);
  }
}
