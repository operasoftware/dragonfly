/**
  * @constructor 
  */

var SettingsBase = function()
{

  this.set = function(key, value, sync_switches) 
  {
    storage.set(key, ( this.map[key] = value ) );
    if( sync_switches && typeof value == 'boolean' )
    {
      var 
      switches = document.getElementsByTagName('toolbar-switches'),
      _switch = null,
      butttons = null,
      button = null, 
      i = 0,
      j = 0,
      key_id = this.view_id + '.' + key,
      force_reflow = false;

      for( ; _switch = switches[i]; i++)
      {
        force_reflow = false;
        buttons = _switch.getElementsByTagName('input');
        for( j = 0; button = buttons[j]; j++)
        {
          if( button.getAttribute('key') == key_id )
          {
            button.setAttribute('is-active' , value ? "true" : "false" );
            force_reflow = true;
          }
        }
        if( force_reflow )
        {
          _switch.innerHTML += "";
        }
      }
    }
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

/**
  * @constructor 
  * @extends SettingsBase
  */

var Settings = function(view_id, key_map, label_map, setting_map, template)
{
  this.init(view_id, key_map, label_map, setting_map, template);
}

Settings.prototype = new SettingsBase();









