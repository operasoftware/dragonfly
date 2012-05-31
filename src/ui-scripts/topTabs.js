/**
  * @constructor 
  * @extends TabsBase
  */

var TopTabsBase = function()
{
  this.type = 'top-tabs';
  this.getTopPosition = function()
  {
    return this.cell.top + (this.cell.toolbar && this.cell.toolbar.height ? this.cell.toolbar.offsetHeight : 0);
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

    dim = document.querySelector("top-tabs tab").offsetHeight; // FIXME: this is abviously not final
    if( dim != this.height)
    {
      this.is_dirty = true;
      this.height = dim;
      this.offsetHeight = dim + this.vertical_border_padding;
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
      var legend = tab_ele.querySelector(".inline-block");
      if (legend)
      {
        if (!tab_ele.hasAttribute("data-orig-width"))
          tab_ele.setAttribute("data-orig-width", String(tab_ele.offsetWidth));

        if (!legend.hasAttribute("data-orig-width"))
          legend.setAttribute("data-orig-width", String(legend.offsetWidth));

        width += Number(tab_ele.getAttribute("data-orig-width"));
        tabs.push({legend: legend,
                   legend_orig_width: Number(legend.getAttribute("data-orig-width"))});
      }
    }
    var has_space = width <= this.width;
    var scale = 1;
    if (!has_space)
    {
      var delta = width - this.width;
      var orig_sum_labels = tabs.reduce(function(sum, tab)
      {
        return sum + tab.legend_orig_width;
      }, 0);
      scale = (orig_sum_labels - delta) / orig_sum_labels;
    }
    tabs.forEach(function(tab)
    {
      if (has_space)
        tab.legend.removeAttribute("style");
      else
        tab.legend.style.width = Math.floor(tab.legend_orig_width * scale) + "px";
    });  
  };

  this._onwindowcontrolscreated = function(msg)
  {
    var win_ctrs = msg.window_controls;
    var style = document.styleSheets.getDeclaration("top-tabs");
    if (style)
    { 
      var padding_right = win_ctrs.offsetWidth;
      style.paddingRight = padding_right + "px";
      TopTabs.prototype.style["padding-right"] = padding_right;
      this.setCSSProperties();
      this.setDimensions(true);
    }
  };

}

/**
  * @constructor 
  * @extends TopTabsBase
  */

var TopTabs = function(cell)
{
  this.init(this, arguments);
  this._history = [];
  this.tabs = [];
  this.activeTab = '';
  this.cell = cell;
  window.messages.add_listener("window-controls-created",
                               this._onwindowcontrolscreated.bind(this))
}

TopTabsBase.prototype = new TabsBase();
TopTabs.prototype = new TopTabsBase();
TopUIBase.apply(TopTabs.prototype);
TopTabs.prototype.constructor = TopTabs
