window.cls || (window.cls = {});

cls.DragState = function(pixelmagnifier)
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

  this._init = function(pixelmagnifier)
  {
    this._pixelmagnifier = pixelmagnifier;
  };

  this._init(pixelmagnifier);
}

cls.ScreenShotView = function(id, name, container_class)
{
  this.createView = function(container)
  {
    var canvas = container.clearAndRender(['canvas']);
    this._pixel_magnifier.set_canvas(canvas);
    this._pixel_magnifier.width = container.clientWidth;
    this._pixel_magnifier.height = container.clientHeight;
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
  }.bind(this);

  this._handlers['dragstart'] = function(event)
  {
    if (!this._drag_state.interval)
    {
      this._drag_state.start(event);
    }
  }.bind(this);
  
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
    this._drag_state = new cls.DragState(this._pixel_magnifier);
    window.eventHandlers.mousewheel["screenshot-tool"] = this._handlers['zoom'];
    window.eventHandlers.mousedown["screenshot-tool"] = this._handlers['dragstart'];
    window.messages.addListener('active-tab', this._on_active_tab.bind(this));
  };

  this._init(id, name, container_class);

  this.ondestroy = function()
  {
    this._screenshot = "";
  }
};

cls.ScreenShotView.prototype = ViewBase;
