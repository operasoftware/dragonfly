"use strict";

/**
 * @constructor
 */
var StylesheetTemplates = function()
{
  var DATA_URI_MAX_LENGTH = 30;

  var ORIGIN_USER_AGENT = cls.Stylesheets.origins.ORIGIN_USER_AGENT;
  var ORIGIN_LOCAL = cls.Stylesheets.origins.ORIGIN_LOCAL;

  var TYPE_HEX_COLOR = CssValueTokenizer.types.HEX_COLOR;
  var TYPE_FUNCTION_START = CssValueTokenizer.types.FUNCTION_START;
  var TYPE_FUNCTION_END = CssValueTokenizer.types.FUNCTION_END;

  this._css_value_tokenizer = new CssValueTokenizer();
  this._color_properties = {
    "background-color": true,
    "border-color": true,
    "border-top-color": true,
    "border-right-color": true,
    "border-bottom-color": true,
    "border-left-color": true,
    "color": true,
    "fill": true,
    "flood-color": true,
    "lighting-color": true,
    "outline-color": true,
    "solid-color": true,
    "stop-color": true,
    "stroke": true
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
        ["div",
           "}",
         "handler", "insert-declaration-edit",
         "class", "closing-brace"
        ],
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
        ["div",
           "}",
         "handler", "insert-declaration-edit",
         "class", "closing-brace"
        ],
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
        ["div",
           "}",
         "handler", "insert-declaration-edit",
         "class", "closing-brace"
        ],
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
           this._parse_value(prop, value, false),
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

  this.prop_value = function(declaration, is_editable, no_parsing)
  {
    var value = !no_parsing
              ? this.parsed_value(declaration, is_editable, no_parsing)
              : this.value(declaration);
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
          ? ["span",
               " !important",
             "class", "css-priority"
            ]
          : []),
       "class", "css-property-value"
      ],
      ";"
    ];
  };

  this.value = function(declaration)
  {
    return ["span", declaration.value];
  };

  this.parsed_value = function(declaration, is_editable)
  {
    // Shorthands
    if (declaration.shorthand_tokens)
    {
      return declaration.shorthand_tokens.map(function(token) {
        var value = typeof token == "string"
                  ? token
                  : token.value;

        return ["span",
                  this._parse_value(declaration.property, value, is_editable),
                "class", token.is_applied === false && "overwritten"
               ];
      }, this);
    }

    // Non-shorthands
    return ["span", this._parse_value(declaration.property, declaration.value, is_editable)];
  };

  this._parse_value = function(prop, orig_value, is_editable)
  {
    var color_notation = window.settings["dom-side-panel"].get("color-notation");
    var color_value = [];
    var prop_value = [];
    var next_is_url = false;
    this._css_value_tokenizer.tokenize(orig_value, function(type, value) {
      var color_swatch = [];
      if (color_value.length && type === TYPE_FUNCTION_END)
      {
        color_value.push(value);
        value = color_value.join("");
        var color = new Color().parseCSSColor(value);
        if (color)
        {
          value = window.helpers.get_color_in_notation(color, color_notation);
          color_swatch = this.color_swatch(value, is_editable);
        }
        color_value = [];
      }
      else if ((type === TYPE_FUNCTION_START && this._is_color(value)) || color_value.length)
      {
        color_value.push(value);
        return;
      }
      else if (type === TYPE_HEX_COLOR)
      {
        value = window.helpers.get_color_in_notation(new Color().parseCSSColor(value), color_notation);
        color_swatch = this.color_swatch(value, is_editable);
      }
      else if ((this._color_properties.hasOwnProperty(prop) && value !== "invert")
            || value === "currentColor"
            || value === "transparent"
      )
      {
        color_swatch = this.color_swatch(value, is_editable);
      }
      else if (type === TYPE_FUNCTION_START && value === "url(")
      {
        next_is_url = true;
      }
      else if (next_is_url)
      {
        if (type !== TYPE_FUNCTION_END)
          value = this.linkify_value(value);
        next_is_url = false;
      }

      prop_value.push(["span", value, color_swatch]);
    }.bind(this));

    return prop_value;
  };

  this.color_swatch = function(value, is_editable)
  {
    var is_special = value === "currentColor" || value === "inherit";
    return [
      "span",
        ["span",
         "class", "color-swatch-fg-color",
         "style", !is_special ? ("background-color:" + value) : ""
        ],
      "class", "color-swatch" +
               (is_editable ? "" : " non-interactive") +
               (is_special ? " special" : ""),
      "handler", is_editable && "show-color-picker"
    ];
  };

  this.linkify_value = function(value)
  {
    if (value.startswith("\"") || value.startswith("'"))
      value = value.slice(1, -1);

    var url = value;
    var rest = [];

    // Shorten data URIs
    if (value.startswith("data:") && value.length > DATA_URI_MAX_LENGTH + 1)
    {
      rest = ["span",
                value.slice(DATA_URI_MAX_LENGTH),
              "class", "shortened-url"
             ];
      value = value.slice(0, DATA_URI_MAX_LENGTH);
    }

    return ["span",
              "\"",
                ["span",
                   value,
                   rest,
                 "handler", "open-resource-tab",
                 "data-resource-url", url,
                 "class", "internal-link"
                ],
              "\""
           ];
  }

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

  this.color_notation_setting = function(settings)
  {
    var options = [
        ["Hex", "hhex"],
        ["RGB", "rgb"],
        ["HSL", "hsl"]
      ].map(function(notation) {
        return [
          "option",
            notation[0],
          "value", notation[1],
          "selected", notation[1] == settings.map["color-notation"]
        ];
      });

    return [
      "label",
        settings.label_map["color-notation"] + ": ",
        ["select",
           options,
         "handler", "color-notation"
        ]
    ];
  };

  this._is_color = function(value)
  {
    return /^(rgb|hsl)a?\(/.test(value) || /^#([0-9a-f]{3}){1,2}$/i.test(value);
  };
};

