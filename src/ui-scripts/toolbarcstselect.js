var CstSelectToolbarSettings = function(view_id, settings_arr)
{

  this._add_view_to_key = function(key)
  {
    return ( !/\./.test(key) && view_id + '.' || '') + key;
  }
  this.id = view_id;
  this._settings_arr = (settings_arr || []).map(this._add_view_to_key);
  
  // base init params: id, class_name, type, handler
  this.base_init = this.init;
  this.init = function()
  {
    window.toolbar_settings || (window.toolbar_settings = {});
    window.toolbar_settings[this.id] = this;
  }

  this.template_view_key_token = function(view_key_token)
  {
    var setting = Settings.get_setting_with_view_key_token(view_key_token);
    // create markup so that eventHandlers.click['toolbar-switch'] in
    // ui-actions.js can handle the toggle action
    return setting && [
        "cst-option",
          ['label',
            ['input',
              'type', 'checkbox'
            ].concat(setting.value ? ['checked', 'checked'] : []),
          setting.label,
          ],
        "unselectable", "on",
        "key", view_key_token,
        "is-active", setting.value && "true" || "false"
      ] || [];
  }

  this.templateOptionList = function(select_obj)
  {
    return select_obj._settings_arr.map(select_obj.template_view_key_token);
  }

  this.handleClick = function(target_ele, modal_box, select_obj)
  {
    while(target_ele)
    {
      if(target_ele.nodeName.toLowerCase() == "cst-option")
      {
        eventHandlers.click['toolbar-switch']({target: target_ele});
        break;
      }
      target_ele = target_ele.parentNode;
    }
    return 0;
  };

  this.init();
  this.base_init(view_id);
}

CstSelectToolbarSettings.prototype = CstSelectBase;
