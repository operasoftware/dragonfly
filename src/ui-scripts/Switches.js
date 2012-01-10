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

  this._on_setting_changed_bound = function(message)
  {
    var key_attr = message.id + "." + message.key;
    // look for switches in the old
    var switches = document.getElementsByTagName("toolbar-switches");
    // and new containers
    if (!switches.length)
      switches = document.querySelectorAll("[handler='toolbar-switch']");

    for(var i = 0, _switch; _switch = switches[i]; i++)
    {
      var buttons = _switch.querySelectorAll("[key='" + key_attr + "']");
      for( j = 0; button = buttons[j]; j++)
      {
        var value = settings[message.id].get(message.key);
        value ? button.addClass("is-active") : button.removeClass("is-active");
      }
    }
    /* todo: this used to be in setting.js after the toolbar buttons were updated
    // hack to trigger a repaint while
    target.style.backgroundColor = "transparent";
    target.style.removeProperty('background-color');
    */
  }.bind(this);

  messages.addListener("setting-changed", this._on_setting_changed_bound);
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
