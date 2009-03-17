
/**
  * @constructor 
  * @extends CellBase
  * a bit different from a normal cell, it holds the main view ui elements but also the main conatiner
  */

var TopCell = function(layout, setDimensions, onresize, TopToolbar, TopStatusbar)
{
  var self = this;
  var resize_timeout = new Timeouts();
  this.setStartDimesions = setDimensions || function()
  {
    this.top = 0;
    this.left = 0;
    this.width = innerWidth;
    this.height = innerHeight;
  };
  this.onresize = onresize || function()
  {
    this.setStartDimesions();
    this.update();
    this.setup();
  }
  this.cell_type = 'top';

  var delayed_resize = function()
  {
    self.onresize();
    messages.post('resize');
  }
  
  var setDelayedResize = function()
  {
    resize_timeout.set(delayed_resize, 32);
  }

  this.appendUiNodes = function()
  {
    this.container = new TopContainer(this); // actually just a cell
    this.tab = new TopTabs(this);
    this.toolbar = TopToolbar && new TopToolbar(this) || null;
    if(this.toolbar)
    {
      toolbars[this.id].setVisibility(!opera.attached);
    }
    this.statusbar = TopStatusbar && new TopStatusbar(this) || null;
  }

  this.update = function()
  {
    if( !this.children.length )
    {
      if( !this.tab.activeTab )
      {
        if(this.tab.tabs.length)
        {
          this.tab.setActiveTab( this.tab.tabs[0].ref_id );
        }
      }
      else
      {
        if(this.toolbar)
        {
        this.toolbar.setDimensions();
        }
        this.tab.setDimensions();
        if(this.statusbar)
        {
        this.statusbar.setDimensions();
        }
        this.container.setDimensions();
      }
    }
    else
    {

    }

  }

  this.showView = function(view_id)
  {
    if( views[view_id].isvisible() )
    {
      views[view_id].update();
    }
    else
    {
      var ret = this.getView(view_id), tab = null, i = 0;
      if( ret )
      {
        for( ; tab = ret[i]; i += 2 )
        {
          if( tab.activeTab != ret[i+1] )
          {
            tab.setActiveTab(ret[i+1]);
          }
        }
      }
    }
  }

  this.setTooolbarVisibility = function(view_id, bool)
  {
    var tab = '', view = null, i = 0;
    if(toolbars[view_id])
    {
      toolbars[view_id].setVisibility(bool);
    }
    for( i = 0 ; tab = this.tab.tabs[i]; i++ )
    {
      if( view = views[tab.ref_id] )
      {
        view.cell.setTooolbarVisibility(view_id, bool);
      }
    }
  }

  this.setup = function()
  {
    var view_id = this.tab && this.tab.activeTab;
    if( view_id )
    {
      this.container.setup(view_id);
    }
  }

  this.cleanUp = function()
  {
    document.removeEventListener('resize', setDelayedResize, false);
    resize_timeout.clear();
    resize_timeout = null;
  }

  this.addTemporaryTabs = function()
  {
    var 
    store = global_state.ui_framework.temporary_tabs,
    view_id = '', 
    i = 0;

    for( ; view_id = store[i]; i++)
    {
      if(views[view_id])
      {
        this.tab.addTab(new Tab(view_id, views[view_id].name, true));
      }
    }
  }

  document.addEventListener('resize', setDelayedResize, false);

  // constructor calls
  window.topCell = this;
  this.init(layout);
  this.setStartDimesions();
  if(this.toolbar)
  {
  this.toolbar.setup(this.id);
  }
  if(this.statusbar)
  {
  this.statusbar.setup(this.id);
  }
  this.addTemporaryTabs();
  this.tab.setActiveTab
  ( 
    global_state 
    && global_state.ui_framework.last_selected_top_tab
    && composite_view_convert_table[opera.attached.toString()][global_state.ui_framework.last_selected_top_tab]
    || this.tab.tabs[0].ref_id 
  );
  this.container.setup(this.id);
  this.update(this.left, this.top, true);
  this.setup();

}

TopCell.prototype = CellBase;