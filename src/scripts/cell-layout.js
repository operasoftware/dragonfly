var Layout = function(container_id, rough_layout)
{
  var self = this;
  var cell = {};

  var container = container_id;


  this.parse = function(layout_rough)
  {
    cell = new Cell(layout_rough, layout_rough.dir, null, container);
  }

  this.display = function()
  {
    cell.setDefaultDimensions();
    cell.update(0, 0);
  }

  this.update = function()
  {

  }
  
  var init = function()
  {
    if( rough_layout)
    {
      self.parse(rough_layout);
    }
  }

  init();
}



Layout.defaults =
{
  min_height: 100,
  min_width: 120,
  maxHeight: 1000,
  maxWidth: 1000,
  container_name: 'view',
  slider_name: 'view-slider',
  border_width: 5,
  view_border_width: 1
}



var Cell = function(rough_cell, dir, parent, container)
{
  this.init(rough_cell, dir, parent, container)
}


Cell.prototype = new function()
{
  const VER = 'v', HOR = 'h';

  var defaults = Layout.defaults;

  this.checkWidth = function(width)
  {

  }

  this.checkHeight = function(width)
  {

  }

  this.setWidth = function(width)
  {

  }

  this.setHeigth = function(width)
  {

  }

  this.update = function(left, top)
  {
    var children = this.children, child = null, i = 0;
    var delta = 0;
    if( children.length )
    {

      if( this.dir == VER )
      {
        delta = top;
        for( ; child = children[i]; i++)
        {
          delta += child.update(left, delta);
        }
      }
      else
      {
        delta = left;
        for( ; child = children[i]; i++)
        {
          delta += child.update(delta, top);
        }
      }
    }
    else
    {
      if( ! this.id )
      {
        opera.postError('cell has no id');
        return 0;
      }
      var ele = document.getElementById( this.id );
      if( !ele )
      {
        var container = document.getElementById( this.container );
        if( container )
        {
          ele = container.appendChild( document.createElement(Layout.defaults.container_name));
          ele.id = this.id;
        }
        else
        {
          opera.postError('missing container in cell.update');
        }
      }
      ele.style.cssText = 
        'left:' + left + 'px;' +
        'top:' + top + 'px;' +
        'width:' + this.width + 'px;' +
        'height:' + this.height + 'px;' +
        'border-width:' + defaults.view_border_width + 'px';
    }

    // create sliders
    if( this.next )
    {
      ele = document.getElementById( 'slider-for-' + this.id );
      if( !ele )
      {
        var container = document.getElementById( this.container );
        if( container )
        {
          ele = container.appendChild( document.createElement(Layout.defaults.slider_name));
          ele.id = 'slider-for-' + this.id;
        }
        else
        {
          opera.postError('missing container in cell.update');
        }
      }
      if( this.dir == HOR )
      {
        ele.className = 'horizontal';
        ele.style.cssText = 
          'left:' + left + 'px;' +
          'top:' + ( 2 * defaults.view_border_width + top + this.height ) + 'px;' +
          'width:' + ( 2 * defaults.view_border_width + this.width ) + 'px;' +
          'height:' + defaults.border_width + 'px;';
      }
      else
      {
        ele.className = 'vertical';
        ele.style.cssText = 
          'left:' + ( 2 * defaults.view_border_width + left + this.width ) + 'px;' +
          'top:' + top + 'px;' +
          'width:' + defaults.border_width + 'px;' +
          'height:' + ( 2 * defaults.view_border_width + this.height ) + 'px;';
      }
    }


    return ( this.dir == VER ? this.width : this.height ) + 
          2 * defaults.view_border_width + defaults.border_width;
  }

  this.checkChildren = function(dim)
  {
    var child = null, i = 0, sum = 0, length = this.children.length;
    for( ; child = this.children[i]; i++)
    {
      sum += child[dim] + 2 * defaults.view_border_width;
      if( i != length - 1 )
      {
        sum += defaults.border_width;
      }
    }
    return sum;
  }

  this.setDefaultDimensions = function()
  {
    var dim = this.dir == VER ? 'height' : 'width';
    var max = this[dim];
    var child = null, i = 0, sum = 0, length = this.children.length;
    var prov = 0;
    if( length )
    {
      while(length)
      {
        sum = this.checkChildren(dim);
        length--;
        prov = max - ( sum - this.children[length][dim] - 2 * defaults.view_border_width );
        if( sum < max || defaults['min_' + dim ] < prov )
        {
          this.children[length][dim] = prov;
          break;
        }
        else
        {
          this.children[length][dim] = defaults['min_' + dim ]; 
        }
      }

      if( length < 0 )
      {
        // TODO set average
      }

      dim = this.dir == HOR ? 'height' : 'width';
      for( i = 0 ; child = this.children[i]; i++)
      {
        child[dim] = this[dim];
      }

    }
    if( length )
    {
      for( i = 0; child = this.children[i]; i++)
      {
        child.setDefaultDimensions();
      }
    }
  }



  this.init = function(rough_cell, dir, parent, container)
  {
    this.width = 
      rough_cell.width && rough_cell.width > defaults.min_width ?
      rough_cell.width : defaults.min_width;
    this.height = 
      rough_cell.height && rough_cell.height > defaults.min_height ?
      rough_cell.height : defaults.min_height;
    this.id = rough_cell.id || '';


    this.type = '';
    this.children = [];
    this.previous = null;
    this.next = null;
    this.parent = null;
    this.dir = dir;
    this.parent = parent;
    this.container = container;


    dir = dir == HOR ? VER : HOR;

    var rough_children = rough_cell.children, rough_child = null, i = 0;
    var child = null, previous = null, next = null;

    if( rough_children )
    {
      for( ; rough_child = rough_children[i]; i++)
      {
        next = this.children[this.children.length] = new Cell( rough_child, dir, this, container);
        if( child )
        {
          child.previous = previous;
          child.next = next;
        }
        previous = child;
        child = next;
      }
    }
  }
}

