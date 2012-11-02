window.app.builders.ResourceManager = window.app.builders.ResourceManager || {};

window.app.builders.ResourceManager["1.0"] = function(service)
{
  var network_logger = new cls.NetworkLogger();
  var resource_inspector = new cls.ResourceInspector(network_logger);

  new cls.ResourceTreeView("resource_tree_view",
                           "",
                           "",
                           "",
                           "",
                           resource_inspector);
  new cls.ResourceDetailView("resource_detail_view",
                             "",
                             "",
                             "",
                             "",
                             resource_inspector);
  cls.ResourceDetailView.create_ui_widgets();
  cls.ResourceTreeView.create_ui_widgets();

  new cls.NetworkLogView("network_logger",
                         ui_strings.M_VIEW_LABEL_NETWORK_LOG,
                         "scroll network_logger",
                         null,
                         "network-logger",
                         network_logger);
  new cls.RequestCraftingView("request_crafter",
                              ui_strings.M_VIEW_LABEL_REQUEST_CRAFTER,
                              "scroll",
                              "",
                              "",
                              network_logger);
  new cls.NetworkOptionsView("network_options",
                             ui_strings.M_VIEW_LABEL_NETWORK_OPTIONS,
                             "scroll network-options-container", "", "");
  cls.NetworkLog.create_ui_widgets();

  return true;
};
