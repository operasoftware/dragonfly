var cls = window.cls || ( window.cls = {} );

cls.LocalStorageView = function(id, name, container_class)
{
  this.createView = function(container)
  {
    var 
    inner_container = container.clearAndRender(['div', 'class', 'padding table']);
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
    this.update();
  }
  var stoarge = null, storage_name = '';
  for (storage_name in window.storages)
  {
    if(window.storages.hasOwnProperty(storage_name))
    {
      window.storages[storage_name].addListener('storage-update', this.on_storage_update.bind(this));
    }
  }

  this.init(id, name, container_class);
};

cls.LocalStorageView.prototype = ViewBase;
