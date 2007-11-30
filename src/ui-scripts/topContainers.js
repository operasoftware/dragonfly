var TopContainerBase = function()
{
  this.type = 'top-container';
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
      this.setCSSProperties()
    }

    var toolbar_and_tabs_height =  this.cell.toolbar.offsetHeight + this.cell.tab.offsetHeight;


    dim = this.cell.top + toolbar_and_tabs_height;
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

    dim = this.cell.height - toolbar_and_tabs_height - this.cell.statusbar.offsetHeight - this.vertical_border_padding;;
    if( dim != this.height)
    {
      this.is_dirty = true;
      this.height = dim;
    }

    this.update(force_redraw);  // this element has a cell, only the dimensions are important

    views[this.view_id] && views[this.view_id].onresize();

  }

  this.setup = function(view_id)
  {

    if(window[defaults.viewport]) 
    {
      var children = viewport.childNodes, child = null, i = children.length - 1;
      var id = this.cell.id;
      for( ; child = children[i]; i--)
      {
        if( child.nodeType == 1 && child.id.indexOf(id) == -1 )
        {
          viewport.removeChild(child);
        }
      }
    }
    var view = views[this.view_id = view_id];

    if( view )
    {
      view.update(this);
    }


    var 
    _views = ViewBase.getSingleViews(),
    view = '',
    i = 0;
    for( ; id = _views[i]; i++)
    {
      if(views[id].isvisible())
      {
        messages.post("show-view", {id: id});
      }
    }

  }

  this.init = function(cell)
  {
    this.cell = cell;
    this.initBase();
  }

}

var TopContainer = function(cell)
{
  this.init(cell);
}

TopContainerBase.prototype = UIBase;
TopContainer.prototype = new TopContainerBase();

