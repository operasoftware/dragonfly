/* load after build_application.js */

window.app.builders.Exec || ( window.app.builders.Exec = {} );
/**
  * @param {Object} service the service description of the according service on the host side
  */
window.app.builders.Exec["2.0"] = function(service)
{
  var namespace = cls.Exec && cls.Exec["2.0"];


  new cls.ScreenShotControlsView("screenshot-controls",
                                 "Color Picker",
                                 "screenshot-controls");
  new cls.ColorPaletteView("color-palette",
                           "Color Palette",
                           "color-palette");
  return true;
}
