/**
  * @constructor 
  */

var elementStyle = new function()
{
  // TODO cleanup code history
  
  const 
  COMP_STYLE = 0,
  CSS = 1, 
  INLINE_STYLE = 1,
  MATCHING_RULES = 2,
  INHERITED_RULES = 3,
  DEFAULT_VALUES = 4,
  REQ_TYPE_NONE = 0,
  REQ_TYPE_COMP_STYLE = 1,
  REQ_TYPE_CSS = 2,
  REQ_TYPE_COMPLETE = 3,
  REQ_MAP = ['00000', '11111', '11111', '11111'],
  HEADER = 0, 
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

  var default_styles_pointer = 0;

  var searchtimeout = new Timeouts();

  var __views = ['css-inspector'];

  var id_index_map = 
  {
    'computedStyle': COMP_STYLE,
    'css': CSS
  }

  var categories =
  [
    {
      'id': 'computedStyle',
      'name': ui_strings.M_VIEW_LABEL_COMPUTED_STYLE,
      'unfolded': false
    },
    {
      'id': 'css',
      'name': ui_strings.M_VIEW_LABEL_STYLES,
      'unfolded': true,
      'handler': 'edit-css'
    }
  ];


  var onAplicationsetup = function()
  {
    var cat = null, i = 0;
    for( ; cat = categories[i]; i++ )
    {
      cat.unfolded = settings['css-inspector'].get(cat.id);
    }
  }


  var node_cascades = [];

  var getDefaultStyle = function(defaultStyles, pointer, obj_id)
  {
    for( var c = null; ( c = defaultStyles[pointer] ) && c[0][0] != obj_id; pointer++);
    return c || [[obj_id],[],[],[]];
  }


  /*
  fixing the protocol
  data should follow the parent node chain, with the target as first element.
  for each node a node style cascade with:
  [
    inline style declaration,
    [ matching css declarations * ],
    default style declaration,
    ,
    ,
    has inheritable rules,
    ,
    has matching search props
  ]
  */
  
  var restructureData = function(rt_id, obj_id, declarations)
  {
    var 
    inlineStyle = declarations[INLINE_STYLE] 
      && [ ['inline'], declarations[INLINE_STYLE][0], declarations[INLINE_STYLE][1], declarations[INLINE_STYLE][2] ]
      || [['inline'],[],[],[]],
    matchingRules = declarations[MATCHING_RULES] || [[],[],[],[]],
    inheritedRules = declarations[INHERITED_RULES] || [[],[],[],[]],
    defaultValues = declarations[DEFAULT_VALUES] || [[],[],[],[]],
    def_val_cur = 0,
    def_val = null,
    style_dec = null, 
    i = 0,
    node_casc_cur = [],
    match_cur = null;
    // this is broken, see below for details
    for( ; ( def_val = defaultValues[def_val_cur] ) && def_val[0][0] != obj_id; def_val_cur++);
    if( !def_val )
    {
      def_val = [[obj_id],[],[],[]];
    }

    node_cascades = [[inlineStyle, matchingRules, def_val]];

    /* 
      the logic for default rules is quite broken here:

      - not each element has default styles
      - if a node has no matching rules, it will not be in the inherited rules

      -> get the node chain from DOM data
      -> fix inherited rules 
         ( insert for each missing entry [["inline",<object-id>,<element-name>],[],[],[]]  )
    */

    for( ; style_dec = inheritedRules[i]; i++)
    {
      if( style_dec[HEADER][0] == 'inline' )
      {
        // this is broken, see above for details
        for( ; ( def_val = defaultValues[def_val_cur] ) && def_val[0][0] != style_dec[HEADER][1]; def_val_cur++);
        if( !def_val )
        {
          def_val = [[obj_id],[],[],[]];
        }
        match_cur = [];
        node_cascades[node_cascades.length] = [style_dec, match_cur, def_val]; 
      }
      else
      {
        if( match_cur )
        {
          match_cur[match_cur.length] = style_dec;
        }
        else
        {
          opera.postError('failed in restructureData');
        }
      }
    }

    //window.open('data:text/plain;charset=utf-8,'+encodeURIComponent(JSON.stringify(node_cascades)));
    categories_data[0] = declarations[0]; 
    categories_data[1] = node_cascades;
    categories_data[1].rt_id = categories_data[0].rt_id = rt_id;

  }

  var __setProps = [];
  var __setPriorities = [];

  
  var categories_data = [];

  var parse_data = [];
  parse_data[REQ_TYPE_COMP_STYLE] = function() {};

  parse_data[REQ_TYPE_CSS] = parse_data[REQ_TYPE_COMPLETE] = function()
  {
    var
    node_casc = null,
    i = 0;
    
    __setProps = [];
    __setPriorities = [];
    for( ; node_casc = node_cascades[i]; i++)
    {
      parseNodeCascade(node_casc, i > 0);
    }
  }
  


  var parseNodeCascade = function(node_cascade, set_has_inherited_props)
  {
    /*
      node_cascade has the form
      [
        style_dec_inline,
        [style_dec_css*],
        style_dec_default,
        ,
        ,
        has_inherited_props // must be set in this call
      ]
    */
    
    var
    dec = null,
    to_update_props = null,
    i = 0,
    j = 0,
    declaration_list = node_cascade[1],
    // to update the priority flags, only per node
    declarations = [node_cascade[0]],
    has_inherited_props = false;
    
    parseStyleDec(node_cascade[0], set_has_inherited_props);
    has_inherited_props = set_has_inherited_props
      && ( has_inherited_props || node_cascade[0][HAS_INHERITABLE_PROPS] );
      
    for( ; dec = declaration_list[i]; i++)
    {
      if( dec.length > 3 )
      {
        to_update_props = parseStyleDec(dec, set_has_inherited_props);
        has_inherited_props = set_has_inherited_props
          && ( has_inherited_props || dec[HAS_INHERITABLE_PROPS] );
        if( to_update_props.length )
        {
          for( j = 0; j < to_update_props.length; j++)
          {
            updateOverwritten(to_update_props[j], declarations)
          }
        }
      }
      else
      {
        opera.postError("failed in parseNodeCascade: "+ JSON.stringify(dec) );
      }
      declarations[declarations.length] = dec;
    }
    
    parseStyleDec(node_cascade[2], set_has_inherited_props);
    has_inherited_props = set_has_inherited_props
      && ( has_inherited_props || node_cascade[2][HAS_INHERITABLE_PROPS] );
      
    if( set_has_inherited_props )
    {
      node_cascade[HAS_INHERITABLE_PROPS] = has_inherited_props;
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
        // the important flag is only relevant for the target node, 
        // for any inherited property it doesn't matter
        if( !set_has_inherited_props && dec[PRIORITY_LIST][i] && !__setPriorities[prop])
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
            
      for( i = 0, length = categories_data[CSS].length; i < length; i++)
      {
        searchNodeCascade(categories_data[CSS][i], __searchMap);
      }
      
      __search_is_active = true;
    } 
    else
    {
      for( i = 0, length = categories_data[CSS].length; i < length; i++)
      {
        clearNodeCascade(categories_data[CSS][i], __searchMap);
      }
      __old_search_therm  = "";
      __search_is_active = false;
    }
  }
  
  var searchNodeCascade = function(node_cascade, search_list)
  {
    /*
      node_cascade has the form
      [
        style_dec_inline,
        [style_dec_css*],
        style_dec_default,
        ,
        ,
        has_inherited_props // must be set in this call
      ]
    */
    //opera.postError("searchNodeCascade: "+ JSON.stringify(node_cascade) )
    var
    dec = null,
    i = 0,
    declaration_list = node_cascade[1],
    has_matching_search_props = false;
    
    searchStyleDeclaration(node_cascade[0], search_list);
    has_matching_search_props = has_matching_search_props || node_cascade[0][HAS_MATCHING_SEARCH_PROPS];
      
    for( ; dec = declaration_list[i]; i++)
    {
      if( dec.length > 3 )
      {
        searchStyleDeclaration(dec, search_list);
        has_matching_search_props =
          has_matching_search_props || dec[HAS_MATCHING_SEARCH_PROPS];
      }
      else
      {
        opera.postError("searchNodeCascade: "+ JSON.stringify(dec) );
      }
    }
    searchStyleDeclaration(node_cascade[2], search_list);

    has_matching_search_props =
      has_matching_search_props || node_cascade[2][HAS_MATCHING_SEARCH_PROPS];
      
    node_cascade[HAS_MATCHING_SEARCH_PROPS] = has_matching_search_props;
  
  }
  
  var searchStyleDeclaration = function(declaration, search_list)
  {
    // updates a styleDeclaration
    // checks if the declaration actually has matchin property
    // search_list is a list with matching properties indexes
    // 
    var
    i = 0,
    length = declaration[PROP_LIST].length,
    has_matching_search_props = false;

    declaration[SEARCH_LIST] = [];
    for( ; i < length; i++ )
    {
      if( search_list[declaration[PROP_LIST][i]] )
      {
        declaration[SEARCH_LIST][i] = 1;
        has_matching_search_props = true;
      };
    }
    declaration[HAS_MATCHING_SEARCH_PROPS] = has_matching_search_props;
  }
  
  var clearNodeCascade = function(node_cascade, search_list)
  {
    
    var
    dec = null,
    i = 0,
    declaration_list = node_cascade[1];

    delete node_cascade[0][HAS_MATCHING_SEARCH_PROPS];
    for( ; dec = declaration_list[i]; i++)
    {
      delete dec[HAS_MATCHING_SEARCH_PROPS];
    }
    delete node_cascade[2][HAS_MATCHING_SEARCH_PROPS];  
  }
/*
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
*/

/*
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
*/

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
    return ( categories[COMP_STYLE].unfolded  || categories[CSS].unfolded ) && REQ_TYPE_CSS || 0;
  }

  var getUnfoldedKey = function()
  {
    var ret = '', i = 0;
    for( ; i < 2; i++)
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
    if( get_data && __selectedElement.req_type )
    {
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
      if( cats[1] == '1' ) // there is only 11111, other do actually not make sense
      {
        restructureData(rt_id, obj_id, declarations);
      }
      if(!req_type)
      {
        opera.postError('missing req_type or req_type 0 in handleGetData in elementStyles')
      }

      parse_data[req_type]();

      
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
  messages.addListener('application-setup', onAplicationsetup);

  eventHandlers.input['css-inspector-text-search'] = function(event, target)
  {
    searchDelayed(target.value);
  }
}