var PixelMagnifier = function()
{
  this._init();
};

PixelMagnifier.prototype = new function()
{

  /* interface */

  this.set_canvas = function(canvas){};
  this.set_source_base_64 = function(string, mime){};
  this.zoom = function(x, y, scale){};
  this.clear = function(){};
  this.get_average_color = function(x, y, sample_size){};

  this.width;
  this.height;
  this.x;
  this.y;
  this.scale;

  this.max_scale = 30;

  /* private */

  this.__defineSetter__('width', function(width)
  {
    if (this._target_canvas)
    {
      this._target_canvas.width = width;
      this._src_area.width = this.width;
      this._target_area.width = width;
      this._onsrcload();
    }
  });

  this.__defineGetter__('width', function()
  {
    return this._target_area.width;
  });

  this.__defineSetter__('height', function(height)
  {
    if (this._target_canvas)
    {
      this._target_canvas.height = height;
      this._src_area.height = this.height;
      this._target_area.height = height;
      this._onsrcload();
    }
  });

  this.__defineGetter__('height', function()
  {
    return this._target_area.height;
  });

  this.__defineSetter__('scale', function(scale)
  {
    this._scale = scale;
  });

  this.__defineGetter__('scale', function()
  {
    return this._scale;
  });

  this.__defineSetter__('x', function(x)
  {
    this._src_area.x = x;
    this._check_src_area_position();
  });

  this.__defineGetter__('x', function()
  {
    return this._src_area.x;
  });

  this.__defineSetter__('y', function(y)
  {
    this._src_area.y = y;
    this._check_src_area_position();
  });

  this.__defineGetter__('y', function()
  {
    return this._src_area.y;
  });

  this._check_src_area_dimesions = function()
  {
    if (this._src_area.width > this._src_area.max_width)
    {
      this._src_area.width = this._src_area.max_width;
    }
    if (this._src_area.height > this._src_area.max_height)
    {
      this._src_area.height = this._src_area.max_height;
    }
  };

  this._check_src_area_position = function()
  {
    if (this._src_area.x < 0)
    {
      this._src_area.x = 0;
    }
    if (this._src_area.x + this._src_area.width > this._src_area.max_width)
    {
      this._src_area.x = this._src_area.max_width - this._src_area.width;
    }
    if (this._src_area.y < 0)
    {
      this._src_area.y = 0;
    }
    if (this._src_area.y + this._src_area.height > this._src_area.max_height)
    {
      this._src_area.y = this._src_area.max_height - this._src_area.height;
    }
  };

  this._onsrcload = function(event)
  {
    if (this._src.src && this._src.width && this._src.height)
    {
      if (this._src)
      {
        this._src_area.max_width = this._src.width;
        this._src_area.max_height = this._src.height;
      }
      this._src_area.width = Math.round(this.width / this._scale);
      this._src_area.height = Math.round(this.height / this._scale);
      this._check_src_area_dimesions();
      this._check_src_area_position();
      this._has_source = true;
      if (event && this.onload)
      {
        this.onload(event);
      }
    }
  };

  this._init = function()
  {
    this._target_canvas = null;
    this._ctx_target = null;
    this._src_canvas = document.createElement('canvas');
    this._ctx_src = this._src_canvas.getContext('2d');
    this._src = document.createElement('img');
    this._src.onload = this._onsrcload.bind(this);
    this._src_area = {x:0, y: 0, width: 0, height: 0, max_width: 0, max_height: 0};
    this._target_area = {x:0, y: 0, width: 0, height: 0, max_width: 0, max_height: 0};
    this._scale = 1;
    this._has_source = false;
  };

  /* implementation */

  this.set_canvas = function(canvas)
  {
    this._target_canvas = canvas;
    this._ctx_target = this._target_canvas.getContext('2d');
  };

  this.set_source_base_64 = function(string, mime)
  {
    this._src.src = "data:" + mime + ";base64," + string;
  };

  this.zoom = function(x, y, scale)
  {
    if (scale < 1)
    {
      scale = 1;
    }
    else if (scale > this.max_scale)
    {
      scale = 30;
    }
    this._src_area.width = Math.round(this._target_area.width / scale);
    this._src_area.height = Math.round(this._target_area.height / scale);
    this._check_src_area_dimesions();
    this._src_area.x = Math.round(this._src_area.x + (x / this._scale - x / scale));
    this._src_area.y = Math.round(this._src_area.y + (y / this._scale - y / scale));
    this._check_src_area_position();
    this._src_canvas.width = this._src_area.width;
    this._src_canvas.height = this._src_area.height;
    this._scale = scale;
  };

  this.draw = function()
  {
    if (!(this._target_canvas && this._has_source))
    {
      return
    }
    this._ctx_target.clearRect(0, 0,
                               this._target_area.width, this._target_area.height);

    if (this._scale > 10)
    {
      this._ctx_src.drawImage(this._src,
                              this._src_area.x, this._src_area.y,
                              this._src_area.width, this._src_area.height,
                              0, 0, this._src_area.width, this._src_area.height);
      var pixel_count = this._src_area.width * this._src_area.height;
      var octets_source = this._ctx_src.getImageData(0, 0,
                                                     this._src_area.width,
                                                     this._src_area.height).data;
      if (octets_source)
      {
        for (var x = 0, i = 0, cur = 0; i < pixel_count; i++)
        {
          cur = 4 * i;
          this._ctx_target.fillStyle = "rgb(" + octets_source[cur + 0] + "," +
                                                octets_source[cur + 1] + "," +
                                                octets_source[cur + 2] + ")";
          x = i % this._src_area.width;
          this._ctx_target.fillRect(x * this._scale,
                                    (i - x) / this._src_area.width * this._scale,
                                    this._scale, this._scale);
        }
      }
    }
    else if (this._scale > 1)
    {
      this._ctx_src.drawImage(this._src,
                              this._src_area.x, this._src_area.y,
                              this._src_area.width, this._src_area.height,
                              0, 0, this._src_area.width, this._src_area.height);
      var octets_src = this._ctx_src.getImageData(0, 0,
                                                  this._src_area.width,
                                                  this._src_area.height).data;
      var image_data_target = this._ctx_target.createImageData(this._src_area.width * this._scale,
                                                               this._src_area.height * this._scale);
      var octets_target = image_data_target.data;
      var octets_src_length = octets_src.length;
      var octets_src_width = this._src_area.width * 4, j = i;
      for (var i = 0, j = 0, r, g, b, a, line_count, scale_count, shift;
           i < octets_src_length;
           i += 4, j += 4 * this._scale)
      {
        r = octets_src[i];
        g = octets_src[i + 1];
        b = octets_src[i + 2];
        a = octets_src[i + 3];
        if (i && (i % octets_src_width == 0))
        {
          j += (this._scale - 1) * this._scale * octets_src_width;
        }
        for (line_count = 0; line_count < this._scale; line_count++)
        {
          for (scale_count = 0; scale_count < this._scale; scale_count++)
          {
            shift = line_count * this._scale * octets_src_width + 4 * scale_count + j;
            octets_target[shift] = r;
            octets_target[shift + 1] = g;
            octets_target[shift + 2] = b;
            octets_target[shift + 3] = a;
          }
        }
      }
      this._ctx_target.putImageData(image_data_target, 0, 0);
    }
    else if (this._scale == 1)
    {
      this._ctx_target.drawImage(this._src,
                                 this._src_area.x, this._src_area.y,
                                 this._src_area.width, this._src_area.height,
                                 0, 0, this._src_area.width, this._src_area.height);
    }
  };

  this._get_image_data_of_area = function(x, y, sample_size)
  {
    x -= x % this._scale;
    y -= y % this._scale;
    x /= this._scale;
    y /= this._scale;
    x -= (sample_size - 1) / 2;
    y -= (sample_size - 1) / 2;
    var src = this._scale == 1 ? this._ctx_target : this._ctx_src;
    return src.getImageData(x, y, sample_size, sample_size);
  }

  this.get_colors_of_area = function(x, y, sample_size)
  {
    var image_data = this._get_image_data_of_area(x, y, sample_size);
    var color = [];
    var ret = [];
    Array.prototype.forEach.call(image_data.data, function(octet, index)
    {
      if (!((index + 1) % 4))
      {
        ret.push(color);
        color = [];
      }
      else
      {
        color.push(octet);
      }
    });
    return ret;
  };

  this.get_average_color = function(x, y, sample_size)
  {
    var image_data = this._get_image_data_of_area(x, y, sample_size);
    return Array.prototype.reduce.call(image_data.data, function(rgba, octet, index)
    {
      rgba[index % 4] += octet;
      return rgba;
    }, [0, 0, 0, 0]).map(function(sum)
    {
      return Math.round(sum / (sample_size * sample_size));
    }).slice(0, 3);
  };

};
