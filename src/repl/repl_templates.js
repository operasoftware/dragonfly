window.templates || (window.templates = {});

templates.repl_main = function()
{
  return [
    "div", [[
      ["div", [
         "ol", "class", "repl-lines js-source"
         ], "class", "repl-output"],
      ["div", [[
        ["span", ">>>\xA0", "class", "repl-prefix"],
        ["div", ["textarea",
                 "focus-handler", "repl-textarea",
                 "blur-handler", "blur-textarea",
                 "rows", "1"]]
      ]], "class", "repl-input"]
    ]], "class", "padding"
  ];
};

templates.repl_output_native = function(s, severity)
{
  return ["span", s || "\u00A0", "class", "repl-native"];
};

templates.repl_output_native_or_pobj = function(thing, severity)
{
  if (thing.type == "native") {
    return templates.repl_output_native(thing.value, severity);
  }
  else
  {
    return templates.repl_output_pobj(thing);
  };
};

templates.repl_output_pobj = function(entry)
{
  var is_element_type = settings.command_line.get("is-element-type-sensitive") &&
                        /(?:Element)$/.test(entry.name)
  if (entry.model)
  {
    var tmpl = null;
    if (entry.model_template == cls.ReplService.INLINE_MODEL_TMPL_DOM)
    {
      tmpl = window.templates[entry.model_template](entry.model, null, false, true);
    }
    else
    {
      tmpl = window.templates[entry.model_template](entry.model, entry.model.show_root);
    }
    // The returned template is an innerHTML string.
    // The render call can handle that if the innerHTML is passed
    // as a single field in an array.
    var ret = ['span', [tmpl], 'class', 'repl-inline-expandable'];
    if (entry.model instanceof cls.InspectableJSObject)
    {
      ret.push('handler', 'inspect-object-inline-link');
    }
    return ret;
  };

  return [
    'code',
    entry.friendly_printed ? this.friendly_print(entry.friendly_printed) : entry.name,
    'handler', is_element_type ? 'inspect-node-link' : 'inspect-object-link',
    'rt-id', entry.rt_id.toString(),
    'obj-id', entry.obj_id.toString(),
    'class', 'repl-pobj ' + (is_element_type ? 'inspect-node-link' : 'inspect-object-link')
  ];
};

templates.repl_output_traceentry = function(frame_list)
{
  var is_all_frames = frame_list.length <= ini.max_frames;
  var tpl = [];
  for (var i = 0, frame; frame = frame_list[i]; i++)
  {
    var function_name = is_all_frames && i == frame_list.length - 1
                      ? ui_strings.S_GLOBAL_SCOPE_NAME
                      : frame.objectValue.functionName || ui_strings.S_ANONYMOUS_FUNCTION_NAME;
    var uri = helpers.get_script_name(frame.scriptID);
    var entry = ['div', ['span', function_name]];
    if (typeof frame.scriptID == "number" && !isNaN(frame.scriptID) &&
        typeof frame.lineNumber == "number"  && !isNaN(frame.lineNumber))
    {
      entry.push(
      ['span',
          (helpers.basename(uri) || '–') + ":" + (frame.lineNumber || '–'),
          'data-ref-id', "" + i,
          'data-script-id', String(frame.scriptID),
          'data-line-number', String(frame.lineNumber),
          'data-scope-variable-object-id', String(frame.variableObject),
          'data-this-object-id', String(frame.thisObject),
          'data-arguments-object-id', String(frame.argumentObject),
          'class', 'repl-output-go-to-source']);
    }
    tpl.push(entry);
  }
  return tpl;
};

templates.repl_output_trace = function(trace)
{
  var list = templates.repl_output_traceentry(trace.frameList);
  var tpl = ["div", list,
               "class", "console-trace",
               'handler', 'select-trace-frame',
               'runtime-id', trace.runtimeID.toString()
            ];
  return tpl;
};

templates.repl_group_line = function(group)
{
  return [["button", "class", "folder-key"+(group.collapsed ? "" : " open" ),
                     "handler", "repl-toggle-group", "group-id", group.id
          ], group.name];
};

templates.repl_output_location_link = function(id, line)
{
  var uri = helpers.get_script_name(id);
  if (!uri)
  {
    return [];
  }
  return ["span", helpers.basename(uri) + ":" + line,
            "class", "repl-output-go-to-source",
            "handler", "show-log-entry-source",
            "data-scriptid", String(id),
            "data-scriptline", String(line)
         ];
}
