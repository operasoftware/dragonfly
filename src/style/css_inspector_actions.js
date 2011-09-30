var cls = window.cls || ( window.cls = {} );
// this should go in a own file

/**
 * @constructor
 * @extends BaseActions
 */

cls.CSSInspectorActions = function(id)
{
  var self = this;

  this.__active_container = null;
  this.__target = null;
  const CSS_CLASS_CP_TARGET = window.cls.ColorPickerView.CSS_CLASS_TARGET;
  const INDEX_LIST = 1;
  const VALUE_LIST = 2;
  const PRIORITY_LIST = 3;
  const DISABLED_LIST = cls.ElementStyle.DISABLED_LIST;

  const PROPERTY = 0;

  this.editor = new Editor(this);

  this.getFirstTarget = function()
  {
    return self.__active_container &&
           self.__active_container.
           getElementsByTagName('styles')[0].
           getElementsByTagName('property')[0];
  };

  this.clearSelected = function()
  {
    if (self.__target)
    {
      self.__target.removeClass('selected');
    }
  };

  this.setSelected = function(new_target)
  {
    if (new_target)
    {
      if (self.__target)
      {
        self.__target.removeClass('selected');
      }
      if (!self.__active_container.contains(new_target))
      {
        // this is just a quick fix to make the keyboard navigation
        // work somewhat after a view update.
        // all keyboard navigation must be re-implemented 
        // in a much more generic way
        var 
        rule_id = new_target.getElementsByTagName('input')[0],
        inputs = self.__active_container.getElementsByTagName('input'),
        input = null,
        i = 0,
        attr_val = '';

        if (rule_id = rule_id && rule_id.getAttribute("data-rule-id"))
        {
          for (; input = inputs[i]; i++)
          {
             attr_val = input.getAttribute("data-rule-id");
             if (attr_val && attr_val == rule_id)
              break;
          }
        }
        if (input)
          new_target = input.parentNode;
      }
      (self.__target = new_target).addClass('selected');
    }
  };

  this.resetTarget = function(new_container)
  {
    if (self.__active_container && self.__target && !self.__active_container.parentNode)
    {
      var
      targets = self.__active_container.getElementsByTagName(self.__target.nodeName),
      target = null,
      i = 0;
      for ( ; (target = targets[i]) && target != self.__target; i++);
      if (target && (target = new_container.getElementsByTagName(self.__target.nodeName)[i]))
      {
        self.__active_container = new_container;
        self.setSelected(target);
      }
    }
  };

  var nav_filter =
  {
    _default: function(ele)
    {
      return ((ele.nodeName.toLowerCase() == 'property' && ele.parentElement.hasAttribute('rule-id'))
               || ele.nodeName.toLowerCase() == 'header'
               || ele.getAttribute('handler') == 'open-resource-tab');
    },

    header: function(ele)
    {
      return ele.nodeName.toLowerCase() == 'header';
    },

    property_editable: function(ele)
    {
      return ele.nodeName.toLowerCase() == 'property' && ele.parentElement.hasAttribute('rule-id');
    }
  };

  this.setContainer = function(event, container)
  {
    this.resetTarget(container);
    this.__active_container = container;
    if (!this.__target || !this.__target.parentElement)
    {
      this.__target = this.getFirstTarget()
    }
    if (this.__target && !this.__target.hasClass('selected'))
    {
      this.setSelected(this.__target);
    }
  };

  this.edit_onclick = function(event)
  {
    if (this.editor)
    {
      if (!this.editor.onclick(event))
        return false;
      this.mode = MODE_DEFAULT;
      window.elementStyle.update();
    }
    return true;
  }.bind(this);

  this.blur_edit_mode = function()
  {
    this.editor.escape();
    this.mode = MODE_DEFAULT;
    this.clearSelected();
  };

  /**
   * Sets a single property (and optionally removes another one, resulting in an overwrite).
   *
   * @param {Array} declaration An array according to [prop, value, is_important]
   * @param {String} prop_to_remove An optional property to remove
   * @param {Function} callback Callback to execute when the proeprty has been added
   */
  this.set_property = function(rt_id, rule_id, declaration, 
                               prop_to_remove, callback)
  {
    if (this.editor.context_edit_mode == this.editor.MODE_SVG)
    {
      this.set_property_svg(rt_id, rule_id, declaration, 
                            prop_to_remove, callback);
    }
    else
    {
      this.set_property_css(rt_id, rule_id, declaration, 
                            prop_to_remove, callback);
    }
  };

  /**
   * Sets a single CSS property (and optionally removes another one, resulting in an overwrite).
   *
   * @param {Array} declaration An array according to [prop, value, is_important]
   * @param {String} prop_to_remove An optional property to remove
   * @param {Function} callback Callback to execute when the proeprty has been added
   */
  this.set_property_css = function(rt_id, rule_id, declaration,
                                   prop_to_remove, callback)
  {
    var script = "";

    var prop = this.normalize_property(declaration[0]);

    // TEMP: workaround for CORE-31191: updating a property with !important is discarded
    var style_dec = window.elementStyle.get_style_dec_by_id(rule_id);
    if (style_dec) {
      for (var i = style_dec[1].length; i--; ) {
        if (window.css_index_map[style_dec[1][i]] == declaration[0])
        {
          script += "object.style.removeProperty(\"" + declaration[0] + "\");";
          break;
        }
      }
    }

    script += "object.style.setProperty(\"" +
                  prop + "\", \"" +
                  helpers.escape_input(declaration[1]) + "\", " +
                  (declaration[2] ? "\"important\"" : null) +
              ");";

    // If a property is added by overwriting another one, remove the other property
    if (prop_to_remove && prop != prop_to_remove)
    {
      script += "object.style.removeProperty(\"" + this.normalize_property(prop_to_remove) + "\");";
    }

    var tag = (typeof callback == "function") ? tagManager.set_callback(null, callback) : 1;
    services['ecmascript-debugger'].requestEval(tag,
      [rt_id, 0, 0, script, [["object", rule_id]]]);
  };

  /**
   * Sets a single SVG property (and optionally removes another one, resulting in an overwrite).
   *
   * @param {Array} declaration An array according to [prop, value, is_important]
   * @param {String} prop_to_remove An optional property to remove
   * @param {Function} callback Callback to execute when the proeprty has been added
   */
  this.set_property_svg = function(rt_id, rule_id, declaration,
                                   prop_to_remove, callback)
  {
    var prop = this.normalize_property(declaration[0]);

    var script = "object.setAttribute(\"" +
                  prop + "\", \"" +
                  declaration[1].replace(/"/g, "\\\"") + "\"" +
                 ");";

    // If a property is added by overwriting another one, remove the other property
    if (prop_to_remove && prop != prop_to_remove)
    {
      script += "object.removeAttribute(\"" + this.normalize_property(prop_to_remove) + "\");";
    }

    var tag = (typeof callback == "function") ? tagManager.set_callback(null, callback) : 1;
    services['ecmascript-debugger'].requestEval(tag,
      [rt_id, 0, 0, script, [["object", rule_id]]]);
  };

  /**
   * Removes a single property.
   *
   * @param {String} property The property to remove
   * @param {Function} callback Callback to execute when the property has been added
   */
  this.remove_property = function(rt_id, rule_id, property, callback)
  {
    if (this.editor.context_edit_mode == this.editor.MODE_SVG)
    {
      this.remove_property_svg(rt_id, rule_id, property, callback);
    }
    else
    {
      this.remove_property_css(rt_id, rule_id, property, callback);
    }
  };

  /**
   * Removes a single CSS property.
   *
   * @param {String} property The property to remove
   * @param {Function} callback Callback to execute when the property has been added
   */
  this.remove_property_css = function(rt_id, rule_id, property, callback)
  {
    property = this.normalize_property(property);
    var disabled_style_dec = window.elementStyle.disabled_style_dec_list[rule_id];
    if (disabled_style_dec)
    {
      window.elementStyle.remove_property(disabled_style_dec, property);
    }
    var script = "object.style.removeProperty(\"" + property + "\");";

    var tag = (typeof callback == "function") ? tagManager.set_callback(null, callback) : 1;
    services['ecmascript-debugger'].requestEval(tag,
      [rt_id, 0, 0, script, [["object", rule_id]]]);
  };

  /**
   * Removes a single SVG property.
   *
   * @param {String} property The property to remove
   * @param {Function} callback Callback to execute when the property has been added
   */
  this.remove_property_svg = function(rt_id, rule_id, property, callback)
  {
    property = this.normalize_property(property);
    var disabled_style_dec = window.elementStyle.disabled_style_dec_list[rule_id];
    if (disabled_style_dec)
    {
      window.elementStyle.remove_property(disabled_style_dec, property);
    }
    var script = "object.removeAttribute(\"" + property + "\");";

    var tag = (typeof callback == "function") ? tagManager.set_callback(null, callback) : 1;
    services['ecmascript-debugger'].requestEval(tag,
      [rt_id, 0, 0, script, [["object", rule_id]]]);
  };

  /**
   * Restores the currently edited property
   */
  this.restore_property = function()
  {
    if (this.editor.context_edit_mode == this.editor.MODE_SVG)
    {
      this.restore_property_svg();
    }
    else
    {
      this.restore_property_css();
    }
  };

  /**
   * Restores the currently edited CSS property
   */
  this.restore_property_css = function()
  {
    var rule = this.editor.saved_style_dec;
    var rule_id = this.editor.context_rule_id;
    var initial_property = this.editor.context_cur_prop;
    var new_property = this.editor.getProperties()[0];
    var script = "";

    var prop_enum = window.css_index_map.indexOf(new_property);
    // Check if it's a real property. If not, we don't have to set something back.
    if (prop_enum != -1)
    {
      var script = "object.style.removeProperty(\"" + new_property + "\");";
    }

    if (initial_property)
    {
      script += "object.style.setProperty(\"" +
                   initial_property + "\", \"" +
                   helpers.escape_input(this.editor.context_cur_value) + "\", " +
                   (this.editor.context_cur_priority ? "\"important\"" : null) +
                ");";
    }

    var index = rule[INDEX_LIST].indexOf(prop_enum);
    if (index != -1)
    {
      script += "object.style.setProperty(\"" +
                   new_property + "\", \"" +
                   helpers.escape_input(rule[VALUE_LIST][index]) + "\", " +
                   (rule[PRIORITY_LIST][index] ? "\"important\"" : null) +
                ");";
    }

    if (script)
    {
      services['ecmascript-debugger'].requestEval(null,
        [this.editor.context_rt_id, 0, 0, script, [["object", rule_id]]]);
    }
  };

  /**
   * Restores the currently edited SVG property
   */
  this.restore_property_svg = function()
  {
    var rule = this.editor.saved_style_dec;
    var rule_id = this.editor.context_rule_id;
    var initial_property = this.editor.context_cur_prop;
    var new_property = this.editor.getProperties()[PROPERTY];
    var script = "";

    var prop_enum = window.css_index_map.indexOf(new_property);
    // Check if it's a real property. If not, we don't have to set something back.
    if (prop_enum != -1)
    {
      var script = "object.removeAttribute(\"" + new_property + "\");";
    }

    if (initial_property)
    {
      script += "object.setAttribute(\"" +
                   initial_property + "\", \"" +
                   this.editor.context_cur_value.replace(/"/g, "'") + "\"" +
                ");";
    }

    var index = rule[INDEX_LIST].indexOf(prop_enum);
    if (index != -1)
    {
      script += "object.setAttribute(\"" +
                   new_property + "\", \"" +
                   rule[VALUE_LIST][index].replace(/"/g, "'") + "\"" +
                ");";
    }

    if (script)
    {
      services['ecmascript-debugger'].requestEval(null,
        [this.editor.context_rt_id, 0, 0, script, [["object", rule_id]]]);
    }
  };

  /**
   * Enables one property.
   *
   * @param {String} property The property to enable
   */
  this.enable_property = function enable_property(rt_id, rule_id, obj_id, property)
  {
    const INDEX_LIST = 1;
    const VALUE_LIST = 2;
    const PRIORITY_LIST = 3;

    var id = rule_id || window.elementStyle.get_inline_obj_id(obj_id);
    var disabled_style_dec = window.elementStyle.disabled_style_dec_list[id];
    var style_dec = window.elementStyle.remove_property(disabled_style_dec, property);
    this.set_property(rt_id, rule_id || obj_id, [window.css_index_map[style_dec[INDEX_LIST][0]],
                      style_dec[VALUE_LIST][0],
                      style_dec[PRIORITY_LIST][0]], null, window.elementStyle.update);
  };

  /**
   * Disables one property.
   *
   * @param {String} property The property to disable
   */
  this.disable_property = function disable_property(rt_id, rule_id, obj_id, property)
  {
    var id = rule_id || window.elementStyle.get_inline_obj_id(obj_id);
    var style_dec = rule_id
                  ? window.elementStyle.get_style_dec_by_id(rule_id)
                  : window.elementStyle.get_inline_style_dec_by_id(obj_id);
    var disabled_style_dec_list = window.elementStyle.disabled_style_dec_list;

    if (!disabled_style_dec_list[id])
    {
      disabled_style_dec_list[id] = window.elementStyle.get_new_style_dec();
    }

    this.remove_property(rt_id, rule_id || obj_id, property, window.elementStyle.update);
    window.elementStyle.copy_property(style_dec, disabled_style_dec_list[id], property);
    window.elementStyle.remove_property(style_dec, property);
  };

  /**
   * Disables all properties.
   */
  this.disable_all_properties = function disable_property(rt_id, rule_id, obj_id)
  {
    const INDEX_LIST = 1;

    var id = rule_id || window.elementStyle.get_inline_obj_id(obj_id);
    var style_dec = rule_id
                  ? window.elementStyle.get_style_dec_by_id(rule_id)
                  : window.elementStyle.get_inline_style_dec_by_id(obj_id);
    var disabled_style_dec_list = window.elementStyle.disabled_style_dec_list;

    if (!disabled_style_dec_list[id])
    {
      disabled_style_dec_list[id] = window.elementStyle.get_new_style_dec();
    }
    
    if (window.elementStyle.is_some_declaration_enabled(style_dec))
    {
      while (style_dec[INDEX_LIST].length)
      {
        var property = window.css_index_map[style_dec[INDEX_LIST][0]];
        window.elementStyle.copy_property(style_dec, 
                                          disabled_style_dec_list[id],
                                          property);
        window.elementStyle.remove_property(style_dec, property);
      }

      var tag = tagManager.set_callback(null, window.elementStyle.update);
      var msg = [rt_id, 0, 0, "object.style.cssText='';", [["object", rule_id]]];
      services['ecmascript-debugger'].requestEval(tag, msg);
    }
  };

  /**
   * Normalize a property by trimming whitespace and converting to lowercase.
   *
   * @param {String} prop The property to normalize
   * @returns {String} A normalized property
   */
  this.normalize_property = function normalize_property(prop)
  {
    return (prop || "").replace(/^\s*|\s*$/g, "").toLowerCase();
  };

  /* ActionHandler interface */

  const
  MODE_DEFAULT = "default",
  MODE_EDIT = "edit",
  MINUS = -1,
  PLUS = 1;

  this.id = id;
  this._broker = ActionBroker.get_instance();
  this._broker.register_handler(this);
  this._handlers = {};
  this.mode = MODE_DEFAULT;

  this.mode_labels =
  {
    "default": ui_strings.S_LABEL_KEYBOARDCONFIG_MODE_DEFAULT,
    "edit": ui_strings.S_LABEL_KEYBOARDCONFIG_MODE_EDIT,
  }

  this.get_action_list = function()
  {
    var actions = [], key = '';
    for (key in this._handlers)
      actions.push(key);
    return actions;
  };

  this._handlers['nav-up'] = function(event, target)
  {
    if (this.__target)
    {
      var filter = this.__target.nodeName.toLowerCase() == 'header' &&
                   this.__target.parentElement.getAttribute('handler') ?
                   nav_filter.header :
                   nav_filter._default;
      var next = this.__target.getPreviousWithFilter(this.__active_container,
                                                     filter);
      this.setSelected(next);
      return false;
    }
    else
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      'keyboard_handler: no target to move');
  }.bind(this);

  this._handlers["nav-down"] = function(event, target)
  {
    if (this.__target)
    {
      var filter = this.__target.nodeName.toLowerCase() == 'header' &&
                   !this.__target.parentElement.getAttribute('handler') ?
                   nav_filter.header :
                   nav_filter._default;
      var next = this.__target.getNextWithFilter(this.__active_container,
                                                filter);
      this.setSelected(next);
      return false;
    }
    else
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      'keyboard_handler: no target to move');
  }.bind(this);

  this._handlers["dispatch-dbl-click"] = function(event, target)
  {
    if(this.__target)
      this.__target.dispatchMouseEvent('dblclick');
    return false;
  }.bind(this);

  this._handlers['edit-css'] = function(event, target)
  {
    var cat = event.target;
    switch(event.target.nodeName.toLowerCase())
     {
      case 'key':
      case 'value':
      {
        if (event.target.parentElement.parentElement.hasAttribute('rule-id') &&
            !event.target.parentNode.hasClass(CSS_CLASS_CP_TARGET))
        {
          this.mode = MODE_EDIT;
          this.setSelected(event.target.parentNode);
          this.editor.edit(event, event.target.parentNode);
        }
        break;
      }
      case 'property':
      {
        if (event.target.parentElement.hasAttribute('rule-id') &&
            !event.target.hasClass(CSS_CLASS_CP_TARGET))
        {
          this.mode = MODE_EDIT;
          this.setSelected(event.target);
          this.editor.edit(event);
        }
        break;
      }
    }
  }.bind(this);

  this._handlers['enable-disable-property'] = function enable_disable_property(event, target)
  {
    var is_disabled = target.checked;
    var rule_id = parseInt(target.getAttribute("data-rule-id"));
    var rt_id = parseInt(target.get_attr("parent-node-chain", "rt-id"));
    var obj_id = parseInt(target.get_attr("parent-node-chain", "obj-id"));
    this.editor.context_edit_mode = event.target.get_attr("parent-node-chain", "rule-id") == "element-svg"
                                  ? this.editor.MODE_SVG
                                  : this.editor.MODE_CSS;

    if (is_disabled)
    {
      this.enable_property(rt_id, rule_id, obj_id, target.getAttribute("data-property"));
    }
    else
    {
      this.disable_property(rt_id, rule_id, obj_id, target.getAttribute("data-property"));
    }
  }.bind(this);

  this._handlers['css-toggle-category'] = function(event, target)
  {
    if (/header/i.test(target.nodeName))
    {
      target = target.firstChild;
    }
    var cat = target.getAttribute('cat-id'), value = target.hasClass('unfolded');
    var cat_container = target.parentNode.parentNode;
    if (value)
    {
      target.removeClass('unfolded');
      cat_container.removeClass('unfolded');
      var styles = cat_container.getElementsByTagName('styles')[0];
      if (styles)
      {
        styles.innerHTML = "";
      }
    }
    else
    {
      target.addClass('unfolded');
      cat_container.addClass('unfolded');
    }
    this.setSelected(target.parentNode);
    settings['css-inspector'].set(cat, !value);
    window.elementStyle.setUnfoldedCat(cat, !value);
  }.bind(this);

  this.target_enter = function(event, action_id)
  {
    if (this.__target)
    {
      this.__target.releaseEvent('click');
    }
  };

  this._handlers["edit-previous"] = function(event, target)
  {
    if (!this.editor.nav_previous(event, MINUS))
    {
      var new_target =
        this.__target.getPreviousWithFilter(this.__active_container,
                                            nav_filter.property_editable);
      if (new_target)
      {
        this.setSelected(new_target);
        this.editor.edit(null, this.__target);
        this.editor.focusLastToken();
      }
    }

    // to stop default action
    return false;
  }.bind(this);

  this._handlers["edit-next"] = function(event, target)
  {
    if (!this.editor.nav_next(event, PLUS))
    {
      var new_target =
        this.__target.getNextWithFilter(this.__active_container,
                                        nav_filter.property_editable);
      if (new_target)
      {
        this.setSelected(new_target);
        this.editor.edit(null, this.__target);
        this.editor.focusFirstToken();
      }
    }
    // to stop default action
    return false;
  }.bind(this);

  this._handlers["autocomplete-previous"] = function(event, target)
  {
    this.editor.autocomplete(event, MINUS);
    return false;
  }.bind(this);

  this._handlers["autocomplete-next"] = function(event, target)
  {
    this.editor.autocomplete(event, PLUS);
    return false;
  }.bind(this);

  this._handlers["exit-edit"] = function(event, action_id)
  {
    if (!this.editor.escape())
    {
      var cur_target = this.__target;
      this._handlers['nav-up']();
      cur_target.parentElement.removeChild(cur_target);
    }
    this.mode = MODE_DEFAULT;
    // this.editor.escape() will reset the style
    // to ensure the command to reset the style is dispatched before
    // elementStyle queries again the current style the update call
    // is done asynchronously 
    setTimeout(window.elementStyle.update_bound, 1);

    return false;
  }.bind(this);

  this._handlers["submit-edit-and-new-edit"] = function(event, target)
  {
    if (!this.editor.enter(event))
    {
      this.mode = MODE_DEFAULT;
      window.elementStyle.update();
      if (!this.__target.textContent)
      {
        var cur_target = this.__target;
        this._handlers['nav-up'](event, target);
        cur_target.parentElement.removeChild(cur_target);
      }
    }
    return false;
  }.bind(this);

  this._handlers["insert-declaration-edit"] = function(event, target)
  {
    this.mode = MODE_EDIT;
    this.editor.insert_declaration_edit(event, target);
  }.bind(this);

  this._handlers['remove-property'] = function(event, target)
  {
    var rule_id = parseInt(target.get_attr("parent-node-chain", "rule-id"));
    var rt_id = parseInt(target.get_attr("parent-node-chain", "rt-id"));
    var obj_id = parseInt(target.get_attr("parent-node-chain", "obj-id"));
    var ele = event.target;
    while (ele && ele.nodeName.toLowerCase() != "property")
    {
      ele = ele.parentNode;
    }
    var prop = ele.querySelector("key").textContent;

    this.remove_property(rt_id, rule_id, prop, window.elementStyle.update);
  }.bind(this);

  this._handlers["disable-all-properties"] = function(event, target)
  {
    var rt_id = parseInt(event.target.get_attr("parent-node-chain", "rt-id"));
    var rule_id = parseInt(event.target.get_attr("parent-node-chain", "rule-id"));
    var obj_id = parseInt(event.target.get_attr("parent-node-chain", "obj-id"));
    this.disable_all_properties(rt_id, rule_id, obj_id);
  }.bind(this);

  this.focus = function(event, container)
  {

    if (this.mode == MODE_DEFAULT)
      this.setContainer(event, container);
  }

  this.blur = function(event)
  {
    if (this.mode == MODE_DEFAULT)
      this.clearSelected();
    else
      this.blur_edit_mode();
  }

  this.onclick = function(event)
  {
    if (this.mode == MODE_EDIT)
    {
      // Whenever we are in edit mode, cancel any additional action
      // because edit-exit will cause an async update of the whole view
      // (meaning that actions of the contextmenu would e.g. refer 
      // to an already replaced view).
      // See e.g. DFL-2307.
      this.edit_onclick(event);
      return false;
    }
  };

  this.handle = function(action_id, event, target)
  {
    if (action_id in this._handlers)
      return this._handlers[action_id](event, target);
  }

  var onViewCreated = function(msg)
  {
    /*
    if(msg.id == "css-inspector" )
    {

      self.resetTarget();
    }
    */
  }
  messages.addListener('view-created', onViewCreated)
};

eventHandlers.dblclick['edit-css'] = function(event, target)
{
  this.broker.dispatch_action('css-inspector', 'edit-css', event, target);
}
eventHandlers.click['css-toggle-category'] = function(event, target)
{
  this.broker.dispatch_action('css-inspector', 'css-toggle-category',
                              event, target);
}
eventHandlers.click['enable-disable'] = function(event, target)
{
  this.broker.dispatch_action('css-inspector', 'enable-disable-property',
                              event, target);
}
