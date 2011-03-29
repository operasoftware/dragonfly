window.cls || (window.cls = {});

cls.DragState = function(screenshot, pixelmagnifier)
{
  this._onmousemove = function(event)
  {
    this.event = event;
  }.bind(this);

  this._onmouseup = function(event)
  {
    document.removeEventListener('mousemove', this._onmousemove, false);
    document.removeEventListener('mouseup', this._onmouseup, false);
    this.interval = clearInterval(this.interval);
    this.event = null;
    this._screenshot._update_overlay(event.offsetX, event.offsetY);
  }.bind(this);

  this._updateondrag = function()
  {
    if (this.event)
    {
      var dx = (this.dx - this.event.clientX) / this._pixelmagnifier.scale;
      var dy = (this.dy - this.event.clientY) / this._pixelmagnifier.scale;
      this._pixelmagnifier.x = Math.round(this.x + dx);
      this._pixelmagnifier.y = Math.round(this.y + dy);
      this._pixelmagnifier.draw();
      this._screenshot._update_overlay(this.event.offsetX, this.event.offsetY);
    }
  }.bind(this);

  this.start = function(event)
  {
    this.dx = event.clientX;
    this.dy = event.clientY;
    this.x = this._pixelmagnifier.x;
    this.y = this._pixelmagnifier.y;
    document.addEventListener('mousemove', this._onmousemove, false);
    document.addEventListener('mouseup', this._onmouseup, false);
    this.interval = setInterval(this._updateondrag, 30);
    event.preventDefault();
    event.stopPropagation();
  };

  this._init = function(screenshot, pixelmagnifier)
  {
    this._screenshot = screenshot;
    this._pixelmagnifier = pixelmagnifier;
  };

  this._init(screenshot, pixelmagnifier);
}

