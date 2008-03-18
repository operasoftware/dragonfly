// a bit different from a normal cell, it holds the main view ui elements but also the main conatiner

var TopCell = function(layout, setDimensions, onresize)
{
  var self = this;
  this.setStartDimesions = setDimensions;
  this.onresize = onresize;

  this.appendUiNodes = function()
  {
    this.container = new TopContainer(this); // actually just a cell
    this.tab = new TopTabs(this);
    this.toolbar = new TopToolbar(this);
    this.statusbar = new TopStatusbar(this);
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
        this.toolbar.setDimensions();
        this.tab.setDimensions();
        this.statusbar.setDimensions();
        this.container.setDimensions();
      }
    }
    else
    {

    }

  }

  this.showView = function(view_id)
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

  this.setup = function()
  {
    var view_id = this.tab && this.tab.activeTab;

    if( view_id )
    {
      this.container.setup(view_id);
    }
  }

  document.addEventListener('resize', function(event){self.onresize()}, false);

  this.init(layout);
  this.setStartDimesions();
  this.toolbar.setup(this.id);
  this.statusbar.setup(this.id);
  this.tab.setActiveTab( this.tab.tabs[0].ref_id );
  this.container.setup(this.id);
  this.update(this.left, this.top, true);
  this.setup();

}

TopCell.prototype = CellBase;