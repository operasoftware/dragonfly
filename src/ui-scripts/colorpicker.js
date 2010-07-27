var ColorPicker = function(cb, color)
{
  this._init(cb, color);
}

ColorPicker.prototype = new function()
{
  this._verify_inputs =
  {
    h: {min:0, max: 360, last: 0, base: 10},
    s: {min:0, max: 100, last: 0, base: 10},
    v: {min:0, max: 100, last: 0, base: 10},
    r: {min:0, max: 255, last: 0, base: 10},
    g: {min:0, max: 255, last: 0, base: 10},
    b: {min:0, max: 255, last: 0, base: 10},
    hex: {min:0, max: 0xFFFFFF, last: 0, base: 16},
  }
  
  this._verify = function(input, check)
  {
    var ret = parseInt(input, check.base);
    if (typeof ret == 'number' && !isNaN(ret) && 
        ret >= check.min && ret <= check.max)
    {
      if (check.base == 16)
      {
        if (/^[0-9a-fA-F]{0,6}$/.test(input))
          check.last = input;
      }
      else
        check.last = ret;
    }
    return check.last;
  }
 
  this._oninput = function(event)
  {
    if (event.target.name in this._verify_inputs && event.target.value)
    {
      event.target.value = 
        this._cs[event.target.name] = 
        this._verify(event.target.value, this._verify_inputs[event.target.name]);
      this._set_coordinates();
      this._set_cs_coordinates();
      this._cs_cb.copyColor(this._cs);
      this._update_inputs(event.target.name);
      this._update_xy();
      this._update_z();
      this._update_new_color();
      this._update_slider();
      this._cb(this._cs_cb);
    }
  }
  
  this._onclick = function(event)
  {
    if (event.target.nodeName == 'rect')
    {
      var box = event.target.getBoundingClientRect();
      var x = (event.clientX - box.left) / box.width;
      var y = 1 - (event.clientY - box.top) / box.height;
      var z = y;
      var ele = event.target, handler = '';
      while (ele && !(handler = ele.getAttribute('data-handler')))
        ele = ele.parentNode;
      if (handler && ('_' + handler) in this)
        this['_' + handler](x, y, z);
    }
  }
  
  this._onchange = function(event)
  {
    if (event.target.name == 'color-space')
      this._set_color_space(event.target.value);
  }
  
  this._onxy = function(x, y, z)
  {
    this._cur_x = x;
    this._cur_y = y;
    this._set_cs_coordinates();
    this._cs_cb.copyColor(this._cs);
    this._update_inputs();
    this._update_z();
    this._update_new_color();
    this._update_pointer();
    this._cb(this._cs_cb);
  }
  
  this._onz = function(x, y, z, setter)
  {
    this._cur_z = z;
    this._set_cs_coordinates();
    this._cs_cb.copyColor(this._cs);
    this._update_inputs();
    this._update_xy();
    this._update_new_color();
    if (setter != this._slider)
      this._slider.z = 1 - z;
    this._cb(this._cs_cb);
  }
  
  this._onremove = function(event)
  {
    if (event.target.nodeType == 1 && event.target.contains(this._color_picker))
    {
      this._color_picker.removeEventListener('input', this._oninput_bound, false);
      this._color_picker.removeEventListener('click', this._onclick_bound, false);
      this._color_picker.removeEventListener('change', this._onchange_bound, false);
      document.removeEventListener('DOMNodeRemoved', this._onremove_bound, false);
      this._color_picker = null; 
      this._inputs = null;
      this._new_color = null;
      this._slider.onz = null;
      this._slider = null;
      this._pointer = null;
      this._graphic_2d = null;
      this._graphic_1d = null;
    }
  }
  
  this._update_inputs = function(setter)
  {
    for (var input = null, i = 0; input = this._inputs[i]; i++)
      if (input.name != setter)
        input.value = this._verify(this._cs[input.name], 
                                   this._verify_inputs[input.name]);
  }
  
  this._update_slider = function()
  {
    this._slider.z = 1 - this._cur_z;
  }
  
  this._update_pointer = function()
  {
    this._pointer.x = this._cur_x;
    this._pointer.y = 1 - this._cur_y;
    var cs = this._cs.xyz(this._cur_x, this._cur_y, this._cur_z);
    this._pointer.update_color(
      (cs.r / 2.55 * 0.2125) + (cs.g / 2.55 * 0.7154) + (cs.b / 2.55 * 0.0721));
  }
  
  this._update_xy = function()
  {
    this._update_pointer();
    this.__update_xy();
  }
  
  this._update_sv = function()
  {
    this._graphic_2d.clearAndRender(window.templates.gradient_2(
      ['#fff', this._cs.xyz(1, 1, this._cur_z).hhex], 
      ['#000']));
  }
  
  this._update_hs = 
  this._update_hv = function()
  {
    this._graphic_2d.clearAndRender(window.templates.gradient_2(
      [
        this._cs.xyz(0/6, 1, this._cur_z).hhex,
        this._cs.xyz(1/6, 1, this._cur_z).hhex,
        this._cs.xyz(2/6, 1, this._cur_z).hhex,
        this._cs.xyz(3/6, 1, this._cur_z).hhex,
        this._cs.xyz(4/6, 1, this._cur_z).hhex,
        this._cs.xyz(5/6, 1, this._cur_z).hhex,
        this._cs.xyz(6/6, 1, this._cur_z).hhex,
      ], 
      [this._cs.xyz(0, 0, this._cur_z).hhex]));
  }
  
  this._update_rg =
  this._update_br =
  this._update_bg = function()
  {
    this._graphic_2d.clearAndRender(window.templates.gradient_2(
      [this._cs.xyz(0, 1, this._cur_z).hhex, this._cs.xyz(1, 1, this._cur_z).hhex], 
      [this._cs.xyz(0, 0, this._cur_z).hhex, this._cs.xyz(1, 0, this._cur_z).hhex]
      ));
  }
    
  this._update_r = 
  this._update_g =
  this._update_b =
  this._update_s =
  this._update_v = function()
  {
    this._graphic_1d.clearAndRender(window.templates.gradient(
      [
        this._cs.xyz(this._cur_x, this._cur_y, 0).hhex, 
        this._cs.xyz(this._cur_x, this._cur_y, 1).hhex
      ], true));
  }
    
  this._update_h = function()
  {
    this._graphic_1d.innerHTML = '';
    this._graphic_1d.render(window.templates.gradient(
      ['#f00', '#ff0', '#0f0', '#0ff', '#00f', '#f0f', '#f00'], true));
  }
    
  this._update_new_color = function()
  {
    this._new_color.style.backgroundColor = 
      this._cs.xyz(this._cur_x, this._cur_y, this._cur_z).hhex;
  }
  
  this._update = function()
  {
    this._set_coordinates();
    this._update_xy();
    this._update_z();
    this._update_new_color();  
    this._update_inputs();
    this._update_slider();
  }
    
  this._color_properties =
  {
    'h': [360, 'setHue', 'getHue'],
    's': [100, 'setSaturationV', 'getSaturationV'],
    'v': [100, 'setValue', 'getValue'],
    'r': [255, 'setRed', 'getRed'],
    'g': [255, 'setGreen', 'getGreen'],
    'b': [255, 'setBlue', 'getBlue']
  }
    
  this._set_color_space = function(color_space)
  {
    var color = this._cs.hex;
    color_space = color_space.split('-');
    var coordinates = ['x', 'y', 'z'];
    for (var i = 0, props; i < 3; i++)
    {
      props = this._color_properties[color_space[i]];
      this._cs.property(coordinates[i], props[0], props[1], props[2]);
    }
    this.__update_xy = this['_update_' + color_space[0] + color_space[1]];
    this._update_z = this['_update_' + color_space[2]];
    this._cs.hex = color;
    this._update();
  }
  
  this._set_cs_coordinates = function()
  {
    this._cs.x = this._cur_x
    this._cs.y = this._cur_y;
    this._cs.z = this._cur_z;
  }
  
  this._set_coordinates = function()
  {
    this._cur_x = this._cs.x;
    this._cur_y = this._cs.y;
    this._cur_z = this._cs.z;
  }
  
  const
  CP_CLASS = "color-picker-popup",
  CP_2D_CLASS = "color-picker-2-d-graphic",
  CP_1D_CLASS = "color-picker-1-d-graphic",
  CP_OLD_CLASS = "color-picker-color-old",
  CP_NEW_CLASS = "color-picker-color",
  SLIDER_BASE_CLASS = 'color-picker-slider-base', 
  SLIDER_CLASS = 'color-picker-slider',
  POINTER_CLASS = 'color-picker-pointer';
  
  this._setup = function(event)
  {
    var colorpicker = 
    event.target.getElementsByClassName(CP_CLASS)[0] ||
    (event.target.hasClass(CP_CLASS) && event.target);
      
    if (colorpicker)
    {
      document.removeEventListener('DOMNodeInserted', this._setup_bound, false);
      this._color_picker = colorpicker; 
      this._inputs = Array.prototype.slice.call
      (this._color_picker.getElementsByTagName('input')).filter(function(input)
      {
        return ['h', 's', 'v', 'r', 'g', 'b', 'hex'].indexOf(input.name) != -1;
      });
      this._new_color = document.getElementsByClassName(CP_NEW_CLASS)[0];
      var graphic_2d_container = document.getElementsByClassName(CP_2D_CLASS)[0];
      var graphic_1d_container = document.getElementsByClassName(CP_1D_CLASS)[0];
      this._slider = new Slider(graphic_1d_container, SLIDER_BASE_CLASS, 
                                SLIDER_CLASS, 0, 1);
      this._slider.onz = (function(z)
      {
        this._onz(0, 0, 1 - z, this._slider);
      }).bind(this);
      this._pointer = new Pointer(graphic_2d_container, POINTER_CLASS);
      this._graphic_2d = graphic_2d_container.getElementsByTagName('div')[0];
      this._graphic_1d = graphic_1d_container.getElementsByTagName('div')[0];
      var old_color = document.getElementsByClassName(CP_OLD_CLASS)[0];
      var style_dec = window.getComputedStyle(old_color, null);
      var old_color_value = style_dec.getPropertyValue('background-color');
      this._cs.hex = old_color_value.slice(1);
      this._set_color_space('s-v-h');
      this._color_picker.addEventListener('input', this._oninput_bound, false);
      this._color_picker.addEventListener('click', this._onclick_bound, false);
      this._color_picker.addEventListener('change', this._onchange_bound, false);
      document.addEventListener('DOMNodeRemoved', this._onremove_bound, false);
    }
  }
  
  this.render = function()
  {
    document.addEventListener('DOMNodeInserted', this._setup_bound, false);
    return window.templates.color_picker_2(this._old_color, CP_CLASS, CP_2D_CLASS, 
                                         CP_1D_CLASS, CP_OLD_CLASS, CP_NEW_CLASS, 'h')
  }
  
  this._init = function(cb, color)
  {
    this._cb = cb;
    this._old_color = color;
    this._cs = new ColorSpace();
    this._cs_cb = new Colors();
    this._cur_x = 0;
    this._cur_y = 0;
    this._cur_z = 0;
    this._setup_bound = this._setup.bind(this);
    this._oninput_bound = this._oninput.bind(this);
    this._onclick_bound = this._onclick.bind(this);
    this._onchange_bound = this._onchange.bind(this);
    this._onremove_bound = this._onremove.bind(this);
  }
  
};
