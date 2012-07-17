/**
  * config object
  * {
  *   container: <reference element>, the elemnt in which the slider will be rendered
  *   base_class: <css class>, the class which defines the dimesions of the slider
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

var CubicBezierControl = function(config)
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

CubicBezierControl.prototype = new function()
{
  const
  UPDATE_INTERVAL = 80,
  MAX = Math.max,
  MIN = Math.min,
  BORDER = 10,
  DELTA = 100,
  SHIFT = BORDER + DELTA,
  CLASS_P1 = 'cubic-bezier-p-1',
  CLASS_P2 = 'cubic-bezier-p-2';

  this._onmousemoveinterval = function(event)
  {
    if (this._is_active)
    {
      this._callback(this._x0 / 100, this._y0 / 100,
                     this._x1 / 100, this._y1 / 100);
    }
    else
    {
      window.clearInterval(this._interval);
      this._interval = 0;
    }
  }

  this._onmousemove = function(event)
  {
    var box = this._svg.getBoundingClientRect();
    var value_x =
      ((event.clientX - this._delta_x - box.left) * this._scale) - SHIFT;
    var value_y =
      ((event.clientY - this._delta_y - box.top) * this._scale) - SHIFT;
    if (this._target_class == CLASS_P1)
    {
      this._x0 = MAX(MIN(value_x, 100 + DELTA), -DELTA);
      this._y0 = 100 - MAX(MIN(value_y, 100 + DELTA), -DELTA);
    }
    else
    {
      this._x1 = MAX(MIN(value_x, 100 + DELTA), -DELTA);
      this._y1 = 100 - MAX(MIN(value_y, 100 + DELTA), -DELTA);
    }
    this._update();
  }

  this._onmousedown = function(event)
  {
    if (!this._interval && !this._is_active)
    {
      var
      target = event.target,
      class_name = target.getAttribute('class'),
      box = null;

      if (class_name == CLASS_P1 || class_name == CLASS_P2)
      {

        box = this._svg.getBoundingClientRect();
        this._width = box.width;
        this._height = box.height;
        this._scale = (2 * BORDER + 2 * DELTA + 100) / this._width;
        this._target_class = class_name;
        if (this._target_class == CLASS_P1)
        {
          this._delta_x =
            event.clientX - (box.left + (SHIFT + this._x0) / this._scale);
          this._delta_y =
            event.clientY - (box.top + (SHIFT + 100 - this._y0) / this._scale);
        }
        else
        {
          this._delta_x =
            event.clientX - (box.left + (SHIFT + this._x1) / this._scale);
          this._delta_y =
            event.clientY - (box.top + (SHIFT + 100 - this._y1) / this._scale);
        }
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

  this._update = function()
  {
    var gs = this._svg.getElementsByTagName('g');
    while (gs[0])
      gs[0].parentNode.removeChild(gs[0]);
    this._svg.render(['svg:g', window.templates.svg_cubic_bezier(this._x0,
                                                                 this._y0,
                                                                 this._x1,
                                                                 this._y1,
                                                                 CLASS_P1,
                                                                 CLASS_P2)]);
  }

  this._init = function(config)
  {
    var
    container = config.container,
    cubic_bezier_class = config.base_class,
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

      this._callback = config.onxy;

      this._onmousedown_bound = this._onmousedown.bind(this);
      this._onmousemove_bound = this._onmousemove.bind(this);
      this._onmouseup_bound = this._onmouseup.bind(this);
      this._onremove_bound = this._onremove.bind(this);
      this._onmousemoveinterval_bound = this._onmousemoveinterval.bind(this);
      this._ref_element.addEventListener('mousedown', this._onmousedown_bound, false);
      document.addEventListener('DOMNodeRemoved', this._onremove_bound, false);
    }
  }

};
