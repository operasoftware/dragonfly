window.cls || (window.cls = {});

/**
 * @constructor
 * @extends ViewBase
 */
cls.CSSInspectorView = function(id, name, container_class)
{
  this.createView = function(container)
  {
    var element_style = cls.ElementStyle.get_instance();
    var styles = container.clearAndRender(['category', ['styles'], 'edit-handler', 'edit-css']).firstElementChild;
    var data = element_style.get_style();
    if (data)
    {
      // stylesheets.prettyPrintCat call will also ensure
      // that all style sheets for the given runtime and the index map
      // will be avaible. That means the call will not return any data
      // before this data is available.
      var rt_id = element_style.get_rt_id();
      styles.clearAndRender(cls.Stylesheets.get_instance().pretty_print_cascaded_style(data));
      styles.setAttribute('rt-id', rt_id);
    }
  };

  this.ondestroy = function()
  {
    UIWindowBase.closeWindow('color-selector');
  };

  this.init(id, name, container_class);
};

