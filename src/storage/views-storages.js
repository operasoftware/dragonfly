window.cls || (window.cls = {});

cls.StorageView = function(id, name, container_class, storage_name)
{
  this.createView = function(container)
  {
    var storage = window.storages[id];
    if (storage.is_setup)
    {
      if (storage.exists)
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
  };

  this.on_storage_update = function(msg)
  {
    if (msg.storage_id == this.id)
    {
      this.update();
    }
  };

  window.storages[id].addListener('storage-update', this.on_storage_update.bind(this));
  this.init(id, name, container_class);
};

cls.StorageView.create_ui_widgets = function()
{
  var broker = ActionBroker.get_instance();
  var contextmenu = ContextMenu.get_instance();
  contextmenu.register("storage-item", [
    {
      label: ui_strings.M_CONTEXTMENU_STORAGE_ADD,
      handler: function(event, target) {
        broker.dispatch_action("storage-view", "add-key", event, target)
      }
    },
    {
      label: ui_strings.M_CONTEXTMENU_STORAGE_EDIT,
      handler: function(event, target) {
        broker.dispatch_action("storage-view", "edit", event, target)
      }
    },
    {
      label: ui_strings.M_CONTEXTMENU_STORAGE_DELETE,
      handler: function(event, target) {
        broker.dispatch_action("storage-view", "delete", event, target)
      }
    }
  ]);
};

cls.StorageView.prototype = ViewBase;
