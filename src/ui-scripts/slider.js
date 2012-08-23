"use strict"

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
  var UPDATE_INTERVAL = 80;
  var MAX = Math.max;
  var MIN = Math.min;
  var POW = Math.pow;
  var MIN_DISTANCE = 7;

  this._onmousemoveinterval = function(event)
  {
    if (this._is_active)
      this._call_callback();
    else
    {
      window.clearInterval(this._interval);
      this._interval = 0;
    }
  }

  this._call_callback = function()
  {
    if (this._onxy && !(this.x == this._submitted_x && this.y == this._submitted_y))
      this.onxy(this._submitted_x = this.x, this._submitted_y = this.y);
    if (this._onx && this.x != this._submitted_x)
      this.onx(this._submitted_x = this.x);
    if (this._ony && this.y != this._submitted_y)
      this.ony(this._submitted_y = this.y);
  }

  this._onmousemove = function(event)
  {
    if (!this._ref_element)
    {
      this._onmouseup(event);
      return;
    }
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
      this._onmousemoveinterval_bound();
      event.preventDefault();
    }
  }

  this._distance = function(x0, y0, x1, y1)
  {
    return POW(POW(x1 - x0, 2) + POW(y1 - y0, 2), .5);
  };

  this._onmousewheel = function(event)
  {
    var box = this._ref_element.getBoundingClientRect();
    var ev_raw_x = event.clientX - box.left;
    var ev_raw_y = event.clientY - box.top;
    var d = this._distance(ev_raw_x, ev_raw_y, this._w_mouse_raw_x, this._w_mouse_raw_y);
    if (d > MIN_DISTANCE)
    {
      this._w_count = 0;
      this._w_mouse_raw_x = ev_raw_x;
      this._w_mouse_raw_y = ev_raw_y;
      var scale_x = 1 / this._pixel_range_x * this._range_x;
      var scale_y = 1 / this._pixel_range_y * this._range_y;
      this._w_mouse_x = this._has_x ? ev_raw_x * scale_x + this._min_x : 0;
      this._w_mouse_y = this._has_y ? ev_raw_y * scale_y + this._min_y : 0;

      if (this._is_invers_x)
        this._w_mouse_x = this._max_x - this._w_mouse_x + this._min_x;

      if (this._is_invers_y)
        this._w_mouse_y = this._max_y - this._w_mouse_y + this._min_y;

      this._w_old_x = this._has_x ? this.x : 0;
      this._w_old_y = this. _has_y ? this.y : 0;
      var d = this._distance(this._w_old_x, this._w_old_y, this._w_mouse_x, this._w_mouse_y);
      var unit_count = d / this._w_unit;
      this._w_delta_x = this._has_x ? (this._w_mouse_x - this._w_old_x) / unit_count : 0;
      this._w_delta_y = this._has_y ? (this._w_mouse_y - this._w_old_y) / unit_count : 0;

      if (this._is_invers_x)
      {
        this._w_delta_x *= -1;
        this._w_delta_y *= -1;
      }

      if (this._has_x && this._has_y)
      {
        var b = (this._w_old_y - this._w_mouse_y) / (this._w_old_x - this._w_mouse_x);
        var a = this._w_old_y - b * this._w_old_x;
        this._w_constraint_y = function(x) { return a + b * x; };
        this._w_constraint_x = function(y) { return (y - a) / b; };
      }
      else if (this._has_x)
        this._w_delta_x = Math.abs(this._w_delta_x) * (this._is_invers_x ? -1 : 1);
      else
        this._w_delta_y = Math.abs(this._w_delta_y) * (this._is_invers_y ? 1 : -1);
    }

    if (isNaN(this._w_delta_x) || isNaN(this._w_delta_y))
      return;

    this._w_count += event.wheelDelta > 0 ? 1 : -1;
    if (this._has_x)
    {
      var value_x = this._w_old_x + this._w_delta_x * this._w_count;
      value_x = MAX(MIN(value_x, this._max_x), this._min_x);
      this.x = value_x;
    }

    if (this._has_y)
    {
      if (this._has_x && (this._min_x == this.x || this._max_x == this.x))
        var value_y = this._w_constraint_y(value_x);
      else
      {
        var value_y = this._w_old_y + this._w_delta_y * this._w_count;
        value_y = MAX(MIN(value_y, this._max_y), this._min_y);
      }

      this.y = value_y;
      if (this._has_x && (this._min_y == this.y || this._max_y == this.y))
      {
        var prov = this._w_constraint_x(value_y);
        if (!isNaN(prov))
          this.x = value_x = prov;
      }
    }

    if ((this._has_x && this._has_y) &&
        (this._min_x == this.x || this._max_x == this.x ||
         this._min_y == this.y || this._max_y == this.y))
    {
      var count = this._distance(value_x, value_y, this._w_old_x, this._w_old_y);
      count /= this._w_unit;
      this._w_count = (this._w_count < 0 ? -1 : 1) * Math.abs(count);
    }
    else if (this._has_x && (this._min_x == this.x || this._max_x == this.x))
    {
      var count = (value_x - this._w_old_x) / this._w_unit;
      this._w_count = (this._w_count < 0 ? -1 : 1) * Math.abs(count);
    }
    else if (this._has_y && (this._min_y == this.y || this._max_y == this.y))
    {
      var count = (value_y - this._w_old_y) / this._w_unit;
      this._w_count = (this._w_count < 0 ? -1 : 1) * Math.abs(count);
    }

    this._call_callback();
    event.preventDefault();
  };

  this._onmouseup = function(event)
  {
    this._is_active = false;
    document.removeEventListener('mousemove', this._onmousemove_bound, false);
    document.removeEventListener('mouseup', this._onmouseup_bound, false);
    this._w_mouse_raw_x = event.clientX;
    this._w_mouse_raw_y = event.clientY;
  }

  this._onremove = function(event)
  {
    if (event.target.nodeType == 1 && event.target.contains(this._ref_element))
    {
      this._ref_element.removeEventListener('mousedown', this._onmousedown_bound, false);
      this._ref_element.removeEventListener('mousewheel', this._onmousewheel_bound, false);
      document.removeEventListener('DOMNoderemoved', this._onremove_bound, false);
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
    if (!this._w_unit)
      this._w_unit = (max - min) / pixel_range;
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
      this._w_mouse_raw_x = 0;
      this._w_mouse_raw_y = 0;
      this._w_mouse_x = 0;
      this._w_mouse_y = 0;
      this._w_old_x = 0;
      this._w_old_y = 0;
      this._w_delta_x = 0;
      this._w_delta_y = 0;
      this._w_count = 0;
      this._w_constraint_x = null;
      this._w_constraint_y = null;
      this._onmousedown_bound = this._onmousedown.bind(this);
      this._onmousemove_bound = this._onmousemove.bind(this);
      this._onmouseup_bound = this._onmouseup.bind(this);
      this._onmousewheel_bound = this._onmousewheel.bind(this);
      this._onremove_bound = this._onremove.bind(this);
      this._onmousemoveinterval_bound = this._onmousemoveinterval.bind(this);
      this._ref_element.addEventListener('mousedown', this._onmousedown_bound, false);
      this._ref_element.addEventListener('mousewheel', this._onmousewheel_bound, false);
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
