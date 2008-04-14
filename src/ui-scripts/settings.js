var SettingsBase = function()
{

  this.set = function(key, value) 
  {
    storage.set(key, ( this.map[key] = value ) );
  }

  this.get = function(key) 
  {
    return this.map[key];
  }

  this.init = function(view_id, key_map, label_map, setting_map, template)
  {
    this.map = {};
    this.view_id = view_id;
    this.label_map = label_map;
    this.setting_map = setting_map;
    this.template = template;
    var stored_map = key_map, key = '';
    for( key in stored_map)
    {
      this.map[key] = storage.get(key, key_map[key]);
    }
    if(!window.settings)
    {
      window.settings = {};
    }
    window.settings[arguments[0]] = this;
  }

}

var Settings = function(view_id, key_map, label_map, setting_map, template)
{
  this.init(view_id, key_map, label_map, setting_map, template);
}

Settings.prototype = new SettingsBase();









