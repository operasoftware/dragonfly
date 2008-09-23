/**
  * @constructor
  * @extends UIBase
  */

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
    dim = ( this.__is_visible  && ( 
            this.buttons.length 
            || this.filters.length
            || this.specials.length
            || this.customs.length ) ) ? this.default_height : 0;
    if( dim != this.height)
    {
      this.is_dirty = true;
      this.height = dim;
      this.offsetHeight = dim + this.vertical_border_padding;
    }

    this.update(force_redraw)
     
  } 

  this.update_sub_class = function()
  {
    var toolbar = document.getElementById(this.type + '-to-' + this.cell.id);
    if( toolbar )
    {
      var cst_select = toolbar.getElementsByTagName('cst-select')[0];
      if( cst_select )
      {
        var 
        width = this.width,
        filter = toolbar.getElementsByTagName('filter')[0],
        previousEle = cst_select.previousElementSibling;

        if( filter )
        {
          width -= filter.offsetWidth;
        }
        if( previousEle )
        {
          width -= ( previousEle.offsetLeft + previousEle.offsetWidth );
        }
        cst_select.style.width = ( width - defaults['cst-select-margin-border-padding'] ) + 'px';
      }
    }
  }

  this.setVisibility = function(bool)
  {
    this.__is_visible = bool;
  }

  this.setup = function(view_id)
  {
    var toolbar = document.getElementById(this.type + '-to-' + this.cell.id) || this.update();
    toolbar.innerHTML ='';
    this.filters = toolbars[view_id] && toolbars[view_id].filters || [];
    this.buttons = toolbars[view_id] && toolbars[view_id].buttons || [];
    this.switches = switches[view_id] && switches[view_id].keys || [];
    this.specials = toolbars[view_id] && toolbars[view_id].specials || [];
    this.customs = toolbars[view_id] && toolbars[view_id].customs || [];
    this.__view_id = view_id;

    var set_separator = this.buttons.length;

    if(this.__is_visible)
    {
      if(this.filters.length)
      {
        toolbar.render(templates.filters(this.filters));
      }
      if( this.buttons.length )
      {
        toolbar.render(templates.buttons(this.buttons));
      }
      if(this.switches.length)
      {
        if(set_separator)
        {
          toolbar.render(templates.toolbarSeparator());
        }
        else
        {
          set_separator = true;
        }
        toolbar.render(templates.switches(this.switches));
      }
      if(this.specials.length)
      {
        if(set_separator)
        {
          toolbar.render(templates.toolbarSeparator());
        }
        toolbar.render(templates.buttons(this.specials));
      } 
      if(this.customs.length)
      {
       
        var custom = null, i = 0;
        for( ; custom = this.customs[i]; i++)
        {
          toolbar.render(custom.template(views[view_id]));
        } 
      } 
    }
  }

  this.init = function(cell, buttons, filters, specials, customs)
  {
    this.cell = cell;
    this.buttons = buttons || [];
    this.filters = filters || [];
    this.specials = specials || [];
    this.customs = customs || [];
    this.width = 0;
    this.top = 0;
    this.left = 0;
    this.is_dirty = true;
    this.initBase();
  }

}

/**
  * @constructor
  * @extends ToolbarBase
  */

var Toolbar = function(cell, buttons, filters, specials, customs)
{
  this.init(cell, buttons, filters, specials, customs);
}

/**
  * @constructor
  * @extends ToolbarBase
  */

var TopToolbar = function(cell, buttons, filters, specials, customs)
{
  this.type = 'top-toolbar';
  this.init(cell, buttons, filters, specials, customs);
}

/**
  * @constructor
  * @extends ToolbarBase
  */

var WindowToolbar = function(cell, buttons, filters, specials, customs)
{
  this.type = 'window-toolbar';
  this.parent_container_id = cell.id;
  this.init(cell, buttons, filters, specials, customs);
  this.getCssText = function()
  {
    return '';
  }
}

ToolbarBase.prototype = UIBase;
Toolbar.prototype = new ToolbarBase();
TopToolbar.prototype = new ToolbarBase();
TopUIBase.apply(TopToolbar.prototype);
TopToolbar.prototype.constructor = TopToolbar;
WindowToolbar.prototype = new ToolbarBase();



