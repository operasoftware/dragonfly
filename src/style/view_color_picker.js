"use strict";

window.cls || (window.cls = {});

window.cls.ColorPickerView = function(id, name, container_class)
{
  this._es_debugger = window.services["ecmascript-debugger"];
  this._tag_manager = cls.TagManager.get_instance();

  /* interface */
  this.createView = function(container){};
  /**
    * To show the color picker.
    * @param {Object} target. The event target is the color sample to be edited.
    * @param {Object} edit_context. Optional.
    */
  this.show_color_picker = function(target, edit_context){};

  /* private */
  var CSS_CLASS_TARGET = window.cls.ColorPickerView.CSS_CLASS_TARGET;
  var ELE_CLASS = "color-picker";
  var MARGIN = 5; // Minimum vertical margin between the color picker and the edge of the viewport

  this.__defineGetter__("is_opened", function() {
    return this._edit_context;
  });

  this.__defineSetter__("is_opened", function() {});

  this._color_cb = function(color, callback)
  {
    var context = this._edit_context;
    context.current_color = color;
    if (context.callback)
    {
      context.callback(color);
    }
    else
    {
      if (!this._color_notation)
        this._color_notation = this._get_color_notation();
      var color_value = (color.type === "keyword")
                      ? color.cssvalue
                      : window.helpers.get_color_in_notation(color, this._color_notation);
      context.ele_value.firstChild.textContent = color_value;

      context.ele_color_swatch.removeClass("special");
      context.ele_color_swatch.querySelector(".color-swatch-fg-color").style.backgroundColor = color.rgba;

      var property_value_ele = context.ele_value.get_ancestor(".css-property-value");
      if (property_value_ele)
      {
        var new_value = window.helpers.escape_input(property_value_ele.textContent);
        var script = "";
        if (!context.is_svg)
        {
          // Removing it first is a workaround for CORE-31191
          script = "rule.style.removeProperty(\"" + context.prop_name + "\");" +
                   "rule.style.setProperty(\"" + context.prop_name + "\", " +
                                          "\"" + new_value + "\", " +
                                          "\"" + (context.is_important ? "important" : "") + "\")";
        }
        else
        {
          script = "rule.setAttribute(\"" + context.prop_name + "\", " +
                                     "\"" + new_value + "\")";
        }
        var msg = [context.rt_id, 0, 0, script, [["rule", context.rule_id]]];
        var tag = callback
                ? this._tag_manager.set_callback(null, callback)
                : this._tag_manager.IGNORE_RESPONSE;
        this._es_debugger.requestEval(tag, msg);
      }
    }
  };

  this._color_cb_bound = this._color_cb.bind(this);


  /* implementation */
  this.createView = function(container)
  {
    this._color_picker = new ColorPicker(this._color_cb_bound,
                                         this._edit_context.initial_color);
    container.style.visibility = "hidden";
    container.render(this._color_picker.render(this._edit_context.alpha_disabled,
                                               this._edit_context.palette_disabled));
    this._panel_ele = this._edit_context.ele_value.get_ancestor("container");
    if (this._panel_ele)
      this._panel_ele.addEventListener("mousewheel", this._prevent_scroll, true);
    this._position_color_picker();
    if (this._edit_context.z_index)
      container.style.zIndex = this._edit_context.z_index;
    container.style.visibility = "visible";
    window.addEventListener("click", this._hide_on_outside_click, true);
  };

  this.ondestroy = function()
  {
    this._tooltip.hide();
    if (this._ele)
      this._ele.parentNode.removeChild(this._ele);

    if (this._edit_context)
      this._edit_context.ele_value.removeClass("color-picker-active-item");

    if (this._panel_ele)
      this._panel_ele.removeEventListener("mousewheel", this._prevent_scroll, true);

    window.removeEventListener("click", this._hide_on_outside_click, true);
    this._edit_context = null;
    this._ele = null;
  };

  this._prevent_scroll = function(event)
  {
    event.preventDefault();
  }.bind(this);

  this.show_color_picker = function(target, edit_context)
  {
    if (this.is_opened)
      this.ondestroy();

    var parent = target.parentNode;
    var declaration_ele = target.get_ancestor(".css-declaration");
    var property_ele = declaration_ele && declaration_ele.querySelector(".css-property");
    var value_ele = declaration_ele && declaration_ele.querySelector(".css-property-value");
    var property = property_ele && property_ele.textContent;
    var value = value_ele && value_ele.textContent;
    var color_value = parent.textContent;
    var initial_color = new Color().parseCSSColor(color_value);

    this._edit_context = edit_context || {
      initial_color: initial_color,
      current_color: initial_color,
      ele_value: parent,
      ele_color_swatch: target,
      prop_name: property,
      vertical_anchor_selector: ".color-swatch",
      horizontal_anchor_selector: "container",
      is_important: Boolean(value_ele.querySelector(".css-priority")),
      rt_id: Number(parent.get_attr("parent-node-chain", "rt-id")),
      rule_id: Number(parent.get_attr("parent-node-chain", "rule-id")) ||
               Number(parent.get_attr("parent-node-chain", "obj-id")),
      is_svg: parent.get_attr("parent-node-chain", "rule-id") == "element-svg"
    };

    if (this._edit_context.initial_color)
    {
      this._finalize_show_color_picker();
    }
    else
    {
      var prop = {
        "inherit": property,
        "currentColor": "color"
      }[color_value];
      var obj_id = Number(parent.get_attr("parent-node-chain", "obj-id"));
      var script = "window.getComputedStyle(ele, null)." +
                   "getPropertyValue(\"" + prop + "\");";
      var tag = this._tag_manager.set_callback(this, this._handle_get_color, [color_value]);
      var msg = [this._edit_context.rt_id, 0, 0, script, [["ele", obj_id]]];
      this._es_debugger.requestEval(tag, msg);
    }
  };

  this.cancel_edit_color = function()
  {
    if (this.is_opened)
    {
      this._color_cb_bound(this._edit_context.initial_color, window.element_style.update);
      this.ondestroy();
      return true;
    }
    return false;
  };

  this._hide_on_outside_click = function(event)
  {
    if (ContextMenu.get_instance().is_visible)
      return;

    if (!(event.target.get_ancestor("." + ELE_CLASS) ||
          event.target.get_ancestor(".color-picker-palette") ||
          event.target.get_ancestor(".tooltip-container"))
    )
    {
      this.ondestroy();
      // Clicking directly on a new color swatch should work
      if (!event.target.get_ancestor(".color-swatch"))
      {
        event.stopPropagation();
        event.preventDefault();
        window.element_style.update();
      }
    }
  }.bind(this);

  this._handle_get_color = function(status, message, color_value)
  {
    var TYPE = 1;
    var VALUE = 2;
    if (!status && message[TYPE] == 'string' && this._edit_context)
    {
      var context = this._edit_context;
      if (context.initial_color = new Color().parseCSSColor(message[VALUE]))
      {
        context.current_color = context.initial_color;
        context.initial_color.cssvalue = color_value;
        context.initial_color.type = context.initial_color.KEYWORD;
        this._finalize_show_color_picker();
      }
    }
    else
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      '_handle_get_color failed in ColorPickerView');
    }
  };

  this._finalize_show_color_picker = function()
  {
    this._ele = document.createElement("div");
    this._ele.className = ELE_CLASS;
    document.documentElement.appendChild(this._ele);
    this._edit_context.ele_value.addClass("color-picker-active-item");
    this.createView(this._ele);
  };

  this._on_setting_change = function(setting)
  {
    if (setting.key === "color-notation")
      this._color_notation = this._get_color_notation();
  };

  this._get_color_notation = function()
  {
    return window.settings["dom-side-panel"].get("color-notation");
  };

  this._position_color_picker = function()
  {
    var ADJUSTMENT = 2;
    var context = this._edit_context;
    var color_picker_dim = this._ele.getBoundingClientRect();
    var v_anchor = context.ele_value.querySelector(context.vertical_anchor_selector);
    var h_anchor = context.ele_value.get_ancestor(context.horizontal_anchor_selector);
    var v_anchor_dim = (v_anchor || context.ele_value).getBoundingClientRect();
    var h_anchor_dim = (h_anchor || context.ele_value).getBoundingClientRect();
    var arrow = this._ele.querySelector(".color-picker-arrow");
    var arrow_dim = arrow.getBoundingClientRect();
    var top = Math.max(MARGIN,
                       Math.min(v_anchor_dim.top -
                                Math.round((color_picker_dim.height / 2) -
                                           (v_anchor_dim.height / 2)),
                                window.innerHeight - color_picker_dim.height - MARGIN)
                      );
    var arrow_top = Math.max(MARGIN,
                             Math.min(v_anchor_dim.top +
                                      Math.round((v_anchor_dim.height / 2) -
                                                 (arrow_dim.height / 2)) - top,
                                      color_picker_dim.height - arrow_dim.height - MARGIN
                                     )
                            );
    arrow.style.top = arrow_top + "px";
    this._ele.style.top = top + "px";
    // Simplistic check if the color picker fits to the left, otherwise, flip it.
    // This assumes that panels are on the right side.
    if (h_anchor_dim.left > color_picker_dim.width)
    {
      this._ele.style.left = (h_anchor_dim.left - color_picker_dim.width + ADJUSTMENT) + "px";
    }
    else if (window.innerWidth - h_anchor_dim.right > color_picker_dim.width)
    {
      this._ele.addClass("right-aligned");
      this._ele.style.left = h_anchor_dim.right - ADJUSTMENT + "px";
    }
    else
    {
      this._ele.addClass("right-aligned");
      this._ele.style.left = v_anchor_dim.right + arrow_dim.width + ADJUSTMENT + "px";
    }
  };

  this._update_palette_dropdown = function()
  {
    var palette_dropdown = this._ele.querySelector(".color-picker-palette-dropdown");
    if (palette_dropdown)
      palette_dropdown.re_render(window.templates.color_picker_palette_dropdown());
  };

  this._init = function(id, name, container_class)
  {
    this.init(id, name, container_class);
    this._color_picker = null;
    this._edit_context = null;
    this._color_notation = null;
    this._ele = null;
    this._panel_ele = null;
    this._tooltip = Tooltips.register("color-palette", true);

    this._tooltip.ontooltip = function(event, target) {
      var box = target.getBoundingClientRect();
      box.mouse_x = box.left;
      this.show(window.templates.color_picker_palette(), box);
    };

    window.messages.addListener("setting-changed", this._on_setting_change.bind(this));

    window.eventHandlers.click["show-color-picker"] = function(event, target)
    {
      this.show_color_picker(event.target.get_ancestor(".color-swatch"));
    }.bind(this);

    window.eventHandlers.click["color-picker-cancel"] = function(event, target)
    {
      this.cancel_edit_color();
    }.bind(this);

    window.eventHandlers.click["color-picker-ok"] = function(event, target)
    {
      this.ondestroy();
      window.element_style.update();
    }.bind(this);

    window.eventHandlers.click["set-color-picker-color"] = function(event, target)
    {
      if (!this.is_opened)
        return;
      this._color_picker.update(target.getAttribute("data-color"));
    }.bind(this);

    window.eventHandlers.click["add-color-picker-color"] = function(event, target)
    {
      if (!this.is_opened)
        return;
      cls.ColorPalette.get_instance().store_color(this._edit_context.current_color.hex);
      target.get_ancestor(".color-picker-palette").re_render(window.templates.color_picker_palette());
      this._update_palette_dropdown();
    }.bind(this);

    var menu = [
      {
        callback: function(event, target) {
          if (target.get_ancestor("[data-color-id]"))
          {
            return {
              label: ui_strings.M_CONTEXTMENU_DELETE_COLOR,
              handler: function(event, target) {
                var list_item = event.target.has_attr("parent-node-chain", "data-color-id");
                var color_id = list_item && Number(list_item.getAttribute("data-color-id"));
                if (color_id && cls.ColorPalette.get_instance().delete_color(color_id))
                  list_item.parentNode.removeChild(list_item);
                this._update_palette_dropdown();
              }.bind(this)
            }
          }
        }.bind(this)
      }
    ];
    ContextMenu.get_instance().register("color-picker-palette", menu);
  };

  this._init(id, name, container_class);
};

window.cls.ColorPickerView.CSS_CLASS_TARGET = "color-picker-target-element";

window.cls.ColorPickerView.prototype = ViewBase;

