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

window.eventHandlers.keyup['cookiemanager-container'] = function(event, target)
{
  // Save on <enter>
  if(event.keyCode === 13)
  {
    window.views.cookie_manager.exit_edit_and_save();
  }
}

window.eventHandlers.click['cookiemanager-container'] = function(event, target)
{
  window.views.cookie_manager.check_to_exit_edit_mode(event, target);
}

window.eventHandlers.click['cookiemanager-add-cookie-row'] = function(event, target)
{
  // find runtime the row relates to
  // walk up to find button-containing tr
  var row = target;
  while(row.nodeName !== "tr" && row.parentNode)
  {
    row = row.parentNode;
  }
  // find previousElementSibling with a data-object-id, last item of the group
  var last_item_in_group = row;
  while(!last_item_in_group.getAttribute("data-object-id") && last_item_in_group.previousElementSibling)
  {
    last_item_in_group = last_item_in_group.previousElementSibling;
  }
  var objectref = last_item_in_group.getAttribute("data-object-id");
  var runtime_id = window.views.cookie_manager.get_cookie_by_objectref(objectref).runtimes[0];
  var inserted = window.views.cookie_manager.insert_add_cookie_row(row, runtime_id);
  window.views.cookie_manager.select_row(null, inserted);
}