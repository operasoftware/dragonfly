"use strict";

/*
  Usage:

  var hash_map = new HashMap();

  for (var key in hash_map)
  {
    if (hash_map[key]) // for pre ES5
    {

    }
  }

  // or

  if (hash_map[key]) // if (key in hash_map) would be nicer but doesn't work for pre ES5

*/

if (Object.create)
{
  var HashMap = function()
  {
    return Object.create(null);
  }
}
else
{
  var HashMap = function() {};

  HashMap.prototype = new function()
  {
    this.__defineGetter__  = undefined;
    this.__defineSetter__  = undefined;
    this.__lookupGetter__  = undefined;
    this.__lookupSetter__  = undefined;
    this.constructor  = undefined;
    this.hasOwnProperty  = undefined;
    this.isPrototypeOf  = undefined;
    this.propertyIsEnumerable  = undefined;
    this.toLocaleString  = undefined;
    this.toString  = undefined;
    this.valueOf = undefined;
  }
};
