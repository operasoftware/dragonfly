var CellOverlay = function(view_id, parent_cell, parent_view_id)
{
  this._init(view_id, parent_cell, parent_view_id);
};

var CellOverlayPrototype = function()
{
  this._init = function(view_id, parent_cell, parent_view_id)
  {
    this.view_id = view_id;
    this.parent_cell = parent_cell;
    this.parent_view_id = parent_view_id;
    this.is_active = false;
    window.messages.add_listener("show-view", this._onview_show.bind(this));
    window.messages.add_listener("hide-view", this._onview_hide.bind(this));
    var layout_rough =
    {
      dir: "h",
      children:
      [
        { tabbar: { tabs: [], is_hidden: true, is_empty: true } , width: 150, min_width: 7, name: view_id },
        { tabbar: { tabs: [view_id], is_hidden: true } },
      ]
    };
    CellBase.init.call(this, layout_rough, layout_rough.dir);
  };

  this._onview_show = function(msg)
  {
    if (this.is_active && msg.id == this.parent_view_id)
      this.show();
  };

  this._onview_hide = function(msg)
  {
    if (this.is_active && msg.id == this.parent_view_id)
      this.remove_ui_elements(this.view_id);
  };

  this.show = function()
  {
    var view = window.views[this.view_id];
    if (!view || view.isvisible())
      return this.is_active;
    var parent_view = window.views[view.parent_view_id];
    if (!parent_view || !parent_view.isvisible())
      return this.is_active;
    var parent_toolbar = window.toolbars[this.parent_view_id];
    if (parent_toolbar)
      parent_toolbar.disable();
    this.is_active = true;
    this._update();
    return this.is_active;
  };

  this.update = function()
  {
    if (this.is_active && window.views[this.view_id] && window.views[this.view_id].isvisible())
      this._update();
  };

  this._update = function()
  {
    var tabbar_height = this.parent_cell.tab.offsetHeight;
    this.width = this.parent_cell.width;
    this.height = this.parent_cell.height - tabbar_height;
    this.setDefaultDimensions();
    CellBase.update.call(this, this.parent_cell.left, this.parent_cell.top + tabbar_height, true);
  };

  this.hide = function()
  {
    var parent_toolbar = window.toolbars[this.parent_view_id];
    if (parent_toolbar)
      parent_toolbar.enable();
    this.is_active = false;
    this.remove_ui_elements(this.view_id, true);
  };
};

CellOverlayPrototype.prototype = CellBase;
CellOverlay.prototype = new CellOverlayPrototype();
