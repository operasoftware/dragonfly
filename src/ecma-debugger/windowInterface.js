/**
 * @fileoverview
 * <strong>fixme: Deprecated. marked for removal</strong>
 */

/**
  * @constructor 
  * @deprecated
  * does not work as intended
  */

var windowInterface = new function()
{
  var keyHandlers ={};

  keyHandlers['F5'] = function()
  {
    continueAction('continue-run');
  }
  keyHandlers['F10'] = function()
  {
    continueAction('continue-step-over-call');
  }
  keyHandlers['F11'] = function()
  {
    continueAction('continue-step-into-call');
  }
  keyHandlers['Shift F11'] = function()
  {
    continueAction('continue-finish-call');
  }


  var continueAction = function(id)
  {
    var button = document.getElementById(id);
    if(button && !button.disabled)
    {
      button.click();
    }
  }

  this.handleKey = function(key)
  {
    opera.postError(key);
    if(keyHandlers[key]) keyHandlers[key]();
  }
}