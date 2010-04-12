/* load after build_application.js */

window.app.builders.Exec || ( window.app.builders.Exec = {} );
/**
  * @param {Object} service the service description of the according service on the host side
  */
window.app.builders.Exec["2.0"] = function(service)
{
  var namespace = cls.Exec && cls.Exec["2.0"];
  window.app.helpers.implement_service(namespace);
  window.color_picker_data = new namespace.ColorPickerDate();
  namespace.ColorPicker.prototype = ViewBase;
  new namespace.ColorPicker('color_picker', 'Color Picker', 'scroll');
  namespace.ColorPicker.create_ui_widget();
}
