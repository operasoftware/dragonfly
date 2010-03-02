window.cls || (window.cls = {});

/**
  * @constructor 
  */


cls.ElementStyle = function()
{
  // TODO cleanup code history
  //  cats is still overdone
  
  const 
  COMP_STYLE = 0,
  CSS = 1, 
  IS_VALID = 2,
  REQ_TYPE_CSS = 2,
  PROP_LIST = 1,
  VAL_LIST = 2,
  PRIORITY_LIST = 3,
  SEARCH_LIST = 10,
  HAS_MATCHING_SEARCH_PROPS = 11,
  SEARCH_DELAY = 50,
  MIN_SEARCH_THERM_LENGTH = 1,

  // new scope messages
  COMPUTED_STYLE_LIST = 0,
  NODE_STYLE_LIST = 1;
  // sub message NodeStyle 
  OBJECT_ID = 0,
  ELEMENT_NAME = 1,
  STYLE_LIST = 2,
  // sub message StyleDeclaration 
  ORIGIN = 0,
  INDEX_LIST = 1,
  VALUE_LIST = 2,
  PRIORITY_LIST = 3,
  STATUS_LIST = 4,
  SELECTOR = 5,
  SPECIFICITY = 6,
  STYLESHEET_ID = 7,
  RULE_ID = 8,
  RULE_TYPE = 9;

  var categories_data = [];
  var __selectedElement = null;
  var __searchMap = [];
  var __search_is_active = false;
  var __old_search_therm = '';
  var __setProps = [];

  var onResetState = function()
  {
    __selectedElement = null;
    __setProps = [];
    __setPriorities = [];
    __searchMap = [];
    __search_is_active = false;
    __old_search_therm = '';
  }

  var default_styles_pointer = 0;

  var searchtimeout = new Timeouts();

  var __views = ['css-inspector'];

  var id_index_map = 
  {
    'computedStyle': COMP_STYLE,
    'css': CSS
  }

  var setCategories = function(id, name, handler)
  {
    return {
        id: id,
        name: name,
        unfolded: settings['css-inspector'].get(id),
        handler: handler || null 
    }
  }

  var categories =
  [
    setCategories('computedStyle', ui_strings.M_VIEW_LABEL_COMPUTED_STYLE),
    setCategories('css', ui_strings.M_VIEW_LABEL_STYLES, 'edit-css')
  ];

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

  this.getSearchTerm = function()
  {
    return __old_search_therm;
  }
  
  var doSearch = function(search_therm)
  {
    if( search_therm.length >= MIN_SEARCH_THERM_LENGTH )
    {
      __searchMap = [];
      var i = 0, length = css_index_map.length;
      for( ; i < length; i++)
      {
        __searchMap[i] = css_index_map[i].indexOf(search_therm) != -1;
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

  /*

    NODE-CHAIN-STYLE-CASCADE ::= "[" NODE-STYLE-CASCADE { "," NODE-STYLE-CASCADE  } "]"
    NODE-STYLE-CASCADE       ::= "[[" NODE-HEADER "],"
                                   STYLE-DECLARATION-LIST
                                 "]"
    NODE-HEADER              ::= OBJECT-ID "," ELEMENT-NAME
    STYLE-DECLARATION-LIST   ::= "[" STYLE-DECLARATION { "," STYLE-DECLARATION } "]"
    STYLE-DECLARATION        ::= ELEMENT-RULE | AUTHOR-RULE | LOCAL-RULE | USER-AGENT-RULE

    ; Common header for style declarations
    RULE-HEADER    ::= RULE-ORIGIN
    RULE-ORIGIN    ::=   "1" ; user-agent (ie. default)
                       | "2" ; local (ie. user)
                       | "3" ; author (ie. stylesheet)
                       | "4" ; element (ie. in-line)
                       
    ; Common property list for style declarations
    PROPERTIES ::= "[" INDEX-LIST "],"
                   "[" VALUE-LIST "],"
                   "[" PRIORITY-LIST "],"
                   "[" STATUS-LIST "]"

    ELEMENT-RULE      ::= "[[" ELEMENT-HEADER "]," PROPERTIES "]"
    ELEMENT-HEADER    ::= RULE-HEADER ; object-id and element-name is part of NODE-HEADER

    AUTHOR-RULE       ::= "[[" AUTHOR-HEADER "]," PROPERTIES "]"
    AUTHOR-HEADER     ::= RULE-HEADER "," STYLESHEET-ID "," RULE-ID "," RULE-TYPE "," SPECIFICITY "," SELECTOR-TEXT

    USER-AGENT-RULE   ::= "[[" USER-AGENT-HEADER "]," PROPERTIES "]"
    USER-AGENT-HEADER ::= RULE-HEADER ; object-id and element-name is part of NODE-HEADER

    LOCAL-RULE       ::= "[[" LOCAL-HEADER "]," PROPERTIES "]"
    LOCAL-HEADER     ::= RULE-HEADER "," SPECIFICITY "," SELECTOR-TEXT

  */
  
  var searchNodeCascade = function(node_cascade, search_list)
  {
    // search_list is an array which has either 0 or 1 for the whole index_ map
    var
    dec = null,
    i = 0,
    declaration_list = node_cascade[STYLE_LIST],
    has_matching_search_props = false;
    
    for( ; dec = declaration_list[i]; i++)
    {
      searchStyleDeclaration(dec, search_list);
      has_matching_search_props =
        has_matching_search_props || dec[HAS_MATCHING_SEARCH_PROPS];
    }
      
    node_cascade[HAS_MATCHING_SEARCH_PROPS] = has_matching_search_props;
  
  }
  
  var searchStyleDeclaration = function(declaration, search_list)
  {
    // updates a styleDeclaration
    // checks if the declaration actually has matchin property
    // search_list is a list with matching properties indexes

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
    if(categories_data[IS_VALID])
    {
      return categories_data[index];
    }
    if(__selectedElement)
    {
      getData(__selectedElement.rt_id, __selectedElement.obj_id);
    }
    return null;
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

  this.setUnfoldedCat = function( cat_id , unfolded)
  {
    var 
    cat = categories[ id_index_map[cat_id] ], 
    req_type = 0,
    request_key = '',
    i = 0,
    view_id = '';

    if(cat)
    {
      cat.unfolded = unfolded;
      if(unfolded)
      {
        if( __selectedElement )
        {
          if( ( req_type = getRequestType() ) != __selectedElement.req_type )
          {
            __selectedElement.req_type = req_type;
            getData(__selectedElement.rt_id, __selectedElement.obj_id);
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
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
        'elementStyle, cat id does not return a cat');
    }
  }

  var onElementSelected = function(msg)
  {
    __selectedElement = {rt_id: msg.rt_id,  obj_id: msg.obj_id, req_type: getRequestType() };
    var view_id = '', i = 0, get_data = false;
    
    for ( ; ( view_id = __views[i] ) && !( get_data = views[view_id].isvisible() ); i++);
    if( get_data && __selectedElement.req_type )
    {
      getData(msg.rt_id, msg.obj_id);
    }
    else
    {
      categories_data[IS_VALID] = false;
    }
    
  }

  var getData = function(rt_id, obj_id)
  {
    if( stylesheets.hasStylesheetsRuntime(rt_id) )
    {
      var tag = tagManager.set_callback(null, handleGetData, [rt_id, obj_id]);
      services['ecmascript-debugger'].requestCssGetStyleDeclarations(tag, [rt_id, obj_id]);
    }
    else
    {
      stylesheets.getStylesheets(rt_id, arguments);
    }
  }

  var handleGetData = function(status, message, rt_id, obj_id)
  {

    var  
    declarations = null, 
    i = 0, 
    view_id = '',
    node_style_cascade = null, 
    style_dec = null, 
    j = 0, 
    length = 0, 
    k = 0;

    if(status == 0)
    {
      categories_data[COMP_STYLE] = message[COMPUTED_STYLE_LIST]; 
      categories_data[CSS] = message[NODE_STYLE_LIST];
      categories_data[CSS].rt_id = categories_data[COMP_STYLE].rt_id = rt_id;
      categories_data[IS_VALID] = true;

      // this is to ensure that a set property is always displayed in computed style,
      // also if it maps the initial value and the setting "Hide Initial Values" is set to true.
      __setProps = [];
      for ( i = 0; node_style_cascade = categories_data[CSS][i]; i++)
      {
        for( j = 0; style_dec = node_style_cascade[STYLE_LIST][j]; j++)
        {
          if( style_dec[ORIGIN] != 1 ) // any other rule except browser default rules
          {
            length = style_dec[INDEX_LIST].length;
            for( k = 0; k < length; k++)
            {
              if( style_dec[STATUS_LIST][k] )
              {
                __setProps[style_dec[INDEX_LIST][k]] = 1;
              }
            }
          }
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

  /* */
  messages.addListener('element-selected', onElementSelected);
  messages.addListener('reset-state', onResetState);
  /* */
  eventHandlers.input['css-inspector-text-search'] = function(event, target)
  {
    searchDelayed(target.value);
  }
}
