var cls = window.cls || ( window.cls = {} );

cls.LocalStorageView = function(id, name, container_class)
{
  this.createView = function(container)
  {
    var storages = window.local_storage_data.get_local_storages();
    container.innerHTML = "<div class='padding'>" + JSON.stringify(storages) + "</div>";
  }
  this.on_local_storage_update = function(msg)
  {
    this.update();
  }
  window.local_storage_data.addListener('local-storage-update', this.on_local_storage_update.bind(this));
  this.init(id, name, container_class);
};

cls.LocalStorageView.prototype = ViewBase;
