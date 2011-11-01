window.cls || (window.cls = {});

// TODO clean up pretty printing, does contain much too much code history

/**
 * @constructor
 */
cls.Stylesheets = function()
{
  var self = this; // TODO: get rid of

  this._es_debugger = window.services['ecmascript-debugger'];
  this._tag_manager = cls.TagManager.get_instance();
  this._templates = new StylesheetTemplates();
  this._sheets = {}; // document.styleSheets dict with runtime-id as key
  this._index_map = null;
  this._index_map_length = 0; // TODO: is this needed, check length of _index_map instead?
  this._sorted_index_map = [];
  this._initial_values = [];
  this._selected_rules = null;
  this._color_index = 0;
  this._is_getting_index_map = false;

  var SHEET_OBJECT_ID = 0; // TODO use the right obj-id
  var SHEET_IS_DISABLED = 1;
  var SHEET_HREF = 2;
  var SHEET_TITLE = 3;
  var COMP_STYLE = 0;
  var CSS = 1;
  var HAS_MATCHING_SEARCH_PROPS = 11;

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
  var LINE_NUMBER = 10;

  var ORIGIN_USER_AGENT = cls.Stylesheets.ORIGIN_USER_AGENT;
  var ORIGIN_LOCAL = cls.Stylesheets.ORIGIN_LOCAL;
  var ORIGIN_AUTHOR = cls.Stylesheets.ORIGIN_AUTHOR;
  var ORIGIN_ELEMENT = cls.Stylesheets.ORIGIN_ELEMENT;
  var ORIGIN_SVG = cls.Stylesheets.ORIGIN_SVG;

  var special_default_values = {};

  special_default_values["border-bottom-color"] =
  special_default_values["border-left-color"] =
  special_default_values["border-right-color"] =
  special_default_values["border-top-color"] = function(data, value)
  {
    return value == data[this._color_index];
  };

  this._on_reset_state = function()
  {
    this._sheets = {};
    this._index_map = null;
    this._index_map_length = 0;
    this._sorted_index_map = [];
    this._initial_values = [];
    this._selected_rules = null;
    this._color_index = 0;
  };

  this.pretty_print_computed_style = function(data, org_args, search_active)
  {
    return this.pretty_print_cat(COMP_STYLE, data, org_args, search_active);
  };

  this.pretty_print_cascaded_style = function(data, org_args, search_active)
  {
    return this.pretty_print_cat(CSS, data, org_args, search_active);
  };

  // TODO: should be private, fix naming clash
  this.pretty_print_cat = function(cat_index, data, org_args, search_active)
  {
    //if (!this._sheets[data.rt_id])
    //{
    //  var tag = this._tag_manager.set_callback(null, this._handle_get_all_stylesheets.bind(this), [data.rt_id, org_args]);
    //  window.services['ecmascript-debugger'].requestCssGetAllStylesheets(tag, [data.rt_id]);
    //  return '';
    //}

    //if (!this._index_map && !this._is_getting_index_map)
    //{
    //  this._is_getting_index_map = true;
    //  var tag = this._tag_manager.set_callback(null, this._handle_get_index_map.bind(this), [org_args]);
    //  window.services['ecmascript-debugger'].requestCssGetIndexMap(tag);
    //  return '';
    //}

    return this._pretty_print_cat[cat_index](data, search_active);
  };

  this._pretty_print_cat = {};

  this._pretty_print_cat[COMP_STYLE] = function(data, search_active)
  {
    var template = [];
    // set_props is used to force the display if a given property is set
    // also if it has the initial value
    var set_props = elementStyle.get_set_props();
    var hide_initial_value = !settings['css-comp-style'].get('show-initial-values');
    var search_term = elementStyle.get_search_term();

    for (var i = 0; i < this._index_map_length; i++)
    {
      var index = this._sorted_index_map[i];
      var prop = this._index_map[index];
      var value = data[index];
      var is_not_initial_value =
        hide_initial_value
        && value
        && value != this._initial_values[index]
        && !(prop in special_default_values && special_default_values[prop](data, value))
        || false;
      var display =
        (!hide_initial_value || set_props[index] || is_not_initial_value)
        && !(search_term && !(prop.indexOf(search_term) != -1
        || value.indexOf(search_term) != -1));
      if (display)
      {
        template.push(this._templates.declaration_computed_style(prop, value));
      }
    }

    return template;
  }.bind(this);

  this._pretty_print_cat[CSS] = function(data, search_active)
  {
    var template = [];
    var rt_id = data.rt_id;

    for (var i = 0, node_casc; node_casc = data[i]; i++)
    {
      var element_name = node_casc[ELEMENT_NAME];
      var style_dec_list = node_casc[STYLE_LIST];

      if (search_active && !node_casc[HAS_MATCHING_SEARCH_PROPS])
        continue;

      var inherited_printed = false;
      for (var j = 0, style_dec; style_dec = style_dec_list[j]; j++)
      {
        if (i > 0 && !inherited_printed && style_dec[INDEX_LIST] && style_dec[INDEX_LIST].length)
        {
          inherited_printed = true;
          template.push(this._templates.inherited_header(element_name, rt_id, node_casc[OBJECT_ID]));
        }
        template.push(this._pretty_print_rule[style_dec[ORIGIN]](rt_id, node_casc[OBJECT_ID], element_name, style_dec, search_active));
      }
    }

    return template;
  }.bind(this);

  this._pretty_print_declaration_list = function(rule, search_active)
  {
    var HEADER = 0;
    var INDEX_LIST = 1;
    var SEARCH_LIST = cls.ElementStyle.SEARCH_LIST;
    var VALUE = 0;
    var PRIORITY = 1;
    var STATUS = 2;

    var template = [];
    var index_list = rule[INDEX_LIST] || [];
    var search_list = rule[SEARCH_LIST] || [];
    var prop_index = 0;
    var index = 0;

    // Create an array of [prop, prop_index] for sorting
    var properties = index_list.map(function(index) {
      return [this._index_map[index], index];
    }, this);

    // Sort in alphabetical order
    properties.sort(function(a, b) {
      return a[0] > b[0] ? 1 : -1; // The same property can never happen
    });

    for (var i = 0, len = index_list.length; i < len; i++)
    {
      prop_index = properties[i][1];
      index = index_list.indexOf(prop_index);

      if (search_active && !search_list[index])
        continue;

      template.push(this._templates.declaration(this._index_map[prop_index], rule, index));
    }

    return template;
  };

  this._pretty_print_rule = {};

  this._pretty_print_rule[ORIGIN_USER_AGENT] = function(rt_id, obj_id, element_name, style_dec, search_active)
  {
    if (!search_active || style_dec[HAS_MATCHING_SEARCH_PROPS])
    {
      return this._templates.rule_origin_user_agent(
        this._pretty_print_declaration_list(style_dec, search_active),
        obj_id,
        element_name
      );
    }

    return [];
  }.bind(this);

  this._pretty_print_rule[ORIGIN_LOCAL] = function(rt_id, obj_id, element_name, style_dec, search_active)
  {
    var has_properties = style_dec[INDEX_LIST] && style_dec[INDEX_LIST].length;

    if ((!search_active || style_dec[HAS_MATCHING_SEARCH_PROPS]) && has_properties)
    {
      return this._templates.rule_origin_user_local(
        this._pretty_print_declaration_list(style_dec, search_active),
        obj_id,
        style_dec[SELECTOR]
      );
    }

    return [];
  }.bind(this);

  this._pretty_print_rule[ORIGIN_AUTHOR] = function(rt_id, obj_id, element_name, style_dec, search_active)
  {
    var sheet = this.get_sheet_with_obj_id(rt_id, style_dec[STYLESHEET_ID]);
    var has_properties = style_dec[INDEX_LIST] && style_dec[INDEX_LIST].length;

    if (!sheet)
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
        'stylesheet is missing in stylesheets, _pretty_print_rule[ORIGIN_AUTHOR]');
    }

    if ((!search_active || style_dec[HAS_MATCHING_SEARCH_PROPS]) && has_properties)
    {
      return this._templates.rule_origin_user_author(
        this._pretty_print_declaration_list(style_dec, search_active),
        obj_id,
        rt_id,
        style_dec,
        sheet
      );
    }

    return [];
  }.bind(this);

  this._pretty_print_rule[ORIGIN_ELEMENT] = function(rt_id, obj_id, element_name, style_dec, search_active)
  {
    var has_properties = style_dec[INDEX_LIST] && style_dec[INDEX_LIST].length;

    if ((!search_active || style_dec[HAS_MATCHING_SEARCH_PROPS]) && has_properties)
    {
      return this._templates.rule_origin_user_element(
        this._pretty_print_declaration_list(style_dec, search_active),
        obj_id,
        rt_id
      );
    }

    return [];
  }.bind(this);

  this._pretty_print_rule[ORIGIN_SVG] = function(rt_id, obj_id, element_name, style_dec, search_active)
  {
    var has_properties = style_dec[INDEX_LIST] && style_dec[INDEX_LIST].length;

    if ((!search_active || style_dec[HAS_MATCHING_SEARCH_PROPS]) && has_properties)
    {
      return this._templates.rule_origin_user_svg(
        this._pretty_print_declaration_list(style_dec, search_active),
        obj_id,
        rt_id
      );
    }

    return [];
  }.bind(this);

  this.create_declaration = function(prop, value, is_important, rule_id, is_disabled, origin)
  {
    // TODO: call the template directly, need to fox in editor.js too
    return this._templates.prop_value(prop, value, is_important, rule_id, is_disabled, origin);
  };

  this.get_stylesheets = function(rt_id, org_args)
  {
    if (this._sheets[rt_id])
      return this._sheets[rt_id];

    if (org_args && runtime_onload_handler.check(rt_id, org_args))
    {
      if (!this._index_map && !this._is_getting_index_map)
      {
        this._is_getting_index_map = true;
        var tag = this._tag_manager.set_callback(null, this._handle_get_index_map.bind(this), []);
        this._es_debugger.requestCssGetIndexMap(tag);
      }
      var tag = this._tag_manager.set_callback(null, this._handle_get_all_stylesheets.bind(this), [rt_id, org_args]);
      this._es_debugger.requestCssGetAllStylesheets(tag, [rt_id]);
      return null;
    }
  };

  this.has_stylesheets_runtime = function(rt_id)
  {
    return this._sheets[rt_id] && true || false; // TODO: just use Boolean(this._sheets[rt_id])?
  };

  this.get_sheet_with_obj_id = function(rt_id, obj_id)
  {
    if (this._sheets[rt_id])
    {
      for (var i = 0, sheet; sheet = this._sheets[rt_id][i]; i++)
      {
        if (sheet[SHEET_OBJECT_ID] == obj_id)
        {
          return {
            index: i,
            href: sheet[SHEET_HREF] || window.runtimes.getURI(rt_id),
            name: (sheet[SHEET_HREF] && /\/([^/]*$)/.exec(sheet[SHEET_HREF])[1]
                   || sheet[SHEET_TITLE]
                   || 'stylesheet ' + i)
          };
        }
      }
      return null;
    }
  };

  this._handle_get_index_map = function(status, message, org_args)
  {
    var NAME_LIST = 0;
    var index_map = message[NAME_LIST];
    if (!index_map)
      return;

    window.css_index_map = this._index_map = index_map;
    window.inherited_props_index_list = [];
    var temp = [];
    for (var i = 0, prop; prop = this._index_map[i]; i++)
    {
      temp[i] = {index: i, key: prop};
      this._initial_values[i] = css_initial_values[prop];
      if (prop in css_inheritable_properties)
        inherited_props_index_list[i] = true;

      if (prop == 'color')
        this._color_index = i;
    }

    temp.sort(function(a, b) {
      return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    });

    for (i = 0; prop = temp[i]; i++)
    {
      this._sorted_index_map[i] = prop.index;
    }

    this._index_map_length = this._index_map.length;

    if (org_args && (!org_args[0].__call_count || org_args[0].__call_count == 1))
    {
      org_args[0].__call_count = org_args[0].__call_count ? org_args[0].__call_count + 1 : 1;
      org_args.callee.apply(null, org_args)
    }
  };

  this._handle_get_all_stylesheets = function(status, message, rt_id, org_args)
  {
    var STYLESHEET_LIST = 0;
    if (status == 0)
    {
      this._sheets[rt_id] = message[STYLESHEET_LIST] || [];
      this._sheets[rt_id].runtime_id = rt_id;
      if (org_args && !org_args[0].__call_count)
      {
        org_args[0].__call_count = 1;
        org_args.callee.apply(null, org_args);
      }
    }
  };

  this.get_sorted_properties = function()
  {
    var props = [];
    var dashes = [];

    for (var i = 0; i < this._index_map_length; i++)
    {
      var value = this._index_map[this._sorted_index_map[i]];
      if (value.indexOf('-') == 0)
        dashes.push(value);
      else
        props.push(value);
    }
    return props.concat(dashes);
  };

  window.messages.addListener('reset-state', this._on_reset_state.bind(this));
};

cls.Stylesheets.ORIGIN_USER_AGENT = 1; // default
cls.Stylesheets.ORIGIN_LOCAL = 2; // user
cls.Stylesheets.ORIGIN_AUTHOR = 3; // author
cls.Stylesheets.ORIGIN_ELEMENT = 4; // inline
cls.Stylesheets.ORIGIN_SVG = 5; // SVG presentation attribute

