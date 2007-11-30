var CompositeViewBase = function()
{
  this.type = 'composite-view';
  this.update = function(cell) // for testing
  {
    // copie from the container cell to the view cell

    var id = '', i = 0, virtual_container = null;

    for( ; id = this.container_ids[i]; i++)
    {
      if( virtual_container = ( CellBase.getCellById([id.slice(13)]) || {} ).container )
      {
        this.cell.left = cell.left + cell.left_border_padding;
        this.cell.top = cell.top + cell.top_border_padding;
        this.cell.width = cell.width;
        this.cell.height = cell.height;
        if(this.cell.width + this.cell.height) 
        {
          this.cell.setDefaultDimensions();
          this.cell.update(this.cell.left, this.cell.top, true);
        }
      }
    }
  }

  this.initCompositeView = function(id, name, layout_rough)
  {
    this.cell = new Cell(layout_rough, layout_rough.dir);
    this.init(id, name);
  }
}



var CompositeView = function(id, name, rough_layout)
{
  this.initCompositeView(id, name, rough_layout);
}

CompositeViewBase.prototype = ViewBase;
CompositeView.prototype = new CompositeViewBase();