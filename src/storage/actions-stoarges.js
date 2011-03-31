var cls = window.cls || (window.cls = {});

cls.StorageViewActions = function(id)
{
  const
  MODE_DEFAULT = "default",
  MODE_EDIT = "edit";

  this.id = id;
  this._broker = ActionBroker.get_instance();
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
    container.querySelector("tr[data-object-id='"+ref+"']").addClass("edit_mode");
  }.bind(this);

  this._handlers["my_save"] = function(event, target)
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

      window.storages[storage_id].set_item(rt_id, key, value, function(container, success)
      {
        var storage_id = container.getAttribute("data-storage-id");
        window.storages[storage_id].update();
        window.views[storage_id].update();
      }.bind(this, container))
    }
  }.bind(this);
  
  this._handlers["submit"] = function(event, target)
  {
    console.log("submit handler");
    this._handlers["my_save"](event, target);
    return false;
  }

  this._handlers['edit-cancel'] = function(event, target)
  {
    var
    tr = event.target.parentNode.parentNode.parentNode,
    rt_id = tr.parentNode.getAttribute('data-rt-id'),
    storage_id = tr.parentNode.getAttribute('data-storage-id'),
    key = tr.hasAttribute('data-storage-key') ? tr.getAttribute('data-storage-key') :
          (tr.getElementsByTagName('input')[0] && tr.getElementsByTagName('input')[0].value),
    item = window.storages[storage_id].get_item(rt_id, key);

    if (tr.hasAttribute('data-storage-key') || is_success)
    {
      window.storages[storage_id].update();
      tr.parentNode.replaceChild(document.render(window.templates.storage_item(item)), tr);
      window.storages[storage_id].set_item_edit(rt_id, key, false);
    }
    else
    {
      tr.parentNode.removeChild(tr);
    }
  }.bind(this);

  this._handlers['delete'] = function(event, target)
  {
    var
    tr = event.target.has_attr("parent-node-chain", "data-storage-key"),
    rt_id = tr.parentNode.getAttribute('data-rt-id'),
    storage_id = tr.parentNode.getAttribute('data-storage-id'),
    key = tr.getAttribute('data-storage-key');

    window.storages[storage_id].remove_item(rt_id, key, function(success)
    {
      if (success)
      {
        tr.parentNode.removeChild(tr);
      }
      else
      {
        // TODO
      }
    });
  }.bind(this);

  this._handlers['delete-all'] = function(event, target)
  {
    var
    table = event.target.parentNode.parentNode.parentNode,
    rt_id = table.getAttribute('data-rt-id'),
    storage_id = table.getAttribute('data-storage-id');

    window.storages[storage_id].clear(parseInt(rt_id));
  }.bind(this);

  this._handlers['update'] = function(event, target)
  {
    // todo: parentNode.parentNode.parentNode won't work. unsure if it's need anyway when theres no update button.
    console.log("update", arguments);
    window.storages[target.parentNode.parentNode.parentNode.getAttribute('data-storage-id')].update();
  }.bind(this);

  // nu
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
      // this._sortable_table.restore_columns(document.querySelector(".storage_table_container").firstChild);
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
      ActionBroker.get_instance().dispatch_action("storage-view", "my_save", event, target);
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
    target.addClass("selected");
  };

  ActionBroker.get_instance().register_handler(this);
};

window.eventHandlers.click['storage-delete'] = function(event, target)
{
  this.broker.dispatch_action("storage-view", "delete", event, target);
};

window.eventHandlers.click['storage-delete-all'] = function(event, target)
{
  this.broker.dispatch_action("storage-view", "delete-all", event, target);
};

window.eventHandlers.click['storage-update'] = function(event, target)
{
  this.broker.dispatch_action("storage-view", "update", event, target);
};

window.eventHandlers.click['storage-add-key'] = function(event, target)
{
  this.broker.dispatch_action("storage-view", "add-key", event, target);
};

// nu
window.eventHandlers.dblclick['storage-row'] = function(event, target)
{
  this.broker.dispatch_action("storage-view", "edit", event, target);
}

window.eventHandlers.click['storage-row'] = function(event, target)
{
  this.broker.dispatch_action("storage-view", "select-row", event, target);
}

window.eventHandlers.click["storage-view"] = function(event, target) // todo: make this the view container instead
{
  // todo: find out why "save" doesn't work as an action name.
  this.broker.dispatch_action("storage-view", "my_save", event, target);
}

window.eventHandlers.click['storage-add-key'] = function(event, target)
{
  this.broker.dispatch_action("storage-view", "add-key", event, target);
}

window.eventHandlers.click['storage-input-field'] = function(event, target)
{
  // Empty for now, but preventing click['storage-container']
  // which exits editing
}

