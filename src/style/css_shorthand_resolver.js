/**
 * Resolve expanded properties (e.g. margin-{top,right,bottom,left})
 * a shorthand.
 *
 * @constructor
 * @requires CssValueTokenizer
 *
 * TODO: this has to take into account e.g. !important declarations
 * and overwritten values too.
 */
var CssShorthandResolver = function()
{
  if (CssShorthandResolver._instance)
  {
    return CssShorthandResolver._instance;
  }
  CssShorthandResolver._instance = this;

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
          var val = this.get_shorthand_val_for_property(prop, declarations);
          if (val)
          {
            declarations.push({
              property: prop,
              value: val,
              priority: declaration.priority, // all are the same
              // TODO: these needs to be set properly
              is_applied: declaration.is_applied,
              is_disabled: false
            });
            converted_shorthands.push(prop);
          }
        }
      }, this);

      // Remove the expanded properties
      converted_shorthands.forEach(function(shorthand_prop) {
        var props = props_map[shorthand_prop].properties;
        props.forEach(function(prop) {
          remove_prop_from_declarations(prop, declarations);
        });
      });
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
        var index = get_property_index(prop, declarations);
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
          return get_property_index(prop, declarations) != -1;
        }

        return false;
      });

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

// TODO: use the already available version
var remove_prop_from_declarations = function(prop, declarations)
{
  var index = get_property_index(prop, declarations)
  if (index != -1)
    declarations.splice(index, 1);
};

// TODO: move out of this class
var get_property_index = function(prop, declarations)
{
  for (var i = 0, decl; decl = declarations[i]; i++)
  {
    if (decl.property == prop)
      return i;
  }
  return -1;
};

CssShorthandResolver.parse_multiple_values = function(value)
{
  var tokenizer = new CssValueTokenizer();
  var value_list = [""];
  tokenizer.tokenize(value, function(type, value) {
    if (type == CssValueTokenizer.types.OPERATOR && value == ",")
    {
      value_list[value_list.length] = [];
      return;
    }
    value_list[value_list.length-1] += value;
  });
  return value_list;
};

/**
 * Shorthand to property map, and formatters
 */
