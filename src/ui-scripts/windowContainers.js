/**
  * @constructor
  * @extends ContainerBase
  */

var WindowContainerBase = function()
{

  this.type = 'window-container';
  this.vertical_delta = 0;

  this.update_style = function(style)
  {
    if (this.height !== parseInt(style['height']))
      style.height = this.height + 'px';
  }

  this.setDimensions = function(force_redraw)
  {
    var dim = '', i = 0;

    if(!this.default_height)
    {
      this.setCSSProperties();
      this.vertical_delta =
        (this.cell.header && defaults.window_header_offsetHeight || 0) +
        (this.cell.toolbar && this.cell.toolbar.height && this.cell.toolbar.offsetHeight || 0 ) +
        (this.cell.statusbar && defaults.window_statusbar_offsetHeight || 0) +
        this.vertical_border_padding;
    }

    dim = this.cell.height - this.vertical_delta;
    if( dim != this.height)
    {
      this.is_dirty = true;
      this.height = dim;
    }

    this.update(force_redraw)
    views[this.view_id] && views[this.view_id].onresize();
  }

  this.setup = function(view_id)
  {
    var view = views[this.view_id = view_id];
    views[this.view_id].addContainerId(this.type + '-to-' + this.cell.id);
    if(window.toolbars[this.view_id])
    {
      window.toolbars[this.view_id].addContainerId('window-toolbar-to-' + this.cell.id);
    }
    this.setDimensions();
    var container = document.getElementById(this.type + '-to-' + this.cell.id) || this.update(true);
    if( view )
    {
      container.className = view.container_class || '';
      container.setAttribute('data-menu', view_id || '');
      view.update();
    }
  }

  this.onclose = function()
  {
    views[this.view_id].removeContainerId(this.type + '-to-' + this.cell.id);
    if(window.toolbars[this.view_id])
    {
      window.toolbars[this.view_id].removeContainerId('window-toolbar-to-' + this.cell.id);
    }
  }

  this.init = function(cell)
  {
    this.cell = cell;
    this.parent_container_id = cell.id;
    this.initBase();
  }

}

/**
  * @constructor
  * @extends WindowContainerBase
  */

var WindowContainer = function(cell)
{
  this.init(cell);
}

WindowContainerBase.prototype = new ContainerBase();
WindowContainer.prototype = new WindowContainerBase();

