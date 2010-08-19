/**
  * config object
  * {
  *   container: <reference element>, the elemnt in which the slider will be rendered
  *   slider_base_class: <css class>, the class which defines the dimesions of the slider
  *   slider_class: <css class>, the class which contains the slider elent
  *   slider_template: <template>, a template for the slider
  *   onx: <callback>, // optional
  *   ony: <callback>, // optional
  *   onxy: <callback>, // optional
  *   min_x: <number>, // optional
  *   max_x: <number>, // optional
  *   min_y: <number>, // optional
  *   max_y: <number> // optional
  * }
  */
    
var Slider = function(config)
{
  /* interface */
  this.onx = function(x){};
  this.ony = function(y){};
  this.onxy = function(x, y){};
  //read and write
  this.x;
  this.y;

  /* constructor */
  this._init(config);
};

Slider.prototype = new function()
{
  const UPDATE_INTERVAL = 80, MAX = Math.max, MIN = Math.min;
  this._onmousemoveinterval = function(event)
  {
    if (this._is_active)
    {
      if (this._onxy && !(this.x == this._submitted_x && this.y == this._submitted_y))
        this.onxy(this._submitted_x = this.x, this._submitted_y = this.y);
      if (this._onx && this.x != this._submitted_x)
        this.onx(this._submitted_x = this.x);
      if (this._ony && this.y != this._submitted_y)
        this.ony(this._submitted_y = this.y);
    }
    else
    {
      window.clearInterval(this._interval);
      this._interval = 0;
    }
  }

  this._onmousemove = function(event)
  {
    this._focus_catcher.focus();
    var value = 0, box = this._ref_element.getBoundingClientRect();
    if (this._has_x)
    {
      value = (event.clientX - this._delta_x - box.left) /
              this._pixel_range_x * this._range_x + this._min_x;
      value = MAX(MIN(value, this._max_x), this._min_x);
      this.x = this._is_invers_x ? this._max_x - value + this._min_x : value;
    }
    if (this._has_y)
    {
      value = (event.clientY - this._delta_y - box.top) /
              this._pixel_range_y * this._range_y + this._min_y;
      value = MAX(MIN(value, this._max_y), this._min_y);
      this.y = this._is_invers_y ? this._max_y - value + this._min_y : value;
    }
  }

  this._update_y = function(value)
  {
    if (this._is_invers_y)
      value = this._max_y - value + this._min_y;
    this._element.style.top = ((value - this._min_y) / this._range_y * this._pixel_range_y) + "px";
  }

  this._update_x = function(value)
  {
    if (this._is_invers_x)
      value = this._max_x - value + this._min_x;
    this._element.style.left = ((value - this._min_x) / this._range_x * this._pixel_range_x) + "px";
  }

  this._onmousedown = function(event)
  {
    if (!this._interval && !this._is_active)
    {
      if (this._element.contains(event.target))
      {
        var target_box = this._element.getBoundingClientRect();
        this._delta_x = event.clientX - target_box.left - (target_box.width / 2 >> 0);
        this._delta_y = event.clientY - target_box.top - (target_box.height / 2 >> 0);
      }
      else
      {
        this._delta_x = 0;
        this._delta_y = 0;
        this._onmousemove(event);
      }
      document.addEventListener('mousemove', this._onmousemove_bound, false);
      document.addEventListener('mouseup', this._onmouseup_bound, false);
      this._interval = window.setInterval(this._onmousemoveinterval_bound, UPDATE_INTERVAL);
      this._is_active = true;
    }
  }

  this._onmouseup = function(event)
  {
    this._is_active = false;
    document.removeEventListener('mousemove', this._onmousemove_bound, false);
    document.removeEventListener('mouseup', this._onmouseup_bound, false);
  }

  this._onremove = function(event)
  {
    if (event.target.nodeType == 1 && event.target.contains(this._ref_element))
    {
      this._ref_element.removeEventListener('mousedown', this._onmousedown_bound, false);
      document.removeEventListener('DOMNoderemoved', this._onremove_bound, false);
      this._focus_catcher.parentNode.removeChild(this._focus_catcher);
      this._focus_catcher = null;
      this._ref_element = null;
      this._element = null;
      this._onmousedown_bound = null;
      this._onmousemove_bound = null;
      this._onmouseup_bound = null;
      this._onremove_bound = null;
      this._onmousemoveinterval_bound = null;
    }
  }
  
  this._set_axis = function(axis, min, max, pixel_range)
  {
    this['_has_' + axis] = true;
    this['_min_' + axis] = Math.min(min, max);
    this['_max_' + axis] = Math.max(min, max);
    this['_pixel_range_' + axis] = pixel_range;
    this['_range_' + axis] = Math.abs(max - min);
    this['_is_invers_' + axis] = min > max;
    this['_' + axis] = 0;
    this['_submitted_' + axis] = 0;
    this[axis] = this['_is_invers_' + axis] ? max : min;
  }

  this._init = function(config)
  {
    var
    container = config.container,
    slider_base_class = config.slider_base_class,
    slider_class = config.slider_class,
    box = null;

    if (container instanceof Element)
    {
      container.render(window.templates.slider(slider_base_class, slider_class, config.slider_template));
      this._ref_element = container.getElementsByClassName(slider_base_class)[0];
      this._element = container.getElementsByClassName(slider_class)[0];
      this._focus_catcher = document.documentElement.render(window.templates.slider_focus_catcher());
      box = this._ref_element.getBoundingClientRect();
      
      if (config.onxy)
      {
        this.onxy = config.onxy;
        this._onxy = true;
        this._set_axis('x', config.min_x, config.max_x, box.width);
        this._set_axis('y', config.min_y, config.max_y, box.height);
      }
      else
      {
        if (config.onx)
        {
          this.onx = config.onx;
          this._onx = true;
          this._set_axis('x', config.min_x, config.max_x, box.width);
        }
        if (config.ony)
        {
          this.ony = config.ony;
          this._ony = true;
          this._set_axis('y', config.min_y, config.max_y, box.height);
        }
      }
      this._onmousedown_bound = this._onmousedown.bind(this);
      this._onmousemove_bound = this._onmousemove.bind(this);
      this._onmouseup_bound = this._onmouseup.bind(this);
      this._onremove_bound = this._onremove.bind(this);
      this._onmousemoveinterval_bound = this._onmousemoveinterval.bind(this);
      this._ref_element.addEventListener('mousedown', this._onmousedown_bound, false);
      document.addEventListener('DOMNodeRemoved', this._onremove_bound, false);
    }
  }

  this.__defineSetter__('x', function(value)
  {
    this.__x = value;
    if (typeof value == 'number' &&
        !isNaN(value) &&
        value >= this._min_x &&
        value <= this._max_x)
      this._update_x(value);
  });

  this.__defineGetter__('x', function() {return this.__x;});

  this.__defineSetter__('y', function(value)
  {
    this.__y = value;
    if (typeof value == 'number' &&
        !isNaN(value) &&
        value >= this._min_y &&
        value <= this._max_y)
      this._update_y(value);
  });

  this.__defineGetter__('y', function() {return this.__y;});
  
};
