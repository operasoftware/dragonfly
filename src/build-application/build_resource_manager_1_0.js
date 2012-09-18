window.app.builders.ResourceManager = window.app.builders.ResourceManager || {};

window.app.builders.ResourceManager["1.0"] = function(service)
{
  var network_logger = new cls.NetworkLogger();
  new cls.ResourceTreeView("resource_tree_view",
                           "Tree View",
                           "resource-tree",
                           "",
                           "",
                           network_logger);
  new cls.ResourceDetailView("resource_detail_view",
                             "Detail",
                             "",
//                             "",
                             "",
                             network_logger);
  cls.ResourceDetailView.create_ui_widgets();

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
