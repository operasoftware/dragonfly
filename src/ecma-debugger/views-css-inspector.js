//window.views = window.views || {};

(function()
{


  var View = function(id, name, container_class)
  {
    var self = this;







    this.createView = function(container)
    {
      container.innerHTML ='';
      container.render(templates.cssInspector(elementStyle.getCategories()));
    }

    this.updateCategories = function(cats, call_count)
    {
      if(call_count > 1 )
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
              styles[cat_index].innerHTML = stylesheets.prettyPrintCat(cat_index, data, arguments);
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
