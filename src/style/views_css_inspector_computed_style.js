window.cls || (window.cls = {});

/**
 * @constructor
 * @extends ViewBase
 */
cls.CSSInspectorCompStyleView = function(id, name, container_class)
{
  // TODO set unfold key on show and hide view

  this.createView = function(container)
  {
    var styles = container.clearAndRender(['category', ['styles']]).firstElementChild;
    var data = window.elementStyle.get_computed_style();
    if (data)
    {
      // stylesheets.prettyPrintCat call will also ensure
      // that all style sheets for the given runtime and the index map
      // will be avaible, that means the call will not return any data
      // before this datas are available
      var rt_id = elementStyle.get_rt_id();
      styles.clearAndRender(window.stylesheets.pretty_print_computed_style(data));
      styles.setAttribute('rt-id', rt_id);
    }
  }

  this.init(id, name, container_class);
};

