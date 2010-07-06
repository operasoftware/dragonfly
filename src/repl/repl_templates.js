
window.templates || (window.templates = {});


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

templates.repl_output_trace = function(trace)
{
  // the slice is so we reverse a copy, not touching the original
  return ["ul",
          trace.frameList.slice(0).reverse().map(function(frame) {
            var uri = frame.uri || "<unknown source>";
            var name = frame.objectValue ? frame.objectValue.functionName || frame.objectValue.className : "<unknown function>";
            var line = frame.lineNumber == undefined ? "<unknown line>" : frame.lineNumber;
            return ["li", uri + ":" + name + ":" + line];
            //  + (window.ini.debug ? " " + JSON.stringify(frame) : "" )
          }),
          'class', 'repl-output-trace'
  ];
};
