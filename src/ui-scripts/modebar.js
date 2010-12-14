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
  // TODO what is this?
  this.bottom_border = 1;
  this.offsetHeight = 0;
  this.cell = null;
  this.width = 0;
  this.top = 0;
  this.left = 0;
  this.is_dirty = true;

  this.setDimensions = function(force_redraw)
  {
    var dim = 0;

    // set css properties
    if (!this.default_height)
    {
      this.setCSSProperties()
    }
    dim = this.cell.top - this.offsetHeight;
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

    this.update(force_redraw)
    // TODO
    // this.horizontal_nav.check_width();
  };
  
  this.__defineGetter__("offsetHeight", function()
  {
    if (!this.default_height)
    {
      this.setCSSProperties();
    }
    return this.__is_visible ? this._offset_height : 0;
  });
  
  this.__defineSetter__("offsetHeight", function(offset_height)
  {
    this._offset_height = offset_height;
  });

  this.setVisibility = function(is_visible)
  {
    this.__is_visible = is_visible;
    if (this.cell && this.isvisible() && !is_visible)
    {
      var modebar = this.getElement();
      modebar.parentNode.removeChild(modebar);
    }
  };

  /*
  this.set_content = function(id, template_list, focus_end)
  {
    this.horizontal_nav.set_content(id, template_list, focus_end);
  };
  */
  this.setup = function(view_id)
  {
    // TODO
    // this.element = document.getElementById(this.type + '-to-' + this.cell.id) || this.update();
    // this.element.appendChild(this.horizontal_nav.element);
  };
  

  this.init = function()
  {
    // TODO
    // this.horizontal_nav = new HorizontalNavigation(cell);
    this.initBase();
  };
};

/**
 * @constructor
 * @extends ModebarBase
 */
var Modebar = function()
{
  this.init();
};

ModebarBase.prototype = UIBase;
Modebar.prototype = new ModebarBase();
