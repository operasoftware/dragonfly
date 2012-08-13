"use strict";

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
      if (ctx.type.after_render)
        ctx.type.after_render();
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
        dom_data.get_dom(_cur_ctx.rt_id, _cur_ctx.obj_id);
        _hide_tooltip();
        UI.get_instance().show_view("dom");
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
    else
    {
      var rt_id = Number(target.get_ancestor_attr("data-rt-id"));
      var obj_id = Number(target.get_ancestor_attr("data-obj-id"));
      var class_name = target.get_ancestor_attr("data-class-name");
      if (rt_id && obj_id && class_name)
      {
        _cur_object = {rt_id: rt_id, obj_id: obj_id, class_name: class_name};
        _pretty_printer.print({target: target,
                               rt_id: rt_id,
                               obj_id: obj_id,
                               class_name: class_name,
                               object: _cur_object,
                               callback: _handle_ontooltip});
      }
      else
      {
        var script_data = target.get_ancestor_attr("data-script-data");
        if (script_data && class_name)
        {
          _cur_object = {script_data: script_data, class_name: class_name};
          _pretty_printer.print({target: target,
                                 script_data: script_data,
                                 class_name: class_name,
                                 object: _cur_object,
                                 callback: _handle_ontooltip});
        }
      }
    }
  };

  this.handle_function_source = function(event, target)
  {
    var rt_id = Number(target.get_ancestor_attr("data-rt-id"));
    var obj_id = Number(target.get_ancestor_attr("data-obj-id"));
    if (_cur_object && _cur_ctx &&
        _cur_object.rt_id == rt_id && _cur_object.obj_id == obj_id &&
        _cur_ctx.script && _cur_ctx.function_definition &&
        window.views.js_source)
    {
      window.views.js_source.show_script(_cur_ctx.script.script_id,
                                         _cur_ctx.function_definition.start_line,
                                         _cur_ctx.function_definition.end_line);
    }
  };

  var _init = function(view)
  {
    _tooltip = Tooltips.register(cls.JSInspectionTooltip.tooltip_name, true, true,
                                 ".js-tooltip-examine-container");
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

cls.JSInspectionTooltip.get_tooltip = function()
{
  return this._tooltip;
};
