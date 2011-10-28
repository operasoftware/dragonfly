window.cls || (window.cls = {});

cls.DOMSidePanelView = function(id, name, view_list, default_unfolded_list)
{
  this._super_createView = this.createView;
  this.createView = function(container)
  {
    this._super_createView(container);
    var quick_find = this.getToolbarControl(container, 'css-inspector-text-search');
    var search_term = elementStyle.get_search_term();
    if (quick_find && search_term)
    {
      quick_find.value = search_term;
    }
  }
  this.init(id, name, view_list, default_unfolded_list);
}

cls.DOMSidePanelView.prototype = SidePanelView.prototype;

cls.DOMSidePanelView.create_ui_widgets = function()
{

  new ToolbarConfig
  (
    'dom-side-panel',
    null,
    [
      {
        handler: 'css-inspector-text-search',
        title: ui_strings.S_SEARCH_INPUT_TOOLTIP,
        label: ui_strings.S_INPUT_DEFAULT_TEXT_FILTER,
        type: "filter"
      }
    ]
  );

  new Settings
  (
    // id
    'css-comp-style', 
    // key-value map
    {
      'show-initial-values': false,
      'hide-shorthands': true
    }, 
    // key-label map
    {
      'show-initial-values': ui_strings.S_SWITCH_SHOW_INITIAL_VALUES,
      'hide-shorthands': ui_strings.S_SWITCH_SHOW_SHORTHANDS
    },
    // settings map
    {
      checkboxes:
      [
        'show-initial-values',
        'hide-shorthands',
      ]
    },
    null,
    "document"
  );

  new ToolbarConfig('css-comp-style');

  new Switches
  (
    'css-comp-style',
    [
      'show-initial-values'
    ]
  );

  new Settings
  (
    // id
    'css-inspector',
    // key-value map
    {
      'link': false,
      'visited': false,
      'hover': false,
      'active': false,
      'focus': false,
      'selection': false
    },
    // key-label map
    {
      'link': ":link",
      'visited': ":visited",
      'hover': ":hover",
      'active': ":active",
      'focus': ":focus",
      'selection': "::selection"
    },
    // settings map
    {
      checkboxes:
      [
        'link',
        'visited',
        'hover',
        'active',
        'focus',
        'selection'
      ]
    },
    null,
    null,
    {
      "link": function(is_active) {
        update_pseudo_item("link", is_active);
      },
      "visited": function(is_active) {
        update_pseudo_item("visited", is_active);
      },
      "hover": function(is_active) {
        update_pseudo_item("hover", is_active);
      },
      "active": function(is_active) {
        update_pseudo_item("active", is_active);
      },
      "focus": function(is_active) {
        update_pseudo_item("focus", is_active);
      },
      "selection": function(is_active) {
        update_pseudo_item("selection", is_active);
      }
    }
  );

  function update_pseudo_item(pseudo_item, is_active)
  {
    if (is_active)
    {
      window.elementStyle.add_pseudo_item(pseudo_item);
    }
    else
    {
      window.elementStyle.remove_pseudo_item(pseudo_item);
    }
    window.elementStyle.update();
  }

  ["link", "visited", "hover", "active", "focus", "selection"].forEach(function(pseudo_item) {
    if (window.settings["css-inspector"].get(pseudo_item))
    {
      window.elementStyle.add_pseudo_item(pseudo_item);
    }
  });

  new ToolbarConfig('css-inspector');

  new CstSelectToolbarSettings
  (
    'css-inspector',
    [
      'link',
      'visited',
      'hover',
      'active',
      'focus',
      'selection'
    ],
    'pseudo-items'
  );

  var broker = ActionBroker.get_instance();
  var contextmenu = ContextMenu.get_instance();
  contextmenu.register("style-inspector-rule", [
    {
      callback: function(event, target)
      {
        var items = [
          {
            label: ui_strings.M_CONTEXTMENU_DISABLE_DECLARATIONS,
            handler: function(event, target) {
              broker.dispatch_action("css-inspector", "disable-all-properties", event, target);
            }
          },
          {
            label: ui_strings.M_CONTEXTMENU_ADD_DECLARATION,
            handler: function(event, target) {
              broker.dispatch_action("css-inspector", "insert-declaration-edit", event, target);
            }
          }
        ];

        // Only add this for a declaration, not on the whole rule
        while (target && !target.hasClass("css-declaration"))
        {
          target = target.parentNode;
        }

        if (target)
        {
          items.push({
            label: ui_strings.M_CONTEXTMENU_EDIT_DECLARATION,
            handler: function(event, target) {
              broker.dispatch_action("css-inspector", "edit-css", event, target);
            }
          },
          {
            label: ui_strings.M_CONTEXTMENU_REMOVE_DECLARATION,
            handler: function(event, target) {
              broker.dispatch_action("css-inspector", "remove-property", event, target);
            }
          });
        }

        // Only add this for the color swatch
        var swatch = target && target.querySelector("color-sample");
        if (swatch)
        {
          items.push(
            ContextMenu.separator,
            {
              label: ui_strings.M_CONTEXTMENU_OPEN_COLOR_PICKER,
              handler: function(event, target) {
                window.views['color-selector'].show_color_picker(swatch);
              }
            }
          );
        }

        return items;
      }
    }
  ]);
}
