window.cls || (window.cls = {});

window.cls.NewScript = function(message)
{
  const
  RUNTIME_ID = 0,
  SCRIPT_ID = 1,
  SCRIPT_TYPE = 2,
  SCRIPT_DATA = 3,
  URI = 4;

  this.runtime_id = message[RUNTIME_ID];
  this.script_id = message[SCRIPT_ID];
  this.script_type = message[SCRIPT_TYPE];
  this.script_data = message[SCRIPT_DATA] || '';
  this.uri = message[URI];
  this.breakpoints = {};
  this.breakpoint_states = [];
  this.line_pointer = {line: 0, state: 0};
  this.stop_ats = [];
  this.scroll_height = 0;
  this.scroll_width = 0;
};

window.cls.NewScript.BP_NONE = 0;
window.cls.NewScript.BP_DISABLED = 3;
window.cls.NewScript.BP_DISABLED_CONDITION = 6;
window.cls.NewScript.BP_ENABLED = 9;
window.cls.NewScript.BP_ENABLED_CONDITION = 12;
window.cls.NewScript.LINE_POINTER_TOP = 1;
window.cls.NewScript.LINE_POINTER = 2;
/* line state */
window.cls.NewScript.DEFAULT_STATE = 0;
window.cls.NewScript.SINGLE_QUOTE_STATE = 1;
window.cls.NewScript.DOUBLE_QUOTE_STATE = 2;
window.cls.NewScript.REG_EXP_STATE = 3;
window.cls.NewScript.COMMENT_STATE = 4;

