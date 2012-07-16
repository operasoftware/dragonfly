/**
  * @constructor
  * @extends BaseEditor
  */

var DOMMarkupEditor = function()
{
  this.base_init(this);
  this.type = "dom-markup-editor";
  this.domnodeserializer = new cls.DOMSerializer();
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

  const
  STATUS = 0,
  OBJECT_VALUE = 3,
  OBJECT_ID = 0,
  NODE_LIST = 0;

  this.edit = function(event, ref_ele)
  {
    var
    ele = ref_ele || event.target,
    rt_id = parseInt(ele.get_attr('parent-node-chain', 'rt-id')),
    obj_id = parseInt(ele.parentElement.getAttribute('ref-id')),
    model_id = ele.get_attr('parent-node-chain', 'data-model-id'),
    script = '',
    tag = '',
    prop = '',
    container = ele,
    model = null,
    dom = null,
    cb = null;

    while( container
            && !/container/i.test(container.nodeName)
            && ( container = container.parentElement ) );
    if(container && model_id)
    {
      model = window.dominspections[model_id];
      this.context_enter =
      {
        rt_id: rt_id,
        obj_id: obj_id,
        parent_obj_id: model.getParentElement(obj_id),
        outerHTML: '',
        host_target: '',
        model: model
      };
      this.context_cur = {};
      for( prop in this.context_enter )
      {
        this.context_cur[prop] = this.context_enter[prop];
      }
      script = this["return new Host_updater(target)"];
      tag = tagManager.set_callback(this, this.register_host_updater, [rt_id]);
      services['ecmascript-debugger'].requestEval(tag, [rt_id, 0, 0, script, [['target', obj_id]]]);
      dom = new cls.InspectableDOMNode(rt_id, obj_id);
      cb = this.handle_get_outer_html.bind(this, dom, rt_id, obj_id, ele, event);
      dom.expand(cb, obj_id, "subtree");
    }
  }

  this.oninput = function(event)
  {
    var
    script = "",
    state = this.context_cur;

    window.hostspotlighter.clearSpotlight();

    if( this.textarea_container.parentElement && state.host_target )
    {
      this.set_textarea_dimensions();
      state.outerHTML = this.textarea.value;
      var script = "host_target.outerHTML = \"" + encode(state.outerHTML) + "\";";
      services['ecmascript-debugger'].requestEval
      (
        0, [state.rt_id, 0, 0, script, [['host_target', state.host_target]]]
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
      var tag = tagManager.set_callback(this, this.on_exit_edit, [state, nav_target]);
      var script = "host_target.exit_edit()";
      services['ecmascript-debugger'].requestEval
      (
        tag, [state.rt_id, 0, 0, script, [['host_target', state.host_target]]]
      );
    }
    return nav_target;
  }

  this.cancel = function()
  {
    // return a valid navigation target or null.
    // this is aproblem. the view will be updated anyway.
    var
    script = "",
    state = this.context_enter,
    nav_target = this.textarea_container.parentElement;

    if( nav_target )
    {
      if(state.outerHTML != this.context_cur.outerHTML)
      {
        var tag = tagManager.set_callback(this, this.on_exit_edit, [state, nav_target]);
        var script = "host_target.cancel_edit()";
        services['ecmascript-debugger'].requestEval
        (
          tag, [state.rt_id, 0, 0, script, [['host_target', state.host_target]]]
        );
      }
      else
      {
        nav_target.textContent = "";
        this.context_cur = this.context_enter = null;
        views.dom.update();
      }
    }
    return nav_target;
  }

  this.nav_next = function()
  {
    var
    val = this.textarea.value,
    start = this.textarea.selectionStart,
    end = this.textarea.selectionEnd,
    indent = '  ';

    this.textarea.value = val.slice(0, start) + indent +  val.slice(end);
    this.textarea.selectionStart = start + indent.length;
    this.textarea.selectionEnd = start + indent.length;
  }

  this.set_textarea_dimensions = function()
  {
    this.textarea.style.height = 0;
    this.textarea.style.height = this.textarea.scrollHeight + 'px';
  }

  this.__is_active = function()
  {
    return this.context_enter && this.context_enter.host_target && true || false;
  }

  // could be the default method?
  this.onclick = function(event)
  {
    if (!this.textarea_container.contains(event.target))
    {
      this.submit(true);
      return false;
    }
    return true;
  }

  // helpers

  this.on_exit_edit = function(status, message, state, nav_target)
  {
    if( message[STATUS] == 'completed' )
    {
      var scroll_position = new Element.ScrollPosition(nav_target);
      var cb = function()
      {
        window.views.dom.update();
        scroll_position.reset(document.getElementById('target-element'));
        nav_target.textContent = "";
      }
      this.context_enter.model.collapse(state.parent_obj_id);
      this.context_enter.model.expand(cb, state.parent_obj_id, 'children');
      this.context_cur = this.context_enter = null;
    }
    else
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
        'exit markup edit failed in DOMMarkupEditor');
    }
  };

  var encode = function(str)
  {
    return helpers.escape_input(str.replace(/\r\n/g, "\n"));
  };

  // class on the host side to update the given DOM range
  var Host_updater = function(target)
  {
    var
    range = document.createRange(),
    timeout = 0,
    new_str = '',
    enter_node = null,
    disable_scripts = function(node)
    {
      while (node)
      {
        if (node.nodeType == Node.ELEMENT_NODE)
        {
          if (node.nodeName.toLowerCase() == "script")
          {
            var attr = node.getAttribute('type');
            node.setAttribute('type', (attr && attr != "edited" ? attr + "/" : "") + "edited");
          }
          else
            disable_scripts(node.firstElementChild);
        }
        node = node.nextElementSibling;
      }
    },
    update = function(str)
    {
      var fragment = range.createContextualFragment(new_str);
      if (fragment.childNodes.length)
      {
        if (enter_node)
          range.deleteContents();
        else
          enter_node = range.extractContents();

        disable_scripts(fragment.childNodes[0]);
        var first = fragment.childNodes[0];
        var last = fragment.childNodes[fragment.childNodes.length - 1];
        range.insertNode(fragment);
        range.setStartBefore(first);
        range.setEndAfter(last);
      }
      timeout = 0;
    };
    range.selectNode(target);
    this.__defineSetter__("outerHTML", function(str)
    {
      new_str = str;
      if (!timeout)
        timeout = setTimeout(update, 100);
    });
    this.cancel_edit = function()
    {
      timeout && ( timeout = clearTimeout(timeout) );
      if(enter_node)
      {
        range.deleteContents();
        range.insertNode(enter_node);
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
      range = timeout = new_str = enter_node = update = null;
    };
  };

  this["return new Host_updater(target)"] =
    "return new (" + Host_updater.toString() + ")(target)";

  this.register_host_updater = function(status, message, rt_id)
  {
    var
    status = message[STATUS],
    obj_id = message[OBJECT_VALUE][OBJECT_ID];

    if(  status == 'completed' && obj_id )
    {
      this.context_enter.host_target = this.context_cur.host_target = obj_id;
    }
    else
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
        "failed register_host_updater in DOMMarkupEditor");
    }
  }

  // complete the edit call
  this.handle_get_outer_html = function(dom, rt_id, obj_id, ele, event)
  {
    var
    outerHTML = this.domnodeserializer.serialize(dom),
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
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
        "this.textarea_container.parentElement is not null in submit");
    }
    this.textarea.value = outerHTML;
    var scroll_position = new Element.ScrollPosition(parent);
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
    scroll_position.reset(null, this.textarea);
    this.textarea.selectionEnd = this.textarea.selectionStart = 0;
    // it seems it needs to be set twice to get set correctly
    this.set_textarea_dimensions();
  }

  this._onmonospacefontchange = function(msg)
  {
    this.base_style['font-size'] = 0;
  }

  messages.addListener('monospace-font-changed',
                       this._onmonospacefontchange.bind(this));
}

DOMMarkupEditor.prototype = BaseEditor;
