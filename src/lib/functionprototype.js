/**
 * Throttle the function to run at most every delay ms
 * @argument delay {Number}
 */
Function.prototype.throttle || (Function.prototype.throttle = function(delay)
{
  var callback = this;
  var last = 0;
  var timeout = 0;
  var wrapped = function()
  {
    timeout = 0;
    last = Date.now();
    callback();
  };

  return function()
  {
    if (last < Date.now()-delay)
      wrapped();
    else if (!timeout)
      timeout = setTimeout(wrapped, delay);
  }
});
