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

  this.rule_origin_local = function(decl_list, obj_id, selector)
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

  this.rule_origin_author = function(decl_list, obj_id, rt_id, rule, sheet)
  {
    return [
      "div",
        ["span",
           helpers.escapeTextHtml(helpers.basename(sheet.href)) +
           (rule.line_number ? ":" + rule.line_number : ""),
         "class", "rule-description internal-link",
         "rt-id", String(rt_id),
         "index", String(sheet.index),
         "handler", "open-resource-tab",
         "data-resource-url", helpers.escapeAttributeHtml(sheet.href),
         "data-resource-line-number", String(rule.line_number || 0)
        ],
        ["span",
           helpers.escapeTextHtml(rule.selector),
         "class", "css-selector"
        ],
        " {\n",
          decl_list,
        "\n}",
      "class", "css-rule",
      "data-menu", "style-inspector-rule",
      "rule-id", String(rule.rule_id),
      "obj-id", String(obj_id)
    ];
  };

  this.rule_origin_element = function(decl_list, obj_id, rt_id)
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

  this.rule_origin_svg = function(decl_list, obj_id, rt_id)
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

  this.declaration = function(declaration, is_editable)
  {
    return [
      "div",
        this.prop_value(declaration.property,
                        declaration.value,
                        declaration.priority,
                        declaration.is_disabled,
                        is_editable),
      "class", "css-declaration" +
               (declaration.is_applied ? "" : " overwritten") +
               (declaration.is_disabled ? " disabled" : ""),
      "data-spec", "css#" + declaration.property
    ];
  };

  // TODO: this can simply take a declaration as first argument
  this.prop_value = function(prop, value, priority, is_disabled, is_editable)
  {
    value = helpers.escapeTextHtml(value);
    return [
      (is_editable
       ? ["input",
          "type", "checkbox",
          "title", (is_disabled ? "Enable" : "Disable"), // TODO: ui strings
          "class", "enable-disable",
          "checked", !is_disabled,
          "handler", "enable-disable",
          "data-property", prop
         ]
       : []),
      ["span",
         prop,
       "class", "css-property"
      ],
      ": ",
      ["span",
         value + (priority ? " !important" : ""),
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

  this.inherited_header = function(element_name, obj_id)
  {
    return [
      "h2",
        ui_strings.S_INHERITED_FROM + " ",
        ["code",
           element_name,
         "obj-id", String(obj_id),
         "class", "element-name inspect-node-link",
         "handler", "inspect-node-link",
        ]
    ];
  };
};

