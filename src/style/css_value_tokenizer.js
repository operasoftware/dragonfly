/**
 * @constructor
 *
 * Tokenize a single CSS value.
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
 *   even if the unit is a recognized unit from the specification.
 * - Does not handle escaping.
 * - Does not handle comments in all cases, see next point.
 * - According to the specification e.g. `-1` is treated as two separate
 *   tokens. It is for example possible to put a comment between the `-`
 *   and the `1` according to spec. This is arguably not very useful, and
 *   this tokenizer will handle it as one token.
 * - Some other small limitations. For example, it accepts `1%%` as a
 *   valid dimension.
 */
var CssValueTokenizer = function()
{
  var WHITESPACE_CHARS = /[ \t\r\n\f]/;
  var STRING_CHARS = /["']/;
  var NUM_CHARS = /[\d\.]/;
  var HEX_CHARS = /[0-9a-f]/i;
  var IDENT_START_CHARS = /[a-z-]/i;
  var IDENT_CHARS = /[a-z0-9-]/i;
  var UNARY_OP_CHARS = /[-+]/i;
  var UNIT_CHARS = /[a-z%]/i;
  var IMPORTANT_DECLARATION = /^!\s*important$/i;

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
    this._important_declaration_seen = false;

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
    else if (c == "!")
    {
      this._parse_important_declaration(c);
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
    while (WHITESPACE_CHARS.test(c))
    {
      this._token_val += c;
      c = this._buffer[++this._position];
    }
    this._emit_token(CssValueTokenizer.types.WHITESPACE);
  };

  this._parse_string = function(c)
  {
    this._token_val = c;
    var open_quote = c;
    var prev_char = "";
    c = this._buffer[++this._position];

    while (c)
    {
      this._token_val += c;
      this._position++;
      if (c == open_quote && prev_char != "\\")
      {
        break;
      }
      prev_char = c;
      c = this._buffer[this._position];
    }

    if (this._token_val.length < 2 || this._token_val.slice(-1) != open_quote)
    {
      this._throw_error("Unterminated string");
    }

    this._emit_token(CssValueTokenizer.types.STRING);
  };

  this._parse_hexcolor = function(c)
  {
    this._token_val = c;
    c = this._buffer[++this._position];

    while (HEX_CHARS.test(c))
    {
      this._token_val += c;
      c = this._buffer[++this._position];
      if (this._token_val.length > 7)
      {
        break;
      }
    }

    // Length should be "#" + 3 or 6 hex chars
    if (!(this._token_val.length == 4 || this._token_val.length == 7))
    {
      this._throw_error("Invalid hex color");
    }

    this._emit_token(CssValueTokenizer.types.HEX_COLOR);
  };

  this._parse_number = function(c)
  {
    while (c)
    {
      if (NUM_CHARS.test(c) || UNARY_OP_CHARS.test(c))
      {
        if (c == "." && this._token_val.indexOf(".") != -1)
        {
          this._throw_error("Invalid number");
        }
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
      {
        break;
      }
    }

    this._emit_token(CssValueTokenizer.types.DIMENSION);
  };

  this._parse_function = function(c)
  {
    this._state = this._states.INSIDE_FUNCTION;
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
    {
      this._throw_error("Malformed function syntax");
    }

    this._emit_token(CssValueTokenizer.types.FUNCTION_END);
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

  // Handles whitespace between `!` and `important`, but not comments
  this._parse_important_declaration = function(c)
  {
    if (this._important_declaration_seen)
    {
      this._throw_error("Extra !important declaration seen");
    }

    while (c)
    {
      this._token_val += c;
      // TODO: maybe this can be made a bit nicer with regexp
      var substring = this._token_val.replace(/!\s*/, "");
      if (substring == "important".slice(0, substring.length))
      {
        c = this._buffer[++this._position];
        if (IMPORTANT_DECLARATION.test(this._token_val) && WHITESPACE_CHARS.test(c))
        {
          break;
        }
      }
      else
      {
        this._throw_error("Not a valid !important declaration");
      }
    }

    // TODO: this  repeats some code from above, rewrite a bit
    if (this._token_val.replace(/!\s*/, "") != "important")
    {
      this._throw_error("Not a valid !important declaration");
    }

    this._important_declaration_seen = true;
    this._emit_token(CssValueTokenizer.types.IMPORTANT_DECLARATION);
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
    {
      this._throw_error("Unterminated comment");
    }

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
  IMPORTANT_DECLARATION: 11,
  COMMENT: 12
};

