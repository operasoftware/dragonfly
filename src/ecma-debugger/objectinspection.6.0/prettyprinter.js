window.cls || (window.cls = {});

cls.PrettyPrinter = function() {};

cls.PrettyPrinter.ELEMENT = 1;
cls.PrettyPrinter.DATE = 2;
cls.PrettyPrinter.FUNCTION = 3;
cls.PrettyPrinter.ERROR = 4;
cls.PrettyPrinter.REGEXP = 5;

cls.PrettyPrinter.types = {};

/* 
Add types here
type:
is_type
script 
traversal
template
*/
cls.PrettyPrinter.types[cls.PrettyPrinter.DATE] =
{
  type: cls.PrettyPrinter.DATE,
  is_type: function(class_name)
  {
    return class_name == "Date";
  },
  script: "new Date(object.getTime() - object.getTimezoneOffset() * 1000 * 60)" +
          ".toISOString().replace(\"Z\", \"\")",
  template: function(message)
  {
    var VALUE = 2;
    return message[VALUE];
  }
};

cls.PrettyPrinter.types[cls.PrettyPrinter.FUNCTION] =
{
  type: cls.PrettyPrinter.FUNCTION,
  is_type: function(class_name)
  {
    return class_name == "Function";
  },
  script: "object.toString()",
  template: function(message)
  {
    var VALUE = 2;
    return templates.highlight_js_source(message[VALUE]);
  }
};

cls.PrettyPrinter.types[cls.PrettyPrinter.ELEMENT] =
{
  type: cls.PrettyPrinter.ELEMENT,
  is_type: function(class_name)
  {
    return /Element$/.test(class_name);
  },
  traversal: "node",
  template: function(msg)
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
  }
};

cls.PrettyPrinter.prototype = new function()
{
  this.register_types = function(list) {};
  this.unregister_types = function(list) {};
  /**
    * param {Object} ctx. ctx must have properties rt_id, obj_id, class_name, callback.
    * type and template will be set
    */
  this.print = function(ctx) {};
  
  this.register_types = function(list)
  {
    if (!this._types)
      this._types = [];

    list.forEach(function(type)
    {
      if (cls.PrettyPrinter.types.hasOwnProperty(type))
        this._types.push(cls.PrettyPrinter.types[type]);
    }, this);  
  };

  this.unregister_types = function(list)
  {
    
  };

  this._get_type = function(class_name)
  {
    for (var i = 0, type; type = this._types[i]; i++)
    {
      if (type.is_type(class_name))
        return type;  
    }
    return null;
  };

  this._print_element = function(ctx)
  {
    var tag = tagManager.set_callback(this, this._handle_element, [ctx]);
    var msg = [ctx.obj_id, ctx.type.traversal];
    services["ecmascript-debugger"].requestInspectDom(tag, msg);
  };

  this._handle_element = function(status, message, ctx)
  {
      ctx.template = !status && ctx.type.template(message)
      ctx.callback(ctx);
  };

  this._print_object = function(ctx)
  {
    // TODO check returns that the correct runtime id?
    var rt_id = runtimes.getSelectedRuntimeId();
    var thread_id = stop_at.getThreadId();
    var frame_index = stop_at.getSelectedFrameIndex();
    if (frame_index == -1)
    {
      thread_id = 0;
      frame_index = 0;
    }
    var tag = tagManager.set_callback(this, this._handle_object, [ctx]);
    var msg = [rt_id, thread_id, frame_index, ctx.type.script, [["object", ctx.obj_id]]];
    services["ecmascript-debugger"].requestEval(tag, msg);
  };

  this._handle_object = function(status, message, ctx)
  {
    var STATUS = 0;
    ctx.template = !status && message[STATUS] == "completed" &&
                   ctx.type.template(message);
    ctx.callback(ctx);
  };

  this.print = function(ctx) // ctx with obj_id, class_name, callback
  {
    if (ctx.type = this._get_type(ctx.class_name))
    {
      if (ctx.type.traversal)
        this._print_element(ctx);

      else
        this._print_object(ctx);
    }
    else
      ctx.callback(ctx);
  };

};


