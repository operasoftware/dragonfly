/**
  * @constructor
  * @extends ViewBase
  */

var SettingView = function(id, name, container_class)
{
  this.is_hidden = true;
  this.hidden_in_settings = true;
  this.do_not_reset = true;
  this._sort_by_title = function(a, b)
  {
    return (
    window.views[a].name > window.views[b].name && 1 ||
    window.views[a].name < window.views[b].name && -1 ||
    0);
  }
  this.createView = function(container)
  {
    var views = ViewBase.getSingleViews(['hidden_in_settings']).sort(this._sort_by_title);
    container.render(templates.settings(views));
  }

  this.syncSetting = function(view_id, key_name, is_checked)
  {
    var cs = this.getAllContainers(), c= null, i = 0;
    var inputs = null, input = null, j = 0;
    for( ; c = cs[i]; i++)
    {
      inputs = c.getElementsByTagName('input');
      for( j = 0; input = inputs[j]; j++)
      {
        if( input.getAttribute('view-id') == view_id && input.name == key_name )
        {
          input.checked = is_checked;
        }
      }
    }
  }
  this.init(id, name, container_class);
}

SettingView.prototype = ViewBase;

new SettingView('settings_view', ui_strings.S_BUTTON_LABEL_SETTINGS, 'scroll');
