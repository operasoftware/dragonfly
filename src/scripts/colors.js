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
  
  this._css_color_keywords =
  {
    black: '000000', silver: 'C0C0C0', gray: '808080', white: 'FFFFFF', 
    maroon: '800000', red: 'FF0000', purple: '800080', fuchsia: 'FF00FF', 
    green: '008000', lime: '00FF00', olive: '808000', yellow: 'FFFF00', 
    navy: '000080', blue: '0000FF', teal: '008080', aqua: '00FFFF', 
    aliceblue: 'f0f8ff', antiquewhite: 'faebd7', aqua: '00ffff', 
    aquamarine: '7fffd4', azure: 'f0ffff', beige: 'f5f5dc', bisque: 'ffe4c4', 
    black: '000000', blanchedalmond: 'ffebcd', blue: '0000ff', 
    blueviolet: '8a2be2', brown: 'a52a2a', burlywood: 'deb887', 
    cadetblue: '5f9ea0', chartreuse: '7fff00', chocolate: 'd2691e', 
    coral: 'ff7f50', cornflowerblue: '6495ed', cornsilk: 'fff8dc', 
    crimson: 'dc143c', cyan: '00ffff', darkblue: '00008b', darkcyan: '008b8b', 
    darkgoldenrod: 'b8860b', darkgray: 'a9a9a9', darkgreen: '006400', 
    darkgrey: 'a9a9a9', darkkhaki: 'bdb76b', darkmagenta: '8b008b', 
    darkolivegreen: '556b2f', darkorange: 'ff8c00', darkorchid: '9932cc', 
    darkred: '8b0000', darksalmon: 'e9967a', darkseagreen: '8fbc8f', 
    darkslateblue: '483d8b', darkslategray: '2f4f4f', darkslategrey: '2f4f4f', 
    darkturquoise: '00ced1', darkviolet: '9400d3', deeppink: 'ff1493', 
    deepskyblue: '00bfff', dimgray: '696969', dimgrey: '696969', 
    dodgerblue: '1e90ff', firebrick: 'b22222', floralwhite: 'fffaf0', 
    forestgreen: '228b22', fuchsia: 'ff00ff', gainsboro: 'dcdcdc', 
    ghostwhite: 'f8f8ff', gold: 'ffd700', goldenrod: 'daa520', gray: '808080', 
    green: '008000', greenyellow: 'adff2f', grey: '808080', honeydew: 'f0fff0', 
    hotpink: 'ff69b4', indianred: 'cd5c5c', indigo: '4b0082', ivory: 'fffff0', 
    khaki: 'f0e68c', lavender: 'e6e6fa', lavenderblush: 'fff0f5', 
    lawngreen: '7cfc00', lemonchiffon: 'fffacd', lightblue: 'add8e6', 
    lightcoral: 'f08080', lightcyan: 'e0ffff', lightgoldenrodyellow: 'fafad2', 
    lightgray: 'd3d3d3', lightgreen: '90ee90', lightgrey: 'd3d3d3', 
    lightpink: 'ffb6c1', lightsalmon: 'ffa07a', lightseagreen: '20b2aa', 
    lightskyblue: '87cefa', lightslategray: '778899', lightslategrey: '778899', 
    lightsteelblue: 'b0c4de', lightyellow: 'ffffe0', lime: '00ff00', 
    limegreen: '32cd32', linen: 'faf0e6', magenta: 'ff00ff', maroon: '800000', 
    mediumaquamarine: '66cdaa', mediumblue: '0000cd', mediumorchid: 'ba55d3', 
    mediumpurple: '9370db', mediumseagreen: '3cb371', mediumslateblue: '7b68ee', 
    mediumspringgreen: '00fa9a', mediumturquoise: '48d1cc', 
    mediumvioletred: 'c71585', midnightblue: '191970', mintcream: 'f5fffa', 
    mistyrose: 'ffe4e1', moccasin: 'ffe4b5', navajowhite: 'ffdead', 
    navy: '000080', oldlace: 'fdf5e6', olive: '808000', olivedrab: '6b8e23', 
    orange: 'ffa500', orangered: 'ff4500', orchid: 'da70d6', 
    palegoldenrod: 'eee8aa', palegreen: '98fb98', paleturquoise: 'afeeee', 
    palevioletred: 'db7093', papayawhip: 'ffefd5', peachpuff: 'ffdab9', 
    peru: 'cd853f', pink: 'ffc0cb', plum: 'dda0dd', powderblue: 'b0e0e6', 
    purple: '800080', red: 'ff0000', rosybrown: 'bc8f8f', royalblue: '4169e1', 
    saddlebrown: '8b4513', salmon: 'fa8072', sandybrown: 'f4a460', 
    seagreen: '2e8b57', seashell: 'fff5ee', sienna: 'a0522d', silver: 'c0c0c0', 
    skyblue: '87ceeb', slateblue: '6a5acd', slategray: '708090', 
    slategrey: '708090', snow: 'fffafa', springgreen: '00ff7f', 
    steelblue: '4682b4', tan: 'd2b48c', teal: '008080', thistle: 'd8bfd8', 
    tomato: 'ff6347', turquoise: '40e0d0', violet: 'ee82ee', wheat: 'f5deb3', 
    white: 'ffffff', whitesmoke: 'f5f5f5', yellow: 'ffff00', 
    yellowgreen: '9acd32'
  }

  this.KEYWORD = 'keyword';
  this.HEX = 'hex';
  this.RGB = 'rgb';
  this.RGBA = 'rgba';
  this.HSL = 'hsl';
  this.HSLA = 'hsla';
  this._double_hex = function(c){return c + c};
  this._trim_int = function(c){return parseInt(c.trim())};
  this._re_hex6 = /^#[0-9a-fA-F]{6}$/;
  this._re_hex3 = /^#[0-9a-fA-F]{3}$/;

  // helper call to construct reg exps to verify css color tokens
  (function()
  {
    var 
    // rgb component
    c = "\\s*(?:[0-1]?\\d{1,2}|2[0-4]\\d|25[0-5])\\s*",
    // alpha
    a = "\\s*(?:0|0?\\.\\d+|1(?:\\.0+)?)\\s*",
    // optional float
    of = "(?:\\.\\d+)?",
    // hue
    h = "\\s*(?:[0-2]?\\d{1,2}" + of + "|3[0-5]\\d" + of + "|360(?:\\.0+)?)\\s*",
    // saturation and luminosity
    sl = "\\s*(?:[0]?\\d{1,2}" + of + "|100(?:\\.0+)?)%\\s*";

    this._re_rgb = new RegExp("^rgb\\(" + [c, c, c].join(',') + "\\)$"); 
    this._re_rgba = new RegExp("^rgba\\(" + [c, c, c, a].join(',') + "\\)$"); 
    this._re_hsl = new RegExp("^hsl\\(" + [h, sl, sl].join(',') + "\\)$");   
    this._re_hsla = new RegExp("^hsla\\(" + [h, sl, sl, a].join(',') + "\\)$"); 
  }).apply(this);

  this.parseCSSColor = function(in_str)
  {
    var str = in_str.trim(), color = null;
    this.cssvalue = in_str;
    this.alpha = null;
    this.type = '';
    if (str == "transparent")
    {
      this.setHex("000000");
      this.alpha = 0;
      this.type = this.KEYWORD; 
      return this;
    }
    if (in_str in this._css_color_keywords)
    {
      this.setHex(this._css_color_keywords[in_str]);
      this.type = this.KEYWORD;
      return this;
    }
    if (this._re_hex6.test(str))
    {
      this.setHex(str.slice(1));
      this.type = this.HEX;
      return this;
    }
    if (this._re_hex3.test(str))
    {
      this.setHex(str.slice(1).split('').map(this._double_hex).join(''));
      this.type = this.HEX;
      return this;
    }
    if (this._re_rgb.test(str))
    {
      this.setRGB(str.slice(4, str.length - 1).split(',').map(this._trim_int));
      this.type = this.RGB;
      return this;
    }
    if (this._re_rgba.test(str))
    {
      color = str.slice(5, str.length - 1).split(',');
      this.alpha = parseFloat(color.pop().trim());
      this.setRGB(color.map(this._trim_int));
      this.type = this.RGBA;
      return this;
    }
    if (this._re_hsl.test(str))
    {
      color = str.slice(4, str.length - 1).split(',').map(this._trim_int);
      this.setHue(color[0]);
      this.setSaturation(color[1]);
      this.setLuminosity(color[2]);
      this.type = this.HSL;
      return this;
    }
    if (this._re_hsla.test(str))
    {
      color = str.slice(5, str.length - 1).split(',');
      this.setHue(parseInt(color[0].trim()));
      this.setSaturation(parseFloat(color[1].trim()));
      this.setLuminosity(parseFloat(color[2].trim()));
      this.alpha = parseFloat(color[3].trim());
      this.type = this.HSLA;
      return this
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
    if(color instanceof Colors)
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
      this.type = color.type; // hex, rgb, rgba, hsl, hsla, keyword
      this.cssvalue = color.cssvalue;
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
  
  this.__defineGetter__('hsla', function()
  {
    return (
      "hsla(" + 
      this.getHue() + ', ' +
      this.getSaturation() + '%, ' +
      this.getLuminosity() + '%, ' +
      (typeof this.alpha == 'number' ? this.alpha.toFixed(3) : '1') +
      ")");
  });
  this.__defineSetter__('hsla', function(val){}); // parse hsl?
  
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
  
  this.__defineGetter__('rgba', function()
  {
    return (
      "rgba(" + 
      this.getRed() + ', ' +
      this.getGreen() + ', ' +
      this.getBlue() + ', ' +
      (typeof this.alpha == 'number' ? this.alpha.toFixed(3) : '1') +
      ")");
  });
  this.__defineSetter__('rgba', function(val){}); // parse rgb?
  
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