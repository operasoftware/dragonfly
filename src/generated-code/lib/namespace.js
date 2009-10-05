window.cls || ( window.cls = {} );

/**
  * @constructor 
  * A simple class to create a namespace on the window object.
  * It has one methode to add new created objects to it.
  */

window.cls.Namespace = function(namespace)
{
  if( window[namespace] instanceof this.constructor )
  {
    return window[namespace];
  }
  this.init(namespace);
}

window.cls.Namespace.prototype = new function()
{
  this.add = function(obj)
  {
    if( !(obj.id || obj.name) )
    {
      throw "to add an object to a namespace it must have either an id or a name";
    }
    return ( this[obj.id || obj.name] = obj );
  }
  this.init = function(namespace)
  {
    if( !( window[namespace] instanceof this.constructor ) )
    {
      window[namespace] = this;
    }
  }
  this.toString = function()
  {
    return "[object Namespace]";
  }

}
