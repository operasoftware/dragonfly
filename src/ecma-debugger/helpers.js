helpers = new function()
{
  this.formatScript = function(data)
  {
    /* *
    var ret = '<ol>';
    var lines = data.split('\n'), length = lines.length, line='', i=0;
    for( ; i<length; i++)
    {
      line = lines[i];
      if (!line.length) line ='\u00A0';
      ret += "<li line='" + i + "'><span><![CDATA["+line+"]]></span></li>";
    }
    ret +="</ol>";
    return ret;
    /* */

    return simple_js_parser.parse(data, new helpers.GetJS());

  }

  this.GetJS = function()
  {
    var ret='<ol>';
    var line='';
    var cursor=1;
    var __puffer = '';
    var reset_line=function()
    {
      line += __puffer;
      if( !line ) 
      {
        line += '\u00A0';
      }

        ret += "<li><span>" + line + "</span></li>";
        __puffer='';
        line='';

    }
    var highlight=function(value, _class)
    {
      line += __puffer +
        "<span class='" + _class + "'>" +  value + "</span>";
      __puffer = '';
    }
    this.onread=function(type, puffer)
    {
      /* 
      WHITESPACE, 
      LINE_TERMINATOR, 
      NUMBER, 
      STRING, 
      PUNCTUATOR, 
      DIV_PUNCTUIATOR, 
      IDENTIFIER, 
      REG_EXP
      */
      //opera.postError(type+' : '+puffer)
      switch (type)
      {
        
        case 'STRING':
        {
          highlight(puffer, 'string');
          break;
        }
        case 'IDENTIFIER':
        {
          if(puffer in js_keywords)
          {
            highlight(puffer, 'js_keywords');
          }
          else if(puffer in js_builtins)
          {
            highlight(puffer, 'js_builtins');
          }
          else
          {
            __puffer += puffer;
          }
          break;
        }
        case 'NUMBER':
        {
          highlight(puffer, 'number');
          break;
        }
        case 'COMMENT':
        {
          highlight(puffer, 'comment');
          break;
        }
        case 'REG_EXP':
        {
          highlight(puffer, 'reg_exp');
          break;
        }
        default:
        {
          __puffer += puffer;
        }
      }
    }
    this.onlineterminator=function(c)
    {
      reset_line();
    }
    this.onfinish=function()
    {
      reset_line();
      return ret + "</ol>";
    }
  }
}