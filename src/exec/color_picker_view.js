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
  this.set_screenshot_dimension = function(){};
  this.set_scale = function(scale){};
  this.pick_color = function(event, target){};
  this.set_average_dimension = function(average){};
  this.get_average_dimension = function(){};

  /* constants */

  const 
  DELTA_SCALE = 5, 
  SCALE = 20,
  MAX_DIMENSION = 350,
  MAX_PIXEL = 33,
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
  this._average = 0;
  this._average_delta = 0;

  this._get_dimesions = function()
  {
    var area = window.color_picker_data.get_dimensions();
    this._width = area.width;
    this._height = area.height;
  }

  this._setup_canvas = function()
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

  this._setup_scale_select = function()
  {
    document.getElementById('color-picker-scale').clearAndRender(
        window.templates.color_picker_create_scale_select(
            this._width, this._scale, DELTA_SCALE, MAX_DIMENSION));
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

  /* interface implementations */

  this.createView = function(container)
  {
    window.color_picker_data.set_active_state(true);
    this._container = container;
    this._get_dimesions();
    container.render(window.templates.color_picker(
          this._width, this._height, this._scale, this._scale, MAX_PIXEL, 
          this._scale, DELTA_SCALE, MAX_DIMENSION));
    this._setup_canvas();
    this.display_screenshot();
  }

  this.ondestroy = function()
  {
    window.color_picker_data.set_active_state(false);
    this._container = 
    this._ctx = 
    this._ctx_color_mask = null;null;
  }

  this.display_screenshot = function()
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
      this._update_center_color();
    }
  }

  this.set_screenshot_dimension = function()
  {
    this._get_dimesions();
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
      this._setup_canvas();
      this._setup_scale_select();
    }
  }

  this.set_scale = function(scale)
  {
    this._scale = scale;
    this._setup_canvas();
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
      x = this._last_index % this._width,
      y = (this._last_index - x) / this._width;

      this._last_index = -1;
      this._update_center_color(x, y);
    }
  }

  /* constructor calls */

  this.set_average_dimension(AVERAGE_PIXEL_COUNT);
  this.init(id, name, container_class);
}

cls.ColorPicker.prototype = ViewBase;
new cls.ColorPicker('color_picker', 'Color Picker', 'scroll');
