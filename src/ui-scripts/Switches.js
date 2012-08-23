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
    var switches = document.querySelectorAll("[handler='toolbar-switch']");

    for (var i = 0, switch_; switch_ = switches[i]; i++)
    {
      var value = settings[message.id].get(message.key);
      var button = switch_.querySelector("[key='" + key_attr + "']");
      if (button)
        value ? button.addClass("is-active") : button.removeClass("is-active");
    }
  }.bind(this);

  window.messages.addListener("setting-changed", this._on_setting_changed_bound);
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
