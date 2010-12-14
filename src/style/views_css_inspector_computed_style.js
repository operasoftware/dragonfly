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
      opera.postError('container.__cal_count: '+container.__cal_count)
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

/*
cls.CSSInspectorView.create_ui_widgets = function()
{

  new Settings
  (
    // id
    'css-inspector', 
    // key-value map
    {
      'computedStyle': false, 
      'css': true,
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

  new Switches
  (
    'css-inspector',
    [
      'hide-initial-values'/*,
      'hide-shorthands',*//*
    ]
  );
}

*/