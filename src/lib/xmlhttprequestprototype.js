/**
 * Convenience function for loading a resource with XHR using the get method.
 * Will automatically append a "time" guery argument to avoid caching.
 * When the load is finished, callback will be invoced with context as its
 * "this" value
 */

XMLHttpRequest.prototype.loadResource = function(url, callback, context)
{
  this.onload = function()
  {
    callback(this, context);
  }
  this.open('GET', url);
  this.send(null);
};
