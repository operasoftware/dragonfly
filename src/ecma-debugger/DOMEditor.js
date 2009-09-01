/**
  * @constructor 
  */

var BaseEditor = new function()
{
  // an editable element must have monospace font
  
  /* interface */
  this.edit = 
  this.oninput = 
  // must return a valid navigation target or null
  this.submit =
  // must return a valid navigation target or null
  this.cancel = 
  // to handle click events while editing
  // could be perhaps a base method
  this.onclick = 
  // must return a valid navigation target or null
  this.nav_next =
  // must return a valid navigation target or null
  this.nav_previous = function(){return null};

  var _init = function(instance)
  {
    this.context_enter = null;
    this.context_cur = null;
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
    this.getInputHandler = function()
    {
      return function(event)
      {
        instance.oninput(event);
      }
    }
  }

  this.textarea_container_name = "textarea-container";
  this.get_base_style = function(ele)
  {
    // stores style properties in base_style
    // and creates the markup for the textarea
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
    this.textarea_container = document.createElement(this.textarea_container_name);
    this.textarea = this.textarea_container.
      appendChild(document.createElement('textarea-inner-container')).
      appendChild(document.createElement('textarea'));
    this.textarea.style.cssText = cssText;
    this.textarea.oninput = this.getInputHandler();
  }
  this.__is_active = function(){return false};
  this.__defineGetter__("is_active", function(){return this.__is_active()});
  this.base_init = function(instance)
  {
    _init.apply(instance, [instance]);
  }
}

/**
  * @constructor 
  * @extends BaseEditor
  */

