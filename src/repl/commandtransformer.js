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
 * commandline API (http://getfirebug.com/wiki/index.php/Command_Line_API)
 * 
 *   $(id)
 *   $$(selector)
 *   $x(xpath)
 *   $0
 *   $1
 *   $n(index)
 *   dir(object)
 *   dirxml(node)
 *   cd(window)
 *   clear()
 *   inspect(object[, tabName])
 *   keys(object)
 *   values(object)
 *   debug(fn)
 *   undebug(fn)
 *   monitor(fn)
 *   unmonitor(fn)
 *   monitorEvents(object[, types])
 *   unmonitorEvents(object[, types])
 *   profile([title])
 *   profileEnd()
 * 
 * console API (http://getfirebug.com/wiki/index.php/Console_API)
 * 
 *   console.log(object[, object, ...])
 *   console.debug(object[, object, ...])
 *   console.info(object[, object, ...])
 *   console.warn(object[, object, ...])
 *   console.error(object[, object, ...])
 *   console.assert(expression[, object, ...])
 *   console.clear()
 *   console.dir(object)
 *   console.dirxml(node)
 *   console.trace()
 *   console.group(object[, object, ...])
 *   console.groupCollapsed(object[, object, ...])
 *   console.groupEnd()
 *   console.time(name)
 *   console.timeEnd(name)
 *   console.profile([title])
 *   console.profileEnd()
 *   console.count([title])
 *   console.exception(error-object[, object, ...])
 *   console.table(data[, columns])
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
  COMMENT = window.cls.SimpleJSParser.COMMENT,
  TYPE = 0,
  VALUE = 1;

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
    var tokens = [];
    this.parser.tokenize(source, function(token_type, token)
    {
      tokens.push([token_type, token]);
    });

    for (var n = 0, token; token = tokens[n]; n++)
    {
      if (token[TYPE] == IDENTIFIER &&
          this.transform_map.hasOwnProperty(token[VALUE]))
      {
        var fun = this.transform_map[token[VALUE]];
        if (fun.call(this, token, tokens, n))
        {
          // re-process all tokens. do we really need this?
          n = -1;
        }
      }
    }
    
    return tokens.map(function(e) {return e[VALUE];}).join("");
  };

  this.get_command = function(source)
  {
    var tokens = [];
    this.parser.tokenize(source, function(token_type, token)
    {
      tokens.push([token_type, token]);
    });

    if (!tokens.length)
    {
      return null;
    }
    else if (this.is_global_call(tokens, 0) &&
             tokens[0][VALUE] in this.client_command_map)
    {
      return this.client_command_map[tokens[0][VALUE]];
    }

    if (tokens[0][TYPE] == COMMENT)
    {
      // regex matches "// command()" .
      // Whitespace is allowed inbetween most tokens
      var match = tokens[0][VALUE].match(/\s*\/\/\s*(\w+)\s*\(\s*\)\s*/);
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

  /**
   * Check if the token at index looks like it's a global function call.
   */
  this.is_global_call = function(tokens, index)
  {
    if (!tokens[index] || tokens[index][TYPE] != IDENTIFIER)
      return false;

    for (var n = index - 1, token; token = tokens[n]; n--)
      switch (token[TYPE])
      {
        case PUNCTUATOR:
          if (!["=", ":", "?", "||", "&&", "("].contains(token[VALUE]))
            return false;
          n = -1;
        case WHITESPACE:
          break;
        default:
          return false;
      }

    for (n = index + 1; token = tokens[n]; n++)
      switch (token[TYPE])
      {
        case WHITESPACE:
          break;
        case PUNCTUATOR:
          if (token[VALUE] == "(")
            return true;
        default:
          return false;
      }

    return false;
  };

  /**
   * Check if the token at index is a property of name
   */
  this.is_property_of = function(name, tokens, index) {
    if (!tokens[index] || tokens[index][TYPE] != IDENTIFIER) {
      return false;
    }

    var n = index-1;

    for (var token; token=tokens[n]; n--) {
      if (token[TYPE] == WHITESPACE)
      {
        continue;
      }
      else if (token[TYPE] == PUNCTUATOR && token[VALUE] == ".")
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
      switch (token[TYPE]) {
        case WHITESPACE:
          break;
        case IDENTIFIER:
          if (token[VALUE] == name) { return true; }
        default:
          return false;
      }
    }

    return false;
  };


  // Host commands:

  this.hostcommand_dir = function(token, tokenlist, index)
  {
    if (this.is_global_call(tokenlist, index))
      token[VALUE] = "(window.dir || function(e) { return console.dir(e)})";
  };

  this.hostcommand_dirxml = function(token, tokenlist, index)
  {
    if (this.is_global_call(tokenlist, index))
      token[VALUE] = "(window.dirxml || function(e) { return console.dirxml(e)})";
  };

  this.hostcommand_$ = function(token, tokenlist, index)
  {
    if (this.is_global_call(tokenlist, index))
      token[VALUE] = "(window.$ || function(e)\
                      {\
                        return document.getElementById(e);\
                      })";
  };

  this.hostcommand_$$ = function(token, tokenlist, index)
  {
    if (this.is_global_call(tokenlist, index))
      token[VALUE] = "(window.$$ || function(e)\
                      {\
                        return document.querySelectorAll(e);\
                      })";
  };

  this.hostcommand_$x = function(token, tokenlist, index)
  {
    if (this.is_global_call(tokenlist, index))
      token[VALUE] = "(window.$x || function(e)\
                      {\
                        var res = document.evaluate(e, document, null,\
                                                    XPathResult.ANY_TYPE, null);\
                        var ret = [], ele = null;\
                        while (ele = res.iterateNext())\
                          ret.push(ele);\
                        return ret;\
                      })";
  };

  this.hostcommand_keys = function(token, tokenlist, index)
  {
    if (this.is_global_call(tokenlist, index))
      token[VALUE] = "(window.keys || function(o)\
                     {\
                       var arr = [], key;\
                       for (key in o) {arr.push(key)};\
                       return arr;\
                     })";
  };

  this.hostcommand_values = function(token, tokenlist, index)
  {
    if (this.is_global_call(tokenlist, index))
      token[VALUE] = "(window.values || function(o)\
                     {\
                       var arr = [], key;\
                       for (key in o) {arr.push(o[key])}\
                       return arr;\
                     })";
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
