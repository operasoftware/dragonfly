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
      if (!this._tab_right_padding)
      {
        var value = window.getComputedStyle(tab_ele).paddingRight;
        TopTabs.prototype._tab_right_padding = parseInt(value);
      }
      var legend = tab_ele.querySelector(".inline-block");
      if (legend)
      {
        if (!tab_ele.hasAttribute("data-orig-width"))
          tab_ele.setAttribute("data-orig-width", String(tab_ele.offsetWidth));

        if (!legend.hasAttribute("data-orig-width"))
          legend.setAttribute("data-orig-width", String(legend.offsetWidth));

        width += Number(tab_ele.getAttribute("data-orig-width"));
        tabs.push({padding_target: tab_ele,
                   width_target: legend,
                   orig_width: Number(legend.getAttribute("data-orig-width")) - 1});
      }
    }

    tabs.sort(function(a, b)
    {
      if (a.orig_width > b.orig_width)
        return 1;

      if (a.orig_width < b.orig_width)
        return -1;

      return 0;
    });

    this._adjust_tab_size(width, tabs);
  };

  this._on_window_controls_created = function(msg)
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
                               this._on_window_controls_created.bind(this));
}

TopTabsBase.prototype = new TabsBase();
TopTabs.prototype = new TopTabsBase();
TopUIBase.apply(TopTabs.prototype);
TopTabs.prototype.constructor = TopTabs
