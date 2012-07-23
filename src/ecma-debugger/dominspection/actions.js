var cls = window.cls || ( window.cls = {} );
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
  MODE_DEFAULT = "default",
  MODE_EDIT_ATTR_TEXT = "edit-attributes-and-text",
  MODE_EDIT_MARKUP = "edit-markup";

  this.mode_labels =
  {
    "default": ui_strings.S_LABEL_KEYBOARDCONFIG_MODE_DEFAULT,
    "edit-attributes-and-text": ui_strings.S_LABEL_KEYBOARDCONFIG_MODE_EDIT_ATTR_AND_TEXT,
    "edit-markup": ui_strings.S_LABEL_KEYBOARDCONFIG_MODE_EDIT_MARKUP
  }

  var self = this;
  var view_container = null;
  var view_container_first_child = null;
  var nav_target = null;
  var selection = null;
  var range = null;

  var broker = ActionBroker.get_instance();

  this.serializer = new cls.DOMSerializer();

  this._handlers = {};
  this._mode = MODE_DEFAULT;
  this.__defineSetter__("mode", function(mode)
  {
    this._mode = mode;
    messages.post("dom-editor-active", {"editor_active": mode != MODE_DEFAULT});
  });
  this.__defineGetter__("mode", function()
  {
    return this._mode;
  });

  // traversal 'subtree' or 'children'
  this._expand_collapse_node = function(event, target, traversal, force_expand)
  {
    var container = event.target.parentNode;
    var next_node = container.nextElementSibling;
    var level = parseInt(container.style.marginLeft) || 0;
    var level_next = next_node && parseInt(next_node.style.marginLeft) || 0;
    var ref_id = parseInt(container.getAttribute('ref-id'));
    if (container = container.has_attr("parent-node-chain", "data-model-id"))
    {
      var no_contextmenu =
        event.target.get_attr('parent-node-chain', 'data-menu') != 'dom-element';
      var model = window.dominspections[container.getAttribute('data-model-id')];
      var target = document.getElementById('target-element');
      var is_editable = container.hasAttribute('edit-handler');
      var cb = null;
      var target_id = 0;

      if (!model.isprocessing)
      {
        if (container.contains(target))
          target_id = parseInt(target.getAttribute('ref-id'));
        if (!force_expand && (level_next > level ||
                              event.target.parentNode.querySelector("text")))
        {
          model.collapse(ref_id);
          this._get_children_callback(container, model, target_id,
                                      is_editable, no_contextmenu);
        }
        else
        {
          if (force_expand)
          {
            model.collapse(ref_id);
          }
          cb = this._get_children_callback.bind(this, container, model,
                                                target_id, is_editable,
                                                no_contextmenu);
          model.expand(cb, ref_id, traversal);
        }
      }
    }
  }

  this._get_children_callback = function(container, model, target_id,
                                         is_editable, no_contextmenu)
  {
    var tmpl = window.templates.inspected_dom_node(model, target_id,
                                                   is_editable, no_contextmenu);
    container.re_render(tmpl);
    window.messages.post('dom-view-updated', {model: model});
  }

  this._select_node = function(target, skip_breadcrumbs_update)
  {
    var
    obj_id = parseInt(target.getAttribute('ref-id')),
    model_id = target.get_attr("parent-node-chain", "data-model-id"),
    pseudo_element = target.getAttribute('data-pseudo-element'),
    inspections = window.dominspections,
    model = null,
    scroll_into_view = false,
    current_target_id = 0,
    breadcrumbhead = 0;

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
      breadcrumbhead = model.breadcrumbhead || model.target;
      model.target = obj_id;
      inspections.active = model;
      window.messages.post("element-selected", {model: model,
                                                obj_id: obj_id,
                                                rt_id: model.getDataRuntimeId(),
                                                pseudo_element: pseudo_element});
      if (document.getElementById('target-element'))
        document.getElementById('target-element').removeAttribute('id');
      target.id = 'target-element';
      if (skip_breadcrumbs_update)
      {
        model.breadcrumbhead = breadcrumbhead;
      }
      else
      {
        model.breadcrumbhead = model.target;
        if (!this._modebar)
        {
          this._modebar = UI.get_instance().get_modebar('dom');
        }
        if (this._modebar)
        {
          // If target is a text node, use the parent element node's id as
          // obj_id for the breadcrumbs
          if (target.nodeName.toLowerCase() == "text")
          {
            obj_id = target.parentNode.get_attr("parent-node-chain", "ref-id");
          }
          this._modebar.set_content(model.id,
                                    window.templates.breadcrumb(model, obj_id),
                                    true);
        }
      }
    }
    return model;
  };

  // TODO check still needed?
  /*
  this.breadcrumb_link = function(event, target)
  {
    var
    obj_id = parseInt(target.getAttribute('ref-id')),
    model_id = target.get_attr("parent-node-chain", "data-model-id"),
    inspections = window.dominspections,
    model = null;

    target.parentNode.querySelector(".active").removeClass("active");
    target.addClass("active");

    if (model_id && obj_id)
    {
      model = inspections[model_id];
      model.target = obj_id;
      inspections.active = model;
      window.messages.post("element-selected", {model: model, obj_id: obj_id, rt_id: model.getDataRuntimeId()});
      var target = document.getElementById('target-element');
      if (target)
      {
        target.removeAttribute('id');
        while (target && !/container/i.test(target.nodeName) && (target = target.parentElement));
        if (target)
        {
          var divs = target.getElementsByTagName('div'), div = null, i = 0;
          for ( ; (div = divs[i]) && div.getAttribute('ref-id') != obj_id; i++);
          if (div)
          {
            div.id = 'target-element';
            window.helpers.scroll_dom_target_into_view();
            if (window.settings.dom.get('highlight-on-hover'))
              hostspotlighter.spotlight(obj_id, true);
          }
        }
      }
    }
  }
  */

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
        return target.parentNode.hasClass('non-editable');
      }
      case 'node':
      {
        return (target.firstChild && /^<?\/?script/i.test(target.firstChild.nodeValue));
      }
      default:
      {
        return false;
      }
    }
  }

  var _is_pseudo_element = function(target)
  {
    return target.hasClass("pseudo-element");
  };

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
    return view_container &&
           (document.getElementById('target-element') || view_container).
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
    }
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
    if (container.firstElementChild)
    {
      this.is_dom_type_tree = container.firstElementChild
                              .firstElementChild.hasClass('tree-style');
      if (event.type == 'click' || event.type == 'contextmenu')
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
  }

  this.setSelected = function(new_target, scroll_into_view)
  {
    var raw_delta = 0,
        delta = 0;
    if(new_target)
    {
      if(nav_target)
      {
        nav_target.blur();
      }
      if (selection)
      {
        selection.removeAllRanges();
      }
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
        {
          var first_child = new_target.firstChild;
          var start_offset = 0;
          var end_offset = first_child.nodeValue.length;

          if (!this.is_dom_type_tree)
          {
            start_offset += 1;
            end_offset -= 1;
          }
          else if (first_child.nextSibling) // If it has attributes
          {
            end_offset -= 1;
          }

          if (first_child.nodeValue[1] == "/") // If it's an end-tag
          {
            start_offset += 1;
          }

          if (first_child.nodeValue.slice(-2, -1) == "/") // If it's an empty element tag
          {
            end_offset -= 1;
          }

          range.setStart(first_child, start_offset);
          range.setEnd(first_child, end_offset);
          selection.addRange(range);
          break;
        }
        case 'value':
        {
          firstChild = new_target.firstChild;
          range.setStart(firstChild, 1);
          range.setEnd(firstChild, firstChild.nodeValue.length - 1);
          selection.addRange(range);
          break;
        }
        case 'value':
        {
          firstChild = new_target.firstChild;
          range.setStart(firstChild, 1);
          range.setEnd(firstChild, firstChild.nodeValue.length - 1);
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
    // don't cancel the event
    return true;
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

  this._handlers["expand-node"] = function(event, target)
  {
    this._expand_collapse_node(event, target, 'subtree', true);
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
        target.firstChild && /<\//.test(target.firstChild.textContent))
      while ((target = target.previousSibling) &&
              (target.getAttribute('ref-id') != obj_id ||
              target.hasAttribute('data-pseudo-element')))
        ;
    if (target)
    {
      var model = this._select_node(target);
      /* TODO
      if (model)
        topCell.statusbar.updateInfo(templates.breadcrumb(model, obj_id));
      */
    }
  }.bind(this);

  this._handlers["inspect-node-link"] = function(event, target)
  {
    var obj_id = parseInt(target.getAttribute('obj-id'));
    var rt_id = parseInt(target.getAttribute('rt-id')) ||
                parseInt(target.get_attr('parent-node-chain', 'rt-id'));
    if (obj_id && rt_id)
    {
      window.dom_data.get_dom(rt_id, obj_id, true, true);
      if (!window.views.dom.isvisible())
        window.topCell.showView('dom');
    }
  }.bind(this);

  this._handlers["select-node-in-breadcrumb"] = function(event, target)
  {
    event.target.parentNode.querySelector(".active").removeClass("active");
    event.target.addClass("active");

    // assuming the breadcrumb is visible together with the dom view
    var obj_id = parseInt(target.getAttribute('ref-id'));
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
          this._select_node(div, true);
      }
      window.helpers.scroll_dom_target_into_view();
    }
  }.bind(this);

  this._handlers["export-markup"] = function(event, target)
  {
    var data = this.serializer.serialize(window.dom_data);
    window.open("data:text/plain;charset=utf-8," + encodeURIComponent(data));
  }.bind(this);

  this._handlers["expand-whole-dom"] = function(event, target)
  {
    window.dom_data.get_snapshot();
  }

  this._handlers["dom-resource-link"] = function(event, target)
  {
    var rt_id = target.get_attr("parent-node-chain", "rt-id");
    var rt = window.runtimes.getURI(rt_id);
    var url = target.textContent.slice(1, -1);
    var abs_url = window.helpers.resolveURLS(rt, url);
    window.open(abs_url, "_blank");
  }.bind(this);

  this._handlers["nav-up"] = function(event, target)
  {
    if (view_container)
    {
      var new_target = nav_target &&
                       nav_target.getPreviousWithFilter(view_container,
                                                        nav_filters.up_down) ||
                       !nav_target && this.getFirstTarget();
      if (!this.setSelected(new_target, true))
      {
        view_container.scrollTop = 0;
      }
    }
    return true;
  }.bind(this);

  this._handlers["nav-down"] = function(event, target)
  {
    if (view_container)
    {
      var new_target = nav_target &&
                       nav_target.getNextWithFilter(view_container,
                                                    nav_filters.up_down) ||
                       !nav_target && this.getFirstTarget();
      if (!this.setSelected(new_target, true))
      {
        view_container.scrollTop = view_container.scrollHeight;
      }
    }
    return true;
  }.bind(this);

  this._handlers["nav-left"] = function(event, target)
  {
    if (view_container)
    {
      var new_target = nav_target &&
                       nav_target.getPreviousWithFilter(view_container,
                                                        nav_filters.left_right) ||
                       !nav_target && this.getFirstTarget();
      this.setSelected(new_target, true);
    }
    return true;
  }.bind(this);

  this._handlers["nav-right"] = function(event, target)
  {
    if (view_container)
    {
      var new_target = nav_target &&
                       nav_target.getNextWithFilter(view_container,
                                                    nav_filters.left_right) ||
                       !nav_target && this.getFirstTarget();
      this.setSelected(new_target, true);
    }
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
    if (!_is_script_node(target) && !_is_pseudo_element(target) &&
        document.documentElement.contains(target))
    {
      switch(target.nodeName.toLowerCase())
      {
        case 'span':
        {
          if(/^(?:key|value|text|node)$/.test(target.parentElement.nodeName.toLowerCase()) )
          {
            target.parentElement.releaseEvent('dblclick');
          }
          break;
        }
        case 'key':
        case 'value':
        case 'text':
        {
          this.mode = MODE_EDIT_ATTR_TEXT;
          document.documentElement.addClass('modal');
          self.setSelected(target.parentNode);
          self.set_editor("dom-attr-text-editor");
          self.editor.edit(event, target);
          break;
        }
        case 'node':
        {
          var new_target = target;
          if(/^<\//.test(new_target.textContent))
          {
            new_target = target.getPreviousWithFilter
              (target.parentNode.parentNode, self.makeFilterGetStartTag(target));
            if( !new_target )
            {
              opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
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
    if ((this.mode == MODE_EDIT_ATTR_TEXT &&
         this.editor.type == this.editors["dom-attr-text-editor"].type) ||
        (this.mode == MODE_EDIT_MARKUP &&
         this.editor.type == this.editors["dom-markup-editor"].type))
    {
      this.setSelected(this.editor.submit() || this.getFirstTarget() );
      this.mode = MODE_DEFAULT;
      document.documentElement.removeClass('modal');
      return false;
    }
    return true;
  }.bind(this);

  this._handlers["insert-attribute-edit"] = function(event, target)
  {
    if (!_is_script_node(target))
    {
      var target = event.target;
      if (target.nodeName.toLowerCase() != "node")
      {
        target = target.parentNode;
      }
      event.preventDefault();
      event.stopPropagation();
      this.mode = MODE_EDIT_ATTR_TEXT;
      document.documentElement.addClass('modal');
      self.setSelected(target);
      self.set_editor("dom-attr-text-editor");
      self.editor.edit(event, target);

      var container = target.has_attr("parent-node-chain", "ui-id");
      var start_tag = container.querySelector("[ref-id='" + target.get_attr("parent-node-chain", "ref-id") + "'] node");
      this.editor.insert_attribute_edit(start_tag);
    }
  }.bind(this);

  this._handlers["enable-ecmascript-debugger"] = function(event, target)
  {
    window.services.scope.enable_profile(window.app.profiles.DEFAULT);
  }.bind(this);

  this._remove_from_dom = function(event, target, script)
  {
    var ele = event.target.has_attr("parent-node-chain", "ref-id");
    if (ele)
    {
      var rt_id = parseInt(ele.get_attr("parent-node-chain", "rt-id"));
      var ref_id = parseInt(ele.get_attr("parent-node-chain", "ref-id"));
      var tag = 0;
      if (!settings.dom.get("update-on-dom-node-inserted"))
      {
        var cb = window.dom_data.remove_node.bind(window.dom_data, rt_id, ref_id);
        tag = tag_manager.set_callback(null, cb);
      }
      services['ecmascript-debugger'].requestEval(tag, [rt_id, 0, 0, script, [["el", ref_id]]]);
    }
  }.bind(this);

  this._handlers["remove-attribute"] = function(event, target)
  {
    this._remove_from_dom(event, target, "el.removeAttribute(\"" + target.textContent + "\")");
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

  this._handlers["remove-node"] = function(event, target)
  {
    var ele = event.target.has_attr("parent-node-chain", "ref-id");
    if (ele && !ele.hasAttribute("data-pseudo-element"))
    {
      var rt_id = parseInt(ele.get_attr("parent-node-chain", "rt-id"));
      var ref_id = parseInt(ele.get_attr("parent-node-chain", "ref-id"));
      var tag = 0;
      if (!settings.dom.get("update-on-dom-node-inserted"))
      {
        var cb = window.dom_data.remove_node.bind(window.dom_data, rt_id, ref_id);
        tag = tag_manager.set_callback(null, cb);
      }
      services['ecmascript-debugger'].requestEval(tag, [rt_id, 0, 0, "el.parentNode.removeChild(el)", [["el", ref_id]]]);
    }
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

window.event_handlers.click['get-children'] = function(event, target)
{
  if (event.shiftKey)
    this.broker.dispatch_action("dom", "expand-collapse-whole-node", event, target);
  else
    this.broker.dispatch_action("dom", "expand-collapse-node", event, target);
}

window.event_handlers.click['spotlight-node'] = function(event, target)
{
  this.broker.dispatch_action("dom", "select-node", event, target);
}

window.event_handlers.click['breadcrumb-link'] = function(event, target)
{
  this.broker.dispatch_action("dom", "select-node-in-breadcrumb", event, target);
}

window.event_handlers.mouseup['breadcrumb-link'] = function(event, target)
{
  var selection = window.getSelection();
  if (!selection.isCollapsed)
  {
    selection.removeAllRanges();
  }
}

window.event_handlers.mouseover['breadcrumb-link'] =
window.event_handlers.mouseover['spotlight-node'] = function(event, target)
{
  this.broker.dispatch_action("dom", "spotlight-node", event, target);
}

window.event_handlers.click['dom-inspection-export'] = function(event, target)
{
  this.broker.dispatch_action("dom", "export-markup", event, target);
};

window.event_handlers.click['dom-inspection-snapshot'] = function(event, target)
{
  this.broker.dispatch_action("dom", "expand-whole-dom", event, target);
};

window.event_handlers.click['dom-resource-link'] = function(event, target)
{
  this.broker.delay_action("click", "dom", "dom-resource-link", event, target);
};

window.event_handlers.dblclick['edit-dom'] = function(event, target)
{
  this.broker.clear_delayed_actions("click");
  this.broker.dispatch_action("dom", "edit-dom", event, event.target);
}

window.event_handlers.click['inspect-node-link'] = function(event, target)
{
  this.broker.dispatch_action("dom", "inspect-node-link", event, target);
}

window.event_handlers.mouseover['inspect-node-link'] = function(event, target)
{
  this.broker.dispatch_action("dom", "spotlight-node", event, target);
}

window.event_handlers.click['df-show-live-source'] = function(event, target)
{
  window.debug_helpers.liveSource.open();
};

window.event_handlers.click['enable-ecmascript-debugger'] = function(event, target)
{
  this.broker.dispatch_action("dom", "enable-ecmascript-debugger", event, target);
};
