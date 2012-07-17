window.cls || (window.cls = {});

cls.Ruler = function(callback)
{
  this._init(callback);
};

cls.Ruler.BASE_CLASS = "ruler";
cls.Ruler.CLOSE_BUTTON_CLASS = "ruler-close";

window.addEventListener('load', function()
{
  [
    ['BORDER_LEFT', '.ruler-left-bg', 'width'],
    ['BORDER_TOP', '.ruler-top-bg', 'height'],
    ['BORDER_RIGHT', '.ruler-right-bg', 'width'],
    ['BORDER_BOTTOM', '.ruler-bottom-bg', 'height'],
  ].forEach(function(a)
  {
    const TARGET = 0, CLASS = 1, PROP = 2;
    var val = document.styleSheets.getDeclaration (a[CLASS])[a[PROP]];
    cls.Ruler[a[TARGET]] = parseInt(val);
  });

  cls.Ruler.prototype = new function()
  {
    /* interface */

    this.show_ruler = function(container){};
    this.hide_ruler = function(){};
    this.set_container = function(container){};
    this.callback; // setter and getter
    this.onclose; // setter and getter
    this.scale; // setter and getter
    this.w; // getter
    this.h; // getter

    /* constants */

    const BASE_CLASS = cls.Ruler.BASE_CLASS;
    const CLOSE_BUTTON_CLASS = cls.Ruler.CLOSE_BUTTON_CLASS;
    const BORDER_LEFT = cls.Ruler.BORDER_LEFT;
    const BORDER_TOP = cls.Ruler.BORDER_TOP;
    const BORDER_RIGHT = cls.Ruler.BORDER_RIGHT;
    const BORDER_BOTTOM = cls.Ruler.BORDER_BOTTOM;
    const INTERVAL = 30;

    this._init = function(callback)
    {
      this._callback = callback;
      this.base_class = BASE_CLASS;
      this._scale = 1;
      this._onnodeinserted_bound = this._onnodeinserted.bind(this);
      this._onmousedown_bound = this._onmousedown.bind(this);
      this._onmouseup_bound = this._onmouseup.bind(this);
      this._onmousemove_bound = this._onmousemove.bind(this);
      this._onclick_bound = this._onclick.bind(this);
      this._update_bound = this._update.bind(this);
      this._update_handler = null;
      this._interval = 0;
      this._event = 0;
      this._rx0 = 50;
      this._rx1 = 350;
      this._ry0 = 50;
      this._ry1 = 350;
      this._cur_w = 0;
      this._cur_h = 0;
    };

    // event handlers

    this._onnodeinserted = function(event)
    {
      if (event.target.hasClass(this.base_class))
      {
        document.removeEventListener('DOMNodeInserted',
                                     this._onnodeinserted_bound,
                                     false);
        this._setup(event.target);
      }
    };

    this._onmousedown = function(event)
    {
      var handler = this._get_handlers(event);
      if (handler && !this._interval)
      {
        this._update_handler = handler;
        document.addEventListener('mouseup',
                                  this._onmouseup_bound,
                                  false);
        document.addEventListener('mousemove',
                                  this._onmousemove_bound,
                                  false);
        this._interval = setInterval(this._update_bound, INTERVAL);
        event.stopPropagation();
        event.preventDefault();
      }
      else
      {
        this._onmouseup();
      }
    };

    this._onmouseup = function(event)
    {
      document.removeEventListener('mouseup',
                                   this._onmouseup_bound,
                                   false);
      document.removeEventListener('mousemove',
                                   this._onmousemove_bound,
                                   false);
      clearInterval(this._interval);
      this._interval = 0;
      this._event = null;
    };

    this._onmousemove = function(event)
    {
      this._event = event;
    };

    this._onclick = function(event)
    {
      if (event.target.hasClass(CLOSE_BUTTON_CLASS))
      {
        this.hide_ruler();
      }
    };

    this._update = function()
    {
      this._update_handler();
    };

    this._move_handler = function()
    {
      if (this._event)
      {
        var rx0 = this._snap_x0(this._event.clientX - this._ev_delta_x);
        var rx1 = rx0 + this._rx1 - this._rx0;
        var ry0 = this._snap_y0(this._event.clientY - this._ev_delta_y);
        var ry1 = ry0 + this._ry1 - this._ry0;
        this._redraw_ruler(rx0, rx1, ry0, ry1);
      }
    };

    this._snap = function(number)
    {
      var candidate = (number / this._scale >> 0) * this._scale;
      if ((number % this._scale) / this._scale > .5)
      {
        candidate += this._scale;
      }
      return candidate;
    };

    this._snap_x0 = function(cand)
    {
      cand = this._snap(cand + BORDER_LEFT) - BORDER_LEFT;

      // ensure that rx1 is snapped
      if (!((this._rx1 - BORDER_RIGHT) % this._scale == 0))
      {
        this._rx1 = this._snap(this._rx1 - BORDER_RIGHT) + BORDER_RIGHT;
        while (this._rx1 > this._max_x)
        {
          this._rx1 -= this._scale;
        }
      }

      var scaled = ((this._min_x + BORDER_LEFT) / this._scale) >> 0;
      var min_left = (scaled + 1) * this._scale - BORDER_LEFT;
      var width = this._rx1 - this._rx0;
      scaled = (this._max_x - BORDER_RIGHT) / this._scale >> 0;
      var max_right = scaled * this._scale + BORDER_RIGHT - width;
      while (cand < min_left)
      {
        cand += this._scale;
      }
      while (cand > max_right)
      {
        cand -= this._scale;
      }
      return cand;
    };

    this._snap_y0 = function(cand)
    {
      cand = this._snap(cand + BORDER_TOP) - BORDER_TOP;

      // ensure that rx1 is snapped
      if (!((this._ry1 - BORDER_BOTTOM) % this._scale == 0))
      {
        this._ry1 = this._snap(this._ry1 - BORDER_BOTTOM) + BORDER_BOTTOM;
        while (this._ry1 > this._max_y)
        {
          this._ry1 -= this._scale;
        }
      }

      var scaled = ((this._min_y + BORDER_TOP) / this._scale) >> 0;
      var min_top = (scaled + 1) * this._scale - BORDER_TOP;
      var width = this._ry1 - this._ry0;
      scaled = (this._max_y - BORDER_BOTTOM) / this._scale >> 0;
      var max_bottom = scaled * this._scale + BORDER_BOTTOM - width;
      while (cand < min_top)
      {
        cand += this._scale;
      }
      while (cand > max_bottom)
      {
        cand -= this._scale;
      }
      return cand;
    };

    this._snap_x1 = function(cand)
    {
      cand = this._snap(cand - BORDER_RIGHT) + BORDER_RIGHT;
      var width = this._rx1 - this._rx0;
      var min_left = this._rx0 + BORDER_LEFT + BORDER_RIGHT;
      var scaled = (this._max_x - BORDER_RIGHT) / this._scale >> 0;
      var max_right = scaled * this._scale + BORDER_RIGHT;
      while (cand < min_left)
      {
        cand += this._scale;
      }
      while (cand > max_right)
      {
        cand -= this._scale;
      }
      return cand;
    };

    this._snap_y1 = function(cand)
    {
      cand = this._snap(cand - BORDER_BOTTOM) + BORDER_BOTTOM;
      var width = this._ry1 - this._ry0;
      var min_top = this._ry0 + BORDER_TOP + BORDER_BOTTOM;
      var scaled = (this._max_y - BORDER_BOTTOM) / this._scale >> 0;
      var max_bottom = scaled * this._scale + BORDER_BOTTOM;
      while (cand < min_top)
      {
        cand += this._scale;
      }
      while (cand > max_bottom)
      {
        cand -= this._scale;
      }
      return cand;
    };

    this._width_handler = function()
    {
      if (this._event)
      {
        var rx1 = this._snap_x1(this._event.clientX - this._ev_delta_x);
        this._redraw_ruler(null, rx1);
        this._call_callback();
      }
    };

    this._height_handler = function()
    {
      if (this._event)
      {
        var ry1 = this._snap_y1(this._event.clientY - this._ev_delta_y);
        this._redraw_ruler(null, null, null, ry1);
        this._call_callback();
      }
    };

    this._width_and_height_handler = function()
    {
      if (this._event)
      {
        var rx1 = this._snap_x1(this._event.clientX - this._ev_delta_x);
        var ry1 = this._snap_y1(this._event.clientY - this._ev_delta_y);
        this._redraw_ruler(null, rx1, null, ry1);
        this._call_callback();
      }
    };

    this._call_callback = function(force)
    {
      if (this._callback)
      {
        if (force || this._cur_w != this.w || this._cur_h != this.h)
        {
          this._cur_w = this.w;
          this._cur_h = this.h;
          this._callback(this);
        }
      }
    };

    this._get_handlers = function(event)
    {
      var box = this._set_max_dimensions();
      if (box)
      {
        var evx = event.clientX - box.left;
        var evy = event.clientY - box.top;
        // move
        if ((evx >= this._rx0 && evx < this._rx1 &&
             evy > this._ry0 && evy < this._ry0 + BORDER_TOP) ||
            (evx >= this._rx0 && evx <= this._rx0 + BORDER_LEFT &&
             evy >= this._ry0 + BORDER_TOP && evy <= this._ry1))
        {
          this._ev_delta_x = event.clientX - this._rx0;
          this._ev_delta_y = event.clientY - this._ry0;
          return this._move_handler;
        }
        // width
        if (evx >= this._rx1 - BORDER_RIGHT && evx <= this._rx1 &&
            evy >= this._ry0 + BORDER_TOP && evy <= this._ry1 - BORDER_BOTTOM)
        {
          this._ev_delta_x = event.clientX - this._rx1;
          return this._width_handler;
        }
        // height
        if (evx >= this._rx0 + BORDER_LEFT && evx <= this._rx1 - BORDER_RIGHT &&
            evy > this._ry1 - BORDER_BOTTOM && evy <= this._ry1)
        {
          this._ev_delta_y = event.clientY - this._ry1;
          return this._height_handler;
        }
        // width and height
        if (evx >= this._rx1 - BORDER_RIGHT && evx <= this._rx1 &&
            evy > this._ry1 - BORDER_BOTTOM && evy <= this._ry1)
        {
          this._ev_delta_x = event.clientX - this._rx1;
          this._ev_delta_y = event.clientY - this._ry1;
          return this._width_and_height_handler;
        }

      }
      return null;
    };

    this._setup = function(ruler_ele)
    {
      this._ruler_ele = ruler_ele;
      this._set_max_dimensions();
      ruler_ele.addEventListener('mousedown',
                                 this._onmousedown_bound,
                                 false);
      ruler_ele.addEventListener('click',
                                 this._onclick_bound,
                                 false);
      this._call_callback(true);
    };

    this._redraw_ruler = function(rx0, rx1, ry0, ry1, force_redraw)
    {
      var is_dirty = false;
      if (typeof rx0 == 'number' && this._rx0 != rx0)
      {
        is_dirty = true;
        this._rx0 = rx0;
      }
      if (typeof rx1 == 'number' && this._rx1 != rx1)
      {
        is_dirty = true;
        this._rx1 = rx1;
      }
      if (typeof ry0 == 'number' && this._ry0 != ry0)
      {
        is_dirty = true;
        this._ry0 = ry0;
      }
      if (typeof ry1 == 'number' && this._ry1 != ry1)
      {
        is_dirty = true;
        this._ry1 = ry1;
      }

      if (is_dirty || force_redraw)
      {
        this._ruler_ele.clearAndRender(window.templates.ruler_body(this));
      }
    };

    this._set_max_dimensions = function()
    {
      if (this._container)
      {
        var box = this._container.getBoundingClientRect();
        this._min_x = 0;
        this._min_y = 0;
        this._max_x = box.width;
        this._max_y = box.height;
        return box;
      }
      return null;
    };

    this.__defineSetter__('scale', function(scale)
    {
      this._scale = scale;
      if (this._ruler_ele)
      {
        var rx0 = this._snap_x0(this._rx0);
        var ry0 = this._snap_y0(this._ry0);
        this._redraw_ruler(rx0, null, ry0, null, true);
        this._call_callback();
      }
    });

    this.__defineGetter__('scale', function() {return this._scale});
    this.__defineSetter__('left', function(x) {});
    this.__defineGetter__('left', function() {return this._rx0;});
    this.__defineSetter__('top', function(x) {});
    this.__defineGetter__('top', function() {return this._ry0;});
    this.__defineSetter__('right', function(x) {});
    this.__defineGetter__('right', function() {return this._rx1;});
    this.__defineSetter__('bottom', function(x) {});
    this.__defineGetter__('bottom', function() {return this._ry1;});
    this.__defineSetter__('width', function(x) {});
    this.__defineGetter__('width', function() {return this._rx1 - this._rx0;});
    this.__defineSetter__('height', function(x) {});
    this.__defineGetter__('height', function() {return this._ry1 - this._ry0;});
    this.__defineSetter__('target_width', function(x) {});
    this.__defineGetter__('target_width', function()
    {
      return this._rx1 - this._rx0 - BORDER_LEFT - BORDER_RIGHT;
    });

    this.__defineSetter__('target_height', function(x) {});
    this.__defineGetter__('target_height', function()
    {
      return this._ry1 - this._ry0 - BORDER_TOP - BORDER_BOTTOM;
    });

    this.__defineSetter__('w', function(x) {});
    this.__defineGetter__('w', function() {return this.target_width / this._scale;});
    this.__defineSetter__('h', function(x) {});
    this.__defineGetter__('h', function() {return this.target_height / this._scale;});
    this.__defineSetter__('callback', function(cb) {this._callback = cb});
    this.__defineGetter__('callback', function() {return this._callback;});
    this.__defineSetter__('onclose', function(cb) {this._onclose = cb});
    this.__defineGetter__('onclose', function() {return this._onclose;});

    this.show_ruler = function(container)
    {
      if (!this._ruler_ele || !this._ruler_ele.parentNode)
      {
        this._container = container;
        document.addEventListener('DOMNodeInserted',
                                     this._onnodeinserted_bound,
                                     false);
        this._set_max_dimensions();
        this._rx0 = this._snap_x0(this._rx0);
        this._ry0 = this._snap_y0(this._ry0);
        this._container.render(window.templates.ruler(this));
      }
    };

    this.hide_ruler = function()
    {
      if (this._ruler_ele && this._ruler_ele.parentNode)
      {
        this._ruler_ele.parentNode.removeChild(this._ruler_ele);
        this._ruler_ele = null;
        this._container.removeEventListener('mousedown',
                                            this._onmousedown_bound,
                                            false);
        this._container.removeEventListener('click',
                                            this._onclick_bound,
                                            false);
        if (this._onclose)
        {
          this._onclose();
        }
      }
    }

    this.set_container = function(container)
    {
      if (this._ruler_ele && container != this._container)
      {
        this._container = container;
        container.appendChild(this._ruler_ele)
      }
    };

  };

}, false);
