window.cls || (window.cls = {});

window.cls.ColorPickerView = function(id, name, container_class)
{

  this.createView = function(container){};
  this.show_in_views_menu = true;  
  this.window_top = 20;
  this.window_left = 20;
  this.window_width_with_alpha = 523;
  this.window_width = 376;
  this.window_height = 242;
  this.window_resizable = false;
  this.window_statusbar = false;
  this.cp_old_color = '';
  this.cp_style_prop = '';
  this.cp_rt_id = 0;
  this.cp_rule_id = 0;
  this.cp_color_sample = null;
  this.cp_value_container = null;
  this.colors = new Colors();
  
  this.cp_cb = function(color)
  {
    var color_value = '';
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
    this.cp_value_container.firstChild.nodeValue = color_value;
    this.cp_color_sample.style.backgroundColor = color_value;
    var script = "rule.style.setProperty(\"" + this.cp_style_prop + "\", " +
                                        "\"" + color_value + "\", null)";
    var msg = [this.cp_rt_id, 0, 0, script, [["rule", this.cp_rule_id]]];
    services['ecmascript-debugger'].requestEval(1, msg);
  }

  this.cp_cb_bound = this.cp_cb.bind(this);

  this.createView = function(container)
  {
    var color_picker = new ColorPicker(this.cp_cb_bound, this.cp_old_color);
    container.render(color_picker.render());
  }

  this.show_color_picker = function(event)
  {
    var target = event.target, cur_ele = target.parentNode;
    this.cp_color_sample = target;
    this.cp_old_color = this.colors.parseCSSColor(target.style.backgroundColor);
    this.cp_current_color = this.colors;
    this.cp_current_alpha = this.cp_old_color.alpha || 0;
    this.cp_value_container = cur_ele;
    this.cp_target_container = cur_ele.parentNode;
    this.cp_style_prop = cur_ele.parentNode.getElementsByTagName('key')[0].textContent;
    cur_ele = cur_ele.parentNode.parentNode;
    this.cp_rule_id = parseInt(cur_ele.getAttribute('rule-id'));
    this.cp_rt_id = parseInt(cur_ele.parentNode.getAttribute('rt-id'));
    this.cp_fade_ele = viewport.render(['div', 'class', 'black-50']);
    this.cp_target_container.addClass('color-picker-target-element');
    UIWindowBase.showWindow(this.id, 
                            this.window_top, 
                            this.window_left, 
                            typeof this.cp_old_color.alpha == 'number' ?
                            this.window_width_with_alpha :
                            this.window_width,
                            this.window_height);
  }
  
  this.ondestroy = function()
  {
    this.cp_fade_ele.parentNode.removeChild(this.cp_fade_ele);
    this.cp_target_container.removeClass('color-picker-target-element');
    this.cp_color_sample  = null;
    this.cp_old_color  = null;
    this.cp_value_container  = null;
    this.cp_target_container  = null;
    this.cp_style_prop  = null;
    this.cp_rule_id  = null;
    this.cp_rt_id  = null;
  };

  this.init(id, name, container_class);
}

window.cls.ColorPickerView.prototype = ViewBase;

window.eventHandlers.click['show-color-picker'] = function(event, target)
{
  window.views['color-selector'].show_color_picker(event);
  
};
