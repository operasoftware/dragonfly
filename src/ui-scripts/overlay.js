/**
 * @constructor
 * @extends UIBase
 */
var Overlay = function(cell)
{
    this.type = "overlay";
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
      this._is_visible = !this._is_visible;
    };

    this.show_group = function(group, content)
    {
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

    this.setup = function(id)
    {
      this.element = document.getElementById(this.type + '-to-' + this.cell.id) || this.update();
      this.element.setAttribute("type", id);
      this.element.render(window.templates.overlay());
      this.content_element = this.element.querySelector("overlay-content");
    };

    this.init = function(cell) {
      this.cell = cell;
      this.initBase();
    };

    this.init(cell);
};

Overlay.prototype = UIBase;

