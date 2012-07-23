﻿
/**
  * @constructor
  * @extends CellBase
  * a bit different from a normal cell, it holds the main view ui elements but also the main conatiner
  */

var TopCell = function(layout, setDimensions, onresize, TopToolbar, services)
{
  var self = this;
  var resize_timeout = new Timeouts();
  this.setStartDimensions = setDimensions || function()
  {
    this.top = 0;
    this.left = 0;
    this.width = innerWidth;
    this.height = innerHeight;
  };
  this.onresize = onresize || function()
  {
    this.setStartDimensions();
    this.update();
    var view_id = this.tab && this.tab.activeTab;
    if( view_id )
    {
      window.views[view_id].update(this.container, true);
    }
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
    this.toolbar = null;
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
        this.container.setDimensions();
      }
    }
    else
    {

    }

  }



  this.showView = function(view_id)
  {
    if (this.tab.hasTab(view_id))
    {
      this.tab.setActiveTab(view_id);
    }
    // a temporary view perhaps doesn't exist anymore
    else if (views[view_id])
    {
      var view = views[view_id];
      if(view.requires_view && !this.tab.hasTab(view.requires_view))
      {
        global_state.ui_framework.temporary_tabs.push(view.requires_view);
        this.tab.addTab(new Tab(view.requires_view, views[view.requires_view].name, true))
      }
      if( view.isvisible() )
      {
        view.update();
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

    UIWindowBase.set_toolbar_visibility(view_id, bool);

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
    window.removeEventListener('resize', setDelayedResize, false);
    resize_timeout && resize_timeout.clear();
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

  window.addEventListener('resize', setDelayedResize, false);

  // constructor calls
  window.topCell = this;
  this.init(layout, null, null, null, services);
  this.setStartDimensions();
  if(this.toolbar)
  {
    this.toolbar.setup(this.id);
  }

  if (this.modebar)
  {
    this.modebar.setup(this.id);
  }

  var ui = UI.get_instance();
  ui.register_overlay("settings-overlay",
    [
      new SettingsGroup(ui_strings.S_SETTINGS_HEADER_GENERAL, "general"),
      new SettingsGroup(ui_strings.S_SETTINGS_HEADER_DOCUMENT, "document"),
      new SettingsGroup(ui_strings.S_SETTINGS_HEADER_SCRIPT, "script"),
      new SettingsGroup(ui_strings.S_SETTINGS_HEADER_CONSOLE, "console"),
      new SettingsGroup(ui_strings.S_SETTINGS_HEADER_KEYBOARD_SHORTCUTS, "keyboard-shortcuts"),
      new SettingsGroup(ui_strings.S_SETTINGS_HEADER_ABOUT, "about")
    ]
  );

  ui.register_overlay("remote-debug-overlay",
    [
      new SettingsGroup(ui_strings.S_SWITCH_REMOTE_DEBUG, "remote_debug")
    ]
  );

  this.addTemporaryTabs();
  this.tab.setActiveTab
  (
    global_state
    && global_state.ui_framework.last_selected_top_tab
    || this.tab.tabs[0].ref_id
  );
  this.container.setup(this.id);
  this.update(this.left, this.top, true);
  this.setup();

}

TopCell.prototype = CellBase;
