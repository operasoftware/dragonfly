/**
 * @fileoverview
 * timeouts class
 */

/**
  * @constructor
  * Convenience class for managing one, or many, timeouts. It keeps track
  * of all timeout IDs so they can all be cleared at once when needed.
  * 
  */
var Timeouts = function()
{
  var timeouts = [];

  /**
   * schedule a timeout. This method clones the window.setTimeout method
   */
  this.set = function()
  {
    this.clear();
    timeouts[timeouts.length] = setTimeout.apply(window, arguments);
  }

  /**
   * Clear all pending timeouts
   */
  this.clear = function()
  {
    while(timeouts.length)
    {
      clearTimeout(timeouts.pop());
    }
  }
};