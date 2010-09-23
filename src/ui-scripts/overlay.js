/**
 * @constructor
 * @extends UIBase
 */
var Overlay = function(cell)
{
    this.type = "overlay";
    this.groups = {};
    this.current_window = null;
    this._is_visible = false;

    this.toggle_visibility = function()
    {
      if (this._is_visible)
      {
        this.element.removeClass("active");
      }
      else
      {
        this.element.addClass("active");
      }

      if (window.opera.attached && !this.element.hasClass("attached"))
      {
        this.element.addClass("attached");
      }
      else
      {
        this.element.removeClass("attached");
      }

      this._is_visible = !this._is_visible;
    };

    this.set_window = function(window_id)
    {
      this.current_window = window_id;
    };

    this.show_group = function(group, content)
    {
      this.tab_element.clearAndRender(window.templates.settings_groups(this.groups[this.current_window]));
      var tabs = this.element.querySelectorAll("tab");
      for (var i = 0; tab = tabs[i]; i++)
      {
          tab.removeClass("active");
          if (tab.getAttribute("group") == group)
          {
              tab.addClass("active");
          }
      }
      this.content_element.clearAndRender(content);
      this.content_element.scrollTop = 0;
    };

    this.add_window = function(window_id, groups)
    {
      this.groups[window_id] = groups;
    };

    this.init = function(cell) {
      this.cell = cell;
      this.initBase();
      this.element = document.getElementById(this.type + '-to-' + this.cell.id) || this.update();
      this.element.render(window.templates.overlay());
      this.tab_element = this.element.querySelector("overlay-tabs");
      this.content_element = this.element.querySelector("overlay-content");
    };

    this.init(cell);
};

Overlay.prototype = UIBase;

