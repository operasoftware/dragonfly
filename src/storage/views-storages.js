window.cls || (window.cls = {});

cls.StorageView = function(id, name, container_class, storage_name)
{
  const
  MODE_DEFAULT = "default",
  MODE_EDIT = "edit";

  this.createView = function(container)
  {
    var storage = window.storages[id];
    this._sortable_table = new SortableTable(storage.tabledef, null, null, null, "runtime", true);
    container.setAttribute("data-storage-id", storage_name);
    container.setAttribute("data-menu", "storage-view"); // local_storage/session_storage by default

    this._sortable_table.add_listener("before-render", this._before_table_render.bind(this));
    this._sortable_table.add_listener("after-render", this._after_table_render.bind(this));

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
        // container.clearAndRender(["div", this._sortable_table.render(), "class", "sortable_table_container", "handler", "sortable_table_container"]); // todo: wonder what the handler was for?
        container.clearAndRender(["div", this._sortable_table.render(), "class", "sortable_table_container"]);
        this._after_table_render();
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

  this._before_table_render = function()
  {
    // save selection
    var table_elem = document.querySelector(".sortable_table_container")
                     && document.querySelector(".sortable_table_container").firstChild;
    if (table_elem)
    {
      var selection = table_elem.querySelectorAll(".selected");
      this._restore_selection = this._restore_selection || [];
      for (var i=0, selected_node; selected_node = selection[i]; i++) {
        this._restore_selection.push(selected_node.getAttribute("data-object-id"));
      };
    }
  }

  this._after_table_render = function()
  {
    // restore selection
    var table_elem = document.querySelector(".sortable_table_container") 
                     && document.querySelector(".sortable_table_container").firstChild;
    if (this._restore_selection)
    {
      for (var i=0, objectref; objectref = this._restore_selection[i]; i++) {
        var elem = table_elem.querySelector("[data-object-id='"+objectref+"']");
        if (elem)
        {
          elem.addClass("selected");
        }
      };
      this._restore_selection = null;
    }
    // add context menus and handlers to rows
    for (var i=0, row; row = table_elem.childNodes[i]; i++)
    {
      row.setAttribute("data-menu", "storage-item");
      row.setAttribute("handler", "storage-row");
      row.setAttribute("edit-handler", "storage-row");
    }
    // textarea-autosize
    var data_storage_id = table_elem.get_attr("parent-node-chain", "data-storage-id");
    var autosize_elements = table_elem.querySelectorAll("textarea");
    var broker = ActionBroker.get_instance();
    for (var i=0, element; element = autosize_elements[i]; i++) {
      broker.dispatch_action(data_storage_id, "textarea-autosize", null, element);
    };
  }

  this._submit = function(event, target)
  {
    this.exit_edit_and_save();
    return false;
  }

  this._cancel = function(event, target)
  {
    this.data.refetch();
    this.mode = MODE_DEFAULT;
    return false;
  }

  this._remove_item = function(event, target)
  {
    var table_elem = document.querySelector(".sortable_table_container").firstChild;
    var selection = table_elem.querySelectorAll(".selected");
    var selected_cookie_objects = [];
    for (var i=0, selected_node; selected_node = selection[i]; i++) {
      var sel_cookie_obj = this.data.get_cookie_by_objectref(selected_node.getAttribute("data-object-id"));
      selected_cookie_objects.push(sel_cookie_obj);
    };
    this.data.remove_cookies(selected_cookie_objects);
    return false;
  }

  this.on_storage_update = function(msg)
  {
    if (msg.storage_id == this.id)
    {
      this.update();
    }
  };

  window.storages[id].addListener("storage-update", this.on_storage_update.bind(this));
  this.init(id, name, container_class, null, "storage-view");
};
cls.StorageView.prototype = ViewBase;
