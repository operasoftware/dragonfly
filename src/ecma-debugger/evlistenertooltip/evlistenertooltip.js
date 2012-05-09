"use strict";

window.cls || (window.cls = {});

cls.EvListenerTooltip = function()
{


  var _tooltip = null;
  var _url_tooltip = null;




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
    _tooltip.hide();
  };

  var _ontooltip = function(event, target)
  {
    _hide_tooltip();
    var model = window.dominspections[target.get_ancestor_attr("data-model-id")];
    var rt_id = model && model.getDataRuntimeId();
    var node_id = target.get_ancestor_attr("ref-id") ||
                  target.get_ancestor_attr("obj-id");
    var window_id = target.get_ancestor_attr("data-window-id");
    if (model && rt_id && (node_id || window_id))
    {
      var listeners = node_id
                    ? model.get_ev_listeners(node_id)
                    : model.window_listeners.listeners;
      var tmpl = window.templates.ev_listeners(listeners, rt_id);
      _tooltip.show(tmpl);
    }
  };

  var _init = function(view)
  {
    _tooltip = Tooltips.register(cls.EvListenerTooltip.tooltip_name, true);
    _url_tooltip = Tooltips.register("url-tooltip", true);

    _tooltip.ontooltip = _ontooltip;
    _tooltip.onhide = _hide_tooltip;
    //_tooltip.ontooltipenter = _ontooltipenter;
    //_tooltip.ontooltipleave = _ontooltipleave;
    _tooltip.ontooltipclick = _ontooltipclick;
  };

  _init();
};

cls.EvListenerTooltip.tooltip_name = "event-listener";

cls.EvListenerTooltip.register = function()
{
  this._tooltip = new cls.EvListenerTooltip();
};
