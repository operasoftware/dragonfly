/**
 * @fileoverview
 * Classes related to defining settings for views. Settings are dict-like
 * objects, providing get/set/exists methods. Settings are persisted by
 * calling out to the global storage ogject
 *
 * @see storage
 */

/**
 * @constructor 
 */
var SettingsBase = function()
{
  /**
   * Update the view according to the new value of the setting key.
   * @private
   */
  var syncView = function(key, value)
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
      buttons = _switch.getElementsByTagName('button');
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

  /**
   * Set the value of key.
   */
  this.set = function(key, value, sync_switches) 
  {
    window.localStorage.setItem(key, JSON.stringify(this.map[key] = value))
    if( sync_switches && typeof value == 'boolean' )
    {
      syncView(key, value);
    }
  }

  /**
   * Returns the value assosciated with "key". If the key does not exist,
   * returns undefined
   * @argument {string} key whos value to get
   */
  this.get = function(key) 
  {
    return (
      this.map[key] || 
      (this.map[key] = JSON.parse(window.localStorage.getItem(key) || null))
    );
  }
  
  /**
   * Check if a particular key exist in the settings object
   */
  this.exists = function(key)
  {
    return key in this.map;
  }

  this.init = function(view_id, key_map, label_map, setting_map, templates)
  {
    this.map = {};
    this.view_id = view_id;
    this.label_map = label_map;
    this.setting_map = setting_map;
    this.templates = templates || {};
    var stored_map = key_map, key = '', val = '';
    for( key in stored_map)
    {
      val = window.localStorage.getItem(key);
      this.map[key] = (val === undefined || val === null) ? key_map[key] : JSON.parse(val);
    }
    if(!window.settings)
    {
      window.settings = {};
    }
    window.settings[arguments[0]] = this;
  }

  if(!window.localStorage)
  {
    window.localStorage = 
    {
      setItem: function(name, value)
      {
        document.cookie = name + "="+
          encodeURIComponent(value)+
          "; expires="+(new Date(new Date().getTime()+ (360 * 24 * 60 * 60 * 1000 ))).toGMTString()+
          "; path=/";
      },
      getItem: function(name)
      {
        var match = null;
        if (match = new RegExp(name+'\=([^;]*);','').exec(document.cookie+';'))
        {
          return decodeURIComponent(match[1]);
        }
        return null;
      }
    }
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

Settings.get_setting_with_view_key_token = function(token)
{
  var arr = token.split('.'), setting = window.settings[arr[0]], key = arr[1];
  return setting && setting.exists(key) && {
      setting: setting, 
      view: arr[0], 
      key: key, 
      value: setting.get(key), 
      label: setting.label_map[key]
    } || null;
}

Settings.prototype = new SettingsBase();

