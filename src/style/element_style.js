"use strict";

window.cls || (window.cls = {});

// TODO: the shorthand resolver is relying on some methods in this class (hence
// they're relying on each other). Those methods should be moved to Stylesheets instead.
/**
 * @constructor
 */
cls.ElementStyle = function()
{
  this._es_debugger = window.services['ecmascript-debugger'];
  this._tag_manager = cls.TagManager.get_instance();
  this._css_shorthand_resolver = CssShorthandResolver.get_instance();
  this._style_declarations = [];
  this._rt_id = null;
  this._obj_id = null;
  this._has_data = false;
  this._selected_element = null;
  this._search_term = "";
  this._set_props = [];
  this._css_index_map = null;
  this._views = ['css-comp-style', 'css-inspector'];

  this.disabled_style_dec_list = {};

  var ORIGIN_USER_AGENT = cls.Stylesheets.origins.ORIGIN_USER_AGENT;
  var ORIGIN_LOCAL = cls.Stylesheets.origins.ORIGIN_LOCAL;
  var ORIGIN_AUTHOR = cls.Stylesheets.origins.ORIGIN_AUTHOR;
  var ORIGIN_ELEMENT = cls.Stylesheets.origins.ORIGIN_ELEMENT;
  var ORIGIN_SVG = cls.Stylesheets.origins.ORIGIN_SVG;

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
  this._pseudo_element = null;
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

  this.get_style = function()
  {
    if (this._has_data)
    {
      return {
        rt_id: this._style_declarations.rt_id,
        style_list: window.helpers.copy_object(this._style_declarations.nodeStyleList)
      };
    }

    if (this._selected_element)
      this._get_data(this._selected_element.rt_id, this._selected_element.obj_id);

    return null;
  };

  this.get_computed_style = function()
  {
    if (this._has_data)
    {
      return {
        rt_id: this._style_declarations.rt_id,
        style_list: window.helpers.copy_object(this._style_declarations.computedStyleList)
      };
    }

    if (this._selected_element)
      this._get_data(this._selected_element.rt_id, this._selected_element.obj_id);

    return null;
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
      if (this.get_property_index(style_dec.declarations, decl.property) != -1)
      {
        this.remove_property(disabled_style_dec.declarations, decl.property);
      }
      else if (!(is_inherited && !(cls.Stylesheets.inheritable_properties.hasOwnProperty(decl.property))))
      {
        var index = this.copy_property(disabled_style_dec.declarations, style_dec.declarations, decl.property);
        style_dec.declarations[index].is_disabled = true;
      }
    }

    return style_dec;
  };

  /**
   * Get a CssRule based on the rule ID.
   *
   * @param {Integer} id The rule id
   * @returns {CssRule|null} The CssRule if it was found, otherwise null
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
   * Get a declaration based on the rule and the property
   *
   * @param {CssRule} rule The rule
   * @param {String} property The name of the property
   * @returns {Object|null} The declaration if found, oterwise null
   */
  this.get_declaration = function(rule, property)
  {
    for (var i = 0, decl; decl = rule.declarations[i]; i++)
    {
      if (decl.property == property)
        return decl;
    }
    return null;
  };

  /**
   * Get the index of a property in a declarations
   *
   * @param {Array} declarations An array of CssDeclaration
   * @param {String} property The property to get the index for
   * @returns {int} The index if found, otherwise -1
   */
  this.get_property_index = function(declarations, property)
  {
    for (var i = 0, decl; decl = declarations[i]; i++)
    {
      if (decl.property == property)
        return i;
    }
    return -1;
  };

  /**
   * Returns an empty CssRule
   *
   * @returns {CssRule} An empty CssRule
   */
  this.get_new_style_dec = function()
  {
    return new CssRule({origin: ORIGIN_AUTHOR});
  };

  /**
   * Copies a property from one CssDeclaration to another
   *
   * @param {Array} source The source array of CssDeclarations
   * @param {Array} target The target array of CssDeclarations
   * @param {String} property The property to copy
   * @returns {Integer} The index where the property was inserted (the last index)
   */
  this.copy_property = function(source, target, property)
  {
    var new_style_dec = this.get_new_style_dec();
    for (var i = 0, decl; decl = source[i]; i++)
    {
      if (decl.property == property)
      {
        var new_decl = new CssDeclaration(
          decl.property,
          decl.value,
          decl.priority,
          decl.is_applied,
          decl.is_disabled
        );
        new_decl.shorthand_tokens = decl.shorthand_tokens;
        target.push(new_decl);
        break;
      }
    }
    return target.length - 1;
  };

  /**
   * Removes a property from `declarations`
   *
   * @param {Array} declarations An array of CssDeclarations
   * @param {String} property The property to remove
   * @returns {CssRule|null} A CssRule with the removed property if it was
   *          removed, otherwise null
   */
  this.remove_property = function(declarations, property)
  {
    var new_rule = this.get_new_style_dec();
    for (var i = 0, decl; decl = declarations[i]; i++)
    {
      if (decl.property == property)
      {
        this.copy_property(declarations, new_rule.declarations, property);
        declarations.splice(i, 1);
        return new_rule;
      }
    }
    return null;
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
    this._has_data = false;
  };

  this._on_profile_disabled = function(msg)
  {
    if (msg.profile == window.app.profiles.DEFAULT)
      this._on_reset_state();
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
        obj_id: msg.obj_id
      };

      var get_data = this._views.some(function(view_id) {
        return window.views[view_id].isvisible();
      });

      if (get_data)
      {
        this._pseudo_element = msg.pseudo_element || null;
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

  this._get_data = function(rt_id, obj_id)
  {
    this._rt_id = rt_id;
    this._obj_id = obj_id;
    var pseudo_element = this._pseudo_element && this._pseudo_item_map[this._pseudo_element];
    if (window.stylesheets.has_stylesheets_runtime(rt_id))
    {
      var tag = this._tag_manager.set_callback(this, this._handle_get_data, [rt_id, obj_id]);
      var callback_params = [rt_id, obj_id, this._pseudo_item_list.concat(pseudo_element || [])];
      if (pseudo_element && this._has_pseudo_element_version)
        callback_params.push(pseudo_element);
      this._es_debugger.requestCssGetStyleDeclarations(tag, callback_params);
    }
    else
    {
      window.stylesheets.get_stylesheets(rt_id, this._get_data.bind(this, rt_id, obj_id));
    }
  };

  this._handle_get_data = function(status, message, rt_id, obj_id, index_map)
  {
    if (status !== 0)
      return;

    if (!this._css_index_map)
    {
      if (!index_map)
      {
        window.stylesheets.get_css_index_map(this._handle_get_data.bind(this, status, message, rt_id, obj_id));
        return;
      }
      else
      {
        this._css_index_map = index_map;
      }
    }

    this._style_declarations = new cls.CssStyleDeclarations(message);
    this._style_declarations.rt_id = rt_id;
    this._has_data = true;

    var disabled_style_dec_list = this.disabled_style_dec_list;

    // this is to ensure that a set property is always displayed in computed style,
    // also if it maps the initial value and the setting "Hide Initial Values" is set to true.
    this._set_props = [];
    for (var i = 0, node_style_list; node_style_list = this._style_declarations.nodeStyleList[i]; i++)
    {
      for (var j = 0, node_style; node_style = node_style_list.styleList[j]; j++)
      {
        var rule = new CssRule(node_style, this._css_index_map);

        if (!window.settings["css-inspector"].get("show-longhand-properties"))
          this._css_shorthand_resolver.resolve(rule.declarations);

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
            if (decl.is_applied && !decl.is_disabled)
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
  };

  this._init = function()
  {
    this._has_pseudo_element_version = this._es_debugger.satisfies_version(6, 9);
    if (window.messages)
    {
      window.messages.addListener('element-selected', this._on_element_selected.bind(this));
      window.messages.addListener('reset-state', this._on_reset_state.bind(this));
      window.messages.addListener('profile-disabled', this._on_profile_disabled.bind(this));
    }

    if (window.eventHandlers)
    {
      window.eventHandlers.input['css-inspector-text-search'] = function(event, target)
      {
        this._search(target.value);
      }.bind(this);
    }
  };

  this._init();
};

