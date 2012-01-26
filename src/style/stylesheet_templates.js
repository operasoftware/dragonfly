"use strict";

/**
 * @constructor
 */
var StylesheetTemplates = function()
{
  var ORIGIN_USER_AGENT = cls.Stylesheets.origins.ORIGIN_USER_AGENT;
  var ORIGIN_LOCAL = cls.Stylesheets.origins.ORIGIN_LOCAL;

  // TODO: this should be defined somewhere external
  this._color_properties = {
    "fill": true,
    "stroke": true,
    "stop-color": true,
    "flood-color": true,
    "lighting-color": true,
    "color": true,
    "border-top-color": true,
    "border-right-color": true,
    "border-bottom-color": true,
    "border-left-color": true,
    "background-color": true
  };

  this.rule_origin_user_agent = function(decl_list, obj_id, element_name)
  {
    return [
      "div",
        ["span",
           ui_strings.S_STYLE_ORIGIN_USER_AGENT,
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
           ui_strings.S_STYLE_ORIGIN_LOCAL,
         "class", "rule-description"
        ],
        ["span",
           selector,
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
        (sheet
         ? ["span",
              window.helpers.basename(sheet.href) +
              (rule.lineNumber ? ":" + rule.lineNumber : ""),
            "class", "rule-description internal-link",
            "rt-id", String(rt_id),
            "index", String(sheet.index),
            "handler", "open-resource-tab",
            "data-resource-url", sheet.href,
            "data-resource-line-number", String(rule.lineNumber || 0)
           ]
         : []), // TODO: always assume that this is added via Dragonfly? If so, show some text here
        ["span",
           rule.selector,
         "class", "css-selector"
        ],
        " {\n",
          decl_list,
        "\n}",
      "class", "css-rule",
      "data-menu", "style-inspector-rule",
      "rule-id", rule.ruleID && String(rule.ruleID),
      "obj-id", obj_id && String(obj_id)
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
           ui_strings.S_STYLE_ORIGIN_SVG,
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
           value,
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
        this.prop_value(declaration, is_editable),
      "class", "css-declaration" +
               (declaration.is_applied ? "" : " overwritten") +
               (declaration.is_disabled ? " disabled" : ""),
      "data-spec", "css#" + declaration.property
    ];
  };

  this.prop_value = function(declaration, is_editable)
  {
    var value = this.value(declaration);
    return [
      (is_editable
       ? ["input",
          "type", "checkbox",
          "title", (declaration.is_disabled
                    ? ui_strings.S_ENABLE_DECLARATION
                    : ui_strings.S_DISABLE_DECLARATION),
          "class", "enable-disable",
          "checked", !declaration.is_disabled,
          "handler", "enable-disable",
          "data-property", declaration.property
         ]
       : []),
      ["span",
         declaration.property,
       "class", "css-property"
      ],
      ": ",
      ["span",
         value,
         (declaration.priority
          ? " !important"
          : ""),
         (this._color_properties.hasOwnProperty(declaration.property) && is_editable
          ? ["color-sample",
             "handler", "show-color-picker",
             "style", "background-color:" + declaration.value
            ]
          : []),
       "class", "css-property-value"
      ],
      ";"
    ];
  };

  this.value = function(declaration)
  {
    if (declaration.shorthand_tokens)
    {
      return declaration.shorthand_tokens.map(function(token) {
        var value = typeof token == "string"
                  ? token
                  : token.value;
        return token.is_applied != false
               ? ["span", value]
               : ["span", value, "class", "overwritten"];
      });
    }
    return ["span", declaration.value];
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
         "handler", "inspect-node-link"
        ]
    ];
  };
};

