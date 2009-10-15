var cls = window.cls || ( window.cls = {} );

/**
  * @constructor 
  * @extends ViewBase
  */

cls.ColorPicker = function(id, name, container_class)
{
  const 
  DELTA_SCALE = 5, 
  SCALE = 35,
  MAX_DIMENSION = 350,
  MAX_PIXEL = 33,
  AVERAGE_PIXEL_COUNT = 5,
  COLOR_MASK_ALPHA = 0.5;
  
  var self = this;

  this._container = null;
  this._screenshot_element = null;
  this._colors = new Colors();
  this._width = 0;
  this._height = 0;
  this._scale = SCALE;
  this._average = 0;
  this._average_delta = 0;

  this.createView = function(container)
  {
    this._container = container;
    this.get_dimesions();
    container.render(window.templates.color_picker(
          this._width, this._height, this._scale, this._scale, MAX_PIXEL, 
          this._scale, DELTA_SCALE, MAX_DIMENSION));
    this.setup_canvas();
    this.update_screenshot();
  }

  this.update_scale = function(scale)
  {
    this._scale = scale;
    this.setup_canvas();
  }

  this.get_average = function()
  {
    return this._average;
  }

  this.update_average = function(average)
  {
    this._average = average;
    this._average_delta = average/2 >> 0;
  }

  this.setup_canvas = function()
  {
    var 
    w = this._scale * this._width,
    h = this._scale * this._height,
    canvases = this._container.getElementsByTagName('canvas'),
    canvas = null;
    i = 0;

    for( ; canvas = canvases[i]; i++)
    {
      canvas.style.height = ( canvas.height = h ) + 'px';
      canvas.style.width =  ( canvas.width = w ) + 'px';
      this[i && '_ctx_color_mask' || '_ctx'] = canvas.getContext('2d');
    }
    this._ctx_color_mask.globalAlpha = COLOR_MASK_ALPHA;
  }

  this.update_color_display = function()
  {
    this.get_dimesions();
    if(this._scale * this._width > MAX_DIMENSION)
    {
      this._scale = DELTA_SCALE;
      while((this._scale + DELTA_SCALE) * this._width <= MAX_DIMENSION)
      {
        this._scale += DELTA_SCALE;
      }
    }
    if(this.isvisible())
    {
      this.setup_canvas();
      this._update_scale_select();
    }
  }

  this.get_dimesions = function()
  {
    var area = window.color_picker_data.get_dimensions();
    this._width = area.width;
    this._height = area.height;
  }

  this._update_scale_select = function()
  {
    document.getElementById('color-picker-scale').clearAndRender(
        window.templates.color_picker_create_scale_select(
            this._width, this._scale, DELTA_SCALE, MAX_DIMENSION));
  }

  this._update_dimesion_select = function()
  {
    document.getElementById('color-picker-area').clearAndRender(
        window.templates.color_picker_create_dimesion_select(this._width, MAX_PIXEL));
  }

  this.update_screenshot = function()
  {
    var 
    pixel_count = this._width * this._height,
    img_data = window.color_picker_data.get_data(),  
    x = 0,
    i = 0, 
    cur = 0,
    scale = this._scale;

    if(img_data)
    {
      for( ; i < pixel_count; i++)
      {
        cur = 4 * i;
        this._ctx.fillStyle = "rgb(" + 
            img_data[cur + 0] + "," + 
            img_data[cur + 1] + "," + 
            img_data[cur + 2] +")";
        x = i % this._width;
        this._ctx.fillRect(x * scale, ( i - x ) / this._width * scale, scale, scale); 
      }
      this.update_center_color();
    }
  }

  this.color_picker_picked = function(event, target)
  {
    if(this._container)
    {
      var box = event.target.getBoundingClientRect();
      this.update_center_color(
        (event.clientX - box.left) / this._scale >> 0,
        (event.clientY- box.top) / this._scale >> 0);
    }
  }

  this.update_center_color = function(x, y)
  {
    if(this.isvisible())
    {
      var 
      is_index = typeof x == "number" && typeof y == "number",
      index = 0,
      scale = this._scale,
      w = this._average,
      h = this._average,
      color = null,
      r = 0, 
      g = 0, 
      b = 0, 
      i = 0,
      rgb = null,
      hsl = null,
      hex = "";

      if(!is_index)
      {
        x = this._width / 2 >> 0;
        y = this._height / 2 >> 0;
      }
      index = y * this._width + x;
      x -= this._average_delta;
      y -= this._average_delta;
      if( x < 0 )
      {
        w += x;
        x = 0;
      }
      if( y < 0 )
      {
        h += y;
        y = 0;
      }
      if( x + w > this._width )
      {
        w = this._width - x;
      }
      if( y + h > this._height )
      {
        h = this._height - y;
      }
      color = window.color_picker_data.get_area_data(x, y, w, h);
      for( ; i < color.length; i += 4)
      {
        r += color[i+0];
        g += color[i+1];
        b += color[i+2];
      };
      i /= 4;
      this._colors.setRGB([r / i >> 0, g / i >> 0, b / i >> 0]);
      rgb = this._colors.getRGB();
      hsl = this._colors.getHSL();
      hex = this._colors.getHex();
      document.getElementById('center-color').style.backgroundColor = "#" + hex;
      document.getElementById('center-color-values').textContent = 
        "rgb: " + rgb.join(", ") + "\n" +
        "hsl: " + hsl[0] + ", " + hsl[1] + "%, " + hsl[2] + "%\n" +
        "hex: " + "#" + hex;

      this._ctx_color_mask.clearRect(0, 0, this._width * scale, this._height * scale);  
      if(is_index && index !== this._last_index)
      {
        this._ctx_color_mask.fillRect(0, 0, this._width * scale, this._height * scale); 
        this._ctx_color_mask.clearRect(x * scale, y * scale, w * scale, h * scale); 
      }
      this._last_index = is_index && index !== this._last_index ? index : -1;      
    }
  }

  this.update_average(AVERAGE_PIXEL_COUNT);
  this.init(id, name, container_class);
}

