﻿var cls = window.cls || ( window.cls = {} );
// this should go in a own file

/**
  * @constructor 
  * @extends BaseActions
  */

cls.DOMInspectorActions = function(id)
{
  this.view_id = id;
  this.id = id;

  const
  SCROLL_IN_PADDING = 30,
  MODE_DEFAULT = ActionBroker.MODE_DEFAULT,
  MODE_EDIT_ATTR_TEXT = "edit-attributes-and-text",
  MODE_EDIT_MARKUP = "edit-markup";

  this.mode_labels =
  {
    "edit-attributes-and-text": "Edit Attributes and Text",
    "edit-markup": "Edit markup"
  }

  var self = this;
  var view_container = null;
  var view_container_first_child = null;
  var nav_target = null;
  var selection = null;
  var range = null;
  
  var broker = ActionBroker.get_instance();

  this.mode = MODE_DEFAULT;
  this.serializer = new cls.DOMSerializer();

  this._handlers = {};

  // traversal 'subtree' or 'children' 
  this._expand_collapse_node = function(event, target, traversal)
  {
    var container = event.target.parentNode;
    var level = parseInt(container.style.marginLeft) || 0;
    var level_next = container.nextSibling && 
                     parseInt(container.nextSibling.style.marginLeft) || 0;
    var ref_id = parseInt(container.getAttribute('ref-id'));
    if (container = container.has_attr("parent-node-chain", "data-model-id"))
    {
      var model = window.dominspections[container.getAttribute('data-model-id')];
      var target = document.getElementById('target-element');
      var is_editable = container.hasAttribute('edit-handler');
      var cb = null;
      var target_id = 0;

      if (container.contains(target))
        target_id = parseInt(target.getAttribute('ref-id'));
      if (level_next > level)
      {
        model.collapse(ref_id);
        this._get_children_callback(container, model, target_id, is_editable);
      }
      else
      {
        cb = this._get_children_callback.bind(this, container, model, 
                                              target_id, is_editable);
        model.expand(cb, ref_id, traversal);
      }
    }
  }

  this._get_children_callback = function(container, model, target_id, is_editable)
  {
    var tmpl = window.templates.inspected_dom_node(model, target_id, is_editable);
    container.re_render(tmpl);
  }

  this._select_node = function(target)
  {
    var 
    obj_id = parseInt(target.getAttribute('ref-id')),
    model_id = target.get_attr("parent-node-chain", "data-model-id"),
    inspections = window.dominspections,
    model = null
    scroll_into_view = false,
    current_target_id = 0;

    if (model_id && obj_id)
    {
      model = inspections[model_id];
      if (window.settings.dom.get('highlight-on-hover'))
      {
        current_target_id = inspections.active && inspections.active.target;
        scroll_into_view = settings.dom.get('scroll-into-view-on-spotlight') && 
                           obj_id != current_target_id;
        hostspotlighter.spotlight(obj_id, scroll_into_view);                       
      }
      model.target = obj_id;
      inspections.active = model;
      window.messages.post("element-selected", {model: model, 
                                                obj_id: obj_id, 
                                                rt_id: model.getDataRuntimeId()});
      if (document.getElementById('target-element'))
        document.getElementById('target-element').removeAttribute('id');
      target.id = 'target-element';
      // if the view_container is null the view is not in focus
      if (!view_container)
        window.helpers.scroll_dom_target_into_view();
    }
    return model;
  }

  var _is_script_node = function(target)
  {
    switch(target.nodeName.toLowerCase())
    {
      case 'value':
      case 'key':
      {
        return /^<?script/i.test(target.parentNode.firstChild.nodeValue);
      }
      case 'text':
      {
        return !target.hasAttribute('ref-id');
      }
      case 'node':
      {
        return ( target.firstChild && /^<?\/?script/i.test(target.firstChild.nodeValue) );
      }
      default:
      {
        return false;
      }
    }
  }

  var nav_filters = 
  {
    attr_text: function(ele)
    {
      if(!_is_script_node(ele))
      {
        switch(ele.nodeName.toLowerCase())
        {
          case 'text':
          case 'key':
          case 'value':
          {
            return true;
          }
          case 'node':
          { 
            return !(ele.getElementsByTagName('key')[0] || /<\//.test(ele.textContent));
          }
        }
      }
      return false; 
    },
    left_right: function(ele)
    {
      return ( !_is_script_node(ele) &&
        ( /^key|value|input|node$/.test(ele.nodeName.toLowerCase()) ||
          "text" == ele.nodeName.toLowerCase() && ele.textContent.length ) );
    },
    up_down: function(ele, start_ele)
    {
      return (
      ( "input" == ele.nodeName.toLowerCase() && !ele.parentNode.contains(start_ele) ) ||
      ( !_is_script_node(ele) && 
          ( "node" == ele.nodeName.toLowerCase() &&
            ( ele.textContent.slice(0,2) != "</" ||
              // it is a closing tag but it's also the only tag in this line
              ( ele.parentNode.getElementsByTagName('node')[0] == ele ) ) &&
            "input" != ele.parentNode.firstElementChild.nodeName.toLowerCase() ) ) );
    }
  }

  this.editor = null;
  this.is_dom_type_tree = false;
  this.editors = 
  {
    "dom-attr-text-editor": new DOMAttrAndTextEditor(nav_filters),
    "dom-markup-editor": new DOMMarkupEditor(nav_filters)
  };

  this.set_editor = function(type)
  {
    if( this.editor )
    {
      this.editor.submit()
    }
    if( !this.editor || this.editor.type != type )
    {
      this.editor = this.editors[type];
    }
  }

  
  this.getFirstTarget = function()
  {    
    return view_container 
      && ( document.getElementById('target-element') || view_container ).
      getElementsByTagName('input')[0];
  }


  this.resetTarget = function()
  {
    if (view_container && nav_target)
    {
      /*
        the logic to reset the target must be improved
      */
      var new_container = view_container;
      if (!document.documentElement.contains(new_container))
        new_container = document.getElementById(new_container.id);
      if (new_container && new_container.firstChild)
      {
        var 
        new_container_elements = new_container.firstChild.getElementsByTagName('*'),
        old_container_elements = view_container_first_child.getElementsByTagName('*'),
        index = old_container_elements.indexOf(nav_target),
        cur = null;

        nav_target = new_container_elements[index];
        view_container = new_container;
        view_container_first_child = new_container.firstChild;
        cur = view_container.firstElementChild;
        cur = cur && cur.firstElementChild;
        this.is_dom_type_tree = cur && cur.hasClass('tree-style');
        this.setSelected(nav_target || (nav_target = this.getFirstTarget()));
      }
      else
        this.blur();
    }
    else
      this.blur();
  }

  var ondomnodeinserted = function(event)
  {
    if(event.target.nodeType == 1 && nav_target && !document.documentElement.contains(nav_target))
    {
      self.resetTarget();
    }
  }

  this.setContainer = function(event, container)
  {
    
    document.addEventListener('DOMNodeInserted', ondomnodeinserted, false);
    view_container = container;
    view_container_first_child = container.firstChild;
    selection = getSelection();
    range = document.createRange();
    this.is_dom_type_tree = container.hasClass('tree-style');
    if (event.type == 'click')
    {
      switch (event.target.nodeName.toLowerCase())
      {
        case 'node':
        case 'key':
        case 'value':
        case 'text':
        case 'input':
        {
          nav_target = event.target;
          break;
        }
        case 'div':
        {
          if (event.target.getElementsByTagName('node')[0])
            nav_target = event.target.getElementsByTagName('node')[0];
          break;
        }
      }
    }
    if (!nav_target)
    {
      nav_target = this.getFirstTarget();
    }
    this.setSelected(nav_target);
  }

  this.setSelected = function(new_target, scroll_into_view)
  {
    var firstChild = null, raw_delta = 0, delta = 0;
    if(new_target)
    {
      if(nav_target)
      {
        nav_target.blur();
      }
      selection.removeAllRanges();
      nav_target = new_target;
      if (scroll_into_view)
      {
        raw_delta = new_target.getBoundingClientRect().top - 
                    view_container.getBoundingClientRect().top; 
        // delta positive overflow of the container
        delta = 
          raw_delta + new_target.offsetHeight + SCROLL_IN_PADDING - view_container.offsetHeight;
   
        // if delta is zero or less than zero, there is no positive overflow
        // check for negative overflow
        if( delta < 0 && ( delta = raw_delta - SCROLL_IN_PADDING ) > 0 )
        {
          // if there is no negative overflow, set the delta to 0, meanig don't scroll
          delta = 0;
        }
        view_container.scrollTop += delta;
      }
 
      switch (new_target.nodeName.toLowerCase())
      {
        case 'node':
        case 'value':
        {
          firstChild = new_target.firstChild;
          range.setStart(firstChild, this.is_dom_type_tree ? 0 : 1);
          range.setEnd(firstChild,
                       firstChild.nodeValue.length - 
                       (this.is_dom_type_tree && !firstChild.nextSibling ? 0 : 1));
          selection.addRange(range);
          break;
        }
        case 'key':
        case 'text':
        {
          range.selectNodeContents(new_target);
          selection.addRange(range);
          break;
        }
        case 'input':
        {
          nav_target.focus();
          break;
        }
      }
    }
    return new_target;
  }

  this.keyhandler_onclick = function(event)
  {
    var target = event.target;
    var is_in_container = view_container && view_container.contains(target);
    if(is_in_container)
    {
      if(target != nav_target && /^input|node|key|value|text$/i.test(target.nodeName))
      {
        this.setSelected(target);
      }
    }
    return !is_in_container;
  }

  this.focus = function(event, container)
  {
    if (this.mode == MODE_DEFAULT)
      this.setContainer(event, container);
  }

  this.blur = function(event)
  {
    if (this.mode != MODE_DEFAULT && this.editor)
      this.editor.submit();
    if (selection)
      selection.removeAllRanges();
    view_container = null;
    view_container_first_child = null;
    nav_target = null;
    selection = null;
    range = null;
    document.removeEventListener('DOMNodeInserted', ondomnodeinserted, false);
  }

  this.onclick = function(event)
  {
    if (this.mode == MODE_DEFAULT)
      return this.keyhandler_onclick(event);
    return this.edit_onclick(event);
  }

  this.handle = function(action_id, event, target)
  {
    if (action_id in this._handlers)
      return this._handlers[action_id](event, target);
  }
  
  this.get_action_list = function()
  {
    var actions = [], key = '';
    for (key in this._handlers)
      actions.push(key);
    return actions;
  };

  this._handlers["expand-collapse-node"] = function(event, target)
  {
    this._expand_collapse_node(event, target, 'children');
  }.bind(this);

  this._handlers["expand-collapse-whole-node"] = function(event, target)
  {
    this._expand_collapse_node(event, target, 'subtree');
  }.bind(this);

  this._handlers["spotlight-node"] = function(event, target)
  {
    if(window.settings['dom'].get('highlight-on-hover'))
    {
      var obj_id = parseInt(target.getAttribute('ref-id') || 
                            target.getAttribute('obj-id')) ;
      window.hostspotlighter.soft_spotlight(obj_id);
    }
  }.bind(this);

  this._handlers["select-node"] = function(event, target)
  {
    var obj_id = parseInt(target.getAttribute('ref-id'));
    if (!window.settings.dom.get('dom-tree-style') && 
        /<\//.test(target.firstChild.textContent))
      while ((target = target.previousSibling) && 
              target.getAttribute('ref-id') != obj_id);
    if (target)
    {
      var model = this._select_node(target);
      if (model)
        topCell.statusbar.updateInfo(templates.breadcrumb(model, obj_id));
    }
  }.bind(this);
  
  this._handlers["inspect-node-link"] = function(event, target)
  {
    var obj_id = parseInt(target.getAttribute('obj-id'));
    var rt_id = parseInt(target.getAttribute('rt-id'));
    window.dom_data.get_dom(rt_id, obj_id, true, true);
    if (!window.views.dom.isvisible())
      window.topCell.showView('dom');
  }.bind(this);

  this._handlers["select-node-in-breadcrumb"] = function(event, target)
  {
    // assuming the breadcrumb is visible together with the dom view
    var obj_id = parseInt(target.getAttribute('obj-id'));
    var target = document.getElementById('target-element');
    if (target)
    {
      while (target && !/container/i.test(target.nodeName) && 
             (target = target.parentElement));
      if (target)
      {
        var divs = target.getElementsByTagName('div'), div = null, i = 0;
        for ( ; (div = divs[i]) && div.getAttribute('ref-id') != obj_id; i++);
        if (div)
          this._select_node(div);
      }
    }
  }.bind(this);
    
  this._handlers["export-markup"] = function(event, target)
  {
    window.export_data.data = 
      window.helpers.escapeTextHtml(this.serializer.serialize(window.dom_data));
    window.topCell.showView('export_data');
  }.bind(this);

  this._handlers["expand-whole-dom"] = function(event, target)
  {
    window.dom_data.get_snapshot();
  }

  this._handlers["dom-resource-link"] = function(event, target)
  {
    var 
    url = target.textContent, 
    rt_id = target.get_attr('parent-node-chain', 'rt-id');

    // TODO use the exec service to open new link when it's ready
    var url = helpers.resolveURLS(runtimes.getURI(rt_id), 
                                  url.slice(1, url.length - 1));
    window.open(url, "_blank");
  }.bind(this);

  this._handlers["nav-up"] = function(event, target)
  {
    // TODO if setting of nav target fails
    if ( !this.setSelected(nav_target.getPreviousWithFilter(view_container, 
                                                            nav_filters.up_down),
                           true))
    {
      view_container.scrollTop = 0;
    }
    return true;
  }.bind(this);

  this._handlers["nav-down"] = function(event, target)
  {
    // TODO if setting of nav target fails
    if(!this.setSelected(nav_target.getNextWithFilter(view_container, 
                                                      nav_filters.up_down),
                         true))
    {
      view_container.scrollTop = view_container.scrollHeight;
    }
    return true;
  }.bind(this);

  this._handlers["nav-left"] = function(event, target)
  {
    // TODO if setting of nav target fails
    this.setSelected(nav_target.getPreviousWithFilter(view_container, 
                                                      nav_filters.left_right),
                     true);
    return true;
  }.bind(this);

  this._handlers["nav-right"] = function(event, target)
  {
    
    // TODO if setting of nav target fails
    this.setSelected(nav_target.getNextWithFilter(view_container, 
                                                  nav_filters.left_right),
                     true);
    return true;
  }.bind(this);

  this._handlers["dispatch-click"] = function(event, target)
  {
    if(nav_target)
      nav_target.dispatchMouseEvent('click', event.ctrlKey, 
                                    event.altKey, event.shiftKey);
    return false;
  }.bind(this);

  this._handlers["dispatch-dbl-click"] = function(event, target)
  {
    if(nav_target)
      nav_target.dispatchMouseEvent('dblclick', event.ctrlKey, 
                                    event.altKey, event.shiftKey);
    return false;
  }.bind(this);

  this._handlers["edit-dom"] = function(event, target)
  {
    if (!_is_script_node(event.target))
    {
      switch(event.target.nodeName.toLowerCase())
      {
        case 'span':
        {
          if(/^(?:key|value|text|node)$/.test(event.target.parentElement.nodeName.toLowerCase()) )
          {
            event.target.parentElement.releaseEvent('dblclick');
          }
          break;
        }
        case 'key':
        case 'value':
        case 'text':
        {
          this.mode = MODE_EDIT_ATTR_TEXT;
          document.documentElement.addClass('modal');
          self.setSelected(event.target.parentNode);
          self.set_editor("dom-attr-text-editor");
          self.editor.edit(event, event.target);
          break;
        }
        case 'node':
        {
          var new_target = event.target;
          if(/^<\//.test(new_target.textContent))
          {
            new_target = event.target.getPreviousWithFilter
              (event.target.parentNode.parentNode, self.makeFilterGetStartTag(event.target));
            if( !new_target )
            {
              opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
                'failed getting start tag in this.editDOM in action_dom.js')
              return;
            }
          }
          this.mode = MODE_EDIT_MARKUP;
          document.documentElement.addClass('modal');
          self.setSelected(new_target.parentNode);
          self.set_editor("dom-markup-editor");
          self.editor.edit(event, new_target);
          break;
        }
      }
    }
  }.bind(this);

  this._handlers["submit-edit"] = function(event, target)
  {
    if (this.editor.type)
    {
      this.setSelected(this.editor.submit() || this.getFirstTarget() );
      this.mode = MODE_DEFAULT;
      document.documentElement.removeClass('modal');
      return false;
    }
    return true;
  }.bind(this);

  this._handlers["edit-next"] = function(event, target)
  {
    if( this.editor.type == "dom-attr-text-editor" )
    {
      if( !this.editor.nav_next(event) )
      {
        this.mode = MODE_DEFAULT;
        document.documentElement.removeClass('modal');
      }
      return false;
    }
    else
    {
      this.editor.nav_next(event);
    }
    return false;
  }.bind(this);

  this._handlers["edit-previous"] = function(event, target)
  {
    if( this.editor.type == "dom-attr-text-editor" )
    {
      if( !this.editor.nav_previous(event) )
      {
        this.mode = MODE_DEFAULT;
        document.documentElement.removeClass('modal');
      }
      return false;
    }
    else
    {
      return true
    }
  }.bind(this);

  this._handlers["exit-edit"] = function(event, target)
  {
    if( this.editor.type == "dom-attr-text-editor" )
    {
      this.setSelected(this.editor.cancel() || this.getFirstTarget() );
    }
    else
    {
      /*
        In case of markup editor the view will get re-created.
        Setting the navigation target will be handled 
        in the onViewCreated callback.
      */
      this.editor.cancel();
    }
    this.mode = MODE_DEFAULT;
    document.documentElement.removeClass('modal');
    return false;
  }.bind(this);

  this.edit_onclick = function(event)
  {
    if( this.editor )
    {
      if( this.editor.onclick(event) )
      {

      }
      else
      {
        this.mode = MODE_DEFAULT;
        //key_identifier.setModeDefault(self);
        document.documentElement.removeClass('modal');
      }
    }
    // make the edit mode modal
    return false;
  }

  this.makeFilterGetStartTag = function(start_node)
  {
    var start_tag = start_node.textContent.replace(/[\/>]/g, '');
    var margin_left = start_node.parentElement.style.marginLeft;
    return function(node)
    {
      return (
        node.nodeName.toLowerCase() == 'node' 
        && node.textContent.indexOf(start_tag) ==  0
        && node.parentElement.style.marginLeft == margin_left
        );
    }
  }

  ActionBroker.get_instance().register_handler(this);

};

window.eventHandlers.click['get-children'] = function(event, target)
{
  if (event.shiftKey)
    this.broker.dispatch_action("dom", "expand-collapse-whole-node", event, target);
  else
    this.broker.dispatch_action("dom", "expand-collapse-node", event, target);
}

window.eventHandlers.click['spotlight-node'] = function(event, target)
{
  this.broker.dispatch_action("dom", "select-node", event, target);
}

window.eventHandlers.click['breadcrumb-link'] = function(event, target)
{
  this.broker.dispatch_action("dom", "select-node-in-breadcrumb", event, target);
}

window.eventHandlers.mouseover['spotlight-node'] = function(event, target)
{
  this.broker.dispatch_action("dom", "spotlight-node", event, target);
}

window.eventHandlers.click['dom-inspection-export'] = function(event, target)
{
  this.broker.dispatch_action("dom", "export-markup", event, target);
};

window.eventHandlers.click['dom-inspection-snapshot'] = function(event, target)
{
  this.broker.dispatch_action("dom", "expand-whole-dom", event, target);
};

window.eventHandlers.click['dom-resource-link'] = function (event, target)
{
  this.broker.delay_action("click", "dom", "dom-resource-link", event, target);
};

window.eventHandlers.dblclick['edit-dom'] = function(event, target)
{
  this.broker.clear_delayed_actions("click");
  this.broker.dispatch_action("dom", "edit-dom", event, target);
}

window.eventHandlers.click['inspect-node-link'] = function(event, target)
{
  this.broker.dispatch_action("dom", "inspect-node-link", event, target);
}

window.eventHandlers.mouseover['inspect-node-link'] = function(event, target)
{
  this.broker.dispatch_action("dom", "spotlight-node", event, target);
}

window.eventHandlers.click['df-show-live-source'] = function(event, target)
{
  window.debug_helpers.liveSource.open();
};