var SettingsBase = function()
{

  this.set = function(key, value) 
  {
    this.map[key] = value;
  }

  this.get = function(key) 
  {
    return this.map[key];
  }

  this.init = function(view_id, key_map, setting_map)
  {
    this.map ={};
    this.view_id = view_id;
    this.setting_map = setting_map;
    var stored_map = key_map, key = '';
    for( key in stored_map)
    {
      this.map[key] = stored_map[key];
    }
    if(!window.settings)
    {
      window.settings = {};
    }
    window.settings[arguments[0]] = this;
  }

}

var Settings = function(view_id, key_map, setting_map)
{
  this.init(view_id, key_map, setting_map);
}

Settings.prototype = new SettingsBase();









