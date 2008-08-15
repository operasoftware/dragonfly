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

  this.addRightPadding = function(delta)
  {
    var 
    sheets = document.styleSheets, 
    sheet = null, 
    i = 0, 
    rules = null, 
    rule = null,
    cur_val = 0;

    for( ; ( sheet = sheets[i] ) 
      && ( sheet.ownerNode && sheet.ownerNode.href || '').indexOf('ui.css') == -1; i++);
    if( sheet )
    {
      rules = sheet.cssRules;
      for( i = 0; ( rule = rules[i] ) 
        && !( rule.type == 1 && rule.selectorText == this.type ); i++);
      if( rule )
      {
        cur_val = parseInt(rule.style.getPropertyValue('padding-right'));
        if( cur_val || cur_val == 0 )
        {
          cur_val += delta;
          rule.style.paddingRight = cur_val + 'px';
          TopTabs.prototype.style['padding-right'] = cur_val;
          this.setCSSProperties();
          this.setDimensions();
          this.render();
        }
      }
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