"use strict";

window.cls = window.cls || {};

cls.HTTPHeaderTokenizer = function()
{
  this._buffer = "";
  this._current_pos = 0;
  this._token_buffer = "";
  this._state_handler = {};
};

cls.HTTPHeaderTokenizerPrototype = function()
{
  var PUNCTUATOR = ":";
  var WHITESPACE_CHARS = {
    "\u0009": 1, //  Tab <TAB>
    "\u0020": 1  //  Space <SP>
  };
  var LINEBREAK_CHARS = {
    "\r": 1, // CR
    "\n": 1  // LF
  };

  this.tokenize = function(input_buffer, ontoken)
  {
    this._state_handler = this._state_handlers.FIRST_LINE_PART;
    this._buffer = input_buffer;
    this._emitToken = ontoken;
    while (this._state_handler !== this._state_handlers.EOF)
      this._state_handler.apply(this);

    this._state_handlers.EOF.apply(this);
  };

  this._state_handlers =
  {
    FIRST_LINE_PART: function()
    {
      if (this._is_EOF())
        return false;

      var c = this._buffer.charAt(this._current_pos++);
      this._token_type = cls.HTTPHeaderTokenizer.types.FIRST_LINE_PART;
      if (c in WHITESPACE_CHARS)
      {
        this._emitToken(this._token_type, this._token_buffer);
        this._token_buffer = "";
      }
      else if (c in LINEBREAK_CHARS)
      {
        this._emitToken(this._token_type, this._token_buffer);
        this._token_buffer = "";
        this._state_handler = this._state_handlers.NAME;
      }
      this._token_buffer += c;
    },
    NAME: function()
    {
      if (this._is_EOF())
        return false;

      var c = this._buffer.charAt(this._current_pos++);
      this._token_type = cls.HTTPHeaderTokenizer.types.NAME;
      if (c === PUNCTUATOR)
      {
        this._emitToken(this._token_type, this._token_buffer);
        this._emitToken(cls.HTTPHeaderTokenizer.types.PUNCTUATOR, c);
        this._token_buffer = "";
        this._state_handler = this._state_handlers.VALUE;
        return false;
      }
      this._token_buffer += c;
    },
    VALUE: function()
    {
      if (this._is_EOF())
        return false;

      var c = this._buffer.charAt(this._current_pos++);
      this._token_type = cls.HTTPHeaderTokenizer.types.VALUE;
      // LINEBREAK_CHARS only mean switching to header when the following char is not whitespace. They
      // are added to the NAME tokens, since the purpose of the tokenizer is mostly visual highlighting.
      if (c in LINEBREAK_CHARS && !(this._buffer.charAt(this._current_pos) in WHITESPACE_CHARS))
      {
        this._emitToken(this._token_type, this._token_buffer);
        this._token_buffer = "";
        this._state_handler = this._state_handlers.NAME;
      }
      this._token_buffer += c;
    },
    EOF: function()
    {
      this._emitToken(this._token_type, this._token_buffer);
    }
  };

  this._is_EOF = function()
  {
    if (this._current_pos >= this._buffer.length)
    {
      this._state_handler = this._state_handlers.EOF;
      return true;
    }
    return false;
  };
};

cls.HTTPHeaderTokenizer.prototype = new cls.HTTPHeaderTokenizerPrototype();

cls.HTTPHeaderTokenizer.types = {
  FIRST_LINE_PART: 1,
  NAME: 2,
  VALUE: 3,
  PUNCTUATOR: 4
};

(function(types) {
  var classnames = cls.HTTPHeaderTokenizer.classnames = {};
  classnames[types.FIRST_LINE_PART] = "first_line_part";
  classnames[types.NAME] = "name";
  classnames[types.VALUE] = "value";
  classnames[types.PUNCTUATOR] = "punctuator";
})(cls.HTTPHeaderTokenizer.types);

cls.HTTPHeaderTokenizer.TokenStateholder = function(data_spec_firstline_tokens)
{
  this.data_spec_firstline_tokens = data_spec_firstline_tokens;
  this.firstline_tokens = 0;
};
