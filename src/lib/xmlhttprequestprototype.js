/**
 * Convenience function for loading a resource with XHR using the get method.
 * Will automatically append a "time" guery argument to avoid caching.
 * When the load is finished, callback will be invoced with context as its
 * "this" value
 */

XMLHttpRequest.prototype.loadResource = function(url, callback, context, error_callback)
{
  this.onload = function()
  {
    callback(this, context);
  };

  this.onerror = function()
  {
    setTimeout(error_callback, 0, context);
  };

  this.open('GET', url);
  try { this.send(null); } catch(e) {};
};
