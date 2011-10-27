window.cls || (window.cls = {});

/**
  * @constructor
  * @extends ViewBase
  */

cls.CSSInspectorCompStyleView = function(id, name, container_class)
{
  var self = this;

  // TODO set unfold key on show and hide view

  this.createView = function(container)
  {
    container.innerHTML = '';
    var styles = container.render(['category', ['styles']]).firstElementChild;
    var data = elementStyle.get_computed_style();
    var search_active = elementStyle.getSearchActive();
    if (data)
    {
      // stylesheets.prettyPrintCat call will also ensure
      // that all style sheets for the given runtime and the index map
      // will be avaible, that means the call will not return any data
      // before this datas are avaible
      styles.clearAndRender(stylesheets.pretty_print_computed_style(data, arguments, search_active));
      styles.setAttribute('rt-id', data.rt_id);
    }
  }
  this.init(id, name, container_class);
};

