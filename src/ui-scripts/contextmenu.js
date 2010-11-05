/**
 * @constructor
 */
var ContextMenu = function() {
  if (ContextMenu.instance)
  {
    return ContextMenu.instance;
  }
  else
  {
    ContextMenu.instance = this;
  }

  /**
   * Global context menu event handler.
   */
  this.oncontextmenu = function(event)
  {
    document.removeEventListener("click", this._modal_click_handler, true);

    // Hide the currently visible context menu, if any
    this.dismiss();

    if (/*!window.getSelection().isCollapsed ||*/ event.shiftKey) // Shift key overrides for debugging
    {
      return;
    }

    // Prevent the normal context menu from showing up
    event.preventDefault();

    if (EventHandler.__modal_mode)
    {
      EventHandler.__modal_mode = false;
      return;
    }

    var ele = event.target;
    var all_items = [];
    var menu_id = null;
    // This traverses up the tree and collects all menus it finds, and
    // concatenates them with a separator between each menu. It stops if it
    // finds a data-menu attribute with a blank value.
    while (ele != document && (menu_id = ele.getAttribute("data-menu")) !== "")
    {
      if (menu_id)
      {
        if (all_items.length)
        {
          all_items.push({separator: true});
        }

        var items = ContextMenu.registered_menus[menu_id] || [];
        items = this._expand_all_items(items, event);
        for (var i = 0, item; item = items[i]; i++)
        {
          item.menu_id = menu_id;
          all_items.push(item);
        }
      }
      ele = ele.parentNode;
    }

    if (all_items.length)
    {
      this._current_event = event;
      this.show(all_items, event.clientX, event.clientY);
      document.addEventListener("click", this._modal_click_handler, true);
      EventHandler.__modal_mode = true;
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
  };

  this._expand_all_items = function(items, event)
  {
    var all_items = [];

    for (var i = 0, item; item = items[i]; i++)
    {
      if (typeof item.callback == "function")
      {
        all_items = all_items.concat(item.callback(event, event.target));
      }
      else
      {
        all_items.push(item);
      }
    }

    for (var i = 0, item; item = all_items[i]; i++)
    {
      item.id = item.id || "item_" + i;
    }

    return all_items;
  };

  this._modal_click_handler = function(event)
  {
    var target = event.target;
    var contextmenu = document.getElementById("contextmenu");

    event.stopPropagation();
    event.preventDefault();

    this.dismiss();

    while (target != contextmenu && target != document)
    {
      if (target.getAttribute("data-handler-id"))
      {
        var items = ContextMenu.registered_menus[target.getAttribute("data-menu-id")];
        items = this._expand_all_items(items, this._current_event);
        for (var i = 0, item; item = items[i]; i++)
        {
          if (item.id == target.getAttribute("data-handler-id"))
          {
            item.handler(this._current_event, target);
          }
        }
      }
      target = target.parentNode;
    }

    document.removeEventListener("click", this._modal_click_handler, true);
    EventHandler.__modal_mode = false;
  }.bind(this);
};

/**
 * Holds all registered context menus.
 */
ContextMenu.registered_menus = {};

/**
 * Registers a new context menu, or adds items to an already registered context menu.
 *
 * @param {String} menu_id An id corresponding to an id specified with a data-menu
 *                         attribute in the markup. May be an already existing
 *                         menu, in which case the items are added.
 * @param {Array} item_list An array of objects with 'label' and 'handler'
 *                          (function).
 */
ContextMenu.register = function(menu_id, item_list)
{
  var menu = ContextMenu.registered_menus[menu_id] || [];
  if (item_list)
  {
    // If it already is registered, merge it
    ContextMenu.registered_menus[menu_id] = menu.concat(item_list);
  }
};

window.contextmenu = new ContextMenu();
document.addEventListener("contextmenu", window.contextmenu.oncontextmenu.bind(window.contextmenu), false);

