var ToolbarBase = function()
{
  this.type = 'toolbar';
  this.default_height = 0;
  this.height = 0;
  this.top_border = 0;
  this.bottom_border = 1;
  this.offsetHeight = 0;

  this.getCssText = function()
  {
    return 'left:' + this.left + 'px;' +
      'top:' + this.top + 'px;' +
      'height:' + this.height + 'px;' +
      'width:' + this.width + 'px;'+
      'display:' + ( this.height ? 'block' : 'none' );
  }

  this.attributes =
  {
    'focus-handler': 'focus',
    'blur-handler': 'blur'
  }



  this.setDimensions = function(force_redraw)
  {
    var dim = '', i = 0;

    // set css properties

    if(!this.default_height)
    {
      this.setCSSProperties()
    }

    dim = this.cell.top;
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

    dim = this.buttons.length || this.filters.length ? this.default_height : 0;
    if( dim != this.height)
    {
      this.is_dirty = true;
      this.height = dim;
      this.offsetHeight = dim + this.vertical_border_padding;
    }

    this.update(force_redraw)
     
  } 

  this.setup = function(view_id)
  {
    var toolbar = document.getElementById(this.type + '-to-' + this.cell.id) || this.update();
    toolbar.innerHTML ='';
    toolbar.render(templates.filters(this.filters = toolbars[view_id] && toolbars[view_id].filters || []));
    toolbar.render(templates.buttons(this.buttons = toolbars[view_id] && toolbars[view_id].buttons || []));
    toolbar.render(templates.toolbarSeparator());
    toolbar.render(templates.switches(this.switches = switches[view_id] && switches[view_id].keys || []));
    toolbar.render(templates.toolbarSeparator());
    toolbar.render(templates.buttons(this.specials = toolbars[view_id] && toolbars[view_id].specials || []));
  }

  this.init = function(cell, buttons, filters, specials)
  {
    this.cell = cell;
    this.buttons = buttons || [];
    this.filters = filters || [];
    this.specials = specials || [];
    this.width = 0;
    this.top = 0;
    this.left = 0;
    this.is_dirty = true;
    this.initBase();
  }

}

var Toolbar = function(cell, buttons, filters, specials)
{
  this.init(cell, buttons, filters, specials);
}

var TopToolbar = function(cell, buttons, filters, specials)
{
  this.type = 'top-toolbar';
  this.init(cell, buttons, filters, specials);
}

var WindowToolbar = function(cell, buttons, filters, specials)
{
  this.type = 'window-toolbar';
  this.parent_container_id = cell.id;
  this.init(cell, buttons, filters, specials);
  this.getCssText = function()
  {
    return '';
  }
}

ToolbarBase.prototype = UIBase;
Toolbar.prototype = new ToolbarBase();
TopToolbar.prototype = new ToolbarBase();
WindowToolbar.prototype = new ToolbarBase();



