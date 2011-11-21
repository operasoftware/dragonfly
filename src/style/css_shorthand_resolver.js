"use strict";

/**
 * Resolve expanded properties (e.g. margin-{top,right,bottom,left})
 * a shorthand.
 *
 * @constructor
 * @requires CssValueTokenizer
 * @requires ElementStyle
 */
var CssShorthandResolver = function()
{
  if (CssShorthandResolver._instance)
  {
    return CssShorthandResolver._instance;
  }
  CssShorthandResolver._instance = this;

  this._element_style = cls.ElementStyle.get_instance();

  /**
   * Resolve all shorthands in a rule. All properties have to be fully
   * expanded for this to work propertly. Most shorthands only have one
   * level, but 'border-*' have more.
   *
   * @param {Array} declaration CSS declaration as returned by Scope
   *        (currently not really true, it is manually converted to this
   *        format for the time being).
   */
  this.resolve = function(declarations)
  {
    var shorthands_map = CssShorthandResolver.property_to_shorthand;
    var props_map = CssShorthandResolver.shorthands;

    do
    {
      var converted_shorthands = [];

      // Convert to shorthands and add to the declarations
      declarations.forEach(function(declaration) {
        var prop = shorthands_map[declaration.property];
        if (prop && converted_shorthands.indexOf(prop) == -1)
        {
          var tokens = this.get_shorthand_val_for_property(prop, declarations);
          if (tokens)
          {
            var val = tokens.reduce(function(prev, curr) {
              return prev + (typeof curr == "string" ? curr : curr.value);
            }, "");
            var is_applied = props_map[prop].properties.some(function(p) {
              var index = this._element_style.get_property_index(p, declarations);
              return declarations[index].is_applied;
            }, this);
            declarations.push({
              property: prop,
              value: val,
              priority: declaration.priority, // all are the same if converted
              is_applied: is_applied,
              is_disabled: false,
              shorthand_tokens: tokens
            });
            converted_shorthands.push(prop);
          }
        }
      }, this);

      // Remove the expanded properties
      converted_shorthands.forEach(function(shorthand_prop) {
        var props = props_map[shorthand_prop].properties;
        props.forEach(function(prop) {
          // TODO: faking a CSS rule here, it should be changed so that remove_property
          // (and related methods) takes a list of declarations instead
          this._element_style.remove_property({declarations: declarations}, prop);
        }, this);
      }, this);
    } while (converted_shorthands.length != 0);
  };

  /**
   * Get the shorthand value for a property.
   *
   * @param {String} prop The property for which to get the shorthand.
   * @param {Array} declarations CSS declarations as returned by Scope.
   */
  this.get_shorthand_val_for_property = function(prop, declarations)
  {
    var props_map = CssShorthandResolver.shorthands;
    var decls = {};

    if (props_map.hasOwnProperty(prop))
    {
      // Check if all properties needed to create a shorthand are available
      var props = props_map[prop].properties;
      var last_priority = null;
      var has_all_props = props.every(function(prop) {
        var index = this._element_style.get_property_index(prop, declarations);
        if (index != -1)
        {
          var declaration = declarations[index];
          if (last_priority !== null && last_priority != declaration.priority)
            return false;

          last_priority = declaration.priority;

          decls[declaration.property] = {
            value: declaration.value,
            is_applied: declaration.is_applied
          };
          return this._element_style.get_property_index(prop, declarations) != -1;
        }

        return false;
      }, this);

      if (has_all_props)
        return props_map[prop].format(decls);
    }

    return null;
  };
};

CssShorthandResolver.get_instance = function()
{
  return new CssShorthandResolver();
};

/**
 * Shorthand to property map, and formatters
 */
