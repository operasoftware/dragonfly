"use strict";

/**
 * @constructor
 */
var StylesheetTemplates = function()
{
  var ORIGIN_USER_AGENT = cls.Stylesheets.ORIGIN_USER_AGENT;
  var ORIGIN_LOCAL = cls.Stylesheets.ORIGIN_LOCAL;

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

  this.rule_origin_user_agent = function(decl_list, obj_id, element_name)
  {
    return [
      "div",
        ["span",
           "user agent stylesheet", // TODO: ui string
         "class", "rule-description"
        ],
        ["span",
           element_name,
         "class", "css-selector"
        ],
        " {\n",
          decl_list,
        "\n}",
      "class", "css-rule non-editable",
      "obj-id", String(obj_id)
    ];
  };

  this.rule_origin_user_local = function(decl_list, obj_id, selector)
  {
    return [
      "div",
        ["span",
           "user stylesheet", // TODO: ui string
         "class", "rule-description"
        ],
        ["span",
           helpers.escapeTextHtml(selector),
         "class", "css-selector"
        ],
        " {\n",
          decl_list,
        "\n}",
      "class", "css-rule non-editable",
      "obj-id", String(obj_id)
    ];
  };

  this.rule_origin_user_author = function(decl_list, obj_id, rt_id, style_dec, sheet)
  {
    var LINE_NUMBER = 10;
    var SELECTOR = 5;
    var RULE_ID = 8;

    var line_number = style_dec[LINE_NUMBER];

    return [
      "div",
        ["span",
           helpers.escapeTextHtml(helpers.basename(sheet.href)) +
           (line_number ? ":" + line_number : ""),
         "class", "rule-description internal-link",
         "rt-id", String(rt_id),
         "index", String(sheet.index),
         "handler", "open-resource-tab",
         "data-resource-url", helpers.escapeAttributeHtml(sheet.href),
         "data-resource-line-number", String(line_number || 0)
        ],
        ["span",
           helpers.escapeTextHtml(style_dec[SELECTOR]),
         "class", "css-selector"
        ],
        " {\n",
          decl_list,
        "\n}",
      "class", "css-rule",
      "data-menu", "style-inspector-rule",
      "rule-id", String(style_dec[RULE_ID]),
      "obj-id", String(obj_id)
    ];
  };

  this.rule_origin_user_element = function(decl_list, obj_id, rt_id)
  {
    return [
      "div",
        ["span",
           "element.style"
        ],
        " {\n",
          decl_list,
        "\n}",
      "class", "css-rule",
      "rule-id", "element-style",
      "rt-id", String(rt_id),
      "obj-id", String(obj_id)
    ];
  };

  this.rule_origin_user_svg = function(decl_list, obj_id, rt_id)
  {
    return [
      "div",
        ["span",
           "presentation attributes", // TODO: ui string
         "style", "font-style: italic;" // TODO: use a class
        ],
        " {\n",
          decl_list,
        "\n}",
      "class", "css-rule",
      "data-menu", "style-inspector-rule",
      "rule-id", "element-svg",
      "rt-id", String(rt_id),
      "obj-id", String(obj_id)
    ];
  };

  this.declaration_computed_style = function(prop, value)
  {
    return [
      "div",
        ["span",
           prop,
         "class", "css-property"
        ],
        ": ",
        ["span",
           helpers.escapeTextHtml(value),
         "class", "css-property-value"
        ],
        ";",
      "class", "css-declaration",
      "data-spec", "css#" + prop
    ];
  };

  this.declaration = function(prop, rule, index)
  {
    var ORIGIN = 0;
    var RULE_ID = 8;
    var VALUE_LIST = 2;
    var PROPERTY_LIST = 3;
    var OVERWRITTEN_LIST = 4;
    var DISABLED_LIST = 12;

    var value_list = rule[VALUE_LIST];
    var priority_list = rule[PROPERTY_LIST];
    var overwritten_list = rule[OVERWRITTEN_LIST] || [];
    var disabled_list = rule[DISABLED_LIST] || [];

    return [
      "div",
        this.prop_value(prop,
                        value_list[index],
                        priority_list[index],
                        rule[RULE_ID],
                        disabled_list[index],
                        rule[ORIGIN]),
      "class", "css-declaration" +
               (overwritten_list[index] ? "" : " overwritten") +
               (disabled_list[index] ? " disabled" : ""),
      "data-spec", "css#" + prop
    ];
  };

  this.prop_value = function(prop, value, is_important, rule_id, is_disabled, origin)
  {
    value = helpers.escapeTextHtml(value);
    var is_editable = origin != ORIGIN_USER_AGENT && origin != ORIGIN_LOCAL;
    return [
      (is_editable
       ? ["input",
          "type", "checkbox",
          "title", (is_disabled ? "Enable" : "Disable"), // TODO: ui strings
          "class", "enable-disable",
          "checked", !is_disabled,
          "handler", "enable-disable",
          "data-property", prop,
          "data-rule-id", String(rule_id)
         ]
       : []),
      ["span",
         prop,
       "class", "css-property"
      ],
      ": ",
      ["span",
         value + (is_important ? " !important" : ""),
         (this._color_properties.hasOwnProperty(prop) && is_editable
          ? ["color-sample",
             "handler", "show-color-picker",
             "style", "background-color:" + value
            ]
          : []),
       "class", "css-property-value"
      ],
      ";"
    ];
  };

  this.inherited_header = function(element_name, rt_id, obj_id)
  {
    return [
      "h2",
        ui_strings.S_INHERITED_FROM + " ",
        ["code",
           element_name,
         "rt-id", String(rt_id),
         "obj-id", String(obj_id),
         "class", "element-name inspect-node-link",
         "handler", "inspect-node-link",
        ]
    ];
  };
};

