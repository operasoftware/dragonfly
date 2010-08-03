window.cls || (window.cls = {});

window.cls.ColorPickerView = function(id, name, container_class)
{
  /* interface */
  this.createView = function(container){};
  /**
    * To show the color picker.
    * @param {Event} event. The event target is the color sample to be edited.
    */
  this.show_color_picker = function(event){};

  /* settings */
  this.show_in_views_menu = true;  
  this.window_top = 20;
  this.window_left = 20;
  this.window_width_with_alpha = 523;
  this.window_width = 376;
  this.window_height = 242;
  this.window_resizable = false;
  this.window_statusbar = false;

  /* private */
  const CSS_CLASS_TARGET = 'color-picker-target-element';

  this._edit_context = null;

  this._color_cb = function(color)
  {
    var color_value = '', context = this._edit_context;
    switch (color.type)
    {
      case color.HEX:
        color_value = color.hhex;
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
    context.ele_value.firstChild.nodeValue = color_value;
    context.ele_color_sample.style.backgroundColor = color_value;
    var script = "rule.style.setProperty(\"" + context.property_name + "\", " +
                                        "\"" + color_value + "\", null)";
    var msg = [context.rt_id, 0, 0, script, [["rule", context.rule_id]]];
    services['ecmascript-debugger'].requestEval(1, msg);
  }

  this._color_cb_bound = this._color_cb.bind(this);



  /* implementation */
  this.createView = function(container)
  {
    var color_picker = new ColorPicker(this._color_cb_bound, 
                                       this._edit_context.initial_color);
    container.render(color_picker.render());
  }

  this.show_color_picker = function(event)
  {
    var target = event.target, parent = target.parentNode;
    this._edit_context =
    {
      initial_color: new Color().parseCSSColor(target.style.backgroundColor),
      ele_value: parent,
      ele_color_sample: target,
      ele_container: parent.parentNode,
      property_name: parent.parentNode.getElementsByTagName('key')[0].textContent,
      rt_id: parseInt(parent.get_attr('parent-node-chain', 'rt-id')),
      rule_id: parseInt(parent.get_attr('parent-node-chain', 'rule-id')),
    }
    this._edit_context.ele_container.addClass(CSS_CLASS_TARGET);
    UIWindowBase.showWindow(this.id, 
                            this.window_top, 
                            this.window_left, 
                            typeof this._edit_context.initial_color.alpha == 'number' ?
                            this.window_width_with_alpha :
                            this.window_width,
                            this.window_height);
  }
  
  this.ondestroy = function()
  {
    this._edit_context.ele_container.removeClass(CSS_CLASS_TARGET);
    this._edit_context = null;
  }

  /* initialistaion */
  this.init(id, name, container_class);

}

window.cls.ColorPickerView.prototype = ViewBase;

window.eventHandlers.click['show-color-picker'] = function(event, target)
{
  window.views['color-selector'].show_color_picker(event);
};
