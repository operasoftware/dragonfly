window.cls || (window.cls = {});

cls.StorageView = function(id, name, container_class, storage_name)
{
  const
  MODE_DEFAULT = "default",
  MODE_EDIT = "edit";
  console.log("storage_name", storage_name);

  this.createView = function(container)
  {
    var storage = window.storages[id];
    this._sortable_table = new SortableTable(storage.tabledef, null, null, null, "runtime", true);
    container.setAttribute("data-storage-id", storage_name);
    container.setAttribute("data-menu", "storage-view"); // this becomes local_storage etc. otherwise.

    // this._sortable_table.add_listener("before-render", this._before_table_render.bind(this));
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
        // this._before_table_render();
        container.clearAndRender(["div", this._sortable_table.render(), "class", "storage_table_container", "handler", "storage_table_container"]);
        this._after_table_render();
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

  this._after_table_render = function()
  {
    // todo: check if it's enough to keep _table_elem as a var
    this._table_elem = document.querySelector(".storage_table_container").firstChild;
    // restore selection
    if (this._restore_selection)
    {
      for (var i=0, objectref; objectref = this._restore_selection[i]; i++) {
        var elem = this._table_elem.querySelector("[data-object-id='"+objectref+"']");
        if (elem)
        {
          elem.addClass("selected");
        }
      };
      this._restore_selection = null;
    }
    // add context menus and handlers to rows
    for (var i=0, row; row = this._table_elem.childNodes[i]; i++)
    {
      row.setAttribute("data-menu", "storage-item");
      row.setAttribute("handler", "storage-row");
      row.setAttribute("edit-handler", "storage-row");
    }
  }

  
/*
  this.check_to_exit_edit_mode = function(event, target)
  {
    if (document.querySelector(".edit_mode") && !target.hasClass("add_storage_button"))
    {
      // find out if target is within some .edit_mode node. don't exit then.
      var walk_up = target;
      while (walk_up)
      {
        if (walk_up.hasClass("edit_mode"))
        {
          return;
        }
        walk_up = walk_up.parentElement;
      }
      this.exit_edit_and_save();
    }
  }
*/
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
    this._table_elem = document.querySelector(".storage_table_container").firstChild; // todo: move to var
    var selection = this._table_elem.querySelectorAll(".selected");
    var selected_cookie_objects = [];
    for (var i=0, selected_node; selected_node = selection[i]; i++) {
      var sel_cookie_obj = this.data.get_cookie_by_objectref(selected_node.getAttribute("data-object-id"));
      selected_cookie_objects.push(sel_cookie_obj);
    };
    this.data.remove_cookies(selected_cookie_objects);
    return false;
  }
/*
  this.enter_edit_mode = function(event, target)
  {
    this.mode = MODE_EDIT;
    console.log("enter_edit_mode - _sortable_table", this._sortable_table, this);
    this._table_elem = document.querySelector(".storage_table_container").firstChild; // todo: move to var
    this._sortable_table.restore_columns(this._table_elem);
    // can't directly work with target because restore_columns has renewed it
    var objectref = target.getAttribute("data-object-id");
    var target = document.querySelector(".sortable-table tr[data-object-id='"+objectref+"']").addClass("edit_mode");
  }
*/

/*
  this.click_add_storage_button = function(event, target)
  {
      // this normally checks are previous-siblings for data-object-id, finds at least 
      // runtime-placeholder, uses object-id to get object, takes its rt_id for a new one.
      // not so good anymore since items aren't really kept anywhere, which is probably better.
      // rt_id is now in data-object-id of group-headers, must still insert row directly above
      // summer..
      // todo: this won't work if sorting is off, should not be possible to turn that off for storage
    this.check_to_exit_edit_mode(event, target);
    // find closest runtime above button
    var row = target.parentElement.parentElement;
    this.insert_add_cookie_row_before(row);
  }
*/

  this.on_storage_update = function(msg)
  {
    if (msg.storage_id == this.id)
    {
      this.update();
    }
  };

  window.storages[id].addListener('storage-update', this.on_storage_update.bind(this)); // todo: check to send this message from actions, right now calls directly on global
  this.init(id, name, container_class, null, "storage-view");
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
    },
    {
      label: ui_strings.S_LABEL_COOKIE_MANAGER_REMOVE_COOKIES_OF.replace(/%s/, "<INSERT URI HERE>"), // todo: make this dynamic so it can react on multiple select and know the uri
      handler: function(event, target) {
        broker.dispatch_action("storage-view", "delete-all", event, target)
      }
    }
  ]);

  contextmenu.register("storage-view", [
    {
      label: ui_strings.S_LABEL_STORAGE_UPDATE,
      handler: function(event, target) {
        broker.dispatch_action("storage-view", "update", event, target)
      }
    }
  ]);
  
  // todo: also add context menu for contextmenu.register("local_storage", [ ..
};

cls.StorageView.prototype = ViewBase;
