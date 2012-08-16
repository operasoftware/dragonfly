﻿/* load after build_application.js */

window.app.builders.WindowManager || ( window.app.builders.WindowManager = {} );
/**
  * @param {Object} service the service description of the according service on the host side
  */
window.app.builders.WindowManager["2.0"] = function(service,
                                                    service_descriptions,
                                                    session_ctx)
{
  var namespace = cls.WindowManager && cls.WindowManager["2.0"];
  var service_interface = window.services['window-manager'];
  if(service_interface)
  {
    window.window_manager_data = new namespace.WindowManagerData(session_ctx);
    window.window_manager_data.bind(service_interface);
    window.windowsDropDown = new namespace.WindowsDropDown();
    namespace.DebuggerMenu.prototype = new CstSelectWithAction();
    new namespace.DebuggerMenu('debugger-menu', 'debugger-menu');
    return true;
  }
}
