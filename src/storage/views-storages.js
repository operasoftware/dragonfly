window.cls || (window.cls = {});

cls.StorageView = function(id, name, container_class, storage_name)
{
  this.createView = function(container)
  {
    var storage = window.storages[id];
    if(storage.is_setup)
    {
      if(storage.exists)
      {
        container.clearAndRender(window.templates.storage(storage.get_storages(), storage.id, storage.title)); 
      }
      else
      {
        container.clearAndRender(window.templates.storage_not_existing(storage.storage_object));
      }
    }
    else
    {
      container.innerHTML = "";
      storage.get_storages();
    }
  }

  this.on_storage_update = function(msg)
  {
    if(msg.storage_id == this.id)
    {
      this.update();
    }
  }

  window.storages[id].addListener('storage-update', this.on_storage_update.bind(this));
  this.init(id, name, container_class);
};

cls.StorageView.prototype = ViewBase;
