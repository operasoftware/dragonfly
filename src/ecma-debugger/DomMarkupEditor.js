
var DOMMarkupEditor = function()
{
  this.base_init(this);
  this.type = "dom-markup-editor";
  // specific context 
  this.context_enter =
  {
    rt_id: '',
    obj_id: '',
    parent_obj_id: '',
    outer_html: '',
    host_target: ''
  }
  this.context_cur =
  {
    rt_id: '',
    obj_id: '',
    parent_obj_id: '',
    outer_html: '',
    host_target: ''
  }

  var crlf_encode = function(str)
  {
    return str.replace(/\r\n/g, "\\n");
  }

  var encode = function(str)
  {
    return str.replace(/\u200F\r\n/g, "").replace(/\r\n/g, "\\n").replace(/'/g, "\\'");
  }

  var Host_updater = function(target)
  {
    var 
    range_target = document.createRange(),
    timeout = 0,
    new_str = '',
    update = function(str)
    {
      range_target.deleteContents();
      var range_source = document.createRange();
      var temp = document.createElement('df-temp-element');
      ( document.body || document.documentElement || document ).appendChild(temp);
      temp.innerHTML = new_str;
      var first = temp.firstChild;
      var last = temp.lastChild;
      if(first)
      {
        range_source.selectNodeContents(temp);
        var fragment = range_source.extractContents();
        if( temp.parentNode == document )
        {
          document.replaceChild(fragment, temp);
          range_target.selectNode(document.documentElement);
        }
        else
        {
          range_target.insertNode(fragment);
          range_target.setStartBefore(first);
          range_target.setEndAfter(last);
        }
      };
      if(temp.parentNode)
      {
        temp.parentNode.removeChild(temp);
      };
      timeout = 0;
    };

    range_target.selectNode(target);
    this.__defineSetter__
    (
      "outerHTML", 
      function(str)
      {
        new_str = str;
        timeout || ( timeout = setTimeout(update, 100) );
      }
    );
   
  };

  this.__is_active = function()
  {
    return this.context_enter && this.context_enter.host_target && true || false;
  }

  this.__set_host_updater = function(xml, rt_id)
  {
    var 
    status = xml.getNodeData('status'),
    obj_id = xml.getNodeData('object-id');

    if(  status == 'completed' && obj_id )
    {
      this.context_enter.host_target = this.context_cur.host_target = obj_id;
    }
    else
    {
      opera.postError("failed __set_host_updater in DOMMarkupEditor");
    }
  }

  this.edit = function(event, ref_ele)
  {
    var 
    ele = ref_ele || event.target,
    rt_id = ele.parentElement.parentElement.getAttribute('rt-id'),
    obj_id = ele.parentElement.getAttribute('ref-id'),
    script = "return new (" + Host_updater.toString() + ")(target)",
    tag = tagManager.setCB(this, this.__set_host_updater, [rt_id]),
    prop = '',
    container = ele;

    while( container 
            && !/container/.test(container.nodeName) 
            && ( container = container.parentElement ) );
    if(container)
    {
      container.firstChild.style.position = 'relative';
      container.firstChild.render(['fade-out']);
      this.context_enter =
      {
        rt_id: rt_id,
        obj_id: obj_id,
        parent_obj_id: dom_data.getParentElement(obj_id),
        outer_html: '',
        host_target: ''
      };
      this.context_cur = {};
      for( prop in this.context_enter )
      {
        this.context_cur[prop] = this.context_enter[prop];
      }
      services['ecmascript-debugger'].eval( tag, rt_id, '', '', script, ['target', obj_id]);
      tag = tagManager.setCB(this, this.__edit, [rt_id, obj_id, ele])
      services['ecmascript-debugger'].inspectDOM( tag, obj_id, 'subtree', 'json' );
    }
  }

  this.__edit = function(xml, rt_id, obj_id, ele)
  {
    var json = xml.getNodeData('jsondata');
    
    if( json )
    {
      var 
      outerHTML = views['dom'].serializeToOuterHTML(eval('(' + json +')')),
      parent = ele.parentNode,
      parent_parent = parent.parentElement,
      margin = parseInt(parent.style.marginLeft),
      next = null;

      this.context_enter.outerHTML = this.context_cur.outerHTML = outerHTML;
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
      while( ( next = parent.nextElementSibling ) && parseInt(next.style.marginLeft) > margin )
      {
        parent_parent.removeChild(next);
      };
      if( next && parseInt(next.style.marginLeft) == margin && /<\//.test(next.textContent) )
      {
        parent_parent.removeChild(next);
      }
      this.set_textarea_dimensions();
      // only for click events
      if( event )
      {
        this.textarea.focus();
      }
    }
    else
    {
      opera.postError("get subtree failed in DOMMArkupEditor handleGetSubtree")
    }
  }

  this.oninput = function(event)
  {
    var 
    script = "",
    state = this.context_cur;

    if( this.textarea_container.parentElement && state.host_target)
    {
      this.set_textarea_dimensions();
      state.outerHTML = this.textarea.value;
      var script = "host_target.outerHTML = '" + encode(state.outerHTML) + "';";
      services['ecmascript-debugger'].eval
      ( 
        0, state.rt_id, '', '', script, ['host_target', state.host_target]
      );
    }
  }

  this.submit = function()
  {
    // return a valid navigation target or null
    var
    state = this.context_cur,
    nav_target = this.textarea_container.parentElement;
    
    if(nav_target)
    {
      // to remove the textarea_container from the dom
      nav_target.textContent = "";
      this.context_cur = this.context_enter = null;
      dom_data.closeNode(state.parent_obj_id, true);
      dom_data.getChildernFromNode(state.parent_obj_id);
    }
    return nav_target;
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

DOMMarkupEditor.prototype = BaseEditor;