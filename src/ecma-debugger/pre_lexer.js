var pre_lexer = function(script)
{
  var input = script.source, line_arr = script.line_arr, state_arr = script.state_arr;
  var cur_cur = -1;
  var line_cur = 0;
  var line_cur_prev = -1;
  var s_quote_cur = -2;
  var d_quote_cur = -2;
  var slash_cur = -2;

  var min_cur = 0;

  var s_quote_val = '\'';
  var d_quote_val = '"';
  var slash_val = '/';

  var line_count = 0;

  var temp_count = 0;

  var temp_char = '';

  var temp_type = '';


  var string = new String(input);
  // states = default, s_quote, d_qute, slash
  var DEFAULT = 0, SINGLE_QUOTE = 1, DOUBLE_QUOTE = 2, REG_EXP = 3, COMMENT = 4;
  // lexer_states = default, s_quote, d_qute, slash
  var lex_state = 'DEFAULT'; // SINGLE_QUOTE; DOUBLE_QUOTE; SLASH
  var LEX_S_QUOTE = 1;
  var state = '';

  var get_min = Math.min;
  var get_max = Math.max;


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
      while( line_cur < min_cur )
      {
        line_arr[line_count++] = line_cur;
        if( ( line_cur = string.indexOf('\n', line_cur) + 1 ) == 0 )
        {
          return;
        } 
      }
      switch( state )
      {
        case 'SINGLE_QUOTE':
        {
          do
          {
            s_quote_cur = string.indexOf(s_quote_val, s_quote_cur + 1);
            temp_count = 0;
            while( string.charAt( s_quote_cur - temp_count - 1 )=='\\' )
            {
              temp_count++;
            }
          }
          while ( ( temp_count&1 ) && s_quote_cur != -1 );
          if( s_quote_cur != -1 )
          {
            cur_cur = s_quote_cur;
            while( line_cur < cur_cur )
            {
              line_arr[line_count] = line_cur;
              state_arr[line_count++] = SINGLE_QUOTE;
              if( ( line_cur = string.indexOf('\n', line_cur) + 1 ) == 0 )
              {
                return;
              }
            }
          }
          continue;
        }
        case 'DOUBLE_QUOTE':
        {
          do
          {
            d_quote_cur = string.indexOf(d_quote_val, d_quote_cur + 1);
            temp_count = 0;
            while( string.charAt( d_quote_cur - temp_count - 1 )=='\\' )
            {
              temp_count++;
            }
          }
          while ( ( temp_count&1 ) && d_quote_cur != -1 );
          if( d_quote_cur != -1 )
          {
            cur_cur = d_quote_cur;
            while( line_cur < cur_cur )
            {
              line_arr[line_count] = line_cur;
              state_arr[line_count++] = DOUBLE_QUOTE;
              if( ( line_cur = string.indexOf('\n', line_cur) + 1 ) == 0 )
              {
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
              cur_cur = string.indexOf('\n', slash_cur+2);
              while( line_cur < cur_cur )
              {
                line_arr[line_count++] = line_cur;
                if( ( line_cur = string.indexOf('\n', line_cur) + 1 ) == 0 )
                {
                  return;
                }
              }
              continue;
            }
            case '*':
            {
              do
              {
                slash_cur = string.indexOf('*', slash_cur + 1);
                temp_char = string.charAt(slash_cur + 1);
              }
              while ( slash_cur != -1 && temp_char && temp_char != '/');
              if( slash_cur != -1 )
              {
                cur_cur = slash_cur+1;
                while( line_cur < cur_cur )
                {
                  line_arr[line_count] = line_cur;
                  state_arr[line_count++] = COMMENT;
                  if( ( line_cur = string.indexOf('\n', line_cur) + 1 ) == 0 )
                  {
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
                    if( ( line_cur = string.indexOf('\n', line_cur) + 1 ) == 0 )
                    {
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
        line_cur = string.indexOf('\n', line_cur) + 1 ;
        if( line_cur )
        {
          line_arr[line_count++] = 0;
        }
      }
      while( line_cur )
      {
        line_arr[line_count++] = line_cur;
        line_cur = string.indexOf('\n', line_cur + 1) + 1;
      }
      return;
    }
  }
}