CssShorthandResolver.shorthands = {
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
      var values = [];

      this.properties.forEach(function(prop, idx) {
        if (prop == "background-color") return;
        var value_list = CssShorthandResolver.parse_multiple_values(decls[prop].value);
        value_list.forEach(function(val, idx) {
          if (!values[idx]) values[idx] = [];
          values[idx].push(val.trim());
        });
      });

      return values.map(function(vals) {
        return vals.map(function(val, idx) {
          // TODO: this is *horrible*, fix fix fix
          return idx == this.properties.indexOf("background-size")
                 ? "/" + val // Slash between background-position and background-size
                 : idx == 0
                   ? val
                   : " " + val;
        }, this).join("");
      }, this).join(", ") + " " + decls["background-color"].value;
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
      if (decls["border-top"].value == decls["border-right"].value &&
          decls["border-top"].value == decls["border-bottom"].value &&
          decls["border-top"].value == decls["border-left"].value)
      {
        return decls["border-top"].value;
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
      return decls["border-top-width"].value + " " +
             decls["border-top-style"].value + " " +
             decls["border-top-color"].value;
    }
  },

  "border-right": {
    properties: [
      "border-right-width",
      "border-right-style",
      "border-right-color"
    ],
    format: function(decls) {
      return decls["border-right-width"].value + " " +
             decls["border-right-style"].value + " " +
             decls["border-right-color"].value;
    }
  },

  "border-bottom": {
    properties: [
      "border-bottom-width",
      "border-bottom-style",
      "border-bottom-color"
    ],
    format: function(decls) {
      return decls["border-bottom-width"].value + " " +
             decls["border-bottom-style"].value + " " +
             decls["border-bottom-color"].value;
    }
  },

  "border-left": {
    properties: [
      "border-left-width",
      "border-left-style",
      "border-left-color"
    ],
    format: function(decls) {
      return decls["border-left-width"].value + " " +
             decls["border-left-style"].value + " " +
             decls["border-left-color"].value;
    }
  },

  // TODO: implement with two values for each property
  //"border-radius": {
  //  properties: [
  //    "border-bottom-left-radius",
  //    "border-bottom-right-radius",
  //    "border-top-left-radius",
  //    "border-top-right-radius"
  //  ],
  //  format: function(decls) {
  //  }
  //},

  "columns": {
    properties:[
      "column-width",
      "column-count"
    ],
    format: function(decls) {
      return decls["column-width"].value + " " +
             decls["column-count"].value;
    }
  },

  "column-rule": {
    properties:[
      "column-rule-width",
      "column-rule-style",
      "column-rule-color"
    ],
    format: function(decls) {
      return decls["column-rule-width"].value + " " +
             decls["column-rule-style"].value + " " +
             decls["column-rule-color"].value;
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
      return decls["font-style"].value + " " +
             decls["font-variant"].value + " " +
             decls["font-weight"].value + " " +
             decls["font-size"].value + "/" +
             decls["line-height"].value + " " +
             decls["font-family"].value;
    }
  },

  "list-style": {
    properties: [
      "list-style-type",
      "list-style-position",
      "list-style-image"
    ],
    format: function(decls) {
      return decls["list-style-type"].value + " " +
             decls["list-style-position"].value + " " +
             decls["list-style-image"].value;
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
      if (decls["margin-top"].value == decls["margin-right"].value &&
          decls["margin-top"].value == decls["margin-bottom"].value &&
          decls["margin-top"].value == decls["margin-left"].value)
      {
        return decls["margin-top"].value;
      }
      else if (decls["margin-right"].value == decls["margin-left"].value)
      {
        if (decls["margin-top"].value == decls["margin-bottom"].value)
        {
          return decls["margin-top"].value + " " +
                 decls["margin-right"].value;
        }
        return decls["margin-top"].value + " " +
               decls["margin-right"].value + " " +
               decls["margin-bottom"].value;
      }
      else
      {
        return decls["margin-top"].value + " " +
               decls["margin-right"].value + " " +
               decls["margin-bottom"].value + " " +
               decls["margin-left"].value;
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
      return decls["outline-color"].value + " " +
             decls["outline-style"].value + " " +
             decls["outline-width"].value;
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
      if (decls["padding-top"].value == decls["padding-right"].value &&
          decls["padding-top"].value == decls["padding-bottom"].value &&
          decls["padding-top"].value == decls["padding-left"].value)
      {
        return decls["padding-top"].value;
      }
      else if (decls["padding-right"].value == decls["padding-left"].value)
      {
        if (decls["padding-top"].value == decls["padding-bottom"].value)
        {
          return decls["padding-top"].value + " " +
                 decls["padding-right"].value;
        }
        return decls["padding-top"].value + " " +
               decls["padding-right"].value + " " +
               decls["padding-bottom"].value;
      }
      else
      {
        return decls["padding-top"].value + " " +
               decls["padding-right"].value + " " +
               decls["padding-bottom"].value + " " +
               decls["padding-left"].value;
      }
    }
  },

  "overflow": {
    properties: [
      "overflow-x",
      "overflow-y"
    ],
    format: function(decls) {
      if (decls["overflow-x"].value == decls["overflow-y"].value)
      {
        return decls["overflow-x"].value;
      }
      return decls["overflow-x"].value + " " +
             decls["overflow-y"].value;
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
      var values = [];

      this.properties.forEach(function(prop, idx) {
        var value_list = CssShorthandResolver.parse_multiple_values(decls[prop].value);
        value_list.forEach(function(val, idx) {
          if (!values[idx]) values[idx] = [];
          values[idx].push(val.trim());
        });
      });

      return values.map(function(vals) {
        return vals.join(" ");
      }).join(", ");
    }
  }
};

// TODO: this does not cover all properties
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

  "overflow-x": "overflow",
  "overflow-y": "overflow",

  "-o-transition-property": "-o-transition",
  "-o-transition-duration": "-o-transition",
  "-o-transition-timing-function": "-o-transition",
  "-o-transition-delay": "-o-transition"
};

