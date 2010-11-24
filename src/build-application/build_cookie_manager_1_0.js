/* load after build_application.js */

window.app.builders.CookieManager || ( window.app.builders.CookieManager = {} );

/**
  * @param {Object} service the service description of the according service on the host side
  */

window.app.builders.CookieManager["1.0"] = function(service)
{
  var namespace = cls.CookieManager && cls.CookieManager["1.0"];
  var service_interface = window.services['cookie-manager'];
  if(service_interface)
  {
    new cls.CookieManagerView("cookie_manager", "Cookie Manager", "cookie_manager");
  }
}
