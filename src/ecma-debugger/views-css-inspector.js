var cls = window.cls || ( window.cls = {} );

/**
  * @constructor 
  * @extends ViewBase
  */

cls.CSSInspectorView = function(id, name, container_class)
{
  var self = this;

  this.createView = function(container)
  {
    container.innerHTML ='';
    var cats = elementStyle.getCategories(), cat_key = '', cat = null, i = 0;
    container.render(templates.cssInspector(cats));
    for( ; cat = cats[i]; i++)
    {
      cat_key += cat.unfolded ? '1' : '0';
    }
    this.updateCategories({}, cat_key);
  }

  this.updateCategories = function(ev, cats)
  {
    if( self.isvisible() )
    {
      if(ev.__call_count && ev.__call_count > 2  )
      {
        opera.postError('failed updateCategories, missing indexMap, views-css-inspector')
        return;
      }
      var containers = self.getAllContainers(), c = null , i = 0;
      var styles = null, s_c = null , cat_index = 0, data = null;
      var search_active = elementStyle.getSearchActive();
      for( ; c = containers[i]; i++)
      {
        styles = c.getElementsByTagName('styles');
        if( !styles.length )
        {
          this.createView(c);
          return;
        }
        for( cat_index = 0; cat_index < 2; cat_index++ )
        {
          if( cats[cat_index] == '1' )
          {
            
            // TODO update depending from the category
            data = elementStyle.getCategoryData(cat_index);
            if( data )
            {
              // stylesheets.prettyPrintCat call will also ensure 
              // that all style sheets for the given runtime and the index map
              // will be avaible, that means the call will not return any data 
              // before this datas are avaible
              styles[cat_index].innerHTML = 
                stylesheets.prettyPrintCat(cat_index, data, arguments, search_active);
              styles[cat_index].setAttribute('rt-id', data.rt_id);
            }
          }
        }
      }
    }
  }





  this.init(id, name, container_class);
}

cls.CSSInspectorView.prototype = ViewBase;
new cls.CSSInspectorView('css-inspector', ui_strings.M_VIEW_LABEL_STYLES, 'scroll css-inspector');

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
  }
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
)

new Switches
(
  'css-inspector',
  [
    'hide-initial-values',
    'hide-shorthands',
  ]
)






