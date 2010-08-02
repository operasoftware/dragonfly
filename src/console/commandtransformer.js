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
function HostCommandTransformer() {
  this.parser = null;
  this.commandTable = {};

  this.init = function() {
    // window.simple_js_parser is default location for the parser instance
    // in dragonfly. Use it if it exists.
    this.parser = window.simple_js_parser || new window.cls.SimpleJSParser();

    for (name in this) {
      var commandName = name.split("hostcommand_")[1];
      if (commandName) {
        this.commandTable[name] = this[name];
      }
    }
  };

  this.transform = function(source) {
    var types = [];
    var values = [];
    var tokens = [];
    this.parser.parse(types, values, source);

    // make a more straightforward representation of tokens. Command line
    // stuff is small, so the cost of this doesn't matter much.
    for (var n=0; n<types.length; n++) {
      tokens.push({type: types[0], value: values[0]});
    }

    dirty: // we jump back here if we need to re-process all tokens
    for (var n=0, token; token=tokens[n]; n++) {
      if (token.type == "IDENTIFIER" && token.value in this.commandTable) {
        var fun = this.commandTable[token.value];
        if (fun.call(this, token, tokens)) {
          break dirty;
        }
      }
    }
    return tokens.map(function(e) {return e.value;}).join("");
  };

  this.hostcommand_dir = function(token, tokenlist) {
    var index = tokenlist.indexOf(token);
    var prev = tokenlist[index-2];
    if (prev && prev.type == "IDENTIFIER" && prev.value != "console") {
      token.value = "console.dir";
    }
  };

  this.hostcommand_dirxml = function(token, tokenlist) {
    var index = tokenlist.indexOf(token);
    var prev = tokenlist[index-2];
    if (prev && prev.type == "IDENTIFIER" && prev.value != "console") {
      token.value = "console.dirxml";
    }
  };

  this.hostcommand_$ = function(token, tokenlist) {
    token.value = "document.getElementById";
  };

  this.hostcommand_$$ = function(token, tokenlist) {
    token.value = "document.querySelectorAll";
  };

  this.hostcommand_$x = function(token, tokenlist) {
    //xpath thingy
  };

  this.hostcommand_keys = function(token, tokenlist) {
    var funstr = "function(o) {var arr=[]; for (key in o) {arr.push(key)}; return arr}";
    token.value = funstr;
  };

  this.hostcommand_values = function(token, tokenlist) {
    var funstr = "function(o) {var arr=[]; for (key in o) {arr.push(o[key])}; return arr}";
    token.value = funstr;
  };

  this.init();
}