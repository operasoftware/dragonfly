window.cls || (window.cls = {});

/**
 * @constructor
 * @extends ViewBase
 */
cls.CSSInspectorCompStyleView = function(id, name, container_class)
{
  this.required_services = ["ecmascript-debugger"];
  this.createView = function(container)
  {
    var element_style = window.element_style;
    var styles = container.clearAndRender(['category', ['styles']]).firstElementChild;
    var data = element_style.get_computed_style();
    if (data)
    {
      styles.clearAndRender(window.stylesheets.pretty_print_computed_style(data));
      styles.setAttribute('rt-id', data.rt_id);
    }
  };

  this.init(id, name, container_class);
};