CssShorthandResolver.shorthands = (function() {
  /**
   * Splits values for properties that can take multiple values.
   *
   * Example:
   *   input:
   *     {prop_name: {value: "a, b", is_applied: true}}
   *   output:
   *     {prop_name: [{value: "a", is_applied: true},
   *                  {value: "b", is_applied: true}]}
   */
  var split_values = function(decls)
  {
    var tokenizer = new CssValueTokenizer();
    var declarations = [];
    for (var prop in decls)
    {
      declarations[prop] = [];
      var value_list = [""];
      tokenizer.tokenize(decls[prop].value, function(type, value) {
        if (type == CssValueTokenizer.types.OPERATOR && value == ",")
        {
          value_list[value_list.length] = [];
          return;
        }
        value_list[value_list.length-1] += value;
      });

      value_list.forEach(function(value) {
        declarations[prop].push({
          value: value.trim(),
          is_applied: decls[prop].is_applied
        });
      });
    }
    return declarations;
  };

  /**
   * Compares two values. Returns true if both values are equal and both
   * values are applied.
   */
  var compare_values = function(a, b)
  {
    return JSON.stringify(a.value) == JSON.stringify(b.value) &&
           a.is_applied == b.is_applied;
  };

  var get_tokens = function(decl)
  {
    return {
      value: decl.value,
      is_applied: decl.is_applied
    };
  };

  return {
    "background": {
      properties: [
        "background-image",
        "background-position",
        "background-size",
        "background-repeat",
        "background-attachment",
        "background-origin",
        "background-clip",
        "background-color"
      ],
      format: function(decls) {
        var declarations = split_values(decls);
        var template = [];
        var len = declarations["background-image"].length;
        for (var i = 0; i < len; i++)
        {
          template = template.concat(
            [get_tokens(declarations["background-image"][i]), " ",
             get_tokens(declarations["background-position"][i]), "/",
             get_tokens(declarations["background-size"][i]), " ",
             get_tokens(declarations["background-repeat"][i]), " ",
             get_tokens(declarations["background-attachment"][i]), " ",
             get_tokens(declarations["background-origin"][i]), " ",
             get_tokens(declarations["background-clip"][i]), ", "]
          );
        }
        template.splice(-1, 1, " "); // Replace the last ',' with ' '
        template.push(get_tokens(decls["background-color"]));

        return template;
      }
    },

    "border": {
      properties: [
        "border-top",
        "border-right",
        "border-bottom",
        "border-left"
      ],
      format: function(decls) {
        if (compare_values(decls["border-top"], decls["border-right"]) &&
            compare_values(decls["border-top"], decls["border-bottom"]) &&
            compare_values(decls["border-top"], decls["border-left"]))
        {
          return [get_tokens(decls["border-top"])];
        }
      }
    },

    "border-top": {
      properties: [
        "border-top-width",
        "border-top-style",
        "border-top-color"
      ],
      format: function(decls) {
        return [get_tokens(decls["border-top-width"]), " ",
                get_tokens(decls["border-top-style"]), " ",
                get_tokens(decls["border-top-color"])];
      }
    },

    "border-right": {
      properties: [
        "border-right-width",
        "border-right-style",
        "border-right-color"
      ],
      format: function(decls) {
        return [get_tokens(decls["border-right-width"]), " ",
                get_tokens(decls["border-right-style"]), " ",
                get_tokens(decls["border-right-color"])];
      }
    },

    "border-bottom": {
      properties: [
        "border-bottom-width",
        "border-bottom-style",
        "border-bottom-color"
      ],
      format: function(decls) {
        return [get_tokens(decls["border-bottom-width"]), " ",
                get_tokens(decls["border-bottom-style"]), " ",
                get_tokens(decls["border-bottom-color"])];
      }
    },

    "border-left": {
      properties: [
        "border-left-width",
        "border-left-style",
        "border-left-color"
      ],
      format: function(decls) {
        return [get_tokens(decls["border-left-width"]), " ",
                get_tokens(decls["border-left-style"]), " ",
                get_tokens(decls["border-left-color"])];
      }
    },

    "border-radius": {
      properties: [
        "border-top-left-radius",
        "border-top-right-radius",
        "border-bottom-left-radius",
        "border-bottom-right-radius"
      ],
      format: function(decls) {
        if (compare_values(decls["border-top-left-radius"], decls["border-top-right-radius"]) &&
            compare_values(decls["border-top-left-radius"], decls["border-bottom-left-radius"]) &&
            compare_values(decls["border-top-left-radius"], decls["border-bottom-right-radius"]))
        {
          return [get_tokens(decls["border-top-left-radius"])];
        }
      }
    },

    "columns": {
      properties:[
        "column-width",
        "column-count"
      ],
      format: function(decls) {
        return [get_tokens(decls["column-width"].value), " ",
                get_tokens(decls["column-count"].value)];
      }
    },

    "column-rule": {
      properties:[
        "column-rule-width",
        "column-rule-style",
        "column-rule-color"
      ],
      format: function(decls) {
        return [get_tokens(decls["column-rule-width"]), " ",
                get_tokens(decls["column-rule-style"]), " ",
                get_tokens(decls["column-rule-color"])];
      }
    },

    "font": {
      properties:[
        "font-style",
        "font-variant",
        "font-weight",
        "font-size",
        "line-height",
        "font-family"
      ],
      format: function(decls) {
        return [get_tokens(decls["font-style"]), " ",
                get_tokens(decls["font-variant"]), " ",
                get_tokens(decls["font-weight"]), " ",
                get_tokens(decls["font-size"]), "/",
                get_tokens(decls["line-height"]), " ",
                get_tokens(decls["font-family"])];
      }
    },

    "list-style": {
      properties: [
        "list-style-type",
        "list-style-position",
        "list-style-image"
      ],
      format: function(decls) {
        return [get_tokens(decls["list-style-type"]), " ",
                get_tokens(decls["list-style-position"]), " ",
                get_tokens(decls["list-style-image"])];
      }
    },

    "margin": {
      properties: [
        "margin-top",
        "margin-right",
        "margin-bottom",
        "margin-left"
      ],
      format: function(decls) {
        if (compare_values(decls["margin-top"], decls["margin-right"]) &&
            compare_values(decls["margin-top"], decls["margin-bottom"]) &&
            compare_values(decls["margin-top"], decls["margin-left"]))
        {
          return [get_tokens(decls["margin-bottom"])];
        }
        else if (compare_values(decls["margin-right"], decls["margin-left"]))
        {
          if (compare_values(decls["margin-top"], decls["margin-bottom"]))
          {
            return [get_tokens(decls["margin-top"]), " ",
                    get_tokens(decls["margin-right"])];
          }
          return [get_tokens(decls["margin-top"]), " ",
                  get_tokens(decls["margin-right"]), " ",
                  get_tokens(decls["margin-bottom"])];
        }
        else
        {
          return [get_tokens(decls["margin-top"]), " ",
                  get_tokens(decls["margin-right"]), " ",
                  get_tokens(decls["margin-bottom"]), " ",
                  get_tokens(decls["margin-left"])];
        }
      }
    },

    "outline": {
      properties: [
        "outline-color",
        "outline-style",
        "outline-width"
      ],
      format: function(decls) {
        return [get_tokens(decls["outline-color"]), " ",
                get_tokens(decls["outline-style"]), " ",
                get_tokens(decls["outline-width"])];
      }
    },

    "padding": {
      properties: [
        "padding-top",
        "padding-right",
        "padding-bottom",
        "padding-left"
      ],
      format: function(decls) {
        if (compare_values(decls["padding-top"], decls["padding-right"]) &&
            compare_values(decls["padding-top"], decls["padding-bottom"]) &&
            compare_values(decls["padding-top"], decls["padding-left"]))
        {
          return [get_tokens(decls["padding-bottom"])];
        }
        else if (compare_values(decls["padding-right"], decls["padding-left"]))
        {
          if (compare_values(decls["padding-top"], decls["padding-bottom"]))
          {
            return [get_tokens(decls["padding-top"]), " ",
                    get_tokens(decls["padding-right"])];
          }
          return [get_tokens(decls["padding-top"]), " ",
                  get_tokens(decls["padding-right"]), " ",
                  get_tokens(decls["padding-bottom"])];
        }
        else
        {
          return [get_tokens(decls["padding-top"]), " ",
                  get_tokens(decls["padding-right"]), " ",
                  get_tokens(decls["padding-bottom"]), " ",
                  get_tokens(decls["padding-left"])];
        }
      }
    },

    "-o-transition": {
      properties: [
        "-o-transition-property",
        "-o-transition-duration",
        "-o-transition-timing-function",
        "-o-transition-delay",
      ],
      format: function(decls) {
        var declarations = split_values(decls);
        var template = [];
        var len = declarations["-o-transition-property"].length;
        for (var i = 0; i < len; i++)
        {
          template = template.concat(
            [get_tokens(declarations["-o-transition-property"][i]), " ",
             get_tokens(declarations["-o-transition-duration"][i]), " ",
             get_tokens(declarations["-o-transition-timing-function"][i]), " ",
             get_tokens(declarations["-o-transition-delay"][i]), ", "]
          );
        }
        template.splice(-1, 1); // Remove the last ','

        return template;
      }
    }
  }
})();

