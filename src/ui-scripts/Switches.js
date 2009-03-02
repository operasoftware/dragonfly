/**
 * Base class for Switches
 * @see Switches
 * @constructor 
 */
var SwitchesBase = function()
{
  this.init = function(view_id, keys)
  {
    this.view_id = view_id;
    var key = '', i = 0;
    for( ; key = keys[i]; i++)
    {
      if( key.indexOf('.') == -1 )
      {
        keys[i] = view_id + '.' + key;
      }
    }
    this.keys = keys;

    if(!window.switches)
    {
      window.switches = {};
    }
    window.switches[view_id] = this;
  }
}


/**
 * The switches class maps one or more keys from the Settings object of
 * the view to toggle buttons in the UI
 *
 * @see Settings
 * @constructor 
 * @extends SwitchesBase
 */
var Switches = function(view_id, key_map)
{
  this.init(view_id, key_map);
}

Switches.prototype = new SwitchesBase();
