/**
 * Throttle the function to run at most every delay ms
 * @argument delay {Number}
 *
 * Note: Throttled methods are argument-less because we don't know which set of
 * arguments ( among the ones passed to all the throttled calls ) to pass to the
 * method it is eventually called. Instead they should use a state or context
 * variable of their scope.
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
    if (last < Date.now() - delay)
      wrapped();
    else if (!timeout)
      timeout = setTimeout(wrapped, delay);
  }
});
