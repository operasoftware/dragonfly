window.cls || (window.cls = {});

/**
  * @constructor
  */

// TODO clean up pretty printing, does contain much too much code history

cls.Stylesheets = function()
{
  var self = this;
  this._tag_manager = window.tag_manager;
  // document.styleSheets dict with runtime-id as key
  this._sheets = {};
  // document.styleSheets[index].cssRules with runtime-id and index as keys
  this._rules = {};
  this._index_map = null;
  this._index_map_length = 0; // TODO: is this needed, check length of _index_map instead?
  this._sorted_index_map = [];
  this._initial_values = [];
  this._selected_rules = null;
  this._color_index = 0;
  this._new_runtime_ids = null;
  this._top_runtime_id = '';
  this._on_new_stylesheet_cbs = {};
  this._is_getting_index_map = false;

  this._color_properties = {
    'fill': true,
    'stroke': true,
    'stop-color': true,
    'flood-color': true,
    'lighting-color': true,
    'color': true,
    'border-top-color': true,
    'border-right-color': true,
    'border-bottom-color': true,
    'border-left-color': true,
    'background-color': true,
  };

  this._on_reset_state = function()
  {
    this._sheets = {};
    this._rules = {};
    this._index_map = null;
    this._index_map_length = 0;
    this._sorted_index_map = [];
    this._initial_values = [];
    this._selected_rules = null;
    this._color_index = 0;
    this._new_runtime_ids = null;
    this._top_runtime_id = '';
    this._on_new_stylesheet_cbs = {};
  };

  var SHEET_OBJECT_ID = 0; // TODO use the right obj-id
  var SHEET_IS_DISABLED = 1;
  var SHEET_HREF = 2;
  var SHEET_TITLE = 3;
  var SHEET_TYPE = 4;
  var SHEET_MEDIA_LIST = 5;
  var SHEET_OWNER_NODE_ID = 6;
  var SHEET_OWNER_RULE_ID = 7;
  var SHEET_PARENT_STYLESHEET_ID = 8;
  var UNKNOWN_RULE = 0;
  var STYLE_RULE = 1;
  var CHARSET_RULE = 2;
  var IMPORT_RULE = 3;
  var MEDIA_RULE = 4;
  var FONT_FACE_RULE = 5;
  var PAGE_RULE = 6;
  var COMMON = 11;
  var MARKUP_KEY = "<property><key>";
  var MARKUP_KEY_OW = "<property class='overwritten'><key>";
  var MARKUP_KEY_CLOSE = "</key>: ";
  var MARKUP_VALUE = "<value>";
  var MARKUP_VALUE_OW = "<value>";
  var MARKUP_VALUE_CLOSE = "</value>;</property>";
  var MARKUP_PROP_NL = "";
  var MARKUP_IMPORTANT = " !important";
  var MARKUP_SPACE = " ";
  var MARKUP_EMPTY = "";
  var HEADER = 0;
  var COMP_STYLE = 0;
  var CSS = 1;
  var PROP_LIST = 1;
  var VAL_LIST = 2;
  var PRIORITY_LIST = 3;
  var OVERWRITTEN_LIST = 4;
  var SEARCH_LIST = cls.ElementStyle.SEARCH_LIST;
  var HAS_MATCHING_SEARCH_PROPS = 11;
  var DISABLED_LIST = 12;

  // new names of the scope messages
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
  var LINE_NUMBER = 10;

  var ORIGIN_USER_AGENT = 1; // default
  var ORIGIN_LOCAL = 2; // user
  var ORIGIN_AUTHOR = 3; // author
  var ORIGIN_ELEMENT = 4; // inline
  var ORIGIN_SVG = 5; // SVG presentation attribute

  var RULE_HEADER = 0;
  var INDENT = '  ';

  var special_default_values = {};

  special_default_values["border-bottom-color"] =
  special_default_values["border-left-color"] =
  special_default_values["border-right-color"] =
  special_default_values["border-top-color"] = function(data, value)
  {
    return value == data[this._color_index];
  };

  this.pretty_print_rules = function(rules)
  {
    var TYPE = 0;
    var ret = "";
    if (rules.length)
    {
      for (var i = 0, rule; rule = rules[i]; i++)
      {
        ret += this._pretty_print_rule[rule[TYPE]](rule, true);
      }
      return "<stylesheet stylesheet-id='" + rules[0][0][0] + "' runtime-id='" + rules.runtime_id + "'>"
                + ret + "</stylesheet>";
    }
    return "<div class='info-box'><p>" +
                ui_strings.S_INFO_STYLESHEET_HAS_NO_RULES + "</p></div>";
  };

  this._pretty_print_rule = {};

  this._pretty_print_rule[COMMON] = function(rule, search_active, is_style_sheet)
  {
    var HEADER = 0;
    var INDEX_LIST = is_style_sheet && 3 || 1;
    var VALUE_LIST = is_style_sheet && 4 || 2;
    var PROPERTY_LIST = is_style_sheet && 5 || 3;

    var ret = '';
    var index_list = rule[INDEX_LIST] || []; // the built-in proxy returns empty repeated values as null
    var value_list = rule[VALUE_LIST];
    var priority_list = rule[PROPERTY_LIST];
    var overwrittenlist = rule[OVERWRITTEN_LIST];
    var search_list = rule[SEARCH_LIST];
    var s_h_index = [];
    var s_h_value = [];
    var s_h_priority = [];
    var s_h_prop = '';
    var s_h_count = 0;

    for (var i = 0, length = index_list.length; i < length; i++)
    {
      var index = index_list[i];
      if (search_active && !search_list[i])
      {
        continue;
      }

      if (overwrittenlist && overwrittenlist[i])
      {
        ret += (ret ? MARKUP_PROP_NL : MARKUP_EMPTY) +
                INDENT +
                MARKUP_KEY + this._index_map[index] + MARKUP_KEY_CLOSE +
                MARKUP_VALUE +
                helpers.escapeTextHtml(value_list[i]) + (priority_list[i] ? MARKUP_IMPORTANT : "") +
                MARKUP_VALUE_CLOSE;
      }
      else
      {
        ret += (ret ? MARKUP_PROP_NL : MARKUP_EMPTY) +
                INDENT +
                MARKUP_KEY_OW + this._index_map[index] + MARKUP_KEY_CLOSE +
                MARKUP_VALUE_OW +
                helpers.escapeTextHtml(value_list[i]) + ( priority_list[i] ? MARKUP_IMPORTANT : "") +
                MARKUP_VALUE_CLOSE;
      }
    }
    return ret;
  }.bind(this);

  this._pretty_print_rule[UNKNOWN_RULE] = function(rule, is_style_sheet)
  {
    return "";
  }.bind(this);

  this._pretty_print_rule[STYLE_RULE] = function(rule, is_style_sheet)
  {
    var RULE_ID = 2;
    var SELECTOR_LIST = 6;

    return "<rule rule-id='" + rule[RULE_ID] + "'>" +
      "<selector>" + helpers.escapeTextHtml(rule[SELECTOR_LIST].join(', ')) + "</selector> {\n" +
        this._pretty_print_rule[COMMON](rule, 0, is_style_sheet) +
      "\n}</rule>";
  }.bind(this);

  this._pretty_print_rule[CHARSET_RULE] = function(rule, is_style_sheet)
  {
    var RULE_ID = 2;
    var CHARSET = 13; // Actually the encoding

    return "<charset-rule rule-id='" + rule[RULE_ID] + "'>" +
               "<at>@charset</at> \"" + helpers.escapeTextHtml(rule[CHARSET]) + "\";" +
           "</charset-rule>";
  }.bind(this);

  /*  e.g.: @import url("bluish.css") projection, tv; */
  this._pretty_print_rule[IMPORT_RULE] = function(rule, is_style_sheet)
  {
    var RULE_ID = 2;
    var MEDIA_LIST = 8;
    var HREF = 10;
    var IMPORT_STYLESHEET_ID = 11;

    return "<import-rule rule-id='" + rule[RULE_ID] +
                  "' imported-sheet='" + rule[IMPORT_STYLESHEET_ID] + "'>" +
              "<at>@import</at> url(\"" + rule[HREF] + "\") " +
              rule[MEDIA_LIST].join(', ') + ";" +
           "</import-rule>";
  }.bind(this);

  this._pretty_print_rule[MEDIA_RULE] = function(rule, is_style_sheet)
  {
    var TYPE = 0;
    var RULE_ID = 2;
    var MEDIA_LIST = 8;
    var STYLESHEETRULE_RULE_LIST = 9;

    var ret = '', _rule = null, header = null;
    if (rule[STYLESHEETRULE_RULE_LIST]) {
      for (var i = 0; _rule = rule[STYLESHEETRULE_RULE_LIST][i]; i++)
      {
        ret += this._pretty_print_rule[_rule[TYPE]](_rule, is_style_sheet);
      }
    }
    return "<media-rule rule-id='" + rule[RULE_ID] + "'>" +
              "<at>@media</at> " + rule[MEDIA_LIST].join(', ') + " {" +
              (ret ? "<rules>" + ret + "</rules>" : " ") +
            "}</media-rule>";
  }.bind(this);

  this._pretty_print_rule[FONT_FACE_RULE] = function(rule, is_style_sheet)
  {
    var RULE_ID = 2;
    return "<font-face-rule rule-id='" + rule[RULE_ID] + "'>" +
              "<at>@font-face</at> {\n" +
              this._pretty_print_rule[COMMON](rule, 0, is_style_sheet) +
            "\n}</font-face-rule>";
  }.bind(this);

  this._pretty_print_rule[PAGE_RULE] = function(rule, is_style_sheet)
  {
    var RULE_ID = 2;
    var PSEUDO_CLASS = 12;

    var pseudo_class_map =
    {
      '1': ':first',
      '2': ':left',
      '4': ':right'
    };

    return "<page-rule rule-id='" + rule[RULE_ID] + "'>" +
              "<at>@page</at>" +
                (rule[PSEUDO_CLASS]
                ? "<selector> " + pseudo_class_map[rule[PSEUDO_CLASS]] + "</selector>"
                : "") + " {\n" +
              this._pretty_print_rule[COMMON](rule, 0, is_style_sheet) +
            "\n}</page-rule>";
  }.bind(this);

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
    if (!this._sheets[data.rt_id])
    {
      var tag = this._tag_manager.set_callback(null, this._handle_get_all_stylesheets.bind(this), [data.rt_id, org_args]);
      window.services['ecmascript-debugger'].requestCssGetAllStylesheets(tag, [data.rt_id]);
      return '';
    }

    if (!this._index_map && !this._is_getting_index_map)
    {
      this._is_getting_index_map = true;
      var tag = this._tag_manager.set_callback(null, this._handle_get_index_map.bind(this), [org_args]);
      window.services['ecmascript-debugger'].requestCssGetIndexMap(tag);
      return '';
    }

    return this._pretty_print_cat[cat_index](data, search_active);
  };

  this._pretty_print_cat = {};

  this._pretty_print_cat[COMP_STYLE] = function(data, search_active)
  {
    var ret = "";
    // set_props is used to force the display if a given property is set
    // also if it has the initial value
    var set_props = elementStyle.getSetProps();
    var hide_initial_value = !settings['css-comp-style'].get('show-initial-values');
    var search_term = elementStyle.getSearchTerm();

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
        (
          !hide_initial_value
          || set_props[index]
          || is_not_initial_value
        )
        && !(search_term && !(prop.indexOf(search_term) != -1 ||
                              value.indexOf(search_term) != -1));
      if (display)
      {
        ret += (ret ? MARKUP_PROP_NL : "") +
                "<property data-spec='css#" + prop + "'><key>" + prop + MARKUP_KEY_CLOSE +
                MARKUP_VALUE + helpers.escapeTextHtml(value) + MARKUP_VALUE_CLOSE;
      }
    }
    return ret;
  }.bind(this);

  this._pretty_print_cat[CSS] = function(data, search_active)
  {
    var ret = "";
    var rt_id = data.rt_id;

    for (var i = 0, node_casc; node_casc = data[i]; i++)
    {
      var element_name = node_casc[ELEMENT_NAME];
      var style_dec_list = node_casc[STYLE_LIST];

      if (search_active && !node_casc[HAS_MATCHING_SEARCH_PROPS])
      {
        continue;
      }

      var inherited_printed = false;
      for (var j = 0, style_dec; style_dec = style_dec_list[j]; j++)
      {
        if (i && !inherited_printed && style_dec[INDEX_LIST] && style_dec[INDEX_LIST].length)
        {
          inherited_printed = true;
          ret += "<h2>" +
                ui_strings.S_INHERITED_FROM +
                " <code class='element-name inspect-node-link'" +
                " handler='inspect-node-link'" +
                " rt-id='" + rt_id + "' obj-id='" + node_casc[OBJECT_ID] + "'>" +
                element_name +
              "</code></h2>";
        }
        ret += this._pretty_print_style_dec[style_dec[ORIGIN]](rt_id, node_casc[OBJECT_ID], element_name, style_dec, search_active);
      }
    }
    return ret;
  }.bind(this);

  this._pretty_print_rule_in_inspector = function(rule, search_active)
  {
    var HEADER = 0;
    var INDEX_LIST = 1;
    var VALUE_LIST = 2;
    var PROPERTY_LIST = 3;
    var VALUE = 0;
    var PRIORITY = 1;
    var STATUS = 2;

    var ret = '';
    var index_list = rule[INDEX_LIST] || []; // the built-in proxy returns empty repeated values as null
    var value_list = rule[VALUE_LIST];
    var priority_list = rule[PROPERTY_LIST];
    var overwritten_list = rule[OVERWRITTEN_LIST] || [];
    var search_list = rule[SEARCH_LIST] || [];
    var disabled_list = rule[DISABLED_LIST] || [];
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

    var length = index_list.length;
    for (var i = 0; i < length; i++)
    {
      prop_index = properties[i][1];
      index = index_list.indexOf(prop_index);

      if (search_active && !search_list[index])
      {
        continue;
      }

      ret += (ret ? MARKUP_PROP_NL : MARKUP_EMPTY) +
              INDENT +
              // TODO: rename "property" to "declaration"
              "<property class='" + (overwritten_list[index] ? "" : "overwritten") +
                                    (disabled_list[index] ? " disabled" : "") + "'" +
                                    "data-spec='css#" + this._index_map[prop_index] + "'>" +
                self.create_declaration(this._index_map[prop_index],
                                        value_list[index],
                                        priority_list[index],
                                        rule[RULE_ID],
                                        disabled_list[index],
                                        rule[ORIGIN]) +
              "</property>";
    }
    return ret;
  };

  this._pretty_print_style_dec = {};

  this._pretty_print_style_dec[ORIGIN_USER_AGENT] = function(rt_id, obj_id, element_name, style_dec, search_active)
  {
    if (!search_active || style_dec[HAS_MATCHING_SEARCH_PROPS])
    {
      return "<rule class='non-editable' obj-id='" + obj_id + "'>" +
              "<stylesheet-link class='pseudo'>default values</stylesheet-link>" +
        "<selector>" + element_name + "</selector>" +
        " {\n" +
            this._pretty_print_rule_in_inspector(style_dec, false, search_active) +
        "\n}</rule>";
    }
    return "";
  }.bind(this);

  this._pretty_print_style_dec[ORIGIN_LOCAL] = function(rt_id, obj_id, element_name, style_dec, search_active)
  {
    var has_properties = style_dec[INDEX_LIST] && style_dec[INDEX_LIST].length;

    if ((!search_active || style_dec[HAS_MATCHING_SEARCH_PROPS]) && has_properties)
    {
      return "<rule class='non-editable' obj-id='" + obj_id + "'>" +
              "<stylesheet-link class='pseudo'>local user stylesheet</stylesheet-link>" +
        "<selector>" + helpers.escapeTextHtml(style_dec[SELECTOR]) + "</selector>" +
        " {\n" +
            this._pretty_print_rule_in_inspector(style_dec, false, search_active) +
        "\n}</rule>";
    }
    return "";
  }.bind(this);

  this._pretty_print_style_dec[ORIGIN_AUTHOR] = function(rt_id, obj_id, element_name, style_dec, search_active)
  {
    var ret = '';
    var sheet = this.get_sheet_with_obj_id(rt_id, style_dec[STYLESHEET_ID]);
    var has_properties = style_dec[INDEX_LIST] && style_dec[INDEX_LIST].length;

    if ((!search_active || style_dec[HAS_MATCHING_SEARCH_PROPS]) && has_properties)
    {
      var line_number = style_dec[LINE_NUMBER];
      ret += "<rule data-menu='style-inspector-rule' rule-id='" + style_dec[RULE_ID] + "' obj-id='" + obj_id + "'>" +
        (sheet ?
         "<stylesheet-link rt-id='" + rt_id + "'"+
           " index='" + sheet.index + "' handler='open-resource-tab'" +
           " data-resource-url='" + helpers.escapeAttributeHtml(sheet.href) + "'" +
           " data-resource-line-number='" + (line_number || 0) + "'" +
         ">" +
           helpers.escapeTextHtml(helpers.basename(sheet.href)) + (line_number ? ":" + line_number : "") +
         "</stylesheet-link>" :
         "") +
        "<selector>" + helpers.escapeTextHtml(style_dec[SELECTOR]) + "</selector>" +
        " {\n" +
            this._pretty_print_rule_in_inspector(style_dec, false, search_active) +
        "\n}</rule>";
    }

    if (!sheet)
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
        'stylesheet is missing in stylesheets, _pretty_print_style_dec[ORIGIN_AUTHOR]');
    }

    return ret;
  }.bind(this);

  this._pretty_print_style_dec[ORIGIN_ELEMENT] = function(rt_id, obj_id, element_name, style_dec, search_active)
  {
    var has_properties = style_dec[INDEX_LIST] && style_dec[INDEX_LIST].length;

    if ((!search_active || style_dec[HAS_MATCHING_SEARCH_PROPS]) && has_properties)
    {
      return "<rule rule-id='element-style' rt-id='" + rt_id + "' obj-id='" + obj_id + "'>" +
        "<inline-style>element.style</inline-style>" +
        " {\n" +
            this._pretty_print_rule_in_inspector(style_dec, false, search_active) +
        "\n}</rule>";
    }
    return "";
  }.bind(this);

  this._pretty_print_style_dec[ORIGIN_SVG] = function(rt_id, obj_id, element_name, style_dec, search_active)
  {
    var has_properties = style_dec[INDEX_LIST] && style_dec[INDEX_LIST].length;

    if ((!search_active || style_dec[HAS_MATCHING_SEARCH_PROPS]) && has_properties)
    {
      return "<rule rule-id='element-svg' rt-id='" + rt_id + "' obj-id='" + obj_id + "'>" +
        "<span style='font-style: italic;'>presentation attributes</span>" +
        " {\n" +
            this._pretty_print_rule_in_inspector(style_dec, false, search_active) +
        "\n}</rule>";
    }
    return "";
  }.bind(this);

  this.create_declaration = function create_declaration(prop, value, is_important, rule_id, is_disabled, origin)
  {
    value = helpers.escapeTextHtml(value);
    return (!(origin == ORIGIN_USER_AGENT || origin == ORIGIN_LOCAL) ? "<input type='checkbox'" +
                 " title='" + (is_disabled ? "Enable" : "Disable") + "'" +
                 " class='enable-disable'" +
                 (!is_disabled ? " checked='checked'" : "") +
                 " handler='enable-disable'" +
                 " data-property='" + prop + "'" +
                 " data-rule-id='" + rule_id + "' />"
               : "") +
           "<key>" + prop + "</key>: " + // TODO: rename "key" to "property"
           "<value>" + value + (is_important ? MARKUP_IMPORTANT : "") +
              (this._color_properties.hasOwnProperty(prop) &&
               !(origin == ORIGIN_USER_AGENT || origin == ORIGIN_LOCAL)
              ? "<color-sample handler='show-color-picker' " +
                      "style='background-color:" + value +"'/>"
              : "") +
           "</value>;";

  };

  this.get_stylesheets = function(rt_id, org_args)
  {
    if (this._sheets[rt_id])
    {
      return this._sheets[rt_id];
    }

    if (org_args && runtime_onload_handler.check(rt_id, org_args))
    {
      if (!this._index_map && !this._is_getting_index_map)
      {
        this._is_getting_index_map = true;
        var tag = this._tag_manager.set_callback(null, this._handle_get_index_map.bind(this), []);
        window.services['ecmascript-debugger'].requestCssGetIndexMap(tag);
      }
      var tag = this._tag_manager.set_callback(null, this._handle_get_all_stylesheets.bind(this), [rt_id, org_args]);
      window.services['ecmascript-debugger'].requestCssGetAllStylesheets(tag, [rt_id]);
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
            name: ( sheet[SHEET_HREF] && /\/([^/]*$)/.exec(sheet[SHEET_HREF])[1]
              || sheet[SHEET_TITLE]
              || 'stylesheet ' + i)
          };
        }
      }
      return null;
    }
  };

  this.get_sheet_with_rt_id_and_index = function(rt_id, index)
  {
    return this._sheets[rt_id] && this._sheets[rt_id][index] || null;
  };

  this.invalidate_sheet = function(rt_id, index)
  {
    if (this._rules[rt_id] && this._rules[rt_id][index])
    {
      this._rules[rt_id][index] = null;
      if (this._selected_rules &&
          this._selected_rules.runtime_id == rt_id &&
          this._selected_rules.index == index)
      {
        this._selected_rules = null;
      }
    }
  };

  this.get_rules_with_sheet_index = function(rt_id, index, org_args)
  {
    if (rt_id)
    {
      if (this._rules[rt_id][index])
      {
        return this._rules[rt_id][index];
      }

      if (this._sheets[rt_id][index])
      {
        var tag = this._tag_manager.set_callback(null, this._handle_get_rules_with_index.bind(this), [rt_id, index, org_args]);
        var sheet_id = this._sheets[rt_id][index][SHEET_OBJECT_ID];
        window.services['ecmascript-debugger'].requestCssGetStylesheet(tag, [rt_id, sheet_id]);
        return null;
      }
    }
    return null;
  };

  this.set_selected_sheet = function(rt_id, index, rules, rule_id)
  {
    this._selected_rules = {
      runtime_id: rt_id,
      index: index,
      rules: rules,
      rule_id: rule_id || ''
    };
  };

  // TODO: probably not used anymore
  this.get_selected_sheet = function(org_args)
  {
    if (this._selected_rules)
    {
      return this._selected_rules;
    }

    if (org_args)
    {
      this._on_new_stylesheets(this._top_runtime_id, [null, this._select_first_sheet.bind(this), this._top_runtime_id, 0, org_args]);
    }
    return null;
  };

  this._select_first_sheet = function(rt_id, index, org_args)
  {
    var rules = stylesheets.getRulesWithSheetIndex(rt_id, index, arguments);
    if (rules)
    {
      this.set_selected_sheet(rt_id, index, rules);
      org_args.callee.apply(null, org_args);
    }
    window['cst-selects']['stylesheet-select'].updateElement();
  };

  this._handle_get_index_map = function(status, message, org_args)
  {
    var NAME_LIST = 0;
    var index_map = message[NAME_LIST];
    if (!index_map)
    {
      return;
    }
    window.css_index_map = this._index_map = index_map;
    window.inherited_props_index_list = [];
    var temp = [];
    for (var i = 0, prop; prop = this._index_map[i]; i++)
    {
      temp[i] = {index: i, key: prop};
      this._initial_values[i] = css_initial_values[prop];
      if (prop in css_inheritable_properties)
      {
        inherited_props_index_list[i] = true;
      }

      if (prop == 'color')
      {
        this._color_index = i;
      }
    }

    temp.sort(function(a, b) {
      return a.key < b.key ? -1 : a.key > b.key ? 1 : 0
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

  this._handle_get_rules_with_index = function(status, message, rt_id, index, org_args)
  {
    if (status == 0 && this._rules[rt_id])
    {
      this._rules[rt_id][index] = message[0] || [];
      this._rules[rt_id][index].runtime_id = rt_id;
      if (org_args && !org_args[0].__call_count)
      {
        org_args[0].__call_count = 1
        org_args.callee.apply(null, org_args);
      }
    }
  };

  this._handle_get_all_stylesheets = function(status, message, rt_id, org_args)
  {
    var STYLESHEET_LIST = 0;
    if (status == 0)
    {
      this._sheets[rt_id] = message[STYLESHEET_LIST] || [];
      this._sheets[rt_id].runtime_id = rt_id;
      this._rules[rt_id] = [];
      if (org_args && !org_args[0].__call_count)
      {
        org_args[0].__call_count = 1;
        org_args.callee.apply(null, org_args);
      }
    }
  };

  this._on_runtime_destroyed = function(msg)
  {
    if (this._selected_rules &&  this._selected_rules.runtime_id == msg.id)
    {
      window.views.stylesheets.clearAllContainers();
    }
  };

  this._on_new_stylesheets = function(rt_id, cb_arr/* obj, cb_method, arg 1, arg 2, ... */)
  {
    // cb_arr: [cb_obj, cb_method, arg 1, arg 2, ... ]
    if (this._on_new_stylesheet_cbs[rt_id])
    {
      this._on_new_stylesheet_cbs[rt_id][this._on_new_stylesheet_cbs[rt_id].length] = cb_arr;
    }
    else
    {
      cb_arr[1].apply(cb_arr[0], cb_arr.slice(2));
    }
  };

  this._update_on_new_stylesheets = function(rt_ids)
  {
    var rt_id_c_1 = '';
    var rt_id_c_2 = '';

    for (rt_id_c_1 in this._on_new_stylesheet_cbs)
    {
      for (var i = 0; (rt_id_c_2 = rt_ids[i]) && rt_id_c_1 != rt_id_c_2; i++);
      if (!rt_id_c_2)
      {
        delete this._on_new_stylesheet_cbs[rt_id_c_1];
      }
    }

    for (var i = 0; rt_id_c_1 = rt_ids[i]; i++)
    {
      if (!(rt_id_c_1 in this._on_new_stylesheet_cbs))
      {
        this._on_new_stylesheet_cbs[rt_id_c_1] = [];
      }
    }

    this._new_runtime_ids = rt_ids;

    if (rt_ids[0] != this._top_runtime_id)
    {
      this._top_runtime_id = rt_ids[0] || 0;
      this._selected_rules = null;
      window.views['stylesheets'].update();
    }
  };

  // TODO: using 'self' in here (because of callees called with 'null'?), change to 'this'
  this._check_new_runtimes = function(obj)
  {
    for (var i = 0, cursor; cursor = self._new_runtime_ids[i]; i++)
    {
      // TODO: the handling of stylesheets needs to be cleaned up.
      if (!self._sheets[cursor])
      {
        self.get_stylesheets(cursor, arguments);
      }
      else
      {
        var cbs = null;
        var cb = null;

        if (cbs = self._on_new_stylesheet_cbs[cursor])
        {
          for (i = 0; cb = cbs[i]; i++)
          {
            cb[1].apply(cb[0], cb.slice(2));
          }
          delete self._on_new_stylesheet_cbs[cursor];
        }
      }
    }
  };

  this._on_active_tab = function(msg)
  {
    if (this._selected_rules)
    {
      var rt_id = this._selected_rules.runtime_id;

      for (var i = 0, cur_rt_id; (cur_rt_id = msg.runtimes_with_dom[i]) && cur_rt_id != rt_id; i++);
      if (!cur_rt_id)
      {
        window.views.stylesheets.clearAllContainers();
      }
    }

    if (!msg.runtimes_with_dom.length)
    {
      this._sheets = {};
      // document.styleSheets[index].cssRules with runtime-id and index as keys
      this._rules = {};
      this._selected_rules = null;
      this._new_runtime_ids = null;
      this._top_runtime_id = '';
      this._on_new_stylesheet_cbs = {};
    }
    else
    {
      this._update_on_new_stylesheets(msg.runtimes_with_dom.slice(0));
      this._check_new_runtimes({});
    }
  };

  this.get_sorted_properties = function()
  {
    var ret = [];
    var dashes = [];

    for (var i = 0; i < this._index_map_length; i++)
    {
      var value = this._index_map[this._sorted_index_map[i]];
      if (value.indexOf('-') == 0)
      {
        dashes.push(value);
      }
      else
      {
        ret.push(value);
      }
    }
    return ret.concat(dashes);
  };

  window.messages.addListener('runtime-destroyed', this._on_runtime_destroyed.bind(this));
  window.messages.addListener('active-tab', this._on_active_tab.bind(this));
  window.messages.addListener('reset-state', this._on_reset_state.bind(this));
};

