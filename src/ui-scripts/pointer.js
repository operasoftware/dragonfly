var Pointer = function(ref_ele, pointer_class)
{
  this._init(ref_ele, pointer_class);
}

Pointer.prototype = new function()
{
  this._init = function(ref_ele, pointer_class)
  {
    var style = window.getComputedStyle(ref_ele, null);
    ref_ele.render(window.templates.pointer(pointer_class));
    this._pointer = ref_ele.getElementsByClassName(pointer_class)[0];
    this._circle = this._pointer.getElementsByTagName('circle')[0];
    this._ref_width = parseInt(style.getPropertyValue('width'));
    this._ref_height = parseInt(style.getPropertyValue('height'));
    this._onremove_bound = this._onremove.bind(this);
    this._pointer.addEventListener('DOMnoderemoved', this._onremove_bound, false);
  }
  
  this._onremove = function()
  {
    this._pointer.removeEventListener('DOMnoderemoved', this._onremove_bound, false);
    this._circle = null;
    this._pointer = null;
  }
  
  this.__defineSetter__('x', function(x)
  {
    this.__x = x;
    this._pointer.style.left = (x * this._ref_width) + 'px';
  });

  this.__defineGetter__('x', function()
  {
    return this.__x;
  });
  
  this.__defineSetter__('y', function(y)
  {
    this.__y = y;
    this._pointer.style.top = (y * this._ref_height) + 'px';
  });

  this.__defineGetter__('y', function()
  {
    return this.__y;
  });
  
  this.update_color = function(luminosity)
  {
    this._circle.setAttribute('stroke', luminosity > 25 ? 'hsl(0, 0%, 20%)' : 'hsl(0, 0%, 80%)'); 
  }

}