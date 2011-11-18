window.app.builders.ResourceManager = window.app.builders.ResourceManager || {};

window.app.builders.ResourceManager["1.0"] = function(service)
{
  new cls.ResourceManagerAllView('resource_all', ui_strings.M_VIEW_LABEL_ALL_RESOURCES, 'scroll resource-manager', '', '');
  //new cls.ResourceManagerFontView('resource_fonts', "Fonts", 'scroll', '', '');
  //new cls.ResourceManagerImageView('resource_images', "Images", 'scroll', '', '');
  new cls.NetworkLogView('network_logger', ui_strings.M_VIEW_LABEL_NETWORK_LOG, 'scroll network_logger', '', '');
  new cls.RequestCraftingView('request_crafter', ui_strings.M_VIEW_LABEL_REQUEST_CRAFTER, 'scroll', '', '');
  new cls.NetworkOptionsView('network_options', 
                             ui_strings.M_VIEW_LABEL_NETWORK_OPTIONS,
                             'scroll network-options-container', '', '');
  cls.NetworkLog.create_ui_widgets();

  var setup_request_body_behaviour = function()
  {
    var text_types = ["text/html", "application/xhtml+xml", "application/mathml+xml",
                     "application/xslt+xml", "text/xsl", "application/xml",
                     "text/css", "text/plain", "application/x-javascript",
                     "application/json", "application/javascript", "text/javascript",
                     "application/x-www-form-urlencoded",
                     "text/xml",
                     ""]; // <- Yes really.
                     // It's frelling silly, but there's a bug with core not giving us content types
                     // for post data, even though core generates that itself. See CORE-39597

    const STRING = 1, DECODE = 1, OFF = 4;
    var reqarg = [[OFF],
                 text_types.map(function(e) { return [e, [STRING, DECODE]]})
                ];

    window.services['resource-manager'].requestSetRequestMode(null, reqarg);
  }

  window.services['resource-manager'].addListener('enable-success', setup_request_body_behaviour);
  return true;
};
