var ColorSpace = function()
{
  this.__rgb = [0, 0, 0];
  this.__hsl = [0, 50, 50];
  this.__hsv = [0, 50, 50]; 
};

ColorSpacePrototype = function()
{

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
