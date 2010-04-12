/* load after build_application.js */

window.app.builders.HttpLogger || ( window.app.builders.HttpLogger = {} );
/**
  * @param {Object} service the service description of the according service on the host side
  */
window.app.builders.HttpLogger["2.0"] = function(service)
{
  var namespace = cls.HttpLogger && cls.HttpLogger["2.0"];
  var service_interface = window.app.helpers.implement_service(namespace);
  if(service_interface)
  {
    (new namespace.ParseMessages()).bind(service_interface);
    window.HTTPLoggerData = new namespace.HTTPLoggerData();
    namespace.RequestListView.prototype = ViewBase;
    new namespace.RequestListView('request_list', ui_strings.M_VIEW_LABEL_REQUEST_LOG, 'scroll');
    namespace.RequestListView.create_ui_widgets();
  }
}
