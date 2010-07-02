
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

