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
    // add context menus per tr
    for (var i=0; i < this._table_elem.childNodes.length; i++)
    {
      this._table_elem.childNodes[i].setAttribute("data-menu", "cookie_context");
    }
    // todo: merge the two loops over tr's

    // select and dbl-click to edit
    var rows = this._table_elem.querySelectorAll("tr[data-object-id]");
    for (var i=0, row; row = rows[i]; i++) {
      row.setAttribute("handler", "storage-row-select");
      row.setAttribute("edit-handler", "storage-init-edit-mode");
    };
  }

  this.select_row = function(event, target) // public just towards actions
  {
    var event = event || {};
    this.check_to_exit_edit_mode(event, target); // todo: check if it's okay to always do that, was only in click action before
    /**
      * unselect everything while not doing multiple selection, which is when:
      *   cmd / ctrl key is pressed OR
      *   more than 1 item is already selected && event is right-click, clicked item was already selected
      */
    this._table_elem = document.querySelector(".storage_table_container").firstChild; // todo: move to var
    var selection = this._table_elem.querySelectorAll(".selected");
    if (!( event.ctrlKey || (selection.length > 1 && event.button === 2 && target.hasClass("selected")) ))
    {
      for (var i=0, selected_node; selected_node = selection[i]; i++) {
        selected_node.removeClass("selected");
      };
    }
    target.addClass("selected");
  };

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

  this.exit_edit_and_save = function()
  {
    this.mode = MODE_DEFAULT;

    var edit_trs = document.querySelectorAll("tr.edit_mode");
    for (var i=0, edit_tr; edit_tr = edit_trs[i]; i++) {
      // avoid refetching multiple times when saving multiple cookies.
      var is_last_item_in_list = (i == edit_trs.length - 1);
      var callback_after_set_item = (function(){});
      if (is_last_item_in_list)
      {
        callback_after_set_item = (function(){ /* this.data.refetch; */ }); // todo: trigger refetch message or something?
      }
      edit_tr.removeClass("edit_mode");

      var runtime = edit_tr.getAttribute("data-object-id");
      var key   = edit_tr.querySelector("[name=key]").value.trim();
      var value = edit_tr.querySelector("[name=value]").value;
      console.log("EDIT. NEW:", key, value);

      // todo: re-implement write
      /*
      if (key)
      {
        var new_object_ref = 

        if (old_cookie)
        {
          // remove old_cookie, on finished add new cookie
          this.data.remove_cookie(old_cookie._objectref, this.data.set_cookie.bind(this.data, new_cookie, callback_after_set_cookie));
        }
        else
        {
          this.data.set_cookie(new_cookie, callback_after_set_cookie);
        }
      }
      else
      {
        // todo: missing required info, needs feedback in UI. will refetch and discard for now.
        callback_after_set_cookie.call(this.data);
      }
      */
    }
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
  this.insert_add_cookie_row_before = function(row)
  {
    this.mode = MODE_EDIT;
    /*
    if (!document.querySelector(".add_cookie_row")) // todo: fix for adding multiple cookies at once
    {
      this._table_elem = document.querySelector(".storage_table_container").firstChild; // todo: move to var
      this._sortable_table.restore_columns(this._table_elem);
    }
    */

    var header_row = row;
    while (!header_row.hasClass("header"))
    {
      header_row = header_row.previousElementSibling;
    }
    var runtime_id = header_row.getAttribute("data-object-id");

    var templ = document.documentElement.render(window.templates.storage.add_storage_row(runtime_id));
    var inserted = row.parentElement.insertBefore(templ, row);
    inserted.querySelector("[name=key]").focus();
    this.select_row(null, inserted); // todo: check if it's nicer if a added row does not get selected, but the class gives it a selection-like style
  }

  this.on_storage_update = function(msg)
  {
    if (msg.storage_id == this.id)
    {
      this.update();
    }
  };

  this._init = this.init;
  this.init = function(id, name, container_class)
  {
    window.storages[id].addListener('storage-update', this.on_storage_update.bind(this));

    // todo: unsure, ActionHandlerInterface wants an id but this view get instanciated a few times, this.id is storage (more like view-id), id is local_storage, session_storage, whatever
    // this stuff was done in actions before, check if thats better.
    /*
    this.id = "storage"; // todo: check if thats needed
    ActionHandlerInterface.apply(this);
    this._handlers = {
      "submit": this._submit.bind(this),
      "cancel": this._cancel.bind(this),
      "remove-item": this._remove_item.bind(this),
      "select-row": this.select_row.bind(this),
      "enter-edit-mode": this.enter_edit_mode.bind(this),
      "check-to-exit-edit-mode": this.check_to_exit_edit_mode.bind(this),
      "add-row": this.click_add_storage_button.bind(this)
    };
    ActionBroker.get_instance().register_handler(this);
    this.id = id;
    */
    this._init(id, name, container_class, null, "storage-view");
  }
  this.init(id, name, container_class);
};

cls.StorageView.create_ui_widgets = function()
{
  

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
  // todo: also add context menu for contextmenu.register("local_storage", [ ..
};

cls.StorageView.prototype = ViewBase;
