window.cls || (window.cls = {});

cls.StorageView = function(id, name, container_class, storage_name)
{
  this.createView = function(container)
  {
    var storage = window.storages[id];
    this._sortable_table = this._sortable_table || new SortableTable(storage.tabledef, null, null, null, "runtime", true, storage_name);
    container.setAttribute("data-storage-id", storage_name);
    container.setAttribute("data-menu", "storage-view"); // local_storage / session_storage by default

    this._sortable_table.add_listener("before-render", this._before_table_render.bind(this));
    this._sortable_table.add_listener("after-render", this._after_table_render.bind(this));

    if (storage.is_setup)
    {
      if (storage.exists)
      {
        var storage_data = storage.get_storages_plain();
        this._sortable_table.set_data(storage_data);
        this._before_table_render({table: container.querySelector(".sortable-table")});
        table = container.clearAndRender(this._sortable_table.render());
        this._after_table_render({table: table});
      }
      else
      {
        container.clearAndRender(window.templates.storage.not_existing(storage.storage_object));
      }
    }
    else
    {
      container.innerHTML = "";
      storage.get_storages();
    }
  };

  this.create_disabled_view = function(container)
  {
    container.clearAndRender(window.templates.disabled_view());
  };

  this._before_table_render = function(message)
  {
    var table = message.table;
    if (table)
    {
      // save selection
      var selection = table.querySelectorAll(".selected");
      this._restore_selection = this._restore_selection || [];
      for (var i=0, selected_node; selected_node = selection[i]; i++) {
        this._restore_selection.push(selected_node.getAttribute("data-object-id"));
      };
    }
  }

  this._after_table_render = function(message)
  {
    var table = message.table;
    if (table)
    {
      var data_storage_id = table.get_attr("parent-node-chain", "data-storage-id");
      var menu_id = data_storage_id.replace(/_/g, '-') + "-item";

      if (this._restore_selection)
      {
        for (var i=0, objectref; objectref = this._restore_selection[i]; i++)
        {
          var elem = table.querySelector("[data-object-id='"+objectref+"']");
          if (elem)
          {
            elem.addClass("selected");
          }
        };
        this._restore_selection = null;
      }
      // add context menus and handlers to rows
      for (var i=0, row; row = table.childNodes[i]; i++)
      {
        row.setAttribute("data-menu", menu_id);
        // summation-rows and headers should not have select and edit handlers
        if (
          !row.hasClass("sortable-table-summation-row") &&
          !row.hasClass("header")
        )
        {
          row.setAttribute("handler", "storage-row");
          row.setAttribute("edit-handler", "storage-row");
        }
        // to avoid expensive tr[data-object-id ^= "runtime_placeholder_"] selectors
        if (
          row.getAttribute("data-object-id") &&
          row.getAttribute("data-object-id").startswith("runtime_placeholder_")
        )
        {
          row.addClass("runtime_placeholder");
        }
      }
      // textarea-autosize
      var autosize_elements = table.querySelectorAll("textarea");
      var broker = ActionBroker.get_instance();
      for (var i=0, element; element = autosize_elements[i]; i++)
      {
        broker.dispatch_action(data_storage_id, "textarea-autosize", null, element);
      };
    }
  };

  this.on_storage_update = function(msg)
  {
    if (msg.storage_id == this.id)
    {
      this.update();
    }
  };

  this.required_services = ["ecmascript-debugger"];
  window.storages[id].addListener("storage-update", this.on_storage_update.bind(this));
  this.init(id, name, container_class, null, "storage-view");
};
cls.StorageView.prototype = ViewBase;
