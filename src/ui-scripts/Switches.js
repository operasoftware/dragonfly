var SwitchesBase = function()
{
  this.init = function(view_id, keys)
  {
    this.view_id = view_id;
    this.keys = keys;
    if(!window.switches)
    {
      window.switches = {};
    }
    window.switches[view_id] = this;
  }
}

var Switches = function(view_id, key_map)
{
  this.init(view_id, key_map);
}

Switches.prototype = new SwitchesBase();