var color_picker_data = new function()
{
  const 
  INTERVAL = 50,
  INTERVAL_SLEEP = 500;

  // update values on top rt change
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

  this.get_dimensions = function()
  {
    return {width: this._width, height: this._height};
  }

  this.get_data = function()
  {
    return this._data;
  }

  this.get_area_data = function(x, y, w, h)
  {
    return this._ctx_source.getImageData(x, y, w, h).data;
    for( var pos = y * this._width + x, i = 0, ret = []; i < h; i++)
    {
      ret = ret.concat(this._data.slice(pos * 4, (pos + w) * 4));
      pos += this._width;
    }
    return ret;
  }

  this.update_area = function(dimension)
  {
    this._width = this._height = dimension;
    this._delta = this._height / 2 << 0;
    this._set_canavas_dimensions();
    window.views.color_picker.update_color_display();
  }

  this._set_canavas_dimensions = function()
  {
    this._canvas_source.width = this._width;
    this._canvas_source.height = this._height;
  }

  this.set_active_state = function(bool)
  {
    if(bool)
    {
      if(!this._color_picker)
      {
        this.setup_color_picker();
      }
      else
      {
        this.activate_color_picker();
      }
    }
    else
    {
      this.stop_color_picker();
    }
  }

  this.get_active_state = function(bool)
  {
    return this._is_active;
  }

  this.stop_color_picker = function()
  {
    var script = "color_picker.stop()";
    var tag = tagManager.setCB(this, this.handle_stop);
    services['ecmascript-debugger'].eval(tag, this._color_picker_rt_id, 
      '', '', script, ["color_picker", this._color_picker]);
  }

  this.handle_stop = function(xml)
  {
    var status = xml.getNodeData('status');

    if(  status == 'completed' )
    {
      this._is_active = false;
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        "failed handle_stop in ColorPicker");
    }
  }

  this.setup_color_picker = function()
  {
    if(!this._top_rt_id)
    {
      this._top_rt_id = window.host_tabs.getActiveTab()[0];
    }
    if(this._top_rt_id)
    {
      var script = this["return new ColorPicer()"];
      var tag = tagManager.setCB(this, this.register_color_picker, [this._top_rt_id]);
      services['ecmascript-debugger'].eval(tag, this._top_rt_id, '', '', script);
    }
  }

  this.register_color_picker = function(xml, rt_id)
  {
    var 
    status = xml.getNodeData('status'),
    obj_id = xml.getNodeData('object-id');

    if(  status == 'completed' && obj_id )
    {
      this._color_picker = obj_id;
      this._color_picker_rt_id = rt_id;
      this.activate_color_picker();
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        "failed register_color_picker in ColorPicker");
    }
  }

  this.activate_color_picker = function()
  {
    this._is_active = true;
    setTimeout(this.get_mouse_position_bound, this._interval);
  }

  this.get_mouse_position = function()
  {
    var script = "color_picker.get_mouse_position()";
    var tag = tagManager.setCB(this, this.handle_mouse_position);
    services['ecmascript-debugger'].eval(tag, this._color_picker_rt_id, 
      '', '', script, ["color_picker", this._color_picker]);
  }

  this.get_mouse_position_bound = function()
  {
    self.get_mouse_position();
  }

  this.handle_mouse_position = function(xml)
  {
    var status = xml.getNodeData('status');
    if( status == 'completed' )
    {
      var return_value = xml.getElementsByTagName('string')[0];
      var pos_raw = eval(return_value.textContent);
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
          setTimeout(this.get_mouse_position_bound, this._interval);
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
        window.services.exec.screen_watcher(this.handle_screenshot_bound, 0, 0, pos);
      }
    }
  }

  this.handle_screenshot = function(xml)
  {
    var png= xml.getElementsByTagName('png')[0];
    if(png)
    {
      this._screenshot_element.src = "data:image/png;base64," + png.firstChild.nodeValue;
    }
    else
    {
      setTimeout(this.get_mouse_position_bound, this._interval);
    }
  }

  this.handle_screenshot_bound = function(xml)
  {
    self.handle_screenshot(xml);
  }

  this.handle_screen_shot_data = function()
  {
    this._ctx_source.drawImage(this._screenshot_element, 0, 0, this._width, this._height);
    this._data = this._ctx_source.getImageData(0, 0, this._width, this._height).data;
    window.views.color_picker.update_screenshot();
    setTimeout(this.get_mouse_position_bound, this._interval);
  }

  this.handle_screen_shot_data_bound = function()
  {
    self.handle_screen_shot_data();
  }

  // color picker class on the host side
  var ColorPicker = function()
  {
    var mousemove_event = null;
    var mousemove_is_listening = false;
    var is_setup = false;

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
        document.removeEventListener("mousemove", mousemove_handler, false);
        document.removeEventListener("click", click_handler, true);
        mousemove_is_listening = false;
        is_setup = false;
      };
    };
    this.setup();
  };
  

  this.init = function()
  {
    this["return new ColorPicer()"] = 
      "return new (" + ColorPicker.toString() + ")()";
    this._screenshot_element = document.createElement('img'); 
    this._screenshot_element.onload = this.handle_screen_shot_data_bound;
    this._canvas_source = document.createElement('canvas'); 
    this._ctx_source =  this._canvas_source.getContext('2d');
    this._set_canavas_dimensions();
  }
  // constructor calls
  this.init();
}

cls.ColorPicker.prototype = ViewBase;
new cls.ColorPicker('color_picker', 'Color Picker', 'scroll');

eventHandlers.click['utils-color-picker'] = function(event, target)
{
  var is_active = window.color_picker_data.get_active_state();
  window.color_picker_data.set_active_state(!is_active);
  event.target.value = is_active && "Start" || "Stop";
}

eventHandlers.change["update-color-picker-scale"] = function(event, target)
{
  window.views.color_picker.update_scale(parseInt(target.value));
}

eventHandlers.change["update-area"] = function(event, target)
{
  window.color_picker_data.update_area(parseInt(target.value));
}

eventHandlers.change["update-average"] = function(event, target)
{
  window.views.color_picker.update_average(parseInt(target.value));
}

eventHandlers.click["color-picker-picked"] = function(event, target)
{
  window.views.color_picker.color_picker_picked(event, target); //parseInt(event.target.getAttribute('data-index')));
}
