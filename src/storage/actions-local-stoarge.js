window.eventHandlers.click['storage-edit'] = function(event, target)
{
  var 
  tr = event.target.parentNode.parentNode,
  rt_id = tr.parentNode.getAttribute('data-rt-id'),  
  key = tr.getAttribute('data-storage-key'),
  item = window.local_storage_data.get_item(rt_id, key);

  window.local_storage_data.set_item_edit(rt_id, key, true);
  tr.parentNode.replaceChild(document.render(window.templates.storage_item_edit(item)), tr);
}

window.eventHandlers.click['storage-edit-cancel'] =
window.eventHandlers.click['storage-save'] = function(event, target)
{
  var 
  tr = event.target.parentNode.parentNode.parentNode,
  rt_id = tr.parentNode.getAttribute('data-rt-id'),  
  key = tr.getAttribute('data-storage-key') || 
  (tr.getElementsByTagName('input')[0] && tr.getElementsByTagName('input')[0].value),
  value = tr.getElementsByTagName('textarea')[0].value,
  handler = event.target.getAttribute('handler'),
  item = null;

  if (key && handler == 'storage-save')
  {
    item = window.local_storage_data.set_item(rt_id, key, value);
  }
  window.local_storage_data.set_item_edit(rt_id, key, false);
  tr.parentNode.replaceChild(document.render(window.templates.storage_item(item)), tr);
}

window.eventHandlers.click['storage-delete'] = function(event, target)
{
  
  var 
  tr = event.target.parentNode.parentNode,
  rt_id = tr.parentNode.getAttribute('data-rt-id'),  
  key = tr.getAttribute('data-storage-key');
  
  window.local_storage_data.remove_item(rt_id, key);
  tr.parentNode.removeChild(tr);
}

window.eventHandlers.click['storage-delete-all'] = function(event, target)
{
  window.local_storage_data.clear( 
    parseInt(event.target.parentNode.parentNode.parentNode.getAttribute('data-rt-id')));
}

window.eventHandlers.click['storage-add-key'] = function(event, target)
{
  
  var 
  tr = event.target.parentNode.parentNode,
  rt_id = tr.parentNode.getAttribute('data-rt-id');

  tr.parentNode.insertBefore(document.render(window.templates.storage_item_add()), tr);
}

