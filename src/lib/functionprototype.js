/**
 * Throttle the function to run at most every delay ms
 * @argument delay {Number}
 */
Function.prototype.throttle || (Function.prototype.throttle = function( delay )
{
  var _callback = this;
  var _last = 0;
  var _timeout = 0;
  var _wrapped = function()
  {
    _timeout = 0;
    _last = Date.now();
    _callback();
  };

  return function()
  {
    if (_last < Date.now()-delay)
      _wrapped();
    else if (!_timeout)
      _timeout = setTimeout(_wrapped, delay);
  }
});
