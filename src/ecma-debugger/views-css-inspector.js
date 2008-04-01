//window.views = window.views || {};

(function()
{


  var View = function(id, name, container_class)
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
        for( ; c = containers[i]; i++)
        {
          styles = c.getElementsByTagName('styles');
          for( cat_index = 0; cat_index < 5; cat_index++ )
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
                styles[cat_index].innerHTML = stylesheets.prettyPrintCat(cat_index, data, arguments);
                styles[cat_index].setAttribute('rt-id', data.rt_id);
              }
            }
          }
        }
      }
    }





    this.init(id, name, container_class);
  }

  View.prototype = ViewBase;
  new View('css-inspector', 'CSS', 'scroll css-inspector');

  new Settings
  (
    // id
    'css-inspector', 
    // key-value map
    {
      'computed-style': false, 
      'inline-style': false,
      'direct-match-style': false,
      'inherited-style': false,
      'default-style': false,
    }, 
    // key-label map
    {

    },
    // settings map
    {

    }
  );


})()
