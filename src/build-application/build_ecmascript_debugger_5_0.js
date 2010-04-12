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

    /* ECMA object inspection */
    namespace.InspectionView.prototype = ViewBase;
    new namespace.InspectionView('inspection', ui_strings.M_VIEW_LABEL_FRAME_INSPECTION, 'scroll');
    namespace.InspectionView.create_ui_widgets();

    /* DOM object inspection */
    namespace.DOMAttrsView.prototype = ViewBase;
    new namespace.DOMAttrsView('dom_attrs', ui_strings.M_VIEW_LABEL_DOM_ATTR, 'scroll dom-attrs');
    namespace.DOMAttrsView.create_ui_widgets();

    /*
      a namespace for all the followindg classes will only be created
      if needed to adjust them for an updated service version
    */

    window.runtime_onload_handler = new cls.RuntimeOnloadHandler();

    /* temporary export view */
    window.export_data = new cls.ExportData();
    new cls.ExportDataView('export_data', ui_strings.M_VIEW_LABEL_EXPORT, 'scroll export-data');

    /* commandline */
    cls.CommandLineView.prototype = ViewBase;
    new cls.CommandLineView('command_line', ui_strings.M_VIEW_LABEL_COMMAND_LINE, 'scroll', '', 'cmd-focus');
    cls.CndRtSelect.prototype = new CstSelect();
    new cls.CndRtSelect('cmd-runtime-select', 'cmd-line-runtimes');
    cls.CommandLineView.create_ui_widgets();

    /* JS source */
    window.simple_js_parser = new window.cls.SimpleJSParser();
    new cls.JsSourceView('js_source', ui_strings.M_VIEW_LABEL_SOURCE, 'scroll js-source');
    new cls.ScriptSelect('js-script-select', 'script-options');
    cls.JsSourceView.create_ui_widgets();

    /* Callstack */
    cls.CallstackView.prototype = ViewBase;
    new cls.CallstackView('callstack', ui_strings.M_VIEW_LABEL_CALLSTACK, 'scroll');

    /* Threads */
    cls.ThreadsView.prototype = ViewBase;
    new cls.ThreadsView('threads', ui_strings.M_VIEW_LABEL_THREAD_LOG, 'scroll threads');
    cls.ThreadsView.create_ui_widgets();

    /* DOM */
    new cls.DOMInspectorActions('dom'); // the view id
    new cls.DOMInspectorKeyhandler('dom');
    new cls.DOMInspectorEditKeyhandler('dom');
    cls.DOMView.prototype = ViewBase;
    new cls.DOMView('dom', ui_strings.M_VIEW_LABEL_DOM, 'scroll dom');
    cls.DOMView.prototype.constructor = cls.DOMView;
    DOM_markup_style.apply(cls.DOMView.prototype);
    cls.DocumentSelect.prototype = new CstSelect();
    new cls.DocumentSelect('document-select', 'document-options');
    cls.DOMView.create_ui_widgets();
    messages.post('setting-changed', {id: 'dom', key: 'dom-tree-style'});

    /* Stylesheets */
    window.stylesheets = new cls.Stylesheets();
    cls.StylesheetsView.prototype = ViewBase;
    new cls.StylesheetsView('stylesheets', ui_strings.M_VIEW_LABEL_STYLESHEET, 'scroll stylesheets');
    cls.StylesheetSelect.prototype = new CstSelect();
    new cls.StylesheetSelect('stylesheet-select', 'stylesheet-options');
    cls.StylesheetsView.create_ui_widgets();

    /* CSS inspector */
    window.elementStyle = new cls.ElementStyle();
    cls.CSSInspectorView.prototype = ViewBase;
    new cls.CSSInspectorView('css-inspector', ui_strings.M_VIEW_LABEL_STYLES, 'scroll css-inspector');
    cls.CSSInspectorView.create_ui_widgets();

    /* Layout */
    window.elementLayout = new cls.ElementLayout();
    cls.CSSLayoutView.prototype = ViewBase;
    new cls.CSSLayoutView('css-layout', ui_strings.M_VIEW_LABEL_LAYOUT, 'scroll css-layout');

    /* storage objects and cookies */
    new cls.Namespace("storages");
    window.storages.add(new cls.LocalStorageData(
      'local_storage',
      'local-storage',
      ui_strings.M_VIEW_LABEL_LOCAL_STORAGE,
      'localStorage'));
    window.storages.add(new cls.LocalStorageData(
      'session_storage',
      'session-storage',
      ui_strings.M_VIEW_LABEL_SESSION_STORAGE,
      'sessionStorage'));
    window.storages.add(new cls.LocalStorageData(
      'widget_preferences',
      'widget-preferences',
      ui_strings.M_VIEW_LABEL_WIDGET_PREFERNCES,
      'widget.preferences'));
    window.storages.add(new cls.CookiesData(
      'cookies',
      'cookies',
      ui_strings.M_VIEW_LABEL_COOKIES));
    new cls.StorageView('local_storage', ui_strings.M_VIEW_LABEL_LOCAL_STORAGE, 'scroll');
    new cls.StorageView('session_storage', ui_strings.M_VIEW_LABEL_SESSION_STORAGE, 'scroll');
    new cls.StorageView('cookies', ui_strings.M_VIEW_LABEL_COOKIES, 'scroll');
    new cls.StorageView('widget_preferences', ui_strings.M_VIEW_LABEL_WIDGET_PREFERNCES, 'scroll');

    /* the following views must be created to get entry in the Settings tab */

    /* Environment */
    cls.EnvironmentView.prototype = ViewBase;
    new cls.EnvironmentView('environment', ui_strings.M_VIEW_LABEL_ENVIRONMENT, 'scroll');
    cls.EnvironmentView.create_ui_widgets();

    /* About */
    cls.AboutView.prototype = ViewBase;
    new cls.AboutView('about', 'About', 'scroll');
    cls.AboutView.create_ui_widgets();

    /* Hostspotlighter */
    cls.HostSpotlightView.prototype = ViewBase;
    new cls.HostSpotlightView('host-spotlight', ui_strings.S_LABEL_SPOTLIGHT_TITLE, '');
    cls.HostSpotlightView.create_ui_widgets();

    /* main view doesn't really exist */
    cls.MainView.create_ui_widgets();

  }

}
