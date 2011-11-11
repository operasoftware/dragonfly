window.cls || (window.cls = {});

/**
 * @constructor
 */
cls.Stylesheets = function()
{
  this._es_debugger = window.services['ecmascript-debugger'];
  this._tag_manager = cls.TagManager.get_instance();
  this._templates = new StylesheetTemplates();
  this._sheets = {}; // document.styleSheets dict with runtime-id as key
  this._index_map = null;
  this._sorted_index_map = [];
  this._initial_values = [];
  this._color_index = 0;
  this._is_getting_index_map = false;

  var SHEET_OBJECT_ID = 0; // TODO use the right obj-id
  var SHEET_HREF = 2;
  var SHEET_TITLE = 3;
  var HAS_MATCHING_SEARCH_PROPS = 11;

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
    this._sorted_index_map = [];
    this._initial_values = [];
    this._color_index = 0;
  };

  this.pretty_print_computed_style = function(data)
  {
    var template = [];
    // set_props is used to force the display if a given property is set
    // also if it has the initial value
    var set_props = window.elementStyle.get_set_props();
    var search_term = window.elementStyle.get_search_term();
    var hide_initial_value = !window.settings['css-comp-style'].get('show-initial-values');

    for (var i = 0; i < this._index_map.length; i++)
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
        (!hide_initial_value || set_props.indexOf(prop) != -1 || is_not_initial_value)
        && (prop.indexOf(search_term) != -1 ||
            value.indexOf(search_term) != -1);

      if (display)
        template.push(this._templates.declaration_computed_style(prop, value));
    }

    return template;
  };

  this.pretty_print_cascaded_style = function(data)
  {
    var template = [];
    var search_term = window.elementStyle.get_search_term();

    for (var i = 0, node_style; node_style = data[i]; i++)
    {
      var element_name = node_style.elementName;
      var style_dec_list = node_style.styleList;

      var inherited_printed = false;
      for (var j = 0, rule; rule = style_dec_list[j]; j++)
      {
        rule.declarations = rule.declarations.filter(function(declaration) {
          return declaration.property.indexOf(search_term) != -1 ||
                 declaration.value.indexOf(search_term) != -1;
        });

        if (!rule.declarations.length)
          continue;

        if (i > 0 && !inherited_printed)
        {
          inherited_printed = true;
          template.push(this._templates.inherited_header(element_name, node_style.objectID));
        }

        template.push(this._pretty_print_rule(rule.origin,
              node_style.objectID, element_name, rule));
      }
    }

    return template;
  };

  this._pretty_print_rule = function(origin, obj_id, element_name, rule)
  {
    var decl_list = this._pretty_print_declaration_list(rule);
    var rt_id = window.elementStyle.get_rt_id();
    switch (origin)
    {
    case ORIGIN_USER_AGENT:
      return this._templates.rule_origin_user_agent(decl_list, obj_id, element_name);

    case ORIGIN_LOCAL:
      return this._templates.rule_origin_local(decl_list, obj_id, rule.selector);

    case ORIGIN_AUTHOR:
      var sheet = this.get_sheet_with_obj_id(rt_id, rule.stylesheetID);
      if (!sheet)
      {
        opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
          'stylesheet is missing in stylesheets, _pretty_print_rule[ORIGIN_AUTHOR]');
      }
      return this._templates.rule_origin_author(decl_list, obj_id, rt_id, rule, sheet);

    case ORIGIN_ELEMENT:
      return this._templates.rule_origin_element(decl_list, obj_id, rt_id);

    case ORIGIN_SVG:
      return this._templates.rule_origin_svg(decl_list, obj_id, rt_id);
    }
  };

  this._pretty_print_declaration_list = function(rule)
  {
    rule.declarations.sort(function(a, b) {
      return a.property > b.property ? 1 : -1; // The same property can never appear
    });

    var is_editable = rule.origin != ORIGIN_USER_AGENT && rule.origin != ORIGIN_LOCAL;

    return rule.declarations.map(function(declaration) {
      return this._templates.declaration(declaration, is_editable);
    }, this);
  };

  this.create_declaration = function(prop, value, priority, is_disabled)
  {
    // TODO: call the template directly, need to fox in editor.js too
    return this._templates.prop_value(prop, value, priority, is_disabled, true);
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
    var temp = [];
    for (var i = 0, prop; prop = index_map[i]; i++)
    {
      temp[i] = {index: i, prop: prop};
      this._initial_values[i] = window.css_initial_values[prop];

      if (prop == 'color')
        this._color_index = i;
    }

    temp.sort(function(a, b) {
      return a.prop > b.prop ? 1 : -1;
    });

    for (i = 0; prop = temp[i]; i++)
    {
      this._sorted_index_map[i] = prop.index;
    }

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

    for (var i = 0; i < this._index_map.length; i++)
    {
      var value = this._index_map[this._sorted_index_map[i]];
      if (value[0] == "-")
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

