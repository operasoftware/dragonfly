"use strict";

/**
 * @constructor
 *
 * Tokenize a single CSS value.
 *
 * @parameters {Boolean} throw_on_error Whether or not to throw on errors.
 *
 * Example usage:
 *
 *   var css_value_tokenizer = new CssValueTokenizer();
 *   var tokens = [];
 *   css_value_tokenizer.tokenize("1px solid", function(type, value) {
 *     tokens.push([type, value]); // type is a constant in CssValueTokenizer.types
 *   });
 *   console.log(tokens); // [[7, "1px"], [3, " "], [5, "solid"]]
 *
 * Caveats:
 * - All numbers with units (including '%') are reported as DIMENSION,
 *   even if the unit is not a recognized unit from the specification.
 * - Does not handle escaping.
 * - Does not handle comments in all cases, see next point.
 * - According to the specification e.g. `-1` is treated as two separate
 *   tokens. It is for example possible to put a comment between the `-`
 *   and the `1` according to spec. This is arguably not very useful, and
 *   this tokenizer will handle it as one token.
 * - Some other small limitations. For example, it accepts `1%%` as a
 *   valid dimension.
 */
var CssValueTokenizer = function(throw_on_error)
{
  this._throw_on_error = Boolean(throw_on_error);
};

CssValueTokenizer.prototype = new function()
{
  var WHITESPACE_CHARS = /[ \t\r\n\f]/;
  var STRING_CHARS = /["']/;
  var NUM_CHARS = /[\d\.]/;
  var HEX_CHARS = /[0-9a-f]/i;
  var IDENT_START_CHARS = /[a-z-]/i;
  var IDENT_CHARS = /[a-z0-9-]/i;
  var UNARY_OP_CHARS = /[-+]/;
  var UNIT_CHARS = /[a-z%]/i;

  this._states = {
    DEFAULT: 1,
    INSIDE_FUNCTION: 2
  };

  /**
   * Tokenize a single CSS value.
   *
   * @param {String} value The CSS value to tokenize.
   * @param {Function} ontoken Callback function to call for each token.
   */
  this.tokenize = function(value, ontoken)
  {
    this._state = this._states.DEFAULT;
    this._buffer = value;
    this._ontoken = ontoken;
    this._position = 0;
    this._token_val = "";
    this._function_stack = 0;

    while (this._position < this._buffer.length)
    {
      this._parse(this._buffer[this._position]);
    }
  };

  this._emit_token = function(type)
  {
    this._ontoken(type, this._token_val);
    this._token_val = "";
  };

  this._throw_error = function(msg)
  {
    if (!this._throw_on_error)
      return;

    var dashes = (new Array(this._position + 1)).join("-");
    throw msg + ":\n" +
          this._buffer + "\n" +
          dashes + "^";
  };

  this._parse = function(c)
  {
    if (WHITESPACE_CHARS.test(c))
    {
      this._parse_whitespace(c);
    }
    else if (NUM_CHARS.test(c) || UNARY_OP_CHARS.test(c))
    {
      this._parse_number(c);
    }
    else if (IDENT_START_CHARS.test(c))
    {
      this._parse_identifier(c);
    }
    else if (STRING_CHARS.test(c))
    {
      this._parse_string(c);
    }
    else if (c == "#")
    {
      this._parse_hexcolor(c);
    }
    else if (c == "/" || c == ",")
    {
      this._parse_operator(c);
    }
    else
    {
      this._parse_unkown(c);
    }
  };

  this._parse_whitespace = function(c)
  {
    while (c && WHITESPACE_CHARS.test(c))
    {
      this._token_val += c;
      c = this._buffer[++this._position];
    }
    this._emit_token(CssValueTokenizer.types.WHITESPACE);
  };

  this._parse_string = function(c)
  {
    var next_escaped = false;
    var open_quote = c;
    this._token_val = c;
    c = this._buffer[++this._position];

    while (c)
    {
      this._token_val += c;
      this._position++;
      if (c == open_quote && !next_escaped)
        break;
      next_escaped = (!next_escaped && c == "\\");
      c = this._buffer[this._position];
    }

    if (this._token_val.length < 2 || this._token_val.slice(-1) != open_quote)
      this._throw_error("Unterminated string");

    this._emit_token(CssValueTokenizer.types.STRING);
  };

  this._parse_hexcolor = function(c)
  {
    this._token_val = c;
    c = this._buffer[++this._position];

    while (c && HEX_CHARS.test(c))
    {
      this._token_val += c;
      c = this._buffer[++this._position];
      if (this._token_val.length > 7)
        break;
    }

    // Length should be "#" + 3 or 6 hex chars
    if (this._token_val.length != 4 || this._token_val.length != 7)
      this._throw_error("Invalid hex color");

    this._emit_token(CssValueTokenizer.types.HEX_COLOR);
  };

  this._parse_number = function(c)
  {
    while (c)
    {
      if (NUM_CHARS.test(c) || UNARY_OP_CHARS.test(c))
      {
        if (c == "." && this._token_val.indexOf(".") != -1)
          this._throw_error("Invalid number");
      }
      else if (/\d/.test(this._token_val) && UNIT_CHARS.test(c))
      {
        this._parse_dimension(c);
        return;
      }
      else if (IDENT_CHARS.test(c))
      {
        this._parse_identifier(c);
        return;
      }
      else
      {
        break;
      }
      this._token_val += c;
      c = this._buffer[++this._position];
    }

    this._emit_token(CssValueTokenizer.types.NUMBER);
  };

  this._parse_dimension = function(c)
  {
    while (c)
    {
      this._token_val += c;
      c = this._buffer[++this._position];
      if (!UNIT_CHARS.test(c))
        break;
    }

    this._emit_token(CssValueTokenizer.types.DIMENSION);
  };

  this._parse_function = function(c)
  {
    this._state = this._states.INSIDE_FUNCTION;
    this._function_stack++;
    this._token_val += c;
    this._emit_token(CssValueTokenizer.types.FUNCTION_START);
    c = this._buffer[++this._position];

    while (c)
    {
      if (c == ")")
      {
        this._token_val += c;
        this._position++;
        break;
      }
      this._parse(c);
      c = this._buffer[this._position];
    }

    if (this._token_val[0] != ")")
      this._throw_error("Malformed function syntax");

    this._emit_token(CssValueTokenizer.types.FUNCTION_END);
    if (--this._function_stack == 0)
      this._state = this._states.DEFAULT;
  };

  this._parse_identifier = function(c)
  {
    while (c)
    {
      if (IDENT_CHARS.test(c))
      {
        this._token_val += c;
        c = this._buffer[++this._position];
      }
      else if (c == "(")
      {
        this._parse_function(c);
        return;
      }
      else
      {
        break;
      }
    }

    this._emit_token(CssValueTokenizer.types.IDENT);
  };

  this._parse_operator = function(c)
  {
    this._token_val = c;
    if (this._buffer[this._position+1] == "*")
    {
      this._parse_comment(c);
      return;
    }
    this._position++;
    var state = this._state == this._states.DEFAULT
              ? CssValueTokenizer.types.OPERATOR
              : CssValueTokenizer.types.OPERATOR_IN_FUNCTION;
    this._emit_token(state);
  };

  this._parse_comment = function(c)
  {
    this._token_val = "";

    while (c)
    {
      this._token_val += c;
      c = this._buffer[++this._position];
      if (this._token_val.length >= 4 &&
          this._token_val.slice(-2) == "*\/"
      )
      {
        break;
      }
    }

    if (this._token_val.length < 4 || this._token_val.slice(-2) != "*\/")
      this._throw_error("Unterminated comment");

    this._emit_token(CssValueTokenizer.types.COMMENT);
  };

  // We should never end up here (ya, right!), but if we do, consume one
  // character and keep on tokenizing
  this._parse_unkown = function(c)
  {
    this._token_val = c;
    this._position++;
    this._emit_token(CssValueTokenizer.types.UNKNOWN);
  };
};

CssValueTokenizer.types = {
  UNKNOWN: 0,
  OPERATOR: 1,
  OPERATOR_IN_FUNCTION: 2,
  WHITESPACE: 3,
  STRING: 4,
  IDENT: 5,
  NUMBER: 6,
  DIMENSION: 7,
  HEX_COLOR: 8,
  FUNCTION_START: 9,
  FUNCTION_END: 10,
  COMMENT: 11
};

