/**
  * @constructor
  * @extends UIBase
  */

var TabsBase = function()
{
  const
  HISTORY_MAX_LENGTH = 10;

  this.type = 'tabs';
  this.height = 25;
  this.width = 200;
  this.top = -1000; // Temporary, see also ui.css: tabs, toolbar { left: -1000px }
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

  this._get_tab = function(ref_id)
  {
    for( var i = 0, tab = null; (tab = this.tabs[i]) && tab.ref_id != ref_id; i++);
    return tab;
  }

  this.addTab = function()
  {

    var i = 0, tab = null;
    for( ; tab = arguments[i]; i++)
    {
      this.tabs[this.tabs.length] = tab;
      if(this.isvisible())
      {
        this.render();
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
      var container = document.getElementById(this.type + '-to-' + this.cell.id);
      if( container)
      {
        var tab = container.getElementsByTagName('tab')[i];
        if(tab)
        {
          container.removeChild(tab);
        }
        else
        {
          opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
            'tabs, removeTab. there should be a tab for that index');
        }
      }
    }

    if(this.activeTab == ref_id)
    {
      while(this._history[this._history.length - 1] == ref_id)
      {
        this._history.pop();
      }
      if(this._history[this._history.length - 1])
      {
        this.setActiveTab(this._history[this._history.length - 1])
      }
      else if( this.tabs[i] )
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
  }

  this.__defineGetter__("offsetHeight", function()
  {
    if (!this.default_height)
    {
      this.setCSSProperties();
    }
    return this.is_hidden ? 0 : this._offset_height;
  });

  this.__defineSetter__("offsetHeight", function(offset_height)
  {
    this._offset_height = offset_height;
  });

  this._super_update = this.update;

  this.update = function(force_redraw)
  {
    return this.is_hidden ? null : this._super_update(force_redraw);
  }

  this.render = function()
  {
    if (this.is_hidden)
    {
      return null;
    }
    var tabs = document.getElementById(this.type + '-to-' + this.cell.id);
    if( !tabs )
    {
      tabs = this.update();
    }
    tabs.innerHTML = '';
    tabs.setAttribute("handler", "change-on-scroll");
    if (this.tabbar_id)
    {
      tabs.setAttribute("tabbar-ref-id", this.tabbar_id);
    }
    tabs.render(templates[this.type](this));
    return tabs;
  }

  this.setActiveTab = function(view_id, force_create, event)
  {
    var is_user_selected = Boolean(event && view_id);
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
          if (toolbars[this.activeTab])
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

      messages.post("before-show-view", {id: view_id});

      this.cell.setup();

      this._history[this._history.length] = this.activeTab;
      if( this._history.length > HISTORY_MAX_LENGTH )
      {
        this._history.splice(0, this._history.length - HISTORY_MAX_LENGTH);
      }

      messages.post("show-view", {id: view_id});
      UI.get_instance().store_last_selected_view(this.activeTab);
      if(views[view_id].type == 'composite-view' )
      {
        global_state.ui_framework.last_selected_top_tab = view_id;
        global_state.ui_framework.last_selected_tab = '';
      }
      else
      {
        global_state.ui_framework.last_selected_tab = view_id;
      }
      if (is_user_selected)
      {
        var target_focus_view = "";
        if (window.views[view_id].type == 'composite-view')
        {
          var visible_tabs = window.views[view_id].cell.get_visible_tabs();
          if (visible_tabs && visible_tabs.length == 1)
          {
            target_focus_view = visible_tabs[0];
          }
        }
        else if (window.views[view_id].type == 'single-view')
        {
          target_focus_view = view_id;
        }

        if (target_focus_view)
        {
          setTimeout(function() {
            ActionBroker.get_instance().focus_handler(target_focus_view, event);
          }, 0);
        }
      }
    }
  }

  this.navigate_to_next_or_previous_tab = function(backwards)
  {
    var step = backwards ? -1 : 1;
    for (var i = 0, tab, activate; tab = this.tabs[i]; i++)
    {
      if (tab.ref_id == this.activeTab)
      {
          activate = i + step;
          if (activate >= this.tabs.length || activate < 0)
          {
            activate = backwards ? this.tabs.length-1 : 0;
          }
          break;
      }
    }
    this.setActiveTab(this.tabs[activate].ref_id);
  };

  this.trySetAnActiveTab = function()
  {
    var tab = null, i = 0;
    for( ; ( tab = this.tabs[i] ) && tab.disabled; i++);
    if(tab)
    {
      this.setActiveTab(tab.ref_id);
    }
  }


  this.getTopPosition = function()
  {
    return this.cell.top;
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

  this.on_view_inizialized = function(msg)
  {
    if(this.hasTab(msg.view_id))
    {
      this._get_tab(msg.view_id).name = window.views[msg.view_id].name;
      if(this.isvisible())
      {
        this.render();
      }
    }
  }

  this.on_view_inizialized_bound = function()
  {
    var self = this;
    return function(msg)
    {
      self.on_view_inizialized(msg);
    };
  }

  this.init = function(cell, tabbar)
  {
    this.tabs = [];
    this.activeTab = '';
    this.cell = cell;
    this.initBase();
    this.is_hidden = tabbar && tabbar.is_hidden || false;
    this.tabbar_id = tabbar && tabbar.id || '';
    window.messages.addListener('view-initialized', this.on_view_inizialized_bound());
  }

}

/**
  * @constructor
  * @extends TabsBase
  */


var Tabs = function(cell, tabbar)
{
  this._history = [];
  this.init(cell, tabbar);
}

TabsBase.prototype = UIBase;
Tabs.prototype = new TabsBase();





