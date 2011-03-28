window.cls || (window.cls = {});

cls.StorageView = function(id, name, container_class, storage_name)
{
  this.createView = function(container)
  {
    var storage = window.storages[id];

    this._sortable_table = new SortableTable(storage.tabledef, null, null, null, null, true);
    // this._sortable_table.add_listener("before-render", this._before_table_render.bind(this));
    // this._sortable_table.add_listener("after-render", this._after_table_render.bind(this));

    if (storage.is_setup)
    {
      if (storage.exists)
      {
        var storage_data = storage.get_storages_plain();
        this._sortable_table.data = storage_data;
        if (!this._update_expiry_interval)
        {
          this._update_expiry_interval = setInterval(this._bound_update_expiry, 15000);
        }
        // this._before_table_render();
        container.clearAndRender(["div", this._sortable_table.render(), "class", "storage_table_container"]);
        // this._after_table_render();
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
