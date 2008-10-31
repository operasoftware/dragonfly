/**
  * @constructor 
  * @extends BaseEditor
  */

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
    outerHTML: '',
    host_target: ''
  }

  this.context_cur =
  {
    rt_id: '',
    obj_id: '',
    parent_obj_id: '',
    outerHTML: '',
    host_target: ''
  }

  this.edit = function(event, ref_ele)
  {
    var 
    ele = ref_ele || event.target,
    rt_id = ele.parentElement.parentElement.getAttribute('rt-id'),
    obj_id = ele.parentElement.getAttribute('ref-id'),
    script = '',
    tag = '',
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
        outerHTML: '',
        host_target: ''
      };
      this.context_cur = {};
      for( prop in this.context_enter )
      {
        this.context_cur[prop] = this.context_enter[prop];
      }
      script = this["return new Host_updater(target)"];
      tag = tagManager.setCB(this, this.register_host_updater, [rt_id]);
      services['ecmascript-debugger'].eval( tag, rt_id, '', '', script, ['target', obj_id]);
      tag = tagManager.setCB(this, this.handle_get_outer_html, [rt_id, obj_id, ele, event])
      services['ecmascript-debugger'].inspectDOM( tag, obj_id, 'subtree', 'json' );
    }
  }

  this.oninput = function(event)
  {
    var 
    script = "",
    state = this.context_cur;

    if( this.textarea_container.parentElement && state.host_target )
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
      var script = "host_target.exit_edit()";
      services['ecmascript-debugger'].eval
      ( 
        0, state.rt_id, '', '', script, ['host_target', state.host_target]
      );
      this.on_exit_edit(state, nav_target);
    }
    return nav_target;
  }

  this.cancel = function()
  {
    // return a valid navigation target or null
    var 
    script = "",
    state = this.context_enter,
    nav_target = this.textarea_container.parentElement;
    
    if( nav_target )
    {
      if(state.outerHTML != this.context_cur.outerHTML)
      {
        var script = "host_target.cancel_edit()";
        services['ecmascript-debugger'].eval
        ( 
          0, state.rt_id, '', '', script, ['host_target', state.host_target]
        );
      }
      this.on_exit_edit(state, nav_target);
    }
    return nav_target;
  }

  this.set_textarea_dimensions = function()
  {
    this.textarea.style.height = this.textarea.scrollHeight + 'px';
  }

  this.__is_active = function()
  {
    return this.context_enter && this.context_enter.host_target && true || false;
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

  // helpers

  this.on_exit_edit = function(state, nav_target)
  {
    // to remove the textarea_container from the dom
    nav_target.textContent = "";
    this.context_cur = this.context_enter = null;
    dom_data.closeNode(state.parent_obj_id, true);
    dom_data.getChildernFromNode(state.parent_obj_id);
  };

  var encode = function(str)
  {
    return str.replace(/\u200F\r\n/g, "").replace(/\r\n/g, "\\n").replace(/'/g, "\\'"); 
  };

  // class on the host side to update the given DOM range
  var Host_updater = function(target)
  {
    var 
    range_target = document.createRange(),
    timeout = 0,
    new_str = '',
    enter_node = null,
    update = function(str)
    {
      if( enter_node )
      {
        range_target.deleteContents();
      }
      else
      {
        enter_node = range_target.extractContents();
      };
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
    this.cancel_edit = function()
    {
      timeout && ( timeout = clearTimeout(timeout) );
      if(enter_node)
      {
        range_target.deleteContents();
        range_target.insertNode(enter_node);
      }
      this.exit_edit();
    };
    this.exit_edit = function()
    {
      if( timeout )
      {
        timeout = clearTimeout(timeout);
        update();
      };
      range_target = timeout = new_str = enter_node = update = null;
    };
  };

  this["return new Host_updater(target)"] = 
    "return new (" + Host_updater.toString() + ")(target)";

  this.register_host_updater = function(xml, rt_id)
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
      opera.postError("failed register_host_updater in DOMMarkupEditor");
    }
  }

  // complete the edit call
  this.handle_get_outer_html = function(xml, rt_id, obj_id, ele, event)
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
      this.textarea.selectionEnd = this.textarea.selectionStart = 0;
    }
    else
    {
      opera.postError("get subtree failed in DOMMarkupEditor handleGetSubtree")
    }
  }
}

DOMMarkupEditor.prototype = BaseEditor;