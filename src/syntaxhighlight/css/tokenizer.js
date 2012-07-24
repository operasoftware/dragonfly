window.cls = window.cls || {};

cls.CSSTokenizer = function()
{
  const CR = "\r";
  const LF = "\n";
  const BS = "\\";
  const OP_BRACKET = "{";
  const CL_BRACKET = "}" ;
  const _escapes_re = /\\[0-9a-f]{1,6}/i;

  this._EOL_buffer = "";
  this._buffer = "";
  this._current_pos = 0;
  this._escape_sequence = "";
  this.ontoken = function(){};
  this._token_type = cls.CSSTokenizer.types.WHITESPACE;
  this._token_buffer = "";
  this._sq_brackets = [];
  this._state_handler = {};
  this._state_cache = [];
  this._quote_literal = "";


  this.normalize_token = function(token)
  {
    // check dom.js and helpers.js for trim.
    // There are some inherent limitations in fromCharCode wrt
    // multibyte sequences, but this should work for all CSS keywords.
    return token.replace(_escapes_re, function(s,p1,p2){
      return String.fromCharCode(parseInt(p1,16))
    });
  }

  this.tokenize = function(input_buffer, ontoken)
  {
    this._state_handler = this._state_handlers.BEFORE_RULE;
    this._buffer = input_buffer;
    this._emitToken = ontoken;
    while ( this._state_handler !== this._state_handlers.EOF)
    {
        this._state_handler.apply(this);
    }

    this._state_handlers.EOF.apply(this);
  };

  this._init_state = function()
  {
      this._handle_escape_status();
      if (this._is_EOF())
      {
        return true;
      }
      if (this._is_EOL())
      {
        return true;
      }
      if (this._is_string())
      {
        return true;
      }
      if (this._is_comment())
      {
        return true;
      }
      return false;
  };

  this._handle_escape_status = function()
  {
    var c = this._buffer.charAt(this._current_pos);

    // if the current character is \, begin new escape sequence, unless
    // it is a literal
    if (c === "\\")
    {
      if (this._escape_sequence === "\\")
      {
        this._escape_sequence = "";
        return;
      }
      this._escape_sequence = c;
      return;
    }

    if (c in this._WHITESPACE)
    {
      this._escape_sequence = "";
      return;
    };

    if (c in this._EOL_CHARS)
    {
      return;
    };

    if (   (c in this._HEX_NUMBERS)
        && (this._escape_sequence.length)
        && (this._escape_sequence.length < 7)
    )
    {
        this._escape_sequence += c;
        return;
    }

    this._escape_sequence = "";
    return;

  };

  this._is_string = function()
  {
    var c = this._buffer.charAt(this._current_pos);
    if (c in this._QUOTES)
    {
      this._state_cache.unshift(this._state_handler);
      this._quote_literal = c;
      this._state_handler = this._state_handlers.QUOTED_STRING;
      this._token_buffer+=c;
      this._current_pos++;
      return true;
    }
    return false;
  }

  this._is_comment = function()
  {
    var c = this._buffer.charAt(this._current_pos);
    if (this._quote_literal)
    {
      return false;
    }
    if ((c === "/"))
    {
      var c2 = this._buffer.charAt(this._current_pos+1);
      if (c2 && (c2 === "*"))
      {
        this._state_cache.unshift(this._state_handler)
        this._current_pos+=2;
        this._emitToken(this._token_type,this._token_buffer);
        this._token_buffer = "/*"
        this._state_handler = this._state_handlers.COMMENT;
        return true;
      }
    }
    return false;
  }

  this._is_EOF = function()
  {
      if (this._current_pos >= this._buffer.length)
      {
          this._state_handler = this._state_handlers.EOF;
          return true;
      }
      return false;
  }

  this._is_EOL = function()
  {
    var c = this._buffer.charAt(this._current_pos);
    if (c === CR || c === LF)
    {
      this._state_cache.unshift(this._state_handler);
      this._state_handler = this._state_handlers.EOL;
      return true;
    }
    return false;
  }

  this._WHITESPACE =
  {
      ' ': 1,
      '\t': 1,
  };

  this._HEX_NUMBERS =
  {
    '1' : 1, '2' : 1, '3' : 1, '4' : 1, '5' : 1, '6' : 1, '7' : 1, '8' : 1,
    '9' : 1, '0' : 1, 'a' : 1, 'b' : 1, 'c' : 1, 'd' : 1, 'e' : 1, 'f' : 1,
    'A' : 1, 'B' : 1, 'C' : 1, 'D' : 1, 'E' : 1, 'F' : 1
  };

  this._QUOTES =
  {
      '"': 1,
      '\'': 1
  };

  this._EOL_CHARS =
  {
    '\n': 1,
    '\r': 1
  }

  this._PUNCTUATION =
  {
    '.': 1,
    ',': 1,
    ';': 1,
    ':': 1,
  }

  this._BRACES =
  {
    '(': 1,
    ')': 1,
    '{': 1,
    '}': 1,
  }

  this._state_handlers = {

      EOF: function(){
        // Currently, this doesn't try to balance output braces, brackets and strings
        this._emitToken(this._token_type, this._token_buffer)
        this._emitToken(999,"")
        return false;
      },

      EOL: function()
      {
        this._handle_escape_status();
        // First invocation, guarantees that we
        // leave this state with empty token buffer
        var c = this._buffer.charAt(this._current_pos);
        if (this._token_buffer.length)
        {
            this._emitToken(this._token_type,this._token_buffer)
            this._token_buffer = "";
        }

        if (c === CR)
        {
          // If in quote context && no escape, close quote
          // otherwise, keep open
          // current token type is kept, but if unmatched quote, emit_with_error

          // if next == LF emit CRLF token, advance cursor by two
          // else emit CR, advance cursor
          this._EOL_buffer += "\r";
          this._current_pos++;
          if (!this._is_EOF())
          {
            if (this._buffer.charAt(this._current_pos) == LF)
            {
              this._EOL_buffer += LF;
              this._current_pos++;
            }
          }
          this._emitToken(cls.CSSTokenizer.types.EOL_DATA, this._EOL_buffer);
          this._EOL_buffer = "";
          this._state_handler = this._state_cache.shift();
          return false;
        }
        // At this stage, we only have LF
        this._EOL_buffer += LF;
        this._current_pos++;
        // Bad lineshift, next line is garbage
        if ((!this._escape_sequence) && (this._quote_literal))
        {
            this._quote_literal="";
            this._state_cache.shift(); // Throw away the string handler
        }
        this._emitToken(cls.CSSTokenizer.types.EOL_DATA,LF);
        this._EOL_buffer = "";
        // Switch to whatever state we were in prior to EOL
        this._state_handler = this._state_cache.shift();
        return false;
      },

      COMMENT: function()
      {
        this._token_type = cls.CSSTokenizer.types.COMMENT;
        if (this._is_EOF())
        {
          return false;
        }
        if (this._is_EOL())
        {
          return false;
        }
        var c = this._buffer.charAt(this._current_pos++)
        if (c === "*")
        {
          if (this._buffer.charAt(this._current_pos) == "/")
          {
            this._current_pos++;
            this._token_buffer+="*/";
            this._emitToken(this._token_type,this._token_buffer);
            this._token_buffer = "";
            this._state_handler = this._state_cache.shift();
            return false;
          }
        }
        this._token_buffer += c;
        return false;
      },

      BEFORE_RULE: function()
      {
        this._token_type = cls.CSSTokenizer.types.WHITESPACE;
        if (this._init_state())
        {
          return false;
        }
        var c = this._buffer.charAt(this._current_pos++)
        if (c in this._WHITESPACE)
        {
          this._token_buffer += c;
          return false;
        }
        // Leaving state, emit whatever we now have as selector, even if it's just whitespace
        this._emitToken(this._token_type, this._token_buffer);
        this._token_buffer = c;
        if (c === "@")
        {
          this._state_handler = this._state_handlers.BEFORE_AT_RULE;
          return false;
        }

        if (c === "{")
        {
          this._state_handler = this._state_handlers.PROPERTY;
          this._emitToken(cls.CSSTokenizer.types.DECLARATION_BLOCK_START, "{");
          this._token_buffer = "";
          return false;
        }

        this._state_handler = this._state_handlers.SELECTOR;
        return false;
      },

      SELECTOR: function()
      {
        this._token_type = cls.CSSTokenizer.types.SELECTOR;
        if (this._init_state())
        {
          return false;
        }
        var c = this._buffer.charAt(this._current_pos++);
        if (c === "{")
        {
          this._emitToken(this._token_type ,this._token_buffer)
          this._state_handler = this._state_handlers.BEFORE_PROPERTY;
          this._emitToken(cls.CSSTokenizer.types.DECLARATION_BLOCK_START, "{");
          this._token_buffer = "";
          return false;
        }
        this._token_buffer+=c;
        return false;
      },

      BEFORE_PROPERTY: function()
      {
        if (this._init_state())
        {
          return false;
        }
        var c = this._buffer.charAt(this._current_pos++);
        if (c in this._WHITESPACE)
        {
          this._token_buffer += c;
          return false;
        }
        if (c === ";")
        {
          this._emitToken(cls.CSSTokenizer.types.DECLARATION_TERMINATOR, c)
          this._token_buffer = "";
          return false;
        }
        if (c === ":")
        {
          this._emitToken(cls.CSSTokenizer.types.PROPERTY_SEPARATOR,c);
          this._token_buffer = "";
          this._state_handler = this._state_handlers.PROPERTY_VALUE;
          return false;
        }
        if (c === "}")
        {
          this._emitToken(cls.CSSTokenizer.types.WHITESPACE, this._token_buffer);
          this._emitToken(cls.CSSTokenizer.types.DECLARATION_BLOCK_END,c)
          this._token_buffer = "";
          this._state_handler = this._state_handlers.BEFORE_RULE;
          return false;
        }
        this._emitToken(cls.CSSTokenizer.types.WHITESPACE, this._token_buffer);
        this._token_buffer = c;
        this._state_handler = this._state_handlers.PROPERTY;
        return false;
      },

      PROPERTY: function()
      {
        this._token_type =  cls.CSSTokenizer.types.PROPERTY;
        if (this._init_state())
        {
          return false;
        }
        var c = this._buffer.charAt(this._current_pos++);
        if (c === "}")
        {
          this._emitToken(cls.CSSTokenizer.types.PROPERTY, this._token_buffer);
          this._emitToken(cls.CSSTokenizer.types.DECLARATION_BLOCK_END, "}")
          this._token_buffer = "";
          this._state_handler = this._state_handlers.BEFORE_RULE;
          return false;
        }
        if (c == ";")
        {
          this._emitToken(cls.CSSTokenizer.types.PROPERTY, this._token_buffer);
          this._emitToken(cls.CSSTokenizer.types.DECLARATION_TERMINATOR, ";")
          this._token_buffer = "";
          this._state_handler == this._state_handlers.BEFORE_PROPERTY;
          return false;
        }
        if (c !== ":")
        {
          this._token_buffer += c;
          return false;
        }
        this._emitToken(cls.CSSTokenizer.types.PROPERTY, this._token_buffer);
        this._emitToken(cls.CSSTokenizer.types.PROPERTY_SEPARATOR, ":");
        this._token_buffer = "";
        this._state_handler = this._state_handlers.PROPERTY_VALUE;
        return false;
      },

      PROPERTY_VALUE: function()
      {
        this._token_type =  cls.CSSTokenizer.types.PROPERTY_VALUE;
        if (this._init_state())
        {
          return false;
        }

        var c = this._buffer.charAt(this._current_pos++);
        if (c === ";")
        {
          this._emitToken(this._token_type, this._token_buffer);
          this._emitToken(cls.CSSTokenizer.types.DECLARATION_TERMINATOR, ";")
          this._token_buffer = "";
          this._state_handler = this._state_handlers.BEFORE_PROPERTY;
          return false;
        }
        if (c === "}")
        {
          this._emitToken(this.token_type, this._token_buffer);
          this._emitToken(cls.CSSTokenizer.types.DECLARATION_BLOCK_END, "}")
          this._token_buffer = "";
          this._state_handler = this._state_handlers.BEFORE_RULE;
          return false;
        }
        this._token_buffer+=c;
        return false;
      },

      BEFORE_AT_RULE: function()
      {
        this._token_type = cls.CSSTokenizer.types.AT_RULE;
        if (this._init_state())
        {
          return false;
        }
        // Buffer contains @
        var c = this._buffer.charAt(this._current_pos);

        var needle = "charset";
        var haystack = this._buffer.substr(this._current_pos, needle.length);
        if (needle == haystack)
        {
          this._current_pos += needle.length;
          this._token_buffer += needle;
          this._state_handler = this._state_handlers.CHARSET_RULE;
          return false;
        }
        this._current_pos++;
        this._token_buffer+=c;
        this._state_handler = this._state_handlers.AT_RULE;
        return false;
      },


      CHARSET_RULE: function()
      {
        this._token_type = cls.CSSTokenizer.types.AT_RULE;
        if (this._init_state())
        {
          return false;
        }
        var c = this._buffer.charAt(this._current_pos++);
        this._token_buffer +=c;

        if (c === ";")
        {
          this._emitToken(this._token_type, this._token_buffer)
          this._state_handler = this._state_handlers.BEFORE_RULE;
          this._token_buffer = "";
          return false;
        }
        return false;
      },

      AT_RULE: function()
      {
        if (this._init_state())
        {
          return false;
        }
        var c = this._buffer.charAt(this._current_pos++);
        if ( c === ";")
        {
          this._emitToken(cls.CSSTokenizer.types.AT_RULE, this._token_buffer)
          this._emitToken(cls.CSSTokenizer.types.DECLARATION_TERMINATOR, ";")
          this._state_handler = this._state_handlers.BEFORE_RULE;
          this._token_buffer = "";
          return false;
        }
        if ( c === "{")
        {
          this._emitToken(cls.CSSTokenizer.types.AT_RULE, this._token_buffer);
          this._emitToken(cls.CSSTokenizer.types.DECLARATION_BLOCK_START, "{");
          // Fix for DFL-1844,
          if (this.normalize_token(this._token_buffer).trim().toLowerCase() == "@font-face")
          {
            this._state_handler = this._state_handlers.BEFORE_PROPERTY;
          }
          else
          {
            this._state_handler = this._state_handlers.BEFORE_RULE;
          }
          this._token_buffer = "";
          return false;
        }

        this._token_buffer+=c;
        return false;
      },

      QUOTED_STRING: function()
      {
        this._handle_escape_status();
        if (this._is_EOF())
        {
          return false;
        }
        if (this._is_EOL())
        {
          return false;
        }
        var c = this._buffer.charAt(this._current_pos++);
        if (c === this._quote_literal)
        {
          this._state_handler = this._state_cache.shift();
          this._token_buffer+=c;
          this._quote_literal = "";
          return false;
        }
        this._token_buffer +=c;
        return false;
      }
    }
}

cls.CSSTokenizer.types = {

    SELECTOR                    : 1,
    AT_RULE                     : 2,
    WHITESPACE                  : 4,

    PROPERTY                    : 101,
    PROPERTY_SEPARATOR          : 102,
    PROPERTY_VALUE              : 103,
    DECLARATION_TERMINATOR      : 104,
    DECLARATION_BLOCK_START     : 105,
    DECLARATION_BLOCK_END       : 106,

    COMMENT                     : 201,
    SGML_COMMENT_DELIM          : 202,

    INVALID                     : 401,
    INVALID_SELECTOR            : 402,
    INVALID_PROPERTY            : 403,
    INVALID_PROPERTY_VALUE      : 404,

    EOL_DATA                    : 500,
    EOF                         : 999
};
