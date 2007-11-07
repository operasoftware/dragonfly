



var Cell = function(rough_cell, dir, parent, container)
{
  this.init(rough_cell, dir, parent, container)
}


Cell.prototype = new function()
{
  const VER = 'v', HOR = 'h';

  var defaults = Layout.defaults;

  var id_count = 1;

  var __counter = 0;

  var getId = function()
  {
    return 'invisible-' + ( id_count++ );
  }

  // constructor call

  this.init = function(rough_cell, dir, parent, container)
  {
    this.width = 
      rough_cell.width && rough_cell.width > defaults.min_width ?
      rough_cell.width : defaults.min_width;
    this.height = 
      rough_cell.height && rough_cell.height > defaults.min_height ?
      rough_cell.height : defaults.min_height;
    this.id = rough_cell.id || getId();

    this.checked_height = 0;
    this.checked_width = 0;

    this.type = '';
    this.children = [];
    this.previous = null;
    this.next = null;
    this.parent = null;
    this.dir = dir;
    this.parent = parent;
    this.container = container;
    this.is_dirty = true;

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

  // updating the view

  this.update = function(left, top, force_redraw)
  {
    var children = this.children, child = null, i = 0;
    var delta = 0;
    if( force_redraw )
    {
      this.is_dirty = true;
    }
    var is_dirty = this.is_dirty;
    if( children.length )
    {
      this.left = left;
      this.top = top;
      if( this.dir == VER )
      {
        delta = top;
        for( ; child = children[i]; i++)
        {
          delta += child.update(left, delta, force_redraw);
        }
      }
      else
      {
        delta = left;
        for( ; child = children[i]; i++)
        {
          delta += child.update(delta, top, force_redraw);
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
      if(this.is_dirty)
      {
        //opera.postError(( __counter++) +' '+this.id);
        ele.style.cssText = 
        'left:' + ( this.left = left ) + 'px;' +
        'top:' + ( this.top = top ) + 'px;' +
        'width:' + this.width + 'px;' +
        'height:' + this.height + 'px;' +
        'border-width:' + defaults.view_border_width + 'px';
        this.is_dirty = false;
      }
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
          ele.className = this.dir == HOR ? 'horizontal' : 'vertical';
        }
        else
        {
          opera.postError('missing container in cell.update');
        }
      }
      if( is_dirty )
      {
        
        if( this.dir == HOR )
        {
          ele.style.cssText = 
            'left:' + left + 'px;' +
            'top:' + ( 2 * defaults.view_border_width + top + this.height ) + 'px;' +
            'width:' + ( 2 * defaults.view_border_width + this.width ) + 'px;' +
            'height:' + defaults.border_width + 'px;';
        }
        else
        {
          ele.style.cssText = 
            'left:' + ( 2 * defaults.view_border_width + left + this.width ) + 'px;' +
            'top:' + top + 'px;' +
            'width:' + defaults.border_width + 'px;' +
            'height:' + ( 2 * defaults.view_border_width + this.height ) + 'px;';
        }
      }
    }

    return ( this.dir == VER ? this.width : this.height ) + 
          2 * defaults.view_border_width + defaults.border_width;
  }
  // helper to get the totalised dimesion
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

  // set up the dimensions. recursive

  this.setDefaultDimensions = function()
  {
    var dim = this.dir == VER ? 'height' : 'width';
    var max = this[dim];
    var child = null, i = 0, sum = 0, length = this.children.length, prov = 0;
    if( length )
    {
      while( length )
      {
        sum = this.checkChildren(dim);
        length--;
        prov = max - ( sum - this.children[length][dim] - 2 * defaults.view_border_width );
        if( sum < max || defaults['min_' + dim ] < prov )
        {
          this.children[length][dim] = prov;
          length = this.children.length;
          break;
        }
        else
        {
          this.children[length][dim] = defaults['min_' + dim ]; 
        }
      }

      // min_width is to big 

      if( !length )
      {
        length = this.children.length;
        sum = max - ( length - 1 ) * ( 2 * defaults.view_border_width ) - ( length - 1 ) * defaults.border_width;
        var average_width = sum / length >> 0;
        for( i = 0 ; i < length - 1 ; i++)
        {
          this.children[i][dim] = average_width;
        }
        this.children[length - 1][dim] = sum - ( length - 1 ) * average_width;       
      }

      // inherit one dimesion from the parent

      dim = this.dir == HOR ? 'height' : 'width';
      for( i = 0 ; child = this.children[i]; i++)
      {
        child[dim] = this[dim];
        child.setDefaultDimensions();
      }
    }
  }

  
  this.getCellById = function(id)
  {
    var child = null, i = 0, ret = null;
    if( this.id == id )
    {
      return this;
    }
    for( ; child = this.children[i]; i++)
    {
      if( ret = child.getCellById(id) )
      {
        return ret;
      }
    }
    return null;
  }

  // confirme the tested dimesions

  this.setCheckedDimesions = function()
  {
    if( this.checked_height )
    {
      this.height = this.checked_height;
      this.is_dirty = true;
    }
    if( this.checked_width )
    {
      this.width = this.checked_width;
      this.is_dirty = true;
    }
    var child = null, i = 0;
    for( ; ( child = this.children[i] ) ; i++)
    {
      child.setCheckedDimesions();
    }
  }

  // clear the tested dimensions

  this.clearCheckedDimesions = function()
  {
    this.checked_height = this.checked_width = 0;
    this.is_dirty = false;
    var child = null, i = 0;
    for( ; ( child = this.children[i] ) ; i++)
    {
      child.clearCheckedDimesions();
    }
  }

  // to check the change from a dimension. returns the possible change. recursive with children cells.

  this.checkDelta = function(dim, delta, sibling)
  {
    var delta_applied = 0;
    var child = null, i = 0;
    var deltas = [];
    if( this.children.length )
    {
      if( ( dim == 'height' && this.dir == HOR ) || ( dim == 'width' && this.dir == VER ) )
      {
        if(delta)
        {
          for( ; child = this.children[i]; i++)
          {
            deltas[deltas.length] = child.checkDelta(dim, delta, sibling);
          }
          var min = Math.min.apply(null, deltas);
          var max = Math.max.apply(null, deltas);
          delta_applied = delta > 0 ? max : min;
          if( max != min )
          {
            for( i = 0; child = this.children[i]; i++)
            {
              child.checkDelta(dim, delta - delta_applied, sibling)
            }
          }
          this['checked_' + dim] = this[dim] + ( delta - delta_applied );
        }
        else // clear
        {
          for( i=0; child = this.children[i]; i++)
          {
            child.checkDelta(dim, 0, sibling);
          }
          delta_applied = this['checked_' + dim] = 0;
        }
      }
      else
      {
        delta_applied = delta;
        for( i = 0; child = this.children[i]; i++) // if delta_applied is zero clear the rest
        {
          delta_applied = child.checkDelta(dim, delta_applied, sibling);
        }
        this['checked_' + dim] = this[dim] + ( delta - delta_applied );
      }
    }
    else
    {
      if( delta)
      {
        var newDim = this[dim] + delta;
        if( newDim >= defaults['min_' + dim] )
        {
          this['checked_' + dim] = newDim;
        }
        else
        {
          this['checked_' + dim] = defaults['min_' + dim]
        }
        delta_applied = delta - ( this['checked_' + dim] - this[dim] ); 
      }
      else // clear
      {
        delta_applied = this['checked_' + dim] = 0;
      }
    }
    return delta_applied;
  }
  /*
  this.getCapTarget = function(dim, target)
  {
    if( !this.children.length ) return 0;
    var child = null, i = 0, length = this.children.length - 1, 
      sum = length * 2 * defaults.view_border_width + ( length ) * defaults.border_width;
    
    for( ; ( child = this.children[i] ) ; i++)
    {
      if( child != target )
      {
        sum += child['checked_' + dim] || child[dim];
      }
    }
    return this[dim] - sum;
  }
  */
  this.handleResizeEvent = function(event, _delta)
  {
    var dim = this.dir == HOR ? 'height' : 'width';
    var pos = this.dir == HOR ? 'top' : 'left';
    var delta = Math.round( event[this.dir == HOR ? 'pageY' : 'pageX'] - _delta - ( this[pos] + this[dim] ) );
    var sibling = this;
    var cap = 0;
    var cap_holder = null;
    var consumed = -delta;
    if(delta)
    {
      if( delta > 0 )
      {
        do
        {
          sibling = sibling.next;
          if( sibling )
          {
            consumed = sibling.checkDelta(dim, consumed, 'next');
          }
        }
        while (sibling && consumed);
        cap_holder = this;
        
        //cap = this.parent.getCapTarget(dim, this) - this[dim];
        //opera.postError('+: '+cap+' '+consumed+' '+delta +' '+(delta + consumed))
        /*
        if( cap = delta + consumed  )
        {
          this.checkDelta(dim, cap, 'next');
          this.parent.setCheckedDimesions();
          this.parent.update(this.parent.left, this.parent.top);
        }
        else
        {
          this.parent.clearCheckedDimesions();
        }
        */
      }
      else
      {
        while (sibling && delta)
        {
          delta = sibling.checkDelta(dim, delta, 'next');
          sibling = sibling.previous;
        }
        cap_holder = this.next;
        //cap = this.parent.getCapTarget(dim, this.next) - this.next[dim];
        //opera.postError('-: '+cap+' '+consumed+' '+delta +' '+(delta + consumed))
        /*
        if( cap = delta + consumed )
        {
          this.next.checkDelta(dim, cap, 'next');
          this.parent.setCheckedDimesions();
          this.parent.update(this.parent.left, this.parent.top);
        }
        else
        {
          this.parent.clearCheckedDimesions();
        }
        */
      }
      if( cap = delta + consumed  )
      {
        cap_holder.checkDelta(dim, cap, 'next');
        this.parent.setCheckedDimesions();
        this.parent.update(this.parent.left, this.parent.top);
      }
      else
      {
        this.parent.clearCheckedDimesions();
      }
    }
  }
}

