var cls = window.cls || ( window.cls = {} );

/**
  * @constructor 
  * @extends ViewBase
  */

cls.ColorPicker = function(id, name, container_class)
{
  var self = this;

  this._container = null;
  this._screenshot_element = null;

  this.createView = function(container)
  {
    _container = container;
    this.get_dimesions();
    container.innerHTML = 
      "<div class='padding'>" +
        "<h1>Color Picker</h1>" +
        "<p><label><input type='checkbox' handler='utils-color-picker'/> color picker</label></p>" +
        "<p><select id='scale-select-container' handler='update-color-picker-scale'></select></p>" +
        "<div id='table-container'></div>" +
        "<pre></pre>" +
      "</div>";
    this._create_table();
    this._create_scale_select();

  }

  this._width = 0;
  this._height = 0;
  this._scale = 30;

  this.update_scale = function(scale)
  {
    this._scale = scale;
    this._create_table();
  }

  this.get_dimesions = function()
  {
    var area = window.color_picker_data.get_dimensions();
    this._width = area.width;
    this._height = area.height;
  }

  this._create_scale_select = function()
  {
    const
    DELTA = 5,
    MAX_DIMENSION = 350;
    
    var 
    markup = "",
    max_scale = MAX_DIMENSION / this._width >> 0,
    i = DELTA;

    for( ; i  < max_scale ; i += DELTA)
    {
      markup += "<option" +  ( i == this._scale && " selected='selected'" || "" ) + ">" + i + "</option>";
    }
    document.getElementById('scale-select-container').innerHTML = markup;
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
  }

  this.update_screenshot = function()
  {
    var 
    pixel_count = this._width * this._height,
    img_data = window.color_picker_data.get_data(), 
    tds = document.getElementById('table-container').getElementsByTagName('td'), 
    i = 0,
    cur = 0;
      
    for( ; i < pixel_count; i++)
    {
      cur = 4 * i;
      tds[i].style.backgroundColor = "rgb(" + 
          img_data[cur + 0] + "," + 
          img_data[cur + 1] + "," + 
          img_data[cur + 2] +")";
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
  this._width = 9;
  this._height = 9;
  this._delta = this._height / 2 << 0;
  this._x = 0;
  this._y = 0;
  this._count_no_change = 0;
  this._intervall = INTERVAL;

  this._screenshot_element = null; //document.createElement('img'); 
  //this._screenshot_element.onload = function(){opera.postError('screenshot loaded')};
  this._canvas_source = null; //document.createElement('canvas'); 
  this._ctx_source =  null; //this._canvas_source.getContext('2d');

  var self = this;

  this.get_dimensions = function()
  {
    return {width: this._width, height: this._height};
  }

  this.get_data = function()
  {
    return this._data;
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