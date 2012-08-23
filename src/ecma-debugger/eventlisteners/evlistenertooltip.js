"use strict";

window.cls || (window.cls = {});

cls.EventListenerTooltip = function()
{
  var _tooltip = null;
  var _url_tooltip = null;

  var _hide_tooltip = function()
  {
    _tooltip.hide();
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
    if (rt_id && (node_id || window_id))
    {
      var listeners = node_id
                    ? model.get_ev_listeners(node_id)
                    : model.window_listeners.listeners;
      var tmpl = window.templates.ev_listeners_tooltip(model,
                                                       rt_id,
                                                       node_id,
                                                       listeners,
                                                       "ev-listener-tooltip");
      _tooltip.show(tmpl);
    }
  };

  var _handle_function_source = function(event, target)
  {
    var inspection_tooltip = cls.JSInspectionTooltip.get_tooltip();
    if (inspection_tooltip)
      inspection_tooltip.handle_function_source(event, target);
  };

  var _reload_script_dialog = function(event, target)
  {
    new ConfirmDialog(ui_strings.D_RELOAD_SCRIPTS,
                      function(){ window.runtimes.reloadWindow(); }).show();
  };

  var _init = function(view)
  {
    _tooltip = Tooltips.register(cls.EventListenerTooltip.tooltip_name, true);
    _url_tooltip = Tooltips.register("url-tooltip", true);
    _tooltip.ontooltip = _ontooltip;
    _tooltip.onhide = _hide_tooltip;
    _tooltip.ontooltipclick = _ontooltipclick;
    window.event_handlers.click["ev-function-source"] = _handle_function_source;
    window.event_handlers.click["reload-script-dialog"] = _reload_script_dialog;
  };

  _init();
};

cls.EventListenerTooltip.tooltip_name = "event-listener";

cls.EventListenerTooltip.register = function()
{
  this._tooltip = new cls.EventListenerTooltip();
};
