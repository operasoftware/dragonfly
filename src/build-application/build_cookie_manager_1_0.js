/* load after build_application.js */

window.app.builders.CookieManager || ( window.app.builders.CookieManager = {} );

/**
  * @param {Object} service the service description of the according service on the host side
  */

window.app.builders.CookieManager["1.1"] = function(service)
{
  var service_interface = window.services['cookie-manager'];
  if (service_interface)
  {
    new cls.CookieManager["1.1"].CookieManagerView("cookie_manager",
                                                   ui_strings.M_VIEW_LABEL_COOKIES,
                                                   "scroll storage_view cookie_manager",
                                                   cls.CookieManager["1.1"].CookieManagerData);
    cls.CookieManager.create_ui_widgets();
    return true;
  }
}
