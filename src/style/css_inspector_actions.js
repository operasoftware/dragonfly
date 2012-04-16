window.cls || (window.cls = {});

/**
 * @constructor
 * @extends BaseActions
 */
cls.CSSInspectorActions = function(id)
{
  this.editor = new Editor(this);

  this._es_debugger = window.services['ecmascript-debugger'];
  this._tag_manager = cls.TagManager.get_instance();
  this._element_style = window.element_style;
  this._active_container = null;
  this._target = null;

  var CSS_CLASS_CP_TARGET = window.cls.ColorPickerView.CSS_CLASS_TARGET;
  var PROPERTY = 0;

  this.getFirstTarget = function()
  {
    return this._active_container &&
           this._active_container.querySelector('.css-declaration');
  };

  this._clear_selected = function()
  {
    if (this._target)
      this._target.removeClass('selected');
  };

  this.setSelected = function(new_target)
  {
    if (new_target)
    {
      if (this._target)
        this._target.removeClass('selected');

      if (!this._active_container.contains(new_target))
      {
        // this is just a quick fix to make the keyboard navigation
        // work somewhat after a view update.
        // all keyboard navigation must be re-implemented
        // in a much more generic way
        var rule_id = new_target.querySelector('input');
        if (rule_id = rule_id && rule_id.getAttribute("data-rule-id"))
        {
          var inputs = this._active_container.getElementsByTagName('input');
          for (var i = 0, input; input = inputs[i]; i++)
          {
             var attr_val = input.getAttribute("data-rule-id");
             if (attr_val && attr_val == rule_id)
               break;
          }
        }

        if (input)
          new_target = input.parentNode;
      }
      (this._target = new_target).addClass('selected');
    }
  };

  this.resetTarget = function(new_container)
  {
    if (this._active_container && this._target && !this._active_container.parentNode)
    {
      var targets = this._active_container.getElementsByTagName(this._target.nodeName);
      var target = null;
      var index = 0;
      for ( ; (target = targets[index]) && target != this._target; index++);
      if (target && (target = new_container.getElementsByTagName(this._target.nodeName)[index]))
      {
        this._active_container = new_container;
        this.setSelected(target);
      }
    }
  };

  this._nav_filters = {
    _default: function(ele)
    {
      return ((ele.hasClass('css-declaration') && ele.parentElement.hasAttribute('rule-id'))
               || ele.nodeName.toLowerCase() == 'header'
               || ele.getAttribute('handler') == 'open-resource-tab');
    },

    header: function(ele)
    {
      return ele.nodeName.toLowerCase() == 'header';
    },

    property_editable: function(ele)
    {
      return ele.hasClass('css-declaration') && ele.parentElement.hasAttribute('rule-id');
    }
  };

  this.setContainer = function(event, container)
  {
    this.resetTarget(container);
    this._active_container = container;
    if (!this._target || !this._target.parentElement)
      this._target = this.getFirstTarget()

    if (this._target && !this._target.hasClass('selected'))
      this.setSelected(this._target);
  };

  this.edit_onclick = function(event)
  {
    if (this.editor)
    {
      if (!this.editor.onclick(event))
        return false;
      this.mode = MODE_DEFAULT;
      this._element_style.update();
    }
    return true;
  }.bind(this);

  this.blur_edit_mode = function()
  {
    this.editor.escape();
    this.mode = MODE_DEFAULT;
    this._clear_selected();
  };

  /**
   * Sets a single property (and optionally removes another one, resulting in an overwrite).
   *
   * @param {Array} declaration An array according to [prop, value, is_important]
   * @param {String} prop_to_remove An optional property to remove
   * @param {Function} callback Callback to execute when the proeprty has been added
   */
  this.set_property = function(rt_id, rule_id, declaration, prop_to_remove, callback)
  {
    if (this.editor.context_edit_mode == this.editor.MODE_SVG)
      this.set_property_svg(rt_id, rule_id, declaration, prop_to_remove, callback);
    else
      this.set_property_css(rt_id, rule_id, declaration, prop_to_remove, callback);
  };

  /**
   * Sets a single CSS property (and optionally removes another one, resulting in an overwrite).
   *
   * @param {CssDeclaration} declaration A CssDeclaration
   * @param {String} prop_to_remove An optional property to remove
   * @param {Function} callback Callback to execute when the proeprty has been added
   */
  this.set_property_css = function(rt_id, rule_id, declaration, prop_to_remove, callback)
  {
    var prop = this.normalize_property(declaration.property);
    var script = "";

    // If a property is added by overwriting another one, remove the other property
    if (prop_to_remove)
      script = "object.style.removeProperty(\"" + this.normalize_property(prop_to_remove) + "\");";

    script += "object.style.setProperty(\"" +
                prop + "\", \"" +
                window.helpers.escape_input(declaration.value) + "\", " +
                (declaration.priority ? "\"important\"" : null) +
              ");";

    var tag = (typeof callback == "function")
            ? this._tag_manager.set_callback(null, callback)
            : cls.TagManager.IGNORE_RESPONSE;
    this._es_debugger.requestEval(tag, [rt_id, 0, 0, script, [["object", rule_id]]]);
  };

  /**
   * Sets a single SVG property (and optionally removes another one, resulting in an overwrite).
   *
   * @param {CssDeclaration} declaration An CssDeclaration
   * @param {String} prop_to_remove An optional property to remove
   * @param {Function} callback Callback to execute when the proeprty has been added
   */
  this.set_property_svg = function(rt_id, rule_id, declaration, prop_to_remove, callback)
  {
    var prop = this.normalize_property(declaration.property);
    var script = "";

    // If a property is added by overwriting another one, remove the other property
    if (prop_to_remove)
      script = "object.removeAttribute(\"" + this.normalize_property(prop_to_remove) + "\");";

    script += "object.setAttribute(\"" +
                prop + "\", \"" +
                window.helpers.escape_input(declaration.value) + "\"" +
              ");";

    var tag = (typeof callback == "function")
            ? this._tag_manager.set_callback(null, callback)
            : cls.TagManager.IGNORE_RESPONSE;
    this._es_debugger.requestEval(tag, [rt_id, 0, 0, script, [["object", rule_id]]]);
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
      this.remove_property_svg(rt_id, rule_id, property, callback);
    else
      this.remove_property_css(rt_id, rule_id, property, callback);
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
    var disabled_style_dec = this._element_style.disabled_style_dec_list[rule_id];
    if (disabled_style_dec)
      this._element_style.remove_property(disabled_style_dec.declarations, property);

    var script = "object.style.removeProperty(\"" + property + "\");";

    // HACK: workarounds for CORE-42812 and CORE-43566: border-radius and -o-transition
    // shorthands can't be removed with removeProperty().
    if (property == "border-radius")
    {
      script = "object.style.removeProperty(\"border-top-left-radius\");" +
               "object.style.removeProperty(\"border-top-right-radius\");" +
               "object.style.removeProperty(\"border-bottom-left-radius\");" +
               "object.style.removeProperty(\"border-bottom-right-radius\");";
    }
    else if (property == "-o-transition")
    {
      script = "object.style.removeProperty(\"-o-transition-delay\");" +
               "object.style.removeProperty(\"-o-transition-duration\");" +
               "object.style.removeProperty(\"-o-transition-property\");" +
               "object.style.removeProperty(\"-o-transition-timing-function\");";
    }

    var tag = (typeof callback == "function")
            ? this._tag_manager.set_callback(null, callback)
            : cls.TagManager.IGNORE_RESPONSE;
    this._es_debugger.requestEval(tag, [rt_id, 0, 0, script, [["object", rule_id]]]);
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
    var disabled_style_dec = this._element_style.disabled_style_dec_list[rule_id];
    if (disabled_style_dec)
      this._element_style.remove_property(disabled_style_dec.declarations, property);

    var script = "object.removeAttribute(\"" + property + "\");";

    var tag = (typeof callback == "function")
            ? this._tag_manager.set_callback(null, callback)
            : cls.TagManager.IGNORE_RESPONSE;
    this._es_debugger.requestEval(tag, [rt_id, 0, 0, script, [["object", rule_id]]]);
  };

  /**
   * Restores the currently edited property
   */
  this.restore_property = function()
  {
    if (this.editor.context_edit_mode == this.editor.MODE_SVG)
      this.restore_property_svg();
    else
      this.restore_property_css();
  };

  /**
   * Restores the currently edited CSS property
   */
  this.restore_property_css = function()
  {
    var rule_id = this.editor.context_rule_id;
    var new_property = this.editor.get_properties()[PROPERTY];
    var script = "object.style.removeProperty(\"" + new_property + "\");";

    // Set the property back to what it was before we started editing
    var initial_property = this.editor.context_cur_prop;
    var disabled_rule = this._element_style.disabled_style_dec_list[rule_id];
    var disabled_decl = disabled_rule && this._element_style.get_declaration(disabled_rule, initial_property);
    if (initial_property && !disabled_decl)
    {
      script += "object.style.setProperty(\"" +
                  initial_property + "\", \"" +
                  window.helpers.escape_input(this.editor.context_cur_value) + "\", " +
                  (this.editor.context_cur_priority ? "\"important\"" : null) +
                ");";
    }

    // If we overwrote some other property, set it back
    var rule = this._element_style.get_rule_by_id(rule_id);
    var decl = rule && this._element_style.get_declaration(rule, new_property);
    if (decl && !decl.is_disabled)
    {
      script += "object.style.setProperty(\"" +
                  new_property + "\", \"" +
                  window.helpers.escape_input(decl.value) + "\", " +
                  (decl.priority ? "\"important\"" : null) +
                ");";
    }

    if (script)
    {
      var tag = this._tag_manager.set_callback(null, this._element_style.update);
      this._es_debugger.requestEval(tag,
        [this.editor.context_rt_id, 0, 0, script, [["object", rule_id]]]);
    }
  };

  /**
   * Restores the currently edited SVG property
   */
  this.restore_property_svg = function()
  {
    var rule_id = this.editor.context_rule_id;
    var disabled_decls = this._element_style.disabled_style_dec_list[rule_id];
    var new_property = this.editor.get_properties()[PROPERTY];
    var script = "object.removeAttribute(\"" + new_property + "\");";

    var initial_property = this.editor.context_cur_prop;
    var disabled_rule = this._element_style.disabled_style_dec_list[rule_id];
    var disabled_decl = disabled_rule && this._element_style.get_declaration(disabled_rule, initial_property);
    if (initial_property && !disabled_decl)
    {
      script += "object.setAttribute(\"" +
                  initial_property + "\", \"" +
                  this.editor.context_cur_value.replace(/"/g, "'") + "\"" +
                ");";
    }

    // If we overwrote some other property, set it back
    var rule = this._element_style.get_rule_by_id(rule_id);
    var decl = rule && this._element_style.get_declaration(rule, new_property);
    if (decl && !decl.is_disabled)
    {
      script += "object.setAttribute(\"" +
                  new_property + "\", \"" +
                  window.helpers.escape_input(decl.value) + "\"" +
                ");";
    }

    if (script)
    {
      var tag = this._tag_manager.set_callback(null, this._element_style.update);
      this._es_debugger.requestEval(tag,
        [this.editor.context_rt_id, 0, 0, script, [["object", rule_id]]]);
    }
  };

  /**
   * Enables one property.
   *
   * @param {String} property The property to enable
   */
  this.enable_property = function(rt_id, rule_id, obj_id, property)
  {
    var id = rule_id || this._element_style.get_inline_obj_id(obj_id);
    var disabled_style_dec = this._element_style.disabled_style_dec_list[id];
    var style_dec = this._element_style.remove_property(disabled_style_dec.declarations, property);
    var declarations = style_dec.declarations;
    if (declarations)
      this.set_property(rt_id, rule_id || obj_id, declarations[0], null, this._element_style.update);
  };

  /**
   * Disables one property.
   *
   * @param {String} property The property to disable
   */
  this.disable_property = function(rt_id, rule_id, obj_id, property)
  {
    var id = rule_id || this._element_style.get_inline_obj_id(obj_id);
    var style_dec = rule_id
                  ? this._element_style.get_rule_by_id(rule_id)
                  : this._element_style.get_inline_style_dec_by_id(obj_id);
    var disabled_style_dec_list = this._element_style.disabled_style_dec_list;

    if (!disabled_style_dec_list[id])
      disabled_style_dec_list[id] = this._element_style.get_new_style_dec();

    this.remove_property(rt_id, rule_id || obj_id, property, this._element_style.update);
    this._element_style.copy_property(style_dec.declarations, disabled_style_dec_list[id].declarations, property);
    this._element_style.remove_property(style_dec.declarations, property);
  };

  /**
   * Disables all properties.
   */
  this.disable_all_properties = function(rt_id, rule_id, obj_id)
  {
    var id = rule_id || this._element_style.get_inline_obj_id(obj_id);
    var style_dec = rule_id
                  ? this._element_style.get_rule_by_id(rule_id)
                  : this._element_style.get_inline_style_dec_by_id(obj_id);
    var disabled_style_dec_list = this._element_style.disabled_style_dec_list;

    if (!disabled_style_dec_list[id])
      disabled_style_dec_list[id] = this._element_style.get_new_style_dec();

    if (this._element_style.is_some_declaration_enabled(style_dec))
    {
      while (style_dec.declarations.length)
      {
        var property = style_dec.declarations[0].property;
        this._element_style.copy_property(style_dec.declarations,
                                          disabled_style_dec_list[id].declarations,
                                          property);
        this._element_style.remove_property(style_dec.declarations, property);
      }

      var tag = this._tag_manager.set_callback(null, this._element_style.update);
      var msg = [rt_id, 0, 0, "object.style.cssText='';", [["object", rule_id]]];
      this._es_debugger.requestEval(tag, msg);
    }
  };

  /**
   * Normalize a property by trimming whitespace and converting to lowercase.
   *
   * @param {String} prop The property to normalize
   * @returns {String} A normalized property
   */
  this.normalize_property = function(prop)
  {
    return (prop || "").trim().toLowerCase();
  };

  /* ActionHandler interface */

  var MODE_DEFAULT = "default";
  var MODE_EDIT = "edit";
  var MODE_EDIT_CLASS = "edit-mode";
  var MINUS = -1;
  var PLUS = 1;

  this.id = id;
  this._broker = ActionBroker.get_instance();
  this._broker.register_handler(this);
  this._handlers = {};
  this._mode = MODE_DEFAULT;

  this.mode_labels =
  {
    "default": ui_strings.S_LABEL_KEYBOARDCONFIG_MODE_DEFAULT,
    "edit": ui_strings.S_LABEL_KEYBOARDCONFIG_MODE_EDIT,
  };

  this.__defineSetter__("mode", function(mode) {
    if (!this._active_container)
      return;

    if (mode === MODE_EDIT)
      this._active_container.addClass(MODE_EDIT_CLASS);
    else
      this._active_container.removeClass(MODE_EDIT_CLASS);

    this._mode = mode;
  });

  this.__defineGetter__("mode", function() {
    return this._mode;
  });

  this.get_action_list = function()
  {
    var actions = [];
    for (var key in this._handlers)
      actions.push(key);
    return actions;
  };

  this._handlers['nav-up'] = function(event, target)
  {
    if (this._target)
    {
      var filter = this._target.nodeName.toLowerCase() == 'header' &&
                   this._target.parentElement.getAttribute('handler')
                 ? this._nav_filters.header
                 : this._nav_filters._default;
      var next = this._target.getPreviousWithFilter(this._active_container,
                                                     filter);
      this.setSelected(next);
      return false;
    }
    else
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      'keyboard_handler: no target to move');
    }
  }.bind(this);

  this._handlers["nav-down"] = function(event, target)
  {
    if (this._target)
    {
      var filter = this._target.nodeName.toLowerCase() == 'header' &&
                   !this._target.parentElement.getAttribute('handler')
                 ? this._nav_filters.header
                 : this._nav_filters._default;
      var next = this._target.getNextWithFilter(this._active_container,
                                                filter);
      this.setSelected(next);
      return false;
    }
    else
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      'keyboard_handler: no target to move');
    }
  }.bind(this);

  this._handlers["dispatch-dbl-click"] = function(event, target)
  {
    if (this._target)
      this._target.dispatchMouseEvent('dblclick');
    return false;
  }.bind(this);

  this._handlers['edit-css'] = function(event, target)
  {
    window.views["color-selector"].ondestroy();
    var ele = event.target.get_ancestor(".css-property") ||
              event.target.get_ancestor(".css-property-value");
    if (ele)
    {
      if (ele.parentElement.parentElement.hasAttribute('rule-id') &&
          !ele.parentNode.hasClass(CSS_CLASS_CP_TARGET))
      {
        this.mode = MODE_EDIT;
        this.setSelected(ele.parentNode);
        this.editor.edit(event, ele.parentNode);
      }
    }
    else if (event.target.hasClass("css-declaration"))
    {
      if (event.target.parentElement.hasAttribute('rule-id') &&
          !event.target.hasClass(CSS_CLASS_CP_TARGET))
      {
        this.mode = MODE_EDIT;
        this.setSelected(event.target);
        this.editor.edit(event);
      }
    }
  }.bind(this);

  this._handlers['enable-disable-property'] = function(event, target)
  {
    var is_disabled = target.checked;
    var rt_id = parseInt(target.get_attr("parent-node-chain", "rt-id"));
    var rule_id = parseInt(target.get_attr("parent-node-chain", "rule-id")) || null;
    var obj_id = parseInt(target.get_attr("parent-node-chain", "obj-id")) || null;
    this.editor.context_edit_mode = event.target.get_attr("parent-node-chain", "rule-id") == "element-svg"
                                  ? this.editor.MODE_SVG
                                  : this.editor.MODE_CSS;
    if (is_disabled)
      this.enable_property(rt_id, rule_id, obj_id, target.getAttribute("data-property"));
    else
      this.disable_property(rt_id, rule_id, obj_id, target.getAttribute("data-property"));
  }.bind(this);

  this.target_enter = function(event, action_id)
  {
    if (this._target)
      this._target.releaseEvent('click');
  };

  this._handlers["edit-previous"] = function(event, target)
  {
    if (!this.editor.nav_previous(event, MINUS))
    {
      var new_target =
        this._target.getPreviousWithFilter(this._active_container,
                                           this._nav_filters.property_editable);
      if (new_target)
      {
        this.setSelected(new_target);
        this.editor.edit(null, this._target);
        this.editor.focus_last_token();
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
        this._target.getNextWithFilter(this._active_container,
                                       this._nav_filters.property_editable);
      if (new_target)
      {
        this.setSelected(new_target);
        this.editor.edit(null, this._target);
        this.editor.focus_first_token();
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
      var cur_target = this._target;
      this._handlers['nav-up']();
      cur_target.parentElement.removeChild(cur_target);
    }
    this.mode = MODE_DEFAULT;

    return false;
  }.bind(this);

  this._handlers["submit-edit-and-new-edit"] = function(event, target)
  {
    if (!this.editor.enter(event))
    {
      this.mode = MODE_DEFAULT;
      this._element_style.update();
      if (!this._target.textContent)
      {
        var cur_target = this._target;
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
    var declaration = event.target.get_ancestor(".css-declaration");
    var prop_ele = declaration && declaration.querySelector(".css-property")
    var prop = prop_ele && prop_ele.textContent;
    if (prop)
    {
      this.remove_property(rt_id, rule_id, prop, this._element_style.update);
    }
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
  };

  this.blur = function(event)
  {
    if (this.mode == MODE_DEFAULT)
      this._clear_selected();
    else
      this.blur_edit_mode();
  };

  this.onclick = function(event)
  {
    if (this.mode == MODE_EDIT)
    {
      // Whenever we are in edit mode, cancel any additional action
      // because edit-exit will cause an async update of the whole view
      // (meaning that actions of the contextmenu would e.g. refer
      // to an already replaced view).
      // See e.g. DFL-2307.
      if (this.edit_onclick(event))
        event.stopPropagation();
      return false;
    }
  };

  this.handle = function(action_id, event, target)
  {
    if (action_id in this._handlers)
      return this._handlers[action_id](event, target);
  }
};

eventHandlers.dblclick['edit-css'] = function(event, target)
{
  this.broker.dispatch_action('css-inspector', 'edit-css', event, target);
}

eventHandlers.click['enable-disable'] = function(event, target)
{
  this.broker.dispatch_action('css-inspector', 'enable-disable-property',
                              event, target);
}

