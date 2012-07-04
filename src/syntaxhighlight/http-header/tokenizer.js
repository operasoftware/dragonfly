"use strict";

window.cls = window.cls || {};

cls.HTTPHeaderTokenizer = function()
{
  var CR = "\r";
  var LF = "\n";
  var PUNCTUATOR = ":";
  var WHITESPACE_CHARS =
  {
    '\u0009': 1, //  Tab <TAB>
    '\u0020': 1, //  Space <SP>
  };

  this._buffer = "";
  this._current_pos = 0;
  this._token_buffer = "";
  this._state_handler = {};

  this.tokenize = function(input_buffer, ontoken)
  {
    this._state_handler = this._state_handlers.FIRST_LINE_PART;
    this._buffer = input_buffer;
    this._emitToken = ontoken;
    while (this._state_handler !== this._state_handlers.EOF)
    {
      this._state_handler.apply(this);
    }

    this._state_handlers.EOF.apply(this);
  };

  this._state_handlers = 
  {
    FIRST_LINE_PART: function()
    {
      if (this._is_EOF())
      {
        return false;
      }
      var c = this._buffer.charAt(this._current_pos++);
      this._token_type = cls.HTTPHeaderTokenizer.types.FIRST_LINE_PART;
      if (c in WHITESPACE_CHARS)
      {
        this._emitToken(this._token_type ,this._token_buffer);
        this._token_buffer = "";
        // For now, LF and whitespace add to the next token. Visually that makes no difference.
      }
      else
      if (c === LF)
      {
        this._emitToken(this._token_type ,this._token_buffer);
        this._token_buffer = "";
        this._emitToken(cls.HTTPHeaderTokenizer.types.LINE_SEPARATOR, c); // todo: don't emit your own token.
        this._state_handler = this._state_handlers.NAME;
        return false;
      }
      this._token_buffer += c;
    },
    NAME: function()
    {
      if (this._is_EOF())
      {
        return false;
      }
      var c = this._buffer.charAt(this._current_pos++);
      this._token_type = cls.HTTPHeaderTokenizer.types.NAME;
      if (c === PUNCTUATOR)
      {
        this._emitToken(this._token_type ,this._token_buffer);
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
      {
        return false;
      }
      var c = this._buffer.charAt(this._current_pos++);
      this._token_type = cls.HTTPHeaderTokenizer.types.VALUE;
      // LF only means switching to header when the following char is not whitespace.
      if (c === LF && !(this._buffer.charAt(this._current_pos) in WHITESPACE_CHARS))
      {
        this._emitToken(this._token_type ,this._token_buffer);
        this._token_buffer = "";
        this._state_handler = this._state_handlers.NAME;
        // For now, LF and whitespace add to the next token. Visually that makes no difference.
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
  }
}

cls.HTTPHeaderTokenizer.types = {
    FIRST_LINE_PART  : 1,
    NAME             : 2,
    VALUE            : 3,
    PUNCTUATOR       : 4,
    LINE_SEPARATOR   : 5
};