window.cls.NewScriptPrototype = function()
{
  var WHITESPACE = cls.SimpleJSParser.WHITESPACE;
  var LINETERMINATOR = cls.SimpleJSParser.LINETERMINATOR;
  var IDENTIFIER = cls.SimpleJSParser.IDENTIFIER;
  var NUMBER = cls.SimpleJSParser.NUMBER;
  var STRING = cls.SimpleJSParser.STRING;
  var PUNCTUATOR = cls.SimpleJSParser.PUNCTUATOR;
  var DIV_PUNCTUATOR = cls.SimpleJSParser.DIV_PUNCTUATOR;
  var REG_EXP = cls.SimpleJSParser.REG_EXP;
  var COMMENT = cls.SimpleJSParser.COMMENT;
  var TYPE = 0;
  var VALUE = 1;
  var _tokenizer = new cls.SimpleJSParser();

  /**
    * Searches the actual data.
    * Updates the script object with the following properties for all matches:
    *   - line_matches, a list of all matches in the source,
    *     the values are the lines numbers of a given match
    *   - line_offsets, a list of all matches in the source,
    *     the values are the character offset in the line of the match
    *   - match_cursor, pointing to the selected match
    *   _ match_length, the length of the search term
    */
  this.search_source = function(search_term, is_ignore_case, is_reg_exp)
  {
    if (is_ignore_case && !is_reg_exp)
    {
      search_term = search_term.toLowerCase();
    }
    if (is_reg_exp)
    {
      search_term = new RegExp(search_term, is_ignore_case ? 'ig' : 'g');
    }
    if (this.search_term != search_term ||
        this.is_ignore_case != is_ignore_case ||
        this.is_reg_exp != is_reg_exp)
    {
      if (!this.line_arr)
      {
        this.set_line_states();
      }
      this.clear_search();
      this.search_term = search_term;
      this.is_ignore_case = is_ignore_case;
      this.is_reg_exp = is_reg_exp;
      this.match_length = search_term.length;
      if (!this.script_data_lower)
      {
        this.script_data_lower = this.script_data.toLowerCase();
      }
      if (search_term)
      {
        var pos = -1;
        var line_cur = 0;
        var index = 0;
        var line_arr_length = this.line_arr.length;
        var match = null;
        while (true)
        {
          if (is_reg_exp)
          {
            match = search_term.exec(this.script_data);
            pos = match ? match.index : -1;
          }
          else if (is_ignore_case)
          {
            pos = this.script_data_lower.indexOf(search_term, pos + 1);
          }
          else
          {
            pos = this.script_data.indexOf(search_term, pos + 1);
          }

          if (pos == -1)
          {
            break;
          }

          while (line_cur < line_arr_length && this.line_arr[line_cur] <= pos)
          {
            ++line_cur;
          }

          this.line_matches[index] = line_cur;
          this.line_offsets[index] = pos - this.line_arr[line_cur - 1];
          if (is_reg_exp)
          {
            this.line_offsets_length[index] = match[0].length
          }
          index++;
        }
      }
    }
  };

  this.get_line_length = function(index)
  {
    return index > 0
         ? this.line_arr[index] - this.line_arr[index - 1]
         : this.line_arr[0];
  }

  this.get_line = function(line_number)
  {
    if (!this.line_arr)
      this.set_line_states();

    if (line_number > 0 && this.line_arr[line_number])
      return this.script_data.slice(this.line_arr[line_number - 1],
                                    this.line_arr[line_number]);
    return "";
  };

  this.clear_search = function()
  {
    this.search_term = "";
    this.line_matches = [];
    this.line_offsets = [];
    this.line_offsets_length = [];
    this.match_cursor = -1;
    this.match_length = 0;
  };

  this.__defineGetter__("is_minified", function()
  {
    if (this._is_minified === undefined)
    {
      var MAX_SLICE = 5000;
      var LIMIT = 11;
      var re = /\s+/g;
      var ws = 0;
      var m = null;
      var src = this.script_data.slice(0, MAX_SLICE);
      while (m = re.exec(src))
        ws += m[0].length;

      this._is_minified = (100 * ws / src.length) < LIMIT;
    }
    return this._is_minified;
  });

  this.__defineSetter__("is_minified", function() {});

  this.get_function = function(line_number)
  {
    if (this.is_minified)
      return null;

    var start_line = -1;
    var end_line = -1;
    var index = -1;
    var tokens = null;
    var op_bracket_count = 0;
    while (start_line == -1 && line_number > -1)
    {
      tokens = this._get_tokens_of_line(line_number);
      for (var i = 0, token; token = tokens[i]; i++)
      {
        if (token[TYPE] == IDENTIFIER && token[VALUE] == "function")
        {
          start_line = line_number;
          index = i;
        }
      }
      if (index == -1)
        line_number--;
    }
    while (!op_bracket_count && line_number <= this.line_arr.length)
    {
      for (var i = index, token; token = tokens[i]; i++)
      {
        if (token[TYPE] == PUNCTUATOR && token[VALUE] == "{")
        {
          op_bracket_count++;
          index = i + 1;
          break;
        }
      }
      if (!token)
      {
        index = 0;
        tokens = this._get_tokens_of_line(++line_number);
      }
    }
    while (op_bracket_count && end_line == -1 && line_number <= this.line_arr.length)
    {
      for (var i = index, token; token = tokens[i]; i++)
      {
        if (token[TYPE] == PUNCTUATOR)
        {
          if (token[VALUE] == "{")
            op_bracket_count++;
          else if (token[VALUE] == "}")
          {
            op_bracket_count--;
            if (!op_bracket_count)
            {
              end_line = line_number;
              break;
            }
          }
        }
      }

      if (end_line == -1)
      {
        index = 0;
        tokens = this._get_tokens_of_line(++line_number);
      }
    }
    return start_line > -1 && end_line > -1
         ? {start_line: start_line, end_line: end_line}
         : null;
  };

  this._get_tokens_of_line = function(line_number)
  {
    if (!this.line_arr)
      this.set_line_states();

    var tokens = [];
    var line = this.get_line(line_number);
    var start_state = this.state_arr[line_number - 1];
    if (line)
    {
      _tokenizer.tokenize(line, function(token_type, token)
      {
        tokens.push([token_type, token]);
      }, false, start_state);
    }
    return tokens;
  };

  this.set_line_states = function()
  {
    this.line_arr = [];
    this.state_arr = [];
    var input = this.script_data, line_arr = this.line_arr, state_arr = this.state_arr;
    var cur_cur = -1;
    var line_cur = 0;
    var line_cur_prev = -1;
    var s_quote_cur = -2;
    var d_quote_cur = -2;
    var slash_cur = -2;
    var nl_cur = 0;
    var cr_cur = 0;


    var min_cur = 0;

    var s_quote_val = '\'';
    var d_quote_val = '"';
    var slash_val = '/';
    var NL = '\n';
    var CR = '\r';

    var eol = NL;
    // old mac end of lines
    if (/\r(?!\n)/.test(input))
    {
      eol = CR;
    }

    var line_count = 0;

    var temp_count = 0;

    var temp_char = '';

    var temp_type = '';


    var string = input;
    // states = default, s_quote, d_qute, slash
    var DEFAULT = window.cls.NewScript.DEFAULT_STATE;
    var SINGLE_QUOTE = window.cls.NewScript.SINGLE_QUOTE_STATE;
    var DOUBLE_QUOTE = window.cls.NewScript.DOUBLE_QUOTE_STATE;
    var REG_EXP = window.cls.NewScript.REG_EXP_STATE;
    var COMMENT = window.cls.NewScript.COMMENT_STATE;
    // lexer_states = default, s_quote, d_qute, slash
    var lex_state = 'DEFAULT'; // SINGLE_QUOTE; DOUBLE_QUOTE; SLASH
    var LEX_S_QUOTE = 1;
    var state = '';

    var get_min = Math.min;
    var get_max = Math.max;

    var handle_strings = function(ref_pos, ref_val)
    {
      // ensure that a string never exceeds the current
      // line if the newline is not escaped
      var temp_count = 0;
      var is_cr = 0;
      var nl_cur = string.indexOf(eol, ref_pos + 1);
      do
      {
        // newline was escaped
        if (temp_count && (nl_cur == ref_pos))
          nl_cur = string.indexOf(eol, nl_cur + 1);
        ref_pos = string.indexOf(ref_val, ref_pos + 1);
        if (nl_cur > -1 && nl_cur < ref_pos)
        {
          ref_pos = nl_cur;
          is_cr = (eol == NL && string[nl_cur - 1] == CR) ? 1 : 0;
        }
        temp_count = 0;
        while (string.charAt(ref_pos - temp_count - 1 - is_cr) == '\\')
          temp_count++;
      }
      while ((temp_count & 1) && ref_pos != -1);
      return ref_pos;
    };

    while( min_cur != -1 )
    {

      state = '';
      if( ( s_quote_cur != -1 ) && ( s_quote_cur <= cur_cur ) )
      {
        s_quote_cur = string.indexOf(s_quote_val, cur_cur + 1);
      }
      if( ( d_quote_cur != -1 ) && ( d_quote_cur <= cur_cur ) )
      {
        d_quote_cur = string.indexOf(d_quote_val, cur_cur + 1);
      }
      if( ( slash_cur != -1 ) && ( slash_cur <= cur_cur ) )
      {
        slash_cur = string.indexOf(slash_val, cur_cur + 1);
      }
      // get the minimum, but bigger then -1
      min_cur = get_max(s_quote_cur, d_quote_cur, slash_cur);
      if( s_quote_cur != -1 && s_quote_cur <= min_cur)
      {
        min_cur = s_quote_cur;
        state = 'SINGLE_QUOTE';
      }
      if( d_quote_cur != -1 && d_quote_cur <= min_cur )
      {
        min_cur = d_quote_cur;
        state = 'DOUBLE_QUOTE';
      }
      if( slash_cur != -1 && slash_cur <= min_cur )
      {
        min_cur = slash_cur;
        state = 'SLASH';
      }
      if( state )
      {

        while( line_cur <= min_cur )
        {
          line_arr[line_count++] = line_cur;
          if( ( line_cur = string.indexOf(eol, line_cur) + 1 ) == 0 )
          {
            if( line_arr[ line_arr.length - 1 ] < string.length )
            {
              line_arr[line_count] = string.length;
            }
            return;
          }
        }
        switch( state )
        {
          case 'SINGLE_QUOTE':
          {
            s_quote_cur = handle_strings(s_quote_cur, s_quote_val);
            if( s_quote_cur != -1 )
            {
              cur_cur = s_quote_cur;
              while( line_cur < cur_cur )
              {
                line_arr[line_count] = line_cur;
                state_arr[line_count++] = SINGLE_QUOTE;
                if( ( line_cur = string.indexOf(eol, line_cur) + 1 ) == 0 )
                {
                  if( line_arr[ line_arr.length - 1 ] < string.length )
                  {
                    line_arr[line_count] = string.length;
                  }
                  return;
                }
              }
            }
            continue;
          }
          case 'DOUBLE_QUOTE':
          {
            d_quote_cur = handle_strings(d_quote_cur, d_quote_val);
            if( d_quote_cur != -1 )
            {
              cur_cur = d_quote_cur;
              while( line_cur < cur_cur )
              {
                line_arr[line_count] = line_cur;
                state_arr[line_count++] = DOUBLE_QUOTE;
                if( ( line_cur = string.indexOf(eol, line_cur) + 1 ) == 0 )
                {
                  if( line_arr[ line_arr.length - 1 ] < string.length )
                  {
                    line_arr[line_count] = string.length;
                  }
                  return;
                }
              }
            }

            continue;
          }
          case 'SLASH':
          {
            switch(string.charAt(slash_cur+1))
            {
              case '/':
              {
                cur_cur = string.indexOf(eol, slash_cur+2);
                while( line_cur < cur_cur )
                {
                  line_arr[line_count++] = line_cur;
                  if( ( line_cur = string.indexOf(eol, line_cur) + 1 ) == 0 )
                  {
                    if( line_arr[ line_arr.length - 1 ] < string.length )
                    {
                      line_arr[line_count] = string.length;
                    }
                    return;
                  }
                }
                continue;
              }
              case '*':
              {
                // skip the first '*'
                slash_cur++;

                do
                {
                  slash_cur = string.indexOf('*', slash_cur + 1);
                  temp_char = string.charAt(slash_cur + 1);
                }
                while ( slash_cur != -1 && temp_char && temp_char != '/');
                if( slash_cur != -1 )
                {
                  cur_cur = slash_cur+1;
                  while (line_cur < cur_cur)
                  {
                    line_arr[line_count] = line_cur;
                    state_arr[line_count++] = COMMENT;

                    if ((line_cur = string.indexOf(eol, line_cur) + 1) == 0)
                    {
                      if (line_arr[ line_arr.length - 1 ] < string.length)
                      {
                        line_arr[line_count] = string.length;
                      }
                      return;
                    }
                  }
                }
                continue;
              }
              default:
              {
                temp_count = 1;
                do
                {
                  temp_char = string.charAt(slash_cur-temp_count);
                  temp_count++;
                }
                while ( temp_char == ' ' && ( slash_cur - temp_count > 0 ) );
                switch(temp_char)
                {
                  case '=':
                  case '(':
                  case '[':
                  case ':':
                  case ',':
                  case '!':
                  {
                    temp_type = 'REG_EXP';
                    break;
                  }
                  case '&':
                  case '|':
                  {
                    if(string.charAt(slash_cur-temp_count) == temp_char)
                    {
                      temp_type = 'REG_EXP';
                      break;
                    }
                  }
                  default:
                  {
                    temp_type = '';
                  }
                }
                if(temp_type == 'REG_EXP')
                {
                  do
                  {
                    slash_cur = string.indexOf(slash_val, slash_cur + 1);
                    temp_count = 0;
                    while( string.charAt( slash_cur - temp_count - 1 )=='\\' )
                    {
                      temp_count++;
                    }
                  }
                  while ( ( temp_count&1 ) && slash_cur != -1 );
                  if( slash_cur != -1 )
                  {
                    cur_cur = slash_cur;
                    while( line_cur < cur_cur )
                    {
                      line_arr[line_count] = line_cur;
                      state_arr[line_count++] = REG_EXP;
                      if( ( line_cur = string.indexOf(eol, line_cur) + 1 ) == 0 )
                      {
                        if( line_arr[ line_arr.length - 1 ] < string.length )
                        {
                          line_arr[line_count] = string.length;
                        }
                        return;
                      }
                    }
                  }
                  continue;
                }
                else // should be a division
                {
                  cur_cur = slash_cur;
                  continue;
                }
              }
            }
          }
        }
      }
      else
      {
        if( !line_cur && !line_arr.length )
        {
          line_cur = string.indexOf(eol, line_cur) + 1 ;
          if( line_cur  || string.length )
          {
            line_arr[line_count++] = 0;
          }
        }
        while( line_cur )
        {
          line_arr[line_count++] = line_cur;
          line_cur = string.indexOf(eol, line_cur) + 1;
        }
        if( line_arr[ line_arr.length - 1 ] < string.length )
        {
          line_arr[line_count] = string.length;
        }

        return;
      }
    }
  }
};

window.cls.NewScriptPrototype.prototype = new URIPrototype("uri");
window.cls.NewScript.prototype = new window.cls.NewScriptPrototype();
