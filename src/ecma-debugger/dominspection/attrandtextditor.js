/**
  * @constructor
  * @extends BaseEditor
  */

var DOMAttrAndTextEditor = function(nav_filters)
{
  var crlf_encode = function(str)
  {
    return helpers.escape_input(str.replace(/\r\n/g, "\n"));
  }

  this._onmonospacefontchange = function(msg)
  {
    this.base_style['font-size'] = 0;
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

    if (!this.base_style['font-size'])
    {
      this.get_base_style(ele);
    }

    // this should never be needed

    if (this.textarea_container.parentElement)
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
        "this.textarea_container.parentElement is not null in submit");
    }

    parent_parent = ele.parentNode;
    while (parent_parent && parent_parent.nodeType == 1 && !parent_parent.hasAttribute('data-model-id'))
      parent_parent = parent_parent.parentNode;
    if (parent_parent && parent_parent.hasAttribute('data-model-id'))
      enter_state.model = window.dominspections[parent_parent.getAttribute('data-model-id')];
    // TODO else throw?





    switch( enter_state.type = ele.nodeName.toLowerCase() )
    {
      case "key":
      {
        parent_parent = ele.parentElement.parentElement;
        // dom markup and dom tree have different markup
        enter_state.rt_id = parseInt(parent_parent.parentElement.getAttribute('rt-id')
          || parent_parent.parentElement.parentElement.getAttribute('rt-id'));
        enter_state.obj_id = parseInt(parent_parent.getAttribute('ref-id'));
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
        enter_state.rt_id = parseInt(parent_parent.parentElement.getAttribute('rt-id')
          || parent_parent.parentElement.parentElement.getAttribute('rt-id'));
        enter_state.obj_id = parseInt(parent_parent.getAttribute('ref-id'));
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
        enter_state.rt_id = parseInt(parent_parent.parentElement.getAttribute('rt-id')
          || parent_parent.parentElement.parentElement.getAttribute('rt-id'));
        enter_state.obj_id = parseInt(ele.getAttribute('ref-id'));
        if (ele.hasClass("only-whitespace"))
        {
          enter_state.text = helpers.unescape_whitespace(ele.textContent);
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
    this._set_textarea_dimensions();
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
    state = this.context_cur,
    pos = 0;

    if( this.textarea_container.parentElement )
    {
      this._set_textarea_dimensions();
      switch(state.type)
      {
        case "key":
        {
          state.oldkey = state.key;
          state.key = this.textarea.value;
          pos = state.key.indexOf('=');
          if (pos > -1)
          {
            state.value = state.key.slice(pos + 1);
            state.key = state.key.slice(0, pos);
            this.nav_next();
          }
          if (state.value != null)
          {
            script = (state.oldkey ? 'node.removeAttribute("' + crlf_encode(state.oldkey) + '");' : '') +
                     'node.setAttribute("' + crlf_encode(state.key) + '",' +
                                       '"' + crlf_encode(state.value) + '")';
            services['ecmascript-debugger'].requestEval(0,
                [state.rt_id, 0, 0, script, [["node", state.obj_id]]]);
          }
          break;
        }
        case "value":
        {
          // there should never be the situation that the key is not defined
          script = 'node.setAttribute("' + crlf_encode(state.key) + '","' +
                    crlf_encode(( state.value = this.textarea.value )) + '")';
          services['ecmascript-debugger'].requestEval(0,
              [state.rt_id, 0, 0, script, [["node", state.obj_id]]]);
          break;
        }
        case "text":
        {

          script = 'node.nodeValue = "' + crlf_encode( state.text = this.textarea.value ) + '"';
          services['ecmascript-debugger'].requestEval(0,
              [state.rt_id, 0, 0, script, [["node", state.obj_id]]]);
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
      var cb = this._select_node.bind(this, nav_target.has_attr("parent-node-chain", "ref-id"));
      switch(state.type)
      {
        case "key":
        {
          if(state.key && ( !check_value || state.value ) )
          {
            if ( !(state.key == this.context_enter.key && state.value == this.context_enter.value))
              this.context_enter.model.expand(cb, state.obj_id, "node");
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
          if (state.key && state.value != null)
          {
            if ( !(state.key == this.context_enter.key && state.value == this.context_enter.value))
              this.context_enter.model.expand(cb, state.obj_id, "node");
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
          if ( !(state.text == this.context_enter.text))
            this.context_enter.model.expand(cb, state.obj_id, "node");
          if( settings.dom.get('dom-tree-style') && /^\s*$/.test( state.text) )
          {
            nav_target.addClass("only-whitespace");
            nav_target.textContent = helpers.escape_whitespace(state.text);
          }
          else
          {
            nav_target.removeClass("only-whitespace");
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
            if (state.key)
            {
              script = 'node.setAttribute("' + crlf_encode(state.key) + '","' +
                                               crlf_encode(state.value) + '")';
              var msg = [state.rt_id, 0, 0, script, [["node", state.obj_id]]];
              services['ecmascript-debugger'].requestEval(0, msg);
              nav_target.textContent = state.key;
              break;
            }
            else // a newly added attribute
            {
              var key = crlf_encode(this.context_cur.key);
              script = 'node.removeAttribute("' + key + '")';
              var msg = [state.rt_id, 0, 0, script, [["node", state.obj_id]]];
              services['ecmascript-debugger'].requestEval(0, msg);
              // fall trough to value
            }
          }
          case "value":
          {
            if (state.key && state.value != null)
            {
              script =  'node.setAttribute("' + crlf_encode(state.key) + '","' +
                                                crlf_encode(state.value) + '")';
              services['ecmascript-debugger'].requestEval(0,
                  [state.rt_id, 0, 0, script, [["node", state.obj_id]]]);
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
            services['ecmascript-debugger'].requestEval(0,
                [state.rt_id, 0, 0, script, [["node", state.obj_id]]]);
            if( settings.dom.get('dom-tree-style') && /^\s*$/.test( state.text) )
            {
              nav_target.textContent = helpers.escape_whitespace(state.text);
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
        next.firstChild.splitText(next.firstChild.nodeValue.replace(/\/?>$/,'').length);
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
        next.firstChild.splitText(next.firstChild.nodeValue.replace(/\/?>$/,'').length);
        next = this.create_new_edit(next.firstChild);
      }
      this.edit({}, next);
    }
    return next;
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

  this.insert_attribute_edit = function(ref_node)
  {
    if (ref_node)
    {
      if (ref_node.lastChild.nodeType == 3)
      {
        ref_node.lastChild.splitText(ref_node.lastChild.nodeValue.replace(/\/?>$/,'').length);
        ref_node = this.create_new_edit(ref_node.lastChild.previousSibling);
      }
      else
      {
        ref_node = this.create_new_edit(ref_node.lastChild);
      }
      this.edit({}, ref_node);
    }
  };

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
      services['ecmascript-debugger'].requestEval(0,
      [state.rt_id, 0, 0, script, [["node", state.obj_id]]]);
      state.key = this.context_enter.key;
      delete state.value;
      this.context_enter.model.expand(null, state.obj_id, "node");
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

  this._select_node = function(target)
  {
    ActionBroker.get_instance().dispatch_action("dom", "select-node", null, target);
  };

  this._init = function()
  {
    this.base_init(this);
    messages.addListener('monospace-font-changed',
                         this._onmonospacefontchange.bind(this));
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
  };

  this._init();


}

DOMAttrAndTextEditor.prototype = BaseEditor;
