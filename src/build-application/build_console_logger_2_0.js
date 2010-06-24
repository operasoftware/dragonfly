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
    namespace.ConsoleView.prototype = ViewBase;
    new namespace.ConsoleView('console', ui_strings.M_VIEW_LABEL_CONSOLE, 'scroll');
    namespace.ConsoleView.create_ui_widgets();
    // TODO proper namespace handling for views
    ErrorConsoleView.roughViews.createViews();
  }
};