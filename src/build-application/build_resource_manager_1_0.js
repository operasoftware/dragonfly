window.app.builders.ResourceManager = window.app.builders.ResourceManager || {};

window.app.builders.ResourceManager["1.0"] = function(service)
{
  new cls.ResourceManagerView('resource_manager', "Resources", 'scroll', '', '');
  new cls.ResourceManagerFontView('resource_fonts', "Fonts", 'scroll', '', '');
};