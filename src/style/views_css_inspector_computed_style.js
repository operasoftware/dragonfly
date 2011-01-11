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
    container.innerHTML ='';
    var styles = container.render(['category', ['styles']]).firstElementChild;
    data = elementStyle.get_computed_style();
    if (data)
    {
      // stylesheets.prettyPrintCat call will also ensure 
      // that all style sheets for the given runtime and the index map
      // will be avaible, that means the call will not return any data 
      // before this datas are avaible
      styles.innerHTML = stylesheets.prettyPrintCompStyle(data, arguments);
      styles.setAttribute('rt-id', data.rt_id);
    }
  }
  this.init(id, name, container_class);
}


cls.CSSInspectorCompStyleView.create_ui_widgets = function()
{

  new ToolbarConfig
  (
    'css-comp-style'
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
    'css-comp-style',
    [
      'hide-initial-values'/*,
      'hide-shorthands',*/
    ]
  );
};
