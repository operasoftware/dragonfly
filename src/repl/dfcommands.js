var DFLCommands = function(){};
DFLCommands.commands = {};

DFLCommands.commands.help =
{
  alias: 'man',
  command: function(view, data, service)
  {
    data.add_message("Available commands:");
    var names = [];
    for (var key in this._dfcommands)
    {
      if (this._dfcommands.hasOwnProperty(key))
        names.push(key);
    }
    names.sort();
    for (var n=0, name; name=names[n]; n++)
    {
      var cmd = this._dfcommands[name];
      data.add_message(name + (cmd.description ? ": " + cmd.description : ""));
    }
    data.add_message("\n");
    data.add_message(ui_strings.S_SETTINGS_HEADER_KEYBOARD_SHORTCUTS + ":");
    data.add_message("\n");
    const CMD_LINE_VIEW_ID = 'command_line';
    var broker = ActionBroker.get_instance();
    var shortcuts = broker.get_shortcuts();
    shortcuts = shortcuts && shortcuts[CMD_LINE_VIEW_ID];
    var label_map = {};
    var all_keys = [];
    for (var mode in shortcuts)
    {
      mode_label = broker.get_label_with_handler_id_and_mode(CMD_LINE_VIEW_ID, mode);
      if (mode_label)
      {
        var mode_shortcuts = shortcuts[mode];
        var keys = [];
        for (var mode_shortcut in mode_shortcuts)
        {
          keys.push(mode_shortcut);
        }
        keys.sort();
        all_keys.extend(keys)
        label_map[mode] = {label: mode_label, keys: keys};
      }
    }
    var width = Math.max.apply(Math, all_keys.map(function(k)
    {
      return k.length;
    }));
    for (mode in label_map)
    {
      data.add_message(label_map[mode].label);
      label_map[mode].keys.forEach(function(key)
      {
        data.add_message("    " + key.ljust(width + 4) + shortcuts[mode][key]);
      });
      data.add_message("\n");
    }
  },
  description: ui_strings.S_REPL_HELP_COMMAND_DESC,
};

DFLCommands.commands.jquery =
{
  command: function(view, data, service)
  {
    var url = "http://code.jquery.com/jquery.min.js";
    var code = ["(function(){",
                "  var script = document.createElement('script');",
                "  script.setAttribute('src', '" + url + "');",
                "  var cb = function() {",
                "    script.parentNode.removeChild(script);",
                "    console.log('jquery loaded');",
                "  };",
                "  script.addEventListener('load', cb, false);",
                "  document.body.appendChild(script);",
                "  return 'Loading jquery'",
                "})();"].join("\n");
    service.evaluate_input(code);
  },
  description: ui_strings.S_REPL_JQUERY_COMMAND_DESC,
};
