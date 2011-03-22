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
  this.register = function(menu_id, item_list)
  {
    if (item_list)
    {
      this._registered_menus[menu_id] = item_list;
    }
  };

  /**
   * Global context menu event handler.
   */
  this.oncontextmenu = function(event)
  {
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
    var collected_menus = [];
    // This traverses up the tree and collects all menus it finds, and
    // concatenates them with a separator between each menu. It stops if it
    // finds a data-menu attribute with a blank value.
    while (ele && ele != document && (menu_id = ele.getAttribute("data-menu")) !== "")
    {
      // Make sure the same menu is never collected twice
      if (collected_menus.indexOf(menu_id) == -1) {
        collected_menus.push(menu_id);

        var items = this._registered_menus[menu_id];
        if (items && items.length)
        {
          if (all_items.length)
          {
            all_items.push(ContextMenu.separator);
          }

          all_items = all_items.concat(this._expand_all_items(items, event, menu_id));
        }
      }
      ele = ele.parentNode;
    }

    // This should preferably not be done inside ContextMenu.
    var speclinks = SpecLinks.get_instance();
    var spec = event.target.get_attr("parent-node-chain", "data-spec");
    if (spec)
    {
      var specs = speclinks.get_spec_links(spec);
      if (specs.length)
      {
        var items = specs.map(function(spec)
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

    this._current_items = all_items;

    if (all_items.length)
    {
      this._current_event = event;
      this.show(all_items, event.clientX, event.clientY);
      this.is_shown = true;
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
    this.is_shown = false;
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

    event.stopPropagation();
    event.preventDefault();

    this.dismiss();

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
            var current_target = this._current_event.target;
            while (current_target && (menu_id == "spec"
                        ? current_target.getAttribute("data-spec") === null
                        : current_target.getAttribute("data-menu") != menu_id)
            )
            {
              current_target = current_target.parentNode;
            }
            item.handler(this._current_event, current_target);
          }
        }
      }
      target = target.parentNode;
    }

    this._broker.clear_setter_click_handler(this);
    EventHandler.__modal_mode = false;
  }.bind(this);
};

ContextMenu.get_instance = function()
{
  return this._instance || new ContextMenu();
};

ContextMenu.separator = {separator: true};

