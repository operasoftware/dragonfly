/**
 * @fileoverview
 * Color class
 */

/**
* @constructor
*
*
* @class
* Represent a color. Allows for setting and getting color components based
* on RGV, HSV and HSL color spaces.
* See also http://en.wikipedia.org/wiki/Color_space
*/
var Colors = function()
{
  this.__rgb = [0, 0, 0];
  this.__hsl = [0, 50, 50];
  this.__hsv = [0, 50, 50]; 
}

Colors.prototype = new function()
{

  /**
   * Set the hue component of the color
   * @param h {int} desired value of hue
   * @returns {int} new value of hue
   */
  this.setHue = function(h)
  {
    h = this._fix_range(h, 360, 0);
    this.__hsl[HUE] = parseInt(h);
    this.__rgb = this.hsl_to_rgb( this.__hsl[HUE], this.__hsl[SAT], this.__hsl[LUM] );
    this.__hsv = this.rgb_to_hsv( this.__rgb[RED], this.__rgb[GREEN], this.__rgb[BLUE] );
    return this;
  }

  /**
   * Set the saturation component of the color
   * @param s {int} desired value of saturation
   * @returns {int} new value of saturation
   */
  this.setSaturation = function(s)
  {
    s = this._fix_range(s, 100, 0);
    this.__hsl[SAT] = parseFloat(s);
    this.__rgb = this.hsl_to_rgb( this.__hsl[HUE], this.__hsl[SAT], this.__hsl[LUM] );
    this.__hsv = this.rgb_to_hsv( this.__rgb[RED], this.__rgb[GREEN], this.__rgb[BLUE] );
    return this;
  }
  
  /**
   * Set the luminosity component of the color
   * @param l {int} desired value of luminosity
   * @returns {int} new value of luminosity
   */
  this.setLuminosity = function(l)
  {
    l = this._fix_range(l, 100, 0);
    this.__hsl[LUM] = parseFloat(l);
    this.__rgb = this.hsl_to_rgb( this.__hsl[HUE], this.__hsl[SAT], this.__hsl[LUM] );
    this.__hsv = this.rgb_to_hsv( this.__rgb[RED], this.__rgb[GREEN], this.__rgb[BLUE] );
    return this;
  }

  /**
   * Set hue component of the color, using HSV
   * http://en.wikipedia.org/wiki/HSV_color_space
   * @param h {float} desired value of hue
   * @returns {int} new value of hue
   */
  this.setHueV = function(h)
  {
    h = this._fix_range(h, 360, 0);
    this.__hsv[HUE] = parseInt(h);
    this.__rgb = this.hsv_to_rgb( this.__hsv[HUE], this.__hsv[SAT], this.__hsv[LUM] );
    this.__hsl = this.rgb_to_hsl( this.__rgb[RED], this.__rgb[GREEN], this.__rgb[BLUE] );
    return this;
  }

  /**
   * Set the saturation component of the color, using HSV
   * @param h {float} desired value of saturation
   * @returns {int} new value of saturation
   */
  this.setSaturationV = function(s)
  {
    s = this._fix_range(s, 100, 0);
    this.__hsv[SAT] = parseFloat(s);
    this.__rgb = this.hsv_to_rgb( this.__hsv[HUE], this.__hsv[SAT], this.__hsv[LUM] );
    this.__hsl = this.rgb_to_hsl( this.__rgb[RED], this.__rgb[GREEN], this.__rgb[BLUE] );
    return this;
  }

  /**
   * Set the value component of the color, using HSV
   * @param h {float} desired value of value
   * @returns {int} new value of value
   */
  this.setValue = function(l)
  {
    l = this._fix_range(l, 100, 0);
    this.__hsv[LUM] = parseFloat(l);
    this.__rgb = this.hsv_to_rgb( this.__hsv[HUE], this.__hsv[SAT], this.__hsv[LUM] );
    this.__hsl = this.rgb_to_hsl( this.__rgb[RED], this.__rgb[GREEN], this.__rgb[BLUE] );
    return this;
  }

  /**
   * Set the red component of the color
   * @param r {int} value of red component
   * @returns {int} value of red component
   */
  this.setRed = function(r)
  {
    r = this._fix_range(r, 255, 0);
    this.__rgb[RED] = parseInt(r);
    this.__hsv = this.rgb_to_hsv( this.__rgb[RED], this.__rgb[GREEN], this.__rgb[BLUE] );
    this.__hsl = this.rgb_to_hsl( this.__rgb[RED], this.__rgb[GREEN], this.__rgb[BLUE] );
    return this;
  }

  /**
   * Set the green component of the color
   * @param g {int} value of green component
   * @returns {int} value of green component
   */
  this.setGreen = function(g)
  {
    g = this._fix_range(g, 255, 0);
    this.__rgb[GREEN] = parseInt(g);
    this.__hsv = this.rgb_to_hsv( this.__rgb[RED], this.__rgb[GREEN], this.__rgb[BLUE] );
    this.__hsl = this.rgb_to_hsl( this.__rgb[RED], this.__rgb[GREEN], this.__rgb[BLUE] );
    return this;
  }
  
  /**
   * Set the red, green and blue components of the color
   * @param c_arr {array} array containing red,green,blue ints
   */
  this.setRGB = function(c_arr)
  {
    var i = 0;
    for( ; i < 3; i++)
    {
      this.__rgb[i] = c_arr[i] > 255 ? 255 : c_arr[i];
    }
    this.__hsv = this.rgb_to_hsv( this.__rgb[RED], this.__rgb[GREEN], this.__rgb[BLUE] );
    this.__hsl = this.rgb_to_hsl( this.__rgb[RED], this.__rgb[GREEN], this.__rgb[BLUE] );
    return this;
  }
  
  /**
   * Set the blue component of the color
   * @param b {int} value of blue component
   * @returns {int} value of blue component
   */
  this.setBlue = function(b)
  {
    b = this._fix_range(b, 255, 0);
    this.__rgb[BLUE] = parseInt(b);
    this.__hsv = this.rgb_to_hsv( this.__rgb[RED], this.__rgb[GREEN], this.__rgb[BLUE] );
    this.__hsl = this.rgb_to_hsl( this.__rgb[RED], this.__rgb[GREEN], this.__rgb[BLUE] );
    return this;
  }

  /**
   * Set the color from a hex color code
   * @param hex {String} hex color
   * @returns {String} hex color
   */
  this.setHex = function(hex)
  {
    hex = /^[0-9a-f]*$/i.test(hex) ? hex : '';
    if(hex)
    {
      hex = hex.slice(0,6);
      var temp = parseInt(hex, 16);
      this.__rgb = [ temp >> 16, ( temp >> 8 ) & 0xff, temp & 0xff ];
      this.__hsv = this.rgb_to_hsv( this.__rgb[RED], this.__rgb[GREEN], this.__rgb[BLUE] );
      this.__hsl = this.rgb_to_hsl( this.__rgb[RED], this.__rgb[GREEN], this.__rgb[BLUE] );
    }
    return this;
  }

  this._pc_3hex = function(c){return c + c};
  this._pc_trim_int = function(c){return parseInt(c.trim())};

  this.parseCSSColor = function(in_str)
  {
    var str = in_str.trim(), color = null, alpha = 0;
    if (str == "transparent")
    {
      this.setHex("000000");
      return {cssvalue: in_str, type: 'rgba', color: color, alpha: 0, hhex: this.hhex};
    }
    if (/^#[0-9a-fA-F]{6}$/.test(str))
    {
      color =  str.replace('#', '');
      this.setHex(color);
      return {cssvalue: in_str, type: 'hex', color: color, hhex: this.hhex};
    }
    if (/^#[0-9a-fA-F]{3}$/.test(str))
    {
      color = Array.prototype.slice.call(str.replace('#', '')).map(this._pc_3hex).join('');
      this.setHex(color);
      return {cssvalue: in_str, type: 'hex', color: color, hhex: this.hhex};
    }
    if (/^rgb\(.*\)$/.test(str))
    {
      color = str.slice(4, str.length - 1).split(',').map(this._pc_trim_int);
      this.setRGB(color);
      return {cssvalue: in_str, type: 'rgb', color: color, hhex: this.hhex};
    }
    if (/^rgba\(.*\)$/.test(str))
    {
      color = str.slice(5, str.length - 1).split(',');
      alpha = parseFloat(color.pop().trim());
      color = color.map(this._pc_trim_int);
      this.setRGB(color);
      return {cssvalue: in_str, type: 'rgba', color: color, alpha: alpha, hhex: this.hhex};
    }
    if (/^hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)$/.test(str))
    {
      color = str.slice(4, str.length - 1).split(',').map(this._pc_trim_int);
      this.setHue(color[0]);
      this.setSaturation(color[1]);
      this.setLuminosity(color[2]);
      return {cssvalue: in_str, type: 'hsl', color: color, hhex: this.hhex};
    }
    if (/^hsla\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*,\s*(?:0?\.\d+|1)\s*\)$/.test(str))
    {
      color = str.slice(5, str.length - 1).split(',');
      alpha = parseFloat(color.pop().trim());
      color = [parseInt(color[0].trim()), parseFloat(color[1].trim()), parseFloat(color[2].trim())];
      this.setHue(color[0]);
      this.setSaturation(color[1]);
      this.setLuminosity(color[2]);
      return {cssvalue: in_str, type: 'hsla', color: color, alpha: alpha, hhex: this.hhex};
    }
    return null;
  }

  this.invert = function()
  {
    this.setHue( (this.__hsl[HUE] + 180 ) % 360 );
    return this;
  }

  this.getGrayValue = function()
  {
    return 0.2126 * this.__rgb[RED] + 0.7152 * this.__rgb[GREEN] + 0.0722 * this.__rgb[BLUE];
  }

  /**
   * Get hue component of color
   * @returns {int} hue
   */
  this.getHue = function()
  {
    return this._round_val(this.__hsl[HUE], 360, 0);
  }

  /**
   * Get saturation component of color
   * @returns {int} saturation
   */
  this.getSaturation = function()
  {
    return this._round_val(this.__hsl[SAT], 100, 0);
  }

  /**
   * Get luminosity component of color
   * @returns {int} luminosity
   */
  this.getLuminosity = function()
  {
    return this._round_val(this.__hsl[LUM], 100, 0);
  }

  /**
   * Get hue, saturation and luminosity of color as an array
   * @returns {array} [hue, sat, lum]
   */
  this.getHSL = function()
  {
    return [this._round_val(this.__hsl[0], 360, 0), this._round_val(this.__hsl[1], 100, 0), this._round_val(this.__hsl[2], 100, 0)];
  }

  /**
   * Get hue component of color (HSV)
   * @returns {int} hue
   */
  this.getHueV = function()
  {
    return this._round_val(this.__hsv[HUE], 360, 0);
  }

  /**
   * Get saturation component of color (HSV)
   * @returns {int} saturation
   */
  this.getSaturationV = function()
  {
    return this._round_val(this.__hsv[SAT], 100, 0);
  }

  /**
   * Get value component of color (HSV)
   * @returns {int} value
   */
  this.getValue = function()
  {
    return this._round_val(this.__hsv[LUM], 100, 0);
  }

  /**
   * Get red component of color
   * @returns {int} red value
   */
  this.getRed = function()
  {
    return this._round_val(this.__rgb[RED], 255, 0);
  }

  /**
   * Get green component of color
   * @returns {int} green value
   */
  this.getGreen = function()
  {
    return this._round_val(this.__rgb[GREEN], 255, 0);
  }

  /**
   * Get blue component of color
   * @returns {int} blue
   */
  this.getBlue = function()
  {
    return this._round_val(this.__rgb[BLUE], 255, 0);
  }

  /**
   * Get red, green and blue component of color as an array
   * @returns {array} [r, g, b]
   */
  this.getRGB = function()
  {
    return [this._round_val(this.__rgb[0], 255, 0), this._round_val(this.__rgb[1], 255, 0), this._round_val(this.__rgb[2], 255, 0)];
  }
  
  this.clone = function(color)
  {
    if(color instanceof this.constructor)
    {
      this.__rgb[0] = color.__rgb[0];
      this.__rgb[1] = color.__rgb[1];
      this.__rgb[2] = color.__rgb[2];
      this.__hsl[0] = color.__hsl[0];
      this.__hsl[1] = color.__hsl[1];
      this.__hsl[2] = color.__hsl[2];
      this.__hsv[0] = color.__hsv[0]; 
      this.__hsv[1] = color.__hsv[1]; 
      this.__hsv[2] = color.__hsv[2]; 
      this.alpha = color.alpha;
    }
  }

  /**
   * Get hex value of color
   * @returns {String} hex value
   */
  this.getHex = function()
  {
    return this.rgb_to_hex_c(this.__rgb);
  }
  
  // convenience 
  
  this.__property = function(name, setter, getter)
  {
    this.__defineGetter__(name, function()
    {
      return this[getter]();
    });
    this.__defineSetter__(name, function(val)
    {
      this[setter](val);
    });
  };
  
  this.__defineGetter__('hsl', function()
  {
    return (
      "hsl(" + 
      this.getHue() + ', ' +
      this.getSaturation() + '%, ' +
      this.getLuminosity() + '%' +
      ")");
  });
  this.__defineSetter__('hsl', function(val){}); // parse hsl?
  
  this.__defineGetter__('hsv', function()
  {
    return (
      "hsv(" + 
      this.getHue() + ', ' +
      this.getSaturationV() + '%, ' +
      this.getValue() + '%' +
      ")");
  });
  this.__defineSetter__('hsv', function(val){}); // parse hsv?
  
  this.__defineGetter__('rgb', function()
  {
    return (
      "rgb(" + 
      this.getRed() + ', ' +
      this.getGreen() + ', ' +
      this.getBlue() + 
      ")");
  });
  this.__defineSetter__('rgb', function(val){}); // parse rgb?
  
  this.__defineGetter__('hhex', function()
  {
    return "#" + this.getHex();
  });
  this.__defineSetter__('hhex', function(val){});

  [
    ['h', 'setHueV', 'getHueV'],
    ['s', 'setSaturationV', 'getSaturationV'],
    ['v', 'setValue', 'getValue'],
    ['r', 'setRed', 'getRed'],
    ['g', 'setGreen', 'getGreen'],
    ['b', 'setBlue', 'getBlue'],
    ['hex', 'setHex', 'getHex'],
    ['l', 'setLuminosity', 'getLuminosity']
  ].forEach(function(property)
  {
    const NAME = 0, SETTER = 1, GETTER = 2;
    this.__property(property[NAME], property[SETTER], property[GETTER]);
  }, this);
  
  const 
  RED = 0, 
  GREEN = 1, 
  BLUE = 2,
  HUE = 0, 
  SAT = 1, 
  LUM = 2;
  
  /**
   * return val bounded to upper or lower if it over/underflows
   * @private
   * @param val {number} value to bound
   * @param upper {number} upper bound
   * @param lower {number} lower bound
   * @returns {number}
   */
  this._fix_range = function( val, upper, lower)
  {
    if( typeof val == 'string')
    {
      val = parseFloat(val);
    }
    return val > upper ? upper : val < lower ? lower : val;
  }
  
  /**
   * rounds off val and bounds it to upper and lower
   * @see Colors#this._fix_range
   * @private
   * @returns {number}
   * @param val {number} value to bound
   * @param upper {number} upper bound
   * @param lower {number} lower bound
   */
  this._round_val = function( val, upper, lower)
  {
    val = Math.round(val);
    return val > upper ? upper : val < lower ? lower : val;
  }
  
  this._hsl_or_hsv_to_rgb = function ( h, s, l, is_hsl ) 
  {
    var ret = this.hue_to_rgb(h), i = 0;
    if( is_hsl)
    {
      ret = this.mix_rgb(ret, [127.5, 127.5, 127.5], 1 - s / 100);
      if( l <= 50 )
      {
        ret = this.mix_rgb([0, 0, 0], ret, l/50);
      }
      else
      {
        ret = this.mix_rgb(ret, [0xff, 0xff, 0xff], ( l - 50 ) / 50);
      }
    }
    else
    {
      ret = this.mix_rgb(ret, [0xff, 0xff, 0xff], 1 - s / 100);
      ret = this.mix_rgb([0, 0, 0], ret, l/100);
    }
    return ret;
  }

  this._rgb_to_hsl_or_hsv = function ( r, g, b, is_to_hsl ) 
  {
    r /= 255;
    g /= 255;
    b /= 255;

    var h = 0
    var s = 0;
    var l = 0;
    var maxcolor = Math.max(r, g, b);
    var mincolor = Math.min(r, g, b);
    var delta = maxcolor - mincolor;
    var sum = maxcolor + mincolor;
    
    if( is_to_hsl )
    {
      l = sum / 2;
    }
    else
    {
      l = maxcolor;
    }
    
    if( delta == 0 )
    {
      s = h = 0;
    }
    else
    {
      if( is_to_hsl )
      {
        if( l < 0.5 )
        {
          s = delta / sum;
        }
        else
        {
          s = delta / ( 2 - sum );
        }
      }
      else
      {
        s = delta / maxcolor;
      }

      if( r == maxcolor )
      {
        h = ( g - b ) / delta;
      }
      else if( g == maxcolor )
      {
        h = 2.0 + ( b - r ) / delta;
      }
      else
      { 
        h = 4.0 + ( r - g ) / delta;
      }
    }

    h *= 60;
    if( h > 360 ) 
    { 
      h = 360;
    }
    else if ( h < 0 ) 
    {
      h += 360;
    }
    s *= 100;
    if( s > 100 )
    {
      s = 100;
    }
    l *= 100;
    if( l > 100 ) 
    {
      l = 100;
    }

    return [ h, s, l ]; 
  }
  
  this.rgb_c_to_hex_c = function(c)
  {
    c = this._round_val(c, 255, 0);
    return ( c < 16 ? '0' : '' ) + c.toString(16);
  }
  
  this.rgb_to_hex_c = function(c_arr)
  {
    var ret = '', i = 0, c = 0;
    for( ; i < 3; i++ )
    {
      c = this._round_val(c_arr[i], 255, 0);
      if( c > 255 ) c = 255;
      ret +=  ( c < 16 ? '0' : '' ) + c.toString(16);
    }
    return ret;
  }

  this.mix_rgb = function(c_1, c_2, m)
  {
    var ret = [], i = 0;
    for( ; i < 3; i++ )
    {
      ret[i] = c_1[i] + m * ( c_2[i] - c_1[i] );
    }
    return ret;
  }

  this.hue_to_rgb = function(h)
  {
    h = h % 360;
    var delta = h % 60;
    h -= delta;	
    delta = ( 255 / 60 * delta ) >> 0;
    if( h < 60 ) return [0xff, delta, 0];
    if( h < 120 ) return  [0xff - delta, 0xff, 0];
    if( h < 180 ) return  [0, 0xff, delta];
    if( h < 240 ) return  [0, 0xff - delta, 0xff];
    if( h < 300 ) return  [delta, 0, 0xff];
    if( h < 360 ) return  [0xff, 0, 0xff - delta];
  }

  this.hsl_to_rgb = function ( h, s, l ) 
  {
    return this._hsl_or_hsv_to_rgb( h, s, l, true);
  }

  this.hsv_to_rgb = function ( h, s, v ) 
  {
    return this._hsl_or_hsv_to_rgb( h, s, v, false);
  }

  this.rgb_to_hsv = function ( r, g, b ) 
  {
    return this._rgb_to_hsl_or_hsv ( r, g, b, false );
  }

  this.rgb_to_hsl = function ( r, g, b ) 
  {
    return this._rgb_to_hsl_or_hsv ( r, g, b, true );
  }

}
Colors.prototype.constructor = Colors;