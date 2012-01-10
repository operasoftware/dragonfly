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

  var _tooltip = null;
  var _tagman = null;
  var _esde = null;
  var _print = {};
  var _printable_classes = {};
  _printable_classes["Date"] = DATE;
  _printable_classes["Function"] = FUNCTION;
  _printable_classes["RegExp"] = REGEXP;
  var _cur_target = null;
  var _cur_object = null;
  var _cur_class_name = "";
  var _cur_prin_type = NON_PRINTABLE;

  _print[DATE] = 
  _print[FUNCTION] = 
  _print[ERROR] = 
  _print[REGEXP] = 
  function(obj, obj_id)
  {
    var rt_id = window.runtimes.getSelectedRuntimeId();
    var thread_id = window.stop_at.getThreadId();
    var frame_index = window.stop_at.getSelectedFrameIndex();
    if (frame_index == -1)
    {
      thread_id = 0;
      frame_index = 0;
    }
    var script = "";

    if (_cur_prin_type == DATE)
      script = "new Date(obj.getTime() - obj.getTimezoneOffset() * 1000 * 60)" +
               ".toISOString().replace('Z','')";
    
    else if (_cur_prin_type == FUNCTION || _cur_prin_type == REGEXP)
      script = "obj.toString()";

    else if (_cur_prin_type == ERROR)
      script = "obj.message";

    var tag = _tagman.set_callback(null, _handle_printable_object, [obj]);
    var msg = [rt_id, thread_id, frame_index, script, [["obj", obj_id]]];
    _esde.requestEval(tag, msg);
  };

  var _handle_printable_object = function(status, message, obj)
  {
    if (!status && message[STATUS] == "completed" && obj == _cur_object &&
        document.documentElement.contains(_cur_target))
    {
      _tooltip.show(["pre", message[VALUE]]);
    }
    else
      _tooltip.hide();
  };

  _print[ELEMENT] = function(obj, obj_id)
  {
    var tag = _tagman.set_callback(null, _handle_printable_element, [obj]);
    var msg = [obj_id, "node"];
    _esde.requestInspectDom(tag, msg);
  };

  var _handle_printable_element = function(status, message, obj)
  {
    if (!status && obj == _cur_object &&
        document.documentElement.contains(_cur_target))
    {
      var tmpl = _templates[ELEMENT](message);
      _tooltip.show(tmpl);
    }
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
      var force_lower_case = window.settings.dom.get('force-lowercase');
      var node_name = node[NAMESPACE]
                    ? node[NAMESPACE] + ':'
                    : '';
      node_name += node[NAME];
      if (force_lower_case)
        node_name = node_name.toLowerCase();

      if (node[ATTRS] && node[ATTRS].length)
      {
        tmpl.push("node", "<" + node_name + " ");
        node[ATTRS].forEach(function(attr)
        {
          var attr_key = attr[ATTR_PREFIX] ? attr[ATTR_PREFIX] + ':' : '';
          attr_key += force_lower_case
                    ? attr[ATTR_KEY].toLowerCase()
                    : attr[ATTR_KEY];
          tmpl.push(["key", attr_key]);
          tmpl.push("=");
          tmpl.push(["value", "\"" + attr[ATTR_VALUE] + "\""]);
          tmpl.push(" ");
        });
        tmpl.pop();
        tmpl.push(">");
      }
      else
        tmpl.push("node", "<" + node_name + ">");
      
      tmpl = ["div", tmpl, "class", "dom"];
    }
    return tmpl;
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
    var obj_id = parseInt(target.get_attr("parent-node-chain", "obj-id"));
    var model_id = target.get_attr("parent-node-chain", "data-id");
    var model = window.inspections[model_id];
    var obj = model && model.get_object_with_id(obj_id);
    var class_name = obj && obj[OBJECT_VALUE] && obj[OBJECT_VALUE][CLASS_NAME] || "";
    var print_type = _get_print_type(class_name);

    if (print_type)
    {
      _cur_object = obj;
      _cur_target = target; 
      _cur_class_name = class_name;
      _cur_prin_type = print_type;
      _print[print_type](obj, obj_id);
    }
    else
      _tooltip.hide();
  };

  var _onhide = function()
  {

  };

  var _ontooltipenter = function(event)
  {

  };

  var _ontooltipleave = function(event)
  {

  };

  var _init = function(view)
  {
    _tooltip = Tooltips.register(cls.JSInspectionTooltip.tooltip_name, true);
    _tooltip.ontooltip = _ontooltip;
    _tooltip.onhide = _onhide;
    _tooltip.ontooltipenter = _ontooltipenter;
    _tooltip.ontooltipleave = _ontooltipleave;
    _tagman = window.tagManager;
    _esde = window.services['ecmascript-debugger'];
    /*
    window.messages.addListener('monospace-font-changed', _onmonospacefontchange);
    window.addEventListener('resize', _get_container_box, false);
    */
  };

  _init();

};

cls.JSInspectionTooltip.tooltip_name = "js-inspection";

cls.JSInspectionTooltip.register = function()
{
  this._tooltip = new cls.JSInspectionTooltip();
};


