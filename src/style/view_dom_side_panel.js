window.cls || (window.cls = {});

cls.DOMSidePanelView = function(id, name, view_list)
{
  this._super_createView = this.createView;
  this.createView = function(container)
  {
    this._super_createView(container);
    var quick_find = this.getToolbarControl(container, 'css-inspector-text-search');
    if( quick_find && elementStyle.getSearchTerm() )
    {
      quick_find.value = elementStyle.getSearchTerm();
      quick_find.previousElementSibling.textContent = "";
    }
  }
  this.init(id, name, view_list);
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
        title: 'text search',
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
      'hide-initial-values': true,
      'hide-shorthands': true
    }, 
    // key-label map
    {
      'hide-initial-values': ui_strings.S_SWITCH_SHOW_INITIAL_VALUES,
      'hide-shorthands': ui_strings.S_SWITCH_SHOW_SHORTHANDS
    },
    // settings map
    {
      checkboxes:
      [
        'hide-initial-values',
        'hide-shorthands',
      ]
    },
    null,
    "document"
  );

  new Switches
  (
    'dom-side-panel',
    [
      'css-comp-style.hide-initial-values'/*,
      'hide-shorthands',*/
    ]
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
        while (target && target.nodeName.toLowerCase() != "property")
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
          });
        }

        // Only add this for the color swatch
        var swatch = target.querySelector("color-sample");
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
