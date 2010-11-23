

var ActionBroker = function()
{
  /*
    static constants
      ActionBroker.GLOBAL_HANDLER_ID = "global";

    static methods
      ActionBroker.get_instance
  */

  if (ActionBroker.instance)
    return ActionBroker.instance;

  ActionBroker.instance = this;

  /* interface */

  /**
    * To register an instance of class which implements
    * the ActionHandler interface.
    */
  this.register_handler = function(action_handler){};

  /**
    * To get a copy of the current shortcut map.
    */
  this.get_shortcuts = function(){};

  /**
    * To set a new shortcut map.
    * @param {Object} shortcuts
    * @param {String} handler_id
    * @param {Boolean} clear_setting. To reste to defaults
    */
  this.set_shortcuts = function(shortcuts, handler_id, clear_setting){};

  /**
    * To get a list of action handler ids.
    */
  this.get_handlers = function(){};

  /**
    * To propagate UI inputs, e.g. click or right click menu, as actions.
    */
  this.dispatch_action = function(view_id, action_id, event, target){};

  /**
    * To propagate key input as a shortcut action.
    */
  this.dispatch_key_input = function(key_id, event){};

  /**
    * To delay an action propagation,
    * e.g if a click could be followed by a double click.
    * @param {String} type, the event type
    * @param {String} handler_id
    * @param {String} action_id
    * @param {Event} event
    * @param {Element} target
    */
  this.delay_action = function(type, handler_id, action_id, event, target){};

  /**
    * To cancel delayed actions.
    * e.g. if a dbl click has followed a click.
    * @param {String} type, the event type
    */
  this.clear_delayed_actions = function(type){};

  /**
    * To get a list of all actions of a given action handler.
    * @param {String} handler_id
    */
  this.get_actions_with_handler_id = function(handler_id){};

  /**
    * To the label for a given mode.
    * @param {String} handler_id
    * @param {String} mode
    */
  this.get_label_with_handler_id_and_mode = function(handler_id, mode){};

  /**
    * To the global action handler.
    * Any action, which was not cancelled by the focused action handler,
    * gets passed to the global action handler.
    */
  this.get_global_handler = function(){};

  /** 
    * To subscribe to the click handler. 
    * @param {Object} setter. So far the setter must be an instance of ContextMenu
    * @param {Function} handler. The callback for the click event.
    */
  this.set_setter_click_handler = function(setter, handler){};

  /** 
    * To unsubscribe to the click handler. 
    * @param {Object} setter. Only the setter of the click handler can unsubscribe.
    */
  this.clear_setter_click_handler = function(setter){};

  /* constants */

  const GLOBAL_HANDLER = ActionBroker.GLOBAL_HANDLER_ID;

  /* private */

  this._handlers = {};
  this._action_context = null;
  this._action_context_id = '';
  this._container = null;
  this._shortcuts = null;
  this._gloabal_shortcuts = null;
  this._current_shortcuts = null;
  this._global_handler = new GlobalActionHandler(GLOBAL_HANDLER);
  this._delays = {};
  this._modal_click_handler_setter = null;
  this._modal_click_handler = null;

  this._set_action_context_bound = (function(event)
  {
    if (this._modal_click_handler)
    {
      this._modal_click_handler(event);
    }
    else if (!(this._action_context && this._action_context.onclick(event) === false))
    {
      var container = event.target;
      while (container && container.nodeType == 1 &&
             container.parentNode.nodeType == 1 &&
             !/^(?:top-)?(?:container|toolbar|tabs)$/i.test(container.nodeName))
        container = container.parentNode;

      switch (container && container.nodeName.toLowerCase() || '')
      {
        case 'container':
        {
          var ui_obj = UIBase.getUIById(container.getAttribute('ui-id'));
          if (ui_obj)
            this._set_current_handler(ui_obj.view_id, event, container);
          break;
        }
        // TODO set according key handler, e.g. toolbar, tab
        default:
        {
          this._set_current_handler(GLOBAL_HANDLER, event, container);
        }
      }
    }
  }).bind(this);

  this._set_current_handler = function(handler_id, event, container)
  {
    if (handler_id != this._action_context_id)
    {
      if (this._action_context)
        this._action_context.blur();
      if (this._container && this._container.hasClass('edit-mode'))
        this._container.removeClass('edit-mode');
      this._action_context = this._handlers[handler_id] || this._global_handler;
      this._action_context_id = this._action_context.id;
      this._current_shortcuts = this._shortcuts[this._action_context_id] || {};
      this._container = container || document.documentElement;
      this._action_context.focus(event, container);
    }
  }

  this._init = function()
  {
    this._key_identifier = new KeyIdentifier(this.dispatch_key_input.bind(this),
                                             window.ini.browser);
    this.register_handler(this._global_handler);
    window.app.addListener('services-created', function()
    {
      this._shortcuts = window.settings.general.get("shortcuts") ||
                        window.ini.default_shortcuts.windows;
      this._key_identifier.set_shortcuts(this._get_shortcut_keys());
      this._gloabal_shortcuts = this._shortcuts.global;                                
      this._set_current_handler(this._global_handler);
    }.bind(this));
    document.addEventListener('click', this._set_action_context_bound, true);
  };

  /* implementation */

  this.register_handler = function(action_handler)
  {
    if (!(action_handler && action_handler.id))
      throw 'missing id on action_handler in ActionBroker.instance.register_handler';
    this._handlers[action_handler.id] = action_handler;
  }

  this.dispatch_action = function(action_handler_id, action_id, event, target)
  {
    this._handlers[action_handler_id].handle(action_id, event, target);
  }

  this.dispatch_key_input = function(key_id, event)
  {
    var shortcuts = this._current_shortcuts[this._action_context.mode];
    var action = shortcuts && shortcuts[key_id] || '';
    var propagate_event = true;
    if (action)
      propagate_event = this._action_context.handle(action,
                                                    event,
                                                    this._container);
    if (!(propagate_event === false) &&
         this._action_context != this._global_handler)
    {
      shortcuts = this._gloabal_shortcuts[this._gloabal_shortcuts.mode];
      action = shortcuts && shortcuts[key_id] || '';
      if (action)
        propagate_event = this._global_handler.handle(action,
                                                      event,
                                                      this._container);
    }
    if (propagate_event === false)
    {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  this.delay_action = function(type, handler_id, action_id, event, target)
  {
    if (!this._delays.hasOwnProperty(type))
    {
      this._delays[type] = new Timeouts();
    }
    var cb = this.dispatch_action.bind(this, handler_id, action_id, event, target);
    this._delays[type].set(cb, 300);
  }

  this.clear_delayed_actions = function(type)
  {
    if (this._delays[type])
      this._delays[type].clear();
  }

  this.get_shortcuts = function()
  {
    return window.helpers.copy_object(this._shortcuts);
  }

  this.set_shortcuts = function(shortcuts, handler_id, clear_setting)
  {
    shortcuts = window.helpers.copy_object(shortcuts);
    if (handler_id)
      this._shortcuts[handler_id] = shortcuts;
    else
      this._shortcuts = shortcuts;
    this._gloabal_shortcuts = this._shortcuts.global;
    window.settings.general.set("shortcuts",
                                clear_setting == true ? null : this._shortcuts);
    this._key_identifier.set_shortcuts(this._get_shortcut_keys());
  };

  this.get_actions_with_handler_id = function(handler_id)
  {
    return (
    this._handlers[handler_id] && this._handlers[handler_id].get_action_list());
  };

  this._get_shortcut_keys = function()
  {
    var ret = [], name = '', handler = null, mode = '', key = '';
    for (name in this._shortcuts)
    {
      handler = this._shortcuts[name];
      for (mode in handler)
      {
        for (key in handler[mode])
        {
          if (ret.indexOf(key) == -1)
            ret.push(key);
        }
      }
    }
    return ret;
  };

  this.get_label_with_handler_id_and_mode = function(handler_id, mode)
  {
    return this._handlers[handler_id].mode_labels[mode];
  };

  this.get_global_handler = function()
  {
    return this._global_handler;
  };

  this.set_setter_click_handler = function(setter, handler)
  {
    if (setter instanceof ContextMenu)
    {
      this._modal_click_handler_setter = setter;
      this._modal_click_handler = handler;
    }
  };

  this.clear_setter_click_handler = function(setter)
  {
    if (setter == this._modal_click_handler_setter)
    {
      this._modal_click_handler_setter = null;
      this._modal_click_handler = null;
    }
  };

  if (document.readyState == "complete")
    this._init();
  else
    document.addEventListener('DOMContentLoaded', this._init.bind(this), false);

}

ActionBroker.get_instance = function()
{
  return this.instance || new ActionBroker();
}

ActionBroker.GLOBAL_HANDLER_ID = "global";
