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

  this.appendUiNodes = function(tabbar)
  {
    this.container = new Container(this);
    this.tab = new Tabs(this, tabbar);
    this.toolbar = new Toolbar(this);
  }

  this.get_visible_tabs = function()
  {
    var ret = [];
    if (this.tab)
    {
      ret.extend(this.tab.tabs.map(function(tab){return tab.ref_id}));
      var view = window.views[this.tab.activeTab];
      if (view)
      {
        if (view.type == 'composite-view')
        {
          ret.extend(view.cell.get_visible_tabs());
        }
        else if (view.type == 'side-panel')
        {
          ret.extend(view.get_visible_tabs());
        }
      }
    }
    else
    {
      for (var i = 0, child; child = this.children[i]; i++)
      {
        ret.extend(child.get_visible_tabs())
      }
    }
    return ret;
  }



  this.getView = function(view_id)
  {
    var ret = null, tab = '', view = null, child = null, i = 0;
    if (this.tab)
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
          else if (view.type == 'side-panel')
          {
            if (view.has_view(view_id))
            {
              view.set_view_unfolded(view_id);
              return [this.tab, view.id];
            }
            if (tab.ref_id == view_id)
            {
              return [this.tab, view.id];
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

  // return a layout_box if the associated view id is view_id
  this.get_cell = function(view_id)
  {
    var ret = null, tab = '', view = null, child = null, i = 0;
    if (this.tab && (view = window.views[this.tab.activeTab]))
    {
      if (view.type == 'composite-view')
      {
        if (ret = view.cell.get_cell(view_id))
        {
          return ret;
        }
      }
      else if (view.type == 'side-panel')
      {
        // TODO
        // opera.postError('Getting a layout box is not supported for side panel views.');
        return null;
      }
      else
      {
        return view.id == view_id ? this : null;
      }
    }
    else
    {
      for (i = 0 ; child = this.children[i]; i++)
      {
        if (ret = child.get_cell(view_id))
        {
          return ret;
        }
      }
    }
    var windows = window.ui_windows;
    if (windows)
    {
      for (var win in windows)
      {
        if (windows[win].container && windows[win].container.view_id == view_id)
        {
          return windows[win];
        }
      }
    }
    return null;
  }

  this.add_searchbar = function(searchbar)
  {
    this.searchbar = searchbar;
    searchbar.cell = this;
    this.update(this.left, this.top, true, true);
    searchbar.post_message("searchbar-created");
  }

  this.remove_searchbar = function(searchbar)
  {
    this.searchbar = null;
    searchbar.cell = null;
    this.update(this.left, this.top, true, true);
  }

  this.setTooolbarVisibility = function(view_id, bool)
  {
    var child = null, i = 0;

    if( this.toolbar )
    {
      if ( this.toolbar.__view_id == view_id && this.toolbar.isvisible() )
      {
        this.toolbar.setVisibility(bool);
        this.toolbar.setup(view_id);
        this.update(this.left, this.top, true);
      }
    }
    else
    {
      for( ; child = this.children[i]; i++ )
      {
        child.setTooolbarVisibility(view_id, bool);
      }
    }
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

  this.enableTab = function(ref_id)
  {
    this.disableTab(ref_id, false);
  }

  this.init = function(rough_cell, dir, parent, container_id, services)
  {
    this.has_explicit_width = rough_cell.width !== undefined;
    this.has_explicit_height = rough_cell.height !== undefined;

    if (rough_cell.name)
    {
      var stored_width;
      var stored_height;

      if (this.has_explicit_width && (stored_width = window.settings.general.get('view-width-' + rough_cell.name)))
        rough_cell.width = stored_width;

      if (this.has_explicit_height && (stored_height = window.settings.general.get('view-height-' + rough_cell.name)))
        rough_cell.height = stored_height;
    }

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
    this.name = rough_cell.name;
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
        next = this.children[this.children.length] = new Cell( rough_child, dir, this, container_id, services);
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
      ["tabs", "tabbar"].forEach(function(prop)
      {
        var getter = rough_cell["get_" + prop];
        if (typeof getter == "function")
          rough_cell[prop] = getter(services);
      });

      this.appendUiNodes(rough_cell.tabbar);

      var tabs = null, tabbar = null;
      if (rough_cell.tabbar)
      {
        tabs = rough_cell.tabbar.tabs;
        tabbar = UI.get_instance().register_tabbar(rough_cell.tabbar.id,
                                                   rough_cell.tabbar.tabs);
      }
      else
      {
        tabs = rough_cell.tabs;
      }
      for (var tab, i = 0; tab = tabs[i]; i++)
      {
        var tab_class = Tab;
        if (typeof tab != "string")
        {
          tab_class = tab.tab_class;
          tab = tab.view;
        }
        this.tab.addTab(new tab_class(tab, views[tab] && views[tab].name || ''));
      }
      if (tabbar)
      {
        tabbar.register_ui_tabs(this.tab);
      }
    }
  }

  this.setup = function(view_id)
  {
    var view_id = this.tab && this.tab.activeTab;
    if (view_id)
    {
      this.toolbar.setup(view_id);
      var search = UI.get_instance().get_search(view_id);
      this.searchbar = search && search.get_searchbar() || null;
      if (this.searchbar)
      {
        this.searchbar.cell = this;
      }
      this.update(this.left, this.top, true);
      this.container.setup(view_id);
    }
  }

  // updating the frames for the views

  this.update = function(left, top, force_redraw, is_resize)
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
          delta += child.update(left, delta, force_redraw, is_resize);
        }
      }
      else
      {
        delta = left;
        for( ; child = children[i]; i++)
        {
          delta += child.update(delta, top, force_redraw, is_resize);
        }
      }
    }
    else
    {
      if(this.is_dirty)
      {
        this.left = left;
        this.top = top;

        if (!this.tab.activeTab)
        {
          this.tab.trySetAnActiveTab();
        }
        else if (!document.getElementById('toolbar-to-' + this.id)) // check if frame for view is created
        {
           // This will trigger this.setup(),
           // which will call update again, but now with a toolbar,
           // meaning executing the next block.
           // The view_id will be the current active view_id
           // this will also cause a show-view message for that view
           // in setActiveTab.
           this.tab.setActiveTab('', true);
        }
        else
        {
          this.tab.setDimensions(force_redraw);
          this.toolbar.setDimensions(force_redraw);
          if (this.searchbar)
          {
            this.searchbar.setDimensions(force_redraw);
          }
          this.container.setDimensions(force_redraw, is_resize);
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
          opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
            'missing container in cell.update');
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

    if (this.name)
    {
      if (this.has_explicit_width)
        window.settings.general.set('view-width-' + this.name, this.width);

      if (this.has_explicit_height)
        window.settings.general.set('view-height-' + this.name, this.height);
    }

    return ( this.dir == VER ? this.width : this.height ) +
          2 * defaults.view_border_width + defaults.slider_border_width;
  }

  // helper to get the totalised dimension

  this.get_total_children_dimension = function(dim, explicit_only)
  {
    var child = null, i = 0, sum = 0, length = this.children.length;
    for ( ; child = this.children[i]; i++)
    {
      if (i != length - 1)
      {
        sum += defaults.slider_border_width;
      }
      if (explicit_only && !child['has_explicit_' + dim])
      {
        continue;
      }
      sum += child[dim] + 2 * defaults.view_border_width;
    }
    return sum;
  }

  // set up the dimensions. recursive

  this.setDefaultDimensions = function()
  {
    var dim = this.dir == VER ? 'height' : 'width';
    var max = this[dim];
    var child = null, i = 0, sum = 0, length = this.children.length, temp = 0;
    var auto_dim_count = 0, average_dim = 0;
    if (length)
    {
      // check how many implicit (auto) dimensions were specified
      for (i = 0; child = this.children[i++]; )
      {
        if (!child['has_explicit_' + dim])
          auto_dim_count++;
      }

      if (auto_dim_count)
      {
        sum = this.get_total_children_dimension(dim, true);
        if (sum < max)
        {
          // calculate average that should be allocated for each auto dimension
          average_dim = ((max - sum - auto_dim_count * 2 * defaults.view_border_width) / auto_dim_count) >> 0;

          // allocate space
          for (i = 0; child = this.children[i++]; )
          {
            if (child['has_explicit_' + dim] && child[dim] < defaults['min_view_' + dim])
            {
              // if the dimension is below the minimum limit, set minimum value
              // and reduce the average to compensate for the distributed pixels
              average_dim -= (defaults['min_view_' + dim] - child[dim]) / auto_dim_count;
              child[dim] = defaults['min_view_' + dim];
            }
            else if (!child['has_explicit_' + dim])
              child[dim] = average_dim > defaults['min_view_' + dim] ? average_dim : defaults['min_view_' + dim];
          }
        }
      }

      while (--length)
      {
        sum = this.get_total_children_dimension(dim);
        temp = max - (sum - this.children[length][dim] - 2 * defaults.view_border_width);
        if (sum <= max || defaults['min_view_' + dim] < temp)
        {
          this.children[length][dim] = temp;
          length = this.children.length;
          break;
        }
        else
        {
          this.children[length][dim] = defaults['min_view_' + dim];
        }
      }

      // min_width is too big

      if (!length)
      {
        length = this.children.length;
        sum = max - (length - 1) * (2 * defaults.view_border_width) - (length - 1) * defaults.slider_border_width;
        var average_width = sum / length >> 0;
        for (i = 0 ; i < length - 1 ; i++)
        {
          this.children[i][dim] = average_width;
        }
        this.children[length - 1][dim] = sum - (length - 1) * average_width;
      }

      // inherit one dimension from the parent

      dim = this.dir == HOR ? 'height' : 'width';
      for (i = 0 ; child = this.children[i]; i++)
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

  // confirme the tested dimensions

  this.setCheckedDimensions = function()
  {
    if( this.checked_height )
    {
      this.height = this.checked_height;
      this.checked_height = 0;
      this.is_dirty = true;
    }
    if( this.checked_width )
    {
      this.width = this.checked_width;
      this.checked_width = 0;
      this.is_dirty = true;
    }
    var child = null, i = 0;
    for( ; ( child = this.children[i] ) ; i++)
    {
      child.setCheckedDimensions();
    }
  }

  // clear the tested dimensions

  this.clearCheckedDimensions = function()
  {
    this.checked_height = this.checked_width = 0;
    this.is_dirty = false;
    var child = null, i = 0;
    for( ; ( child = this.children[i] ) ; i++)
    {
      child.clearCheckedDimensions();
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
        /*
        if( cap = delta + consumed  )
        {
          this.checkDelta(dim, cap, 'next');
          this.parent.setCheckedDimensions();
          this.parent.update(this.parent.left, this.parent.top);
        }
        else
        {
          this.parent.clearCheckedDimensions();
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
        /*
        if( cap = delta + consumed )
        {
          this.next.checkDelta(dim, cap, 'next');
          this.parent.setCheckedDimensions();
          this.parent.update(this.parent.left, this.parent.top);
        }
        else
        {
          this.parent.clearCheckedDimensions();
        }
        */

      }

      if( cap = delta + consumed  )
      {
        cap_holder.checkDelta(dim, cap, 'next');
        this.parent.setCheckedDimensions();
        this.parent.update(this.parent.left, this.parent.top);
      }
      else
      {
        this.parent.clearCheckedDimensions();
      }

    }
  }
}

/**
  * @constructor
  * @extends ViewBase
  */

var Cell = function(rough_cell, dir, parent, container_id, services)
{
  this.init(rough_cell, dir, parent, container_id, services)
}

Cell.prototype = CellBase;

