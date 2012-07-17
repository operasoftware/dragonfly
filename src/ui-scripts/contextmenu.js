/**
 * @constructor
 */
function ContextMenu() {
  if (ContextMenu._instance)
  {
    return ContextMenu._instance;
  }
  ContextMenu._instance = this;

  /**
   * All registered context menus.
   */
  this._registered_menus = {};
  this._current_items = null;

  this._broker = ActionBroker.get_instance();

  /**
   * Registers a new context menu.
   *
   * @param {String} menu_id An id corresponding to an id specified with a data-menu
   *                         attribute in the markup. May be an already existing
   *                         menu, in which case the items are added.
   * @param {Array} item_list An array of objects with 'label' and 'handler'
   *                          (function). Optionally it may have 'checked' (boolean)
   *                          for showing a checkbox before the item, or 'selected'
   *                          (boolean) for showing the selected item in a group.
   */
  this.register = function(menu_id, item_list, extend)
  {
    if (item_list)
    {
      if (this._registered_menus[menu_id] && extend)
      {
        item_list.extend(this._registered_menus[menu_id]);
      }
      this._registered_menus[menu_id] = item_list;
    }
  };

  /**
   * Global context menu event handler.
   */
  this.oncontextmenu = function(event)
  {

    var parents = [];
    var cur = event.target;
    while (cur)
      parents.push(cur = cur.parentNode);

    // Hide the currently visible context menu, if any
    this.dismiss();

    Tooltips.handle_contextmenu_event(event);

    CstSelectBase.close_opened_select();

    if (/*!window.getSelection().isCollapsed ||*/ event.shiftKey) // Shift key overrides for debugging
    {
      return;
    }

    // Prevent the normal context menu from showing up
    event.preventDefault();

    var ele = event.target;
    // The previous calls could have removed the event.target from the DOM.
    // In this case we re-dispatch the event if any element in
    // the parent node chain is still in the DOM.
    // (It would be better to get the new target with elementFromPoint
    //  but that is currently broken in XML documents.)
    if (!document.documentElement.contains(ele))
    {
      var new_target = null;
      while (new_target = parents.shift())
      {
        if (document.documentElement.contains(new_target))
          break;
      }

      if (new_target)
      {
        var new_event = document.createEvent("MouseEvent");
        new_event.initMouseEvent(event.type,
                                 event.bubbles,
                                 event.cancelable,
                                 event.view,
                                 event.detail,
                                 event.screenX,
                                 event.screenY,
                                 event.clientX,
                                 event.clientY,
                                 event.ctrlKey,
                                 event.altKey,
                                 event.shiftKey,
                                 event.metaKey,
                                 event.button,
                                 event.relatedTarget);
        new_target.dispatchEvent(new_event);
      }
      return;
    }

    var all_items = [];
    var menu_id = null;
    var last_found_menu_id = '';
    var collected_menus = [];
    var items = null;
    // This traverses up the tree and collects all menus it finds, and
    // concatenates them with a separator between each menu. It stops if it
    // finds a data-menu attribute with a blank value.
    while (ele && ele != document && (menu_id = ele.getAttribute("data-menu")) !== "")
    {
      items = null;
      if (menu_id)
      {
        last_found_menu_id = menu_id;
      }
      // Make sure the same menu is never collected twice
      if (collected_menus.indexOf(menu_id) == -1) {
        collected_menus.push(menu_id);

        var menus = this._registered_menus[menu_id];
        if (menus && menus.length)
        {
          var items = this._expand_all_items(menus, event, menu_id);
          if (items.length)
          {
            if (all_items.length)
              all_items.push(ContextMenu.separator);

            all_items = all_items.concat(items);
          }
        }
      }
      ele = ele.parentNode;
    }

    // This should preferably not be done inside ContextMenu.
    var spec = event.target.get_attr("parent-node-chain", "data-spec");
    if (spec)
    {
      var speclinks = SpecLinks.get_instance();
      var specs = speclinks.get_spec_links(spec);
      if (specs.length)
      {
        items = specs.map(function(spec)
        {
          return {
            label: ui_strings.M_CONTEXTMENU_SPEC_LINK.replace("%s", spec.prop),
            handler: function(event, target) {
              speclinks.open_spec_link(spec.url);
            },
            id: spec.prop,
            menu_id: "spec"
          };
        });
        this.register("spec", items);

        if (all_items.length)
        {
          all_items.push(ContextMenu.separator);
        }
      }

      if (items)
      {
        all_items = all_items.concat(items);
      }
    }

    var res_id_or_url = event.target.get_attr("parent-node-chain", "data-resource-id") ||
                        event.target.get_attr("parent-node-chain", "data-resource-url");
    var line_number = event.target.get_attr('parent-node-chain', 'data-resource-line-number');
    if (res_id_or_url)
    {
      if (last_found_menu_id == "dom")
      {
        var rt_id = event.target.get_attr('parent-node-chain', 'rt-id');
        res_id_or_url = helpers.resolveURLS(runtimes.getURI(rt_id), res_id_or_url);
      }
      var broker = cls.ResourceDisplayBroker.get_instance();
      var rid = parseInt(res_id_or_url, 10);
      if (rid)
      {
        // data-resource-line-number
        var fun = function()
        {
          broker.show_resource_for_id(rid, line_number);
        }
      }
      else
      {
        var fun = function()
        {
          broker.show_resource_for_url(res_id_or_url, line_number);
        }
      }

      if (all_items.length)
      {
        all_items.push(ContextMenu.separator);
      }

      all_items.push(
        {
          label: ui_strings.M_CONTEXTMENU_SHOW_RESOURCE,
          handler: fun,
          id: res_id_or_url,
          menu_id: "resource"
        }
      )
    }

    this._current_items = all_items;

    if (all_items.length)
    {
      // Prevent scrolling by mouse wheel when menu is visible
      window.onmousewheel = function(event) { event.preventDefault(); }

      this._current_event = event;
      this.show(all_items, event.clientX, event.clientY);
      this.is_visible = true;
    }
  };

  /**
   * Show and position a context menu.
   *
   * @param {Array} items The items to show, see ContextMenu.register for how to
   *                      specify items.
   * @param {Int} x The left position of the menu, relative to the viewport.
   * @param {Int} y The top position of the menu, relative to the viewport.
   */
  this.show = function(items, x, y)
  {
    if (items)
    {
      var contextmenu = document.documentElement.render(window.templates.contextmenu(items));

      const DEFAULT_MARGIN = 2;
      var max_height = 0;
      var box = contextmenu.getBoundingClientRect();

      // Check if the menu height fits within the window
      if (box.height + (DEFAULT_MARGIN * 2) > window.innerHeight)
      {
        // It doesn't fit, apply max-height to make it scroll
        y = DEFAULT_MARGIN;
        max_height = window.innerHeight - (DEFAULT_MARGIN * 2) - 2; // 2 = border-width (top+bottom)
      }
      // It fits within the window, check if it fits downwards or not. If it
      // doesn't, we have to adjust the position.
      else if (y + box.height + DEFAULT_MARGIN > window.innerHeight)
      {
        // Check if we can just flip it upwards
        if (box.height + DEFAULT_MARGIN < y)
        {
          y -= box.height;
        }
        // It doesn't fit upwards, reposition it upwards as much as needed
        else
        {
          var overflow = window.innerHeight - y - box.height;
          y += overflow - DEFAULT_MARGIN;
        }
      }

      // It doesn't fit to the right, flip it
      if (x + box.width + DEFAULT_MARGIN > window.innerWidth)
      {
        x -= box.width;
      }

      contextmenu.style.cssText = [
        "left:" + x + "px",
        "top:" + y + "px",
        "max-height:" + (max_height ? max_height + "px" : "100%"),
        "visibility:visible"
      ].join(";");
    }
  };

  /**
   * Hides the context menu.
   */
  this.dismiss = function()
  {
    var contextmenu = document.getElementById("contextmenu");
    if (contextmenu)
    {
      contextmenu.parentElement.removeChild(contextmenu);
    }
    this.is_visible = false;
  };

  this._expand_all_items = function(items, event, menu_id)
  {
    var all_items = [];

    for (var i = 0, item; item = items[i]; i++)
    {
      if (typeof item.callback == "function")
      {
        var callback_items = item.callback(event, event.target);
        if (callback_items)
        {
          all_items = all_items.concat(callback_items);
        }
      }
      else
      {
        all_items.push(item);
      }
    }

    for (var i = 0, item; item = all_items[i]; i++)
    {
      item.id = "item_" + i;
      if (menu_id)
      {
        item.menu_id = menu_id;
      }
    }

    return all_items;
  };

  this.modal_click_handler = function(event)
  {
    var target = event.target;
    var contextmenu = document.getElementById("contextmenu");

    window.onmousewheel = null;

    event.stopPropagation();
    event.preventDefault();

    while (target != contextmenu && target != document)
    {
      var handler_id = target.getAttribute("data-handler-id");
      if (handler_id)
      {
        var menu_id = target.getAttribute("data-menu-id");
        var items = this._current_items;
        for (var i = 0, item; item = items[i]; i++)
        {
          if (item.id == handler_id && item.menu_id == menu_id)
          {
            if (item.disabled)
            {
              return;
            }

            var current_target = this._current_event.target;
            while (current_target)
            {
              if (menu_id == "spec" && current_target.getAttribute("data-spec")) { break }
              else if (menu_id == "resource" && current_target.getAttribute("data-resource-url")) { break }
              else if (menu_id == "resource" && current_target.getAttribute("data-resource-id")) { break }
              else if (current_target.getAttribute("data-menu") == menu_id) { break }
              current_target = current_target.parentNode;
            }
            item.handler(this._current_event, current_target);
            break;
          }
        }
      }
      target = target.parentNode;
    }

    this.dismiss();

    this._broker.clear_setter_click_handler(this);
  }.bind(this);
};

ContextMenu.get_instance = function()
{
  return this._instance || new ContextMenu();
};

ContextMenu.separator = {separator: true};
