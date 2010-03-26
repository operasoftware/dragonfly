var cls = window.cls || ( window.cls = {} );

/**
  * @constructor 
  * @extends ViewBase
  */

cls.ColorPicker = function(id, name, container_class)
{
  /* interface */

  this.createView = function(container){};
  this.ondestroy = function(){};
  this.display_screenshot = function(){};
  this.set_screenshot_dimension = function(json_object){};
  this.set_scale = function(scale){};
  this.reset_default_values = function(){};
  this.pick_color = function(event, target){};
  this.set_average_dimension = function(average){};
  this.get_average_dimension = function(){};
  this.store_selected_color = function(){};
  this.set_stored_color = function(color){};
  this.manage_stored_colors = function(){};
  this.manage_stored_colors_done = function(){};
  this.delete_stored_color = function(index){};

  /* constants */

  const 
  DELTA_SCALE = 5,
  SCALE = 15,
  MAX_DIMENSION = 350,
  AVERAGE_PIXEL_COUNT = 3,
  COLOR_MASK_ALPHA = 0.5;

  /* private */  

  var self = this;

  this._container = null;
  this._ctx = null;
  this._ctx_color_mask = null;
  this._colors = new Colors();

  this._width = 0;
  this._height = 0;
  this._scale = SCALE;
  this._screenshot_width = 0;
  this._screenshot_height = 0;
  this._average = 0;
  this._average_delta = 0;
  this._selected_color = '';

  this._setup_canvas = function()
  {
    var 
    w = this._width,
    h = this._height,
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

  this._update_center_color = function(x, y)
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
      i = 0;

      if(!is_index)
      {
        x = this._screenshot_width / 2 >> 0;
        y = this._screenshot_height / 2 >> 0;
      }
      index = y * this._screenshot_width + x;
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
      if( x + w > this._screenshot_width )
      {
        w = this._screenshot_width - x;
      }
      if( y + h > this._screenshot_height )
      {
        h = this._screenshot_height - y;
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
      this._update_selected_color();
      this._ctx_color_mask.clearRect(0, 0, this._screenshot_width * scale, this._screenshot_height * scale);  
      if(is_index && index !== this._last_index)
      {
        this._ctx_color_mask.fillRect(0, 0, this._screenshot_width * scale, this._screenshot_height * scale); 
        this._ctx_color_mask.clearRect(x * scale, y * scale, w * scale, h * scale); 
      }
      this._last_index = is_index && index !== this._last_index ? index : -1; 
    }
  }

  this._update_selected_color = function()
  {
    var
    rgb = this._colors.getRGB(),
    hsl = this._colors.getHSL(),
    hex = this._colors.getHex();
    if(this.isvisible() && document.getElementById('center-color'))
    {
      document.getElementById('center-color').style.backgroundColor = "#" + hex;
      document.getElementById('center-color-values').textContent = 
        "rgb: " + rgb.join(", ") + "\n" +
        "hsl: " + hsl[0] + ", " + hsl[1] + "%, " + hsl[2] + "%\n" +
        "hex: " + "#" + hex;
    }
    this._selected_color = hex;
  }

  this._set_dimesions = function(container, screenshot_width, screenshot_height)
  {
    this._width = container.offsetWidth - (2 * 280);
    this._height = container.offsetHeight - (2* 12);
    this._width > MAX_DIMENSION && (this._width = MAX_DIMENSION);
    this._height > MAX_DIMENSION && (this._height = MAX_DIMENSION);
    if(screenshot_width && screenshot_height)
    {
      this._scale = Math.max(this._width / screenshot_width, this._height / screenshot_height) >> 0;
    }
    window.settings['color_picker'].set('color-picker-scale', this._scale);
    this._width -= this._width % this._scale;
    this._height -= this._height % this._scale;
    this._screenshot_width = this._width / this._scale;
    this._screenshot_height = this._height / this._scale;
    window.color_picker_data.set_dimension(this._screenshot_width, this._screenshot_height);
  }

  /* interface implementations */

  this.createView = function(container)
  {
    window.color_picker_data.set_active_state(true);
    this._container = container;
    var scale = window.settings['color_picker'].get('color-picker-scale');
    scale != this._scale && ( this._scale = scale);
    this._set_dimesions(container);
    container.render(window.templates.color_picker(
      this._screenshot_width, 
      this._screenshot_height, 
      this._scale, 
      DELTA_SCALE
      )
    );
    this._setup_canvas();
    this.display_screenshot();
  }

  this.ondestroy = function()
  {
    window.color_picker_data.set_active_state(false);
    this._container = 
    this._ctx = 
    this._ctx_color_mask = null;
  }

  this.display_screenshot = function()
  {
    var 
    pixel_count = this._screenshot_width * this._screenshot_height,
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
        x = i % this._screenshot_width;
        this._ctx.fillRect(x * scale, ( i - x ) / this._screenshot_width * scale, scale, scale); 
      }
      this._update_center_color();
    }
  }

  this.set_screenshot_dimension = function(json_obj)
  {
    var area = JSON.parse(json_obj);
    if (this.isvisible())
    {
      this._set_dimesions (this._container, area.w, area.h);
      this._container.innerHTML = "";
      this.createView(this._container);
    }
  }

  this.set_scale = function(scale)
  {
    this._scale = scale;
    window.settings['color_picker'].set('color-picker-scale', scale);
    if (this.isvisible())
    {
      this._container.innerHTML = "";
      this.createView(this._container);
    }
  }

  this.reset_default_values = function()
  {
    this.set_scale(15);
  }

  this.pick_color = function(event, target)
  {
    if(this._container)
    {
      var box = event.target.getBoundingClientRect();
      this._update_center_color(
        (event.clientX - box.left) / this._scale >> 0,
        (event.clientY- box.top) / this._scale >> 0);
    }
  }

  this.get_average_dimension = function()
  {
    return this._average;
  }

  this.set_average_dimension = function(average)
  {
    this._average = average;
    this._average_delta = average/2 >> 0;
    if(this._last_index > -1)
    {
      var 
      x = this._last_index % this._screenshot_width,
      y = (this._last_index - x) / this._screenshot_width;

      this._last_index = -1;
      this._update_center_color(x, y);
    }
  }

  this.store_selected_color = function()
  {
    var stored_colors = window.settings.color_picker.get('color-picker-stored-colors') || [];
    stored_colors.push(this._selected_color);
    window.settings.color_picker.set('color-picker-stored-colors', stored_colors);
    if(stored_colors = document.getElementsByClassName('color-picker-stored-colors')[0])
    {
      stored_colors.parentNode.replaceChild(
        document.render(window.templates.color_picker_stored_colors()), stored_colors);
    }
  }

  this.set_stored_color = function(color)
  {
    this._colors.setHex(color);
    this._update_selected_color();
  }

  this.manage_stored_colors = function()
  {
    if(this._container)
    {
      this._container.clearAndRender(window.templates.manage_stored_colors());
    }
  }

  this.manage_stored_colors_done = function()
  {
    if(this._container)
    {
      this._container.innerHTML = '';
      this.createView(this._container);
    }
  }

  this.delete_stored_color = function(index)
  {
    if(typeof index == 'number')
    {
      var stored_colors = window.settings.color_picker.get('color-picker-stored-colors') || [];
      stored_colors.splice(index, 1);
      window.settings.color_picker.set('color-picker-stored-colors', stored_colors);
      this.manage_stored_colors();
    }
  }

  /* constructor calls */

  this.set_average_dimension(AVERAGE_PIXEL_COUNT);
  this.init(id, name, container_class);
}

new Settings
(
  // id
  'color_picker', 
  // kel-value map
  {

    'color-picker-scale': 15,
  }, 
  // key-label map
  {
  
  },
  // settings map
  {
    checkboxes:
    [

    ]
  }
);

cls.ColorPicker.prototype = ViewBase;
new cls.ColorPicker('color_picker', 'Color Picker', 'scroll');
