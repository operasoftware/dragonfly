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
    new cls.CookieManager["1.0"].CookieManagerView("cookie_manager", "Cookies", "scroll cookie_manager", service.version); // todo: use service instead
  }
}

window.app.builders.CookieManager["1.1"] = function(service)
{
  var namespace = cls.CookieManager && cls.CookieManager["1.1"];
  var service_interface = window.services['cookie-manager'];
  if(service_interface)
  {
    new cls.CookieManager["1.1"].CookieManagerView("cookie_manager", "Cookies", "scroll cookie_manager", service.version); // todo: use service instead
  }
}
