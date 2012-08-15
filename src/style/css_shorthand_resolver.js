"use strict";

/**
 * Resolve longhand properties (e.g. margin-{top,right,bottom,left})
 * to a shorthand.
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

  /**
   * Resolve all shorthands in a rule. All longhand properties have to
   * be present for this to work propertly. Most shorthands only have one
   * level of longhands, but 'border-*' have more.
   *
   * @param {Array} declaration CSS declaration as returned by Scope
   *        (currently not really true, it is manually converted to this
   *        format for the time being).
   */
  this.resolve = function(declarations)
  {
    var shorthands_map = CssShorthandResolver.property_to_shorthand;
    var props_map = CssShorthandResolver.shorthands;
    var decls = {};
    declarations.forEach(function(decl) {
      decls[decl.property] = {
        value: decl.value,
        is_applied: decl.is_applied
      };
    });

    // This loop terminates when all shorthands are converted
    while (true)
    {
      var converted_shorthands = [];

      // Convert to shorthands and add to the declarations
      declarations.forEach(function(declaration) {
        var prop = shorthands_map[declaration.property];
        if (prop && converted_shorthands.indexOf(prop) == -1)
        {
          var tokens = this.get_shorthand_val_for_property(prop, declarations, decls);
          if (tokens)
          {
            var val = tokens.reduce(function(prev, curr) {
              return prev + (typeof curr == "string" ? curr : curr.value);
            }, "");
            var is_applied = props_map[prop].properties.some(function(p) {
              var index = window.element_style.get_property_index(declarations, p);
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

      // Remove the longhand properties
      converted_shorthands.forEach(function(shorthand_prop) {
        var props = props_map[shorthand_prop].properties;
        props.forEach(function(prop) {
          window.element_style.remove_property(declarations, prop);
        }, this);
      }, this);

      if (converted_shorthands.length == 0)
        break;
    }
  };

  /**
   * Get the shorthand value for a property.
   *
   * @param {String} prop The property for which to get the shorthand.
   * @param {Array} declarations CSS declarations as returned by Scope.
   * @param {Array} all_decls All CSS declarations, original, and converted ones.
   */
  this.get_shorthand_val_for_property = function(prop, declarations, all_decls)
  {
    var props_map = CssShorthandResolver.shorthands;

    if (props_map.hasOwnProperty(prop))
    {
      var last_priority = null;
      var is_applied = null;
      var all_have_same_status = true;
      var has_inherited = false;
      var all_inherited = true;
      // Check if all properties needed to create a shorthand are available
      var has_all_props = props_map[prop].properties.every(function(prop) {
        var index = window.element_style.get_property_index(declarations, prop);
        if (index != -1)
        {
          var declaration = declarations[index];

          if (declaration.value == "inherit")
          {
            if (!has_inherited)
              has_inherited = true;
          }
          else
          {
            all_inherited = false;
          }

          if (all_have_same_status && is_applied !== null && is_applied != declaration.is_applied)
            all_have_same_status = false;
          is_applied = declaration.is_applied;

          // Check that all longhand properties either have or don't have an
          // !important declaration
          if (last_priority !== null && last_priority != declaration.priority)
            return false;
          last_priority = declaration.priority;

          all_decls[declaration.property] = {
            value: declaration.value,
            is_applied: declaration.is_applied
          };
          return true;
        }
        return false;
      }, this);

      if (has_all_props)
      {
        // 'inherit' can only be used as the sole value in a shorthand, so if
        // all values are 'inherit', we can only convert to shorthand if the
        // status is the same for all of them (i.e. all are applied or none is
        // applied)
        if (all_inherited)
        {
          return all_have_same_status
                 ? [{value: "inherit", is_applied: is_applied}]
                 : null;
        }
        // At least one value was 'inherit', but not all, so we can't convert
        // to shorthand
        else if (!has_inherited)
        {
          return props_map[prop].format(all_decls);
        }
      }
    }

    return null;
  };
};

CssShorthandResolver.get_instance = function()
{
  return CssShorthandResolver._instance || new CssShorthandResolver();
};

/**
 * Shorthand to property map, and formatters
 */
CssShorthandResolver.shorthands = (function() {
  var css_value_tokenizer = new CssValueTokenizer();

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
    var declarations = {};
    for (var prop in decls)
    {
      declarations[prop] = [];
      var value_list = [""];
      css_value_tokenizer.tokenize(decls[prop].value, function(type, value) {
        if (type == CssValueTokenizer.types.OPERATOR && value == ",")
        {
          value_list.push("");
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
   * If some property in with multiple values has too few values for some
   * property, repeat the value
   */
  var resolve_multiple_values = function(declarations, len)
  {
    for (var decl in declarations)
    {
      var decl_len = declarations[decl].length;

      if (decl_len > len)
        declarations[decl].splice(len);

      while (declarations[decl].length < len)
      {
        var index = declarations[decl].length % decl_len;
        declarations[decl].push({
          value: declarations[decl][index].value,
          is_applied: declarations[decl][index].is_applied
        });
      }
    }
  };

  /**
   * Compares a number of values. Returns true if all values are equal and all
   * values are applied.
   */
  var compare_values = function()
  {
    var first = arguments[0];
    var rest = Array.prototype.slice.call(arguments, 1);
    return rest.every(function(arg) {
      return first.value == arg.value &&
             first.is_applied == arg.is_applied;
    });
  };

  var get_tokens = function(decl)
  {
    return {
      value: decl.value,
      is_applied: decl.is_applied
    };
  };

  var convert_border_radius_values = function(declarations)
  {
    var values = {};
    for (var decl in declarations)
    {
      var split_values = declarations[decl].value.split(" ");
      values[decl] = {
        horizontal: {
          value: split_values[0],
          is_applied: declarations[decl].is_applied
        },
        vertical: {
          // If there is no vertical radius, it's the same as the horizontal one
          value: split_values[1] || split_values[0],
          is_applied: declarations[decl].is_applied
        }
      };
    }
    return values;
  };

  var get_initial_value = cls.Stylesheets.get_initial_value;

  return {
    "animation": {
      properties: [
        // Note that animation-play-state is not part of the shorthand
        "animation-name",
        "animation-duration",
        "animation-timing-function",
        "animation-delay",
        "animation-iteration-count",
        "animation-direction",
        "animation-fill-mode"
      ],
      format: function(decls) {
        var declarations = split_values(decls);
        var template = [];
        var len = declarations["animation-name"].length;
        resolve_multiple_values(declarations, len);
        for (var i = 0; i < len; i++)
        {
          var sub_template = [];
          var is_final_layer = (i == len-1);
          // The spec says that the first value that can be parsed as time is
          // assigned to the animation-duration. There are two time values in
          // the shorthand, 'duration' and 'delay'. If delay has a non-default
          // value, we must therefore include duration.
          var is_default_delay = declarations["animation-delay"][i].value ==
                                 get_initial_value("animation-delay");

          if (declarations["animation-name"][i].value !=
              get_initial_value("animation-name"))
            sub_template.push(" ", declarations["animation-name"][i]);

          if (!is_default_delay || declarations["animation-duration"][i].value !=
                                   get_initial_value("animation-duration"))
            sub_template.push(" ", declarations["animation-duration"][i]);

          if (declarations["animation-timing-function"][i].value !=
              get_initial_value("animation-timing-function"))
            sub_template.push(" ", declarations["animation-timing-function"][i]);

          if (!is_default_delay)
            sub_template.push(" ", declarations["animation-delay"][i]);

          if (declarations["animation-iteration-count"][i].value !=
              get_initial_value("animation-iteration-count"))
            sub_template.push(" ", declarations["animation-iteration-count"][i]);

          if (declarations["animation-direction"][i].value !=
              get_initial_value("animation-direction"))
            sub_template.push(" ", declarations["animation-direction"][i]);

          if (declarations["animation-fill-mode"][i].value !=
              get_initial_value("animation-fill-mode"))
            sub_template.push(" ", declarations["animation-fill-mode"][i]);

          // There's always an extra space at the beginning, remove it here
          sub_template.shift();

          // If all properties have default values, at least append the default name
          if (!sub_template.length)
            template.push("none");

          if (!is_final_layer)
            sub_template.push(", ");

          template.push.apply(template, sub_template);
        }

        return template;
      }
    },

    "-o-animation": {
      properties: [
        // Note that -o-animation-play-state is not part of the shorthand
        "-o-animation-name",
        "-o-animation-duration",
        "-o-animation-timing-function",
        "-o-animation-delay",
        "-o-animation-iteration-count",
        "-o-animation-direction",
        "-o-animation-fill-mode"
      ],
      format: function(decls) {
        // Workaround for CORE-45497: -o-animation-duration computed style
        // missing comma when having multiple values
        // Fixed in ci-322
        var duration = decls["-o-animation-duration"];
        if (duration.value.indexOf(" ") !== -1 && duration.value.indexOf(",") === -1)
          duration.value = duration.value.replace(/\s+/g, ", ");

        var declarations = split_values(decls);
        var template = [];
        var len = declarations["-o-animation-name"].length;
        resolve_multiple_values(declarations, len);
        for (var i = 0; i < len; i++)
        {
          var sub_template = [];
          var is_final_layer = (i == len-1);
          // The spec says that the first value that can be parsed as time is
          // assigned to the animation-duration. There are two time values in
          // the shorthand, 'duration' and 'delay'. If delay has a non-default
          // value, we must therefore include duration.
          var is_default_delay = declarations["-o-animation-delay"][i].value ==
                                 get_initial_value("-o-animation-delay");

          if (declarations["-o-animation-name"][i].value !=
              get_initial_value("-o-animation-name"))
            sub_template.push(" ", declarations["-o-animation-name"][i]);

          if (!is_default_delay || declarations["-o-animation-duration"][i].value !=
                                   get_initial_value("-o-animation-duration"))
            sub_template.push(" ", declarations["-o-animation-duration"][i]);

          if (declarations["-o-animation-timing-function"][i].value !=
              get_initial_value("-o-animation-timing-function"))
            sub_template.push(" ", declarations["-o-animation-timing-function"][i]);

          if (!is_default_delay)
            sub_template.push(" ", declarations["-o-animation-delay"][i]);

          if (declarations["-o-animation-iteration-count"][i].value !=
              get_initial_value("-o-animation-iteration-count"))
            sub_template.push(" ", declarations["-o-animation-iteration-count"][i]);

          if (declarations["-o-animation-direction"][i].value !=
              get_initial_value("-o-animation-direction"))
            sub_template.push(" ", declarations["-o-animation-direction"][i]);

          if (declarations["-o-animation-fill-mode"][i].value !=
              get_initial_value("-o-animation-fill-mode"))
            sub_template.push(" ", declarations["-o-animation-fill-mode"][i]);

          // There's always an extra space at the beginning, remove it here
          sub_template.shift();

          // If all properties have default values, at least append the default name
          if (!sub_template.length)
            template.push("none");

          if (!is_final_layer)
            sub_template.push(", ");

          template.push.apply(template, sub_template);
        }

        return template;
      }
    },

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
        resolve_multiple_values(declarations, len); // Will repeat background-color too, but that won't be used
        for (var i = 0; i < len; i++)
        {
          var template_len = template.length;
          var is_final_layer = (i == len-1);
          var is_default_bg_size = declarations["background-size"][i].value ==
                                   get_initial_value("background-size");

          // Always add background-image, unless we're in the final background
          // layer and it has the default value.
          if (!(is_final_layer && declarations["background-image"][i].value ==
                get_initial_value("background-image")))
            template.push(" ", declarations["background-image"][i]);

          if (!is_default_bg_size || declarations["background-position"][i].value !=
                                     get_initial_value("background-position"))
            template.push(" ", declarations["background-position"][i]);

          if (!is_default_bg_size)
            template.push("/", declarations["background-size"][i]);

          if (declarations["background-repeat"][i].value !=
              get_initial_value("background-repeat"))
            template.push(" ", declarations["background-repeat"][i]);

          if (declarations["background-attachment"][i].value !=
              get_initial_value("background-attachment"))
            template.push(" ", declarations["background-attachment"][i]);

          if (declarations["background-origin"][i].value !=
              get_initial_value("background-origin"))
            template.push(" ", declarations["background-origin"][i]);

          if (declarations["background-clip"][i].value !=
              get_initial_value("background-clip"))
            template.push(" ", declarations["background-clip"][i]);

          if (is_final_layer)
            template.push(" ", get_tokens(decls["background-color"]));
          else
            template.push(", ");

          // There's always an extra space at the beginning, remove it here
          template.splice(template_len, 1);
        }

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
        if (compare_values(decls["border-top"],
                           decls["border-right"],
                           decls["border-bottom"],
                           decls["border-left"]))
        {
          return [get_tokens(decls["border-top-width"]), " ",
                  get_tokens(decls["border-top-style"]), " ",
                  get_tokens(decls["border-top-color"])];
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
        "border-bottom-right-radius",
        "border-bottom-left-radius"
      ],
      format: function(decls) {
        var template = [];
        var declarations = convert_border_radius_values(decls);

        if (compare_values(declarations["border-top-left-radius"].horizontal,
                           declarations["border-top-right-radius"].horizontal,
                           declarations["border-bottom-right-radius"].horizontal,
                           declarations["border-bottom-left-radius"].horizontal)
        )
        {
          template.push(declarations["border-top-left-radius"].horizontal);
        }
        else if (compare_values(declarations["border-top-right-radius"].horizontal,
                                declarations["border-bottom-left-radius"].horizontal)
        )
        {
          if (compare_values(declarations["border-top-left-radius"].horizontal,
                             declarations["border-bottom-right-radius"].horizontal))
          {
            template.push(declarations["border-top-left-radius"].horizontal, " ",
                          declarations["border-top-right-radius"].horizontal);
          }
          else
          {
            template.push(declarations["border-top-left-radius"].horizontal, " ",
                          declarations["border-top-right-radius"].horizontal, " ",
                          declarations["border-bottom-right-radius"].horizontal);
          }
        }
        else
        {
          template.push(declarations["border-top-left-radius"].horizontal, " ",
                        declarations["border-top-right-radius"].horizontal, " ",
                        declarations["border-bottom-right-radius"].horizontal, " ",
                        declarations["border-bottom-left-radius"].horizontal);
        }

        // If horizontal and vertical radii match, and all statuses (is_applied)
        // match, skip the vertical radius as it's the same as the horizontal
        if (compare_values(declarations["border-top-left-radius"].horizontal,
                           declarations["border-top-left-radius"].vertical)
         && compare_values(declarations["border-top-right-radius"].horizontal,
                           declarations["border-top-right-radius"].vertical)
         && compare_values(declarations["border-bottom-right-radius"].horizontal,
                           declarations["border-bottom-right-radius"].vertical)
         && compare_values(declarations["border-bottom-left-radius"].horizontal,
                           declarations["border-bottom-left-radius"].vertical)
         && (compare_values(decls["border-top-left-radius"].is_applied,
                            decls["border-top-right-radius"].is_applied,
                            decls["border-bottom-right-radius"].is_applied,
                            decls["border-bottom-left-radius"].is_applied))
        )
        {
          return template;
        }

        // Add vertical radii
        template.push("/");

        if (compare_values(declarations["border-top-left-radius"].vertical,
                           declarations["border-top-right-radius"].vertical,
                           declarations["border-bottom-right-radius"].vertical,
                           declarations["border-bottom-left-radius"].vertical)
        )
        {
          template.push(declarations["border-top-left-radius"].vertical);
        }
        else if (compare_values(declarations["border-top-right-radius"].vertical,
                                declarations["border-bottom-left-radius"].vertical)
        )
        {
          if (compare_values(declarations["border-top-left-radius"].vertical,
                             declarations["border-bottom-right-radius"].vertical))
          {
            template.push(declarations["border-top-left-radius"].vertical, " ",
                          declarations["border-top-right-radius"].vertical);
          }
          else
          {
            template.push(declarations["border-top-left-radius"].vertical, " ",
                          declarations["border-top-right-radius"].vertical, " ",
                          declarations["border-bottom-right-radius"].vertical);
          }
        }
        else
        {
          template.push(declarations["border-top-left-radius"].vertical, " ",
                        declarations["border-top-right-radius"].vertical, " ",
                        declarations["border-bottom-right-radius"].vertical, " ",
                        declarations["border-bottom-left-radius"].vertical);
        }

        return template;
      }
    },

    "columns": {
      properties:[
        "column-width",
        "column-count"
      ],
      format: function(decls) {
        return [get_tokens(decls["column-width"]), " ",
                get_tokens(decls["column-count"])];
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
        // This function will always at least return font-size and font-family
        var template = [];

        if (decls["font-style"].value != get_initial_value("font-style"))
          template.push(" ", decls["font-style"]);

        if (decls["font-variant"].value != get_initial_value("font-variant"))
          template.push(" ", decls["font-variant"]);

        if (decls["font-weight"].value != get_initial_value("font-weight"))
          template.push(" ", decls["font-weight"]);

        template.push(" ", decls["font-size"]);

        if (decls["line-height"].value != get_initial_value("line-height"))
          template.push("/", decls["line-height"]);

        template.push(" ", decls["font-family"]);

        // There's always an extra space at the beginning, remove it here
        template.shift();

        return template;
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
        if (compare_values(decls["margin-top"],
                           decls["margin-right"],
                           decls["margin-bottom"],
                           decls["margin-left"]))
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
        return [get_tokens(decls["outline-width"]), " ",
                get_tokens(decls["outline-style"]), " ",
                get_tokens(decls["outline-color"])];
      }
    },

    "overflow": {
      properties: [
        "overflow-x",
        "overflow-y"
      ],
      format: function(decls) {
        if (compare_values(decls["overflow-x"],
                           decls["overflow-y"]))
        {
          return [get_tokens(decls["overflow-x"])];
        }
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
        if (compare_values(decls["padding-top"],
                           decls["padding-right"],
                           decls["padding-bottom"],
                           decls["padding-left"]))
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

    "transition": {
      properties: [
        "transition-property",
        "transition-duration",
        "transition-timing-function",
        "transition-delay",
      ],
      format: function(decls) {
        var declarations = split_values(decls);
        var template = [];
        var len = declarations["transition-property"].length;
        resolve_multiple_values(declarations, len);
        for (var i = 0; i < len; i++)
        {
          template.push(
            get_tokens(declarations["transition-property"][i]), " ",
            get_tokens(declarations["transition-duration"][i]), " ",
            get_tokens(declarations["transition-timing-function"][i]), " ",
            get_tokens(declarations["transition-delay"][i]), ", "
          );
        }
        template.pop();

        return template;
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
        resolve_multiple_values(declarations, len);
        for (var i = 0; i < len; i++)
        {
          template.push(
            get_tokens(declarations["-o-transition-property"][i]), " ",
            get_tokens(declarations["-o-transition-duration"][i]), " ",
            get_tokens(declarations["-o-transition-timing-function"][i]), " ",
            get_tokens(declarations["-o-transition-delay"][i]), ", "
          );
        }
        template.pop();

        return template;
      }
    }
  }
})();

CssShorthandResolver.property_to_shorthand = {
  // Note that animation-play-state is not part of the shorthand
  "animation-delay": "animation",
  "animation-direction": "animation",
  "animation-duration": "animation",
  "animation-fill-mode": "animation",
  "animation-iteration-count": "animation",
  "animation-name": "animation",
  "animation-timing-function": "animation",

  "-o-animation-delay": "-o-animation",
  "-o-animation-direction": "-o-animation",
  "-o-animation-duration": "-o-animation",
  "-o-animation-fill-mode": "-o-animation",
  "-o-animation-iteration-count": "-o-animation",
  "-o-animation-name": "-o-animation",
  "-o-animation-timing-function": "-o-animation",

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

  "overflow-x": "overflow",
  "overflow-y": "overflow",

  "padding-top": "padding",
  "padding-right": "padding",
  "padding-bottom": "padding",
  "padding-left": "padding",

  // pause not supported

  "transition-property": "transition",
  "transition-duration": "transition",
  "transition-timing-function": "transition",
  "transition-delay": "transition",

  "-o-transition-property": "-o-transition",
  "-o-transition-duration": "-o-transition",
  "-o-transition-timing-function": "-o-transition",
  "-o-transition-delay": "-o-transition"
};

