var cls = window.cls || ( window.cls = {} );

/**
  * @constructor 
  * @extends ViewBase
  */

cls.ColorPicker = function(id, name, container_class)
{
  const 
  DELTA_SCALE = 5, 
  MAX_DIMENSION = 350,
  MAX_PIXEL = 33;
  
  var self = this;

  this._container = null;
  this._screenshot_element = null;

  this._colors = new Colors();

  this.createView = function(container)
  {
    _container = container;
    this.get_dimesions();
    container.innerHTML = 
    "<div class='padding'>" +
      "<h1>Color Picker</h1>" +
      "<p><label><input type='checkbox' handler='utils-color-picker'/> color picker</label></p>" +
      "<p><label>dimensions: <select id='color-picker-area' " +
          "handler='update-area'></select></label></p>" +
      "<p><label>scale: <select id='color-picker-scale' " +
          "handler='update-color-picker-scale'></select></label></p>" +
      "<div id='table-container' handler='color-picker-picked'></div>" +
      // "<div id='table-container-debug' ></div>" +
      "<h2>center color</h2>" +
      "<p><label>number of pixel for the color: <select handler='update-average'>" +
        "<option value='1'>1 x 1</option>" +
        "<option value='3'>3 x 3</option>" +
        "<option value='5' selected='selected'>5 x 5</option>" +
        "<option value='7'>7 x 7</option>" +
        "<option value='9'>9 x 9</option>" +
        "</select></label></p>" +
      "<div id='center-color'></div>" +
      "<pre id='center-color-values'></pre>" +
    "</div>";
    this._create_table();
    this._create_scale_select();
    this._create_dimesion_select();
  }

  this._width = 0;
  this._height = 0;
  this._scale = 35;

  this.update_scale = function(scale)
  {
    this._scale = scale;
    this._create_table();
  }

  this._average = 0;
  this._average_delta = 0;

  this.update_average = function(average)
  {
    this._average = average;
    this._average_delta = average/2 >> 0;
  }
  // move to init call
  this.update_average(5);

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
      this._create_table();
      this._create_scale_select();
    }
  }

  this.get_dimesions = function()
  {
    var area = window.color_picker_data.get_dimensions();
    this._width = area.width;
    this._height = area.height;
  }

  this._create_scale_select = function()
  {
    
    var markup = "", max_scale = MAX_DIMENSION / this._width >> 0, i = DELTA_SCALE;
    for( ; i  <= max_scale ; i += DELTA_SCALE)
    {
      markup += "<option" +  ( i == this._scale && " selected='selected'" || "" ) + ">" + i + "</option>";
    }
    document.getElementById('color-picker-scale').innerHTML = markup;
  }

  this._create_dimesion_select = function()
  {
    for( var markup = "", i = 3; i <= MAX_PIXEL; i += 2 )
    {
      markup += "<option value='" + i + "'" +
        ( i == this._width && " selected='selected'" || "" ) + ">" + 
        i + " x " + i + "</option>";
    }
    document.getElementById('color-picker-area').innerHTML = markup;
  }

  this._create_table = function()
  {
    var 
    cell = "<td style='height:" + this._scale + "px;width:" + this._scale + "px;'></td>",
    markup = "",
    tr = "",
    i = 0;

    for( ; i < this._width && (markup += cell); i++);
    tr = markup = "<tr>" + markup + "</tr>";
    for( i = 1; i < this._height && ( markup += tr ); i++);
    document.getElementById('table-container').innerHTML = "<table>" + markup + "</table>";
    //document.getElementById('table-container-debug').innerHTML = "<table>" + markup + "</table>";
    
    var tds = document.getElementById('table-container').getElementsByTagName('td'), td = null;
    for( i=0; td = tds[i]; i++)
    {
      td.setAttribute('data-index', i);
    }
  }

  var debug_color = function(_colors)
  {
    var tds = document.getElementById('table-container-debug').getElementsByTagName('td'),
      td = null, i =0, cur = 0;
    for(;td = tds[i]; i++)
    {
      

        //cur = 4 * i;
        //opera.postError(cur +' '+ _colors.length +' '+ i+' '+ self._width +' '+ self._average)
        if( cur < _colors.length && (i % self._width) < self._average)
      {

        tds[i].style.backgroundColor = "rgb(" + 
            _colors[cur + 0] + "," + 
            _colors[cur + 1] + "," + 
            _colors[cur + 2] +")";
        cur += 4;
      }
      else
      {
         tds[i].style.backgroundColor = "transparent";
      }
      
      
    }
  }

  this.update_screenshot = function()
  {
    var 
    pixel_count = this._width * this._height,
    img_data = window.color_picker_data.get_data(), 
    tds = document.getElementById('table-container').getElementsByTagName('td'), 
    i = 0, // ( ( ( pixel_count / 2 >> 0 ) ) + 1 ) * 4,
    cur = 0; //,
    //center_color = [img_data[i + 0], img_data[i + 1], img_data[i + 2]];
    //opera.postError('center color: '+ center_color);
      
    for( i = 0 ; i < pixel_count; i++)
    {
      cur = 4 * i;
      tds[i].style.backgroundColor = "rgb(" + 
          img_data[cur + 0] + "," + 
          img_data[cur + 1] + "," + 
          img_data[cur + 2] +")";
    }
    
    this.update_center_color(/*center_color*/);


  }

  this.update_center_color = function(index)
  {
    if(this.isvisible())
    {
      index || ( index = this._width * this._height / 2 >> 0 );
      var 
      x = ( index % this._width ) - this._average_delta,
      y = ( index / this._width >> 0 ) - this._average_delta,
      w = this._average,
      h = this._average;

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
      var 
      color = window.color_picker_data.get_area_data(x, y, w, h),
      r = 0, 
      g = 0, 
      b = 0, 
      i = 0;
      var debug_r=[],debug_g=[],debug_b=[];
      //debug_color(color)
      for( ; i < color.length; i += 4)
      {
        r += color[i+0];
        g += color[i+1];
        b += color[i+2];
      };
      i /= 4;
      /*
      opera.postError('i: '+i)
        opera.postError(debug_r)
        opera.postError(debug_g)
        opera.postError(debug_b)
      */
      //opera.postError('average: '+[r/i, g/i, b/i])
      this._colors.setRGB([r/i>>0, g/i>>0, b/i>>0]);

      var 
      rgb = this._colors.getRGB(),
      hsl = this._colors.getHSL(),
      hex = this._colors.getHex();

      document.getElementById('center-color').style.backgroundColor = "#" + hex;
      document.getElementById('center-color-values').textContent = 
        "rgb: " + rgb.join(", ") + "\n" +
        "hsl: " + hsl[0] + ", " + hsl[1] + "%, " + hsl[2] + "%\n" +
        "hex: " + "#" + hex;
    }
  }

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

  this.stop_color_picker = function()
  {
    this._is_active = false;
    // TODO call stop on host object
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

eventHandlers.change['utils-color-picker'] = function(event, target)
{
  window.color_picker_data.set_active_state(target.checked);
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
  window.views.color_picker.update_center_color(parseInt(event.target.getAttribute('data-index')));
}