CssShorthandResolver.property_to_shorthand = {
  "background-color": "background",
  "background-image": "background",
  "background-repeat": "background",
  "background-attachment": "background",
  "background-position": "background",

  "border-color": "border",
  "border-style": "border",
  "border-width": "border",
  "border-top": "border",
  "border-right": "border",
  "border-bottom": "border",
  "border-left": "border",
  "border-top-color": "border-top",
  "border-right-color": "border-right",
  "border-bottom-color": "border-bottom",
  "border-left-color": "border-left",
  "border-top-style": "border-top",
  "border-right-style": "border-right",
  "border-bottom-style": "border-bottom",
  "border-left-style": "border-left",
  "border-top-width": "border-top",
  "border-right-width": "border-right",
  "border-bottom-width": "border-bottom",
  "border-left-width": "border-left",

  "border-top-left-radius": "border-radius",
  "border-top-right-radius": "border-radius",
  "border-bottom-left-radius": "border-radius",
  "border-bottom-right-radius": "border-radius",

  "column-width": "columns",
  "column-count": "columns",

  "column-rule-width": "column-rule",
  "column-rule-style": "column-rule",
  "column-rule-color": "column-rule",

  // cue not supported

  "font-style": "font",
  "font-variant": "font",
  "font-weight": "font",
  "font-size": "font",
  "line-height": "font",
  "font-family": "font",

  "list-style-type": "list-style",
  "list-style-position": "list-style",
  "list-style-image": "list-style",

  "margin-top": "margin",
  "margin-right": "margin",
  "margin-bottom": "margin",
  "margin-left": "margin",

  "outline-color": "outline",
  "outline-style": "outline",
  "outline-width": "outline",

  "padding-top": "padding",
  "padding-right": "padding",
  "padding-bottom": "padding",
  "padding-left": "padding",

  // pause not supported

  "-o-transition-property": "-o-transition",
  "-o-transition-duration": "-o-transition",
  "-o-transition-timing-function": "-o-transition",
  "-o-transition-delay": "-o-transition"
};

