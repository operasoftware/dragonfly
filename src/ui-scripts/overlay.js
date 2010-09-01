/**
 * @constructor
 * @extends UIBase
 */
var Overlay = function(cell)
{
    this.type = "overlay";

    this.show = function()
    {
      //
    };

    this.setup = function()
    {
      this.element = document.getElementById(this.type + '-to-' + this.cell.id) || this.update();
      var template = ["overlay-window",
                       [
                         ["overlay-tabs",
                           [
                             ["tab", "test", "class", "active"],
                             ["tab", "test2"]
                           ]
                         ],
                         ["overlay-content", "test"]
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

