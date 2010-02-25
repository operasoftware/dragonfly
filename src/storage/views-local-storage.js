var cls = window.cls || ( window.cls = {} );

cls.LocalStorageView = function(id, name, container_class)
{
  this.createView = function(container)
  {
    var 
    inner_container = container.clearAndRender(['div', 'class', 'table-full-width']);
    stoarge = null, 
    storage_name = '';
    
    for (storage_name in window.storages)
    {
      if(window.storages.hasOwnProperty(storage_name))
      {
        storage = window.storages[storage_name];
        inner_container.render(window.templates.storage(storage.get_storages(), storage.id, storage.title));
      }
    }
    
  }

  this.on_storage_update = function(msg)
  {
    if(this.isvisible())
    {
      var 
      tables = document.getElementsByTagName('table'), 
      table = null, 
      storage = null,
      storage_container = null,
      i = 0;

      for( ; table = tables[i]; i++)
      {
        if(table.getAttribute('data-storage-id') == msg.storage_id)
        {
          storage = window.storages[msg.storage_id];
          storage_container = document.render(
            window.templates.storage(storage.get_storages(), storage.id, storage.title));
          table = table.parentNode.parentNode;
          table.parentNode.replaceChild(storage_container, table);
          return;
        }
      }
    }
    this.update();
  }

  for (var storage_name in window.storages)
  {
    if(window.storages.hasOwnProperty(storage_name))
    {
      window.storages[storage_name].addListener('storage-update', this.on_storage_update.bind(this));
    }
  }

  this.init(id, name, container_class);
};

cls.LocalStorageView.prototype = ViewBase;
