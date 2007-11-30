var SettingView = function(id, name, container_class)
{
  this.ishidden_in_menu = true;
  this.createView = function(container)
  {
    container.render(templates.settings(ViewBase.getSingleViews()));
  }
  this.init(id, name, container_class);
}

SettingView.prototype = ViewBase;

new SettingView('settings_view', 'Settings', 'scroll');