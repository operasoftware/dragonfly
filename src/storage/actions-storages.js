var cls = window.cls || (window.cls = {});

cls.StorageViewActions = function(id)
{
  const
  MODE_DEFAULT = "default",
  MODE_EDIT = "edit";

  this.id = id;
  this.inherited_shortcuts = "storage";
  ActionHandlerInterface.apply(this);
  this._handlers = {};

  this._handlers["edit"] = function(event, target)
  {
    this.mode = MODE_EDIT;
    var container = target;
    while(!container.getAttribute("data-storage-id"))
    {
      container = container.parentNode;
    }
    var table_elem = container.querySelector(".sortable-table");
    var table = ObjectRegistry.get_instance().get_object(table_elem.getAttribute("data-table-object-id"));
    table.restore_columns(table_elem);
    // can't directly work with target because restore_columns has renewed it.
    var ref = target.getAttribute("data-object-id");
    var tr = container.querySelector("tr[data-object-id='"+ref+"']")
    tr.addClass("edit_mode");
    this._handlers["select-row"](event, tr);
    var textarea = tr.querySelector("textarea");
    if(textarea)
    {
      this._handlers["textarea-autosize"](null, textarea);
    }
  }.bind(this);

  this._handlers["submit"] = function(event, target)
  {
    this.mode = MODE_DEFAULT;

    var container = target;
    while(!container.getAttribute("data-storage-id"))
    {
      container = container.parentNode;
    }

    var storage_id = container.getAttribute("data-storage-id");
    var edit_trs = container.querySelectorAll("tr.edit_mode");
    for (var i=0, edit_tr; edit_tr = edit_trs[i]; i++)
    {
      var rt_id = +edit_tr.querySelector("[name=rt_id]").value.trim();
      var key   = edit_tr.querySelector("[name=key]").value.trim();
      var value = edit_tr.querySelector("[name=value]").value;

      window.storages[storage_id].set_item(rt_id, key, value, function(storage_id, success)
      {
        window.storages[storage_id].update();
      }.bind(this, storage_id))
    }
  }.bind(this);

  this._handlers["remove-item"] = function(event, target)
  {
    var container = target;
    while(!container.getAttribute("data-storage-id"))
    {
      container = container.parentNode;
    }
    var storage_id = container.getAttribute("data-storage-id");
    var selection = container.querySelectorAll("tr.selected");
    for (var i=0, selected; selected = selection[i]; i++) {
      selection[i]
      var rt_id = +selected.querySelector("[name=rt_id]").value;
      var key   = selected.querySelector("[name=key]").value;
      var cb = function(){};
      if(i === selection.length - 1)
      {
        cb = function(storage_id, success)
        {
          window.storages[storage_id].update();
        }.bind(this, storage_id);
      }
      window.storages[storage_id].remove_item(rt_id, key, cb);
    };
    return false;
  };

  this._handlers["delete-all"] = function(event, target) // todo: "remove" is the new "delete"
  {
    var container = target;
    while(!container.getAttribute("data-storage-id"))
    {
      container = container.parentNode;
    }
    var storage_id = container.getAttribute("data-storage-id");
    var rt_id = +target.querySelector("[name=rt_id]").value;
    window.storages[storage_id].clear(rt_id);
    // todo: use callback to update? OR, maybe even better, trigger the update after clear, remove_item, set_item
    window.storages[storage_id].update();
  }.bind(this);

  this._handlers["update"] = this._handlers["cancel"] = function(event, target)
  {
    var container = target;
    while(!container.getAttribute("data-storage-id"))
    {
      container = container.parentNode;
    }
    window.storages[container.getAttribute("data-storage-id")].update();
    return false;
  }.bind(this);

  this._handlers["add-key"] = function(event, target)
  {
    this.mode = MODE_EDIT;
    var row = target;
    while (row.nodeName != "tr")
    {
      row = row.parentElement;
    }
    if (!document.querySelector(".add_storage_row")) // add multiple items at once
    {
      // todo: how to reach _sortable_table from actions?
      // this._sortable_table.restore_columns(document.querySelector(".sortable_table_container").firstChild);
    }
    var header_row = row;
    while (!header_row.hasClass("header"))
    {
      header_row = header_row.previousElementSibling;
    }
    var runtime_id = header_row.getAttribute("data-object-id");
    var templ = document.documentElement.render(window.templates.storage.add_storage_row(runtime_id));
    var inserted = row.parentElement.insertBefore(templ, row);
    inserted.querySelector("[name=key]").focus();
  }.bind(this);

  this._handlers["select-row"] = function(event, target)
  {
    // trigger safe if target is not in edit mode
    if (!target.hasClass("edit_mode"))
    {
      ActionBroker.get_instance().dispatch_action(id, "submit", event, target);
    }

    /**
      * unselect everything while not doing multiple selection, which is when:
      *   cmd / ctrl key is pressed OR
      *   more than 1 item is already selected && event is right-click, clicked item was already selected
      */
    var container = target;
    while (!container.getAttribute("data-storage-id"))
    {
      container = container.parentNode;
    }
    var selection = container.querySelectorAll(".sortable-table .selected");
    if (!( event.ctrlKey || (selection.length > 1 && event.button === 2 && target.hasClass("selected")) ))
    {
      for (var i=0, selected_node; selected_node = selection[i]; i++) {
        selected_node.removeClass("selected");
      };
    }
    // unselect, works with multiple selection as ".selected" was removed otherwise
    if(event.ctrlKey && target.hasClass("selected"))
    {
      target.removeClass("selected");
    }
    else
    {
      target.addClass("selected");
    }
  };

  this._handlers["textarea-autosize"] = function(event, target)
  {
    target.style.height = target.scrollHeight + "px";
  };

  var broker = ActionBroker.get_instance();
  broker.register_handler(this);

  var contextmenu = ContextMenu.get_instance();

  contextmenu.register("storage-view", [
    {
      label: ui_strings.S_LABEL_STORAGE_UPDATE,
      handler: function(event, target) {
        broker.dispatch_action(id, "update", event, target)
      }
    }
  ]);

  this._create_context_menu = function(event, target)
  {
    // this.check_to_exit_edit_mode(event, target); // todo, or possibly remove it from cookie view
    while (target.nodeName !== "tr" || !target.parentNode)
    {
      target = target.parentNode;
    }
    var rt_id = +target.querySelector("[name=rt_id]").value;
    this._handlers["select-row"](event, target);

    var container = target;
    while (!container.getAttribute("data-storage-id"))
    {
      container = container.parentNode;
    }
    var selection = container.querySelectorAll("tr.selected");
    var remove_label = ui_strings.M_CONTEXTMENU_STORAGE_DELETE;
    if(selection.length > 1)
    {
      remove_label = ui_strings.M_CONTEXTMENU_STORAGE_DELETE_PLURAL;
    }
    return [
      {
        label: ui_strings.M_CONTEXTMENU_STORAGE_ADD,
        handler: function(event, target) {
          broker.dispatch_action(id, "add-key", event, target)
        }
      },
      {
        label: ui_strings.M_CONTEXTMENU_STORAGE_EDIT,
        handler: function(event, target) {
          broker.dispatch_action(id, "edit", event, target)
        }
      },
      {
        label: remove_label,
        handler: function(event, target) {
          broker.dispatch_action(id, "remove-item", event, target)
        }
      },
      {
        label: ui_strings.M_CONTEXTMENU_STORAGE_DELETE_ALL_FROM.replace(/%s/, runtimes.getRuntime(rt_id).uri),
        handler: function(event, target) {
          broker.dispatch_action(id, "delete-all", event, target)
        }
      }
    ]
  };

  contextmenu.register("storage-item", [
    {
      callback: this._create_context_menu.bind(this)
    }
  ]);
};

