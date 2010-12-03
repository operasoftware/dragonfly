/**
 *  This is a singleton since only one overlay can be shown at any single time.
 *
 * @constructor
 */
var Overlay = function()
{
  if (Overlay.instance)
  {
    return Overlay.instance;
  }
  else
  {
    Overlay.instance = this;
  }

  this.groups = {};

  this.show_overlay = function(overlay_id)
  {
    var group = this.groups[overlay_id];
    this.element = document.querySelector("main-view").render(window.templates.overlay(group));
    this.change_group(group[0].group_name); // Always show the first tab
  };

  this.hide_overlay = function()
  {
    this.element.parentElement.removeChild(this.element);
    this.element = null;
  };

  this.is_visible = function()
  {
    return !!(this.element && this.element.parentNode);
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

  this.add_overlay = function(overlay_id, groups)
  {
    this.groups[overlay_id] = groups;
  };
};

