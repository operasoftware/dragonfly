window.app.builders.ResourceManager = window.app.builders.ResourceManager || {};

window.app.builders.ResourceManager["1.0"] = function(service)
{
  new cls.ResourceManagerAllView('resource_all', ui_strings.M_VIEW_LABEL_ALL_RESOURCES, 'scroll resource-manager', '', '');
  //new cls.ResourceManagerFontView('resource_fonts', "Fonts", 'scroll', '', '');
  //new cls.ResourceManagerImageView('resource_images', "Images", 'scroll', '', '');
  new cls.NetworkLogView('network_logger', ui_strings.M_VIEW_LABEL_NETWORK_LOG, 'scroll', '', '');
  new cls.RequestCraftingView('request_crafter', ui_strings.M_VIEW_LABEL_REQUEST_CRAFTER, 'scroll', '', '');
  new cls.NetworkOptionsView('network_options', ui_strings.M_VIEW_LABEL_NETWORK_OPTIONS, 'scroll', '', '');
  return true;
};
