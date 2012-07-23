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
  this._clientcommands = {};
  this._dfcommands = {};
  this._hostcommands = {};
  this.parser = window.simple_js_parser || new window.cls.SimpleJSParser();


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
          this._hostcommands.hasOwnProperty(token[VALUE]))
      {
        var fun = this._hostcommands[token[VALUE]];
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
             this._clientcommands.hasOwnProperty(tokens[0][VALUE]))
    {
      return this._clientcommands[tokens[0][VALUE]];
    }

    if (tokens[0][TYPE] == COMMENT)
    {
      // regex matches "// command()" .
      // Whitespace is allowed inbetween most tokens
      var match = tokens[0][VALUE].match(/\s*\/\/\s*(\w+)\s*\(\s*\)\s*/);
      if (match)
      {
        var command = match[1];
        if (this._dfcommands.hasOwnProperty(command))
        {
          return this._dfcommands[command];
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
          if (!["=", ":", "?", "||", "&&", "(", ")"].contains(token[VALUE]))
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

  this._hostcommands.dir = function(token, tokenlist, index)
  {
    if (this.is_global_call(tokenlist, index))
      token[VALUE] = "(typeof dir == 'function' && dir || \
                       function(e) { return console.dir(e) })";
  };

  this._hostcommands.dirxml = function(token, tokenlist, index)
  {
    if (this.is_global_call(tokenlist, index))
      token[VALUE] = "(typeof dirxml == 'function' && dirxml || \
                       function(e) { return console.dirxml(e) })";
  };

  this._hostcommands.$ = function(token, tokenlist, index)
  {
    if (this.is_global_call(tokenlist, index))
      token[VALUE] = "(typeof $ == 'function' && $ || \
                       function(e) { return document.getElementById(e); })";
  };

  this._hostcommands.$$ = function(token, tokenlist, index)
  {
    if (this.is_global_call(tokenlist, index))
      token[VALUE] = "(typeof $$ == 'function' && $$ || \
                       function(e) { return document.querySelectorAll(e); })";
  };

  this._hostcommands.$x = function(token, tokenlist, index)
  {
    if (this.is_global_call(tokenlist, index))
      token[VALUE] = "(typeof $x == 'function' && $x || \
                       function(xpath, context)\
                       {\
                         context = context || document;\
                         var res = document.evaluate(xpath, context, null,\
                                                     XPathResult.ANY_TYPE, null);\
                         switch (res.resultType)\
                         {\
                         case XPathResult.NUMBER_TYPE:\
                           return res.numberValue;\
                         case XPathResult.STRING_TYPE:\
                           return res.stringValue;\
                         case XPathResult.BOOLEAN_TYPE:\
                           return res.booleanValue;\
                         default:\
                           var ret = [], ele = null;\
                           while (ele = res.iterateNext())\
                             ret.push(ele);\
                           return ret;\
                         }\
                       })";
  };

  this._hostcommands.keys = function(token, tokenlist, index)
  {
    if (this.is_global_call(tokenlist, index))
      token[VALUE] = "(typeof keys == 'function' && keys || \
                       function(o)\
                       {\
                         var arr = [], key;\
                         for (key in o) {arr.push(key)};\
                         return arr;\
                       })";
  };

  this._hostcommands.values = function(token, tokenlist, index)
  {
    if (this.is_global_call(tokenlist, index))
      token[VALUE] = "(typeof values == 'function' && values || \
                       function(o)\
                       {\
                         var arr = [], key;\
                         for (key in o) {arr.push(o[key])}\
                         return arr;\
                       })";
  };

  this._clientcommands.clear = function(view, data, input)
  {
    view._handle_action_clear();
  };

  this.register_dflcommands = function(commands)
  {
    for (var name in commands)
    {
      if (['command', 'description'].every(function(prop)
          {
            return commands[name].hasOwnProperty(prop);
          }))
      {
        this._dfcommands[name] = commands[name].command;
        this._dfcommands[name].description = commands[name].description;
        if (commands[name].hasOwnProperty('alias'))
          this._dfcommands[commands[name].alias] = this._dfcommands[name];
      }
      else
      {
        opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                        "not a valid DFL command " + name);
      }
    }
  };

};
