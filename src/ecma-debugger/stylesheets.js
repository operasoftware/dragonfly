var stylesheets = new function()
{
  var self = this;
  // document.styleSheets dict with runtime-id as key
  var __sheets = {};
  // document.styleSheets[index].cssRules with runtime-id and index as keys
  var __rules = {};
  var __indexMap = null;
  var __shorthandIndexMap = [];
  var __selectedRules = null;
  
  const
  SHEET_OBJECT_ID = 3, // TODO use the right obj-id
  SHEET_DISABLED = 0, 
  SHEET_HREF = 1, 
  SHEET_MEDIA_LIST = 2,  
  SHEET_OWNERNODE = 3, 
  SHEET_OWNERRULE = 4,  
  SHEET_PARENT_STYLESHEET = 5, 
  SHEET_TITLE = 6, 
  SHEET_TYPE = 7,
  UNKNOWN_RULE = 0,
  STYLE_RULE= 1,
  CHARSET_RULE = 2,
  IMPORT_RULE = 3,
  MEDIA_RULE = 4,
  FONT_FACE_RULE = 5,
  PAGE_RULE = 6,
  MARKUP_KEY = "<span class='key'>",
  MARKUP_KEY_CLOSE = "</span>: ",
  MARKUP_VALUE = "<span class='value'>",
  MARKUP_VALUE_CLOSE = "</span>",
  MARKUP_CLOSE = "</span>",
  MARKUP_PROP_NL = ";\n",
  MARKUP_IMPORTANT = " !important",
  MARKUP_SPACE = " ",
  MARKUP_EMPTY = ""
  
  var
  SHORTHAND = [];
  
  
/*
 RULE ::=    UNKNOWN-RULE
          | STYLE-RULE-MULTIPLE
          | CHARSET-RULE
          | IMPORT-RULE
          | MEDIA-RULE
          | FONT-FACE-RULE
          | PAGE-RULE

; http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSStyleRule

STYLE-RULE-MULTIPLE ::= "["
                         "[" STYLE-RULE-HEADER-MULTIPLE "],"
                         "[" INDEX-LIST "],"
                         "[" VALUE-LIST "],"
                         "[" PRIORITY-LIST "]"
                        "]"

STYLE-RULE-HEADER-MULTIPLE ::= STYLESHEET-ID "," RULE-ID "," RULE-TYPE "," SELECTOR-LIST "," SPECIFICITY-LIST

*/

  const
  RULE_HEADER = 0,
  INDENT = '  ';
  
  var shorthands = {};
  
  shorthands.margin = function(prop, index_list, value_list, priority_list)
  {
    var
    consistent_pri_flag = priority_list[1] == priority_list[2] &&
        priority_list[1] == priority_list[3] && priority_list[1] == priority_list[4];

    if(consistent_pri_flag)
    {
      var
      priority_flag = priority_list[1] ? MARKUP_IMPORTANT : MARKUP_EMPTY,
      top_bottom = value_list[1] == value_list[3],
      left_right = value_list[2] == value_list[4];
      
      if(top_bottom && left_right && value_list[1] == value_list[2])
      {
        return INDENT + MARKUP_KEY + prop + MARKUP_KEY_CLOSE +
                  MARKUP_VALUE + value_list[1] + priority_flag + MARKUP_VALUE_CLOSE; 
      }
      if(top_bottom && left_right)
      {
        return INDENT + MARKUP_KEY + prop + MARKUP_KEY_CLOSE +
                  MARKUP_VALUE + value_list[1] + MARKUP_SPACE + value_list[2] + priority_flag + MARKUP_VALUE_CLOSE; 
      }
      if(left_right)
      {
        return INDENT + MARKUP_KEY + prop + MARKUP_KEY_CLOSE +
                MARKUP_VALUE + value_list[1] + MARKUP_SPACE + value_list[2] + MARKUP_SPACE +
                value_list[3] +  priority_flag + MARKUP_VALUE_CLOSE;
      }
      return INDENT + MARKUP_KEY + prop + MARKUP_KEY_CLOSE +
                MARKUP_VALUE + value_list[1] + MARKUP_SPACE + value_list[2] + MARKUP_SPACE +
                value_list[3] + MARKUP_SPACE + value_list[4] + priority_flag + MARKUP_VALUE_CLOSE;
    }
    else
    {
      var ret = '', i = 1;
      for( ; i < index_list.length; i++ )
      {
        if(value_list[i])
        {
          ret += ( ret ? MARKUP_PROP_NL : "" ) +
            INDENT +
            MARKUP_KEY + __indexMap[index_list[i]] + MARKUP_KEY_CLOSE +
            MARKUP_VALUE + value_list[i] + ( priority_list[i] ? MARKUP_IMPORTANT : MARKUP_EMPTY) +
            MARKUP_VALUE_CLOSE;
        }
      }
      return ret;
    }
  }
  
  shorthands.padding = shorthands.margin;
  
  shorthands.fallback = function(index, value, priority_flag)
  {
    return INDENT +
      MARKUP_KEY + __indexMap[index] + MARKUP_KEY_CLOSE +
      MARKUP_VALUE + value + ( priority_flag ? MARKUP_IMPORTANT : MARKUP_EMPTY) + MARKUP_VALUE_CLOSE;
  }
  
  shorthands.border = function(prop, index_list, value_list, priority_list)
  {
    var
    key_list = ['border-top', 'border-right', 'border-bottom', 'border-left'],
    key_type_list = ['border-width', 'border-style', 'border-color'],
    is_short_width = value_list[1] && value_list[4] && value_list[7] && value_list[10] && 1 || 0,
    is_short_style = value_list[2] && value_list[5] && value_list[8] && value_list[11] && 1 || 0,
    is_short_color = value_list[3] && value_list[6] && value_list[9] && value_list[12] && 1 || 0,
    is_short_type = is_short_width + is_short_style + is_short_color == 1,
    short_value_list = [],
    is_short_priority_list = [],
    short_priority_list = [],
    i = 1,
    j = 0,
    index_short = 0,
    previous_value = '',
    is_short_short = true,
    priority_flag = '',
    ret = '';
    
    if( is_short_type ) // border-width or border-style or border-color 
    {
      
      i = is_short_color && 2 || is_short_style && 1 || 0;
      
      if( priority_list[i+1] == priority_list[i+4] && priority_list[i+1] == priority_list[i+7] &&
            priority_list[i+1] == priority_list[i+10])
      {
        priority_flag = priority_list[i+1] ? MARKUP_IMPORTANT : MARKUP_EMPTY;
        if( value_list[i+1] == value_list[i+4] && value_list[i+1] == value_list[i+7] &&
              value_list[i+1] == value_list[i+10])
        {
          return INDENT + MARKUP_KEY + key_type_list[i] + MARKUP_KEY_CLOSE +
                  MARKUP_VALUE + value_list[i+1] + priority_flag + MARKUP_VALUE_CLOSE;
        }
        else // eg border-width: 10px 8px 8px 10px
        {
          return INDENT + MARKUP_KEY + key_type_list[i] + MARKUP_KEY_CLOSE +
                  MARKUP_VALUE + value_list[i+1] + MARKUP_SPACE + value_list[i+4] +
                  MARKUP_SPACE + value_list[i+7] + MARKUP_SPACE + value_list[i+10] +
                  priority_flag + MARKUP_VALUE_CLOSE;
        }
      }
      else
      {
        for( j = 1; j < 11; j+=3 )
        {
          ret += ( ret ? MARKUP_PROP_NL : "" ) +
            this.fallback(index_list[i+j], value_list[i+j], priority_list[i+j]);
        }
        return ret;
      }
    }
    else // border-top or border-right or border-bottom or border-left or border
    {
      for( i = 1; i < 13; i+=3 )
      {
        if(value_list[i] && value_list[i+1] && value_list[i+2])
        {
          if( is_short_priority_list[index_short] = priority_list[i] == priority_list[i+1] &&
            priority_list[i] == priority_list[i+2] )
          {
            short_priority_list[index_short] = priority_list[i] ? MARKUP_IMPORTANT : MARKUP_EMPTY;
            short_value_list[index_short] =
              value_list[i+1] == 'none'
              ? value_list[i+1]
              : value_list[i] + MARKUP_SPACE + value_list[i+1] + MARKUP_SPACE + value_list[i+2];
          }
          else
          {
            short_value_list[index_short] = i;
          }

        }
        is_short_short = is_short_short && is_short_priority_list[index_short];
        if(index_short && is_short_short)
        {
          is_short_short = previous_value && previous_value == short_value_list[index_short];
        }
        previous_value = short_value_list[index_short];
        index_short++;
      }
      if(is_short_short)
      {
        return INDENT + MARKUP_KEY + prop + MARKUP_KEY_CLOSE +
                  MARKUP_VALUE + short_value_list[0] + MARKUP_VALUE_CLOSE;
      }
      else
      {
        for( i = 0; i < 4; i++ )
        {
          if(short_value_list[i])
          {
            if(is_short_priority_list[i])
            {
              ret += ( ret ? MARKUP_PROP_NL : "" ) +
                      INDENT + MARKUP_KEY + key_list[i] + MARKUP_KEY_CLOSE + 
                      MARKUP_VALUE + short_value_list[i] + short_priority_list[i] + MARKUP_VALUE_CLOSE;              
            }
            else
            {
              for( j = short_value_list[i]; j < short_value_list[i] + 3; j++ )
              {
                ret += ( ret ? MARKUP_PROP_NL : "" ) +
                        this.fallback(index_list[j], value_list[j], priority_list[j]);              
              }
            }
          }

        }
        return ret;
      }
    }
    
    
    

    return 'something seriously missing'
    
    
  }
  
  
  var pretyPrintRule = [];
  pretyPrintRule[UNKNOWN_RULE] = function(rule)
  {
    return '';
  }
  pretyPrintRule[STYLE_RULE] = function(rule)
  {
    const
    HEADER = 0,
    INDEX_LIST = 1,
    VALUE_LSIT = 2,
    PROPERTY_LIST = 3;
    
    var ret = '',
    selectors = "<span class='selector'>" + rule[HEADER][3].join(', ') + "</span>";
    index_list = rule[INDEX_LIST],
    value_list = rule[VALUE_LSIT],
    priority_list = rule[PROPERTY_LIST],
    length = index_list.length, i = 0,
    index = 0,
    s_h_index = [],
    s_h_value = [],
    s_h_priority = [],
    s_h_prop = '';
    
    for( ; i < length; i++ )
    {
      index = index_list[i];
      if( SHORTHAND[index] )
      {
        s_h_index = [];
        s_h_value = [];
        s_h_priority = [];
        s_h_prop = __shorthandIndexMap[index];
        do
        {
          if( __shorthandIndexMap[index] != s_h_prop )
          {
            ret += ( ret ? MARKUP_PROP_NL : "" ) +
              shorthands[s_h_prop](s_h_prop, s_h_index, s_h_value, s_h_priority);
            s_h_index = [];
            s_h_value = [];
            s_h_priority = [];
            s_h_prop = __shorthandIndexMap[index];
          }
          s_h_index[SHORTHAND[index]] = index;
          s_h_value[SHORTHAND[index]] = value_list[i];
          s_h_priority[SHORTHAND[index]] = priority_list[i];
          index = index_list[++i];
        }
        while( SHORTHAND[index] );
        ret += ( ret ? MARKUP_PROP_NL : MARKUP_EMPTY ) +
          shorthands[s_h_prop](s_h_prop, s_h_index, s_h_value, s_h_priority);
      }
      else
      {
        ret += ( ret ? MARKUP_PROP_NL : MARKUP_EMPTY ) +
          INDENT +
          MARKUP_KEY + __indexMap[index] + MARKUP_KEY_CLOSE +
          MARKUP_VALUE + value_list[i] + ( priority_list[i] ? MARKUP_IMPORTANT : "") + MARKUP_VALUE_CLOSE;    
      }

      
    }
    return "<pre rule-id='" + rule[HEADER][1] + "'>" + selectors + " {\n" + ret + "\n}";
  }
  
  pretyPrintRule[CHARSET_RULE] = function(rule)
  {
    return 'TODO';
  }
  
  pretyPrintRule[IMPORT_RULE] = function(rule)
  {
    return 'TODO IMPORT_RULE';
  }
  
  pretyPrintRule[MEDIA_RULE] = function(rule)
  {
    return 'TODO MEDIA_RULE';
  }
  
  pretyPrintRule[FONT_FACE_RULE] = function(rule)
  {
    return 'TODO FONT_FACE_RULE';
  }
  
  pretyPrintRule[PAGE_RULE] = function(rule)
  {
    return 'TODO PAGE_RULE';
  }
  
  
  this.prettyPrintRules = function(rules)
  {
    var ret = '', rule = null, header = null, i = 0;
    for( ; rule = rules[i]; i++)
    {
      ret += pretyPrintRule[rule[RULE_HEADER][2]](rule);
    }
    return "<div stylesheet-id='" + rules[0][0][0] + "'>" + ret + "</div>";
  }
  
  this.getStylesheets = function(rt_id, org_args)
  {
    if(__sheets[rt_id])
    {
      return __sheets[rt_id];
    }
    else
    {
      if( !__indexMap )
      {
        var tag = tagManager.setCB(null, handleGetIndexMap, []);
        services['ecmascript-debugger'].getIndexMap( tag, 'json' );
      }
      var tag = tagManager.setCB(null, handleGetAllStylesheets, [rt_id, org_args]);
      services['ecmascript-debugger'].getAllStylesheets( tag, rt_id, 'json' );
      return null;
    }
  }
  
  this.getRulesWithSheetIndex = function(rt_id, index, org_args)
  {
    //alert(rt_id+' '+index+' '+( __rules[rt_id][index] && 'ok' || 'missing'))
    if(__rules[rt_id][index])
    {
      return __rules[rt_id][index];
    }
    else
    {
      var tag = tagManager.setCB(null, handleGetRulesWithIndex, [rt_id, index, org_args]);
      var sheet_id = __sheets[rt_id][index][SHEET_OBJECT_ID];
      services['ecmascript-debugger'].getCSSRules( tag, rt_id, sheet_id, 'json' );
      //alert('command get')
      return null;
    }
  }
  
  this.setSelectedSheet = function(rt_id, index, rules)
  {
    __selectedRules =
    {
      runtime_id: rt_id,
      index: index,
      rules: rules
    }
  }
  
  this.getSelectedSheet = function()
  {
    return __selectedRules;
  }
  
  var handleGetIndexMap = function(xml)
  {
    var json = xml.getNodeData('index');
    if( json )
    {
      __indexMap = eval('(' + json +')');
      var prop = '', i = 0;
      for( ; prop = __indexMap[i]; i++)
      {
        switch (prop)
        {
          // margin
          case 'margin-top':
          {
            SHORTHAND[i] = 1;
            __shorthandIndexMap[i] = 'margin';
            break;
          }
          case 'margin-right':
          {
            SHORTHAND[i] = 2;
            __shorthandIndexMap[i] = 'margin';
            break;
          }
          case 'margin-bottom':
          {
            SHORTHAND[i] = 3;
            __shorthandIndexMap[i] = 'margin';
            break;
          }
          case 'margin-left':
          {
            SHORTHAND[i] = 4;
            __shorthandIndexMap[i] = 'margin';
            break;
          }
          // padding
          case 'padding-top':
          {
            SHORTHAND[i] = 1;
            __shorthandIndexMap[i] = 'padding';
            break;
          }
          case 'padding-right':
          {
            SHORTHAND[i] = 2;
            __shorthandIndexMap[i] = 'padding';
            break;
          }
          case 'padding-bottom':
          {
            SHORTHAND[i] = 3;
            __shorthandIndexMap[i] = 'padding';
            break;
          }
          case 'padding-left':
          {
            SHORTHAND[i] = 4;
            __shorthandIndexMap[i] = 'padding';
            break;
          }
          // border top
          case 'border-top-width':
          {
            SHORTHAND[i] = 1;
            __shorthandIndexMap[i] = 'border';          
            break;
          }
          case 'border-top-style':
          {
            SHORTHAND[i] = 2;
            __shorthandIndexMap[i] = 'border';          
            break;
          }
          case 'border-top-color':
          {
            SHORTHAND[i] = 3;
            __shorthandIndexMap[i] = 'border';
            break;
          }
          // border rigth
          case 'border-right-width':
          {
            SHORTHAND[i] = 4;
            __shorthandIndexMap[i] = 'border';          
            break;
          }
          case 'border-right-style':
          {
            SHORTHAND[i] = 5;
            __shorthandIndexMap[i] = 'border';          
            break;
          }
          case 'border-right-color':
          {
            SHORTHAND[i] = 6;
            __shorthandIndexMap[i] = 'border';          
            break;
          }
          // border bottom
          case 'border-bottom-width':
          {
            SHORTHAND[i] = 7;
            __shorthandIndexMap[i] = 'border';          
            break;
          }
          case 'border-bottom-style':
          {
            SHORTHAND[i] = 8;
            __shorthandIndexMap[i] = 'border';
            break;
          }
          case 'border-bottom-color':
          {
            SHORTHAND[i] = 9;
            __shorthandIndexMap[i] = 'border';          
            break;
          }
          // border left
          case 'border-left-width':
          {
            SHORTHAND[i] = 10;
            __shorthandIndexMap[i] = 'border';          
            break;
          }
          case 'border-left-style':
          {
            SHORTHAND[i] = 11;
            __shorthandIndexMap[i] = 'border';          
            break;
          }
          case 'border-left-color':
          {
            SHORTHAND[i] = 12;
            __shorthandIndexMap[i] = 'border';          
            break;
          }

        }
        
      
      }
    } 
  }
  
  var handleGetRulesWithIndex = function(xml, rt_id, index, org_args)
  {
    var json = xml.getNodeData('rule-list');
    //alert(json && 'json' || 'failed')
    if( json )
    {
      __rules[rt_id][index] = eval('(' + json +')');
      if(org_args && !org_args[2])
      {
        org_args.callee.call(null, org_args[0], org_args[1], 1);
      }
    } 
  }
  
  var handleGetAllStylesheets = function(xml, rt_id, org_args)
  {
    var json = xml.getNodeData('stylesheets');
    if( json )
    {
      __sheets[rt_id] = eval('(' + json +')');
      __rules[rt_id] = [];
      if(org_args && !org_args[2])
      {
        org_args.callee.call(null, org_args[0], org_args[1], 1);
      }
    }   
  }
}