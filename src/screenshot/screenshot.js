window.cls || (window.cls = {});

cls.DragState = function(screenshot, pixelmagnifier)
{
  this.start_drag = function(event){};

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
    if (this._event_target)
    {
      this._event_target.style.removeProperty('cursor');
    }
    this.is_cursor_style_set = false;
  }.bind(this);

  this._updateondrag = function()
  {
    if (this.event)
    {
      if (!this.is_cursor_style_set && (this.dx - this.event.clientX ||
                                        this.dy - this.event.clientY))
      {
        this._event_target = this.event.target;
        this._event_target.style.cursor = 'move';
        this.is_cursor_style_set = true;
      }
      var dx = (this.dx - this.event.clientX) / this._pixelmagnifier.scale;
      var dy = (this.dy - this.event.clientY) / this._pixelmagnifier.scale;
      this._pixelmagnifier.x = Math.round(this.x + dx);
      this._pixelmagnifier.y = Math.round(this.y + dy);
      this._pixelmagnifier.draw();
    }
  }.bind(this);

  this.start_drag = function(event)
  {
    this.dx = event.clientX;
    this.dy = event.clientY;
    this.x = this._pixelmagnifier.x;
    this.y = this._pixelmagnifier.y;
    this.is_cursor_style_set = false;
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

  this._init(screenshot, pixelmagnifier);
};

cls.ScreenShotView = function(id, name, container_class)
{
  /* interface inherited from ViewBase */

  /* interface */

  this.update_screenshot = function(){};
  this.zoom_center = function(scale){};
  this.set_sample_size = function(size){};

  /* private */

  this._get_window_size = function()
  {
    if (this._top_rt_id)
    {
      var script = "return " +
                   "scrollX + ',' + scrollY + ',' + " +
                   "innerWidth + ',' + innerHeight";
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
      var msg =
      [
        10,
        message[VALUE].split(',').map(Number),
        [],
        window.window_manager_data.get_debug_context(),
        [],
        1
      ];
      var tag = this._tagman.set_callback(this, this._handle_screenshot);
      this._exec.requestSetupScreenWatcher(tag, msg);
    }
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
      this._set_canvas_and_px_magnifier_size(this.get_container());
      this._screenshot = message[PNG];
      this._pixel_magnifier.set_source_base_64(this._screenshot, "image/png");
    }
  };

  this._on_active_tab = function(msg)
  {
    this._top_rt_id = msg.runtimes_with_dom[0];
    if (this._take_screenshot && this.isvisible())
    {
      this._pixel_magnifier.scale = 1;
      window.messages.post('screenshot-scale',
                             {scale: this._pixel_magnifier.scale});
      this._get_window_size();
    }
  };

  this._on_profile_disabled = function(msg)
  {
    if (msg.profile == window.app.profiles.DEFAULT)
      this._screenshot = "";
  };

  /* action handler interface */

  ActionHandlerInterface.apply(this);

  this._handlers['zoom'] = function(event, target)
  {
    if (this._screenshot)
    {
      var scale = this._pixel_magnifier.scale + (event.wheelDelta > 0 ? 1 : -1);
      this._pixel_magnifier.zoom(event.offsetX, event.offsetY, scale);
      this._pixel_magnifier.draw();
      window.messages.post('screenshot-scale',
                           {scale: this._pixel_magnifier.scale});
    }
  }.bind(this);

  this._handlers['dragstart'] = function(event)
  {
    if (this._screenshot && !this._drag_state.interval)
    {
      this._drag_state.start_drag(event);
    }
  }.bind(this);

  this._handlers['click'] = function(event)
  {
    if (this._screenshot)
    {
      this._sample_event = event;
      var color = this._pixel_magnifier.get_average_color(event.offsetX,
                                                          event.offsetY,
                                                          this._sample_size);
      var colors = this._pixel_magnifier.get_colors_of_area(event.offsetX,
                                                            event.offsetY,
                                                            this._sample_size);
      window.messages.post('sceenshot-sample-color', {color: color,
                                                      colors: colors});
    }
  }.bind(this);

  this._handlers['take-first-screenshot'] = function(event)
  {
    this._take_screenshot = true;
    this.update();
  }.bind(this);

  this._init = function(id, name, container_class)
  {
    this.required_services = ["ecmascript-debugger", "exec"];
    this.init(id, name, container_class, "", "screenshot-tool");
    this._pixel_magnifier = new PixelMagnifier();
    this._pixel_magnifier.onload = function()
    {
      this.draw();
    };
    this._screenshot = "";
    this._tagman = window.tag_manager;
    this._esdb = window.services['ecmascript-debugger'];
    this._exec = window.services.exec;
    this._drag_state = new cls.DragState(this._pixel_magnifier);
    this._setting = window.settings['screenshot-controls'];
    this._sample_size = 1;
    this._take_screenshot = this._setting.get('auto-screenshot');
    var evh = window.eventHandlers;
    evh.mousewheel["screenshot-tool"] = this._handlers['zoom'];
    evh.mousedown["screenshot-tool"] = this._handlers['dragstart'];
    evh.click["screenshot-tool"] = this._handlers['click'];
    evh.click["take-first-screenshot"] = this._handlers['take-first-screenshot'];
    window.messages.addListener('active-tab', this._on_active_tab.bind(this));
    window.messages.addListener('setting-changed', this._on_setting_change.bind(this));
    messages.addListener('profile-disabled', this._on_profile_disabled.bind(this));
  };

  this._on_setting_change = function(msg)
  {
    if (msg.id == 'screenshot-controls' &&
        msg.key == 'auto-screenshot')
    {
      this._take_screenshot = this._setting.get('auto-screenshot');
    }
  };

  this._first_start_tmpl = function()
  {
    return (
    ['div',
      ['span',
        ui_strings.S_BUTTON_TAKE_SCREENSHOT,
        'class', 'ui-button',
        'handler', 'take-first-screenshot',
        'tabindex', '1'],
      ['p',
        window.templates.settingCheckbox('screenshot-controls',
                                         'auto-screenshot',
                                         false,
                                         ui_strings.S_SWITCH_TAKE_SCREENSHOT_AUTOMATICALLY)],
      'class', 'info-box']);
  };

  /* implementation */

  this._set_canvas_and_px_magnifier_size = function(container)
  {
    if (this._pixel_magnifier && container)
    {
      this._pixel_magnifier.set_canvas(container.clearAndRender(['canvas']));
      this._pixel_magnifier.width = container.clientWidth;
      this._pixel_magnifier.height = container.clientHeight;
    }
  }

  this.createView = function(container)
  {
    if (this._take_screenshot)
    {
      this._set_canvas_and_px_magnifier_size(container);
      if (!this._screenshot)
      {
        this._get_window_size();
      }
      else
      {
        this._pixel_magnifier.draw();
      }
    }
    else
    {
      container.clearAndRender(this._first_start_tmpl());
    }
  };

  this.create_disabled_view = function(container)
  {
    container.clearAndRender(window.templates.disabled_view());
  };

  this.onresize = function(container)
  {
    if(this.isvisible())
    {
      this._pixel_magnifier.width = container.clientWidth;
      this._pixel_magnifier.height = container.clientHeight;
      this._pixel_magnifier.draw();
    }
  };

  this.update_screenshot = function(keep_zoom_level)
  {
    if (!keep_zoom_level)
    {
      this._pixel_magnifier.scale = 1;
      window.messages.post('screenshot-scale',
                             {scale: this._pixel_magnifier.scale});
    }
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

  /* initialisation */

  this._init(id, name, container_class);

};

cls.ScreenShotView.prototype = ViewBase;
