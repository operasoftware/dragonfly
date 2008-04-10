var elementStyle = new function()
{
  const 
  COMP_STYLE = 0,
  INLINE_STYLE = 1,
  MATCHING_RULES = 2,
  INHERITED_RULES = 3,
  DEFAULT_VALUES = 4,
  REQ_TYPE_NONE = 0,
  REQ_TYPE_COMP_STYLE = 1,
  REQ_TYPE_CSS = 2,
  REQ_TYPE_COMPLETE = 3,
  REQ_MAP = ['00000', '10000', '01110', '11111'],
  PROP_LIST = 1,
  VAL_LIST = 2,
  PRIORITY_LIST = 3,
  OVERWRITTEN_LIST = 4,
  HAS_INHERITABLE_PROPS = 5,
  SEARCH_LIST = 6,
  HAS_MATCHING_SEARCH_PROPS = 7,
  SEARCH_DELAY = 50,
  MIN_SEARCH_THERM_LENGTH = 3;

  var __selectedElement = null;
  var __setProps = [];
  var __setPriorities = [];
  var __searchMap = [];
  var __search_is_active = false;
  var __old_search_therm = '';

  var searchtimeout = new Timeouts();

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

  var parse_data = [];
  parse_data[REQ_TYPE_COMP_STYLE] = function() {};

  parse_data[REQ_TYPE_CSS] = parse_data[REQ_TYPE_COMPLETE] = function()
  {
    __setProps = [];
    __setPriorities = [];
    var dec = null, to_update_props = null, i = 0, declarations = [], j = 0;
    parseStyleDeclarations(declarations, [categories_data[INLINE_STYLE]], false);
    parseStyleDeclarations(declarations, categories_data[MATCHING_RULES], false);
    parseStyleDeclarations(declarations, categories_data[INHERITED_RULES], true);
  }

  var parseStyleDeclarations = function(declarations, declaration_list, set_has_inherited_props)
  {
    var dec = null, to_update_props = null, i = 0, j = 0;
    if(declaration_list)
    {
      for( ; dec = declaration_list[i]; i++)
      {
        if(dec.length > 3 )
        {
          to_update_props = parseStyleDec(dec, set_has_inherited_props);
          if( to_update_props.length )
          {
            for( j = 0; j < to_update_props.length; j++)
            {
              // TODO this is wrong
              // priority flag overwrites any specificity, 
              // but does not inherit
              updateOverwritten(to_update_props[j], declarations)
            }
          }
        }
        else
        {
          opera.postError("dec: "+ dec + " in parseStyleDeclarations ");
        }
        declarations[declarations.length] = dec;
      }
    }
  }

  var updateOverwritten = function(prop_index, declarations)
  {
    var dec = null, i = 0, k = 0, length = 0
    for( ; dec = declarations[i]; i++)
    {
      length = dec[PROP_LIST].length;
      for( j = 0; j < length; j++)
      {
        if( dec[PROP_LIST][j] == prop_index )
        {
          dec[OVERWRITTEN_LIST][j] = 1;
        }
      }
    }
  }

  var parseStyleDec = function(dec, set_has_inherited_props)
  {
    // updates the overwritten list for styleDeclaration
    // checks if the declaration actually has inheritable properties
    // returns an array with properties which needs
    // to be updated due to a setPriority flag
    // 
    var i = 0, prop = 0, length = dec[PROP_LIST].length, ret = [], has_inherited_props = false;
    dec[OVERWRITTEN_LIST] = [];
    for( ; i < length; i++ )
    {
      
      prop = dec[PROP_LIST][i];
      if( set_has_inherited_props )
      {
        if(inherited_props_index_list[prop])
        {
          has_inherited_props = true;
        }
        else
        {
          continue;
        }
      }
      if( __setProps[prop] )
      {
        if(dec[PRIORITY_LIST][i] && !__setPriorities[prop])
        {
          ret[ret.length] = prop;
          __setPriorities[prop] = /%|em|ex/.test(dec[VAL_LIST][i]) ? 2 : 1;
        }
        else
        {
          
          dec[OVERWRITTEN_LIST][i] = __setProps[prop];
          __setProps[prop] = /%|em|ex/.test(dec[VAL_LIST][i]) ? 2 : 1;
        }
      }
      else
      {
        __setProps[prop] = /%|em|ex/.test(dec[VAL_LIST][i]) ? 2 : 1;
      }
    }
    if( set_has_inherited_props )
    {
      dec[HAS_INHERITABLE_PROPS] = has_inherited_props;
    }
    //opera.postError(dec);
    return ret;
  }

  var searchDelayed = function(value)
  {
    searchtimeout.set(search, SEARCH_DELAY, value);
  }

  var search = function(search_therm)
  {
    if( __old_search_therm != search_therm 
        && ( __search_is_active || search_therm.length >= MIN_SEARCH_THERM_LENGTH ) )
    {
      doSearch(search_therm);
      for ( i = 0; view_id = __views[i]; i++)
      {
        views[view_id].updateCategories({}, getUnfoldedKey());
      }
      __old_search_therm = search_therm;
    }
  }
  
  var doSearch = function(search_therm)
  {
    if( search_therm.length >= MIN_SEARCH_THERM_LENGTH )
    {
      __searchMap = [];
      var i = 0, length = css_index_map.length;
      for( ; i < length; i++)
      {
        if( css_index_map[i].indexOf(search_therm) != -1 )
        {
          __searchMap[i] = 1;
        }
      }
      searchStyleDeclarations([categories_data[INLINE_STYLE]], __searchMap);
      searchStyleDeclarations(categories_data[MATCHING_RULES], __searchMap);
      searchStyleDeclarations(categories_data[INHERITED_RULES], __searchMap);
      __search_is_active = true;
    } 
    else
    {
      clearSearchStyleDeclarations([categories_data[INLINE_STYLE]]);
      clearSearchStyleDeclarations(categories_data[MATCHING_RULES]);
      clearSearchStyleDeclarations(categories_data[INHERITED_RULES]);
      __old_search_therm  = "";
      __search_is_active = false;
    }
  }

  var searchStyleDeclarations = function(declaration_list, search_list)
  {
    // updates the search list for a styleDeclaration
    // checks if the declaration actually has matchin property
    // search_list is a list with matching properties indexes
    // 
    var dec = null, i = 0, j = 0, length = 0, has_matching_search_props = false;
    if(declaration_list)
    {
      for( ; dec = declaration_list[i]; i++)
      {
        length = dec[PROP_LIST].length;
        has_matching_search_props = false;
        dec[SEARCH_LIST] = [];
        for( j = 0; j < length; j++ )
        {
          if( search_list[dec[PROP_LIST][j]] )
          {
            dec[SEARCH_LIST][j] = 1;
            has_matching_search_props = true;
          };
        }
        dec[HAS_MATCHING_SEARCH_PROPS] = has_matching_search_props;
      }
    }
  }

  var clearSearchStyleDeclarations = function(declaration_list)
  {
    var dec = null, i = 0;
    if(declaration_list)
    {
      for( ; dec = declaration_list[i]; i++)
      {
        delete dec[HAS_MATCHING_SEARCH_PROPS];
        delete dec[SEARCH_LIST];
      }
    }
  }

  this.getSearchActive = function()
  {
    return __search_is_active;
  }

  this.getSearchMap = function()
  {
    return __searchMap.slice(0);
  }

  this.getCategories = function()
  {
    return categories;
  }

  this.getCategoryData = function(index)
  {
    return categories_data[index];
  }

  this.getSetProps = function()
  {
    return __setProps.slice(0);
  }

  var getRequestType = function()
  {
    var 
    req_type_comp_style = categories[COMP_STYLE].unfolded && REQ_TYPE_COMP_STYLE || 0, 
    req_type_css = ( categories[INLINE_STYLE].unfolded 
      || categories[MATCHING_RULES].unfolded 
      || categories[INHERITED_RULES].unfolded ) && REQ_TYPE_CSS || 0, 
    req_type_complete = req_type_comp_style && req_type_css && REQ_TYPE_COMPLETE || 0;
    return req_type_complete || req_type_css || req_type_comp_style || 0;
  }

  var getUnfoldedKey = function()
  {
    var ret = '', i = 0;
    for( ; i < 5; i++)
    {
      ret += categories[i].unfolded ? '1' : '0';
    }
    return ret;
  }

  this.setUnfoldedCat = function( cat_id , value)
  {
    var 
    cat_index = id_index_map[cat_id],
    cat = categories[cat_index], 
    req_type = 0,
    request_key = '',
    i = 0,
    view_id = '';
    if(cat)
    {
      cat.unfolded = value;
      if( value)
      {
        if( __selectedElement )
        {
          if( ( req_type = getRequestType() ) != __selectedElement.req_type )
          {
            __selectedElement.req_type = req_type;
            getData
            (
              __selectedElement.rt_id, 
              __selectedElement.obj_id, 
              REQ_MAP[req_type],
              req_type
            );
          }
          else
          {
            for ( i = 0; view_id = __views[i]; i++)
            {
              views[view_id].updateCategories({}, getUnfoldedKey());
            }
          }
        }
      }
    }
    else
    {
      opera.postError('elementStyle, cat id does not return a cat');
    }
  }

  var onElementSelected = function(msg)
  {
    __selectedElement = {rt_id: msg.rt_id,  obj_id: msg.obj_id, req_type: getRequestType() };
    var view_id = '', i = 0, get_data = false;
    
    for ( ; ( view_id = __views[i] ) && !( get_data = views[view_id].isvisible() ); i++);
    //opera.postError("onElementSelected: " +get_data +' '+__selectedElement.req_type);
    if( get_data && __selectedElement.req_type )
    {
      //opera.postError(__selectedElement.req_type)
      getData
      (
        msg.rt_id, 
        msg.obj_id, 
        REQ_MAP[__selectedElement.req_type], 
        __selectedElement.req_type
      );
    }
  }

  var getData = function(rt_id, obj_id, cats, req_type)
  {
    if( stylesheets.hasStylesheetsRuntime(rt_id) )
    {
      var tag = tagManager.setCB(null, handleGetData, [rt_id, obj_id, cats, req_type]);
      services['ecmascript-debugger'].cssGetStyleDeclarations( tag, rt_id, obj_id, cats, 'json' );
    }
    else
    {
      stylesheets.getStylesheets(rt_id, arguments);
    }
  }

  var handleGetData = function(xml, rt_id, obj_id, cats, req_type)
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
          if( !declarations[i] )
          {
            declarations[i] = [[],[],[],[]]; // TODO this should be solved in the protocol
          }
          if( i == 1 ) // inline style
          {
            declarations[i].splice(0, 0, []); // "fixing" protocol
          }
          /** wrong wrong
          if( i > 0 && i < 4 )
          {
            // add an arry for the overwitten flags
            declarations[i][declarations[i].length] = [];
          }
          */
          declarations[i].rt_id = rt_id;
          categories_data[i] = declarations[i]; 
          if(!req_type)
          {
            opera.postError('missing req_type or req_type 0 in handleGetData in elementStyles')
          }
          parse_data[req_type]();
        }
      }
      if( __old_search_therm )
      {
        doSearch(__old_search_therm);
      }
      for ( i = 0; view_id = __views[i]; i++)
      {
        views[view_id].updateCategories({}, getUnfoldedKey());
      }
    }
  }

  messages.addListener('element-selected', onElementSelected);

  eventHandlers.input['css-inspector-text-search'] = function(event, target)
  {
    searchDelayed(target.value);
  }
}