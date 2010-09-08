/**
 * @constructor
 * @extends UIBase
 */
var Overlay = function(cell)
{
    this.type = "overlay";
    this._is_visible = false;

    this.toggleVisibility = function()
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

    this.setup = function(id)
    {
      this.element = document.getElementById(this.type + '-to-' + this.cell.id) || this.update();
      this.element.setAttribute("type", id);
      var template = ["overlay-window",
                       [
                         ["overlay-tabs",
                           [
                             ["tab", "test", "class", "active", "handler", "overlay-tab"],
                             ["tab", "test2", "handler", "overlay-tab"]
                           ]
                         ],
                         ["overlay-content", [["p", "test"], ["p", "test"], ["p", "test"]]]
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

