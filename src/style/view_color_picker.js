window.cls || (window.cls = {});

window.cls.ColorPickerView = function(id, name, container_class)
{
  /* interface */
  this.createView = function(container){};
  /**
    * To show the color picker.
    * @param {Object} target. The event target is the color sample to be edited.
    * @param [Object} edit_context. Optional.
    */
  this.show_color_picker = function(target, edit_context){};

  /* settings */
  this.show_in_views_menu = true;
  this.window_top = 20;
  this.window_left = 20;
  this.window_width_with_alpha = 523;
  this.window_width = 376;
  this.window_height = 244;
  this.window_resizable = false;
  this.window_statusbar = false;

  // TODO: this should be calculated
  const PALETTE_HEIGHT = 24;
  const MAX_SWATCHES = 15;

  /* private */
  const CSS_CLASS_TARGET = window.cls.ColorPickerView.CSS_CLASS_TARGET;

  this._edit_context = null;

  this._color_cb = function(color)
  {
    var color_value = '', context = this._edit_context;
    if (context.callback)
    {
      context.callback(color);
    }
    else
    {
      switch (color.type)
      {
        case color.HEX:
          color_value = color.hhex.toUpperCase();
          break;
        case color.RGB:
        case color.RGBA:
        case color.HSL:
        case color.HSLA:
          color_value = color[color.type];
          break;
        case color.KEYWORD:
          color_value = color.cssvalue;
          break;
      }

      context.ele_value.firstChild.textContent = color_value;
      context.ele_color_sample.style.backgroundColor = color_value;
      var property_value_ele = context.ele_container.get_ancestor(".css-property-value");
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
        var tag = window.tag_manager.set_callback(this, window.element_style.update);
        services['ecmascript-debugger'].requestEval(tag, msg);
      }
    }
  }

  this._color_cb_bound = this._color_cb.bind(this);



  /* implementation */
  this.createView = function(container)
  {
    var color_picker = new ColorPicker(this._color_cb_bound,
                                       this._edit_context.initial_color);
    container.clearAndRender(color_picker.render());
  }

  this.show_color_picker = function(target, edit_context)
  {
    var parent = target.parentNode;
    if (!parent.parentNode.hasClass('disabled'))
    {
      var declaration_ele = target.get_ancestor(".css-declaration");
      var property_ele = declaration_ele && declaration_ele.querySelector(".css-property");
      var value_ele = declaration_ele && declaration_ele.querySelector(".css-property-value");
      var property = property_ele && property_ele.textContent;
      var value = value_ele && value_ele.textContent;

      if (this._edit_context)
        this._edit_context.ele_container.removeClass(this._edit_context.edit_class ||
                                                     CSS_CLASS_TARGET);

      this._edit_context = edit_context ||
      {
        initial_color: new Color().parseCSSColor(target.parentNode.textContent),
        ele_value: parent,
        ele_color_sample: target,
        ele_container: parent.parentNode,
        prop_name: property,
        is_important: Boolean(value_ele.querySelector(".css-priority")),
        rt_id: parseInt(parent.get_attr('parent-node-chain', 'rt-id')),
        rule_id: parseInt(parent.get_attr('parent-node-chain', 'rule-id')) ||
                 parseInt(parent.get_attr('parent-node-chain', 'obj-id')),
        is_svg: parent.get_attr('parent-node-chain', 'rule-id') == "element-svg"
      }
      if (this._edit_context.initial_color)
        this._finalize_show_color_picker();
      else
      {
        switch (target.style.backgroundColor)
        {
          case 'inherit':
          case 'currentColor':
          {
            var obj_id = parseInt(parent.get_attr('parent-node-chain', 'obj-id'));
            var script = "window.getComputedStyle(ele, null)." +
                         "getPropertyValue(\"" + this._edit_context.prop_name+ "\");";
            var tag = window.tag_manager.set_callback(this, this._handle_get_color);
            var msg = [this._edit_context.rt_id, 0, 0, script, [["ele", obj_id]]];
            window.services['ecmascript-debugger'].requestEval(tag, msg);
            break;
          }
        }
      }
    }
  }

  this.cancel_edit_color = function()
  {
    if (UIWindowBase.is_window_visible(this.id))
    {
      this._color_cb_bound(this._edit_context.initial_color);
      UIWindowBase.closeWindow(this.id);
      return true;
    }
    return false;
  };

  this._handle_get_color = function(status, message)
  {
    const TYPE = 1, VALUE = 2;
    var context = this._edit_context;
    if (!status && message[TYPE] == 'string')
    {
      if (context.initial_color = new Color().parseCSSColor(message[VALUE]))
      {
        context.initial_color.cssvalue = 'inherit';
        context.initial_color.type = context.initial_color.KEYWORD;
        this._finalize_show_color_picker();
      }
    }
    else
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      '_handle_get_color failed in ColorPickerView');
  }

  this._finalize_show_color_picker = function()
  {
    this._edit_context.ele_container.addClass(this._edit_context.edit_class ||
                                              CSS_CLASS_TARGET);
    var height = this.window_height;
    var palette = cls.ColorPalette.get_instance().get_color_palette();

    if (palette.length > 0)
    {
      height += PALETTE_HEIGHT;
    }

    if (palette.length > MAX_SWATCHES)
    {
      height += defaults["scrollbar-width"];
    }
    
    var width = typeof this._edit_context.initial_color.alpha == 'number'
              ? this.window_width_with_alpha
              : this.window_width;

    UIWindowBase.showWindow(this.id,
                            this.window_top,
                            this.window_left,
                            width,
                            height).set_width(width);
  }          

  this.ondestroy = function()
  {
    this._edit_context.ele_container.removeClass(this._edit_context.edit_class ||
                                                 CSS_CLASS_TARGET);
    this._edit_context = null;
  }

  /* initialistaion */
  this.init(id, name, container_class);

}

window.cls.ColorPickerView.CSS_CLASS_TARGET = 'color-picker-target-element';

window.cls.ColorPickerView.prototype = ViewBase;

window.eventHandlers.click['show-color-picker'] = function(event, target)
{
  window.views['color-selector'].show_color_picker(event.target);
};
