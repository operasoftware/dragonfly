window.cls || (window.cls = {});

/**
  * @constructor 
  * @extends ViewBase
  */

cls.CSSInspectorView = function(id, name, container_class)
{
  var self = this;

  this.createView = function(container)
  {
    // TODO set unfold key on show and hide view

    var styles = container.clearAndRender(['category', ['styles'], 'edit-handler', 'edit-css']).firstElementChild;
    var search_active = elementStyle.getSearchActive();
    var cat_index = 1;
    var data = elementStyle.getCategoryData(cat_index);
    if (data)
    {
      // stylesheets.prettyPrintCat call will also ensure 
      // that all style sheets for the given runtime and the index map
      // will be avaible, that means the call will not return any data 
      // before this datas are avaible
      styles.innerHTML = 
        stylesheets.pretty_print_cascaded_style(data, arguments, search_active);
      styles.setAttribute('rt-id', data.rt_id);
    }
  }

  this.ondestroy = function()
  {
    UIWindowBase.closeWindow('color-selector');
  }

  this.init(id, name, container_class);
}
