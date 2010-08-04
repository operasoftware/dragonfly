/**
  * To create a color picker.
  * The class has a single method render which returns a template
  * to be render with Element.render. The call of that method will also add 
  * an event listener for DOMNodeInserted to setup the color picker (checked 
  * with the class name of the container element). The setup call will add 
  * an according listener for DOMNodeRemoved which will clean up any state 
  * and listeners, that means removing the color picker from the DOM will 
  * clean up automatically.
  * @param {Function} cb. A callback called for each new color selection
  * with an instance of Color as argument.
  * @param {Color} color. The initial color.
  * @constructor
  */

var ColorPicker = function(cb, color)
{
  this._init(cb, color);
}

ColorPicker.prototype = new function()
{
  /* interface */
  this.render = function(){};

  /* constants */
  const
  CP_CLASS = "color-picker-popup",
  CP_2D_CLASS = "color-picker-2-d-graphic",
  CP_1D_CLASS = "color-picker-1-d-graphic",
  CP_OLD_CLASS = "color-picker-color-old",
  CP_NEW_CLASS = "color-picker-color",
  SLIDER_BASE_CLASS = 'color-picker-slider-base', 
  SLIDER_CLASS = 'color-picker-slider',
  POINTER_CLASS = 'color-picker-pointer',
  CP_ALPHA_CLASS = "color-picker-alpha",
  CP_ALPHA_BG = "color-picker-number alpha";

  /* private */
  this._verify_inputs =
  {
    h: {min:0, max: 360, last: 0, base: 10},
    s: {min:0, max: 100, last: 0, base: 10},
    v: {min:0, max: 100, last: 0, base: 10},
    r: {min:0, max: 255, last: 0, base: 10},
    g: {min:0, max: 255, last: 0, base: 10},
    b: {min:0, max: 255, last: 0, base: 10},
    hex: {min:0, max: 0xFFFFFF, last: 0, base: 16},
    alpha: {min:0, max: 1, last: 0, base: 10},
  }
  
  this._verify = function(input, check)
  {
    var ret = (check.max == 1 ? parseFloat : parseInt)(input, check.base);
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
 
  // generic DOM input event handler on the container element of the color picker
  this._oninput = function(event)
  {
    if (event.target.name in this._verify_inputs && event.target.value)
    {
      var target = event.target;
      var verifier = this._verify_inputs[target.name];
      var value = this._verify(target.value, verifier);
      this._cs[target.name] = value;
      target.value = verifier.max == 1 ? value.toFixed(3) : value;
      this._set_coordinates();
      this._set_cs_coordinates();
      this._cb_color.clone(this._cs);
      this._update_inputs(event.target.name);
      this._update_xy_graphic();
      this._update_xy_slider();
      this._update_xy_slider_color();
      this._update_z_graphic();
      this._update_z_slider();
      this._update_alpha_graphic();
      this._update_alpha_slider();
      this._update_sample_color();
      this._cb(this._cb_color);
    }
  }
  
  // generic DOM click event handler on the container element of the color picker
  this._onclick = function(event)
  {
    // TODO implement the stored color samples.
    var color_value = event.target.get_attr('parent-node-chain', 'data-color');
    var color = null;
    if (color_value)
    {
      if (color_value == 'cancel')
        color = this._initial_color;
      this._cs.clone(color);
      this._cb_color.clone(color);
      if (color.type == color.KEYWORD)
        this._cs.type = typeof color.alpha == 'number' ? color.RGBA : color.HEX;
      this._update();
      this._cb(this._cb_color);

    }
  }
  
  // generic DOM change event handler on the container element of the color picker
  this._onchange = function(event)
  {
    if (event.target.name == 'color-space')
      this._set_color_space(event.target.value);
  }
  
  // callback for the x-y axes slider.
  this._onxy = function(x, y)
  {
    this._cur_x = x;
    this._cur_y = y;
    this._set_cs_coordinates();
    this._cb_color.clone(this._cs);
    this._update_inputs();
    this._update_xy_slider_color();
    this._update_z_graphic();
    this._update_alpha_graphic();
    this._update_sample_color();
    this._cb(this._cb_color);
  }
  
  // callback for the z axis slider.
  this._onz = function(z)
  {
    this._cur_z = z;
    this._set_cs_coordinates();
    this._cb_color.clone(this._cs);
    this._update_inputs();
    this._update_xy_graphic();
    this._update_xy_slider_color();
    this._update_alpha_graphic();
    this._update_sample_color();
    this._cb(this._cb_color);
  }

  // callback for the alpha slider
  this._onalpha = function(alpha)
  {
    this._cs.alpha = alpha;
    this._cb_color.clone(this._cs);
    this._update_sample_color();
    this._update_inputs(null, ['alpha']);
    this._cb(this._cb_color); 
  };
  
  // DOMNodeRemoved event handler
  this._onremove = function(event)
  {
    if (event.target.nodeType == 1 && event.target.contains(this._ele))
    {
      document.removeEventListener('DOMNodeRemoved', this._onremove_bound, false); 
      this._ele.removeEventListener('input', this._oninput_bound, false);
      this._ele.removeEventListener('click', this._onclick_bound, false);
      this._ele.removeEventListener('change', this._onchange_bound, false);
      this._ele = null; 
      this._ele_inputs = null;
      this._ele_sample_color = null;
      this._ele_sample_color_solid = null;
      this._ele_xy_graphic = null;
      this._ele_z_graphic = null;
      this._ele_alpha_graphic = null;
      this._ele_xy_slider = null;
      this._xy_slider = null;
      this._z_slider = null;
      this._alpha_slider = null;
    }
  }
  
  // methods to upadte parts of the view

  // update all the inputs
  this._update_inputs = function(setter, inputs_to_update)
  {
    for (var input = null, i = 0; input = this._ele_inputs[i]; i++)
    {
      if (input.name != setter && 
          (!inputs_to_update || inputs_to_update.indexOf(input.name) > -1))
      {
        input.value = this._verify_inputs[input.name].max == 1 ? 
                      this._cs[input.name].toFixed(3) : 
                      this._cs[input.name]; 
      }
    }
  }
  
  // update the position of the slider for the z-axis
  this._update_z_slider = function()
  {
    this._z_slider.y = this._cur_z;
  }
  
  // update the position of the slider foe the x-y axes
  this._update_xy_slider = function()
  {
    this._xy_slider.x = this._cur_x;
    this._xy_slider.y = this._cur_y;
  }
  
  // update the color of the slider for the x-y axes
  this._update_xy_slider_color = function()
  { 
    var gray_value = this._cs.xyz(this._cur_x, 
                                  this._cur_y, 
                                  this._cur_z).getGrayValue() / 255;
    this._ele_xy_slider.setAttribute('stroke', 
                                      gray_value > .3 ? 
                                     'hsl(0, 0%, 20%)' : 
                                     'hsl(0, 0%, 80%)'); 
  }
  
  // update the sample color
  this._update_sample_color = function()
  {
    var color = this._cs.xyz(this._cur_x, this._cur_y, this._cur_z);
    this._ele_sample_color.style.backgroundColor = 
      this._has_alpha ? color.rgba : color.hex;
  }

  // update the position of the slider foe the lpha value
  this._update_alpha_slider = function()
  {
    if (this._has_alpha)
      this._alpha_slider.y = this._cs.alpha;
  }
  
  // update everything
  this._update = function()
  {
    this._set_coordinates();
    this._update_inputs();
    this._update_xy_graphic();
    this._update_xy_slider();
    this._update_xy_slider_color();
    this._update_z_graphic();
    this._update_z_slider();
    this._update_alpha_graphic();
    this._update_alpha_slider();
    this._update_sample_color(); 
  }
  
  /**
    * Update methods for the graphics of a given color cube.
    * The color picker supports one of the following color spaces:
    * 's-v-h', 'h-v-s', 'h-s-v', 'b-g-r', 'b-r-g' or 'r-g-b'. 
    * Each token has its update method, e.g. 's-v-h' will match 
    * an '_update_sv' and an '_update_h' method.
  */

  this._update_sv = function()
  {
    this._ele_xy_graphic.clearAndRender(window.templates.gradient_2d
    (
      ['#fff', this._cs.xyz(1, 1, this._cur_z).hhex], 
      ['#000']
    ));
  }
  
  this._update_hs = 
  this._update_hv = function()
  {
    this._ele_xy_graphic.clearAndRender(window.templates.gradient_2d
    (
      [
        this._cs.xyz(0/6, 1, this._cur_z).hhex,
        this._cs.xyz(1/6, 1, this._cur_z).hhex,
        this._cs.xyz(2/6, 1, this._cur_z).hhex,
        this._cs.xyz(3/6, 1, this._cur_z).hhex,
        this._cs.xyz(4/6, 1, this._cur_z).hhex,
        this._cs.xyz(5/6, 1, this._cur_z).hhex,
        this._cs.xyz(6/6, 1, this._cur_z).hhex,
      ], 
      [this._cs.xyz(0, 0, this._cur_z).hhex]
    ));
  }
  
  this._update_rg =
  this._update_br =
  this._update_bg = function()
  {
    this._ele_xy_graphic.clearAndRender(window.templates.gradient_2d
    (
      [
        this._cs.xyz(0, 1, this._cur_z).hhex, 
        this._cs.xyz(1, 1, this._cur_z).hhex
      ], 
      [
        this._cs.xyz(0, 0, this._cur_z).hhex, 
        this._cs.xyz(1, 0, this._cur_z).hhex
      ]
    ));
  }
    
  this._update_r = 
  this._update_g =
  this._update_b =
  this._update_s =
  this._update_v = function()
  {
    this._ele_z_graphic.clearAndRender(window.templates.gradient
    (
      [
        this._cs.xyz(this._cur_x, this._cur_y, 0).hhex, 
        this._cs.xyz(this._cur_x, this._cur_y, 1).hhex
      ], true
    ));
  }
    
  this._update_h = function()
  {
    this._ele_z_graphic.innerHTML = '';
    this._ele_z_graphic.render(window.templates.gradient
    (
      ['#f00', '#ff0', '#0f0', '#0ff', '#00f', '#f0f', '#f00'], 
      true
    ));
  }
  
  this._update_alpha_graphic = function()
  {
    if (this._has_alpha)
    {
      var rgb = this._cs.xyz(this._cur_x, 
                             this._cur_y, 
                             this._cur_z).getRGB().join(',');
      this._ele_alpha_graphic.clearAndRender(window.templates.gradient
      (
        ['rgba(' + rgb + ', 0)', 'rgba(' + rgb + ', 1)'], 
        true
      ));
    }
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
    
  // To set a color space.
  // color_space is one of 's-v-h', 'h-v-s', 'h-s-v', 'b-g-r', 'b-r-g' or 'r-g-b'.
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
    this._update_xy_graphic = this['_update_' + color_space[0] + color_space[1]];
    this._update_z_graphic = this['_update_' + color_space[2]];
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
  
  // DOMNodeInserted event handler.
  this._setup = function(event)
  {
    this._ele = event.target.getElementsByClassName(CP_CLASS)[0] ||
                (event.target.hasClass(CP_CLASS) && event.target);
    if (this._ele)
    {
      document.removeEventListener('DOMNodeInserted', this._setup_bound, false);
      this._ele_inputs = Array.prototype.slice.call
      (this._ele.getElementsByTagName('input')).filter(function(input)
      {
        return ['h', 's', 'v', 
                'r', 'g', 'b', 
                'hex', 
                'alpha'].indexOf(input.name) != -1;
      });
      this._ele_sample_color = 
        this._ele.getElementsByClassName(CP_NEW_CLASS)[0];
      var ele_xy = this._ele.getElementsByClassName(CP_2D_CLASS)[0];
      var ele_z = this._ele.getElementsByClassName(CP_1D_CLASS)[0];
      this._ele_xy_graphic = ele_xy.getElementsByTagName('div')[0];
      this._ele_z_graphic = ele_z.getElementsByTagName('div')[0];
      this._xy_slider = new Slider(
      {
        container: ele_xy,
        slider_base_class: SLIDER_BASE_CLASS,
        slider_class: POINTER_CLASS,
        slider_template: window.templates.svg_slider_circle(), 
        onxy: this._onxy.bind(this),
        min_x: 0,
        max_x: 1,
        min_y: 1,
        max_y: 0
      });
      this._ele_xy_slider = ele_xy.getElementsByTagName('circle')[0];
      this._z_slider = new Slider(
      {
        container: ele_z,
        slider_base_class: SLIDER_BASE_CLASS,
        slider_class: SLIDER_CLASS,
        slider_template: window.templates.svg_slider_z(), 
        ony: this._onz.bind(this),
        min_y: 1,
        max_y: 0
      });
      if (this._has_alpha = (typeof this._initial_color.alpha == 'number'))
      {
        this._cs.alpha = this._initial_color.alpha;
        ele_z = this._ele.getElementsByClassName(CP_ALPHA_CLASS)[0];
        this._ele_alpha_graphic = ele_z.getElementsByTagName('div')[0];
        this._ele_sample_color_solid = 
          this._ele_sample_color.getElementsByTagName('div')[0];
        this._alpha_slider = new Slider(
        {
          container: ele_z,
          slider_base_class: SLIDER_BASE_CLASS,
          slider_class: SLIDER_CLASS,
          slider_template: window.templates.svg_slider_z(), 
          ony: this._onalpha.bind(this),
          min_y: 1,
          max_y: 0
        });
      }
      this._set_color_space('s-v-h');
      this._ele.addEventListener('input', this._oninput_bound, false);
      this._ele.addEventListener('click', this._onclick_bound, false);
      this._ele.addEventListener('change', this._onchange_bound, false);
      document.addEventListener('DOMNodeRemoved', this._onremove_bound, false);
    }
  }

  /* implementation */
  
  this.render = function()
  {
    document.addEventListener('DOMNodeInserted', this._setup_bound, false);
    return window.templates.color_picker_popup(this._initial_color, 
                                               CP_CLASS, CP_2D_CLASS, 
                                               CP_1D_CLASS, CP_OLD_CLASS, 
                                               CP_NEW_CLASS, 'h', CP_ALPHA_CLASS,
                                               CP_ALPHA_BG)
  }
  
  /* instatiation */
  this._init = function(cb, color)
  {
    this._cb = cb;
    this._initial_color = color || new Color().parseCSSColor("#f00");
    this._cs = new ColorSpace();
    this._cs.clone(color);
    this._cb_color = new Color();
    if (color.type == color.KEYWORD)
      this._cs.type = typeof color.alpha == 'number' ? color.RGBA : color.HEX;
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
