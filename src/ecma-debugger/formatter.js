var simple_js_parser=new function()
{
  /* adjusted to return fotmatted HTML */

  const DEFAULT = 0, SINGLE_QUOTE = 1, DOUBLE_QUOTE = 2, REG_EXP = 3, COMMENT = 4;

  var parser=null;
  var __source=null;
  var __buffer='';
  var __pointer=0;
  var __char=String.fromCharCode
  var __type=''; // WHITESPACE, LINE_TERMINATOR, NUMBER, STRING, PUNCTUATOR, DIV_PUNCTUIATOR, IDENTIFIER, REG_EXP
  var __previous_type='';
  var __previous_value='';
  var __string_delimiter=0;
  var __ret='<ol>';
  var __line='';
  var __line_number = 1;
  var __max_line_number = 0;
  
  var __parse_error_line = 0;
  var __parse_error_line_offset = 0;
  var __parse_error_line_buffer ='';
  var __parse_error_first_token = true;
  var __parse_error_description = "";
  var WHITESPACE=
  {
    '\u0009': 1, //  Tab <TAB>
    '\u000B': 1, //  Vertical Tab <VT>
    '\u000C': 1, //  Form Feed <FF>
    '\u0020': 1, //  Space <SP>
    '\u00A0': 1  //  No-break space <NBSP>
  }
  var LINETERMINATOR=
  {
    '\u000A': 1, //  Line Feed <LF>
    '\u000D': 1, //  Carriage Return <CR>
    '\u000D\u000A': 1,
    '\u2028': 1, //  Line separator <LS>
    '\u2029': 1 //  Paragraph separator <PS>
  }
  var NUMBER=
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
  var PUNCTUATOR=
  {
    '{': '{',
    '}': '}',
    '(': '(',
    ')': ')',
    '[': '[',
    ']': ']',
    ';': ';',
    ',': ',',
    '<': '&lt;',
    '>': '>',
    '=': '=',
    '!': '!',
    '+': '+',
    '-': '-',
    '*': '*',
    '%': '%',
    '&': '&',
    '|': '|',
    '^': '^',
    '~': '~',
    '?': '?',
    ':': ':',
    '.': '.'
  }
  var PUNCTUATOR_2=
  {
    '=': '=',
    '+': '+',
    '-': '-',
    '<': '&lt;',
    '>': '>',
    '&': '&',
    '|': '|'
  }
  var STRING_DELIMITER=
  {
    '"': 1,
    '\'': 1
  }
  var HEX_NUMBER=
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
  var REG_EXP_FLAG=
  {
    'g': 1,
    'i': 1,
    'm': 1
  }
  var PUNCTUATOR_DIV_PREDECESSOR=
  {
    ')': 1,
      ']': 1
  }
  var ESCAPE =
  {
    '<': '&lt;',
    '&': '&amp;'
  }
  var default_parser=function(c)
  {
    var CRLF='';
    __previous_value='';
    while(c)
    {
      if(c in WHITESPACE)
      {
        read_buffer();
        __type='WHITESPACE';
        do
        {
          __buffer+=c;
          c=__source.charAt(++__pointer);
        }
        while (c in WHITESPACE);
        read_buffer();
        __type='IDENTIFIER';
      }

      if(c in LINETERMINATOR)
      {
        read_buffer();
        CRLF=c;
        CRLF+=c=__source.charAt(++__pointer);
        if(CRLF in LINETERMINATOR)
        {
          c=__source.charAt(++__pointer);
        }
        if(__online && __online())
        {
          return __ret;
        }
        continue;
      }
    
      if(c in NUMBER)
      {
        read_buffer();
        __buffer+=c;
        __type='NUMBER';
        c=__source.charAt(++__pointer);
        if(c=='x' || c=='X') 
        {
          __buffer+=c;
          c=number_hex_parser(__source.charAt(++__pointer));
        }
        else
        {
          c=number_dec_parser(c);
        }
        continue;
      }

      if(c in STRING_DELIMITER)
      {
        read_buffer();
        __string_delimiter=c;
        __buffer+=c;
        __type='STRING';
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
        if(c in NUMBER)
        {
          __type='NUMBER';
          c=number_dec_parser(c);
          continue;
        }
        else
        {
          __type='PUNCTUATOR';
          read_buffer();
          __type='IDENTIFIER';
          continue;
        }
      }
      
      if(c in PUNCTUATOR)
      {
        read_buffer();
        __type='PUNCTUATOR';
        do
        {
          __buffer+=PUNCTUATOR[c];
          c=__source.charAt(++__pointer);
        }
        while (c in PUNCTUATOR_2);
        __previous_value=__buffer;
        read_buffer();
        __previous_type=__type;
        __type='IDENTIFIER';
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
          __type='COMMENT';
          if( multiline_comment_parser(__source.charAt(++__pointer)) )
          {
            return __ret;
          }
          c=__source.charAt(++__pointer)
          
          continue;
        }
        if(c=='/')  
        {
          __buffer+=c;
          __type='COMMENT';
          if( singleline_comment_parser(__source.charAt(++__pointer)) )
          {
            return __ret;
          }
          c = __source.charAt(__pointer);
          continue;
        }
        if( __previous_type=='IDENTIFIER' || __previous_type=='NUMBER' || 
          (__previous_type=='PUNCTUATOR' && __previous_value in PUNCTUATOR_DIV_PREDECESSOR))
        {
          __type='DIV_PUNCTUIATOR';
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
          __type='IDENTIFIER';
          continue;
        }
        __type='REG_EXP';
        c=reg_exp_parser(c);
        continue;
      }
      __buffer+=c in ESCAPE ? ESCAPE[c] : c;
      c=__source.charAt(++__pointer);
      // read identifier
      // numbers can be part of identifier
      do
      {
        __buffer+=c in ESCAPE ? ESCAPE[c] : c;
        c=__source.charAt(++__pointer);
      }
      
      while (c && !(c in PUNCTUATOR  
                    || c=='/' 
                    || c in LINETERMINATOR  
                    || c in WHITESPACE 
                    || c in STRING_DELIMITER ));
    }
    read_buffer();
  }

  var number_hex_parser=function(c)
  {
    while(c in HEX_NUMBER)
    {
      __buffer+=c;
      c=__source.charAt(++__pointer);
    }
    read_buffer();
    __previous_type=__type;
    __type='IDENTIFIER';
    return c;
  }

  var number_dec_parser=function(c)
  {
    while(c in NUMBER || c=='.')
    {
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
      while(c in NUMBER)
      {
        __buffer+=c;
        c=__source.charAt(++__pointer);
      }
    }
    read_buffer();
    __previous_type='NUMBER';
    __type='IDENTIFIER';
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
        if(c in LINETERMINATOR)
        {
          read_buffer();
          CRLF=c;
          CRLF+=c=__source.charAt(++__pointer);
          if(CRLF in LINETERMINATOR)
          {
            c=__source.charAt(++__pointer);
          }
          if(__online && __online())
          {
            return __ret;
          }
          continue;
        }
        else
        {
        __buffer+=c in ESCAPE ? ESCAPE[c] : c;
        c=__source.charAt(++__pointer);
        continue;
        }
      }
      if(c==__string_delimiter)
      {
        __buffer+=c;
        read_buffer();
        __previous_type='STRING';
        __type='IDENTIFIER';
        break;
      }
      __buffer+=c in ESCAPE ? ESCAPE[c] : c;
      c=__source.charAt(++__pointer);
    }
  }

  var multiline_comment_parser=function(c)
  {
    var CRLF='';
    while(c)
    {
      if(c in LINETERMINATOR)
      {
        read_buffer();
        CRLF=c;
        CRLF+=c=__source.charAt(++__pointer);
        if(CRLF in LINETERMINATOR)
        {
          c=__source.charAt(++__pointer);
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
          __previous_type='COMMENT';
          __type='IDENTIFIER';
          break;
        }
        continue;
      }
      __buffer+=c in ESCAPE ? ESCAPE[c] : c;
      c=__source.charAt(++__pointer);
    }
  }

  var singleline_comment_parser=function(c)
  {
    var CRLF='';
    while(c)
    {
      if(c in LINETERMINATOR) 
      {
        read_buffer();
        __previous_type = 'COMMENT';
        __type = 'IDENTIFIER';
        CRLF = c;
        CRLF += c = __source.charAt(++__pointer);
        if( CRLF in LINETERMINATOR )
        {
          __pointer++;
        }
        if(__online && __online())
        {
          return __ret;
        }
        break;
      }
      __buffer+=c in ESCAPE ? ESCAPE[c] : c;
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
        __buffer+=c in ESCAPE ? ESCAPE[c] : c;
        c=__source.charAt(++__pointer);
        continue;
      }
      if( !is_in_brackets && c=='/' ) 
      {
        __buffer+=c;
        c=__source.charAt(++__pointer);
        while(c in REG_EXP_FLAG)
        {
          __buffer+=c;
          c=__source.charAt(++__pointer);
        }
        read_buffer();
        __previous_type='REG_EXP';
        __type='IDENTIFIER';
        return c;
      }
      __buffer+=c in ESCAPE ? ESCAPE[c] : c;
      c=__source.charAt(++__pointer);
    }
  }

  var read_buffer=null;

  var read_buffer_default=function()
  {
    if(__buffer)
    {
      switch (__type)
      {
        case 'STRING':
        {
          __line += "<span class='string'>" +  __buffer + "</span>";
          break;
        }
        case 'IDENTIFIER':
        {
          if(__buffer in js_keywords)
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
        case 'NUMBER':
        {
          __line += "<span class='number'>" +  __buffer + "</span>";
          break;
        }
        case 'COMMENT':
        {
          __line += "<span class='comment'>" +  __buffer + "</span>";
          break;
        }
        case 'REG_EXP':
        {
          __line += "<span class='reg_exp'>" +  __buffer + "</span>";
          break;
        }
        default:
        {
          __line += __buffer;
        }
      }
      if(__type=='IDENTIFIER')
      {
        __previous_type=__type;
      }
    }
    __buffer='';
  }

  var read_buffer_with_parse_error = function()
  {
    if(__buffer)
    {
      if(__line_number < __parse_error_line)
      {
        read_buffer_default();
      }
      else if(__line_number == __parse_error_line)
      {

        __parse_error_line_buffer += __buffer;
        if(__parse_error_line_offset > __parse_error_line_buffer.length) 
        {
          read_buffer_default();
           
        }
        else
        {
          if(__parse_error_first_token)
          {
            __line = "<div class='error-description'>" + __parse_error_description + "</div>" +
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
    __ret[__ret.length] = "<div>" + __line + "</div>";
    __line='';
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
      __ret[__ret.length] = "<div>" + __line + "</div>";
    }
    else if(__line_number == __parse_error_line)
    {
      __ret[__ret.length] = "<div class='first-error-line'>" + __line + "</div>";
    }
    else
    {
      __ret[__ret.length] = "<div class='error-line error'>" + __line + "</div>";
    }
    __line='';
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
  }

  var states = [];
  states[COMMENT] = function()
  {
     __type = 'COMMENT';
    if( multiline_comment_parser(__source.charAt(__pointer)) )
    {
      return __ret;
    }
    __pointer++;
  };

  // const DEFAULT = 0, SINGLE_QUOTE = 1, DOUBLE_QUOTE = 2, REG_EXP = 3, COMMENT = 4;
  states[SINGLE_QUOTE] = function()
  {
    opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
      'state parsing not implemented in formatter.js for SINGLE_QUOTE');
  };

  states[SINGLE_QUOTE] = function()
  {
    __string_delimiter= "'";
    __type='STRING';
    if( string_parser(__source.charAt(__pointer)) )
    {
      return __ret;
    }
    __pointer++;
  };

  states[DOUBLE_QUOTE] = function()
  {

    __string_delimiter= '"';
    __type='STRING';
    if( string_parser(__source.charAt(__pointer)) )
    {
      return __ret;
    }
    __pointer++;
  };

  states[REG_EXP] = function()
  {
    opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
      'state parsing not implemented in formatter.js for REG_EXP');
  };

  this.parse=function(script, line, max_line, state)
  {
    __reset(line, max_line);

    parser=default_parser;
    __previous_type='';
    __type='IDENTIFIER';
    __source = script.source;
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
      __parse_error_description = 
          script.parse_error.reason + '\n' + script.parse_error.expected_token;
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
}
