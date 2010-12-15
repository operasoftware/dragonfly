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
    data = elementStyle.getCategoryData(cat_index);
    if (data)
    {
      // stylesheets.prettyPrintCat call will also ensure 
      // that all style sheets for the given runtime and the index map
      // will be avaible, that means the call will not return any data 
      // before this datas are avaible
      styles.innerHTML = 
        stylesheets.prettyPrintStyleCasc(data, arguments, search_active);
      styles.setAttribute('rt-id', data.rt_id);
    }

    var quick_find = this.getToolbarControl( container, 'css-inspector-text-search');
    if( quick_find && elementStyle.getSearchTerm() )
    {
      quick_find.value = elementStyle.getSearchTerm();
      quick_find.previousElementSibling.textContent = "";
    }
  }

  this.ondestroy = function()
  {
    UIWindowBase.closeWindow('color-selector');
  }

  this.init(id, name, container_class);
}

cls.CSSInspectorView.create_ui_widgets = function()
{

  new ToolbarConfig
  (
    'css-inspector',
    null,
    [
      {
        handler: 'css-inspector-text-search',
        title: 'text search',
        label: ui_strings.S_INPUT_DEFAULT_TEXT_FILTER
      }
    ]
  );

}

