window.cls || (window.cls = {});

// TODO: move, rename etc
var Rule = function(rule)
{
  this.declarations = [];
  this.origin = rule.origin;
  this.selector = rule.selector;
  this.specificity = rule.specificity;
  this.stylesheetID = rule.stylesheetID;
  this.ruleID = rule.ruleID;
  this.ruleType = rule.ruleType;
  this.lineNumber = rule.lineNumber;

  var len = rule.indexList ? rule.indexList.length : 0;
  for (var i = 0; i < len; i++)
  {
    this.declarations.push({
      property: window.css_index_map[rule.indexList[i]],
      value: rule.valueList[i],
      priority: rule.priorityList[i],
      is_applied: Boolean(rule.statusList[i]), // Could be inverted and renamed to overwritten
      is_disabled: rule.disableList ? Boolean(rule.disabledList[i]) : false
    });
  }
};

// TODO categories and everything related needs to be removed completely
/**
 * @constructor
 */
cls.ElementStyle = function()
{
  var self = this; // TODO: get rid of

  this._es_debugger = window.services['ecmascript-debugger'];
  this._tag_manager = cls.TagManager.get_instance();
  this._style_declarations = [];
  this._has_data = false;
  this._selected_element = null;
  this._search_term = "";
  this._set_props = [];
  this._current_rt_id = null; // TODO: always the same as this._rt_id?
  this._rt_id = null;
  this._obj_id = null;
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
  var REQ_TYPE_CSS = 2;
  var SEARCH_DELAY = 50;

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
    if (this._has_data)
    {
      if (index == COMP_STYLE)
        return window.helpers.copy_object(this._style_declarations.computedStyleList);
      else
        return window.helpers.copy_object(this._style_declarations.nodeStyleList);
    }

    if (this._selected_element)
      this._get_data(this._selected_element.rt_id, this._selected_element.obj_id);

    return null;
  };

  this.get_computed_style = function()
  {
    return this.get_category_data(COMP_STYLE);
  };

  this.get_rt_id = function()
  {
    return this._current_rt_id;
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
    var declarations = disabled_style_dec.declarations;
    for (var i = 0, decl; decl = declarations[i]; i++)
    {
      if (this.has_property(style_dec, decl.property))
      {
        this.remove_property(disabled_style_dec, decl.property);
      }
      else if (!(is_inherited && !(window.css_inheritable_properties.hasOwnProperty(decl.property))))
      {
        var index = this.copy_property(disabled_style_dec, style_dec, decl.property);
        style_dec.declarations[index].is_disabled = true;
      }
    }

    return style_dec;
  };

  /**
   * Get a Rule based on the rule ID.
   *
   * @param {Integer} id The rule id
   * @returns {Array|null} The Rule if it was found, otherwise null
   */
  this.get_rule_by_id = function(id)
  {
    for (var i = 0, node_style; node_style = this._style_declarations.nodeStyleList[i]; i++)
    {
      for (var j = 0, rule; rule = node_style.styleList[j]; j++)
      {
        if (rule.ruleID == id)
          return rule;
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
    for (var i = 0, node_style; node_style = this._style_declarations.nodeStyleList[i]; i++)
    {
      for (var j = 0, rule; rule = node_style.styleList[j]; j++)
      {
        if ((rule.origin == ORIGIN_ELEMENT || rule.origin == ORIGIN_SVG) && node_style.objectID == id)
          return rule;
      }
    }
    return null;
  };

  /**
   * Get a declaration based on a rule ID and the property
   *
   * @param {Integer} id The rule id
   * @param {String} property The name of the property
   * @returns {Object|null} The declaration if found, oterwise null
   */
  this.get_declaration = function(rule_id, property)
  {
    for (var i = 0, node_style; node_style = this._style_declarations.nodeStyleList[i]; i++)
    {
      for (var j = 0, rule; rule = node_style.styleList[j]; j++)
      {
        for (var k = 0, decl; decl = rule.declarations[k]; k++)
        {
          if (rule.ruleID == rule_id && decl.property == property)
            return decl;
        }
      }
    }
    return null;
  };

  /**
   * Returns an empty Rule
   *
   * @returns {Rule} An empty Rule
   */
  this.get_new_style_dec = function()
  {
    return new Rule({origin: 3});
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
    var new_style_dec = this.get_new_style_dec();
    var declarations = source.declarations;
    for (var i = 0, decl; decl = declarations[i]; i++)
    {
      if (decl.property == property)
      {
        target.declarations.push({
          property: decl.property,
          value: decl.value,
          priority: decl.priority,
          is_applied: decl.is_applied,
          is_disabled: decl.is_disabled
        });
        break;
      }
    }
    return target.declarations.length - 1;
  };

  /**
   * Removes a property from `rule`
   *
   * @param {Rule} rule The Rule to remove the property from
   * @param {String} property The property to remove
   * @returns {Rule|null} A Rule with the removed property if it was
   *          removed, otherwise null
   */
  this.remove_property = function(rule, property)
  {
    var new_rule = this.get_new_style_dec();
    var declarations = rule.declarations;
    for (var i = 0, decl; decl = declarations[i]; i++)
    {
      if (decl.property == property)
      {
        this.copy_property(rule, new_rule, property);
        rule.declarations.splice(i, 1);
        return new_rule;
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
    return style_dec.declarations.some(function(decl) {
      return decl.property == property;
    });
  };

  this.get_inline_obj_id = function(obj_id)
  {
    return "inline-obj-id-" + obj_id;
  };

  this.is_some_declaration_enabled = function(rule)
  {
    return rule.declarations.some(function(decl) {
      return !decl.is_disabled;
    });
  };

  this.get_search_term = function()
  {
    return this._search_term;
  };

  this._on_reset_state = function()
  {
    this._selected_element = null;
    this._set_props = [];
    this._search_term = '';
  };

  this._search_delayed = function(value)
  {
    window.setTimeout(this._search.bind(this), SEARCH_DELAY, value);
  };

  this._search = function(search_term)
  {
    if (this._search_term != search_term)
    {
      this._search_term = search_term;
      window.views['css-inspector'].update();
      window.views['css-comp-style'].update();
    }
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
        this._has_data = false;
      }
    }
    else
    {
      this._on_reset_state();
      this._has_data = false;
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
      this._style_declarations = new cls.EcmascriptDebugger["6.4"].CssStyleDeclarations(message);
      this._has_data = true;
      this._current_rt_id = rt_id;

      var disabled_style_dec_list = this.disabled_style_dec_list;

      // this is to ensure that a set property is always displayed in computed style,
      // also if it maps the initial value and the setting "Hide Initial Values" is set to true.
      this._set_props = [];
      for (var i = 0, node_style_list; node_style_list = this._style_declarations.nodeStyleList[i]; i++)
      {
        for (var j = 0, node_style; node_style = node_style_list.styleList[j]; j++)
        {
          var rule = new Rule(node_style);
          CssShorthandResolver.get_instance().resolve(rule.declarations);

          if (rule.origin != ORIGIN_USER_AGENT)
          {
            if (disabled_style_dec_list)
            {
              var disabled_style_dec = (rule.origin != ORIGIN_ELEMENT && rule.origin != ORIGIN_SVG)
                                     ? disabled_style_dec_list[rule.ruleID]
                                     : disabled_style_dec_list[this.get_inline_obj_id(node_style_list.objectID)];
              if (disabled_style_dec)
                rule = this.sync_declarations(rule, disabled_style_dec, i > 0);
            }

            rule.declarations.forEach(function(decl) {
              if (decl.is_applied)
                this._set_props.push(decl.property);
            }, this);
          }
          node_style_list.styleList[j] = rule;
        }
      }

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