var DOMAttrAndTextEditor = function(nav_filters)
{
  this.base_init(this);
  this.type = "dom-attr-text-editor";
  this.textarea_container_name = "textarea-container-inline";
  // specific context 
  this.context_enter =
  {
    type: '',
    rt_id: '',
    obj_id:'',
    text: '',
    key: '',
    value: '',
    has_value: false,
    is_new: false
  }
  this.context_cur =
  {
    type: '',
    rt_id: '',
    obj_id:'',
    text: '',
    key: '',
    value: '',
    has_value: false,
    is_new: false
  }

  // TODO move this to an helper, this is duplicated code from DOM_tree_style
  var map = 
  {   
    '\t': '\\t',
    '\v': '\\v',
    '\f': '\\f',
    '\u0020': '\\u0020',
    '\u00A0': '\\u00A0',
    '\r': '\\r',
    '\n': '\\n',
    '\u2028': '\\u2028',
    '\u2029': '\\u2029'
  };

  var _escape = function(string)
  {
    string = new String(string);
    var _char = '', i = 0, ret = '';
    for( ; _char = string.charAt(i); i++ )
    {
      ret += map[_char];
    }
    return ret;
  }

  var re_encoded = /^(?:\\t|\\v|\\f|\\u0020|\\u00A0|\\r|\\n|\\u2028|\\u2029)+$/;

  var decode_escape = function(string)
  {
    var  
    match = null, 
    ret = '',
    re = /\\t|\\v|\\f|\\u0020|\\u00A0|\\r|\\n|\\u2028|\\u2029/g,
    decode_map = 
    {   
      '\\t': '\t',
      '\\v': '\v',
      '\\f': '\f',
      '\\u0020': '\u0020',
      '\\u00A0': '\u00A0',
      '\\r': '\r',
      '\\n': '\n',
      '\\u2028': '\u2028',
      '\\u2029': '\u2029'
    };

    while( match = re.exec(string) )
    {
      ret += decode_map[match[0]];
    }
    return ret;
  }

  var crlf_encode = function(str)
  {
    return str.replace(/\r\n/g, "\\n");
  }

  this.edit = function(event, ref_ele)
  {
    var 
    ele = ref_ele || event.target,
    parent_parent = null,
    enter_state =
    {
      type: '',
      rt_id: '',
      obj_id:'',
      text: '',
      key: '',
      value: '',
      has_value: false
    },
    prop = '';
    
    if( !this.base_style['font-size'] )
    {
      this.get_base_style(ele);
    }
    
    // this should never be needed
    
    if( this.textarea_container.parentElement )
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        "this.textarea_container.parentElement is not null in submit");
    } 
    
    
    switch( enter_state.type = ele.nodeName.toLowerCase() )
    {
      case "key":
      {
        parent_parent = ele.parentElement.parentElement;
        // dom markup and dom tree have different markup
        enter_state.rt_id = parent_parent.parentElement.getAttribute('rt-id')
          || parent_parent.parentElement.parentElement.getAttribute('rt-id');
        enter_state.obj_id = parent_parent.getAttribute('ref-id');
        enter_state.key = ele.textContent;
        enter_state.has_value = ele.nextElementSibling && 
          ele.nextElementSibling.nodeName.toLowerCase() == "value";
        enter_state.value = enter_state.has_value 
          && ele.nextElementSibling.textContent.replace(/^"|"$/g, "") || "";

        this.textarea.value = ele.textContent;
        ele.textContent = "";
        ele.appendChild(this.textarea_container);
        break;
      }
      case "value":
      {
        parent_parent = ele.parentElement.parentElement;
        // dom markup and dom tree have different markup
        enter_state.rt_id = parent_parent.parentElement.getAttribute('rt-id')
          || parent_parent.parentElement.parentElement.getAttribute('rt-id');
        enter_state.obj_id = parent_parent.getAttribute('ref-id');
        enter_state.key = 
          ele.previousElementSibling 
          && ele.previousElementSibling.nodeName.toLowerCase() == "key"
          && ele.previousElementSibling.textContent
          || "";
        enter_state.value = ele.textContent.replace(/^"|"$/g, "");

        this.textarea.value = ele.textContent.replace(/^"|"$/g, "");
        ele.textContent = '"';
        ele.appendChild(this.textarea_container);
        ele.appendChild(document.createTextNode('"'));
        break;
      }
      case "text":
      {
        parent_parent = ele.parentElement;
        // dom markup and dom tree have different markup
        enter_state.rt_id = parent_parent.parentElement.getAttribute('rt-id')
          || parent_parent.parentElement.parentElement.getAttribute('rt-id');
        enter_state.obj_id = ele.getAttribute('ref-id');
        if( re_encoded.test(ele.textContent) )
        {
          enter_state.text = decode_escape(ele.textContent);
        }
        else
        {
          enter_state.text = ele.textContent;
        }

        this.textarea.value = enter_state.text;
        ele.textContent = "";
        ele.appendChild(this.textarea_container);
        break;
      }
    }

    this.max_width = parseInt( getComputedStyle(parent_parent, null).getPropertyValue('width'));
    this.set_textarea_dimensions();
    this.context_enter = enter_state;
    for( prop in enter_state )
    {
      this.context_cur[prop] = enter_state[prop];
    }
    // only for click events
    if( event )
    {
      this.textarea.focus();
    }
    this.textarea.selectionStart = 0;
    this.textarea.selectionEnd = this.textarea.value.length;
  }

  this.oninput = function(event)
  {
    var 
    script = "",
    state = this.context_cur;

    if( this.textarea_container.parentElement )
    {
      this.set_textarea_dimensions();
      switch(state.type)
      {
        case "key":
        {
          state.key = this.textarea.value
          if(state.value)
          {
            script = 'node.setAttribute("' + crlf_encode(state.key) + '","' + 
                      crlf_encode(state.value) + '")';
            services['ecmascript-debugger'].eval(0, state.rt_id, '', '', script, ["node", state.obj_id]);
          }
          break;
        }
        case "value":
        {
          // there should never be the situation that the key is not defined
          script = 'node.setAttribute("' + crlf_encode(state.key) + '","' + 
                    crlf_encode(( state.value = this.textarea.value )) + '")';
          services['ecmascript-debugger'].eval(0, state.rt_id, '', '', script, ["node", state.obj_id]);
          break;
        }
        case "text":
        {
          
          script = 'node.nodeValue = "' + crlf_encode( state.text = this.textarea.value ) + '"';
          services['ecmascript-debugger'].eval(0, state.rt_id, '', '', script, ["node", state.obj_id]);
          break;
        }
      }
    }
  }

  this.submit = function(check_value)
  {
    // return a valid navigation target or null
    var 
    script = "",
    state = this.context_cur,
    nav_target = this.textarea_container.parentElement,
    cur = null;

    if( nav_target )
    {
      switch(state.type)
      {
        case "key":
        {
          if(state.key && ( !check_value || state.value ) )
          {
            dom_data.update(state); 
            nav_target.textContent = state.key;
          }
          else 
          {
            nav_target = this.remove_attribute();
          }
          break;
        }
        case "value":
        {
          if(state.key && state.value)
          {
            dom_data.update(state); 
            nav_target.textContent = '"' + state.value+ '"';
          }
          else 
          {
            nav_target = this.remove_attribute();
          }
          break;
        }
        case "text":
        {
          dom_data.update(state); 
          if( settings.dom.get('dom-tree-style') && /^\s*$/.test( state.text) ) 
          {
            nav_target.textContent = _escape(state.text);
          }
          else
          {
            nav_target.textContent = state.text;
          }
          break;
        }
      }
    }
    return nav_target;
  }

  this.cancel = function()
  {
    // return a valid navigation target or null
    var 
    script = "",
    state = this.context_enter,
    nav_target = null;

    if( this.textarea_container.parentElement )
    {
      if(this.context_cur.is_new)
      {
        // TODO is this special?
      }
      else
      {
        nav_target = this.textarea_container.parentElement;
        switch(state.type)
        {
          case "key":
          {
            if(state.key)
            {
              script = 'node.setAttribute("' + crlf_encode(state.key) + '","' + crlf_encode(state.value) + '")';
              services['ecmascript-debugger'].eval(0, state.rt_id, '', '', script, ["node", state.obj_id]);
              nav_target.textContent = state.key;
              break
            }
          }
          case "value":
          {
            if(state.value)
            {
              script =  'node.setAttribute("' + crlf_encode(state.key) + '","' + crlf_encode(state.value) + '")';
              services['ecmascript-debugger'].eval(0, state.rt_id, '', '', script, ["node", state.obj_id]);
              nav_target.textContent = '"' + state.value + '"';
              break;
            }
            nav_target = nav_target.parentNode;
            this.remove_attribute();
            nav_target = 
              (nav_target.lastElementChild || nav_target).
                getNextWithFilter(nav_target.parentElement.parentElement, nav_filters.left_right)
              || nav_target.lastElementChild 
              || nav_target.getPreviousWithFilter(nav_target.parentElement.parentElement, nav_filters.left_right);
            break;
          }
          case "text":
          {
            script = 'node.nodeValue = "' + crlf_encode(state.text) + '"';
            services['ecmascript-debugger'].eval(0, state.rt_id, '', '', script, ["node", state.obj_id]);
            if( settings.dom.get('dom-tree-style') && /^\s*$/.test( state.text) ) 
            {
              nav_target.textContent = _escape(state.text);
            }
            else
            {
              nav_target.textContent = state.text;
            }
            break;
          }
        }
      }
    }
    return nav_target;
  }

  this.nav_previous = function(event, action_id)
  {
    // must return a valid navigation target or null
    var 
    state = this.context_cur,
    nav_target = this.textarea_container.parentElement,
    nav_target_parent = nav_target.parentElement,
    next = nav_target.previousElementSibling,
    next_next = next && next.previousElementSibling,
    submit_success = this.submit(true),
    container = nav_target_parent.parentElement.parentElement;

    switch(state.type)
    {
      case "key":
      case "value":
      {
        ( next && ( submit_success || next.parentElement ) ) 
        || ( next = next_next ) 
        || ( next = nav_target_parent.getPreviousWithFilter(container, nav_filters.attr_text) );
        break;
      }
      case "text":
      {
        next = nav_target.getPreviousWithFilter(container, nav_filters.attr_text);
      }
    }

    if( next || ( next = submit_success && nav_target ) || ( next = nav_target_parent ) )
    {
      if( next.nodeName.toLowerCase() == 'node' )
      {
        next.firstChild.splitText(next.firstChild.nodeValue.length - 1);
        next = this.create_new_edit(next.firstChild);
      }
      else if( next.parentElement != nav_target_parent 
                && next.nodeName.toLowerCase() == 'value' 
                && next == next.parentElement.lastElementChild )
      {
        next = this.create_new_edit(next);
      }
      if(next)
      {
        this.edit({}, next);
      }
    }
    return next;
  }

  this.nav_next = function(event, action_id)
  {
    // must return a valid navigation target or null
    var
    state = this.context_cur,
    nav_target = this.textarea_container.parentElement,
    nav_target_parent = nav_target.parentElement,
    next = nav_target.nextElementSibling,
    next_next = next && next.nextElementSibling,
    submit_success = this.submit(),
    container = nav_target_parent.parentElement.parentElement;
 
    switch(state.type)
    {
      case "key":
      case "value":
      {
        ( submit_success && ( next || ( next = this.create_new_edit(submit_success) ) ) )
        || ( next && next.parentElement ) || ( next = next_next ) 
        || ( next = (nav_target_parent.lastElementChild || nav_target_parent).getNextWithFilter(container, nav_filters.attr_text) );
        break;
      }
      case "text":
      {
        next = nav_target.getNextWithFilter(container, nav_filters.attr_text);
      }
    }
    if(next || ( next = submit_success && nav_target ) || ( next = nav_target_parent ) )
    {
      if( next.nodeName.toLowerCase() == 'node' )
      {
        next.firstChild.splitText(next.firstChild.nodeValue.length - 1);
        next = this.create_new_edit(next.firstChild);
      }
      this.edit({}, next);
    }
    return next;
  }

  // helpers
  this.set_textarea_dimensions = function()
  {
    // TODO force new lines if needed
    var 
    max_content_length = 
      Math.max.apply(null, this.textarea.value.split('\r\n').map(function(item){return item.length})),
    width = this.char_width * ( max_content_length + 1 );

    //this.textarea.style.height = '0px';
    this.textarea.style.width = ( width < this.max_width ? width : this.max_width )+ "px";
    this.textarea.style.height = this.textarea.scrollHeight + 'px';
  }

  this.create_new_edit = function(ref_node)
  {
    var 
    name = ref_node.nodeName.toLowerCase(),
    parent = ref_node.parentNode,
    cur = parent.insertBefore
    (
      document.createTextNode( name == 'key' && '=' || ' ' ), ref_node.nextSibling
    );
    return parent.insertBefore
    (
      document.createElement( name == 'key' && 'value' || 'key' ), cur.nextSibling
    );
  }
  
  this.remove_attribute = function()
  {
    var
    script = 'node.removeAttribute("' + this.context_enter.key + '")',
    state = this.context_cur,
    nav_target = this.textarea_container.parentElement,
    nav_target_parent = nav_target.parentElement,
    pair_target = nav_target.nodeName.toLowerCase() == 'key' && 'next' || 'previous',
    check = nav_target.nodeName.toLowerCase() == 'key' && 'value' || 'key';

    if(this.context_enter.key)
    {
      services['ecmascript-debugger'].eval(0, state.rt_id, '', '', script, ["node", state.obj_id]);
      state.key = this.context_enter.key;
      delete state.value;
      dom_data.update(state);
    }
    // to clear the context of the textarea container
    nav_target.textContent = "";
    cur = nav_target[pair_target + "ElementSibling"];
    if( cur && cur.nodeName.toLowerCase() == check )
    {
      nav_target_parent.removeChild(cur);
    }
    cur = nav_target[pair_target + "Sibling"];
    if( cur && /=/.test(cur.nodeValue) )
    {
      nav_target_parent.removeChild(cur);
    }
    cur = nav_target.previousSibling;
    if( cur && / +/.test(cur.nodeValue) )
    {
      if(/^ +$/.test(cur.nodeValue))
      {
        nav_target_parent.removeChild(cur);
      }
      else
      {
        cur.nodeValue = cur.nodeValue.replace(/ +$/, '');
      }
    }
    nav_target_parent.removeChild(nav_target);
    nav_target_parent.normalize();
    return null;
  }

  // could be the default method?
  this.onclick = function(event)
  {
    event.preventDefault();
    event.stopPropagation();
    if(!this.textarea_container.contains(event.target))
    {
      this.submit(true);
      return false;
    }
    return true;
  }

}

DOMAttrAndTextEditor.prototype = BaseEditor;
