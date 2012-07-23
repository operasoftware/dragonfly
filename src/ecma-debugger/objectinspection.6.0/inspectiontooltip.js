﻿"use strict";

window.cls || (window.cls = {});

cls.JSInspectionTooltip = function()
{
  var OBJECT_VALUE = 3;
  var CLASS_NAME = 4;
  var NON_PRINTABLE = 0;
  var CLASS_TOOLTIP_SELECTED = "tooltip-selected";

  var _tooltip = null;
  var _pretty_printer = null;
  var _cur_ctx = null;
  var _cur_object = null;

  var _handle_ontooltip = function(ctx)
  {
    if (_cur_object && ctx.object == _cur_object &&
        document.documentElement.contains(ctx.target) &&
        ctx.template)
    {
      _cur_ctx = ctx;
      _cur_ctx.target.addClass(CLASS_TOOLTIP_SELECTED);
      _tooltip.show(ctx.template);
    }
    else
      _hide_tooltip();
  };

  var _hide_tooltip = function()
  {
    if (_cur_ctx)
      _cur_ctx.target.removeClass(CLASS_TOOLTIP_SELECTED);

    _cur_ctx = null;
    _cur_object = null;
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
    if (_cur_ctx && _cur_ctx.target == target)
      return;

    _hide_tooltip();

    var model_id = target.get_attr("parent-node-chain", "data-id");
    var obj_id = parseInt(target.get_attr("parent-node-chain", "obj-id"));
    var model = inspections[model_id];
    var obj = model && model.get_object_with_id(obj_id);

    if (obj && obj[OBJECT_VALUE])
    {
      _cur_object = obj;
      _pretty_printer.print({target: target,
                             rt_id: model.runtime_id,
                             obj_id: obj_id,
                             class_name: obj[OBJECT_VALUE][CLASS_NAME] || "",
                             object: obj,
                             callback: _handle_ontooltip});
    }
  };

  var _init = function(view)
  {
    _tooltip = Tooltips.register(cls.JSInspectionTooltip.tooltip_name, true);
    _pretty_printer = new cls.PrettyPrinter();
    _pretty_printer.register_types([cls.PrettyPrinter.ELEMENT,
                                    cls.PrettyPrinter.DATE,
                                    cls.PrettyPrinter.FUNCTION,
                                    cls.PrettyPrinter.ERROR,
                                    cls.PrettyPrinter.REGEXP]);
    _tooltip.ontooltip = _ontooltip;
    _tooltip.onhide = _hide_tooltip;
    _tooltip.ontooltipenter = _ontooltipenter;
    _tooltip.ontooltipleave = _ontooltipleave;
    _tooltip.ontooltipclick = _ontooltipclick;
  };

  _init();
};

cls.JSInspectionTooltip.tooltip_name = "js-inspection";

cls.JSInspectionTooltip.register = function()
{
  this._tooltip = new cls.JSInspectionTooltip();
};
