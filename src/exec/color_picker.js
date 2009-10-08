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
    container.innerHTML = 
      "<div class='padding'>" +
        "<h1>Color Picker</h1>" +
        "<p><label><input type='checkbox' handler='utils-color-picker'/> color picker</label></p>" +
        "<p><img src='' style='width:11px;height:11px;border: 1px solid #999;' /></p>" +
        "<p><canvas style='width:11px;height:11px;border: 1px solid #999;' ></canvas></p>" +
        "<p><canvas style='width:" + ( this._x * this._scale ) + "px;height:" + ( this._y * this._scale ) + "px;border: 1px solid #999;' ></canvas></p>" +
        "<pre></pre>" +
      "</div>";
    this._screenshot_element = container.getElementsByTagName('img')[0];
    this._canvas_source = container.getElementsByTagName('canvas')[0];
    this._canvas_source.width = 11;
    this._canvas_source.height = 11;
    this._ctx_source =  this._canvas_source.getContext('2d');
    this._canvas_target = container.getElementsByTagName('canvas')[1];
    //alert(this._canvas_target);
    this._canvas_target.width = this._x * this._scale;
    this._canvas_target.height = this._y * this._scale;
    this._ctx_target = this._canvas_target.getContext('2d');

  }

  this._x = 11;
  this._y = 11;
  this._scale = 20;

  this.update_screenshot = function()
  {
    var x = 0, y = 0, img_data = null, scale = this._scale;

    this._screenshot_element.src = color_picker_data.get_screenshot();
    this._ctx_target.clearRect(0, 0, this._x * scale, this._x * scale);
    this._ctx_source.drawImage(this._screenshot_element, 0, 0, 11, 11);
    
    for( ; x < this._x; x++)
    {
      for( y = 0; y < this._y; y++)
      {
        img_data = this._ctx_source.getImageData(x, y, 1, 1).data;
        this._ctx_target.fillStyle = "rgb(" + img_data[0] + "," + img_data[1] + "," + img_data[2] +")";
        this._ctx_target.fillRect(x * scale, y * scale , scale, scale);
      }

    }
    var img_data = this._ctx_source.getImageData(0,0,1,1).data;
    this._ctx_target.fillStyle = "rgb(" + img_data[0] + "," + img_data[1] + "," + img_data[2] +")";
    this._ctx_target.fillRect(0,0,8,8);

    // opera.postError(img_data[0]+' '+img_data[1]+' '+img_data[2]+' '+img_data[3]);//img_data.length);

  }




  this.init(id, name, container_class);
}

var color_picker_data = new function()
{
  // update values on top rt change
  this._top_rt_id = 0;
  this._color_picker = 0;
  this._color_picker_rt_id = 0;
  this._interval = 0;
  this._is_active = false;
  this._x = 0;
  this._y = 0;

  var self = this;

  const 
    INTERVAL = 100,
    WIDTH = 11,
    HEIGHT = 11;

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
    setTimeout(this.get_mouse_position_bound, INTERVAL);
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
    //opera.postError(888)
    var status = xml.getNodeData('status');
    if( status == 'completed' )
    {
      var return_value = xml.getElementsByTagName('string')[0];
      var pos = eval(return_value.textContent);
      //opera.postError(pos +' '+this._is_active)
      if(pos === null || pos.x == this._x && pos.y == this._y)
      {
        if(this._is_active)
        {
          setTimeout(this.get_mouse_position_bound, INTERVAL);
        }
      }
      else
      {
        this._x = pos.x;
        this._y = pos.y;
        window.services.exec.screen_watcher(this.handle_screenshot_bound, 0, 0, pos);
      }
    }
  }

  this.handle_screenshot = function(xml)
  {
    var png= xml.getElementsByTagName('png')[0];
    if(png)
    {
      this._screen_shot = "data:image/png;base64," + png.firstChild.nodeValue;
      window.views.color_picker.update_screenshot();
    }
    setTimeout(this.get_mouse_position_bound, INTERVAL);
  }

  this.handle_screenshot_bound = function(xml)
  {
    self.handle_screenshot(xml);
  }

  this.get_screenshot = function()
  {
  return this._screen_shot;
  }




  var ColorPicker = function()
  {
    var mousemove_event = null;
    var mousemove_is_listening = false;
    var is_setup = false;
    var width = 11;
    var height = 11;
    var delta_x = -5;
    var delta_y = -5;
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
            "x:" + (mousemove_event.pageX + delta_x) + "," +
            "y:" + (mousemove_event.pageY + delta_y) + "," +
            "w:" + width + "," +
            "h:" + height + 
          "})"
      };
      return "null";
    };
    this.set_area = function(area)
    {
      // TODO
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
  
  this["return new ColorPicer()"] = 
    "return new (" + ColorPicker.toString() + ")()";
}

cls.ColorPicker.prototype = ViewBase;
new cls.ColorPicker('color_picker', 'Color Picker', 'scroll');

eventHandlers.change['utils-color-picker'] = function(event, target)
{
  window.color_picker_data.set_active_state(target.checked);
}