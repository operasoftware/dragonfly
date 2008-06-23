var Editor = function()
{
  // assert: a element wich is editable has a monospace font

  // TODO make it more general so it can be used for other views then just the css inspector
  var self = this;
  this.base_style =
  {
    'font-family': '',
    'line-height': 0,
    'font-size': 0
  }
 
  this.char_width = 0;
  this.line_height = 0;
  this.cssText = '';
  this.textarea_container = null;
  this.textarea = null;
  
  this.host_element_border_padding_left = 0;
  this.host_element_border_padding_top = 0;

  this.tab_context_value = '';
  this.tab_context_tokens = null;

  this.context_cur_prop = '';
  this.context_cur_value = '';
  this.context_cur_priority = '';
 
  this.get_base_style = function(ele)
  {
    var
    style = getComputedStyle(ele, null),
    props = ['font-family', 'line-height', 'font-size'],
    prop = null,
    i = 0,
    span = document.createElement('test-element'),
    cssText = 'display:block;position:absolute;left:-100px;top:0;white-space:pre;';
 
    for( ; prop = props[i]; i++)
    {
      this.base_style[prop] = style.getPropertyValue(prop);
      cssText += prop +':' + this.base_style[prop] + ';';
    }
    span.textContent = '1234567890';
    document.documentElement.appendChild(span);
    span.style.cssText = cssText;
    this.char_width = span.offsetWidth / 10;
    this.base_style['line-height'] = ( this.line_height = span.offsetHeight ) + 'px';
    document.documentElement.removeChild(span);

    // host element style
    this.host_element_border_padding_left = 
      parseInt(style.getPropertyValue('padding-left')) +
      parseInt(style.getPropertyValue('border-left-width'));
    this.host_element_border_padding_top = 
      parseInt(style.getPropertyValue('padding-top')) +
      parseInt(style.getPropertyValue('border-top-width'));

    cssText = '';
    for( prop in this.base_style )
    {
      cssText += prop +':' + this.base_style[prop] + ';';
    }
    this.textarea_container = document.createElement('textarea-container');
    this.textarea = this.textarea_container.
      appendChild(document.createElement('textarea-inner-container')).
      appendChild(document.createElement('textarea'));
    this.textarea.style.cssText = cssText;
    this.textarea.oninput = input_handler;
  }

  this.getAllTokens = function()
  {
    const
    SPACE = 1,
    COMMA = 2,
    BRACKET_OPEN = 3,
    BRACKET_CLOSE = 4,
    END = 5,
    SEMICOLON = 6;

    var 
    re_str = /(?:"(?:[^"]|\\")*")|(?:'(?:[^']|\\')*')/g,
    re_token = /([^,] +)|(, *)|(\( *)|(\))|($)|(;)/g,
    value = this.textarea.value,
    cur_pos = 0,
    last_pos = 0,
    next_pos = 0,
    // last char would be ;
    char_pos = value.length - 2,
    match_str = null,
    match_token = null,
    ret = [];

    re_str.lastIndex = 0;
    match_str = re_str.exec(value);
    

    if( ( cur_pos = value.indexOf(':', 0) ) > -1 )
    {
      // TODO should test if pos is in match_token string
      //ret[ret.length] = value.slice(0, cur_pos);
      ret.splice(0, 0, value.slice(0, cur_pos), 0, cur_pos);

      cur_pos++;
      while( value.charAt(cur_pos) == ' ' )
      {
        cur_pos++;
      }
      re_token.lastIndex = cur_pos;
      while( match_token = re_token.exec(value)  )
      {
        //opera.postError(match_token.index+' '+value.length);
        if( match_str && match_str.index <= re_token.lastIndex + 1 )
        {
          ret.splice(ret.length, 0, match_str.index, re_str.lastIndex);
          re_token.lastIndex = re_str.lastIndex;
          match_str = re_str.exec(value);
        }
        else if( match_token[BRACKET_OPEN] )
        {
          cur_pos = re_token.lastIndex;
        }
        else if( match_token.index > cur_pos )
        {
          ret.splice(ret.length, 0, cur_pos, match_token.index  + ( match_token[SPACE] ? 1 : 0 ));
        }
        if( match_token.index > char_pos )
        {
          break;
        }
        cur_pos = re_token.lastIndex;
      }
    }
    else
    {
      ret.splice(0, 0, value, 0, value.length);
    }
    return ret;
  }

  this.getNextToken = function(char_pos)
  {
    var 
    re_str = /(?:"(?:[^"]|\\")*")|(?:'(?:[^']|\\')*')/g,
    re_token = /([^,] +)|(, *)|(\( *)|(\))|($)|(;)/g,
    value = this.textarea.value,
    cur_pos = 0,
    last_pos = 0,
    next_pos = 0,
    match_str = null,
    match_token = null;

    re_str.lastIndex = 0;
    match_str = re_str.exec(value);
    
    // last char would be ;
    if(char_pos >= value.length - 1)
    {
      char_pos = value.length - 2;
    }

    if( ( cur_pos = value.indexOf(':', 0) ) > -1 )
    {
      // TODO should test if pos is in match_token string
      if( cur_pos >= char_pos )
      {
        return {start: 0, end: cur_pos};
      }
      cur_pos++;
      while( value.charAt(cur_pos) == ' ' )
      {
        cur_pos++;
      }
      re_token.lastIndex = cur_pos;
      while( match_token = re_token.exec(value) )
      {
        //opera.postError(match_token.index+' '+value.length);
        if( match_str && match_str.index <= re_token.lastIndex + 1 )
        {
          if(re_str.lastIndex >= char_pos)
          {
            return {start: match_str.index, end: re_str.lastIndex};
          }
          re_token.lastIndex = re_str.lastIndex;
          match_str = re_str.exec(value);
          continue;
        }
        if( match_token.index > char_pos )
        {
          if( match_token[3] )
          {
            cur_pos = re_token.lastIndex;
            continue;
          }
          return {start:cur_pos, end: match_token.index + ( match_token[1] ? 1 : 0 )};
        }
        
        cur_pos = re_token.lastIndex;
      }
    }
    return null;
  }

  this.getProperties = function()
  {
    var 
    re_str = /(?:"(?:[^"]|\\")*")|(?:'(?:[^']|\\')*')/g,
    re_token = /(;)|($)/g,
    re_important = / *!important/;
    value = this.textarea.value,
    last_pos = 0,
    cur_pos = 0,
    important_pos = 0,
    prop = '',
    val = '',
    priority = 0,
    match_str = null,
    match_token = null,
    match_important = null,
    ret = [];

    while( ( cur_pos = value.indexOf(':', last_pos) ) > -1 )
    {
      prop = value.slice(last_pos, cur_pos);
      // TODO should test if pos is in match_token string
      //opera.postError('prop: '+prop)
      cur_pos++;
      while( value.charAt(cur_pos) == ' ' || value.charAt(cur_pos) == '\n' )
      {
        cur_pos++;
      }
      re_str.lastIndex = re_token.lastIndex = cur_pos;
      match_str = re_str.exec(value);
     
      while( match_token = re_token.exec(value) )
      {
        //opera.postError('match_token: '+match_token)
        if( match_str && match_token.index < re_str.lastIndex )
        {
          re_token.lastIndex = re_str.lastIndex;
          match_str = re_str.exec(value);
          continue;
        }
        break;
      }
      if( match_token )
      {
        val = value.slice(cur_pos, re_token.lastIndex - ( match_token[1] ? 1 : 0 ) );
        priority = 0;
        if(  match_important =  re_important.exec(val) )
        {
          val = val.slice(0, match_important.index );
          priority = 1;
        }
        ret.splice(ret.length, 0, prop, val, priority);

        last_pos = re_token.lastIndex;
        if( last_pos + 1 >= value.length )
        {
          break;
        }
      }
    }
    return ret;
  }

  this.getCharPosition = function(event)
  {

    var 
    box = this.textarea.getBoundingClientRect(),
    left = event.clientX - box.left,
    top = event.clientY - box.top,
    charOffset = 0,
    cur_top = this.line_height,
    previous_line_chars = 0,
    re = /[ -/\n,]/g,
    match = null,
    prev_match_index = 0,
    value = this.textarea.value,
    max_line_char = this.textarea.offsetWidth / this.char_width >> 0;

    re.lastIndex = 0;

    while( top > cur_top && ( match = re.exec(value) ) )
    {
      if( match.index - previous_line_chars > max_line_char )
      {
        previous_line_chars = prev_match_index + 1;
        cur_top += this.line_height;
        //opera.postError('previous_line_chars: '+value.slice(0,previous_line_chars))
      }
      prev_match_index = match.index;
    }

    

    if( top < cur_top )
    {
      charOffset = 
        previous_line_chars + ( ( left - ( left % this.char_width ) ) / this.char_width );
    }
    //alert(this.textarea.value.length +' '+charOffset);
    var selection = this.getNextToken(charOffset);
    //alert('selection: ' +( selection ? selection.start +' - '+selection.end : null))
    if(selection)
    {
      this.textarea.selectionStart = selection.start;
      this.textarea.selectionEnd = selection.end;
      
    }
    /* *
    opera.postError( 'left: '+left+' \ntop: '+top+ 
    '\ncharOffset: '+charOffset+'\nprevious_line_chars: '+previous_line_chars +
    '\nchar: '+value.slice(charOffset, charOffset+1) );
    /* */


  }
 
  this.edit = function(event, ref_ele)
  {
    var ele = ref_ele || event.target;
    if( !this.base_style['font-size'] )
    {
      this.get_base_style(ref_ele || ele);
    }
    if( this.textarea_container.parentElement )
    {
      this.submit();
    }
    this.context_rt_id = ele.parentElement.parentElement.getAttribute('rt-id');
    this.context_rule_id = ele.parentElement.getAttribute('rule-id');
    //opera.postError('rt-id: '+this.context_rt_id +' rule-id: '+this.context_rule_id);
    var textContent = ele.textContent;


    
    

    this.context_cur_value = this.textarea.value = ele.textContent;

    //var props = this.getProperties();

    //this.context_cur_prop = props[0] || '';
    //this.context_cur_value = props[1] || '';
    //this.context_cur_priority = props[2] || 0;

    opera.postError("this.textarea.value: "+this.context_cur_value)

    this.textarea.style.height = ( ele.offsetHeight  ) + 'px';
    ele.textContent = '';
    ele.appendChild(this.textarea_container);
    // only for click events
    if( event )
    {
      this.getCharPosition(event);
      this.textarea.focus();
    }
  }

  this.nav_next = function(event, action_id)
  {
    var  
    cur_pos = this.textarea.selectionEnd,
    i = 1;

    if( this.textarea.value != this.tab_context_value )
    {
      this.tab_context_tokens = this.getAllTokens();
      this.tab_context_value = this.textarea.value;
    }
    if( this.tab_context_tokens)
    {
      for( ; i < this.tab_context_tokens.length; i += 2 )
      {
        if( this.tab_context_tokens[i+1] > cur_pos )
        {
          this.textarea.selectionStart = this.tab_context_tokens[i];
          this.textarea.selectionEnd = this.tab_context_tokens[i+1];
          return true;
        }
      }
      /*
      var i = 1, t = this.tab_context_tokens[0]+'|', val = this.textarea.value;
      for( ; i < this.tab_context_tokens.length; i += 2)
      {
        t += val.slice(this.tab_context_tokens[i], this.tab_context_tokens[i+1]) +'|';
      }
      opera.postError(t);
      */
    }
    return false;
  }

  this.nav_previous = function(event, action_id)
  {
    var  
    cur_pos = this.textarea.selectionStart,
    i = 1;

    if( this.textarea.value != this.tab_context_value )
    {
      this.tab_context_tokens = this.getAllTokens();
      this.tab_context_value = this.textarea.value;
    }
    if( this.tab_context_tokens)
    {
      for( i = this.tab_context_tokens.length - 1; i > 1; i -= 2 )
      {
        if( this.tab_context_tokens[i] < cur_pos )
        {
          this.textarea.selectionStart = this.tab_context_tokens[i-1];
          this.textarea.selectionEnd = this.tab_context_tokens[i];
          return true;
        }
      }
    }
    return false;
  }

  this.focusFirstToken = function()
  {
    this.tab_context_tokens = this.getAllTokens();
    this.tab_context_value = this.textarea.value;
    //opera.postError('first: '+this.tab_context_tokens);
    if( this.tab_context_tokens && this.tab_context_tokens[2] )
    {
      this.textarea.selectionStart = this.tab_context_tokens[1];
      this.textarea.selectionEnd = this.tab_context_tokens[2];
    }
    else
    {
      this.textarea.selectionStart = 0;
      this.textarea.selectionEnd = 0;
    }
    this.textarea.focus();
  }

  this.focusLastToken = function()
  {
    this.tab_context_tokens = this.getAllTokens();
    this.tab_context_value = this.textarea.value;
    if( this.tab_context_tokens && this.tab_context_tokens[2] )
    {
      this.textarea.selectionStart = this.tab_context_tokens[this.tab_context_tokens.length-2];
      this.textarea.selectionEnd = this.tab_context_tokens[this.tab_context_tokens.length-1];
    }
    else
    {
      this.textarea.selectionStart = this.tab_context_value.length;
      this.textarea.selectionEnd = this.tab_context_value.length;
    }
    this.textarea.focus();
  }

  this.autocomplete = function(event, action_id)
  {
    //opera.postError(action_id);
    var  
    cur_start = this.textarea.selectionStart,
    cur_end = this.textarea.selectionEnd,
    value = this.textarea.value,
    cur_token = '',
    i = 1,
    suggest = ''

    if( this.textarea.value != this.tab_context_value )
    {
      this.tab_context_tokens = this.getAllTokens();
      this.tab_context_value = this.textarea.value;
    }
    if( this.tab_context_tokens )
    {
      for( ; i < this.tab_context_tokens.length; i += 2 )
      {
        if( cur_start >= this.tab_context_tokens[i] && cur_start <= this.tab_context_tokens[i+1])
        {
          cur_token = value.slice(this.tab_context_tokens[i], this.tab_context_tokens[i+1]);
          break;
        }
      }
    }
    if( cur_token )
    {
      suggest = this.getSuggest
      (
        this.tab_context_tokens[0], 
        cur_end <= this.tab_context_tokens[2],
        cur_token,
        cur_start, 
        cur_end, 
        action_id
      );

      if(suggest)
      {
        cur_start = this.tab_context_tokens[i];
        this.textarea.value = 
          value.slice(0, cur_start) + 
          suggest +
          value.slice(this.tab_context_tokens[i+1]);
        this.textarea.selectionStart = cur_start;
        this.textarea.selectionEnd = cur_start + suggest.length;
        this.commit();
      }

    }
    //opera.postError('cur_token: '+cur_token);
    return false;
  }

  this.getSuggest = function(prop_name, is_prop, token, cur_start, cur_end, action_id)
  {
    // action_id == action_ids.NAV_UP
    var re_num = /^(-?)(\d+)(.*)$/;
    var match = re_num.exec(token);
    if( !is_prop && match )
    {
      return ( parseInt(match[1] + match[2]) + ( action_id == action_ids.NAV_UP ? 1 : -1 ) ).toString() + match[3];
    }

    return '';
  }


 
  this.submit = function()
  {
    var 
    props = this.getProperties(), 
    i = 0,
    inner = '';

    for( ; i < props.length; i += 3 )
    {
      if( props[i+1] )
      {
        inner = "<key>" + props[i] + "</key>: " +
          "<value>"  + props[i+1] +  ( props[i+2] ? " !important" : "" ) + "</value>;";
      }
    }
    this.textarea_container.parentElement.innerHTML = inner; 
  }

  this.commit = function()
  {
    var props = self.getProperties(), 
    i = 0,
    script = "";
    
    opera.postError('commit');
    for( ; i < props.length; i += 3 )
    {
      if( props[i+1] )
      {
        script = "rule.style.setProperty(\"" + props[i] + "\", \"" + props[i+1] + "\", " + props[i+2]+ ")";
        services['ecmascript-debugger'].eval(0, self.context_rt_id, '', '', script, ["rule", self.context_rule_id]);
      }
    }
  }

  this.escape = function()
  {
    var 
    inner = "<key>" + this.context_cur_prop + "</key>: " +
      "<value>"  + this.context_cur_value +  
      ( this.context_cur_priority ? " !important" : "" ) + 
      "</value>;";

    this.textarea.value = this.context_cur_value;
    this.textarea_container.parentElement.innerHTML = inner;

  }

  var input_handler = function(event)
  {
    this.style.height = this.scrollHeight + 'px';
    self.commit();


  }
}