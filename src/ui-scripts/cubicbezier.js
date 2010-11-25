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
      
    }
    else
    {
      window.clearInterval(this._interval);
      this._interval = 0;
    }
  }

  this._onmousemove = function(event)
  {
    var value = 0, box = this._svg.getBoundingClientRect();

    value = (event.clientX - this._delta_x - box.left) * this._scale;
    this._x0 = MAX(MIN(value, 100), 0);
    value = (event.clientY - this._delta_y - box.top) * this._scale;
    this._y0 = 100 - MAX(MIN(value, 100), 0);
    this._update();
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

      var target = event.target;
      var class_name = target.getAttribute('class');
      if (class_name == 'cubic-bezier-p-1'/* || class_name == 'cubic-bezier-p-2'*/)
      {
        var box = this._svg.getBoundingClientRect();
        this._width = box.width;
        this._height = box.height;
        this._scale = 100 / this._width;
        this._delta_x = event.clientX - (box.left + this._x0 / this._scale);
        this._delta_y = event.clientY - (box.top + (100 - this._y0) / this._scale);
        
        
        
      /*
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
      */
      document.addEventListener('mousemove', this._onmousemove_bound, false);
      document.addEventListener('mouseup', this._onmouseup_bound, false);
      this._interval = window.setInterval(this._onmousemoveinterval_bound, UPDATE_INTERVAL);
      this._is_active = true;
      event.preventDefault();
      
      }
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
  
  this._update = function()
  {
    var gs = this._svg.getElementsByTagName('g');
    while (gs[0])
      gs[0].parentNode.removeChild(gs[0]);
    this._svg.render(['svg:g', window.templates.svg_cubic_bezier(this._x0, this._y0, this._x1, this._y1)]);
  }

  this._init = function(config)
  {
    var
    container = config.container,
    cubic_bezier_class = config.slider_base_class,
    box = null;

    if (container instanceof Element)
    {
      container.render(window.templates.cubic_bezier(cubic_bezier_class));
      this._ref_element = container.getElementsByClassName(cubic_bezier_class)[0];
      this._svg = this._ref_element.getElementsByTagName('svg')[0];
      this._x0 = 30;
      this._y0 = 50;
      this._x1 = 70;
      this._y1 = 50;
      this._update();
      
      

      

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
