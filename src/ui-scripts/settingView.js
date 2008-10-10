/**
  * @constructor 
  * @extends ViewBase
  */

var SettingView = function(id, name, container_class)
{
  this.ishidden_in_menu = true;
  this.hidden_in_settings = true;
  this.do_not_reset = true;
  this.createView = function(container)
  {
    container.render(templates.settings(ViewBase.getSingleViews(['hidden_in_settings'])));
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

new SettingView('settings_view', 'Settings', 'scroll');