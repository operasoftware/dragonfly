/**
 * @constructor
 * @extends Color
 * Makes it possible to bind a property with a scale factor to an existing
 * Color method, e.g. to represent a given color space like r-g-b.
 *
 * example:
 * var color_space = new ColorSpace();
 * color_space.property('r', 'setRed', 'getRed', 255);
 */

var ColorSpace = function()
{
  this.__rgb = [0, 0, 0];
  this.__hsl = [0, 50, 50];
  this.__hsv = [0, 50, 50];
};

ColorSpacePrototype = function()
{
  /* interface */

  /**
    * To bind an existing getter and setter to a property name.
    * @param {name} name. The name of the property to be bound.
    * @param {Number} scale. The scale factor for the getter and setter.
    * @param {String} setter. The name of the existing setter method.
    * @param {String} getter. The name of the existing getter method.
    */
  this.property = function(name, scale, setter, getter){};

  /**
    * Sets x, y, and z on the instance and returns it.
    * @param {Number} x. Value for x.
    * @param {Number} y. Value for y.
    * @param {Number} z. Value for z.
    */
  this.xyz = function(x,y,z){};

  /* implementation */

  this.property = function(name, scale, setter, getter)
  {
    this.__defineSetter__(name, function(val)
    {
      this[setter](scale * val);
    });
    this.__defineGetter__(name, function()
    {
      return this[getter]() / scale;
    });
  };

  this.xyz = function(x,y,z)
  {
    // ensure that setting the colors setting works
    // e.g. if saturation is 0 setting hue is undefined
    this.x = this.y = this.z = .5;
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  };

};

ColorSpacePrototype.prototype = Color.prototype;
ColorSpace.prototype = new ColorSpacePrototype();
ColorSpace.prototype.constructor = ColorSpace;
