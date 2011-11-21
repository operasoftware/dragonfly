window.cls || (window.cls = {});

cls.JSSourceTooltip = function(view)
{
  this._init(view);
};

cls.JSSourceTooltip.tooltip_name = "js-source";

cls.JSSourceTooltip.prototype = new function()
{

  const POLL_INTERVALL = 80;

  this._ontooltip = function(event, target)
  {

  };

  this._onhide = function()
  {

  };

  this._ontooltipenter = function()
  {
    
  };

  this._ontooltipleave = function()
  {
    
  };

  this._init = function(view)
  {
    this._view = view;
    this._tooltip = Tooltips.register(cls.JSSourceTooltip.tooltip_name, true);
    ["ontooltip",
     "onhide",
     "ontooltipenter",
     "ontooltipleave"].forEach(function(cb_name)
    {
      this._tooltip[cb_name] = this["_" + cb_name].bind(this); 
    }, this);
    this._poll_intervall = 0;
  };
};




