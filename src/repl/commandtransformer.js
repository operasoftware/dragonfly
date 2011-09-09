/**
 * Takes a command line and converts it to something that can
 * be evaluated on the host side.
 *
 * Host commands are defined by creating a method called
 * hostcommand_<command name here>. The command method has the following
 * signature
 *
 * void hostcommand(object token, object[] tokenlist)
 *
 * The first argument contains a token object with keys for
 * "type" and "value". The type is (FIXME: int/enum or string tbd)
 *
 * Value contains the string representation of the token. The token
 * objects are passed by reference, so any changes made to them are
 * propagated back when the string representation of the command line
 * is generated.
 *
 * The "tokenlist" argument contains the entire list of tokens generated
 * from parsing the command line. This array is also passed by reference,
 * so any changes will be seen by all host command methods.
 *
 * Host command methods are expected to directly manipulate the token,
 * and/or the token list. A command handler may ask for the entire
 * token list to be re-processed, by returning true. This may be
 * useful if a handler inserts something that is itself a host command.
 *
 */
window.cls = window.cls || {};
cls.HostCommandTransformer = function() {
  this.parser = null;
  this.client_command_map = {};
  this.df_command_map = {};
  this.transform_map = {};


  //local copy of token types, local vars have better performance. :
  const
  WHITESPACE = window.cls.SimpleJSParser.WHITESPACE,
  LINETERMINATOR = window.cls.SimpleJSParser.LINETERMINATOR,
  IDENTIFIER = window.cls.SimpleJSParser.IDENTIFIER,
  NUMBER = window.cls.SimpleJSParser.NUMBER,
  STRING = window.cls.SimpleJSParser.STRING,
  PUNCTUATOR = window.cls.SimpleJSParser.PUNCTUATOR,
  DIV_PUNCTUATOR = window.cls.SimpleJSParser.DIV_PUNCTUATOR,
  REG_EXP = window.cls.SimpleJSParser.REG_EXP,
  COMMENT = window.cls.SimpleJSParser.COMMENT;

  this.init = function() {
    // window.simple_js_parser is default location for the parser instance
    // in dragonfly. Use it if it exists.
    this.parser = window.simple_js_parser || new window.cls.SimpleJSParser();

    for (var methodname in this) {
      var type = methodname.split("_", 1)[0];
      if (type == "hostcommand")
      {
        var name = methodname.split("hostcommand_")[1];
        this.transform_map[name] = this[methodname];
      }
      else if (type == "clientcommand")
      {
        var name = methodname.split("clientcommand_")[1];
        this.client_command_map[name] = this[methodname];
      }
      else if (type == "dfcommand")
      {
        var name = methodname.split("dfcommand_")[1];
        this.df_command_map[name] = this[methodname];
      }
    }
  };

  this.transform = function(source)
  {
    var types = [];
    var values = [];
    var tokens = [];
    this.parser.parse(source, values, types);

    // make a more straightforward representation of tokens. Command line
    // stuff is small, so the cost of this doesn't matter much.
    tokens = this.zip_tokens(types, values);

    dirty: // we jump back here if we need to re-process all tokens
    for (var n=0, token; token=tokens[n]; n++) {
      if (token.type == IDENTIFIER && this.transform_map.hasOwnProperty(token.value)) {
        var fun = this.transform_map[token.value];
        if (fun.call(this, token, tokens)) {
          break dirty;
        }
      }
    }
    return tokens.map(function(e) {return e.value;}).join("");
  };

  this.get_command = function(source)
  {
    var types = [];
    var values = [];
    var tokens = [];
    this.parser.parse(source, values, types);

    // make a more straightforward representation of tokens. Command line
    // stuff is small, so the cost of this doesn't matter much.
    tokens = this.zip_tokens(types, values);

    if (!tokens.length)
    {
      return null;
    }
    else if (this.is_call(tokens, 0) && tokens[0].value in this.client_command_map)
    {
      return this.client_command_map[tokens[0].value];
    }

    if (tokens[0].type == COMMENT)
    {
      // regex matches "// command()" . Whitespace is allowed inbetween most tokens
      var match = tokens[0].value.match(/\s*\/\/\s*(\w+)\s*\(\s*\)\s*/);
      if (match)
      {
        var command = match[1];
        if (command in this.df_command_map)
        {
          return this.df_command_map[command];
        }
      }
    }
    return null;
  };

  this.zip_tokens = function(types, values) {
    var tokens = [];
    for (var n=0; n<types.length; n++) {
      tokens.push({type: types[n], value: values[n]});
    }
    return tokens;
  };

  /**
   * Check if the token at index looks like it's a function/method being
   * called by looking at the following tokens. This is a naïve check, but
   * should work fine in most cases.
   */
  this.is_call = function(tokens, index) {
    if (!tokens[index] || tokens[index].type != IDENTIFIER) {
      return false;
    }

    var open_paren_seen = false;
    for (var n=index+1, token; token=tokens[n]; n++) {
      switch (token.type) {
        case WHITESPACE:
          continue;
        case PUNCTUATOR:
          if (token.value == "(")
          {
            open_paren_seen = true;
          }
          else if (token.value == ")" && open_paren_seen)
          {
            // if there's no junk after, assume it's fine
            return !tokens[n+1];
          }
          else {
            return false;
          }
          break;
        default:
          if (open_paren_seen)
          {
            continue;
          }
          return false;
      }
    }
    return false;
  };

  /**
   * Check if the token at index is a property of name
   */
  this.is_property_of = function(name, tokens, index) {
    if (!tokens[index] || tokens[index].type != IDENTIFIER) {
      return false;
    }

    var n = index-1;

    for (var token; token=tokens[n]; n--) {
      if (token.type == WHITESPACE)
      {
        continue;
      }
      else if (token.type == PUNCTUATOR && token.value == ".")
      {
        break;
      }
      else
      {
        return false;
      }
    }

    n--; // if the break triggered n didn't decr

    for (var token; token=tokens[n]; n--) {
      switch (token.type) {
        case WHITESPACE:
          break;
        case IDENTIFIER:
          if (token.value == name) { return true; }
        default:
          return false;
      }
    }

    return false;
  };


  // Host commands:

  this.hostcommand_dir = function(token, tokenlist) {
    var index = tokenlist.indexOf(token);
    if (!this.is_call(tokenlist, index) ||
         this.is_property_of("console", tokenlist, index)) {
      return;
    }

    token.value = "(window.dir || function(e) { return console.dir(e)})";
  };

  this.hostcommand_dirxml = function(token, tokenlist) {
    var index = tokenlist.indexOf(token);

    if (!this.is_call(tokenlist, index) ||
         this.is_property_of("console", tokenlist, index)) {
      return;
    }

    token.value = "(window.dirxml || function(e) { return console.dirxml(e)})";
  };

  this.hostcommand_$ = function(token, tokenlist) {
    var index = tokenlist.indexOf(token);

    if (this.is_call(tokenlist, index)) {
      token.value = "(window.$ || function(e) { return document.getElementById(e)})";
    }
  };

  this.hostcommand_$$ = function(token, tokenlist) {
    var index = tokenlist.indexOf(token);

    if (this.is_call(tokenlist, index)) {
      token.value = "(window.$$ || function(e) { return document.querySelectorAll(e)})";
    }
  };

  this.hostcommand_$x = function(token, tokenlist) {
    var funstr = "(window.$x || function(e)\
                  {\
                    var res = document.evaluate(e, document, null, XPathResult.ANY_TYPE, null);\
                    var ret = [];\
                    var ele = res.iterateNext();\
                    while (ele) { ret.push(ele); ele=res.iterateNext() };\
                    return ret;\
                  })";
    token.value = funstr;
  };

  this.hostcommand_keys = function(token, tokenlist) {
    var funstr = "(window.keys || function(o) {var arr=[], key; for (key in o) {arr.push(key)}; return arr})";
    token.value = funstr;
  };

  this.hostcommand_values = function(token, tokenlist) {
    var funstr = "(window.values || function(o) {var arr=[], key; for (key in o) {arr.push(o[key])}; return arr})";
    token.value = funstr;
  };

  this.clientcommand_clear = function(view, data, input)
  {
    view._handle_action_clear();
  };

  // TODO: these special client commands should be defined outside of this class here.
  this.dfcommand_help = function(view, data, service)
  {
    data.add_message("Available commands:");
    var names = [];
    for (var key in this.df_command_map) { names.push(key) }
    names.sort();
    for (var n=0, name; name=names[n]; n++)
    {
      var cmd = this.df_command_map[name];
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
  };

  this.dfcommand_help.description = ui_strings.S_REPL_HELP_COMMAND_DESC;

  this.dfcommand_man = this.dfcommand_help; // man is alias for help

  this.dfcommand_jquery = function(view, data, service)
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
  }
  this.dfcommand_jquery.description = ui_strings.S_REPL_JQUERY_COMMAND_DESC;

  this.init();
};
