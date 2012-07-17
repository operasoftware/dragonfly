/**
  * @constructor
  * @extends ViewBase
  */
var CompositeViewBase = function()
{
  this.type = 'composite-view';
  this.has_modebar = false;

  this.update = function(cell, is_resize) // for testing
  {
    // copie from the container cell to the view cell
    var isvisible = false;
    var modebar_height = this.modebar ? this.modebar.offsetHeight : 0;
    this._parent_cell = cell;
    for (var id, i = 0; id = this.container_ids[i]; i++)
    {
      isvisible = true;
      this.cell.left = cell.left + cell.left_border_padding;
      this.cell.top = cell.top + cell.top_border_padding;
      this.cell.width = cell.width;
      this.cell.height = cell.height - modebar_height;
      if(this.cell.width + this.cell.height > 0)
      {
        this.cell.setDefaultDimensions();
        this.cell.update(this.cell.left, this.cell.top, true, is_resize);
      }
    }
    if (isvisible && modebar_height)
    {
      this.modebar.cell = this.cell;
      this.modebar.setDimensions(true);
      this.modebar.setup();
    }
  }

  this._on_setting_change = function(msg)
  {
    if (msg.id == "modebar" && msg.key == "show-modebar-" + this._modebar_id)
    {
      this.modebar.setVisibility(window.settings.modebar
                                 .get("show-modebar-" + this._modebar_id));
      if (this._parent_cell)
      {
        this.update(this._parent_cell);
      }
    }
  }

  this.initCompositeView = function(id, name, layout_rough, modebar_id, services)
  {
    this._layout_rough = layout_rough;
    this.cell = new Cell(layout_rough, layout_rough.dir, null, null, services);
    if (modebar_id)
    {
      this._modebar_id = modebar_id;
      this.modebar = UI.get_instance().get_modebar(modebar_id);
      this.has_modebar = true;
      window.messages.addListener('setting-changed', this._on_setting_change.bind(this));
      if (this.modebar)
      {
        this.modebar.setVisibility(window.settings.modebar
                                   .get("show-modebar-" + this._modebar_id));
      }
    }
    this.init(id, name);
  }

  this.update_cell = function(layout_rough)
  {
    this._layout_rough = layout_rough || (layout_rough = this._layout_rough);
    this.cell = new Cell(layout_rough, layout_rough.dir);
  }
}

/**
  * @constructor
  * @extends CompositeViewBase
  */

var CompositeView = function(id, name, rough_layout, modebar_id, services)
{
  this.initCompositeView(id, name, rough_layout, modebar_id, services);
}

CompositeViewBase.prototype = ViewBase;
CompositeView.prototype = new CompositeViewBase();
