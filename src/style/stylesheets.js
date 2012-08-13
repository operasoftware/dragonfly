"use strict";

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
  this._css_index_map = null;
  this._sorted_index_map = [];
  this._is_getting_index_map = false;
  this._on_index_map_listeners = [];
  this._new_runtimes = null;

  var SHEET_OBJECT_ID = 0;
  var SHEET_HREF = 2;
  var SHEET_TITLE = 3;

  var ORIGIN_USER_AGENT = cls.Stylesheets.origins.ORIGIN_USER_AGENT;
  var ORIGIN_LOCAL = cls.Stylesheets.origins.ORIGIN_LOCAL;
  var ORIGIN_AUTHOR = cls.Stylesheets.origins.ORIGIN_AUTHOR;
  var ORIGIN_ELEMENT = cls.Stylesheets.origins.ORIGIN_ELEMENT;
  var ORIGIN_SVG = cls.Stylesheets.origins.ORIGIN_SVG;

  this.get_stylesheets = function(rt_id, callback)
  {
    if (this._sheets[rt_id])
      return this._sheets[rt_id];

    if (callback)
    {
      if (!this._css_index_map)
      {
        this.get_css_index_map(this.get_stylesheets.bind(this, rt_id, callback));
        return;
      }

      if (runtime_onload_handler.is_loaded(rt_id))
      {
        var tag = this._tag_manager.set_callback(this, this._handle_get_all_stylesheets,
                                                 [rt_id, callback]);
        this._es_debugger.requestCssGetAllStylesheets(tag, [rt_id]);
      }
      else
      {
        runtime_onload_handler.register_onload_handler(rt_id, this.get_stylesheets.bind(this, rt_id, callback));
      }
    }
  };

  this.has_stylesheets_runtime = function(rt_id)
  {
    return Boolean(this._sheets[rt_id]);
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

  this.get_css_index_map = function(callback)
  {
    if (this._css_index_map)
    {
      callback(this._css_index_map);
    }
    else if (this._is_getting_index_map)
    {
      this._on_index_map_listeners.push(callback);
    }
    else
    {
      this._is_getting_index_map = true;
      this._on_index_map_listeners.push(callback);
      var tag = this._tag_manager.set_callback(this, this._handle_get_css_index_map);
      this._es_debugger.requestCssGetIndexMap(tag);
    }
  };

  this.get_sorted_properties = function()
  {
    var props = [];
    var dashes = [];

    for (var i = 0; i < this._css_index_map.length; i++)
    {
      var value = this._css_index_map[this._sorted_index_map[i]];
      if (value[0] == "-")
        dashes.push(value);
      else
        props.push(value);
    }
    return props.concat(dashes);
  };

  this.pretty_print_computed_style = function(data)
  {
    var template = [];
    // set_props is used to force the display if a given property is set
    // even if it has the initial value
    var set_props = window.element_style.get_set_props();
    var search_term = window.element_style.get_search_term();
    var show_initial_value = window.settings["css-comp-style"].get("show-initial-values");
    var show_longhand_props = window.settings["css-inspector"].get("show-longhand-properties");

    for (var i = 0; i < this._css_index_map.length; i++)
    {
      var index = this._sorted_index_map[i];
      var prop = this._css_index_map[index];
      var value = data.style_list[index];
      var is_not_initial_value =
        !show_initial_value
        && value != ""
        && value != cls.Stylesheets.get_initial_value(prop, data.style_list, this._css_index_map)
        || false;
      var display =
        (show_initial_value || set_props.indexOf(prop) != -1 || is_not_initial_value)
        && this._show_prop_in_computed_style(prop, show_initial_value, show_longhand_props)
        && (prop.indexOf(search_term) != -1 ||
            value.indexOf(search_term) != -1);

      if (display)
        template.push(this._templates.declaration_computed_style(prop, value));
    }

    return template;
  };

  /**
   * To avoid getting the computed style section messy, hide some of the border-*
   * properties.
   */
  this._show_prop_in_computed_style = function(prop, show_initial_value, show_longhand_props)
  {
    if (show_initial_value)
      return true;

    if (prop == "border")
      return false;

    if (show_longhand_props)
    {
      return ["border-color", "border-style", "border-width"].indexOf(prop) != -1
             ? false
             : !CssShorthandResolver.shorthands[prop];
    }

    return ["border-top", "border-right", "border-bottom", "border-left"].indexOf(prop) != -1
           ? true
           : !CssShorthandResolver.property_to_shorthand[prop];
  };

  this.pretty_print_cascaded_style = function(data)
  {
    var template = [];
    var search_term = window.element_style.get_search_term();
    var style_list = data.style_list;

    for (var i = 0, node_style; node_style = style_list[i]; i++)
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

        template.push(this._pretty_print_rule(rule, data.rt_id, node_style.objectID, element_name));
      }
    }

    return template;
  };

  this._pretty_print_rule = function(rule, rt_id, obj_id, element_name)
  {
    var decl_list = this._pretty_print_declaration_list(rule);
    switch (rule.origin)
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

  this._handle_get_css_index_map = function(status, message, callback)
  {
    var NAME_LIST = 0;
    var index_map = message[NAME_LIST];
    if (!index_map)
      return;

    if (!this._css_index_map)
    {
      this._css_index_map = index_map;

      var temp = [];
      for (var i = 0, prop; prop = index_map[i]; i++)
      {
        temp[i] = {index: i, prop: prop};
      }

      temp.sort(function(a, b) {
        return a.prop > b.prop ? 1 : -1;
      });

      for (var i = 0; prop = temp[i]; i++)
      {
        this._sorted_index_map[i] = prop.index;
      }
    }

    while (this._on_index_map_listeners.length)
    {
      this._on_index_map_listeners.shift()();
    }
  };

  this._handle_get_all_stylesheets = function(status, message, rt_id, callback)
  {
    var STYLESHEET_LIST = 0;
    if (status == 0)
    {
      this._sheets[rt_id] = message[STYLESHEET_LIST] || [];
      this._sheets[rt_id].runtime_id = rt_id;
      if (callback)
        callback();
    }
  };

  this._on_reset_state = function()
  {
    this._sheets = {};
    this._new_runtimes = null;
    this._is_getting_index_map = false;
    this._css_index_map = null;
  };

  this._on_profile_disabled = function(msg)
  {
    if (msg.profile == window.app.profiles.DEFAULT)
    {
      this._sheets = {};
      this._new_runtimes = null;
    }
  };

  this._on_active_tab = function(msg)
  {
    if (!msg.runtimes_with_dom.length)
    {
      this._on_reset_state();
    }
    else
    {
      this._new_runtimes = msg.runtimes_with_dom.slice(0);
      this._check_new_runtimes();
    }
  };

  this._check_new_runtimes = function()
  {
    for (var i = 0, rt_id; rt_id = this._new_runtimes[i]; i++)
    {
      if (!this._sheets[rt_id])
        this.get_stylesheets(rt_id, function() {});
    }
  };

  this._init = function()
  {
    if (window.messages)
    {
      window.messages.addListener('active-tab', this._on_active_tab.bind(this));
      window.messages.addListener('reset-state', this._on_reset_state.bind(this));
      window.messages.addListener('profile-disabled', this._on_profile_disabled.bind(this));
    }
  };

  this._init();
};

