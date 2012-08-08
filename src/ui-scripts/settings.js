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
   * Set the value of key.
   */
  this.set = function(key, value, sync_switches)
  {
    this.map[key] = value;
    this._storage.stringify_and_set_item(key, value);
    if (this.callback_map.hasOwnProperty(key))
      this.callback_map[key].call(this, value);
    messages.post("setting-changed", {id: this.view_id, key: key, value: value});
  };

  /**
   * Returns the value assosciated with "key". If the key does not exist,
   * returns undefined
   * @argument {string} key whos value to get
   */
  this.get = function(key)
  {
    if (this.map[key] == null)
      this.map[key] = this._storage.get_and_parse_item(key, this._default_values[key]);
    return this.map[key];
  };

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

  this.init = function(view_id, default_values, label_map, setting_map, templates, group, callback_map)
  {
    this.map = {};
    this.view_id = view_id;
    this.label_map = label_map;
    this.setting_map = setting_map;
    this.templates = templates || {};
    this.group = group;
    this.callback_map = callback_map || {};
    this._default_values = default_values;
    this._storage = window.localStorage;
    for (var key in default_values)
    {
      this.map[key] = this._storage.get_and_parse_item(key, default_values[key]);
    }
    if (!window.settings)
      window.settings = {};
    window.settings[view_id] = this;
    window.messages.post("settings-initialized", {view_id: view_id, setting: this});
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
  };
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

