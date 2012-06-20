window.cls || (window.cls = {});

/**
 * @constructor
 * @extends ViewBase
 */
cls.CSSInspectorView = function(id, name, container_class)
{
  this.required_services = ["ecmascript-debugger"];
  this.createView = function(container)
  {
    var element_style = window.element_style;
    var styles = container.clearAndRender(['category', ['styles'], 'edit-handler', 'edit-css']).firstElementChild;
    var data = element_style.get_style();
    if (data)
    {
      styles.clearAndRender(window.stylesheets.pretty_print_cascaded_style(data));
      styles.setAttribute('rt-id', data.rt_id);
    }
    window.views["color-selector"].ondestroy();
  };

  this.ondestroy = function()
  {
    window.views["color-selector"].ondestroy();
  };

  this.init(id, name, container_class);
};

cls.CSSInspectorView.create_ui_widgets = function()
{
  var broker = ActionBroker.get_instance();

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
      element_style.add_pseudo_item(pseudo_item);
    }
    else
    {
      element_style.remove_pseudo_item(pseudo_item);
    }
    element_style.update();
  }

  window.eventHandlers.click["insert-declaration-edit"] = function(event, target)
  {
    broker.dispatch_action("css-inspector", "insert-declaration-edit", event, target);
  };
};

