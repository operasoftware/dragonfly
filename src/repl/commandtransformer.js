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
  this.commandTable = {};

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

    for (name in this) {
      var commandName = name.split("hostcommand_")[1];

      if (commandName) {
        this.commandTable[commandName] = this[name];
      }
    }
  };

  this.transform = function(source) {
    var types = [];
    var values = [];
    var tokens = [];
    this.parser.parse(source, values, types);

    // make a more straightforward representation of tokens. Command line
    // stuff is small, so the cost of this doesn't matter much.
    tokens = this.zip_tokens(types, values);

    dirty: // we jump back here if we need to re-process all tokens
    for (var n=0, token; token=tokens[n]; n++) {
      if (token.type == IDENTIFIER && token.value in this.commandTable) {
        var fun = this.commandTable[token.value];
        if (fun.call(this, token, tokens)) {
          break dirty;
        }
      }
    }
    return tokens.map(function(e) {return e.value;}).join("");
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
   * called by looking at the following tokens.
   */
  this.is_call = function(tokens, index) {
    if (!tokens[index] || tokens[index].type != IDENTIFIER) {
      return false;
    }

    for (var n=index+1, token; token=tokens[n]; n++) {
      switch (token.type) {
        case WHITESPACE:
          continue;
        case PUNCTUATOR:
        if (token.value == "(") { return true; }
        default:
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
      switch (token.type) {
        case WHITESPACE:
          continue;
        case PUNCTUATOR:
          if (token.value == ".") { break; }
        default:
          return false;
      }
    }

    for (var token; token=tokens[n]; n--) {
      switch (token.type) {
        case WHITESPACE:
          continue;
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

    token.value = "console.dir";
  };

  this.hostcommand_dirxml = function(token, tokenlist) {
    var index = tokenlist.indexOf(token);

    if (!this.is_call(tokenlist, index) ||
         this.is_property_of("console", tokenlist, index)) {
      return;
    }

    token.value = "console.dirxml";
  };

  this.hostcommand_$ = function(token, tokenlist) {
    var index = tokenlist.indexOf(token);

    if (this.is_call(tokenlist, index)) {
      token.value = "document.getElementById";
    }
  };

  this.hostcommand_$$ = function(token, tokenlist) {
    var index = tokenlist.indexOf(token);

    if (this.is_call(tokenlist, index)) {
      token.value = "document.querySelectorAll";
    }
  };

  this.hostcommand_$x = function(token, tokenlist) {
    //xpath thingy
  };

  this.hostcommand_keys = function(token, tokenlist) {
    var funstr = "(function(o) {var arr=[]; for (key in o) {arr.push(key)}; return arr})";
    token.value = funstr;
  };

  this.hostcommand_values = function(token, tokenlist) {
    var funstr = "(function(o) {var arr=[]; for (key in o) {arr.push(o[key])}; return arr})";
    token.value = funstr;
  };

  this.replcommand_clear = function(token, tokenlist, data)
  {
    data.clear_log();
    return true;
  };

  this.init();
}
