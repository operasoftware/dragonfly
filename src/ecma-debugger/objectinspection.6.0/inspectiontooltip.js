"use strict";

window.cls || (window.cls = {});

cls.JSInspectionTooltip = function()
{
  var STATUS = 0;
  var VALUE = 2;
  var OBJECT_VALUE = 3;
  var OBJECT_ID = 0;
  var CLASS_NAME = 4;
  var NON_PRINTABLE = 0;
  var ELEMENT = 1;
  var DATE = 2;
  var FUNCTION = 3;
  var ERROR = 4;
  var REGEXP = 5;
  var CLASS_TOOLTIP_SELECTED = "tooltip-selected";

  var _tooltip = null;
  var _pretty_printer = null;
  var _cur_ctx = null;
  var _cur_target = null;
  var _cur_object = null;
  var _cur_rt_id = 0;
  var _cur_obj_id = 0;
  var _cur_class_name = "";
  var _cur_type = NON_PRINTABLE;
  var _printable_classes = {"Date": DATE,
                            "Function": FUNCTION,
                            "RegExp": REGEXP};
  var _print = {};

  _print[DATE] =
  _print[FUNCTION] =
  _print[ERROR] =
  _print[REGEXP] = function(obj, obj_id)
  {
    var rt_id = runtimes.getSelectedRuntimeId();
    var thread_id = stop_at.getThreadId();
    var frame_index = stop_at.getSelectedFrameIndex();
    if (frame_index == -1)
    {
      thread_id = 0;
      frame_index = 0;
    }
    var script = "";
    switch (_cur_type)
    {
      case DATE:      
        script = "new Date(obj.getTime() - obj.getTimezoneOffset() * 1000 * 60)" +
                 ".toISOString().replace(\"Z\", \"\")";
        break;
    
      case FUNCTION:
      case REGEXP:
        script = "obj.toString()";
        break

      case ERROR:
        script = "obj.message";
        break;
    } 
    var tag = tagManager.set_callback(null, _handle_print_object, [obj]);
    var msg = [rt_id, thread_id, frame_index, script, [["obj", obj_id]]];
    services["ecmascript-debugger"].requestEval(tag, msg);
  };

  _print[ELEMENT] = function(obj, obj_id)
  {
    var tag = tagManager.set_callback(null, _handle_printable_element, [obj]);
    var msg = [obj_id, "node"];
    services["ecmascript-debugger"].requestInspectDom(tag, msg);
  };

  var _handle_print_object = function(status, message, obj)
  {
    if (!status && message[STATUS] == "completed")
      _show_tooltip(obj, message);

    else
      _hide_tooltip();
  };

  var _handle_printable_element = function(status, message, obj)
  {
    if (!status)
      _show_tooltip(obj, message);

    else
      _hide_tooltip();
  };

  var _handle_ontooltip = function(ctx)
  {
    if (_cur_object && ctx.object == _cur_object &&
        document.documentElement.contains(ctx.target) &&
        ctx.template)
    {
      /*
      var tmpl = null;
      switch (_cur_type)
      {
        case ELEMENT:
          tmpl = _templates[ELEMENT](message);
          break;

        case DATE:
          tmpl = message[VALUE];  
          break;
            
        case REGEXP:
          tmpl = ["span", message[VALUE], "class", "reg_exp"];    
          break;
      
        case FUNCTION:
          tmpl = templates.highlight_js_source(message[VALUE]);
          break

        case ERROR:
          tmpl = "Unhandled " + _cur_class_name + ": " + message[VALUE];    
          break;
          
      }
      */

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
    // _cur_object = null;
    // _cur_rt_id = 0;
    // _cur_obj_id = 0;
    // _cur_class_name = "";
    // _cur_type = NON_PRINTABLE;
    _tooltip.hide();
  };

  var _templates = {};

  _templates[ELEMENT] = function(msg)
  {
    var NODE_LIST = 0;
    var NODE = 0;
    var NAME = 2;
    var NAMESPACE = 4;
    var ATTRS = 5;
    var ATTR_PREFIX = 0;
    var ATTR_KEY = 1;
    var ATTR_VALUE = 2;

    var tmpl = [];
    var node = msg[NODE_LIST] && msg[NODE_LIST][NODE];

    if (node)
    {
      var force_lower_case = settings.dom.get("force-lowercase");
      var is_tree_style = settings.dom.get("dom-tree-style");
      var node_name = node[NAMESPACE]
                    ? node[NAMESPACE] + ":"
                    : "";
      node_name += node[NAME];
      if (force_lower_case)
        node_name = node_name.toLowerCase();

      if (node[ATTRS] && node[ATTRS].length)
      {
        tmpl.push("node", (is_tree_style ? "" : "<") + node_name + " ");
        node[ATTRS].forEach(function(attr)
        {
          var attr_key = attr[ATTR_PREFIX] ? attr[ATTR_PREFIX] + ":" : "";
          attr_key += force_lower_case
                    ? attr[ATTR_KEY].toLowerCase()
                    : attr[ATTR_KEY];
          tmpl.push(["key", attr_key]);
          tmpl.push("=");
          tmpl.push(["value", "\"" + attr[ATTR_VALUE] + "\""]);
          tmpl.push(" ");
        });
        tmpl.pop();
        if (!is_tree_style)
          tmpl.push(">");
      }
      else
        tmpl.push("node", is_tree_style ? node_name : "<" + node_name + ">");
      
      tmpl = ["div", tmpl, "class", "dom"];
    }
    return tmpl;
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

  var _get_print_type = function(class_name)
  {
    if (/Element$/.test(class_name))
      return ELEMENT;

    if (/(Error|Exception)$/.test(class_name))
      return ERROR;
    
    if (_printable_classes.hasOwnProperty(class_name))
      return _printable_classes[class_name];
    
    return NON_PRINTABLE;
  }

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
                                    ]);
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
