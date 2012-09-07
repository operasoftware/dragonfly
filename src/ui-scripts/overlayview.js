var OverlayView = function(id, container_class, html, default_handler) {};
var OverlayViewPrototype = function()
{
  this.type = "overlay";

  this.show = function()
  {
    var cell = window.topCell.get_cell(this.parent_view_id);
    if (cell)
      this.is_active = cell.show_overlay(this);
  };

  this.hide = function()
  {
    var cell = window.topCell.get_cell(this.parent_view_id);
    if (cell)
      cell.hide_overlay(this.id);
    this.is_active = false;
    this.post("hidden", {});
  };

  this.init = function(id, container_class, html, default_handler)
  {
    window.cls.MessageMixin.apply(this);
    ViewBase.init.call(this, id, "", container_class, html, default_handler);
  };
};

OverlayViewPrototype.prototype = ViewBase;
OverlayView.prototype = new OverlayViewPrototype();
