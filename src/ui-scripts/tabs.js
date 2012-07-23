/**
  * @constructor
  * @extends UIBase
  */

var TabsBase = function()
{
  var HISTORY_MAX_LENGTH = 10;

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
    this.onresize();

  }

  this.onresize = function()
  {
    var tabbar = document.getElementById(this.type + '-to-' + this.cell.id);
    if (!tabbar || this.is_hidden)
      return;

    var tab_eles = tabbar.querySelectorAll("tab");
    var tabs = [];
    var width = 0;
    for (var i = 0, tab_ele; tab_ele = tab_eles[i]; i++)
    {
      if (!this._tab_right_padding)
        this._store_css_tab_values(tab_ele);

      if (!tab_ele.hasAttribute("data-orig-width"))
        tab_ele.setAttribute("data-orig-width", String(tab_ele.offsetWidth));

      var tab_width = Number(tab_ele.getAttribute("data-orig-width")) - 1;
      width += tab_width + this._tab_margin + 1;
      tabs.push({padding_target: tab_ele,
                 width_target: tab_ele,
                 orig_width: tab_width - this._tab_border_padding});
    }
    this._adjust_tab_size(width, tabs);
  };

  this._adjust_tab_size = function(width, tabs)
  {
    var has_space = width <= this.width;
    var scale = 1;
    var delta_padding = 0;
    var target_padding = this._tab_right_padding;
    var count = tabs.length;
    if (!has_space)
    {
      var delta = width - this.width;
      // reduce each target width by 1 pixel
      delta -= count;
      if (delta > 0)
      {
        delta_padding = Math.ceil(delta / count);
        if (delta_padding > this._tab_right_padding)
          delta_padding = this._tab_right_padding;

        target_padding = this._tab_right_padding - delta_padding;
        delta -= count * delta_padding;
      }
      else
      {
        var index = 0;
        while (delta < 0)
        {
          tabs[index++].orig_width += 1;
          delta++;
        }
      }
      if (delta > 0)
      {
        var orig_width_sum = tabs.reduce(function(sum, tab)
        {
          return sum + tab.orig_width;
        }, 0);
        scale = (orig_width_sum - delta) / orig_width_sum;
      }
    }

    tabs.forEach(function(tab)
    {
      if (has_space)
      {
        tab.padding_target.removeAttribute("style");
        tab.width_target.removeAttribute("style");
      }
      else
      {
        tab.padding_target.style.paddingRight = target_padding + "px";
        tab.width_target.style.width = Math.floor(tab.orig_width * scale) + "px";
      }
    }, this);
  };

  this._store_css_tab_values = function(tab_ele)
  {
    var style = window.getComputedStyle(tab_ele);
    [
      {
        prop: "_tab_right_padding",
        prop_list: ["paddingRight"]
      },
      {
        prop: "_tab_margin",
        prop_list: ["marginLeft", "marginRight"]
      },
      {
        prop: "_tab_border_padding",
        prop_list: ["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"]
      },
    ].forEach(function(item)
    {
      Tabs.prototype[item.prop] = this._sum_css_props(style, item.prop_list);
    }, this);
  };

  this._sum_css_props = function(style, prop_list)
  {
    return prop_list.reduce(function(sum, prop)
    {
      return sum + parseInt(style[prop]);
    }, 0);
  };

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





