var OverlayBackground = function(cell)
{
  this.init(cell);
};

var OverlayBackgroundPrototype = function()
{
  this.type = "overlay-background";
  this.height = 0;
  this.width = 0;
  this.top = 0;
  this.left = 0;
  this.is_dirty = true;

  this.setDimensions = function(force_redraw)
  {
    if (!this.horizontal_border_padding)
      this.setCSSProperties();
    var dim = this.cell.top - 1;
    if (dim != this.top)
    {
      this.is_dirty = true;
      this.top = dim;
    }
    dim = this.cell.left;
    if (dim != this.left)
    {
      this.is_dirty = true;
      this.left = dim;
    }
    dim = this.cell.width - this.horizontal_border_padding;
    if (dim != this.width)
    {
      this.is_dirty = true;
      this.width = dim;
    }
    dim = this.cell.height - this.vertical_border_padding + 1;
    if (dim != this.height)
    {
      this.is_dirty = true;
      this.height = dim;
    }
    this.update(force_redraw);
  };

  this.setup = function(view_id)
  {
    if (!document.getElementById(this.type + '-to-' + this.cell.id))
      this.update();
  };

  this.update = function(force_redraw)
  {
    if (force_redraw)
      this.is_dirty = true;
    var id = this.type + '-to-' + this.cell.id;
    var ele = document.getElementById(id);
    if (!ele)
    {
      ele = document.render(["div", "class", "background-overlay", "id", id]);
      viewport.appendChild(ele);
    }

    if (this.is_dirty)
    {
      this.is_dirty = false;
      this.update_style(ele.style);
      this.update_sub_class();
    }
    return ele;
  }

  this.init = function(cell)
  {
    this.cell = cell;
    this.initBase();
  };
};

OverlayBackgroundPrototype.prototype = UIBase;
OverlayBackground.prototype = new OverlayBackgroundPrototype();
