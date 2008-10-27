
var DOMMarkupEditor = function()
{
  this.base_init(this);
  this.type = "dom-markup-editor";
  // specific context 
  this.context_enter =
  {
    /*
    type: '',
    rt_id: '',
    obj_id:'',
    text: '',
    key: '',
    value: '',
    has_value: false,
    is_new: false
    */
  }
  this.context_cur =
  {
    /*
    type: '',
    rt_id: '',
    obj_id:'',
    text: '',
    key: '',
    value: '',
    has_value: false,
    is_new: false
    */
  }

  var crlf_encode = function(str)
  {
    return str.replace(/\r\n/g, "\\n");
  }






  this.edit = function(event, ref_ele)
  {
    var 
    ele = ref_ele || event.target,
    rt_id = ele.parentElement.parentElement.getAttribute('rt-id'),
    obj_id = ele.parentElement.getAttribute('ref-id'),
    tag = tagManager.setCB(this, this.__edit, [rt_id, obj_id, ele]);

    services['ecmascript-debugger'].inspectDOM( tag, obj_id, 'subtree', 'json' );
  }

  this.__edit = function(xml, rt_id, obj_id, ele)
  {
    var json = xml.getNodeData('jsondata');
    if( json )
    {
      var 
      outerHTML = views['dom'].serializeToOuterHTML(eval('(' + json +')')),
      parent = ele.parentNode,
      enter_state =
      {
        rt_id: rt_id,
        obj_id: obj_id,
        outer_html: outerHTML,
      };

      if( !this.base_style['font-size'] )
      {
        this.get_base_style(ele);
      }
      // this should never be needed
      if( this.textarea_container.parentElement )
      {
        opera.postError("this.textarea_container.parentElement is not null in submit");
      }
      this.textarea.value = outerHTML;
      parent.innerHTML = "";
      parent.appendChild(this.textarea_container);
    
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
      //this.textarea.selectionStart = 0;
      //this.textarea.selectionEnd = this.textarea.value.length;
    }
    else
    {
      opera.postError("get subtree failed in DOMMArkupEditor handleGetSubtree")
    }
  }

  this.oninput = function(event)
  {
    /*
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
    */
  }

  this.submit = function(check_value)
  {
    /*
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
          nav_target.textContent = state.text;
          break;
        }
      }
    }
    return nav_target;
    */
  }

  this.cancel = function()
  {
    /*
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
            script = 'node.setAttribute("' + crlf_encode(state.key) + '","' + crlf_encode(state.value) + '")';
            services['ecmascript-debugger'].eval(0, state.rt_id, '', '', script, ["node", state.obj_id]);
            nav_target.textContent = state.key;
            break;
          }
          case "value":
          {
            script =  'node.setAttribute("' + crlf_encode(state.key) + '","' + crlf_encode(state.value) + '")';
            services['ecmascript-debugger'].eval(0, state.rt_id, '', '', script, ["node", state.obj_id]);
            nav_target.textContent = '"' + state.value + '"';
            break;
          }
          case "text":
          {
            script = 'node.nodeValue = "' + crlf_ecode(state.text) + '"';
            services['ecmascript-debugger'].eval(0, state.rt_id, '', '', script, ["node", state.obj_id]);
            nav_target.textContent = state.text;
            break;
          }
        }
      }
    }
    return nav_target;
    */
  }

  this.nav_previous = function(event, action_id)
  {
    /*
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

    if( next )
    {
      if( next.nodeName == 'node' )
      {
        next.firstChild.splitText(next.firstChild.nodeValue.length - 1);
        next = this.create_new_edit(next.firstChild);
      }
      else if( next.parentElement != nav_target_parent 
                && next.nodeName == 'value' 
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
    */
  }

  this.nav_next = function(event, action_id)
  {
    /*
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
        || ( next = nav_target_parent.getNextWithFilter(container, nav_filters.attr_text) );
        break;
      }
      case "text":
      {
        next = nav_target.getNextWithFilter(container, nav_filters.attr_text);
      }
    }
    if(next)
    {
      if( next.nodeName == 'node' )
      {
        next.firstChild.splitText(next.firstChild.nodeValue.length - 1);
        next = this.create_new_edit(next.firstChild);
      }
      this.edit({}, next);
    }
    return next;
    */
  }

  // helpers
  this.set_textarea_dimensions = function()
  {
    this.textarea.style.height = this.textarea.scrollHeight + 'px';
  }

  this.create_new_edit = function(ref_node)
  {
    /*
    var 
    name = ref_node.nodeName,
    parent = ref_node.parentNode,
    cur = parent.insertBefore
    (
      document.createTextNode( name == 'key' && '=' || ' ' ), ref_node.nextSibling
    );
    return parent.insertBefore
    (
      document.createElement( name == 'key' && 'value' || 'key' ), cur.nextSibling
    );
    */
  }
  
  this.remove_attribute = function()
  {
    /*
    var
    script = 'node.removeAttribute("' + this.context_enter.key + '")',
    state = this.context_cur,
    nav_target = this.textarea_container.parentElement,
    nav_target_parent = nav_target.parentElement,
    pair_target = nav_target.nodeName == 'key' && 'next' || 'previous',
    check = nav_target.nodeName == 'key' && 'value' || 'key';
 
    services['ecmascript-debugger'].eval(0, state.rt_id, '', '', script, ["node", state.obj_id]);
    state.key = this.context_enter.key;
    delete state.value;
    dom_data.update(state);
    // to clear the context of the textarea container
    nav_target.textContent = "";
    cur = nav_target[pair_target + "ElementSibling"];
    if( cur && cur.nodeName == check )
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
    */
  }

  // could be the default method?
  this.onclick = function(event)
  {
    if(!this.textarea_container.contains(event.target))
    {
      this.submit(true);
    }
  }
}

DOMMarkupEditor.prototype = BaseEditor;