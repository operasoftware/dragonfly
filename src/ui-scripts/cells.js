CellBase = new function()
{
  const VER = 'v', HOR = 'h';

  var self = this;

  var ids = {};

  var id_count = 1;

  var __counter = 0;

  var getId = function()
  {
    return 'cell-id-' + ( id_count++ );
  }

  // constructor call

  this.appendUiNodes = function()
  {
    this.container = new Container(this);
    this.tab = new Tabs(this);
    this.toolbar = new Toolbar(this);
  }



  this.getView = function(view_id)
  {
    var ret = null, tab = '', view = null, child = null, i = 0;
    if( this.tab )
    {
      for( i = 0 ; tab = this.tab.tabs[i]; i++ )
      {
        if( view = views[tab.ref_id] )
        {
          if( view.type == 'composite-view' )
          {
            if( ret = view.cell.getView(view_id) )
            {
              return [ this.tab, tab.ref_id].concat(ret);
            }
          }
          else if( tab.ref_id == view_id )
          {
            return [this.tab, view_id];
          }
        }
      }
    }
    else
    {
      for( i = 0 ; child = this.children[i]; i++ )
      {
        if( ret = child.getView(view_id) )
        {
          return ret;
        }
      }
    }
    return null;
  }

  this.disableTab = function(ref_id , bool)
  {
    var tab = null, view = null, child = null, i = 0;
    if( this.tab )
    {
      for( i = 0 ; tab = this.tab.tabs[i]; i++ )
      {
        if( ( view = views[tab.ref_id] )  && view.type == 'composite-view' )
        {
          view.cell.disableTab(ref_id , bool);
        }
        else if( tab.ref_id == ref_id )
        {
          tab.disabled = bool;
          if(this.tab.isvisible())
          {
            this.tab.render();
            if( this.tab.activeTab == ref_id )
            {
              this.tab.trySetAnActiveTab();
            }
          }
        }
      }
    }
    else
    {
      for( i = 0 ; child = this.children[i]; i++ )
      {
        child.disableTab(ref_id , bool);
      }
    }
  }

  this.init = function(rough_cell, dir, parent, container_id)
  {
    this.width = 
      rough_cell.width && rough_cell.width > defaults.min_view_width ?
      rough_cell.width : defaults.min_view_width;
    this.height = 
      rough_cell.height && rough_cell.height > defaults.min_view_height ?
      rough_cell.height : defaults.min_view_height;
    ids[ this.id = rough_cell.id || getId()] = this;

    this.checked_height = 0;
    this.checked_width = 0;

    this.type = '';
    this.children = [];
    this.previous = null;
    this.next = null;
    this.parent = null;
    this.dir = dir;
    this.parent = parent;
    this.container_id = container_id; // think about this
    this.is_dirty = true;

    dir = dir == HOR ? VER : HOR;

    var rough_children = rough_cell.children, rough_child = null, i = 0;
    var child = null, previous = null, next = null;

    

    if( rough_children )
    {
      for( ; rough_child = rough_children[i]; i++)
      {
        next = this.children[this.children.length] = new Cell( rough_child, dir, this, container_id);
        if( child )
        {
          child.previous = previous;
          child.next = next;
        }
        previous = child;
        child = next;
        // is previoue set for the last?
      }
    }
    else  
    {

      this.appendUiNodes();

      var tabs = rough_cell.tabs, tab = '', i = 0;
      for( ; tab = tabs[i]; i++)
      {
        if( views[tab] )
        {
          this.tab.addTab(new Tab(tab, views[tab].name));
        }
      }
    }
  }

  this.setup = function(view_id)
  {
    var view_id = this.tab && this.tab.activeTab;
    if( view_id )
    {
      this.toolbar.setup(view_id);
      this.update(this.left, this.top, true);
      this.container.setup(view_id);
    }
  }

  // updating the frames for the views

  this.update = function(left, top, force_redraw)
  {
    var children = this.children, child = null, i = 0;
    var delta = 0;
    var css_text = '';
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
      if(this.is_dirty)
      {
        this.left = left;
        this.top = top;

        if( !this.tab.activeTab )
        {
          this.tab.trySetAnActiveTab();
        }
        else if( !document.getElementById('toolbar-to-' + this.id)) // check if frame for view is created
        {
           this.tab.setActiveTab( '', true );
        }
        else
        {
          this.toolbar.setDimensions(force_redraw);
          this.tab.setDimensions(force_redraw);
          this.container.setDimensions(force_redraw);
        }

        this.is_dirty = false;
      }
    }
    

    // create sliders

    if( this.next )
    {
      var ele = document.getElementById( 'slider-for-' + this.id );
      if( !ele )
      {
        var container = document.getElementById( this.container_id ) || window.viewport; // set name in defualts
        
        if( container )
        {
          ele = container.appendChild( document.createElement(defaults.slider_name));
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
          css_text = 
            'left:' + left + 'px;' +
            'top:' + ( 2 * defaults.view_border_width + top + this.height ) + 'px;' +
            'width:' + ( 2 * defaults.view_border_width + this.width ) + 'px;' +
            'height:' + defaults.slider_border_width + 'px;';
        }
        else
        {
          css_text = 
            'left:' + ( 2 * defaults.view_border_width + left + this.width ) + 'px;' +
            'top:' + top + 'px;' +
            'width:' + defaults.slider_border_width + 'px;' +
            'height:' + ( 2 * defaults.view_border_width + this.height ) + 'px;';
        }
        if( ele.style.cssText != css_text )
        {
          ele.style.cssText = css_text;
        }
      }
    }

    return ( this.dir == VER ? this.width : this.height ) + 
          2 * defaults.view_border_width + defaults.slider_border_width;
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
        sum += defaults.slider_border_width;
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
        if( sum < max || defaults['min_view_' + dim ] < prov )
        {
          this.children[length][dim] = prov;
          length = this.children.length;
          break;
        }
        else
        {
          this.children[length][dim] = defaults['min_view_' + dim ]; 
        }
      }

      // min_width is to big 

      if( !length )
      {
        length = this.children.length;
        sum = max - ( length - 1 ) * ( 2 * defaults.view_border_width ) - ( length - 1 ) * defaults.slider_border_width;
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
    return ids[id];
  }

  this._delete = function(id)
  {
    delete ids[id];
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
        if( newDim >= defaults['min_view_' + dim] || newDim >= this[dim] )
        {
          this['checked_' + dim] = newDim;
        }
        else
        {
          this['checked_' + dim] = defaults['min_view_' + dim]
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
  
  this.getCapTarget = function(dim, target)
  {
    if( !this.children.length ) return 0;
    var child = null, i = 0, length = this.children.length - 1, 
      sum = length * 2 * defaults.view_border_width + ( length ) * defaults.slider_border_width;
    
    for( ; ( child = this.children[i] ) ; i++)
    {
      if( child != target )
      {
        sum += child['checked_' + dim] || child[dim];
      }
    }
    return this[dim] - sum;
  }

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
        //opera.postError('bigger');
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

/**
  * @constructor 
  * @extends ViewBase
  */

var Cell = function(rough_cell, dir, parent, container_id)
{
  this.init(rough_cell, dir, parent, container_id)
}

Cell.prototype = CellBase;

