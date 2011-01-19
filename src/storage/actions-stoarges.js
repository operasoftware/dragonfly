var cls = window.cls || (window.cls = {});

cls.StorageViewActions = function(id)
{
  this.id = id;
  this._broker = ActionBroker.get_instance();
  this._broker.register_handler(this);
  this._handlers = {};

  this._handlers['edit'] = function(event, target)
  {
    var
    tr = event.target.has_attr("parent-node-chain", "data-storage-key"),
    rt_id = tr.parentNode.getAttribute('data-rt-id'),
    storage_id = tr.parentNode.getAttribute('data-storage-id'),
    key = tr.getAttribute('data-storage-key'),
    item = window.storages[storage_id].get_item(rt_id, key);

    window.storages[storage_id].set_item_edit(rt_id, key, true);
    tr.parentNode.replaceChild(document.render(window.templates.storage_item_edit(item)), tr);
  }.bind(this);

  this._handlers['save'] = function(event, target)
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
      if (success)
      {
        window.eventHandlers.click['storage-edit-cancel'](event, target, true);
      }
      else
      {
        // TODO
      }
    });
  }.bind(this);

  this._handlers['edit-cancel'] = function(event, target)
  {
    var
    tr = event.target.parentNode.parentNode.parentNode,
    rt_id = tr.parentNode.getAttribute('data-rt-id'),
    storage_id = tr.parentNode.getAttribute('data-storage-id'),
    key = tr.hasAttribute('data-storage-key') ? tr.getAttribute('data-storage-key') :
          (tr.getElementsByTagName('input')[0] && tr.getElementsByTagName('input')[0].value),
    item = window.storages[storage_id].get_item(rt_id, key);

    if (tr.hasAttribute('data-storage-key') || is_success)
    {
      window.storages[storage_id].update();
      tr.parentNode.replaceChild(document.render(window.templates.storage_item(item)), tr);
      window.storages[storage_id].set_item_edit(rt_id, key, false);
    }
    else
    {
      tr.parentNode.removeChild(tr);
    }
  }.bind(this);

  this._handlers['delete'] = function(event, target)
  {
    var
    tr = event.target.has_attr("parent-node-chain", "data-storage-key"),
    rt_id = tr.parentNode.getAttribute('data-rt-id'),
    storage_id = tr.parentNode.getAttribute('data-storage-id'),
    key = tr.getAttribute('data-storage-key');

    window.storages[storage_id].remove_item(rt_id, key, function(success)
    {
      if (success)
      {
        tr.parentNode.removeChild(tr);
      }
      else
      {
        // TODO
      }
    });
  }.bind(this);

  this._handlers['delete-all'] = function(event, target)
  {
    var
    table = event.target.parentNode.parentNode.parentNode,
    rt_id = table.getAttribute('data-rt-id'),
    storage_id = table.getAttribute('data-storage-id');

    window.storages[storage_id].clear(parseInt(rt_id));
  }.bind(this);

  this._handlers['update'] = function(event, target)
  {
    window.storages[event.target.parentNode.parentNode.parentNode.getAttribute('data-storage-id')].update();
  }.bind(this);

  this._handlers['add-key'] = function(event, target)
  {
    var
    tr = event.target.has_attr("parent-node-chain", "data-rt-id").querySelector("tr:last-of-type"),
    rt_id = tr.parentNode.getAttribute('data-rt-id'),
    storage_id = tr.parentNode.getAttribute('data-storage-id');

    tr.parentNode.insertBefore(document.render(window.templates.storage_item_add()), tr);
  }.bind(this);

  this.handle = function(action_id, event, target)
  {
    if (action_id in this._handlers)
      return this._handlers[action_id](event, target);
  }
};

window.eventHandlers.dblclick['storage-edit'] = function(event, target)
{
  this.broker.dispatch_action("storage-view", "edit", event, target);
};

window.eventHandlers.click['storage-save'] = function(event, target)
{
  this.broker.dispatch_action("storage-view", "save", event, target);
};

// TODO: what is is_success?
window.eventHandlers.click['storage-edit-cancel'] = function(event, target, is_success)
{
  var
  tr = event.target.parentNode.parentNode.parentNode,
  rt_id = tr.parentNode.getAttribute('data-rt-id'),
  storage_id = tr.parentNode.getAttribute('data-storage-id'),
  key = tr.hasAttribute('data-storage-key') ? tr.getAttribute('data-storage-key') :
        (tr.getElementsByTagName('input')[0] && tr.getElementsByTagName('input')[0].value),
  item = window.storages[storage_id].get_item(rt_id, key);

  if (tr.hasAttribute('data-storage-key') || is_success)
  {
    window.storages[storage_id].update();
    tr.parentNode.replaceChild(document.render(window.templates.storage_item(item)), tr);
    window.storages[storage_id].set_item_edit(rt_id, key, false);
  }
  else
  {
    tr.parentNode.removeChild(tr);
  }
  //this.broker.dispatch_action("storage-view", "edit-cancel", event, target);
};

window.eventHandlers.click['storage-delete'] = function(event, target)
{
  this.broker.dispatch_action("storage-view", "delete", event, target);
};

window.eventHandlers.click['storage-delete-all'] = function(event, target)
{
  this.broker.dispatch_action("storage-view", "delete-all", event, target);
};

window.eventHandlers.click['storage-update'] = function(event, target)
{
  this.broker.dispatch_action("storage-view", "update", event, target);
};

window.eventHandlers.click['storage-add-key'] = function(event, target)
{
  this.broker.dispatch_action("storage-view", "add-key", event, target);
};

