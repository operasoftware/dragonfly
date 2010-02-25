window.eventHandlers.click['storage-edit'] = function(event, target)
{
  var 
  tr = event.target.parentNode.parentNode,
  rt_id = tr.parentNode.getAttribute('data-rt-id'), 
  storage_id = tr.parentNode.getAttribute('data-storage-id'), 
  key = tr.getAttribute('data-storage-key'),
  item = window.storages[storage_id].get_item(rt_id, key);

  window.storages[storage_id].set_item_edit(rt_id, key, true);
  tr.parentNode.replaceChild(document.render(window.templates.storage_item_edit(item)), tr);
}

window.eventHandlers.click['storage-save'] = function(event, target)
{
  var 
  tr = event.target.parentNode.parentNode.parentNode,
  rt_id = tr.parentNode.getAttribute('data-rt-id'), 
  storage_id = tr.parentNode.getAttribute('data-storage-id'), 
  key = tr.getAttribute('data-storage-key') || 
  (tr.getElementsByTagName('input')[0] && tr.getElementsByTagName('input')[0].value),
  value = tr.getElementsByTagName('textarea')[0].value,
  item = null;

  window.storages[storage_id].set_item(rt_id, key, value, function(success)
  {
    if(success)
    {
      window.eventHandlers.click['storage-edit-cancel'](event, target);
    }
    else
    {
      // TODO
    }
  });
}

window.eventHandlers.click['storage-edit-cancel'] = function(event, target)
{
  var 
  tr = event.target.parentNode.parentNode.parentNode,
  rt_id = tr.parentNode.getAttribute('data-rt-id'), 
  storage_id = tr.parentNode.getAttribute('data-storage-id'), 
  key = tr.getAttribute('data-storage-key') || 
  (tr.getElementsByTagName('input')[0] && tr.getElementsByTagName('input')[0].value),
  item = window.storages[storage_id].get_item(rt_id, key);

  window.storages[storage_id].set_item_edit(rt_id, key, false);
  if(item)
  {
    tr.parentNode.replaceChild(document.render(window.templates.storage_item(item)), tr);
  }
  else
  {
    tr.parentNode.removeChild(tr);
  }
}

window.eventHandlers.click['storage-delete'] = function(event, target)
{
  
  var 
  tr = event.target.parentNode.parentNode,
  rt_id = tr.parentNode.getAttribute('data-rt-id'),  
  storage_id = tr.parentNode.getAttribute('data-storage-id'), 
  key = tr.getAttribute('data-storage-key');
  
  window.storages[storage_id].remove_item(rt_id, key, function(success)
  {
    if(success)
    {
      tr.parentNode.removeChild(tr);
    }
    else
    {
      // TODO
    }
  });
  
}

window.eventHandlers.click['storage-delete-all'] = function(event, target)
{
  var 
  table = event.target.parentNode.parentNode.parentNode,
  rt_id = table.getAttribute('data-rt-id'),  
  storage_id = table.getAttribute('data-storage-id');

  window.storages[storage_id].clear(parseInt(rt_id));
}

window.eventHandlers.click['storage-add-key'] = function(event, target)
{
  
  var 
  tr = event.target.parentNode.parentNode,
  rt_id = tr.parentNode.getAttribute('data-rt-id'),
  storage_id = tr.parentNode.getAttribute('data-storage-id');

  tr.parentNode.insertBefore(document.render(window.templates.storage_item_add()), tr);
}

