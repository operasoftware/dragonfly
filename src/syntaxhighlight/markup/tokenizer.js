window.cls = window.cls || {};

cls.MarkupTokenizer = function()
{

    this.CONFIG =
    {
        EOL_TOKENS: true
    };
    
    this._cached_state = null;
    this._EOL_buffer = "";
    this._buffer = "";
    this._current_pos = 0;
    this.ontoken = function(){};
    this._tmp_buffer = [cls.MarkupTokenizer.types.DATA,''];
    this._last_tag_type = 0;
    
    this._is_script = false;
    this._is_style = false;

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
    
   
    this._emitToken = function(type,value)
    {
        this.ontoken(type,value);
    }
    
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
                this._emitToken(cls.MarkupTokenizer.types.EOL_DATA, this._EOL_buffer);
                this._EOL_buffer = "";
                this._tokenizer_state_handler = this._cached_state;
                return false;
            
            }
            
            if (c === 10)
            {
                this._EOL_buffer += "\n";
                this._current_pos++;
                this._emitToken(cls.MarkupTokenizer.types.EOL_DATA, this._EOL_buffer);
                this._EOL_buffer = "";
                this._tokenizer_state_handler = this._cached_state;
                return false;
            }

        },
        
        
        EOF: function(){
            this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1]);
            this._emitToken(cls.MarkupTokenizer.types.EOF, '');
            return false;
        },
        
        DATA: function(){
            
            if (this._is_EOF())
            {
                return false;
            }
            
            if (this._is_EOL())
            {
                return false;
            }
            
            var c = this._buffer.charAt(this._current_pos++);
            if (c !== "<")
            {
                this._tmp_buffer[1] +=c; // TODO: RegEx? Dirty, but fast
                return false;
            }
            // switching to some state, so flushing current token
            this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1]);
            
            if (c === "<")
            {
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.TAG_OPEN;
                this._tmp_buffer[1] = c;
                this._tokenizer_state_handler = this._tokenizer_state_handlers.TAG_OPEN;
                return false;
            } 

        },
        
        TAG_OPEN: function() // _tmp_buffer contains "<"
        {
            
            if (this._is_EOF())
            {
                return false;
            }
            if (this._is_EOL())
            {
                this._tokenizer_state_handler = this._tokenizer_state_handlers.COMMENT_OR_BOGUS_COMMENT_OPEN;
                return false;
            }
            
            var c = this._buffer.charAt(this._current_pos++);
    
            if ((c === "!") || (c === "?") )// COMMENT_OR_BOGUS
            {
                this._tmp_buffer[1] +=c;
                this._tokenizer_state_handler = this._tokenizer_state_handlers.COMMENT_OR_BOGUS_COMMENT_OPEN;
                return false;
            }

            if (c === "/") // END_TAG_OPEN
            {
                this._tmp_buffer[1] += c;
                this._last_tag_type = 1;
                this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1]);
                this._tmp_buffer[1] = "";
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.TAG_NAME;
                                
                this._tokenizer_state_handler = this._tokenizer_state_handlers.TAG_NAME;
                return false;
            }
            
            this._last_tag_type = 0;
            var s = c.toLowerCase().charCodeAt(0);
            if ((s > 96 && s < 123) || c === ":") // TAG_NAME_STATE
            {
                this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1]);
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.TAG_NAME;
                this._tmp_buffer[1] = c;
                this._tokenizer_state_handler = this._tokenizer_state_handlers.TAG_NAME;
                return false;
            }
            
            
            
            // When all else fails we simply emit the buffer as bogus data and reconsume the last character in DATA mocde
            this._tmp_buffer[0] = cls.MarkupTokenizer.types.BOGUS_DATA;
            this._tmp_buffer[1] += c;
            this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1]);
            this._tmp_buffer[0] = cls.MarkupTokenizer.types.DATA;
            this._tmp_buffer[1] = "";
            this._tokenizer_state_handler = this._tokenizer_state_handlers.DATA;
            
            return false;
        },
        
        COMMENT_OR_BOGUS_COMMENT_OPEN: function() // _tmp_buffer = <!
        {
            if (this._is_EOF())
            {
                return false;
            }
            if (this._is_EOL())
            {
                return false;
            }
            var c = this._buffer.charAt(this._current_pos++);
            this._tmp_buffer[1]+=c;
            var next = this._buffer.substr(this._current_pos-1,2);
            if (next === "--")
            {
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.COMMENT;
                this._tokenizer_state_handler = this._tokenizer_state_handlers.COMMENT;
                return false;
            } 
            this._tmp_buffer[0] = cls.MarkupTokenizer.types.BOGUS_COMMENT;
            this._tokenizer_state_handler = this._tokenizer_state_handlers.BOGUS_COMMENT;
                            
            
            return false;
        },
        
        COMMENT: function()
        {
            if (this._is_EOF())
            {
                return false;
            }
            if (this._is_EOL())
            {
                return false;
            }

            var c = this._buffer.charAt(this._current_pos++);
            this._tmp_buffer[1] += c;
            var needle = "-->";
            var haystack = this._buffer.substr(this._current_pos, needle.length);
            if (haystack === needle)
            {
                this._current_pos+=3;
                this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1]+"-->");
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.DATA;
                this._tmp_buffer[1] ="";
                this._tokenizer_state_handler = this._tokenizer_state_handlers.DATA;
                return false;
            }            
            return false;
        },
        
        BOGUS_COMMENT: function()
        {
            if (this._is_EOF())
            {
                return false;
            }
            if (this._is_EOL())
            {
                return false;
            }

            var c = this._buffer.charAt(this._current_pos++);
            this._tmp_buffer[1] += c;
            
            if (c === ">")
            {
                this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1]);
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.DATA;
                this._tmp_buffer[1] ="";
                this._tokenizer_state_handler = this._tokenizer_state_handlers.DATA;
            }
            return false;
        },
        
        SCRIPT_DATA: function()
        {
            if (this._is_EOF())
            {
                return false;
            }
            if (this._is_EOL())
            {
                return false;
            }
            var c = this._buffer.charAt(this._current_pos++)
            
            if (c === "<")
            {
                // Look for /script>
                var needle = "/script>";
                var haystack = this._buffer.substr(this._current_pos, needle.length)
                if (haystack.toLowerCase() === needle)
                {
                    this._emitToken(this._tmp_buffer[0], this._tmp_buffer[1]);
                    this._tmp_buffer[0] = cls.MarkupTokenizer.types.TAG_OPEN;
                    this._tmp_buffer[1] = "<";
                    this._tokenizer_state_handler = this._tokenizer_state_handlers.TAG_OPEN;
                    return false;
                }
                this._tmp_buffer[1] += c;
                return false;
            }
            this._tmp_buffer[1] += c;
            return false;
        },
        
        STYLE_DATA: function()
        {
            if (this._is_EOF())
            {
                return false;
            }
            if (this._is_EOL())
            {
                return false;
            }
            var c = this._buffer.charAt(this._current_pos++)
            
            if (c === "<")
            {
                // Look for /script>
                var needle = "/style>";
                var haystack = this._buffer.substr(this._current_pos, needle.length)
                if (haystack.toLowerCase() === needle)
                {
                    this._emitToken(this._tmp_buffer[0], this._tmp_buffer[1]);
                    this._tmp_buffer[0] = cls.MarkupTokenizer.types.TAG_OPEN;
                    this._tmp_buffer[1] = "<";
                    this._tokenizer_state_handler = this._tokenizer_state_handlers.TAG_OPEN;
                    return false;
                }
                this._tmp_buffer[1] += c;
                return false;
            }
            this._tmp_buffer[1] += c;
            return false;
        },        
        
        TAG_NAME: function()
        {
            if (this._is_EOF())
            {
                return false;
            }
            if (this._is_EOL())
            {
                this._last_tag_name = this._tmp_buffer[1];
                this._tokenizer_state_handler = this._tokenizer_state_handlers.BEFORE_ATTRIBUTE;
                return false;
            }
            var c = this._buffer.charAt(this._current_pos++);
            
         /*   var s = c.toLowerCase().charCodeAt(0);
           
            
            if ((s > 96 && s < 123) || (c === ":") ) 
            {
                this._tmp_buffer[1] += c;
                return false;
            }

            if (c in this._NUMBERS)
            {
                this._tmp_buffer[1] += c;
                return false;
            } */

            
            this._last_tag_name = this._tmp_buffer[1];


            if (c in this._WHITESPACE)
            {
                this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1]);
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.TAG_WHITESPACE;
                this._tmp_buffer[1] = c;
                this._tokenizer_state_handler = this._tokenizer_state_handlers.BEFORE_ATTRIBUTE;
                return false;
            }
            
            if (c === "/") // Self-closing tag
            {
                this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1]);
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.TAG_CLOSE;
                this._tmp_buffer[1] = c;
                return false;
            }
            
            if (c === "<")
            {
                this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1]);
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.TAG_OPEN;
                this._tmp_buffer[1] = c;
                this._tokenizer_state_handler = this._tokenizer_state_handlers.TAG_OPEN;
                return false;
            }
            
            
            if (c === ">")
            {
                this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1]);
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.TAG_CLOSE;
                this._tmp_buffer[1] = c;
                this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1]);
                this._tmp_buffer[1] = "";
                
                if (this._last_tag_type == 0)
                {
                    if (this._last_tag_name.toLowerCase() == "script")
                    {
                        this._tmp_buffer[0] = cls.MarkupTokenizer.types.SCRIPT_DATA;
                        this._emitToken(cls.MarkupTokenizer.types.SCRIPT_DATA,"");
                        this._tokenizer_state_handler = this._tokenizer_state_handlers.SCRIPT_DATA;
                        return false;
                    }
                    if (this._last_tag_name.toLowerCase() == "style")
                    {
                        this._tmp_buffer[0] = cls.MarkupTokenizer.types.STYLE_DATA;
                        this._tokenizer_state_handler = this._tokenizer_state_handlers.STYLE_DATA;
                        return false;
                    }
                }
                
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.DATA;
                this._tokenizer_state_handler = this._tokenizer_state_handlers.DATA;
                return false;
            }
            this._tmp_buffer[1] += c;
            return false;
        },
        
        BEFORE_ATTRIBUTE: function()
        {
            
            if (this._is_EOF())
            {
                return false;
            }
            if (this._is_EOL())
            {
                return false;
            }
            
            var c = this._buffer.charAt(this._current_pos++);
          
            if (c in this._WHITESPACE)
            {
                this._tmp_buffer[1] += c;
                return false;
            }
            
            if (c === ">")
            {
                this._emitToken(this._tmp_buffer[0], this._tmp_buffer[1]);
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.TAG_CLOSE;
                this._tmp_buffer[1] = c;
                this._emitToken(this._tmp_buffer[0], this._tmp_buffer[1]);
                this._tmp_buffer[1] = "";
                if (this._last_tag_type == 0)
                {
                    if (this._last_tag_name.toLowerCase() == "script")
                    {
                        this._tmp_buffer[0] = cls.MarkupTokenizer.types.SCRIPT_DATA;
                        this._emitToken(cls.MarkupTokenizer.types.SCRIPT_DATA,"");
                        this._tokenizer_state_handler = this._tokenizer_state_handlers.SCRIPT_DATA;
                        return false;
                    }
                    if (this._last_tag_name.toLowerCase() == "style")
                    {
                        this._tmp_buffer[0] = cls.MarkupTokenizer.types.STYLE_DATA;
                        this._tokenizer_state_handler = this._tokenizer_state_handlers.STYLE_DATA;
                        return false;
                    }
                }
                
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.DATA;
                this._tokenizer_state_handler = this._tokenizer_state_handlers.DATA;
                return false;
            }
            
            if (c === "/")
            {
                this._emitToken(this._tmp_buffer[0], this._tmp_buffer[1]);
                this._tokenizer_state_handler = this._tokenizer_state_handlers.SELF_CLOSING_TAG;
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.TAG_CLOSE;
                this._tmp_buffer[1] = c;
                return false;
            }
           
            this._tokenizer_state_handler = this._tokenizer_state_handlers.ATTRIBUTE_NAME;
            this._emitToken(this._tmp_buffer[0], this._tmp_buffer[1]);
            this._tmp_buffer[0] = cls.MarkupTokenizer.types.ATTRIBUTE_NAME;
            this._tmp_buffer[1] = c;
            
            return false;
        },
        
        SELF_CLOSING_TAG: function()
        {
            if (this._is_EOF())
            {
                return false;
            }
            if (this._is_EOL())
            {
                return false;
            }
            var c = this._buffer.charAt(this._current_pos++);
            
            
            if (c === ">")
            {
                this._tmp_buffer[1] += c;
                this._emitToken(this._tmp_buffer[0], this._tmp_buffer[1]);
                this._tmp_buffer[1] = "";
                if (this._last_tag_type == 0)
                {
                    if (this._last_tag_name.toLowerCase() == "script")
                    {
                        this._tmp_buffer[0] = cls.MarkupTokenizer.types.SCRIPT_DATA;
                        this._emitToken(cls.MarkupTokenizer.types.SCRIPT_DATA,"");
                        this._tokenizer_state_handler = this._tokenizer_state_handlers.SCRIPT_DATA;
                        return false;
                    }
                    if (this._last_tag_name.toLowerCase() == "style")
                    {
                        this._tmp_buffer[0] = cls.MarkupTokenizer.types.STYLE_DATA;
                        this._tokenizer_state_handler = this._tokenizer_state_handlers.STYLE_DATA;
                        return false;
                    }
                }
                                
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.DATA;
                this._tokenizer_state_handler = this._tokenizer_state_handlers.DATA;
                return false;
            
            }
          
            this._tmp_buffer[0] = cls.MarkupTokenizer.types.BOGUS_DATA;
            this._tmp_buffer[1] +=c;
            this._tokenizer_state_handler = this._tokenizer_state_handlers.BEFORE_ATTRIBUTE;
            return false;
        },
        
        
        ATTRIBUTE_NAME: function()
        {
            if (this._is_EOF())
            {
                return false;
            }
            if (this._is_EOL())
            {
                return false;
            }            
            var c = this._buffer.charAt(this._current_pos++);
            
            if (c === "=")
            {
                this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1])
                this._tmp_buffer[1] = c;
                this._emitToken(cls.MarkupTokenizer.types.ATTRIBUTE_ASSIGNMENT, this._tmp_buffer[1]);
                this._tmp_buffer[1] = "";
                this._tokenizer_state_handler = this._tokenizer_state_handlers.BEFORE_ATTRIBUTE_VALUE;
                return false;
            }

            if (c === "/")
            {
                this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1]);
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.TAG_CLOSE;
                this._tmp_buffer[1] = c;
                this._tokenizer_state_handler = this._tokenizer_state_handlers.SELF_CLOSING_TAG;
                return false;
            }
            
            if (c === ">")
            {
                this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1])
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.TAG_CLOSE;
                this._tmp_buffer[1] = c;
                this._emitToken(this._tmp_buffer[0], this._tmp_buffer[1]);
                this._tmp_buffer[1] = "";
                if (this._last_tag_type == 0)
                {
                    if (this._last_tag_name.toLowerCase() == "script")
                    {
                        this._tmp_buffer[0] = cls.MarkupTokenizer.types.SCRIPT_DATA;
                        this._emitToken(cls.MarkupTokenizer.types.SCRIPT_DATA,"");
                        this._tokenizer_state_handler = this._tokenizer_state_handlers.SCRIPT_DATA;
                        return false;
                    }
                    if (this._last_tag_name.toLowerCase() == "style")
                    {
                        this._tmp_buffer[0] = cls.MarkupTokenizer.types.STYLE_DATA;
                        this._tokenizer_state_handler = this._tokenizer_state_handlers.STYLE_DATA;
                        return false;
                    }
                }
                
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.DATA;
                this._tokenizer_state_handler = this._tokenizer_state_handlers.DATA;
                return false;
            }
            
            if (c in this._WHITESPACE)
            {
                this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1]);
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.TAG_WHITESPACE;
                this._tmp_buffer[1] = c;
                this._tokenizer_state_handler = this._tokenizer_state_handlers.BEFORE_ATTRIBUTE;
                return false;
            }
            
            this._tmp_buffer[1] += c;
            return false;
            
        },
        
        BEFORE_ATTRIBUTE_VALUE: function()
        {
            if (this._is_EOF())
            {
                return false;
            }
            if (this._is_EOL())
            {
                return false;
            }
            
            var c = this._buffer.charAt(this._current_pos++);
            
            if (c === ">")
            {
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.TAG_CLOSE;
                this._tmp_buffer[1] = c;
                this._emitToken(this._tmp_buffer[0], this._tmp_buffer[1]);
                if (this._last_tag_type == 0)
                {
                    if (this._last_tag_name.toLowerCase() == "script")
                    {
                        this._tmp_buffer[0] = cls.MarkupTokenizer.types.SCRIPT_DATA;
                        this._emitToken(cls.MarkupTokenizer.types.SCRIPT_DATA,"");
                        this._tokenizer_state_handler = this._tokenizer_state_handlers.SCRIPT_DATA;
                        return false;
                    }
                    if (this._last_tag_name.toLowerCase() == "style")
                    {
                        this._tmp_buffer[0] = cls.MarkupTokenizer.types.STYLE_DATA;
                        this._tokenizer_state_handler = this._tokenizer_state_handlers.STYLE_DATA;
                        return false;
                    }
                }
                
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.DATA;
                this._tokenizer_state_handler = this._tokenizer_state_handlers.DATA;
                return false;                
            }
            
            this._tmp_buffer[0] = cls.MarkupTokenizer.types.ATTRIBUTE_VALUE;
            this._tmp_buffer[1] = c;
            
            if (c === "\"")
            {
                this._tokenizer_state_handler = this._tokenizer_state_handlers.ATTRIBUTE_VALUE_DOUBLE_QUOTED;
                return false;
            }
            
            if (c === "'")
            {
                this._tokenizer_state_handler = this._tokenizer_state_handlers.ATTRIBUTE_VALUE_SINGLE_QUOTED;
                return false;
            }
            this._tokenizer_state_handler = this._tokenizer_state_handlers.ATTRIBUTE_VALUE_UNQUOTED
            return false;
        },
        

        
        ATTRIBUTE_VALUE_DOUBLE_QUOTED: function()
        {
            if (this._is_EOF())
            {
                return false;
            }
            if (this._is_EOL())
            {
                return false;
            }            
            var c = this._buffer.charAt(this._current_pos++);
            
            if ((c === "'") && (this._tmp_buffer[1].charAt(this._tmp_buffer[1].length-1) === "\\"))
            {
                this._tmp_buffer += c;
                return false;
            }
            
            
            if (c === "\"")
            {
                this._tmp_buffer[1] += c;
                this._emitToken(this._tmp_buffer[0], this._tmp_buffer[1]);
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.TAG_WHITESPACE;
                this._tmp_buffer[1] = "";
                this._tokenizer_state_handler = this._tokenizer_state_handlers.BEFORE_ATTRIBUTE;
                return false;
            }
            this._tmp_buffer[1] += c;
            
            return false;
        },

        ATTRIBUTE_VALUE_SINGLE_QUOTED: function()
        {
            if (this._is_EOF())
            {
                return false;
            }
            if (this._is_EOL())
            {
                return false;
            }            
            var c = this._buffer.charAt(this._current_pos++);
            
            if ((c === "\"") && (this._tmp_buffer[1].charAt(this._tmp_buffer[1].length-1) === "\\"))
            {
                this._tmp_buffer += c;
                return false;
            }
            
            
            if (c === "'")
            {
                this._tmp_buffer[1] += c;
                this._emitToken(this._tmp_buffer[0], this._tmp_buffer[1]);
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.TAG_WHITESPACE;
                this._tmp_buffer[1] = "";
                this._tokenizer_state_handler = this._tokenizer_state_handlers.BEFORE_ATTRIBUTE;
                return false;
            }
            this._tmp_buffer[1] += c;
            
            return false;
 
        },

        ATTRIBUTE_VALUE_UNQUOTED: function()
        {
            if (this._is_EOF())
            {
                return false;
            }
            if (this._is_EOL())
            {
                this._tokenizer_state_handler = this._tokenizer_state_handlers.BEFORE_ATTRIBUTE;
                return false;
            }
            
            var c = this._buffer.charAt(this._current_pos++);
            if (c in this._WHITESPACE)
            {
                this._emitToken(this._tmp_buffer[0], this._tmp_buffer[1]);
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.TAG_WHITESPACE;
                this._tmp_buffer[1] = c;
                this._tokenizer_state_handler = this._tokenizer_state_handlers.BEFORE_ATTRIBUTE;
                return false;
            }
            
            if (c === ">")
            {
                this._emitToken(this._tmp_buffer[0],this._tmp_buffer[1])
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.TAG_CLOSE;
                this._tmp_buffer[1] = c;
                this._emitToken(this._tmp_buffer[0], this._tmp_buffer[1]);
                this._tmp_buffer[1] = "";
                if (this._last_tag_type == 0)
                {
                    if (this._last_tag_name.toLowerCase() == "script")
                    {
                        this._tmp_buffer[0] = cls.MarkupTokenizer.types.SCRIPT_DATA;
                        this._emitToken(cls.MarkupTokenizer.types.SCRIPT_DATA,"");
                        this._tokenizer_state_handler = this._tokenizer_state_handlers.SCRIPT_DATA;
                        return false;
                    }
                    if (this._last_tag_name.toLowerCase() == "style")
                    {
                        this._tmp_buffer[0] = cls.MarkupTokenizer.types.STYLE_DATA;
                        this._tokenizer_state_handler = this._tokenizer_state_handlers.STYLE_DATA;
                        return false;
                    }
                }
                
                this._tmp_buffer[0] = cls.MarkupTokenizer.types.DATA;
                this._tokenizer_state_handler = this._tokenizer_state_handlers.DATA;
                return false;
            }
            
            this._tmp_buffer[1] += c;
            return false;
        }

    }
    
    
    
    