cls.Stylesheets.get_initial_value = function(prop, data, index_map)
{
  // TODO: we only need to check for the special initial values here (e.g. border-color
  // being the same as color unless overridden). The rest could simply return the first value
  // of the suggested values (this needs to be arranged so that the first is actually the
  // initial value).
  switch (prop)
  {
  case "-apple-dashboard-region":
    return "";

  case "animation":
  case "-o-animation":
      return "none 0s 0s cubic-bezier(0.25, 0.1, 0.25, 1) normal none 1";

  case "animation-delay":
  case "-o-animation-delay":
      return "0s";

  case "animation-direction":
  case "-o-animation-direction":
      return "normal";

  case "animation-duration":
  case "-o-animation-duration":
      return "0s";

  case "animation-fill-mode":
  case "-o-animation-fill-mode":
      return "none";

  case "animation-iteration-count":
  case "-o-animation-iteration-count":
      return "1";

  case "animation-name":
  case "-o-animation-name":
      return "none";

  case "animation-play-state":
  case "-o-animation-play-state":
      return "running";

  case "animation-timing-function":
  case "-o-animation-timing-function":
      return "cubic-bezier(0.25, 0.1, 0.25, 1)";

  case "-o-border-image":
    return "";

  case "-o-focus-opacity":
    return "";

  case "-o-link":
    return "";

  case "-o-link-source":
    return "";

  case "-o-mini-fold":
    return "";

  case "-o-object-fit":
    return "auto"; // this is 'fill' according to new spec, update when the imlementation changes

  case "-o-object-position":
    return "50% 50%";

  case "-o-tab-size":
    return "";

  case "-o-table-baseline":
    return "";

  case "-o-text-overflow":
    return "";

  case "transform":
  case "-o-transform":
  case "-webkit-transform":
    return "none";

  case "transform-origin":
  case "-o-transform-origin":
  case "-webkit-transform-origin":
    var w = parseInt(data[index_map.indexOf("width")]) || 0;
    var h = parseInt(data[index_map.indexOf("height")]) || 0;
    if (data[index_map.indexOf("box-sizing")] === "content-box")
    {
        w += parseInt(data[index_map.indexOf("padding-left")]) +
             parseInt(data[index_map.indexOf("padding-right")]);
        h += parseInt(data[index_map.indexOf("padding-top")]) +
             parseInt(data[index_map.indexOf("padding-bottom")]);
    }
    return (w / 2) + "px " + (h / 2) + "px";

  case "transition":
  case "-o-transition":
  case "-webkit-transition":
    return "all 0s 0s cubic-bezier(0.25, 0.1, 0.25, 1)";

  case "transition-delay":
  case "-o-transition-delay":
  case "-webkit-transition-delay":
    return "0s";

  case "transition-duration":
  case "-o-transition-duration":
  case "-webkit-transition-duration":
    return "0s";

  case "transition-property":
  case "-o-transition-property":
  case "-webkit-transition-property":
    return "all";

  case "transition-timing-function":
  case "-o-transition-timing-function":
  case "-webkit-transition-timing-function":
    return "cubic-bezier(0.25, 0.1, 0.25, 1)";

  case "-wap-accesskey":
    return "";

  case "-wap-input-format":
    return "";

  case "-wap-input-required":
    return "";

  case "-wap-marquee-dir":
    return "";

  case "-wap-marquee-loop":
    return "";

  case "-wap-marquee-speed":
    return "";

  case "-wap-marquee-style":
    return "";

  case "-xv-interpret-as":
    return "";

  case "-xv-phonemes":
    return "";

  case "-xv-voice-balance":
    return "";

  case "-xv-voice-duration":
    return "";

  case "-xv-voice-pitch":
    return "";

  case "-xv-voice-pitch-range":
    return "";

  case "-xv-voice-rate":
    return "";

  case "-xv-voice-stress":
    return "";

  case "-xv-voice-volume":
    return "";

  case "alignment-baseline":
    return "auto";

  case "audio-level":
    return "1";

  case "background":
    return "transparent 0% 0%";

  case "background-attachment":
    return "scroll";

  case "background-clip":
    return "border-box";

  case "background-color":
    return "transparent";

  case "background-image":
    return "none";

  case "background-origin":
    return "padding-box";

  case "background-position":
    return "0% 0%";

  case "background-repeat":
    return "repeat";

  case "background-size":
  case "-webkit-background-size":
    return "auto";

  case "baseline-shift":
    return "baseline";

  case "border":
    return "0px " + data[index_map.indexOf("color")];

  case "border-bottom":
    return "0px " + data[index_map.indexOf("color")];

  case "border-bottom-color":
    return data[index_map.indexOf("color")];

  case "border-bottom-style":
    return "none";

  case "border-bottom-width":
    return "0px";

  case "border-collapse":
    return "separate";

  case "border-color":
    return data[index_map.indexOf("color")];

  case "border-left":
    return "0px " + data[index_map.indexOf("color")];

  case "border-left-color":
    return data[index_map.indexOf("color")];

  case "border-left-style":
    return "none";

  case "border-left-width":
    return "0px";

  case "border-right":
    return "0px " + data[index_map.indexOf("color")];

  case "border-right-color":
    return data[index_map.indexOf("color")];

  case "border-right-style":
    return "none";

  case "border-right-width":
    return "0px";

  case "border-spacing":
    return "0px";

  case "border-style":
    return "none";

  case "border-top":
    return "0px " + data[index_map.indexOf("color")];

  case "border-top-color":
    return data[index_map.indexOf("color")];

  case "border-top-style":
    return "none";

  case "border-top-width":
    return "0px";

  case "border-width":
    return "0px";

  case "border-radius":
  case "-webkit-border-radius":
    return "0px";

  case "border-bottom-left-radius":
  case "-webkit-border-bottom-left-radius":
    return "0px";

  case "border-bottom-right-radius":
  case "-webkit-border-bottom-right-radius":
    return "0px";

  case "border-bottom-width":
    return "0px";

  case "border-top-left-radius":
  case "-webkit-border-top-left-radius":
    return "0px";

  case "border-top-right-radius":
  case "-webkit-border-top-right-radius":
    return "0px";

  case "bottom":
    return "auto";

  case "box-decoration-break":
    return "slice";

  case "box-sizing":
    return "content-box";

  case "box-shadow":
  case "-webkit-box-shadow":
    return "none";

  case "break-after":
    return "auto";

  case "break-before":
    return "auto";

  case "break-inside":
    return "auto";

  case "buffered-rendering":
    return "auto";

  case "caption-side":
    return "top";

  case "clear":
    return "none";

  case "clip":
    return "rect(0px, 0px, 0px, 0px)";

  case "clip-path":
    return "none";

  case "clip-rule":
    return "nonzero";

  case "color":
    return "rgb(0, 0, 0)";

  case "color-interpolation":
    return "sRGB";

  case "color-interpolation-filters":
    return "linearRGB";

  case "color-profile":
    return "auto";

  case "color-rendering":
    return "auto";

  case "column-count":
    return "auto";

  case "column-fill":
    return "balance";

  case "column-gap":
    return data[index_map.indexOf("font-size")];

  case "column-rule":
    return "0px " + data[index_map.indexOf("color")];

  case "column-rule-color":
    return data[index_map.indexOf("color")];

  case "column-rule-style":
    return "none";

  case "column-rule-width":
    return "0px";

  case "column-span":
    return "none";

  case "column-width":
    return "auto";

  case "columns":
    return "auto";

  case "content":
    return "none";

  case "counter-increment":
    return "none";

  case "counter-reset":
    return "none";

  case "cue":
    return "";

  case "cue-after":
    return "none";

  case "cue-before":
    return "none";

  case "cursor":
    return "auto";

  case "direction":
    return "ltr";

  case "display":
    return "inline";

  case "display-align":
    return "auto";

  case "dominant-baseline":
    return "auto";

  case "empty-cells":
    return "show";

  case "enable-background":
    return "accumulate";

  case "fill":
    return "rgb(0, 0, 0)";

  case "fill-opacity":
    return "1";

  case "fill-rule":
    return "nonzero";

  case "filter":
    return "none";

  case "float":
    return "none";

  case "flood-color":
    return "rgb(0, 0, 0)";

  case "flood-opacity":
    return "1";

  case "font":
    return "";

  case "font-family":
    return "";

  case "font-size":
    return "16px";

  case "font-size-adjust":
    return "none";

  case "font-stretch":
    return "normal";

  case "font-style":
    return "normal";

  case "font-variant":
    return "normal";

  case "font-weight":
    return "400";

  case "glyph-orientation-horizontal":
    return "0";

  case "glyph-orientation-vertical":
    return "auto";

  case "height":
    return "0px";

  case "image-rendering":
    return "auto";

  case "input-format":
    return "";

  case "kerning":
    return "auto";

  case "left":
    return "auto";

  case "letter-spacing":
    return "0px";

  case "lighting-color":
    return "rgb(255, 255, 255)";

  case "line-height":
    return "normal";

  case "line-increment":
    return "auto";

  case "list-style":
    return "disc outside none";

  case "list-style-image":
    return "none";

  case "list-style-position":
    return "outside";

  case "list-style-type":
    return "disc";

  case "margin":
    return "0px";

  case "margin-bottom":
    return "0px";

  case "margin-left":
    return "0px";

  case "margin-right":
    return "0px";

  case "margin-top":
    return "0px";

  case "mark":
    return "";

  case "mark-after":
    return "";

  case "mark-before":
    return "";

  case "marker":
    return "none";

  case "marker-end":
    return "none";

  case "marker-mid":
    return "none";

  case "marker-offset":
    return "";

  case "marker-start":
    return "none";

  case "marks":
    return "none";

  case "mask":
    return "none";

  case "max-height":
    return "none";

  case "max-width":
    return "none";

  case "max-zoom":
    return "auto";

  case "min-height":
    return "0px";

  case "min-width":
    return "0px";

  case "min-zoom":
    return "auto";

  case "nav-down":
    return "auto";

  case "nav-index":
    return "auto";

  case "nav-left":
    return "auto";

  case "nav-right":
    return "auto";

  case "nav-up":
    return "auto";

  case "opacity":
    return "1";

  case "orientation":
    return "";

  case "orphans":
    return "2";

  case "outline":
    return "3px";

  case "outline-color":
    return "invert";

  case "outline-offset":
    return "0";

  case "outline-style":
    return "none";

  case "outline-width":
    return "3px";

  case "overflow":
    return "visible";

  case "overflow-x":
    return "visible";

  case "overflow-y":
    return "visible";

  case "padding":
    return "0px";

  case "padding-bottom":
    return "0px";

  case "padding-left":
    return "0px";

  case "padding-right":
    return "0px";

  case "padding-top":
    return "0px";

  case "page":
    return "auto";

  case "page-break-after":
    return "auto";

  case "page-break-before":
    return "auto";

  case "page-break-inside":
    return "auto";

  case "pause":
    return "";

  case "pause-after":
    return "";

  case "pause-before":
    return "";

  case "pointer-events":
    return "visiblePainted";

  case "position":
    return "static";

  case "quotes":
    return "none";

  case "resolution":
    return "";

  case "rest":
    return "";

  case "rest-after":
    return "";

  case "rest-before":
    return "";

  case "right":
    return "auto";

  case "row-span":
    return "";

  case "scrollbar-3dlight-color":
    return "";

  case "scrollbar-arrow-color":
    return "";

  case "scrollbar-base-color":
    return "";

  case "scrollbar-darkshadow-color":
    return "";

  case "scrollbar-face-color":
    return "";

  case "scrollbar-highlight-color":
    return "";

  case "scrollbar-shadow-color":
    return "";

  case "scrollbar-track-color":
    return "";

  case "shape-rendering":
    return "auto";

  case "size":
    return "portrait";

  case "src":
    return "";

  case "solid-color":
    return "rgb(0, 0, 0)";

  case "solid-opacity":
    return "1";

  case "speak":
    return "";

  case "stop-color":
    return "rgb(0, 0, 0)";

  case "stop-opacity":
    return "1";

  case "stroke":
    return "none";

  case "stroke-dasharray":
    return "none";

  case "stroke-dashoffset":
    return "0";

  case "stroke-linecap":
    return "butt";

  case "stroke-linejoin":
    return "miter";

  case "stroke-miterlimit":
    return "4";

  case "stroke-opacity":
    return "1";

  case "stroke-width":
    return "1";

  case "table-layout":
    return "auto";

  case "text-align":
    return "left";

  case "text-anchor":
    return "start";

  case "text-decoration":
    return "none";

  case "text-indent":
    return "0px";

  case "text-overflow":
    return "clip";

  case "text-rendering":
    return "auto";

  case "text-shadow":
    return "none";

  case "text-transform":
    return "none";

  case "top":
    return "auto";

  case "unicode-bidi":
    return "normal";

  case "user-zoom":
    return "zoom";

  case "vector-effect":
    return "none";

  case "vertical-align":
    return "baseline";

  case "viewport-fill":
    return "none";

  case "viewport-fill-opacity":
    return "1";

  case "visibility":
    return "visible";

  case "voice-family":
    return "";

  case "white-space":
    return "normal";

  case "widows":
    return "2";

  case "width":
    return "0px";

  case "word-spacing":
    return "0px";

  case "word-wrap":
    return "normal";

  case "writing-mode":
    return "lr-tb";

  case "zoom":
    return "auto";

  case "z-index":
    return "auto";

  default:
    opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
      "Initial value missing for " + prop + " in cls.Stylesheets.get_initial_value");
  }
};

