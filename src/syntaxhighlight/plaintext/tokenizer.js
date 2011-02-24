window.cls = window.cls || {};

cls.TextTokenizer = function()
{
    this.CONFIG =
    {
      EOL_TOKENS: 1,
    }
    this._buffer = "";
    this._current_pos = 0;
    this._emitToken = null;
    this.ontoken = function(){}
    this._cached_state = null;
    
    this._is_EOF = function()
    {
        if (this._current_pos >= this._buffer.length)
        {
            this._tokenizer_state_handler = this._tokenizer_state_handlers.EOF;
            return true;
        }
        return false;
    }
    
    this._is_EOL = function()
    {
        
        var c = this._buffer.charCodeAt(this._current_pos);
        
        if (this.CONFIG.EOL_TOKENS)
        {
            if (c === 13 || c === 10)
            {
                this._cached_state = this._tokenizer_state_handler;
                this._tokenizer_state_handler = this._tokenizer_state_handlers.EOL;
                return true;
            }
            return false;
        }
        else
        {
            return false;
        }
    }

    this.tokenize = function(input_buffer, ontoken)
    {
        this._tokenizer_state_handler = this._tokenizer_state_handlers.DATA;
        this._buffer = input_buffer;
        this._emitToken = ontoken;
        while (  this._tokenizer_state_handler !== this._tokenizer_state_handlers.EOF)
        {
            this._tokenizer_state_handler.apply(this);
        } 

        this._tokenizer_state_handlers.EOF.apply(this);
    };
    
    this._tokenizer_state_handlers =
    {
      EOL: function()
      {
          // This handling causes a useless extra 
          if (this._tmp_buffer[1].length)
          {
              this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1]);
              this._tmp_buffer[1] = "";
          }
          
          var c = this._buffer.charCodeAt(this._current_pos)
          if (c === 13)
          {
              // if next == LF emit CRLF token, advance cursor by two
              // else emit CR, advance cursor
              this._EOL_buffer += "\r";
              this._current_pos++;
              if (!this._is_EOF())
              {
                  if (this._buffer.charCodeAt(this._current_pos) == 10)
                  {
                      this._EOL_buffer += "\n";
                      this._current_pos++;
                  }
              }
              this._emitToken(MarkupTokenizer.types.EOL_DATA, this._EOL_buffer);
              this._EOL_buffer = "";
              this._tokenizer_state_handler = this._cached_state;
              return false;
          
          }
          
          if (c === 10)
          {
              this._EOL_buffer += "\n";
              this._current_pos++;
              this._emitToken(MarkupTokenizer.types.EOL_DATA, this._EOL_buffer);
              this._EOL_buffer = "";
              this._tokenizer_state_handler = this._cached_state;
              return false;
          }
      },
      
      
      EOF: function(){
          this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1]);
          this._emitToken(MarkupTokenizer.types.EOF, '');
          return false;
      },
      
      DATA: function()
      {
        if (this._is_EOF())
        {
          return false;
        }
        if (this._is_EOL())
        {
          this._tokenizer_state_handler = this._tokenizer_state_handlers.DATA;
          return false;
        }
        
        var c = this._buffer[this._current_pos++];
        if (c in cls.TextTokenizer.WHITESPACE)
        {
          this._tmp_buffer[1] += c;
          this._tokenizer_state_handler = this._tokenizer_state_handlers.WHITESPACE;
          return false;
        }
        this._tmp_buffer[1] += c;
        return false;
        
      },
      
      WHITESPACE: function()
      {
        if (this._is_EOF())
        {
          return false;
        }
        if (this._is_EOL())
        {
          this._tokenizer_state_handler = this._tokenizer_state_handlers.DATA;
          return false;
        }
        
        var c = this._buffer[this._current_pos++];
        if (c in cls.TextTokenizer.WHITESPACE)
        {
          this._tmp_buffer[1] += c;
          return false;
        }

        const needles = [
          "file://",
          "http://",
          "https://"
        ]
        var needle,
            i = 0,
            _last_pos = this._current_pos-1>0?this._current_pos-1:0;
        for (i = 0; needle = needles[i++];)
        {
          if (this._buffer.substr(_last_pos,needle.length) === needle)
          {
            this._tokenizer_state_handler = this._tokenizer_state_handlers.URL;
            this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1]);
            this._tmp_buffer[0] = cls.TextTokenizer.types.URL;
            this._tmp_buffer[1] = c;
          }
              
        }

        this._tmp_buffer[1] += c;
        return false;
        
      },
      
      URL: function()
      {
        if (this._is_EOF())
        {
          return false;
        }
        if (this._is_EOL())
        {
          this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1]);
          this._tokenizer_state_handler = this._tokenizer_state_handlers.DATA;
          return false;
        }
        
        var c = this._buffer[this._current_pos++];
        if (c in cls.TextTokenizer.PUNCTUATION)
        {
          // perform lookahead
          var lookahead_c = this._buffer[this._current_pos+1]?this._buffer[this._current_pos+1]:false;
          if ((lookahead_c) && (lookahead_c in cls.TextTokenizer.WHITESPACE))
          {
            this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1]);
            this._tmp_buffer[0] = cls.TextTokenizer.types.DATA;
            this._tmp_buffer[1] = c+lookahead_c;
            this._current_pos++;
            this._tokenizer_state_handler = this._tokenizer_state_handlers.WHITESPACE;
            return false;
          }
        }
        if (c in cls.TextTokenizer.WHITESPACE)
        {
            this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1]);
            this._tmp_buffer[0] = cls.TextTokenizer.types.DATA;
            this._tmp_buffer[1] = c;
            this._tokenizer_state_handler = this._tokenizer_state_handlers.WHITESPACE;
            return false;
        }
      }
    }
}

cls.TextTokenizer.types = {
  
  DATA      : 1,
  URL       : 2,
  EOL       : 500,
  EOF       : 999
}

cls.TextTokenizer.WHITESPACE = {
  ' ': 1,
  '\t': 1
  
}

cls.TextTokenizer.PUNCTUATION = {
  '.': 1,
  ',': 1,
  '!': 1,
  '?': 1
}

cls.TextTokenizer.BRACES = {

}