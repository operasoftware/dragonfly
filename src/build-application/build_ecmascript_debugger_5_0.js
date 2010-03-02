/* load after build_application.jsn */

window.app.builders.EcmascriptDebugger || ( window.app.builders.EcmascriptDebugger = {} );

/**
  * @param {Object} service the service description of the according service on the host side
  */

window.app.builders.EcmascriptDebugger["5.0"] = function(service)
{
  var namespace = cls.EcmascriptDebugger && cls.EcmascriptDebugger["5.0"];
  var service_interface = window.app.helpers.implement_service(namespace);

  if(service_interface)
  {
    window.ObjectDataBase = new namespace.ObjectDataBase();
    namespace.Frame_inspection_data.prototype = ObjectDataBase;
    window.frame_inspection_data = new namespace.Frame_inspection_data();
    namespace.Node_dom_attrs.prototype = ObjectDataBase;
    window.node_dom_attrs = new namespace.Node_dom_attrs();
    namespace.Object_inspection_data.prototype = ObjectDataBase;
    window.object_inspection_data = new namespace.Object_inspection_data();

    var service_interface = service_interface
    window.runtimes = new namespace.Runtimes();
    window.runtimes.bind(service_interface);

    window.dom_data = new namespace.DOMData();
    window.dom_data.bind(service_interface);
    window.stop_at = new namespace.StopAt();
    window.stop_at.bind(service_interface);
    window.host_tabs = new namespace.HostTabs();
    window.host_tabs.bind(service_interface);
    window.hostspotlighter = new namespace.Hostspotlighter();
    window.hostspotlighter.bind(service_interface);

    /* 
      we will use a namespace for all the followindg classes only 
      if we need to adjust them for an  updated service version
    */

    window.elementLayout = new cls.ElementLayout();
    window.elementStyle = new cls.ElementStyle();
    window.export_data = new cls.ExportData();
    new cls.ExportDataView('export_data', ui_strings.M_VIEW_LABEL_EXPORT, 'scroll export-data');

    window.simple_js_parser = new window.cls.SimpleJSParser();

    /* DOM */
    new cls.DOMInspectorActions('dom'); // the view id
    new cls.DOMInspectorKeyhandler('dom');
    new cls.DOMInspectorEditKeyhandler('dom');

    /* ECMA object inspection */
    namespace.InspectionView.prototype = ViewBase;
    new namespace.InspectionView('inspection', ui_strings.M_VIEW_LABEL_FRAME_INSPECTION, 'scroll');
    namespace.InspectionView.create_ui_widgets();

    /* DOM object inspection */
    namespace.DOMAttrsView.prototype = ViewBase;
    new namespace.DOMAttrsView('dom_attrs', ui_strings.M_VIEW_LABEL_DOM_ATTR, 'scroll dom-attrs');
    namespace.DOMAttrsView.create_ui_widgets();

    /* storage objects and cookies */
    new cls.Namespace("storages");
    window.storages.add(new cls.LocalStorageData(
      'local_storage', 'local-storage', 'Local Storage', 'localStorage'));
    window.storages.add(new cls.LocalStorageData(
      'session_storage', 'session-storage', 'Session Storage', 'sessionStorage'));
    window.storages.add(new cls.CookiesData('cookies', 'cookies', 'Cookies'));
    new cls.LocalStorageView('local_storage', 'Storage', 'scroll');

  }

}