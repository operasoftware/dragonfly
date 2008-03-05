var Timeouts = function()
{
  var timeouts = [];

  this.set = function()
  {
    this.clear();
    timeouts[timeouts.length] = setTimeout.apply(window, arguments);
  }

  this.clear = function()
  {
    while(timeouts.length)
    {
      clearTimeout(timeouts.pop());
    }
  }
};