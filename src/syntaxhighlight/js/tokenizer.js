// web worker doesn't have a window
this.cls || (this.cls = {});
cls.SimpleJSParser = function() {};

// CONSTS for external code that needs to know about token types
cls.SimpleJSParser.WHITESPACE = 1;
cls.SimpleJSParser.LINETERMINATOR = 2;
cls.SimpleJSParser.IDENTIFIER = 3;
cls.SimpleJSParser.NUMBER = 4;
cls.SimpleJSParser.STRING = 5;
cls.SimpleJSParser.PUNCTUATOR = 6;
cls.SimpleJSParser.DIV_PUNCTUATOR = 7;
cls.SimpleJSParser.REG_EXP = 8;
cls.SimpleJSParser.COMMENT = 9;

cls.SimpleJSParser.prototype = new function()
{

  /**
    * This is a simple js parser. There are edge cases where it will fail,
    * but with 'normal' js syntax it should work ok.
    */

  /* interface */

  /**
    * Creates html markup to syntax highlight a slice of a js scource file.
    * @param {Object} script
    *     An object with the properties script_data, line_arr, state_arr.
    *     script_data is the whole source file.
    *     line_arr is a list with offset for each new line
    *     satte_arr is the according list with the state for each line
    * @param {Number} line The line number to start the formatting.
    * @param {Number} max_line The count of maxium lines to create.
    */
  this.format = function(script, line, max_line, highlight_start, highlight_end, line_ele_name){};

  /**
   * Helper method that formats source code the same way as format but takes a
   * simple string as input.
   */
  this.format_source = function(source){};

  /**
    * Tokenize a give script string.
    * @param {String} script_source The script string.
    * @param {Array} token_arr The list of tokens.
    * @param {Array} type_arr The list of token types.
    * token_arr and type_arr must be passed as empty arrays.
    * This is a workaround for a missing standard destruction in js,
    * e.g. something like: tokens, token_types = parser.parse(script_source);
    */
  this.parse = function(script_source, token_arr, type_arr){};

  /**
    * Tokenize a give script string.
    * @param {String} script_source The script string.
    * @param {Function} ontoken. Signature of the callback is (token_type, token).
    * @param {String} escape. Optional. Currently supports only "html"
    * to escape "<" and "&" to "&lt;" and "&amp;".
    */
  this.tokenize = function(script_source, ontoken, escape, start_state){};

  /* privat */

  /* optimized to return fotmatted HTML */

  const
  DEFAULT_STATE = 0,
  SINGLE_QUOTE_STATE = 1,
  DOUBLE_QUOTE_STATE = 2,
  REG_EXP_STATE = 3,
  COMMENT_STATE = 4,

  //local copy of token types, local vars have better performance. :
  WHITESPACE = cls.SimpleJSParser.WHITESPACE,
  LINETERMINATOR = cls.SimpleJSParser.LINETERMINATOR,
  IDENTIFIER = cls.SimpleJSParser.IDENTIFIER,
  NUMBER = cls.SimpleJSParser.NUMBER,
  STRING = cls.SimpleJSParser.STRING,
  PUNCTUATOR = cls.SimpleJSParser.PUNCTUATOR,
  DIV_PUNCTUATOR = cls.SimpleJSParser.DIV_PUNCTUATOR,
  REG_EXP = cls.SimpleJSParser.REG_EXP,
  COMMENT = cls.SimpleJSParser.COMMENT;

  var parser=null;
  var __source=null;
  var __buffer='';
  var __pointer=0;
  var __char=String.fromCharCode;
  var __type=''; // WHITESPACE, LINE_TERMINATOR, NUMBER, STRING, PUNCTUATOR, DIV_PUNCTUATOR, IDENTIFIER, REG_EXP
  var __previous_type='';
  var __previous_value='';
  var __string_delimiter=0;
  var __ret='<ol>';
  var __line='';
  var __line_number = 1;
  var __max_line_number = 0;
  var __max_line_chars = 2500;
  var __char_count = 0;
  var __has_hit_max_line_chars = false;

  var __parse_error_line = 0;
  var __parse_error_line_offset = 0;
  var __parse_error_line_buffer ='';
  var __parse_error_first_token = true;
  var __parse_error_description = "";

  var __escape = null;

  var __token_arr = null;
  var __token_type_arr = null;

  var __return_arr = null;

  var __highlight_line_start = -1;
  var __highlight_line_end = -1;

  var __default_line_ele = "div";
  var __current_line_ele = "";
  var __ontoken = null;

  var __read_buffer_with_arrs = function()
  {
    if (__buffer)
    {
      __token_arr.push(__buffer);
      __token_type_arr.push(__type);
      if (__type==IDENTIFIER)
      {
        __previous_type=__type;
        __previous_value = __buffer;
      }
    }
    __buffer = '';
  };
  var __online_with_arrs = function()
  {
    __token_arr.push(__buffer);
    __token_type_arr.push(LINETERMINATOR);
    __buffer = '';
  }

  var __read_buffer_parse_simple = function()
  {
    if (__buffer)
    {
      __return_arr.push([__type, __buffer]);
      if (__type==IDENTIFIER)
      {
        __previous_type=__type;
        __previous_value = __buffer;
      }
    }
    __buffer = '';
  };

  var __online_parse_simple = function()
  {
    __return_arr.push([LINETERMINATOR, __buffer]);
    __buffer = '';
  };

  var __read_buffer_tokenize = function()
  {
    if (__buffer)
    {
      __ontoken(__type, __buffer);
      if (__type==IDENTIFIER)
      {
        __previous_type=__type;
        __previous_value = __buffer;
      }
    }
    __buffer = '';
  };

  var __online_tokenize = function()
  {
    __ontoken(LINETERMINATOR, __buffer);
    __buffer = '';
  };

  var WHITESPACE_CHARS =
  {
    '\u0009': 1, //  Tab <TAB>
    '\u000B': 1, //  Vertical Tab <VT>
    '\u000C': 1, //  Form Feed <FF>
    '\u0020': 1, //  Space <SP>
    '\u00A0': 1 //  No-break space <NBSP>
  }
  var LINETERMINATOR_CHARS =
  {
    '\u000A': 1, //  Line Feed <LF>
    '\u000D': 1, //  Carriage Return <CR>
    '\u000D\u000A': 1,
    '\u2028': 1, //  Line separator <LS>
    '\u2029': 1 //  Paragraph separator <PS>
  }
  var NUMBER_CHARS =
  {
    '0': 1,
    '1': 1,
    '2': 1,
    '3': 1,
    '4': 1,
    '5': 1,
    '6': 1,
    '7': 1,
    '8': 1,
    '9': 1
  }
  var PUNCTUATOR_CHARS =
  {
    '{': 1,
    '}': 1,
    '(': 1,
    ')': 1,
    '[': 1,
    ']': 1,
    ';': 1,
    ',': 1,
    '<': 1,
    '>': 1,
    '=': 1,
    '!': 1,
    '+': 1,
    '-': 1,
    '*': 1,
    '%': 1,
    '&': 1,
    '|': 1,
    '^': 1,
    '~': 1,
    '?': 1,
    ':': 1,
    '.': 1,
  }
  var PUNCTUATOR_GROUPS = {};
  PUNCTUATOR_GROUPS[2] =
  {
    start:
    {
      "<": 1,
      ">": 1,
      "=": 1,
      "!": 1,
      "+": 1,
      "-": 1,
      "&": 1,
      "|": 1,
      "*": 1,
      "%": 1,
      "&": 1,
      "|": 1,
      "^": 1,
    },
    groups:
    {
      "<=": 1,
      ">=": 1,
      "==": 1,
      "!=": 1,
      "++": 1,
      "--": 1,
      "<<": 1,
      ">>": 1,
      "&&": 1,
      "||": 1,
      "+=": 1,
      "-=": 1,
      "*=": 1,
      "%=": 1,
      "&=": 1,
      "|=": 1,
      "^=": 1,
    }
  };
  PUNCTUATOR_GROUPS[3] =
  {
    start:
    {
      "==": 1,
      "!=": 1,
      ">>": 1,
      "<<": 1,
    },
    groups:
    {
      "===": 1,
      "!==": 1,
      ">>>": 1,
      "<<=": 1,
      ">>=": 1,
    }
  };
  PUNCTUATOR_GROUPS[4] =
  {
    start:
    {
      ">>>": 1,
    },
    groups:
    {
      ">>>=": 1,
    }
  };

  var STRING_DELIMITER_CHARS =
  {
    '"': 1,
    '\'': 1
  }
  var HEX_NUMBER_CHARS =
  {
    '0': 1,
    '1': 1,
    '2': 1,
    '3': 1,
    '4': 1,
    '5': 1,
    '6': 1,
    '7': 1,
    '8': 1,
    '9': 1,
    'a': 1,
    'b': 1,
    'c': 1,
    'd': 1,
    'e': 1,
    'f': 1,
    'A': 1,
    'B': 1,
    'C': 1,
    'D': 1,
    'E': 1,
    'F': 1
  }
  var REG_EXP_FLAG_CHARS =
  {
    'g': 1,
    'i': 1,
    'm': 1
  }
  var PUNCTUATOR_DIV_PREDECESSOR_CHARS =
  {
    ')': 1,
    ']': 1,
    '}': 1
  }
  var REG_EXP_PREDECESSOR =
  {
    'return': 1,
  }
  var ESCAPE =
  {
    '<': '&lt;',
    '&': '&amp;'
  }
  var default_parser=function(c)
  {
    var CRLF = '', group = '', group_count = 0;
    __previous_value='';
    while(c)
    {
      if(c in WHITESPACE_CHARS)
      {
        read_buffer();
        __type=WHITESPACE;
        do
        {
          __buffer+=c;
          c=__source.charAt(++__pointer);
        }
        while (c in WHITESPACE_CHARS);
        read_buffer();
        __type=IDENTIFIER;
      }

      if (c in LINETERMINATOR_CHARS)
      {
        read_buffer();
        __buffer = CRLF = c;
        CRLF += c =__source.charAt(++__pointer);
        if (CRLF in LINETERMINATOR_CHARS)
        {
          __buffer = CRLF;
          c = __source.charAt(++__pointer);
        }
        if(__online && __online())
        {
          return __ret;
        }
        continue;
      }

      if(c in NUMBER_CHARS)
      {
        read_buffer();
        __buffer+=c;
        __type=NUMBER;
        c=__source.charAt(++__pointer);
        if(c=='x' || c=='X')
        {
          __buffer+=c;
          c=number_hex_parser(__source.charAt(++__pointer));
        }
        else
        {
          c=number_dec_parser(c, '.');
        }
        continue;
      }

      if(c in STRING_DELIMITER_CHARS)
      {
        read_buffer();
        __string_delimiter=c;
        __buffer+=c;
        __type=STRING;
        if( string_parser(__source.charAt(++__pointer)) )
        {
          return __ret;
        }
        c=__source.charAt(++__pointer);
        continue;
      }

      if(c=='.')
      {
        read_buffer();
        __buffer+=c;
        c=__source.charAt(++__pointer);
        if(c in NUMBER_CHARS)
        {
          __type=NUMBER;
          c=number_dec_parser(c, 0);
          continue;
        }
        else
        {
          __type=PUNCTUATOR;
          read_buffer();
          __type=IDENTIFIER;
          continue;
        }
      }

      if(c in PUNCTUATOR_CHARS)
      {
        read_buffer();
        __type = PUNCTUATOR;
        __buffer += c in __escape ? __escape[c] : c;
        group = c;
        c = __source.charAt(++__pointer);
        group_count = 2;
        while (c)
        {
          if (PUNCTUATOR_GROUPS[group_count] &&
              group in PUNCTUATOR_GROUPS[group_count].start &&
              (group += c) in PUNCTUATOR_GROUPS[group_count].groups)
          {
            __buffer += c in __escape ? __escape[c] : c;
            c = __source.charAt(++__pointer);
            group_count++;
          }
          else
          {
            break;
          }
        }
        __previous_value = __buffer;
        read_buffer();
        __previous_type = __type;
        __type = IDENTIFIER;
        continue;
      }

      if(c=='/')
      {
        read_buffer();
        __buffer+=c;
        c=__source.charAt(++__pointer);
        if(c=='*')
        {
          __buffer+=c;
          __type=COMMENT;
          if( multiline_comment_parser(__source.charAt(++__pointer)) )
          {
            return __ret;
          }
          c=__source.charAt(++__pointer);

          continue;
        }
        if(c=='/')
        {
          __buffer+=c;
          __type=COMMENT;
          if( singleline_comment_parser(__source.charAt(++__pointer)) )
          {
            return __ret;
          }
          c = __source.charAt(__pointer);
          continue;
        }
        if ((__previous_type==IDENTIFIER && !(__previous_value in REG_EXP_PREDECESSOR)) ||
              __previous_type==NUMBER ||
              (__previous_type==PUNCTUATOR && __previous_value in PUNCTUATOR_DIV_PREDECESSOR_CHARS))
        {
          __type=DIV_PUNCTUATOR;
          if(c=='=')
          {
            __buffer+=c;
            read_buffer();
            c=__source.charAt(++__pointer);
          }
          else
          {
            read_buffer();
          }
          __type=IDENTIFIER;
          continue;
        }
        __type=REG_EXP;
        c=reg_exp_parser(c);
        continue;
      }
      // read identifier
      // numbers can be part of identifier
      while(true)
      {
        __buffer+=c in __escape ? __escape[c] : c;
        c=__source.charAt(++__pointer);
        if (!c
            || c in PUNCTUATOR_CHARS
            || c=='/'
            || c in LINETERMINATOR_CHARS
            || c in WHITESPACE_CHARS
            || c in STRING_DELIMITER_CHARS)
        {
          break;
        }
      }
    }
    read_buffer();
  }

  var number_hex_parser=function(c)
  {
    while(c in HEX_NUMBER_CHARS)
    {
      __buffer+=c;
      c=__source.charAt(++__pointer);
    }
    read_buffer();
    __previous_type=__type;
    __type=IDENTIFIER;
    return c;
  }

  var number_dec_parser=function(c, dot)
  {
    while(c in NUMBER_CHARS || c === dot)
    {
      if (c === dot)
      {
        dot = 0;
      }
      __buffer+=c;
      c=__source.charAt(++__pointer);
    }
    if(c=='e' || c=='E')
    {
      __buffer+=c;
      c=__source.charAt(++__pointer);
      if(c=='+' || c=='-')
      {
        __buffer+=c;
        c=__source.charAt(++__pointer);
      }
      while(c in NUMBER_CHARS)
      {
        __buffer+=c;
        c=__source.charAt(++__pointer);
      }
    }
    read_buffer();
    __previous_type=NUMBER;
    __type=IDENTIFIER;
    return c;
  }

  var string_parser=function(c)
  {
    var CRLF='';
    while(c)
    {
      if(c=='\\')  //\u005C
      {
        __buffer+=c;
        c=__source.charAt(++__pointer);
        if(c in LINETERMINATOR_CHARS)
        {
          read_buffer();
          __buffer=CRLF=c;
          CRLF+=c=__source.charAt(++__pointer);
          if(CRLF in LINETERMINATOR_CHARS)
          {
            c=__source.charAt(++__pointer);
            __buffer = CRLF;
          }
          if(__online && __online())
          {
            return __ret;
          }
          continue;
        }
        else
        {
        __buffer+=c in __escape ? __escape[c] : c;
        c=__source.charAt(++__pointer);
        continue;
        }
      }
      if(c==__string_delimiter ||
        /* abort string parsing on a new line */
        c in LINETERMINATOR_CHARS)
      {
        __buffer+=c;
        read_buffer();
        __previous_type=STRING;
        __type=IDENTIFIER;
        break;
      }
      __buffer+=c in __escape ? __escape[c] : c;
      c=__source.charAt(++__pointer);
    }
  }

  var multiline_comment_parser=function(c)
  {
    var CRLF='';
    while(c)
    {
      if (c in LINETERMINATOR_CHARS)
      {
        read_buffer();
        __buffer = CRLF = c;
        CRLF += c =__source.charAt(++__pointer);
        if (CRLF in LINETERMINATOR_CHARS)
        {
          __buffer = CRLF;
          c = __source.charAt(++__pointer);
        }
        if(__online && __online())
        {
          return __ret;
        }
        continue;
      }
      if(c=='*')
      {
        __buffer+=c;
        c=__source.charAt(++__pointer);
        if(c=='/')
        {
          __buffer+=c;
          read_buffer();
          // don't change the previous type
          __type=IDENTIFIER;
          break;
        }
        continue;
      }
      __buffer+=c in __escape ? __escape[c] : c;
      c=__source.charAt(++__pointer);
    }
  }

  var singleline_comment_parser=function(c)
  {
    var CRLF='';
    while(c)
    {
      if(c in LINETERMINATOR_CHARS)
      {
        read_buffer();
        // don't change the previous type
        __type = IDENTIFIER;
        __buffer = CRLF = c;
        CRLF += c =__source.charAt(++__pointer);
        if (CRLF in LINETERMINATOR_CHARS)
        {
          __buffer = CRLF;
          __pointer++;
        }
        if (__online && __online())
        {
          return __ret;
        }
        break;
      }
      __buffer+=c in __escape ? __escape[c] : c;
      c=__source.charAt(++__pointer);
    }
  }


  var reg_exp_parser=function(c)
  {
    var is_in_brackets = false;
    while(c)
    {
      if( c == '[' )
      {
        is_in_brackets = true;
      }
      if( is_in_brackets && c == ']' )
      {
        is_in_brackets = false;
      }
      if(c=='\\')
      {
        __buffer+=c;
        c=__source.charAt(++__pointer);
        __buffer+=c in __escape ? __escape[c] : c;
        c=__source.charAt(++__pointer);
        continue;
      }
      if( !is_in_brackets && c=='/' )
      {
        __buffer+=c;
        c=__source.charAt(++__pointer);
        while(c in REG_EXP_FLAG_CHARS)
        {
          __buffer+=c;
          c=__source.charAt(++__pointer);
        }
        read_buffer();
        __previous_type=REG_EXP;
        __type=IDENTIFIER;
        return c;
      }
      /* abort string parsing on a new line */
      if(c in LINETERMINATOR_CHARS)
      {
        read_buffer();
        __previous_type=REG_EXP;
        __type=IDENTIFIER;
        return c;
      }
      __buffer+=c in __escape ? __escape[c] : c;
      c=__source.charAt(++__pointer);
    }
  }

  var read_buffer = null;

  var __js_types =
  {
    "false": "boolean",
    "true": "boolean",
    "null": "null",
    "undefined": "undefined",
  };

  var read_buffer_default=function()
  {
    if (__buffer && !__has_hit_max_line_chars)
    {
      __char_count += __buffer.length;
      // To handle the width limit (instaed of overflow hidden).
      // Opera 12 will no longer have that limit, so this is just temporary.
      if (__char_count > __max_line_chars)
      {
        __buffer = "";
        __has_hit_max_line_chars = true;
      }
      switch (__type)
      {
        case STRING:
        {
          __line += "<span class='string'>" +  __buffer + "</span>";
          break;
        }
        case IDENTIFIER:
        {
          if(__js_types.hasOwnProperty(__buffer))
          {
            __line += "<span class='" + __js_types[__buffer] + "'>" +
                      __buffer + "</span>";
          }
          else if(__buffer in js_keywords)
          {
            __line += "<span class='js_keywords'>" +  __buffer + "</span>";
          }
          else if(__buffer in js_builtins)
          {
            __line += "<span class='js_builtins'>" +  __buffer + "</span>";
          }
          else
          {
            __line += __buffer;
          }
          break;
        }
        case NUMBER:
        {
          __line += "<span class='number'>" +  __buffer + "</span>";
          break;
        }
        case COMMENT:
        {
          __line += "<span class='comment'>" +  __buffer + "</span>";
          break;
        }
        case REG_EXP:
        {
          __line += "<span class='reg_exp'>" +  __buffer + "</span>";
          break;
        }
        default:
        {
          __line += __buffer;
        }
      }
      if(__type==IDENTIFIER)
      {
        __previous_type=__type;
        __previous_value = __buffer;
      }
      if (__has_hit_max_line_chars)
      {
        __line += " … ";
      }
    }
    __buffer='';
  }

  var read_buffer_with_parse_error = function()
  {
    if (__buffer && !__has_hit_max_line_chars)
    {
      __char_count += __buffer.length;
      // To handle the width limit (instaed of overflow hidden).
      // Opera 12 will no longer have that limit, so this is just temporary.
      if (__char_count > __max_line_chars)
      {
        __buffer = __buffer.slice(0, __buffer.length - (__char_count - __max_line_chars));
        __has_hit_max_line_chars = true;
      }
      if(__line_number < __parse_error_line)
      {
        read_buffer_default();
      }
      else if(__line_number == __parse_error_line)
      {

        __parse_error_line_buffer += __buffer;
        if(__parse_error_line_offset >= __parse_error_line_buffer.length)
        {
          read_buffer_default();

        }
        else
        {
          if(__parse_error_first_token)
          {
            __line = "<div class='error-description'>" +
                        helpers.escapeTextHtml(__parse_error_description) +
                        "</div>" +
                        "<span class='not-error'>" +  __line + "</span>" +
                        "<span class='first-error'>" +  __buffer + "</span>";
            __parse_error_first_token = false;
          }
          else
          {
            __line += "<span class='error'>" +  __buffer + "</span>";
          }

        }

      }
      else
      {
        __line += __buffer ;
      }
      if (__has_hit_max_line_chars)
      {
        __line += " … ";
      }
    }
    __buffer='';
  }

  var __online=null;

  var __online_default=function(c)
  {
    if( !__line )
    {
      __line += '\u00A0';
    }
    __ret[__ret.length] = __line_number >=  __highlight_line_start &&
                          __line_number <=  __highlight_line_end ?
                          "<" + __current_line_ele + " class='highlight-source' data-line-number='" + (__line_number+1) + "'>" + __line + "</" + __current_line_ele + ">" :
                          "<" + __current_line_ele + " data-line-number='" + (__line_number+1) + "'>" + __line + "</" + __current_line_ele + ">";
    __line='';
    __buffer = '';
    __has_hit_max_line_chars = false;
    __char_count = 0;
    return (++__line_number) > __max_line_number;
  }

  var __online_parse_error=function(c)
  {
    if( !__line )
    {
      __line += '\u00A0';
    }
    if(__line_number < __parse_error_line)
    {
      __ret[__ret.length] = "<" + __current_line_ele + " data-line-number='" + (__line_number+1) + "'>" + __line + "</" + __current_line_ele + ">";
    }
    else if(__line_number == __parse_error_line)
    {
      __ret[__ret.length] = "<" + __current_line_ele + " class='first-error-line' data-line-number='" + (__line_number+1) + "'>" + __line + "</" + __current_line_ele + ">";
    }
    else
    {
      __ret[__ret.length] = "<" + __current_line_ele + " class='error-line error' data-line-number='" + (__line_number+1) + "'>" + __line + "</" + __current_line_ele + ">";
    }
    __line='';
    __buffer = '';
    __has_hit_max_line_chars = false;
    __char_count = 0;
    return (++__line_number) > __max_line_number;
  }

  var __onfinish=function()
  {
    __online();
    return __ret;
  }

  var __reset = function(line, max_line)
  {
    __ret=[];
    __line='';
    __line_number = line;
    __max_line_number = line + max_line;
    __has_hit_max_line_chars = false;
    __char_count = 0;
    __max_line_chars = 32000 / window.defaults['js-source-char-width'] >> 0;
  }

  var states = [];
  states[COMMENT_STATE] = function()
  {
     __type = COMMENT;
    if( multiline_comment_parser(__source.charAt(__pointer)) )
    {
      return __ret;
    }
    __pointer++;
  };

  // const DEFAULT_STATE = 0, SINGLE_QUOTE_STATE = 1, DOUBLE_QUOTE_STATE = 2, REG_EXP_STATE = 3, COMMENT_STATE = 4;
  states[SINGLE_QUOTE_STATE] = function()
  {
    opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
      'state parsing not implemented in formatter.js for SINGLE_QUOTE');
  };

  states[SINGLE_QUOTE_STATE] = function()
  {
    __string_delimiter= "'";
    __type=STRING;
    if( string_parser(__source.charAt(__pointer)) )
    {
      return __ret;
    }
    __pointer++;
  };

  states[DOUBLE_QUOTE_STATE] = function()
  {

    __string_delimiter= '"';
    __type=STRING;
    if( string_parser(__source.charAt(__pointer)) )
    {
      return __ret;
    }
    __pointer++;
  };

  states[REG_EXP_STATE] = function()
  {
    opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
      'state parsing not implemented in formatter.js for REG_EXP');
  };

  this.format = function(script, line, max_line, highlight_start, highlight_end, line_ele_name)
  {
    if (typeof highlight_start == "number" && typeof highlight_end == "number")
    {
      __highlight_line_start = highlight_start;
      __highlight_line_end = highlight_end;
    }
    else
    {
      __highlight_line_start = -1;
      __highlight_line_end = -1;
    }

    if (typeof line_ele_name == 'string')
    {
      __current_line_ele = line_ele_name;
    }
    else
    {
      __current_line_ele = __default_line_ele;
    }

    __reset(line, max_line);

    parser=default_parser;
    __previous_type='';
    __type=IDENTIFIER;
    __source = script.script_data;
    __escape = ESCAPE;
    var length=__source.length;
    __pointer = script.line_arr[line];

    if(script.parse_error)
    {
      read_buffer = read_buffer_with_parse_error;
      __online = __online_parse_error;
      __parse_error_line = script.parse_error.error_line;
      __parse_error_line_offset = script.parse_error.error_line_offset;
      __parse_error_line_buffer ='';
      __parse_error_first_token = true;
      __parse_error_description = script.parse_error.description;
    }
    else
    {
      read_buffer = read_buffer_default;
      __online = __online_default;
    }


    if(script.state_arr[line])
    {
      if( states[script.state_arr[line]]() )
      {
        return __ret;
      }
    }
    if( parser(__source.charAt(__pointer)) )
    {
      return __ret;
    }
    if(__onfinish)
    {
      return __onfinish();
    }
  }

  this.parse = function(script, token_arr, type_arr)
  {
    parser = default_parser;
    __previous_type = '';
    __type = IDENTIFIER;
    __escape = {};
    __source = script;
    __pointer = 0;
    __token_arr = token_arr;
    __token_type_arr = type_arr;
    __online = __online_with_arrs;
    read_buffer = __read_buffer_with_arrs;
    parser(__source.charAt(__pointer));
  }

  this.tokenize = function(script_source, ontoken, escape, start_state)
  {
    parser = default_parser;
    __previous_type = '';
    __type = IDENTIFIER;
    __escape = escape == "html" && ESCAPE || {};
    __source = script_source;
    __pointer = 0;
    __ontoken = ontoken;
    __online = __online_tokenize;
    read_buffer = __read_buffer_tokenize;
    if (start_state)
    {
      if (states[start_state]())
      {
        return;
      }
    }
    parser(__source.charAt(__pointer));
  };

  var __online_raw = function(c)
  {
    __ret.push(__line);
    __line = '';
    __buffer = '';
    return false;
  }

  this.format_source = function(source)
  {
    __reset(0, 0);
    parser = default_parser;
    __previous_type = '';
    __type = IDENTIFIER;
    __source = source;
    __escape = ESCAPE;
    __pointer = 0;
    read_buffer = read_buffer_default;
    __online = __online_raw;
    parser(__source.charAt(__pointer));
    // empty the buffer in case the source does not end with a line ending
    __online();
    return __ret;
  }

};
