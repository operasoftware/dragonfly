/**
 * @constructor
 * @extends UIBase
 */
var ModebarBase = function()
{
  this.type = 'modebar';
  this.default_height = 0;
  this.height = 0;
  this.top_border = 0;
  this.bottom_border = 1;
  this.offsetHeight = 0;

  this.setDimensions = function(force_redraw)
  {
    var dim = 0;

    // set css properties

    if (!this.default_height)
    {
      this.setCSSProperties()
    }

    dim = this.cell.tab.offsetHeight + (this.cell.toolbar ? this.cell.toolbar.offsetHeight : 0);
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

    dim = this._is_visible ? this.default_height : 0;
    if (dim != this.height)
    {
      this.is_dirty = true;
      this.height = dim;
      this.offsetHeight = dim + this.vertical_border_padding;
    }

    this.update(force_redraw)
  };

  this.setContent = function(content)
  {
    var modebar = document.getElementById(this.type + '-to-' + this.cell.id) || this.update();
    modebar.innerHTML = content;
  };

  this.setVisibility = function(is_visible)
  {
    this._is_visible = is_visible;
    if(toolbars[this._view_id])
    {
      toolbars[this._view_id].setVisibility(is_visible);
    }
  };

  this.setup = function(view_id)
  {
    var modebar = document.getElementById(this.type + '-to-' + this.cell.id) || this.update();
    modebar.innerHTML = 'modebar';
    this._view_id = view_id;
  };

  this.init = function(cell)
  {
    this.cell = cell;
    this.width = 0;
    this.top = 0;
    this.left = 0;
    this.is_dirty = true;
    this._is_visible = true;
    this.initBase();
  };
};

/**
 * @constructor
 * @extends ModebarBase
 */
var Modebar = function(cell)
{
  this.init(cell);
};

ModebarBase.prototype = UIBase;
Modebar.prototype = new ModebarBase();

