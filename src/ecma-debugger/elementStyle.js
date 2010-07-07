window.cls || (window.cls = {});

/**
  * @constructor 
  */


cls.ElementStyle = function()
{
  // TODO 
  // cleanup code history
  // categories and everything related needs to be removed completely
  
  const 
  COMP_STYLE = 0,
  CSS = 1, 
  IS_VALID = 2,
  REQ_TYPE_CSS = 2,
  PROP_LIST = 1,
  VAL_LIST = 2,
  PRIORITY_LIST = 3,
  OVERWRITTEN_LIST = 4,
  SEARCH_LIST = 10,
  HAS_MATCHING_SEARCH_PROPS = 11,
  SEARCH_DELAY = 50,
  MIN_SEARCH_THERM_LENGTH = 1,

  // new scope messages
  COMPUTED_STYLE_LIST = 0,
  NODE_STYLE_LIST = 1,
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
        is_unfolded: function(){return settings['css-inspector'].get(id)},
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
    return ( categories[COMP_STYLE].is_unfolded()  || categories[CSS].is_unfolded() ) && REQ_TYPE_CSS || 0;
  }

  var getUnfoldedKey = function()
  {
    var ret = '', i = 0;
    for( ; i < 2; i++)
    {
      ret += categories[i].is_unfolded() ? '1' : '0';
    }
    return ret;
  }

  // TODO
  // replace with a listener for setting change
  this.setUnfoldedCat = function( cat_id , unfolded)
  {
    var 
    cat = categories[id_index_map[cat_id]], 
    req_type = 0,
    request_key = '',
    i = 0,
    view_id = '';

    if(cat)
    {
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

  // TODO: move
  var _rt_id;
  var _obj_id;

  this.update_view = function update_view()
  {
    if (_rt_id && _obj_id)
    {
      getData(_rt_id, _obj_id);
    }
  };

  var getData = function(rt_id, obj_id)
  {
    _rt_id = rt_id;
    _obj_id = obj_id;
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

  // TODO: move
  var self = this;

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
    k = 0,
    is_inherited = false;

    if(status == 0)
    {
      categories_data[COMP_STYLE] = message[COMPUTED_STYLE_LIST];
      categories_data[CSS] = message[NODE_STYLE_LIST] || [];
      categories_data[CSS].rt_id = categories_data[COMP_STYLE].rt_id = rt_id;
      categories_data[IS_VALID] = true;

      var literal_declaration_list = window.elementStyle.literal_declaration_list;

      // this is to ensure that a set property is always displayed in computed style,
      // also if it maps the initial value and the setting "Hide Initial Values" is set to true.
      __setProps = [];
      for ( i = 0; node_style_cascade = categories_data[CSS][i]; i++)
      {
        for( j = 0; style_dec = node_style_cascade[STYLE_LIST][j]; j++)
        {
          if( style_dec[ORIGIN] != 1 ) // any other rule except browser default rules
          {
            if (literal_declaration_list && literal_declaration_list[style_dec[RULE_ID]])
            {
              categories_data[CSS][i][STYLE_LIST][j] = self.sync_declarations(style_dec, literal_declaration_list[style_dec[RULE_ID]], i);
            }
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

  /**
   * Syncs the declarations returned from Scope with the literal declarations (the ones that the user has typed in)
   * to get the right status and disabled value
   *
   * NOTE: some of the code in this method is currently not used, but is left for now since it will before
   * used in the future
   */
  this.sync_declarations = function sync_declarations(expanded_declarations, literal_declarations, node_index/*TODO: rename*/)
  {
    // TODO: consider moving some of these
    const
    VALUE = 0,
    PRIORITY = 1,
    STATUS = 2,
    IS_DISABLED = 3,
    DISABLED_LIST = 12;

    var is_inherited = node_index > 0;

    var rule_id = expanded_declarations[RULE_ID];
    var synced_declarations = JSON.parse(JSON.stringify(expanded_declarations)); // Deep copy
    synced_declarations[DISABLED_LIST] = [];

    // Always set this to 1 (applied), we will manually check later if it's overwritten or not
    for (var prop in literal_declarations)
    {
      literal_declarations[prop][STATUS] = 1;
    }

    // Get the rule index
    var node_style_list_index = 0;
    var style_list_index = 0;
    out:
    for (var i = 0, node_style_list; node_style_list = (categories_data[NODE_STYLE_LIST] || [])[i]; i++)
    {
      for (var j = 0, style_list; style_list = (node_style_list[STYLE_LIST] || [])[j]; j++)
      {
        if (style_list[RULE_ID] == rule_id)
        {
          node_style_list_index = i;
          style_list_index = j;
          //  ▃▃▃▃▃▃▃▃
          //  ▃▃▃▃  ▃▃
          //
          //   _·
          break out;
        }
      }
    }

    // Here we manually loop through the whole shebang and set the status (the overwritten vale)
    // manually. We have to do this since we're dealing with disabled values (which in reality does not
    // exist for the node, only the copy). This is a bit complicated.
    //
    // TODO: remember to special case shorthands later
    for (var i = 0; i <= node_style_list_index; i++)
    {
      var style_list = categories_data[CSS][i][STYLE_LIST];
      var list_index = (i == node_style_list_index) ? style_list_index : style_list.length;
      while (list_index--)
      {
        for (var k = 0, index; index = style_list[list_index][INDEX_LIST][k]; k++)
        {
          var prop = window.css_index_map[index];
          if (prop in literal_declarations &&
             ((style_list[list_index][DISABLED_LIST] && style_list[list_index][DISABLED_LIST][k] == 0) || !style_list[list_index][DISABLED_LIST]))
          {
            // If the property has an "!important" declaration, is not disabled, and the current value in the loop
            // is not "!important", set the status of the current value to 0 (i.e. overwritten)
            if (literal_declarations[prop][PRIORITY] && !literal_declarations[prop][IS_DISABLED] && !style_list[list_index][PRIORITY_LIST][k])
            {
              categories_data[CSS][i][STYLE_LIST][list_index][STATUS_LIST][k] = 0;
            }
            // ... otherwise, set the property's value to disabled
            else
            {
              literal_declarations[prop][STATUS] = 0;
            }
          }
        }
      }
    }

    // Now do the syncing

    // First the values from Scope...
    for (var i = expanded_declarations[INDEX_LIST].length; i--; )
    {
      var prop = window.css_index_map[expanded_declarations[INDEX_LIST][i]];

      synced_declarations[DISABLED_LIST][i] = 0;

      // Remove any property that the user hasn't added literally
      // XXX: This is commented out until we preserve shorthands
      //if (!(prop in literal_declarations) && (this.reverse_shorthand_map[prop] in literal_declarations))
      //{
      //  synced_declarations[INDEX_LIST   ].splice(i, 1);
      //  synced_declarations[VALUE_LIST   ].splice(i, 1);
      //  synced_declarations[PRIORITY_LIST].splice(i, 1);
      //  synced_declarations[STATUS_LIST  ].splice(i, 1);
      //  synced_declarations[DISABLED_LIST].splice(i, 1);
      //}
    }

    // ... then the literal values
    for (var prop in literal_declarations)
    {
      if (is_inherited && !(prop in window.css_inheritable_properties))
      {
        continue;
      }

      var prop_index = window.css_index_map.indexOf(prop);
      var index = synced_declarations[INDEX_LIST].indexOf(prop_index);
      var expanded_index = expanded_declarations[INDEX_LIST].indexOf(prop_index);
      if (index == -1)
      {
        index = synced_declarations[INDEX_LIST].length;
      }

      synced_declarations[INDEX_LIST   ][index] = prop_index;
      synced_declarations[VALUE_LIST   ][index] = expanded_declarations[VALUE_LIST][expanded_index] || literal_declarations[prop][VALUE];
      synced_declarations[PRIORITY_LIST][index] = expanded_declarations[PRIORITY_LIST][expanded_index] || literal_declarations[prop][PRIORITY];
      // Use the STATUS from Scope if this is inherited, otherwise, use the saved value (literal_declarations)
      synced_declarations[STATUS_LIST  ][index] = node_index > node_style_list_index ? expanded_declarations[STATUS_LIST][expanded_index] : literal_declarations[prop][STATUS];
      synced_declarations[DISABLED_LIST][index] = literal_declarations[prop][IS_DISABLED];
    }

    // Create object with `property: value`
    var declarations = {};
    var len = expanded_declarations[PROP_LIST].length;
    for (var i = 0; i < len; i++)
    {
      declarations[window.css_index_map[expanded_declarations[INDEX_LIST][i]]] = expanded_declarations[VAL_LIST][i];
    }

    var len = synced_declarations[INDEX_LIST].length;
    for (var i = 0; i < len; i++)
    {
      var prop = window.css_index_map[synced_declarations[INDEX_LIST][i]];
      var value;

      // If this is a shorthand, and it has been disabled, use cached value
      if (prop in this.shorthand_map && !(this.shorthand_map[prop][0] in declarations) && literal_declarations[prop][0])
      {
        value = literal_declarations[prop][0];
      }
      else
      {
        // Get the value or re-construct a shorthand
        value = this.shorthand_map[prop]
              ? window.stylesheets.get_shorthand_from_declarations(prop, declarations, literal_declarations)
              : synced_declarations[VALUE_LIST] && synced_declarations[VALUE_LIST][i];
      }

      synced_declarations[VALUE_LIST][i] = value;
      literal_declarations[prop] = [value, // Cache
                                    synced_declarations[PRIORITY_LIST][i],
                                    synced_declarations[STATUS_LIST][i],
                                    synced_declarations[DISABLED_LIST][i]];
    }

    return synced_declarations;
  };

  this.update_literal_declarations = function update_literal_declarations(rule_id, declaration, callback)
  {
    var rt_id = __selectedElement.rt_id;
    var obj_id = __selectedElement.obj_id;
    var tag = tagManager.set_callback(this, this.handle_update_literal_declarations, [rule_id, declaration, callback]);
    services['ecmascript-debugger'].requestCssGetStyleDeclarations(tag, [rt_id, obj_id]);
  };

  this.handle_update_literal_declarations = function handle_update_literal_declarations(status, message, rule_id, declaration, callback)
  {
    if (status == 0)
    {
      var rule = this.get_rule_by_id(rule_id, message);

      // TEMP: remove when empty rules are returned correctly (CORE-30351)
      if (!rule) return;

      if (declaration)
      {
        var prop_list = rule[PROP_LIST];
        for (var i = 0, prop; prop = window.css_index_map[prop_list[i]]; i++)
        {
          this.literal_declaration_list[rule_id][prop] =
            [rule[VAL_LIST][i], rule[PRIORITY_LIST][i], rule[OVERWRITTEN_LIST][i], 0];
        }
      }
    }

    if (typeof callback == "function")
    {
      callback();
    }
  };

  this.literal_declaration_list = {};

  this.save_literal_declarations = function save_literal_declarations(rule_id)
  {
    if (this.literal_declaration_list[rule_id])
    {
      return;
    }

    // property: [value, is_important, status (overwritten=0, else 1), is_disabled]
    this.literal_declaration_list[rule_id] = {};

    var rule = this.get_rule_by_id(rule_id, categories_data);
    if (rule)
    {
      var len = rule[PROP_LIST].length;
      for (var i = 0; i < len; i++)
      {
        this.literal_declaration_list[rule_id][window.css_index_map[rule[PROP_LIST][i]]] =
          [rule[VAL_LIST][i], rule[PRIORITY_LIST][i], rule[OVERWRITTEN_LIST][i], 0];
      }
    }
  };

  this.get_rule_by_id = function get_rule_by_id(id, categories)
  {
    for (var i = 0, node_style_list; node_style_list = (categories[NODE_STYLE_LIST] || [])[i]; i++)
    {
      for (var j = 0, style_list; style_list = (node_style_list[STYLE_LIST] || [])[j]; j++)
      {
        if (style_list[RULE_ID] == id)
        {
          return style_list;
        }
      }
    }
    return null;
  };

  // TODO: border-*-radius

  // TODO(hzr): move this when the CSS stuff is refactored
  this.shorthand_map = {
    "border": ["border-width", "border-style", "border-color", "border-top", "border-right", "border-bottom", "border-left"],
    "border-top": ["border-top-width", "border-top-style", "border-top-color"],
    "border-right": ["border-right-width", "border-right-style", "border-right-color"],
    "border-bottom": ["border-bottom-width", "border-bottom-style", "border-bottom-color"],
    "border-left": ["border-left-width", "border-left-style", "border-left-color"],
    "border-width": [],
    "border-style": [],
    "border-color": [],
    "background": ["background-attachment", "background-color", "background-image", "background-position", "background-repeat"],
    "font": ["font-style", "font-variant", "font-weight", "font-size", "line-height", "font-family"],
    "list-style": ["list-style-type", "list-style-position", "list-style-image"],
    "margin": ["margin-top", "margin-right", "margin-bottom", "margin-left"],
    "outline": ["outline-style", "outline-color", "outline-width"],
    "overflow": ["overflow-x", "overflow-y"],
    "padding": ["padding-top", "padding-right", "padding-bottom", "padding-left"]
  };

  this.reverse_shorthand_map = {
    "border-width": "border",
    "border-style": "border",
    "border-color": "border",
    "border-top-width": "border",
    "border-right-width": "border",
    "border-bottom-width": "border",
    "border-left-width": "border",
    "border-top-style": "border",
    "border-right-style": "border",
    "border-bottom-style": "border",
    "border-left-style": "border",
    "border-top-color": "border",
    "border-right-color": "border",
    "border-bottom-color": "border",
    "border-left-color": "border",
    "background-attachment": "background",
    "background-color": "background",
    "background-image": "background",
    "background-position": "background",
    "background-repeat": "background",
    "font-style": "font",
    "font-variant": "font",
    "font-weight": "font",
    "font-size": "font",
    "line-height": "font",
    "font-family": "font",
    "list-style-type": "list-style",
    "list-style-position": "list-style",
    "list-style-image": "list-style",
    "margin-top": "margin",
    "margin-right": "margin",
    "margin-top": "margin",
    "margin-right": "margin",
    "margin-bottom": "margin",
    "margin-left": "margin",
    "outline-color": "outline",
    "outline-style": "outline",
    "outline-width": "outline",
    "overflow-x": "overflow",
    "overflow-y": "overflow",
    "padding-top": "padding",
    "padding-right": "padding",
    "padding-bottom": "padding",
    "padding-left": "padding"
  };


  /* */
  messages.addListener('element-selected', onElementSelected);
  messages.addListener('reset-state', onResetState);
  /* */
  eventHandlers.input['css-inspector-text-search'] = function(event, target)
  {
    searchDelayed(target.value);
  }
}
