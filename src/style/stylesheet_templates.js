"use strict";

/**
 * @constructor
 */
var StylesheetTemplates = function()
{
  var ORIGIN_USER_AGENT = cls.Stylesheets.origins.ORIGIN_USER_AGENT;
  var ORIGIN_LOCAL = cls.Stylesheets.origins.ORIGIN_LOCAL;

  var TYPE_HEX_COLOR = CssValueTokenizer.types.HEX_COLOR;
  var TYPE_FUNCTION_START = CssValueTokenizer.types.FUNCTION_START;
  var TYPE_FUNCTION_END = CssValueTokenizer.types.FUNCTION_END;

  this._css_value_tokenizer = new CssValueTokenizer();

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
    var value = this.value(declaration, is_editable);
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
         ["span",
           (declaration.priority ? " !important": ""),
          "class", "css-priority"
         ],
       "class", "css-property-value"
      ],
      ";"
    ];
  };

  this.value = function(declaration, is_editable)
  {
    var color_swatch = [];

    // Handle shorthands
    if (declaration.shorthand_tokens)
    {
      return declaration.shorthand_tokens.map(function(token) {
        var value = typeof token == "string"
                  ? token
                  : token.value;
        // Add a color swatch if the value is a color
        if (is_editable && (/^#([0-9a-f]{3}){1,2}$/i.test(value) || /^(rgb|hsl)a?\(/.test(value)))
          color_swatch = this.color_swatch(token.property, value);
        return token.is_applied != false
               ? ["span", value, color_swatch]
               : ["span", value, color_swatch, "class", "overwritten"];
      }, this);
    }

    // Handle non-shorthands
    var prop_value = ["span", declaration.value];

    if (is_editable)
    {
      prop_value = [];
      var color_value = [];
      // Add a color swatch if the value is a color
      this._css_value_tokenizer.tokenize(declaration.value, function(type, value) {
        if (color_value.length && type === TYPE_FUNCTION_END)
        {
          color_value.push(value);
          value = color_value.join("");
          color_swatch = this.color_swatch(declaration.property, value);
          color_value = [];
        }
        else if ((type === TYPE_FUNCTION_START && /^(rgb|hsl)a?\(/.test(value)) || color_value.length)
        {
          color_value.push(value);
          return;
        }
        else if (type === TYPE_HEX_COLOR)
        {
          color_swatch = this.color_swatch(declaration.property, value);
        }

        prop_value.push(["span", value, color_swatch]);
      }.bind(this));
    }

    return ["span", prop_value];
  };

  this.color_swatch = function(property, value)
  {
    return [
      "color-sample",
      "handler", "show-color-picker",
      "style", "background-color:" + value
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
         "handler", "inspect-node-link"
        ]
    ];
  };
};