cls.Stylesheets.inheritable_properties = {
  "-xv-voice-balance": true,
  "-xv-voice-pitch": true,
  "-xv-voice-pitch-range": true,
  "-xv-voice-rate": true,
  "-xv-voice-stress": true,
  "-xv-voice-volume": true,
  "alignment-baseline": true,
  "border-collapse": true,
  "border-spacing": true,
  "box-sizing": true,
  "caption-side": true,
  "cell-spacing": true,
  "color": true,
  "color-interpolation": true,
  "color-interpolation-filters": true,
  "color-rendering": true,
  "cursor": true,
  "direction": true,
  // "display": true, inherited in svg
  "display-align": true,
  "empty-cells": true,
  "font": true,
  "font-family": true,
  "font-size": true,
  "font-stretch": true,
  "font-style": true,
  "font-variant": true,
  "font-weight": true,
  "image-rendering": true,
  "letter-spacing": true,
  "line-height": true,
  "line-increment": true,
  "list-style": true,
  "list-style-image": true,
  "list-style-position": true,
  "list-style-type": true,
  "marker": true,
  "orphans": true,
  "overflow": true,
  "page": true,
  "page-break-inside": true,
  "pointer-events": true,
  "quotes": true,
  "scrollbar-3dlight-color": true,
  "scrollbar-arrow-color": true,
  "scrollbar-base-color": true,
  "scrollbar-darkshadow-color": true,
  "scrollbar-face-color": true,
  "scrollbar-highlight-color": true,
  "scrollbar-shadow-color": true,
  "scrollbar-track-color": true,
  "shape-rendering": true,
  "size": true,
  "speak": true,
  "stroke-linecap": true,
  "stroke-linejoin": true,
  "text-align": true,
  "text-anchor": true,
  "text-indent": true,
  "text-rendering": true,
  "text-shadow": true,
  "text-transform": true,
  "unicode-bidi": true,
  "visibility": true,
  "voice-family": true,
  "white-space": true,
  "widows": true,
  "word-spacing": true,
  "writing-mode": true
};

cls.Stylesheets.origins = {
  ORIGIN_USER_AGENT: 1, // default
  ORIGIN_LOCAL: 2, // user
  ORIGIN_AUTHOR: 3, // author
  ORIGIN_ELEMENT: 4, // inline
  ORIGIN_SVG: 5 // SVG presentation attribute
};

