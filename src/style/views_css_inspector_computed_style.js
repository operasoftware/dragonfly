window.cls || (window.cls = {});

/**
 * @constructor
 * @extends ViewBase
 */
cls.CSSInspectorCompStyleView = function(id, name, container_class)
{
  this.createView = function(container)
  {
    var element_style = window.element_style;
    var styles = container.clearAndRender(['category', ['styles']]).firstElementChild;
    var data = element_style.get_computed_style();
    if (data)
    {
      var rt_id = element_style.get_rt_id();
      styles.clearAndRender(window.stylesheets.pretty_print_computed_style(data));
      styles.setAttribute('rt-id', rt_id);
    }
  };

  this.init(id, name, container_class);
};

