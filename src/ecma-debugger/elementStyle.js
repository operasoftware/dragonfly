var elementStyle = new function()
{
  const 
  COMP_STYLE = 0,
  INLINE_STYLE = 1,
  MATCHING_RULES = 2,
  INHERITED_RULES = 3,
  DEFAULT_VALUES = 4;

  var __selectedElement = null;

  var __views = ['css-inspector'];

  var id_index_map = 
  {
    'computedStyle': COMP_STYLE,
    'inlineStyle': INLINE_STYLE,
    'matchingRules': MATCHING_RULES,
    'inheritesRules': INHERITED_RULES,
    'defaultValues': DEFAULT_VALUES
  }
  var categories =
  [
    {
      'id': 'computedStyle',
      'name': 'computed style',
      'unfolded': false
    },
    {
      'id': 'inlineStyle',
      'name': 'inline style',
      'unfolded': false
    },
    {
      'id': 'matchingRules',
      'name': 'matching rules',
      'unfolded': false
    },
    {
      'id': 'inheritesRules',
      'name': 'inherited rules',
      'unfolded': false
    },
    {
      'id': 'defaultValues',
      'name': 'default values',
      'unfolded': false
    }
  ];

  var categories_data = [null, null, null, null, null];



  this.getCategories = function()
  {
    return categories;
  }

  this.getCategoryData = function(index)
  {
    return categories_data[index];
  }

  this.setUnfoldedCat = function( cat_id , value)
  {
    var cat_index = id_index_map[cat_id],
    cat = categories[cat_index], 
    i = 0,
    request_key = '';
    if(cat)
    {
      cat.unfolded = value;
      if( value)
      {
        if( __selectedElement )
        {
          for ( i = 0; i < 5; i++)
          {
            request_key += cat_index == i ? '1' : '0';
          }
          getData(__selectedElement.rt_id, __selectedElement.obj_id, request_key)
        }
      }
      else
      {
        categories_data[cat_index] = null;
      }
    }
    else
    {
      opera.postError('elementStyle, cat id does not return a cat');
    }
  }

  var onElementSelected = function(msg)
  {
    __selectedElement = {rt_id: msg.rt_id,  obj_id: msg.obj_id};
    var view_id = '', i = 0, get_data = false, request_key = '';
    for ( ; view_id = __views[i]; i++)
    {
      if( views[view_id].isvisible() )
      {
        get_data = true; 
        break;
      }
    }
    if( get_data )
    {
      for ( i = 0; i < 5; i++)
      {
        request_key += categories[i].unfolded ? '1' : '0';
      }
      getData(msg.rt_id, msg.obj_id, request_key)
    }
    
  }

  var getData = function(rt_id, obj_id, cats)
  {
    var tag = tagManager.setCB(null, handleGetData, [rt_id, obj_id, cats]);
    services['ecmascript-debugger'].cssGetStyleDeclarations( tag, rt_id, obj_id, cats, 'json' );
  
  }

  var handleGetData = function(xml, rt_id, obj_id, cats)
  {
    var 
    json = xml.getNodeData('matching-style-declarations'), 
    declarations = null, 
    i = 0, 
    view_id = '';

    if( json )
    {
      declarations = eval('(' + json +')');
      for( ; i < 5; i++)
      {
        if( cats[i] == '1' )
        {
          categories_data[i] = declarations[i];
        }
      }
      for ( i = 0; view_id = __views[i]; i++)
      {
        views[view_id].updateCategories(cats);
      }
    }
  }

  messages.addListener('element-selected', onElementSelected);
}