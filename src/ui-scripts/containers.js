/**
  * @constructor 
  * @extends UIBase
  */

var ContainerBase = function()
{
  this.type = 'container';
  this.height = 0;
  this.width = 0;
  this.border_left = 1;
  this.border_right = 1;
  this.top = 0;
  this.left = 0;
  this.is_dirty = true;
  this.view_id = '';

  this.setDimensions = function(force_redraw)
  {
    var dim = '', i = 0;

    if(!this.default_height)
    {
      this.setCSSProperties();
    }

    var toolbar_height =  this.cell.toolbar.height ? this.cell.toolbar.offsetHeight : 0;


    dim = this.cell.top + toolbar_height;
    if( dim != this.top)
    {
      this.is_dirty = true;
      this.top = dim;
    }

    dim = this.cell.left;
    if( dim != this.left)
    {
      this.is_dirty = true;
      this.left = dim;
    }

    dim = this.cell.width - this.horizontal_border_padding;
    if( dim != this.width)
    {
      this.is_dirty = true;
      this.width = dim;
    }

    dim = this.cell.height - toolbar_height - this.cell.tab.offsetHeight - this.vertical_border_padding;
    if( dim != this.height)
    {
      this.is_dirty = true;
      this.height = dim;
    }

    this.update(force_redraw);

    views[this.view_id] && views[this.view_id].onresize();

  }

  this.setup = function(view_id)
  {
    var view = views[this.view_id = view_id];
    var container = document.getElementById(this.type + '-to-' + this.cell.id) || this.update();
    if( view )
    {
      if( view.default_handler )
      {
        container.setAttribute('handler', view.default_handler); 
      }
      else
      {
        container.removeAttribute('handler');
      }
      container.className = view.container_class || '';
      container.innerHTML = '';
      view.update();
    }
  }

  this.init = function(cell)
  {
    this.cell = cell;
    this.initBase();
  }

}

/**
  * @constructor 
  * @extends ContainerBase
  */

var Container = function(cell)
{
  this.init(cell);
}

ContainerBase.prototype = UIBase;
Container.prototype = new ContainerBase();

