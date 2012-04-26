"use strict";

window.cls || (window.cls = {});

cls.EvListenerTooltip = function()
{


  var _tooltip = null;




  var _hide_tooltip = function()
  {
    _tooltip.hide();
  };

  var _ontooltipenter = function(event)
  {
    if (!_cur_ctx)
      return;
    
    switch (_cur_ctx.type.type)
    {
      case cls.PrettyPrinter.ELEMENT:
        if (settings.dom.get("highlight-on-hover"))
          hostspotlighter.spotlight(_cur_ctx.obj_id, true);
        break;
    }
  };

  var _ontooltipleave = function(event)
  {
    if (!_cur_ctx)
      return;

    switch (_cur_ctx.type.type)
    {
      case cls.PrettyPrinter.ELEMENT:
        if (settings.dom.get("highlight-on-hover"))
        {
          if (views.dom.isvisible() && dom_data.target)
            hostspotlighter.spotlight(dom_data.target, true);
          else
            hostspotlighter.clearSpotlight();
        }
        break;
    }
  };
  
  var _ontooltipclick = function(event)
  {
    if (!_cur_ctx)
      return;

    switch (_cur_ctx.type.type)
    {
      case cls.PrettyPrinter.ELEMENT:
        UI.get_instance().show_view("dom");
        dom_data.get_dom(_cur_ctx.rt_id, _cur_ctx.obj_id);
        _hide_tooltip();
        break;
    }
  };

  var _ontooltip = function(event, target)
  {

    _hide_tooltip();
    _tooltip.show(["span", "hello"]);


  };

  var _init = function(view)
  {
    _tooltip = Tooltips.register(cls.EvListenerTooltip.tooltip_name, true);

    _tooltip.ontooltip = _ontooltip;
    _tooltip.onhide = _hide_tooltip;
    //_tooltip.ontooltipenter = _ontooltipenter;
    //_tooltip.ontooltipleave = _ontooltipleave;
    //_tooltip.ontooltipclick = _ontooltipclick;
  };

  _init();
};

cls.EvListenerTooltip.tooltip_name = "event-listener";

cls.EvListenerTooltip.register = function()
{
  this._tooltip = new cls.EvListenerTooltip();
};
