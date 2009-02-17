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
  const 
  RED = 0, 
  GREEN = 1, 
  BLUE = 2,
  HUE = 0, 
  SAT = 1, 
  LUM = 2;

  var rgb = [0, 0, 0];
  var hsl = [0, 50, 50];
  var hsv = [0, 50, 50];
  
  /**
   * return val bounded to upper or lower if it over/underflows
   * @private
   * @param val {number} value to bound
   * @param upper {number} upper bound
   * @param lower {number} lower bound
   * @returns {number}
   */
  var fixRange = function( val, upper, lower)
  {
    return val > upper ? upper : val < lower ? lower : val;
  }
  
  /**
   * rounds off val and bounds it to upper and lower
   * @see Colors#fixRange
   * @private
   * @returns {number}
   * @param val {number} value to bound
   * @param upper {number} upper bound
   * @param lower {number} lower bound
   */
  var roundVal = function( val, upper, lower)
  {
    val = Math.round(val);
    return val > upper ? upper : val < lower ? lower : val;
  }
  
  /**
   * turns val into a fixed number and bounds it to upper and lower
   * @see Colors#fixRange
   * @private
   * @returns {number}
   * @param val {number} value to bound
   * @param upper {number} upper bound
   * @param lower {number} lower bound
   */
  var toFixed = function( val, upper, lower)
  {
    val = val.toFixed(2);
    return val > upper ? upper : val < lower ? lower : val;
  }

  /**
   * Set the hue component of the color
   * @param h {int} desired value of hue
   * @returns {int} new value of hue
   */
  this.setHue = function(h)
  {
    h = fixRange(h, 360, 0);
    hsl[HUE] = parseInt(h);
    rgb = this.hsl_to_rgb( hsl[HUE], hsl[SAT], hsl[LUM] );
    hsv = this.rgb_to_hsv( rgb[RED], rgb[GREEN], rgb[BLUE] );
    return h;
  }

  /**
   * Set the saturation component of the color
   * @param s {int} desired value of saturation
   * @returns {int} new value of saturation
   */
  this.setSaturation = function(s)
  {
    s = fixRange(s, 100, 0);
    hsl[SAT] = parseFloat(s);
    rgb = this.hsl_to_rgb( hsl[HUE], hsl[SAT], hsl[LUM] );
    hsv = this.rgb_to_hsv( rgb[RED], rgb[GREEN], rgb[BLUE] );
    return s;
  }
  
  /**
   * Set the luminosity component of the color
   * @param l {int} desired value of luminosity
   * @returns {int} new value of luminosity
   */
  this.setLuminosity = function(l)
  {
    l = fixRange(l, 100, 0);
    hsl[LUM] = parseFloat(l);
    rgb = this.hsl_to_rgb( hsl[HUE], hsl[SAT], hsl[LUM] );
    hsv = this.rgb_to_hsv( rgb[RED], rgb[GREEN], rgb[BLUE] );
    return l;
  }

  /**
   * Set hue component of the color, using HSV
   * http://en.wikipedia.org/wiki/HSV_color_space
   * @param h {float} desired value of hue
   * @returns {int} new value of hue
   */
  this.setHueV = function(h)
  {
    h = fixRange(h, 360, 0);
    hsv[HUE] = parseInt(h);
    rgb = this.hsv_to_rgb( hsv[HUE], hsv[SAT], hsv[LUM] );
    hsl = this.rgb_to_hsl( rgb[RED], rgb[GREEN], rgb[BLUE] );
    return h;
  }

  /**
   * Set the saturation component of the color, using HSV
   * @param h {float} desired value of saturation
   * @returns {int} new value of saturation
   */
  this.setSaturationV = function(s)
  {
    s = fixRange(s, 100, 0);
    hsv[SAT] = parseFloat(s);
    rgb = this.hsv_to_rgb( hsv[HUE], hsv[SAT], hsv[LUM] );
    hsl = this.rgb_to_hsl( rgb[RED], rgb[GREEN], rgb[BLUE] );
    return s;
  }

  /**
   * Set the value component of the color, using HSV
   * @param h {float} desired value of value
   * @returns {int} new value of value
   */
  this.setValue = function(l)
  {
    l = fixRange(l, 100, 0);
    hsv[LUM] = parseFloat(l);
    rgb = this.hsv_to_rgb( hsv[HUE], hsv[SAT], hsv[LUM] );
    hsl = this.rgb_to_hsl( rgb[RED], rgb[GREEN], rgb[BLUE] );
    return l;
  }

  /**
   * Set the red component of the color
   * @param r {int} value of red component
   * @returns {int} value of red component
   */
  this.setRed = function(r)
  {
    r = fixRange(r, 255, 0);
    rgb[RED] = parseInt(r);
    hsv = this.rgb_to_hsv( rgb[RED], rgb[GREEN], rgb[BLUE] );
    hsl = this.rgb_to_hsl( rgb[RED], rgb[GREEN], rgb[BLUE] );
    return r;
  }

  /**
   * Set the green component of the color
   * @param g {int} value of green component
   * @returns {int} value of green component
   */
  this.setGreen = function(g)
  {
    g = fixRange(g, 255, 0);
    rgb[GREEN] = parseInt(g);
    hsv = this.rgb_to_hsv( rgb[RED], rgb[GREEN], rgb[BLUE] );
    hsl = this.rgb_to_hsl( rgb[RED], rgb[GREEN], rgb[BLUE] );
    return g;
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
      rgb[i] = c_arr[i] > 255 ? 255 : c_arr[i];
    }
    hsv = this.rgb_to_hsv( rgb[RED], rgb[GREEN], rgb[BLUE] );
    hsl = this.rgb_to_hsl( rgb[RED], rgb[GREEN], rgb[BLUE] );
  }

  /**
   * Set the blue component of the color
   * @param b {int} value of blue component
   * @returns {int} value of blue component
   */
  this.setBlue = function(b)
  {
    b = fixRange(b, 255, 0);
    rgb[BLUE] = parseInt(b);
    hsv = this.rgb_to_hsv( rgb[RED], rgb[GREEN], rgb[BLUE] );
    hsl = this.rgb_to_hsl( rgb[RED], rgb[GREEN], rgb[BLUE] );
    return b;
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
      rgb = [ temp >> 16, ( temp >> 8 ) & 0xff, temp & 0xff ];
      hsv = this.rgb_to_hsv( rgb[RED], rgb[GREEN], rgb[BLUE] );
      hsl = this.rgb_to_hsl( rgb[RED], rgb[GREEN], rgb[BLUE] );
    }
    return hex;
  }

  this.getGrayValue = function()
  {
    return 0.2126 * rgb[RED] + 0.7152 * rgb[GREEN] + 0.0722 * rgb[BLUE];
  }

  this.invert = function()
  {
    this.setLuminosity(100 - hsl[LUM]);
    this.setSaturation(100 - hsl[SAT]);
    this.setHue( (hsl[HUE] + 180 ) % 360 ); 
  }

  /**
   * Get hue component of color
   * @returns {int} hue
   */
  this.getHue = function()
  {
    return roundVal(hsl[HUE], 360, 0);
  }

  /**
   * Get saturation component of color
   * @returns {int} saturation
   */
  this.getSaturation = function()
  {
    return toFixed(hsl[SAT], 100, 0);
  }

  /**
   * Get luminosity component of color
   * @returns {int} luminosity
   */
  this.getLuminosity = function()
  {
    return toFixed(hsl[LUM], 100, 0);
  }

  /**
   * Get hue, saturation and luminosity of color as an array
   * @returns {array} [hue, sat, lum]
   */
  this.getHSL = function()
  {
    return [roundVal(hsl[0], 360, 0), toFixed(hsl[1], 100, 0), toFixed(hsl[2], 100, 0)];
  }

  /**
   * Get hue component of color (HSV)
   * @returns {int} hue
   */
  this.getHueV = function()
  {
    return roundVal(hsv[HUE], 360, 0);
  }

  /**
   * Get saturation component of color (HSV)
   * @returns {int} saturation
   */
  this.getSaturationV = function()
  {
    return toFixed(hsv[SAT], 100, 0);
  }

  /**
   * Get value component of color (HSV)
   * @returns {int} value
   */
  this.getValue = function()
  {
    return toFixed(hsv[LUM], 100, 0);
  }

  /**
   * Get red component of color
   * @returns {int} red value
   */
  this.getRed = function()
  {
    return roundVal(rgb[RED], 255, 0);
  }

  /**
   * Get green component of color
   * @returns {int} green value
   */
  this.getGreen = function()
  {
    return roundVal(rgb[GREEN], 255, 0);
  }

  /**
   * Get blue component of color
   * @returns {int} blue
   */
  this.getBlue = function()
  {
    return roundVal(rgb[BLUE], 255, 0);
  }

  /**
   * Get red, green and blue component of color as an array
   * @returns {array} [r, g, b]
   */
  this.getRGB = function()
  {
    return [roundVal(rgb[0], 255, 0), roundVal(rgb[1], 255, 0), roundVal(rgb[2], 255, 0)];
  }

  /**
   * Get hex value of color
   * @returns {String} hex value
   */
  this.getHex = function()
  {
    return this.rgb_to_hex_c(rgb);
  }

}