window.eventHandlers.dblclick["storage-row"] = function(event, target)
{
  var data_storage_id = target.get_attr("parent-node-chain", "data-storage-id");
  this.broker.dispatch_action(data_storage_id, "edit", event, target);
}

window.eventHandlers.click["storage-row"] = function(event, target)
{
  var data_storage_id = target.get_attr("parent-node-chain", "data-storage-id");
  this.broker.dispatch_action(data_storage_id, "select-row", event, target);
}

window.eventHandlers.click["storage"] = function(event, target) // todo: make this the view container instead
{
  var data_storage_id = target.get_attr("parent-node-chain", "data-storage-id");
  this.broker.dispatch_action(data_storage_id, "submit", event, target);
}

window.eventHandlers.click["storage-add-key"] = function(event, target)
{
  var data_storage_id = target.get_attr("parent-node-chain", "data-storage-id");
  this.broker.dispatch_action(data_storage_id, "add-key", event, target);
}

window.eventHandlers.click["storage-input-field"] = function(event, target)
{
  // Empty for now, but preventing click['storage-container']
  // which exits editing
}

window.eventHandlers.keyup["storage-input-field"] = function(event, target)
{
  if(target.nodeName === "textarea")
  {
    var data_storage_id = target.get_attr("parent-node-chain", "data-storage-id");
    this.broker.dispatch_action(data_storage_id, "textarea-autosize", event, target);
  }
}
