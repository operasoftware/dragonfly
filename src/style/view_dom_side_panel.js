window.cls || (window.cls = {});

cls.DOMSidePanelView = function(id, name, view_list, default_unfolded_list)
{
  this._super_createView = this.createView;
  this.required_services = ["ecmascript-debugger"];
  this.createView = function(container)
  {
    this._super_createView(container);
    var quick_find = this.getToolbarControl(container, 'css-inspector-text-search');
    var search_term = window.element_style.get_search_term();
    if (quick_find && search_term)
    {
      quick_find.value = search_term;
    }
  }
  this.init(id, name, view_list, default_unfolded_list);
};

cls.DOMSidePanelView.prototype = SidePanelView.prototype;

cls.DOMSidePanelView.create_ui_widgets = function()
{
  var element_style = window.element_style;

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
      'show-initial-values': false
    },
    // key-label map
    {
      'show-initial-values': ui_strings.S_SWITCH_SHOW_INITIAL_VALUES
    },
    // settings map
    {
      checkboxes:
      [
        'show-initial-values'
      ]
    },
    null,
    "document"
  );

  new Settings
  (
    // id
    "dom-side-panel",
    // key-value map
    {
      "show-longhand-properties": false,
      "color-notation": "hhex"
    },
    // key-label map
    {
      "show-longhand-properties": ui_strings.S_EXPAND_SHORTHANDS,
      "color-notation": ui_strings.S_COLOR_NOTATION
    },
    // settings map
    {
      contextmenu:
      [
        "show-longhand-properties"
      ],
      customSettings:
      [
        "color-notation"
      ]
    },
    {
      "color-notation": function(setting)
      {
        return new StylesheetTemplates().color_notation_setting(setting);
      }
    },
    "document",
    {
      "show-longhand-properties": function(value)
      {
        window.settings["css-inspector"].set("show-longhand-properties", value);
        element_style.update();
      }
    }
  );

  new ToolbarConfig('css-comp-style');

  new Switches
  (
    'css-comp-style',
    [
      'show-initial-values'
    ]
  );

  ["link", "visited", "hover", "active", "focus", "selection"].forEach(function(pseudo_item) {
    if (window.settings["css-inspector"].get(pseudo_item))
    {
     element_style.add_pseudo_item(pseudo_item);
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
          target = target.parentElement;
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
        var swatch = target && target.querySelector(".color-swatch");
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

  window.eventHandlers.change["color-notation"] = function(event, target)
  {
    window.settings["dom-side-panel"].set("color-notation", target.value);
    window.element_style.update();
  };
};