Colors.prototype = new function()
{
  var self = this;
  
  var roundVal = function( val, upper, lower)
  {
    val = Math.round(val);
    return val > upper ? upper : val < lower ? lower : val;
  }

  var hsl_or_hsv_to_rgb = function ( h, s, l, is_hsl ) 
  {
    var ret = self.hue_to_rgb(h), i = 0;
    if( is_hsl)
    {
      ret = self.mix_rgb(ret, [127.5, 127.5, 127.5], 1 - s / 100);
      if( l <= 50 )
      {
        ret = self.mix_rgb([0, 0, 0], ret, l/50);
      }
      else
      {
        ret = self.mix_rgb(ret, [0xff, 0xff, 0xff], ( l - 50 ) / 50);
      }
    }
    else
    {
      ret = self.mix_rgb(ret, [0xff, 0xff, 0xff], 1 - s / 100);
      ret = self.mix_rgb([0, 0, 0], ret, l/100);
    }
    return ret;
  }

  var rgb_to_hsl_or_hsv = function ( r, g, b, is_to_hsl ) 
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
    c = roundVal(c, 255, 0);
    return ( c < 16 ? '0' : '' ) + c.toString(16);
  }
  
  this.rgb_to_hex_c = function(c_arr)
  {
    var ret = '', i = 0, c = 0;
    for( ; i < 3; i++ )
    {
      c = roundVal(c_arr[i], 255, 0);
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
    return hsl_or_hsv_to_rgb( h, s, l, true);
  }

  this.hsv_to_rgb = function ( h, s, v ) 
  {
    return hsl_or_hsv_to_rgb( h, s, v, false);
  }

  this.rgb_to_hsv = function ( r, g, b ) 
  {
    return rgb_to_hsl_or_hsv ( r, g, b, false );
  }

  this.rgb_to_hsl = function ( r, g, b ) 
  {
    return rgb_to_hsl_or_hsv ( r, g, b, true );
  }

  this.toGrayScale = function()
  {
    

  }

}