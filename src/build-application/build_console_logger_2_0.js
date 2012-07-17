/* load after build_application.jsn */

window.app.builders.ConsoleLogger || ( window.app.builders.ConsoleLogger = {} );
/**
  * @param {Object} service the service description of the according service on the host side
  */
window.app.builders.ConsoleLogger["2.0"] = function(service)
{
  var namespace = cls.ConsoleLogger && cls.ConsoleLogger["2.0"];
  if(namespace)
  {
    window.error_console_data = new namespace.ErrorConsoleData();
  }
  var view_namespace = cls.ConsoleLogger;
  if(view_namespace)
  {
    new view_namespace.ConsoleView("console", ui_strings.S_SETTINGS_HEADER_CONSOLE, "scroll");
    view_namespace.ConsoleView.create_ui_widgets();
    // TODO proper namespace handling for views
    ErrorConsoleView.roughViews.createViews();
    return true;
  }
};

window.app.builders.ConsoleLogger["2.1"] = function(service)
{
  var namespace = cls.ConsoleLogger && cls.ConsoleLogger["2.1"];
  if(namespace)
  {
    window.error_console_data = new namespace.ErrorConsoleData();
  }
  var view_namespace = cls.ConsoleLogger;
  if(view_namespace)
  {
    new view_namespace.ConsoleView("console", ui_strings.S_SETTINGS_HEADER_CONSOLE, "scroll");
    view_namespace.ConsoleView.create_ui_widgets();
    ErrorConsoleView.roughViews.createViews();
    return true;
  }
};
