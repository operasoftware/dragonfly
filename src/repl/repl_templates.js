
window.templates || (window.templates = {});

templates.repl_main = function()
{
  return [
    "div", [[
      ["div", [
         "ol", "", "class", "repl-lines js-source"
         ], "class", "repl-output"],
      ["div", [[
        ["span", ">>> ", "class", "repl-prefix"],
        ["div", ["textarea", "", "handler", "repl-textarea", "rows", "1"]]
      ]], "class", "repl-input"]
    ]], "class", "padding"
  ];
};

templates.repl_output_native = function(s)
{
  return ["span", s, "class", "repl-native"];
};

templates.repl_output_native_or_pobj = function(thing)
{
  if (thing.type == "native") {
    return templates.repl_output_native(thing.value);
  }
  else
  {
    return templates.repl_output_pobj(thing);
  };
};

templates.repl_output_pobj = function(data)
{
  return [
    'code',
    data.name,
    'handler', 'inspect-object-link',
    'rt-id', data.rt_id.toString(),
    'obj-id', data.obj_id.toString(),
    'class', 'repl-pobj'
  ];
};

templates.repl_output_traceentry = function(frame, index)
{
    var tpl = ['li',
      ui_strings.S_TEXT_CALL_STACK_FRAME_LINE.
        replace("%(FUNCTION_NAME)s", ( frame.objectValue ? frame.objectValue.functionName : ui_strings.ANONYMOUS_FUNCTION_NAME ) ).
        replace("%(LINE_NUMBER)s", ( frame.lineNumber || '-' ) ).
        replace("%(SCRIPT_ID)s", ( frame.scriptID || '-' ) ),
      'ref-id', index.toString(),
      'script-id', String(frame.scriptID), //.toString(),
      'line-number', String(frame.lineNumber),
      'scope-variable-object-id', String(frame.variableObject),
      'this-object-id', String(frame.thisObject),
      'arguments-object-id', String(frame.argumentObject)
    ];
  return tpl;
};

templates.repl_output_trace = function(trace)
{
  var lis = trace.frameList.map(templates.repl_output_traceentry);
  var tpl = ["div", ["ol", lis, "class", "console-trace",
                     'handler', 'select-trace-frame',
                     'runtime-id', trace.runtimeID.toString()
                    ],
                    "class", "console-trace-container"];
  return tpl;
};
