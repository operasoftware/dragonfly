/**
  * @constructor 
  * @extends TabsBase
  */

var TopTabsBase = function()
{
  this.type = 'top-tabs';
  this.getTopPosition = function()
  {
    return this.cell.top + this.cell.toolbar.offsetHeight;
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
