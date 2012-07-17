
var TooltipContext = function()
{
  this._init()
};

TooltipContext.prototype = new function()
{
    /* constants */

  const DATA_TOOLTIP = "data-tooltip";
  const DATA_TOOLTIP_TEXT = "data-tooltip-text";
  const HIDE_DELAY = 120;
  const SHOW_DELAY = 110;
  const DISTANCE_X = 0;
  const DISTANCE_Y = -3;
  const MARGIN_Y = 15;
  const MARGIN_X = 30;

  this.set_hide_timeout = function()
  {
    this.clear_hide_timeout();
    this._hide_timeouts.push(setTimeout(this.hide_tooltip, HIDE_DELAY));
  };

  this.clear_hide_timeout = function()
  {
    while(this._hide_timeouts.length)
      clearTimeout(this._hide_timeouts.pop());
  };

  this.set_show_timeout = function()
  {
    this.clear_hide_timeout();
    if (!this._show_timeouts.length)
      this._show_timeouts.push(setTimeout(this.show_tooltip, SHOW_DELAY));
  };

  this.clear_show_timeout = function()
  {
    while(this._show_timeouts.length)
      clearTimeout(this._show_timeouts.pop());
  };

  this.show_tooltip = function(event, ele, name)
  {
    this.clear_show_timeout();
    if (this.last_event && this.last_handler_ele)
    {
      this.current_tooltip.ontooltip(this.last_event, this.last_handler_ele);
    }
  };

  this.hide_tooltip = function(keep_context)
  {
    this.clear_show_timeout();
    if (!keep_context && this.current_tooltip)
      this.current_tooltip.onhide();

    this._clear_last_handler_eles();
    this.tooltip_ele.innerHTML = "";
    this.tooltip_ele.removeAttribute("style");
    if (!keep_context)
    {
      this.current_tooltip = null;
      this.last_handler_ele = null;
      this.last_box = null;
    }
  };

  this.select_last_handler_ele = function()
  {
    if (this.current_tooltip && this.current_tooltip.set_selected)
    {
      this._clear_last_handler_eles();
      this._push_last_handler_ele();
      this.last_handler_ele.addClass(Tooltips.CSS_TOOLTIP_SELECTED);
    }
  };

  this.handle_mouse_enter = function(event)
  {
    if (!this._is_entered)
    {
      this._is_entered = true;
      if (this.current_tooltip && this.current_tooltip.ontooltipenter)
        this.current_tooltip.ontooltipenter(event);
    }
  };

  this.handle_mouse_leave = function(event)
  {
    if (this._is_entered)
    {
      this._is_entered = false;
      if (this.current_tooltip && this.current_tooltip.ontooltipleave)
        this.current_tooltip.ontooltipleave(event);
    }
  };

  this._clear_last_handler_eles = function()
  {
    while (this._last_handler_eles.length)
      this._last_handler_eles.pop().removeClass(Tooltips.CSS_TOOLTIP_SELECTED);
  };

  this._push_last_handler_ele = function()
  {
    if (this.last_handler_ele &&
        !this._last_handler_eles.contains(this.last_handler_ele))
      this._last_handler_eles.push(this.last_handler_ele);
  };

  this._ontooltipclick = function(event)
  {
    if (this.current_tooltip && this.current_tooltip.ontooltipclick)
      this.current_tooltip.ontooltipclick(event);
  };

  this._init = function()
  {
    this._hide_timeouts = [];
    this._show_timeouts = [];
    this._last_handler_eles = [];
    this.current_tooltip = null;
    this.last_handler_ele = null;
    this.last_box = null;
    this.last_event = null;
    this.accept_call = false;
    this.show_tooltip = this.show_tooltip.bind(this);
    this.hide_tooltip = this.hide_tooltip.bind(this);
    var tmpl = ["div", "class", "tooltip-container"];
    this.tooltip_ele = (document.body || document.documentElement).render(tmpl);
    this.tooltip_ele.addEventListener("click",
                                      this._ontooltipclick.bind(this),
                                      false);
  }

};

