window.cls || (window.cls = {});

/**
 * @constructor
 * @extends ViewBase
 */
cls.CSSInspectorView = function(id, name, container_class)
{
  this.createView = function(container)
  {
    var element_style = window.element_style;
    var styles = container.clearAndRender(['category', ['styles'], 'edit-handler', 'edit-css']).firstElementChild;
    var data = element_style.get_style();
    if (data)
    {
      // stylesheets.prettyPrintCat call will also ensure
      // that all style sheets for the given runtime and the index map
      // will be avaible. That means the call will not return any data
      // before this data is available.
      var rt_id = element_style.get_rt_id();
      styles.clearAndRender(window.stylesheets.pretty_print_cascaded_style(data, arguments));
      styles.setAttribute('rt-id', rt_id);
    }
  };

  this.ondestroy = function()
  {
    UIWindowBase.closeWindow('color-selector');
  };

  this.init(id, name, container_class);
};

cls.CSSInspectorView.create_ui_widgets = function()
{
  var element_style = window.element_style;
  new Settings
  (
    // id
    "css-inspector",
    // key-value map
    {
      "show-expanded-properties": false
    },
    // key-label map
    {
      "show-expanded-properties": ui_strings.S_EXPAND_SHORTHANDS
    },
    // settings map
    {
      contextmenu:
      [
        "show-expanded-properties"
      ]
    },
    null,
    "document",
    {
      "show-expanded-properties": function(value)
      {
        window.settings["css-inspector"].set("show-expanded-properties", value);
        element_style.update();
      }
    }
  );
};

