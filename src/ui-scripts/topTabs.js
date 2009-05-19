/**
  * @constructor 
  * @extends TabsBase
  */

var TopTabsBase = function()
{
  this.type = 'top-tabs';
  this.getTopPosition = function()
  {
    return this.cell.top + this.cell.toolbar && this.cell.toolbar.offsetHeight || 0;
  }
  this.switch_history = function(is_attached)
  {
    var cur = '', i = 0, map = composite_view_convert_table[is_attached.toString()];
    for( ; cur = this._history[i]; i++)
    {
      this._history[i] = map[cur] || cur;
    }
  }
}

/**
  * @constructor 
  * @extends TopTabsBase
  */

var TopTabs = function(cell)
{
  this.init(this, arguments);
  this.tabs = [];
  this.activeTab = '';
  this.cell = cell;
}

TopTabsBase.prototype = new TabsBase();
TopTabs.prototype = new TopTabsBase();
TopUIBase.apply(TopTabs.prototype);
TopTabs.prototype.constructor = TopTabs
