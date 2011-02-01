/**
 *  This is a singleton since only one overlay can be shown at any single time.
 *
 * @constructor
 */
var Overlay = function()
{
  if (Overlay._instance)
  {
    return Overlay._instance;
  }
  Overlay._instance = this;

  this._ui = UI.get_instance();
  this.active_overlay = null;

  this.__defineGetter__("is_visible", function()
  {
    return !!(this.element && this.element.parentNode);
  });

  this.show = function(id)
  {
    this.hide();
    var overlay = this._ui.get_overlay(id);
    if (overlay)
    {
      this.active_overlay = id;
      this.element = document.documentElement.render(window.templates.overlay(overlay));
      this.change_group(overlay[0].group_name); // Always show the first tab
    }
  };

  this.hide = function()
  {
    if (this.element)
    {
      this.element.parentElement.removeChild(this.element);
      this.active_overlay = null;
      this.element = null;
    }
  };

  this.change_group = function(group)
  {
    var tabs = this.element.querySelectorAll("tab");
    for (var i = 0, tab; tab = tabs[i]; i++)
    {
      tab.removeClass("active");
      if (tab.getAttribute("group") == group)
      {
          tab.addClass("active");
      }
    }
    var content_element = this.element.querySelector("overlay-content");
    content_element.clearAndRender(window.templates.settings(Settings.get_settings_by_group(group)));
    content_element.scrollTop = 0;
  };
};

Overlay.get_instance = function()
{
  return this._instance || new Overlay();
};

