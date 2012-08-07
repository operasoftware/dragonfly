window.app.builders.ResourceManager = window.app.builders.ResourceManager || {};

window.app.builders.ResourceManager["1.0"] = function(service)
{
  window.network_logger = new cls.NetworkLoggerService();
  new cls.ResourceTreeView('resource_tree_view','Tree View');
  new cls.ResourceDetailView('resource_detail_view', 'Detail');
  cls.ResourceDetailView.create_ui_widgets();

  new cls.NetworkLogView("network_logger", ui_strings.M_VIEW_LABEL_NETWORK_LOG, "scroll network_logger", null, "network-logger");
  new cls.RequestCraftingView("request_crafter", ui_strings.M_VIEW_LABEL_REQUEST_CRAFTER, "scroll", "", "");
  new cls.NetworkOptionsView("network_options",
                             ui_strings.M_VIEW_LABEL_NETWORK_OPTIONS,
                             "scroll network-options-container", "", "");
  cls.NetworkLog.create_ui_widgets();

  return true;
};
