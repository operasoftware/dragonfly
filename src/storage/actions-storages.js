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

  this._update = function(storage_id, success)
  {
    window.storages[storage_id].update();
  }.bind(this, id);

  this._handlers["edit"] = function(event, target)
  {
    this.mode = MODE_EDIT; // todo: why doesn't this work?
    ActionBroker.get_instance()._action_context.mode = MODE_EDIT;

    var container = target;
    while(container && !container.getAttribute("data-storage-id"))
    {
      container = container.parentNode;
    }
    if (container)
    {
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
    }
  }.bind(this);

  this._handlers["submit"] = function(event, target)
  {
    this.mode = MODE_DEFAULT;
    var container = target;
    while(container && !container.getAttribute("data-storage-id"))
    {
      container = container.parentNode;
    }

    if(container)
    {
      var storage_id = container.getAttribute("data-storage-id");
      var edit_trs = container.querySelectorAll("tr.edit_mode");
      for (var i=0, edit_tr; edit_tr = edit_trs[i]; i++)
      {
        var rt_id        = +edit_tr.querySelector("[name=rt_id]").value;
        var original_key = edit_tr.querySelector("[name=original_key]").value;
        var key          = edit_tr.querySelector("[name=key]").value;
        var value        = edit_tr.querySelector("[name=value]").value;
        window.storages[storage_id].remove_item(rt_id, original_key, this._update);
        window.storages[storage_id].set_item(rt_id, key, value, this._update);
      }
      return false;
    }
  }.bind(this);

  this._handlers["remove-item"] = function(event, target, object_ids)
  {
    var container = target;
    while(container && !container.getAttribute("data-storage-id"))
    {
      container = container.parentNode;
    }
    if (container)
    {
      var storage_id = container.getAttribute("data-storage-id");
      var selection = container.querySelectorAll("tr.selected");
      for (var i=0, selected; selected = selection[i]; i++)
      {
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
    }
  };

  this._handlers["delete-all"] = function(event, target)
  {
    var container = target;
    while(container && !container.getAttribute("data-storage-id"))
    {
      container = container.parentNode;
    }
    if (container)
    {
      var storage_id = container.getAttribute("data-storage-id");
      var rt_id = +target.querySelector("[name=rt_id]").value;
      window.storages[storage_id].clear(rt_id);
      window.storages[storage_id].update();
    }
  }.bind(this);

  this._handlers["update"] = this._handlers["cancel"] = function(event, target)
  {
    var container = target;
    while(container && !container.getAttribute("data-storage-id"))
    {
      container = container.parentNode;
    }
    if (container)
    {
      window.storages[container.getAttribute("data-storage-id")].update();
      return false;
    }
  }.bind(this);

  this._handlers["add-key"] = function(event, target)
  {
    this.mode = MODE_EDIT;
    ActionBroker.get_instance()._action_context.mode = MODE_EDIT;

    var row = target;
    while (row && row.nodeName != "tr")
    {
      row = row.parentElement;
    }
    var item_id = row && row.getAttribute("data-object-id");

    var header_row = row;
    while (header_row && !header_row.hasClass("header"))
    {
      header_row = header_row.previousElementSibling;
    }
    var runtime_id = header_row && header_row.getAttribute("data-object-id");

    var container = target;
    while(container && !container.getAttribute("data-storage-id"))
    {
      container = container.parentNode;
    }

    if(container && runtime_id)
    {
      if (!container.querySelector(".add_storage_row")) // don't restore when adding multiple items at once
      {
        var table_elem = container.querySelector(".sortable-table");
        if(table_elem)
        {
          var table = ObjectRegistry.get_instance().get_object(table_elem.getAttribute("data-table-object-id"));
          if (table)
          {
            table.restore_columns(table_elem);
          }
        }
      }

      var insert_before_row;
      if (item_id) // came from context menu of an item
      {
        insert_before_row = container.querySelector("[data-object-id='" + item_id + "']");
        if (insert_before_row && insert_before_row.nextElementSibling)
        {
          insert_before_row = insert_before_row.nextElementSibling;
        }
      }
      else // came from add storage button
      {
        // find header row, traverse to summation_row
        insert_before_row = container.querySelector("[data-object-id='" + runtime_id + "']");
        while (insert_before_row && !insert_before_row.hasClass("sortable-table-summation-row"))
        {
          insert_before_row = insert_before_row.nextElementSibling;
        }
      }

      if (insert_before_row)
      {
        var templ = document.documentElement.render(window.templates.storage.add_storage_row(runtime_id));
        var inserted = insert_before_row.parentElement.insertBefore(templ, insert_before_row);
        this._handlers["select-row"](event, inserted);
        var textarea = inserted.querySelector("textarea");
        if (textarea)
        {
          this._handlers["textarea-autosize"](null, textarea);
        }
        var key = inserted.querySelector("[name=key]");
        if (key)
        {
          key.focus();
        }
      }
    }
  }.bind(this);

  this._handlers["select-row"] = function(event, target)
  {
    /**
      * unselect everything unless
      *   it's a row that adds a storage item
      *   doing multiple selection, which is when:
      *     cmd / ctrl key is pressed OR
      *     more than 1 item is already selected && event is right-click, clicked item was already selected
      */
    var container = target;
    while (container && !container.getAttribute("data-storage-id"))
    {
      container = container.parentNode;
    }

    var selection = container.querySelectorAll(".sortable-table .selected");
    if (!( event.ctrlKey || (selection.length > 1 && event.button === 2 && target.hasClass("selected")) ))
    {
      for (var i=0, selected_node; selected_node = selection[i]; i++)
      {
        if (!selected_node.hasClass("add_storage_row"))
        {
          selected_node.removeClass("selected");
        }
      };
    }
    // unselect, works with multiple selection as ".selected" was removed otherwise
    if (event.ctrlKey && target.hasClass("selected"))
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
    if (target)
    {
      // todo: find a good place for this. will be the same for all textareas.
      var max_height = parseInt(document.defaultView.getComputedStyle(target, null).maxHeight, 10);
      // Can't rely on scrollHeight to shrink when it has less content, even if that's how it works in O11.
      // In other browsers, when height is set, scrollHeight is max(height, scrollHeight)
      target.style.height = null;
      target.style.height = target.scrollHeight + "px";
      if (target.scrollHeight > max_height)
      {
        if(!target.style.overflow)
        {
          target.style.overflow = "visible";
        }
      }
      else
      if (target.style.overflow) {
        target.style.overflow = null;
      }
    }
  };

  this.onclick = function(event)
  {
    var is_editing;
    // was add_storage button clicked?
    if (event.target.hasClass("add_storage_button"))
    {
      is_editing = true;
    }
    // was something in an edit-container clicked?
    var edit_container = event.target;
    while(edit_container && edit_container.parentNode)
    {
      if (edit_container.hasClass("edit_mode"))
      {
        is_editing = true;
        break;
      }
      edit_container = edit_container.parentNode;
    }
    if (!is_editing && this.mode == MODE_EDIT)
    {
      this._handlers["submit"](event, event.target);
      return false;
    }
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
    while (target && target.nodeName !== "tr")
    {
      target = target.parentNode;
    }
    if (target)
    {
      this._handlers["select-row"](event, target);
      var container = target;
      while (container && !container.getAttribute("data-storage-id"))
      {
        container = container.parentNode;
      }
      var selection = container.querySelectorAll("tr.selected");
      var remove_label = ui_strings.M_CONTEXTMENU_STORAGE_DELETE;
      if (selection.length > 1)
      {
        remove_label = ui_strings.M_CONTEXTMENU_STORAGE_DELETE_PLURAL;
      }
      var options = [
        {
          label: ui_strings.M_CONTEXTMENU_STORAGE_ADD,
          handler: this._handlers["add-key"]
        },
        {
          label: ui_strings.M_CONTEXTMENU_STORAGE_EDIT,
          handler: this._handlers["edit"]
        },
        {
          label: remove_label,
          handler: this._handlers["remove-item"]
        }
      ];

      var rt_id = target.querySelector("[name=rt_id]") && +target.querySelector("[name=rt_id]").value;
      if (rt_id)
      {
        options.push({
          label: ui_strings.M_CONTEXTMENU_STORAGE_DELETE_ALL_FROM.replace(/%s/, runtimes.getRuntime(rt_id).uri),
          handler: this._handlers["delete-all"]
        });
      }
      return options;
    }
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

window.eventHandlers.click["storage-view"] = function(event, target)
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

window.eventHandlers.input["storage-input-field"] = function(event, target)
{
  if(target.nodeName === "textarea")
  {
    var data_storage_id = target.get_attr("parent-node-chain", "data-storage-id");
    this.broker.dispatch_action(data_storage_id, "textarea-autosize", event, target);
  }
}

window.eventHandlers.focus["textarea-focus"] = function(event, target)
{
  var data_storage_id = target.get_attr("parent-node-chain", "data-storage-id");
  this.broker.dispatch_action(data_storage_id, "textarea-focus", event, target);
}

window.eventHandlers.blur["textarea-blur"] = function(event, target)
{
  var data_storage_id = target.get_attr("parent-node-chain", "data-storage-id");
  this.broker.dispatch_action(data_storage_id, "textarea-blur", event, target);
}