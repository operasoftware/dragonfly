"use strict";

window.cls || (window.cls = {});

cls.PrettyPrinter = function() {};

cls.PrettyPrinter.ELEMENT = 1;
cls.PrettyPrinter.DATE = 2;
cls.PrettyPrinter.FUNCTION = 3;
cls.PrettyPrinter.ERROR = 4;
cls.PrettyPrinter.REGEXP = 5;

cls.PrettyPrinter.types = {};

/**
  * Add more types here.
  * A type must have an is_type function which takes a class name to check
  * if a given object is of this type.
  * The type must either have a script or a traversal property. The script is
  * used with an Eval command to pretty print an object. The traversal is used
  * with an InspectDOM command to retrieve a node.
  * The type must have a template function to return a template. The template
  * takes the returned message and the given ctx as arguments.
  */

cls.PrettyPrinter.types[cls.PrettyPrinter.ELEMENT] =
{
  type: cls.PrettyPrinter.ELEMENT,
  is_type: function(class_name)
  {
    return /Element$/.test(class_name);
  },
  traversal: "node",
  template: function(msg, ctx)
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

      tmpl = ["div", tmpl, "class", "dom mono"];
    }
    return tmpl;
  }
};

cls.PrettyPrinter.types[cls.PrettyPrinter.DATE] =
{
  type: cls.PrettyPrinter.DATE,
  is_type: function(class_name)
  {
    return class_name == "Date";
  },
  script: "new Date(object.getTime() - object.getTimezoneOffset() * 1000 * 60)" +
          ".toISOString().replace(\"Z\", \"\")",
  template: function(message, ctx)
  {
    var VALUE = 2;
    return ["span", message[VALUE], "class", "mono"];
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
  template: function(message, ctx)
  {
    var VALUE = 2;
    var tmpl = templates.highlight_js_source(message[VALUE]);
    tmpl.push("class", "pretty-printed-code mono");
    return tmpl;
  }
};

cls.PrettyPrinter.types[cls.PrettyPrinter.ERROR] =
{
  type: cls.PrettyPrinter.ERROR,
  is_type: function(class_name)
  {
    return /(Error|Exception)$/.test(class_name);
  },
  script: "object.message",
  template: function(message, ctx)
  {
    var VALUE = 2;
    return ["span", message[VALUE], "class", "mono"];
  }
};

cls.PrettyPrinter.types[cls.PrettyPrinter.REGEXP] =
{
  type: cls.PrettyPrinter.REGEXP,
  is_type: function(class_name)
  {
    return class_name == "RegExp";
  },
  script: "object.toString()",
  template: function(message, ctx)
  {
    var VALUE = 2;
    return ["span", message[VALUE], "class", "reg_exp mono"];
  }
};

cls.PrettyPrinter.prototype = new function()
{
  this.register_types = function(list) {};
  this.unregister_types = function(list) {};
  /**
    * param {Object} ctx The context to pretty print an object. The context
    * must have a rt_id, an obj_id, a class_name and a callback property.
    * The type and the template will be set on the context if there is an
    * according type registered for the given object.
    */
  this.print = function(ctx) {};

  this.register_types = function(list)
  {
    if (!this._types)
      this._types = [];

    list.forEach(function(type)
    {
      if (cls.PrettyPrinter.types.hasOwnProperty(type) &&
          !this._types.contains(cls.PrettyPrinter.types[type]))
      {
        this._types.push(cls.PrettyPrinter.types[type]);
      }
    }, this);
  };

  this.unregister_types = function(list)
  {
    list.forEach(function(type)
    {
      var index = this._types.indexOf(cls.PrettyPrinter.types[type]);
      if (index > -1)
        this._types.splice(index, 1);
    }, this);
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
    var tag = tag_manager.set_callback(this, this._handle_element, [ctx]);
    var msg = [ctx.obj_id, ctx.type.traversal];
    services["ecmascript-debugger"].requestInspectDom(tag, msg);
  };

  this._handle_element = function(status, message, ctx)
  {
    ctx.template = !status && ctx.type.template(message, ctx)
    ctx.callback(ctx);
  };

  this._print_object = function(ctx)
  {
    var ex_ctx = window.runtimes.get_execution_context();
    var rt_id = ex_ctx.rt_id;
    var thread_id = ex_ctx.thread_id;
    var frame_index = ex_ctx.frame_index;
    if (ctx.rt_id != rt_id)
    {
      rt_id = ctx.rt_id;
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
                   ctx.type.template(message, ctx);
    ctx.callback(ctx);
  };

  this.print = function(ctx)
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


