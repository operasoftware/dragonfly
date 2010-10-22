window.app.builders.ResourceManager = window.app.builders.ResourceManager || {};

window.app.builders.ResourceManager["1.0"] = function(service)
{
  new cls.ResourceManagerView('resource_manager', "Resources", 'scroll', '', '');
  new cls.ResourceManagerFontView('resource_fonts', "Fonts", 'scroll', '', '');
  new cls.ResourceManagerImageView('resource_images', "Images", 'scroll', '', '');
  new cls.RequestCraftingView('request_crafter', "Make request", 'scroll', '', '');
  new cls.NetworkOptionsView('network_options', "Network options", 'scroll', '', '');
};