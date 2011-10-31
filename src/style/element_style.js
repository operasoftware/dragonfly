window.cls || (window.cls = {});

// TODO categories and everything related needs to be removed completely
/**
 * @constructor
 */
cls.ElementStyle = function()
{
  var self = this; // TODO: get rid of

  this._tag_manager = cls.TagManager.get_instance();
  this._categories_data = [];
  this._selected_element = null;
  this._search_map = [];
  this._search_is_active = false;
  this._search_term = "";
  this._set_props = [];
  this._rt_id = null;
  this._obj_id = null;
  this._es_debugger = window.services['ecmascript-debugger'];
  this._search_timeout = new Timeouts();
  this._views = ['css-comp-style', 'css-inspector'];
  this._categories = [
    {
      id: 'computedStyle',
      name: ui_strings.M_VIEW_LABEL_COMPUTED_STYLE,
      is_unfolded: true,
      handler: null
    },
    {
      id: 'css',
      name: ui_strings.M_VIEW_LABEL_STYLES,
      is_unfolded: true,
      handler: 'edit-css'
    },
  ];

  /**
   * An object with rule IDs as keys and values as StyleDeclarations with the disabled
   * properties for that rule
   */
  this.disabled_style_dec_list = {};

  var COMP_STYLE = 0;
  var CSS = 1;
  var IS_VALID = 2;
  var REQ_TYPE_CSS = 2;
  var PROP_LIST = 1;
  var VAL_LIST = 2;
  var PRIORITY_LIST = 3;
  var SEARCH_LIST = cls.ElementStyle.SEARCH_LIST;
  var HAS_MATCHING_SEARCH_PROPS = 11;
  var SEARCH_DELAY = 50;
  var MIN_SEARCH_TERM_LENGTH = 1;
  var DISABLED_LIST = cls.ElementStyle.DISABLED_LIST;

  // new scope messages
  var COMPUTED_STYLE_LIST = 0;
  var NODE_STYLE_LIST = 1;
  // sub message NodeStyle
  var OBJECT_ID = 0;
  var ELEMENT_NAME = 1;
  var STYLE_LIST = 2;
  // sub message StyleDeclaration
  var ORIGIN = 0;
  var INDEX_LIST = 1;
  var VALUE_LIST = 2;
  var STATUS_LIST = 4;
  var SELECTOR = 5;
  var SPECIFICITY = 6;
  var STYLESHEET_ID = 7;
  var RULE_ID = 8;
  var RULE_TYPE = 9;

  var ORIGIN_USER_AGENT = 1;
  var ORIGIN_LOCAL = 2;
  var ORIGIN_AUTHOR = 3;
  var ORIGIN_ELEMENT = 4;
  var ORIGIN_SVG = 5;

  // Pseudo classes/elements
  var NONE = 0;
  var HOVER = 1;
  var ACTIVE = 2;
  var FOCUS = 3;
  var LINK = 4;
  var VISITED = 5;
  var FIRST_LINE = 6
  var FIRST_LETTER = 7;
  var BEFORE = 8;
  var AFTER = 9;
  var SELECTION = 10;

  this._pseudo_item_list = [NONE];
  this._pseudo_element_list = [];
  this._pseudo_item_map = {
    // Classes
    "link": LINK,
    "visited": VISITED,
    "hover": HOVER,
    "active": ACTIVE,
    "focus": FOCUS,

    // Elements
    "first-line": FIRST_LINE,
    "first-letter": FIRST_LETTER,
    "before": BEFORE,
    "after": AFTER,
    "selection": SELECTION
  };

  this.get_category_data = function(index)
  {
    if (this._categories_data[IS_VALID])
      return this._categories_data[index];

    if (this._selected_element)
      this._get_data(this._selected_element.rt_id, this._selected_element.obj_id);

    return null;
  };

  this.get_computed_style = function()
  {
    return this.get_category_data(COMP_STYLE);
  };

  this.get_set_props = function()
  {
    return this._set_props.slice(0);
  };

  this.add_pseudo_item = function(pseduo_item)
  {
    var index = this._pseudo_item_list.indexOf(this._pseudo_item_map[pseduo_item]);
    if (index == -1)
      this._pseudo_item_list.push(this._pseudo_item_map[pseduo_item]);
  };

  this.remove_pseudo_item = function(pseduo_item)
  {
    var index = this._pseudo_item_list.indexOf(this._pseudo_item_map[pseduo_item]);
    if (index != -1)
      this._pseudo_item_list.splice(index, 1);
  };

  this.update = function()
  {
    if (this._rt_id && this._obj_id)
      this._get_data(this._rt_id, this._obj_id);
  }.bind(this);

  /**
   * Syncs the declarations returned from Scope with the disabled properties
   *
   * @param {Array} style_dec The style declaration from Scope
   * @param {Array} disabled_style_dec The disabled style declaration
   * @param {Boolean} is_inherited Whether or not the style declaration is inherited
   * @returns {Array} The synced StyleDeclarations
   */
  this.sync_declarations = function(style_dec, disabled_style_dec, is_inherited)
  {
    var index_map = window.css_index_map;

    if (!style_dec[INDEX_LIST])
    {
      style_dec[INDEX_LIST] = [];
      style_dec[VALUE_LIST] = [];
      style_dec[PRIORITY_LIST] = [];
      style_dec[STATUS_LIST] = [];
    }
    style_dec[DISABLED_LIST] = [];

    var len = disabled_style_dec[INDEX_LIST].length;
    for (var i = 0; i < len; i++)
    {
      var prop = index_map[disabled_style_dec[INDEX_LIST][i]];

      if (this.has_property(style_dec, prop))
      {
        this.remove_property(disabled_style_dec, prop);
      }
      else if (!(is_inherited && !(prop in window.css_inheritable_properties)))
      {
        var index = this.copy_property(disabled_style_dec, style_dec, prop);
        style_dec[DISABLED_LIST][index] = 1;
      }
    }

    return style_dec;
  };

  /**
   * Get a StyleDeclaration based on the rule ID.
   *
   * @param {Integer} id The rule id
   * @returns {Array|null} The StyleDeclaration if it was found, otherwise null
   */
  this.get_style_dec_by_id = function(id)
  {
    for (var i = 0, node_style; node_style = (this._categories_data[NODE_STYLE_LIST] || [])[i]; i++)
    {
      for (var j = 0, style_dec; style_dec = (node_style[STYLE_LIST] || [])[j]; j++)
      {
        if (style_dec[RULE_ID] == id)
          return style_dec;
      }
    }
    return null;
  };

  /**
   * Get an inline StyleDeclaration based on the object ID.
   *
   * @param {Integer} id The object id
   * @returns {Array|null} The StyleDeclaration if it was found, otherwise null
   */
  this.get_inline_style_dec_by_id = function(id)
  {
    for (var i = 0, node_style; node_style = (this._categories_data[NODE_STYLE_LIST] || [])[i]; i++)
    {
      for (var j = 0, style_dec; style_dec = (node_style[STYLE_LIST] || [])[j]; j++)
      {
        if ((style_dec[ORIGIN] == ORIGIN_ELEMENT || style_dec[ORIGIN] == ORIGIN_SVG) && node_style[OBJECT_ID] == id)
          return style_dec;
      }
    }
    return null;
  };

  /**
   * Returns an empty StyleDeclaration
   *
   * @returns {Array} An empty StyleDeclaration
   */
  this.get_new_style_dec = function()
  {
    return [3, [/*INDEX_LIST*/], [/*VALUE_LIST*/], [/*PRIORITY_LIST*/], [/*STATUS_LIST*/]];
  };

  /**
   * Copies a property from one StyleDeclaration to another
   *
   * @param {Array} source The source StyleDeclaration
   * @param {Array} target The target StyleDeclaration
   * @param {String} property The property to copy
   * @returns {Integer} The index where the property was inserted (the last index)
   */
  this.copy_property = function(source, target, property)
  {
    var index_list = source[INDEX_LIST];
    var len = index_list.length;
    for (var i = 0; i < len; i++)
    {
      if (window.css_index_map[index_list[i]] == property)
      {
         target[INDEX_LIST].push(source[INDEX_LIST][i]);
         target[VALUE_LIST].push(source[VALUE_LIST][i]);
         target[PRIORITY_LIST].push(source[PRIORITY_LIST][i]);
         target[STATUS_LIST].push(source[STATUS_LIST][i]);
         break;
      }
    }
    return target[INDEX_LIST].length-1;
  };

  /**
   * Removes a property from `style_dec`
   *
   * @param {Array} style_dec The StyleDeclaration to remove the property from
   * @param {String} property The property to remove
   * @returns {Array|null} A StyleDeclaration with the removed property if it was
   *                       removed, otherwise null
   */
  this.remove_property = function(style_dec, property)
  {
    var new_style_dec = this.get_new_style_dec();
    var index_list = style_dec[INDEX_LIST];
    var len = index_list.length;
    for (var i = 0; i < len; i++)
    {
      if (window.css_index_map[index_list[i]] == property)
      {
        this.copy_property(style_dec, new_style_dec, property);
        style_dec[INDEX_LIST].splice(i, 1);
        style_dec[VALUE_LIST].splice(i, 1);
        style_dec[PRIORITY_LIST].splice(i, 1);
        style_dec[STATUS_LIST].splice(i, 1);
        return new_style_dec;
      }
    }
    return null;
  };

  /**
   * Checks if a certain StyleDeclaration has a property
   *
   * @param {Array} style_dec The StyleDeclaration to check
   * @param {String} property The property to check for
   * @returns {Boolean} True if the StyleDeclaration has the property, false otherwise
   */
  this.has_property = function(style_dec, property)
  {
    return style_dec[INDEX_LIST].indexOf(window.css_index_map.indexOf(property)) != -1;
  };

  this.get_inline_obj_id = function(obj_id)
  {
    return "inline-obj-id-" + obj_id;
  };

  this.is_some_declaration_enabled = function(declaration)
  {
    var is_some_dec_enabled = false;

    for (var i = 0; i < declaration[INDEX_LIST].length && !is_some_dec_enabled; i++)
    {
      is_some_dec_enabled = !declaration[DISABLED_LIST] ||
                            !declaration[DISABLED_LIST][i];
    }

    return is_some_dec_enabled;
  };

  this.get_search_term = function()
  {
    return this._search_term;
  };

  this._on_reset_state = function()
  {
    this._selected_element = null;
    this._set_props = [];
    this._search_map = [];
    this._search_is_active = false;
    this._search_term = '';
  };

  this._search_delayed = function(value)
  {
    this._search_timeout.set(this._search.bind(this), SEARCH_DELAY, value);
  };

  this._search = function(search_term)
  {
    if (this._search_term != search_term &&
       (this._search_is_active || search_term.length >= MIN_SEARCH_TERM_LENGTH))
    {
      this._do_search(search_term);
      this._search_term = search_term;
      window.views['css-inspector'].update();
      window.views['css-comp-style'].update();
    }
  };

  this._do_search = function(search_term)
  {
    if (search_term.length >= MIN_SEARCH_TERM_LENGTH)
    {
      for (var i = 0, length = this._categories_data[CSS].length; i < length; i++)
      {
        this._search_node_cascade(this._categories_data[CSS][i], search_term);
      }
      this._search_is_active = true;
    }
    else
    {
      for (var i = 0, length = this._categories_data[CSS].length; i < length; i++)
      {
        this._clear_node_cascade(this._categories_data[CSS][i], this._search_map);
      }
      this._search_term  = "";
      this._search_is_active = false;
    }
  };

  this._search_node_cascade = function(node_cascade, search_term)
  {
    var declaration_list = node_cascade[STYLE_LIST];
    var node_cascade_has_matching_search_props = false;

    for (var i = 0, declaration; declaration = declaration_list[i]; i++)
    {
      if (declaration[PROP_LIST])
      {
        var length = declaration[PROP_LIST].length;
        var has_matching_search_props = false;

        declaration[SEARCH_LIST] = [];

        for (var j = 0; j < length; j++)
        {
          if (window.css_index_map[declaration[PROP_LIST][j]].indexOf(search_term) != -1 ||
              declaration[VALUE_LIST][j].indexOf(search_term) != -1)
          {
            declaration[SEARCH_LIST][j] = 1;
            has_matching_search_props = true;
            node_cascade_has_matching_search_props = true;
          }
        }
        declaration[HAS_MATCHING_SEARCH_PROPS] = has_matching_search_props;
      }
    }

    node_cascade[HAS_MATCHING_SEARCH_PROPS] = node_cascade_has_matching_search_props;
  };

  this._clear_node_cascade = function(node_cascade, search_list)
  {
    var declaration_list = node_cascade[1];

    delete node_cascade[0][HAS_MATCHING_SEARCH_PROPS];
    for (var i = 0, dec; dec = declaration_list[i]; i++)
    {
      delete dec[HAS_MATCHING_SEARCH_PROPS];
    }
    delete node_cascade[2][HAS_MATCHING_SEARCH_PROPS];
  };

  this.get_search_active = function()
  {
    return this._search_is_active;
  };

  this._on_element_selected = function(msg)
  {
    if (msg.rt_id && msg.obj_id)
    {
      this._selected_element = {
        rt_id: msg.rt_id,
        obj_id: msg.obj_id,
        req_type: (this._categories[COMP_STYLE].is_unfolded || this._categories[CSS].is_unfolded) && REQ_TYPE_CSS || 0
      };
      var get_data = false;
      for (var i = 0, view_id; (view_id = this._views[i]) && !(get_data = window.views[view_id].isvisible()); i++);
      if (get_data && this._selected_element.req_type)
      {
        this._pseudo_element_list = msg.pseudo_element ? [this._pseudo_item_map[msg.pseudo_element]] : [];
        this._get_data(msg.rt_id, msg.obj_id);
      }
      else
      {
        this._categories_data[IS_VALID] = false;
      }
    }
    else
    {
      this._on_reset_state();
      this._categories_data[IS_VALID] = false;
      window.views['css-inspector'].update();
    }
  };

  // TODO: self -> this
  this._get_data = function(rt_id, obj_id)
  {
    self._rt_id = rt_id;
    self._obj_id = obj_id;
    if (window.stylesheets.has_stylesheets_runtime(rt_id))
    {
      var tag = self._tag_manager.set_callback(null, self._handle_get_data.bind(self), [rt_id, obj_id]);
      var callback_params = [rt_id, obj_id, self._pseudo_item_list.concat(self._pseudo_element_list)];
      self._es_debugger.requestCssGetStyleDeclarations(tag, callback_params);
    }
    else
    {
      window.stylesheets.get_stylesheets(rt_id, arguments);
    }
  };

  this._handle_get_data = function(status, message, rt_id, obj_id)
  {
    if (status == 0)
    {
      this._categories_data[COMP_STYLE] = message[COMPUTED_STYLE_LIST];
      this._categories_data[CSS] = message[NODE_STYLE_LIST] || [];
      this._categories_data[CSS].rt_id = this._categories_data[COMP_STYLE].rt_id = rt_id;
      this._categories_data[IS_VALID] = true;

      var disabled_style_dec_list = this.disabled_style_dec_list;

      // this is to ensure that a set property is always displayed in computed style,
      // also if it maps the initial value and the setting "Hide Initial Values" is set to true.
      this._set_props = [];
      for (var i = 0, node_style_cascade; node_style_cascade = this._categories_data[CSS][i]; i++)
      {
        for (var j = 0, style_dec; style_dec = node_style_cascade[STYLE_LIST][j]; j++)
        {
          if (style_dec[ORIGIN] != ORIGIN_USER_AGENT)
          {
            if (disabled_style_dec_list)
            {
              var disabled_style_dec = (style_dec[ORIGIN] != ORIGIN_ELEMENT && style_dec[ORIGIN] != ORIGIN_SVG)
                                     ? disabled_style_dec_list[style_dec[RULE_ID]]
                                     : disabled_style_dec_list[this.get_inline_obj_id(node_style_cascade[0])];
              if (disabled_style_dec)
                style_dec = this.sync_declarations(style_dec, disabled_style_dec, i > 0);
            }

            var length = style_dec[INDEX_LIST] && style_dec[INDEX_LIST].length || 0;
            for (var k = 0; k < length; k++)
            {
              if (style_dec[STATUS_LIST][k])
                this._set_props[style_dec[INDEX_LIST][k]] = 1;
            }
          }
        }
      }

      if (this._search_term)
        this._do_search(this._search_term);

      for (var i = 0, view_id; view_id = this._views[i]; i++)
      {
        window.views[view_id].update();
      }
    }
  };

  window.messages.addListener('element-selected', this._on_element_selected.bind(this));
  window.messages.addListener('reset-state', this._on_reset_state.bind(this));

  window.eventHandlers.input['css-inspector-text-search'] = function(event, target)
  {
    this._search_delayed(target.value);
  }.bind(this);
};

cls.ElementStyle.DISABLED_LIST = 12
cls.ElementStyle.SEARCH_LIST = 13;

