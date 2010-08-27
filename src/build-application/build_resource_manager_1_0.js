
window.app.builders.ResourceManager = window.app.builders.ResourceManager || {};


window.app.builders.ResourceManager["1.0"] = function(service)
{
  //cls.ReplView.create_ui_widgets();
  new cls.ResourceManagerView('resource_manager', "Resources", 'scroll', '', '');
};