cls.ScreenShotView = function(id, name, container_class)
{
  this.update_screenshot = function(){};

  this.zoom_center = function(scale){};

  this.set_sample_size = function(size){};

  this.createView = function(container)
  {
    container.clearAndRender([['canvas'],
                              ['canvas', 'class', 'screenshot-overlay']]);
    var canvases = container.getElementsByTagName('canvas');
    this._pixel_magnifier.set_canvas(canvases[0]);
    this._overlay = canvases[1];
    this._overlay.width = this._pixel_magnifier.width = container.clientWidth;
    this._overlay.height = this._pixel_magnifier.height = container.clientHeight;
    this._overlay_ctx = this._overlay.getContext('2d');
    this._overlay_ctx.fillStyle = "rgba(0, 0, 0, .5)";

    if (!this._screenshot)
    {
      this._get_window_size();
    }
    else
    {
      this._pixel_magnifier.draw();
    }
  };

  this._get_window_size = function()
  {
    if (this._top_rt_id)
    {
      var script = "return scrollY + ',' + innerWidth + ',' + innerHeight";
      var tag = this._tagman.set_callback(this, this._handle_window_size);
      this._esdb.requestEval(tag, [this._top_rt_id, 0, 0, script]);
    }
  };

  this._handle_window_size = function(status, message)
  {
    const STATUS = 0,  TYPE = 1, VALUE = 2;
    if (status || !(message[STATUS] == 'completed' && message[TYPE] == 'string'))
    {
      opera.postError("Evaling innerWidth and innerHeight failed.");
    }
    else
    {
      var ret = message[VALUE].split(',').map(function(i){return parseInt(i)});
      this._get_screenshot(ret[0], ret[1], ret[2]);
    }
  };

  this._get_screenshot = function(win_scrollY, win_innerWidth, win_innerHeight)
  {
    var msg =
    [
      10,
      [0, win_scrollY, win_innerWidth, win_innerHeight],
      [],
      window.window_manager_data.get_debug_context(),
      [],
      1
    ];
    var tag = this._tagman.set_callback(this, this._handle_screenshot);
    this._exec.requestSetupScreenWatcher(tag, msg);
  };

  this._handle_screenshot = function(status, message)
  {
    const PNG = 2;
    if (status)
    {
      opera.postError("Taking screenshot failed.");
    }
    else
    {
      this._screenshot = message[PNG];
      this._pixel_magnifier.set_source_base_64(this._screenshot, "image/png");
      window.messages.post('screenshot-scale',
                           {scale: this._pixel_magnifier.scale});
    }
  };

  this._on_active_tab = function(msg)
  {
    this._top_rt_id = msg.runtimes_with_dom[0];
  };

  ActionHandlerInterface.apply(this);

  this._handlers['zoom'] = function(event, target)
  {
    var scale = this._pixel_magnifier.scale + (event.wheelDelta > 0 ? 1 : -1);
    this._pixel_magnifier.zoom(event.offsetX, event.offsetY, scale);
    this._pixel_magnifier.draw();
    this._update_overlay(event.offsetX, event.offsetY);
    window.messages.post('screenshot-scale',
                         {scale: this._pixel_magnifier.scale});
  }.bind(this);

  this._handlers['dragstart'] = function(event)
  {
    if (!this._drag_state.interval)
    {
      this._drag_state.start(event);
    }
  }.bind(this);

  this._handlers['click'] = function(event)
  {
    this._overlay_is_active = !this._overlay_is_active;
    this._update_overlay(event.offsetX, event.offsetY);
    this._sample_event = event;
    if (this._overlay_is_active)
    {
      var color = this._pixel_magnifier.get_average_color(event.offsetX,
                                                          event.offsetY,
                                                          this._sample_size);
      window.messages.post('sceenshot-sample-color', {color: color})
    }
  }.bind(this);

  this._update_overlay = function(x, y)
  {
    this._overlay_ctx.clearRect(0, 0,
                                this._pixel_magnifier.width,
                                this._pixel_magnifier.height);
    if (this._overlay_is_active)
    {
      this._overlay_ctx.fillRect(0, 0,
                                 this._pixel_magnifier.width,
                                 this._pixel_magnifier.height);
      var scale = this._pixel_magnifier.scale;
      x -= x % scale;
      y -= y % scale;
      var delta = ((this._sample_size - 1) / 2) * scale;
      var width = this._sample_size * scale;
      this._overlay_ctx.clearRect(x - delta, y - delta, width, width);
    }
  }


  this._init = function(id, name, container_class)
  {
    this.init(id, name, container_class, "", "screenshot-tool");
    this._pixel_magnifier = new PixelMagnifier();
    this._pixel_magnifier.onload = function()
    {
      this.draw();
    }
    this._screenshot = "";
    this._tagman = window.tag_manager;
    this._esdb = window.services['ecmascript-debugger'];
    this._exec = window.services.exec;
    this._drag_state = new cls.DragState(this, this._pixel_magnifier);
    this._sample_size = 9;
    window.eventHandlers.mousewheel["screenshot-tool"] = this._handlers['zoom'];
    window.eventHandlers.mousedown["screenshot-tool"] = this._handlers['dragstart'];
    window.eventHandlers.click["screenshot-tool"] = this._handlers['click'];
    window.messages.addListener('active-tab', this._on_active_tab.bind(this));
  };

  this._init(id, name, container_class);

  this.ondestroy = function()
  {
    this._screenshot = "";
  }

  this.onresize = function(container)
  {
    if(this.isvisible())
    {
      this.createView(container);
    }
  }

  this.update_screenshot = function()
  {
    this._get_window_size();
  };


  this.zoom_center = function(scale)
  {
    if (scale >= 1 && scale <= this._pixel_magnifier.max_scale)
    {
      this._pixel_magnifier.zoom(this._pixel_magnifier.width / 2 >> 0,
                                 this._pixel_magnifier.height / 2 >> 0,
                                scale);
      this._pixel_magnifier.draw();
    }
  };

  this.set_sample_size = function(size)
  {
    this._sample_size = size;
    if (this._sample_event)
    {
    this._handlers['click'](this._sample_event);
    this._handlers['click'](this._sample_event);
    }
  };

};

cls.ScreenShotView.prototype = ViewBase;
