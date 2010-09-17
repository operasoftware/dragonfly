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

    this.show_group = function(group)
    {
        var by_group = Settings.get_settings_by_group(group);
        var tabs = this.element.querySelectorAll("tab");
        for (var i = 0; tab = tabs[i]; i++)
        {
            tab.removeClass("active");
            if (tab.getAttribute("group") == group)
            {
                tab.addClass("active");
            }
        }
        this.element.querySelector("overlay-content").clearAndRender(templates.settings(by_group));
    };

    this.setup = function(id)
    {
      this.element = document.getElementById(this.type + '-to-' + this.cell.id) || this.update();
      this.element.setAttribute("type", id);
      var template = ["overlay-window",
                       [
                         ["overlay-tabs",
                           [
                             ["tab", "General", "group", "general", "handler", "overlay-tab"],
                             ["tab", "Document", "group", "document", "handler", "overlay-tab"],
                             ["tab", "Script", "group", "script", "handler", "overlay-tab"],
                             ["tab", "Resource Manager", "group", "resource_manager", "handler", "overlay-tab"]
                           ]
                         ],
                         ["overlay-content"]
                       ]
                     ];
      this.element.render(template);
    };

    this.init = function(cell) {
      this.cell = cell;
      this.initBase();
    };

    this.init(cell);
};

Overlay.prototype = UIBase;

