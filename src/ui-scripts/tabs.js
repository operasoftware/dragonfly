var TabsBase = function()
{
  this.type = 'tabs';
  this.height = 25;
  this.width = 200;
  this.top = 0;
  this.left = 0;
  this.is_dirty = true;
  this.cell_id = '';
  

  this.depth = 2;
  
  this.tabs = [];
  this.activeTab = '';
    
  this.hasTab = function(ref_id)
  {
    var i = 0, tab = null;
    for( ; ( tab = this.tabs[i] ) && tab.ref_id != ref_id; i++);
    return tab && true || false;
  }

  this.addTab = function()
  {
    var i = 0, tab = null;
    var container = document.getElementById('tabs-to-' + this.cell.id);
    for( ; tab = arguments[i]; i++)
    {
      this.tabs[this.tabs.length] = tab;
      if( container)
      {
        container.render(templates.tab(tab));
      }
    }
  }

  this.removeTab = function(ref_id)
  {
    var i = 0, tab = null;
    for( ; ( tab = this.tabs[i] ) && tab.ref_id != ref_id; i++);
    if(tab)
    {
      this.tabs.splice(i, 1);
      var container = document.getElementById(this.type + '-to-' + this.cell.id)
      if( container)
      {
        var tab = container.getElementsByTagName('tab')[i];
        if(tab)
        {
          container.removeChild(tab);
        }
        else
        {
          opera.postError('tabs, removeTab. there should be a tab for that index');
        }
      }
    }
    if( this.tabs[i] )
    {
      this.setActiveTab(this.tabs[i].ref_id)
    }
    else if( this.tabs[i-1] )
    {
      this.setActiveTab(this.tabs[i-1].ref_id)
    }
    else
    {
      // remove cell
      alert('destroy cell');
    }
  }

  this.render = function()
  {
    var tabs = document.getElementById(this.type + '-to-' + this.cell.id);
    if( !tabs )
    {
      tabs = this.update();
    }
    tabs.innerHTML = '';
    tabs.render(templates[this.type](this));
    return tabs;
  }

  this.setActiveTab = function(view_id, force_create)
  {
    var container_id = 'container-to-' + this.cell.id;
    var toolbar_id = 'toolbar-to-' + this.cell.id;

    if( this.activeTab != view_id || force_create)
    {
      if( force_create)
      {
        view_id = this.activeTab;
      }
      else
      {
        if( this.activeTab && views[this.activeTab] )
        {
          messages.post("hide-view", {id: this.activeTab});
          views[this.activeTab].removeContainerId(container_id);
          if(toolbars[this.activeTab])
          {
            toolbars[this.activeTab].removeContainerId(toolbar_id);
          }
        }
        this.activeTab = view_id;
        
        if( views[view_id] )
        {
          views[view_id].addContainerId(container_id);
          if(toolbars[view_id])
          {
            toolbars[view_id].addContainerId(toolbar_id);
          }
        }
      }

      var container = document.getElementById(this.type + '-to-' + this.cell.id) || this.render();

      if(container)
      {
        var tabs = container.getElementsByTagName('tab'), tab = null, i = 0;
        if( tabs.length != this.tabs.length )
        {
          this.render();
          tabs = container.getElementsByTagName('tab')
        }
        for( ; tab = tabs[i]; i++)
        {
          if( tab.getAttribute('ref-id') == view_id )
          {
            tab.addClass('active');
          }
          else
          {
            tab.removeClass('active');
          }
        }

      }

      this.cell.setup();

    }
  }


  this.getTopPosition = function()
  {
    return this.cell.top + this.cell.height - this.offsetHeight;
  }

  this.setDimensions = function(force_redraw)
  {
    var dim = '', i = 0;

     // set css properties
    if(!this.default_height)
    {
      this.setCSSProperties();
    }

    dim = this.getTopPosition();

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

    this.update(force_redraw);
    
  }

  this.init = function(cell)
  {
    this.tabs = [];
    this.activeTab = '';
    this.cell = cell;
    this.initBase();
  }

}


var Tabs = function(cell)
{
  this.init(cell);
}

TabsBase.prototype = UIBase;
Tabs.prototype = new TabsBase();





