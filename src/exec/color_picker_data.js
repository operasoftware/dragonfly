/* color picker data class */

var color_picker_data = new function()
{
  /* interface */

  // returns a canvas data pixel array
  this.get_data = function(){};
  // to set the width and height of the screenshot
  // returns a canvas pixel array of the specified area
  this.get_area_data = function(x, y, w, h){};
  // returns the dimension of the screenshot 
  // as an object with width and height properties
  this.get_dimensions = function(){};
  this.set_screenshot_dimension = function(dimension){};
  // to start and stop the color picker
  this.set_active_state = function(bool){};
  this.get_active_state = function(){}; 

  /* constants */

  const 
  INTERVAL = 50,
  INTERVAL_SLEEP = 500,
  STATUS = 0,
  VALUE = 2,
  OBJECT_VALUE = 3,
  // sub message ObjectValue 
  OBJECT_ID = 0;

  /* private */

  this._top_rt_id = 0;
  this._color_picker = 0;
  this._color_picker_rt_id = 0;
  this._interval = 0;
  this._is_active = false;
  this._width = 7;
  this._height = 7;
  this._delta = this._height / 2 << 0;
  this._x = 0;
  this._y = 0;
  this._count_no_change = 0;
  this._intervall = INTERVAL;
  this._data = null;
  this._screenshot_element = null; 
  this._canvas_source = null; 
  this._ctx_source =  null;

  var self = this;

  this._setup_color_picker = function()
  {
    if(!this._top_rt_id)
    {
      this._top_rt_id = window.host_tabs.getActiveTab()[0];
    }
    if(this._top_rt_id)
    {
      var script = this["return new ColorPicer()"];
      var tag = tagManager.set_callback(this, this._register_color_picker, [this._top_rt_id]);
      services['ecmascript-debugger'].requestEval(tag, [this._top_rt_id, 0, 0, script]);
    }
  }

  this._register_color_picker = function(satus, message, rt_id)
  {


    if (message[STATUS] == 'completed')
    {
      this._color_picker = message[OBJECT_VALUE][OBJECT_ID];
      this._color_picker_rt_id = rt_id;
      this._activate_color_picker();
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        "failed register_color_picker in ColorPicker");
    }
  }

  this._set_canavas_dimensions = function()
  {
    this._canvas_source.width = this._width;
    this._canvas_source.height = this._height;
  }

  this._stop_color_picker = function()
  {
    var script = "color_picker.stop()";
    var tag = tagManager.set_callback(this, this._handle_stop);
    services['ecmascript-debugger'].requestEval(tag, 
      [this._color_picker_rt_id, 0, 0, script, [["color_picker", this._color_picker]]]);
    this._is_active = false;
    this._color_picker = "";
  }

  this._handle_stop = function(status, message)
  {
    if(message[STATUS] != 'completed')
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        "failed handle_stop in ColorPicker");
    }
  }

  this._activate_color_picker = function()
  {
    if(!this._is_active)
    {
      this._is_active = true;
      setTimeout(this._get_mouse_position_bound, this._interval);
    }
  }

  this._get_mouse_position = function()
  {
    var script = "color_picker.get_mouse_position()";
    var tag = tagManager.set_callback(this, this._handle_mouse_position);
    services['ecmascript-debugger'].requestEval(tag,
      [this._color_picker_rt_id, 0, 0, script, [["color_picker", this._color_picker]]]);
  }

  this._get_mouse_position_bound = function()
  {
    self._get_mouse_position();
  }

  this._handle_mouse_position = function(status, message)
  {
    if (message[STATUS] == 'completed')
    {
      // TODO return a json format
      var pos_raw = eval(message[VALUE]);
      var pos = pos_raw && {
        x: pos_raw.x - this._delta,
          y: pos_raw.y - this._delta,
          w: this._width,
          h: this._height

      } || null;
      if(pos === null || pos.x == this._x && pos.y == this._y)
      {
        if(this._is_active)
        {
          /* */
          this._count_no_change += 1;
          if(this._count_no_change >= 5)
          {
            this._interval = INTERVAL_SLEEP;
          }
          /* */
          setTimeout(this._get_mouse_position_bound, this._interval);
        }
      }
      else
      {
        this._x = pos.x;
        this._y = pos.y;
        /* */
        this._count_no_change = 0;
        this._interval = INTERVAL;
        /* */
        window.services.exec.requestSetupScreenWatcher(
          tagManager.set_callback(this, this._handle_screenshot),
          [
            1,
            [pos.x, pos.y, pos.w, pos.h],
            [],
            window.window_manager_data.get_debug_context(),
            [],
            1
          ]
        );
      }
    }
  }

  this._handle_screenshot = function(status, message)
  {
    const PNG = 2;
    if(status == 0)
    {
      this._screenshot_element.src = "data:image/png;base64," + message[PNG];
    }
    else
    {
      setTimeout(this._get_mouse_position_bound, this._interval);
    }
  }

  this._handle_screenshot_bound = function(xml)
  {
    self._handle_screenshot(xml);
  }

  this._handle_screen_shot_data = function()
  {
    this._ctx_source.drawImage(this._screenshot_element, 0, 0, this._width, this._height);
    this._data = this._ctx_source.getImageData(0, 0, this._width, this._height).data;
    window.views.color_picker.display_screenshot();
    setTimeout(this._get_mouse_position_bound, this._interval);
  }

  this._handle_screen_shot_data_bound = function()
  {
    self._handle_screen_shot_data();
  }

  this._on_new_top_runtime = function(msg)
  {
    this._top_rt_id = msg.top_runtime_id;
    if(this._is_active)
    {
      this._stop_color_picker();
      this._setup_color_picker();
    }
  }

  this._on_new_top_runtime_bound = function(msg)
  {
    self._on_new_top_runtime(msg);
  }

  // color picker class on the host side
  this._ColorPicker = function()
  {
    var mousemove_event = null;
    var mousemove_is_listening = false;
    var is_setup = false;
    var click_catcher = null;

    var mousemove_handler = function(event)
    {
      mousemove_event = event;
    };
    var click_handler = function(event)
    {
      event.stopPropagation();
      event.preventDefault();
      if(mousemove_is_listening)
      {
        document.removeEventListener("mousemove", mousemove_handler, false);
        mousemove_is_listening = false;
      }
      else
      {
        document.addEventListener("mousemove", mousemove_handler, false);
        mousemove_is_listening = true;
      };
    };
    this.get_mouse_position = function()
    {
      if(mousemove_event)
      {
        return "({" +
            "x:" + mousemove_event.pageX + "," +
            "y:" + mousemove_event.pageY +
          "})"
      };
      return "null";
    };
    this.setup = function()
    {
      if(!is_setup)
      {
        /* this is hack to be able to stop the mosemove on click. 
           we have an interface to attache an event listener.
           that would require a round trip to the client for each click event.
           also it would not work with e.g. flash videos.
           if this will not work we will have to try that. */
        click_catcher = (document.body || document.documentElement).
          appendChild(document.createElement('click-catcher'));
        click_catcher.style.cssText = 
          "display: block !important;" +
          "margin: 0 !important;" +
          "padding: 0 !important;" +
          "top: 0 !important;" +
          "left: 0 !important;" +
          "height: " + window.innerHeight + "px !important;" +
          "width: " + window.innerWidth + "px !important;" +
          "position: fixed !important;" +
          "z-index: 10000 !important;";
        click_catcher.onclick = function(){};
        document.addEventListener("mousemove", mousemove_handler, false);
        document.addEventListener("click", click_handler, true);
        mousemove_is_listening = true;
        is_setup = true;
      };
    };
    this.stop = function()
    {
      if(is_setup)
      {
        if(click_catcher.parentNode)
        {
          click_catcher.parentNode.removeChild(click_catcher);
        }
        click_catcher = null;
        document.removeEventListener("mousemove", mousemove_handler, false);
        document.removeEventListener("click", click_handler, true);
        mousemove_is_listening = false;
        is_setup = false;
      };
    };
    this.setup();
  };
  

  this._init = function()
  {
    this["return new ColorPicer()"] = 
      "return new (" + this._ColorPicker.toString() + ")()";
    this._screenshot_element = document.createElement('img'); 
    this._screenshot_element.onload = this._handle_screen_shot_data_bound;
    this._canvas_source = document.createElement('canvas'); 
    this._ctx_source =  this._canvas_source.getContext('2d');
    this._set_canavas_dimensions();
    window.messages.addListener('new-top-runtime', this._on_new_top_runtime_bound);
  }

  /* interface implemantation */

  this.get_data = function()
  {
    return this._data;
  }

  this.get_area_data = function(x, y, w, h)
  {
    return this._ctx_source && this._ctx_source.getImageData(x, y, w, h).data || null;
  }

  this.get_dimensions = function()
  {
    return {width: this._width, height: this._height};
  }

  this.set_screenshot_dimension = function(dimension)
  {
    this._width = this._height = dimension;
    this._delta = this._height / 2 << 0;
    this._set_canavas_dimensions();
    window.views.color_picker.set_screenshot_dimension();
  }

  this.set_active_state = function(bool)
  {
    if(bool)
    {
      if(!this._color_picker)
      {
        this._setup_color_picker();
      }
      else
      {
        this._activate_color_picker();
      }
    }
    else
    {
      this._stop_color_picker();
    }
  }

  this.get_active_state = function(bool)
  {
    return this._is_active;
  }

  /* constructor calls */
  
  this._init();
}
