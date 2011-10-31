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
  this._sync_view = function(key, value)
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
      buttons = _switch.getElementsByClassName('ui-button');
      for( j = 0; button = buttons[j]; j++)
      {
        if( button.getAttribute('key') == key_id )
        {
          value ? button.addClass('is-active') : button.removeClass('is-active');
          force_reflow = true;
        }
      }
    }
  }

  /**
   * Set the value of key.
   */
  this.set = function(key, value, sync_switches) 
  {
    window.localStorage.setItem(key, JSON.stringify(this.map[key] = value))
    if (sync_switches && typeof value == 'boolean')
    {
      this._sync_view(key, value);
    }
    if (this.callback_map.hasOwnProperty(key))
    {
      this.callback_map[key].call(this, value);
    }
    messages.post("setting-changed", {id: this.view_id, key: key});
  }

  /**
   * Returns the value assosciated with "key". If the key does not exist,
   * returns undefined
   * @argument {string} key whos value to get
   */
  this.get = function(key) 
  { 
    var val = "";
    return (
    typeof this.map[key] !== 'undefined' ?
    this.map[key] :
    (this.map[key] = ((val = window.localStorage.getItem(key)) ? JSON.parse(val) : null)));
  }
  
  /**
   * Check if a particular key exist in the settings object
   */
  this.exists = function(key)
  {
    return key in this.map;
  }

  this._menu_item_handler = function(item, event, target)
  {
    this.set(item, !this.get(item), true);
    views[this.view_id].update();
  };

  this.init = function(view_id, key_map, label_map, setting_map, templates, group, callback_map)
  {
    this.map = {};
    this.view_id = view_id;
    this.label_map = label_map;
    this.setting_map = setting_map;
    this.templates = templates || {};
    this.group = group;
    this.callback_map = callback_map || {};
    var stored_map = key_map, key = '', val = '';
    for( key in stored_map)
    {
      val = window.localStorage.getItem(key);
      this.map[key] = (val === undefined || val === null) ? key_map[key] : 
                      val === 'undefined' ? undefined : JSON.parse(val);
    }
    if(!window.settings)
    {
      window.settings = {};
    }
    window.settings[arguments[0]] = this;

    // Add a context menu
    var contextmenu = ContextMenu.get_instance();
    var menu = setting_map && setting_map.contextmenu;
    if (menu)
    {
      var items = [];
      for (var i = 0, item; item = menu[i]; i++)
      {
        items.push({
          label: label_map[item],
          settings_id: item,
          handler: this._menu_item_handler.bind(this, item)
        });
      }
      contextmenu.register(view_id, items);
    }
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
var Settings = function(view_id, key_map, label_map, setting_map, template, group, callback_map)
{
  this.init(view_id, key_map, label_map, setting_map, template, group, callback_map);
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

/**
 * Get all settings belonging to the group `group`
 */
Settings.get_settings_by_group = function(group)
{
    //var group_settings = {};
    var group_settings = [];
    var settings = window.settings;
    for (var setting in settings)
    {
        if (settings[setting].group == group)
        {
            //group_settings[setting] = settings[setting];
            group_settings.push(setting);
        }
    }
    return group_settings;
};

Settings.prototype = new SettingsBase();

/**
 * A group for settings.
 *
 * @param label The visible label for this group
 * @param group_name The name of the group that a Setting can be added to
 */
var SettingsGroup = function(label, group_name)
{
    this.label = label;
    this.group_name = group_name;

    SettingsGroup.groups.push(this);
}

SettingsGroup.groups = [];