/*
    this._TAG_OPEN_CHARS =
    {
        '<': 1,
    };
        
    
    this._TAG_CLOSE_CHARS =
    {
        '>': 1,
        '/>': 1,
        '?>': 1
    };
*/

    
    this._WHITESPACE =
    {
        ' ': 1,
        '\t': 1,
    };
    
    this._NUMBERS =
    {
        '1' : 1,
        '2' : 1,
        '3' : 1,
        '4' : 1,
        '5' : 1,
        '6' : 1,
    };
    
    this._ATTRIBUTE_QUOTES =
    {
        '"': 1,
        '\'': 1
    };

    this._EOL_CHARS =
    {
      "\n": 1,
      "\r": 1
    }

}

cls.MarkupTokenizer.types = {
    UNKNOWN                         : 0,

    TAG_OPEN                        : 1, // <, <?, </
    TAG_CLOSE                       : 2, // >, ?>, />
    TAG_NAME                        : 3, // ....
    TAG_WHITESPACE                  : 4, //

    ATTRIBUTE_NAME                  : 101,
    ATTRIBUTE_ASSIGNMENT            : 102,
    ATTRIBUTE_VALUE                 : 103,
    
 
    COMMENT                         : 201,
    DATA                            : 202,
//    ENTITY_REFERENCE                : 203,
    SCRIPT_DATA                     : 204,
    STYLE_DATA                      : 205,
//    RAWTEXT                         : 206, // These should not really occur, except in documents containing <PLAINTEXT> tags.  
    BOGUS_COMMENT                   : 207, // anything syntactically invalid, up
    BOGUS_DATA                      : 208,

    DOCTYPE                         : 301,

    EOL_DATA                        : 500,
    EOF                             : 999
}
