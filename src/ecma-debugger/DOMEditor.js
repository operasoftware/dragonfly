/**
  * @constructor 
  */

var BaseEditor = new function()
{
  // an editable element must have monospace font

  /* interface */
  this.edit = 
  this.oninput =
  this.submit =
  // returns a valid navigation target or null
  this.cancel = 
  // to handle click events while editing
  // could be perhaps a base method
  this.onclick = 
  this.nav_next =
  this.nav_previous = function(){};

  var _init = function(instance)
  {
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
  this.base_init = function(instance)
  {
    _init.apply(instance, [instance]);
  }
}

var DOMAttrAndTextEditor = function()
{
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
    if( this.textarea_container.parentElement )
    {
      this.submit();
    }
    switch( enter_state.type = ele.nodeName )
    {
      case "key":
      {
        parent_parent = ele.parentElement.parentElement;
        enter_state.rt_id = parent_parent.parentElement.getAttribute('rt-id');
        enter_state.obj_id = parent_parent.getAttribute('ref-id');
        enter_state.key = ele.textContent;
        enter_state.has_value = ele.nextElementSibling && ele.nextElementSibling.nodeName == "value";
        enter_state.value = enter_state.has_value 
          && ele.nextElementSibling.textContent.replace(/^"|"$/g, "");
        break;
      }
      case "value":
      {
        parent_parent = ele.parentElement.parentElement;
        enter_state.rt_id = parent_parent.parentElement.getAttribute('rt-id');
        enter_state.obj_id = parent_parent.getAttribute('ref-id');
        enter_state.key = 
          ele.previousElementSibling 
          && ele.previousElementSibling.nodeName == "key"
          && ele.previousElementSibling.textContent
          || "";
        enter_state.value = ele.textContent.replace(/^"|"$/g, "");
        break;
      }
      case "text":
      {
        parent_parent = ele.parentElement;
        enter_state.rt_id = parent_parent.parentElement.getAttribute('rt-id');
        enter_state.obj_id = ele.getAttribute('ref-id');
        enter_state.text = ele.textContent;
        break;
      }
    }

    this.max_width = parseInt( getComputedStyle(parent_parent, null).getPropertyValue('width'));
    if( enter_state.type == "value" )
    {
      this.textarea.value = ele.textContent.replace(/^"|"$/g, "");
      ele.textContent = '"';
      ele.appendChild(this.textarea_container);
      ele.appendChild(document.createTextNode('"'));
    }
    else
    {
      this.textarea.value = ele.textContent;
      ele.textContent = "";
      ele.appendChild(this.textarea_container);
    }
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
  }

  this.oninput = function(event)
  {
    var 
    script = "",
    state = this.context_cur;

    // TODO call back update data ?
    if( this.textarea_container.parentElement )
    {
      this.set_textarea_dimensions();
      switch(state.type)
      {
        case "key":
        {

          break;
        }
        case "value":
        {

          break;
        }
        case "text":
        {
          script = 'node.nodeValue = "' + ( state.text = this.textarea.value ) + '"';
          services['ecmascript-debugger'].eval(0, state.rt_id, '', '', script, ["node", state.obj_id]);
          break;
        }
      }
    }
  }

  this.submit = function()
  {
    var 
    script = "",
    state = this.context_cur;

    if( this.textarea_container.parentElement )
    {
      switch(state.type)
      {
        case "key":
        {

          break;
        }
        case "value":
        {

          break;
        }
        case "text":
        {
          // TODO update data
          dom_data.update(state);
          this.textarea_container.parentElement.textContent = state.text;
          break;
        }
      }
    }
  }

  this.cancel = function()
  {
    // return true if the textarea container is a valid navigation target
    // this should be true if the edited entity is not new
    var 
    script = "",
    state = this.context_enter,
    ret = null;

    if( this.textarea_container.parentElement )
    {
      switch(state.type)
      {
        case "key":
        {

          break;
        }
        case "value":
        {

          break;
        }
        case "text":
        {
          if( this.context_cur.is_new )
          {
            // TODO
            // remove the new markup
            // return false
          }
          else
          {
            script = 'node.nodeValue = "' + state.text + '"';
            services['ecmascript-debugger'].eval(0, state.rt_id, '', '', script, ["node", state.obj_id]);
            ret = this.textarea_container.parentElement;
            ret.textContent = state.text;
            return ret;
          }
          break;
        }
      }
    }
  }

  this.set_textarea_dimensions = function()
  {
    // TODO force new lines if needed
    var width = this.char_width * ( this.textarea.value.length + 1 );
    //this.textarea.style.height = '0px';
    this.textarea.style.width = ( width < this.max_width ? width : this.max_width )+ "px";
    this.textarea.style.height = this.textarea.scrollHeight + 'px';
  }

  // could be the default method?
  this.onclick = function(event)
  {
    if(!this.textarea_container.contains(event.target))
    {
      this.submit();
    }
  }

  /*
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

  */

  this.base_init(this);
}

DOMAttrAndTextEditor.prototype = BaseEditor;
