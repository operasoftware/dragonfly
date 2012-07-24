

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

  /**
    * To get a shortcut for a given handler and action.
    * @param {String} handler_id
    * @param {String} action
    */
  this.get_shortcut_with_handler_and_action = function(handler_id, action){};

  this.get_action_container = function(){};

  this.get_current_handler_id = function(){};

  this.focus_handler = function(handler_id, event){};

  /**
    * To get the label for shared shortcuts.
    * @param {String} shared_shortcuts
    */
  this.get_shared_shortcuts_label = function(shared_shortcuts){};

  /* constants */

  const GLOBAL_HANDLER = ActionBroker.GLOBAL_HANDLER_ID;
  const MAX_CONTEXT_QUEUE_LENGTH = 10;

  /* private */

  this._handlers = {};
  this._inherited_handlers = {};
  this._action_context = null;
  this._action_context_id = '';
  this._container = null;
  this._shortcuts = null;
  this._global_shortcuts = null;
  this._current_shortcuts = null;
  this._current_shared_shortcuts = null;
  this._global_handler = new GlobalActionHandler(GLOBAL_HANDLER);
  this._delays = {};
  this._modal_click_handler_setter = null;
  this._modal_click_handler = null;
  this._shared_shortcuts_labels = {};

  this._set_action_context_bound = (function(event)
  {
    if (this._contextmenu.is_visible && event.type == 'click')
    {
      this._contextmenu.modal_click_handler(event);
      return true;
    }
    if (event.target == this._last_event_target)
    {
      return;
    }
    if (!(this._action_context && this._action_context.onclick(event) === false))
    {
      var container = event.target;
      while (container && container.nodeType == 1 &&
             container.parentNode &&
             container.parentNode.nodeType == 1 &&
             !/^(?:top-|panel-|window-)?(?:container|toolbar|tabs)$/i.test(container.nodeName))
        container = container.parentNode;

      switch (container && container.nodeName.toLowerCase() || '')
      {
        case 'container':
        case 'panel-container':
        case 'window-container':
        {
          var ui_obj = UIBase.getUIById(container.getAttribute('ui-id'));
          if (ui_obj)
          {
            this._set_current_handler(ui_obj.view_id, event, container);
          }
          break;
        }
        // TODO set according key handler, e.g. toolbar, tab
        default:
        {
          this._set_current_handler(GLOBAL_HANDLER, event, container);
        }
      }
      return true;
    }
    // pass the event alsways to the global handler
    // so that the global mode is correct
    this._global_handler.onclick(event);
    return false;
  }).bind(this);

  this._set_current_handler = function(handler_id, event, container)
  {
    if (handler_id != this._action_context_id)
    {
      if (this._action_context)
        this._action_context.blur();
      this._action_context = this._handlers[handler_id] || this._global_handler;
      this._action_context_id = this._action_context.id;
      this._current_shortcuts = this._shortcuts[this._action_context_id] || {};
      this._current_shared_shortcuts = this._shortcuts[this._action_context.shared_shortcuts] || {};
      this._container = container || document.documentElement;
      this._action_context.focus(event, container);
      this._context_queue.push(handler_id);
      while (this._context_queue.length &&
             this._context_queue.length > MAX_CONTEXT_QUEUE_LENGTH)
      {
        this._context_queue.shift();
      }
    }
  }

  this._oncontextmenubound = function(event)
  {
    if (this._set_action_context_bound(event) !== false)
      this._contextmenu.oncontextmenu(event);
    if (!event.shiftKey)
      event.preventDefault();
  }.bind(this);

  this._onhideviewbound = function(msg)
  {
    var handler_id = msg.id;
    var view = null;
    if (handler_id == this._action_context_id)
    {
      while (this._context_queue.length)
      {
        handler_id = this._context_queue.pop();
        view = window.views[handler_id];
        if (view && view.isvisible())
        {
          // Workaround to reset the focus to the a given view.
          // Needs a proper design.
          // Also used in js source view.
          var container = view.get_container();
          if (container)
            container.dispatchMouseEvent('click');

          return;
        }
      }
      this._set_current_handler(this._global_handler.id);
    }
  }.bind(this);

  this._init = function()
  {
    this._key_identifier = new KeyIdentifier(this.dispatch_key_input.bind(this),
                                             window.ini.browser);
    this.register_handler(this._global_handler);
    this._contextmenu = ContextMenu.get_instance();
    window.app.addListener('services-created', function()
    {
      this._context_queue = [];
      this._shortcuts = this._retrieve_shortcuts();
      this._global_shortcuts = this._shortcuts.global;
      this._key_identifier.set_shortcuts(this._get_shortcut_keys());
      this._set_current_handler(this._global_handler.id);
      document.addEventListener("contextmenu", this._oncontextmenubound, false);
      document.addEventListener('click', this._set_action_context_bound, true);
      document.addEventListener('focus', this._set_action_context_bound, true);
      window.messages.addListener('hide-view', this._onhideviewbound);
      window.messages.post('shortcuts-changed');
    }.bind(this));
  };

  /* handling of the shortcuts map */

  this._retrieve_shortcuts = function()
  {
    var stored_shortcuts = window.settings.general.get("shortcuts");
    var default_shortcuts = window.helpers.copy_object(window.ini.default_shortcuts);
    if (stored_shortcuts)
    {
      var shortcuts_hash = window.settings.general.get("shortcuts-hash");
      if (this._hash_shortcuts(default_shortcuts) != shortcuts_hash)
      {
        try
        {
          stored_shortcuts = this._sync_shortcuts(default_shortcuts, stored_shortcuts);
          this._store_shortcuts(stored_shortcuts);
        }
        catch(e)
        {
          stored_shortcuts = null;
          window.settings.general.set("shortcuts", null);
          window.settings.general.set("shortcuts-hash", "");
          (new AlertDialog(ui_strings.D_SHORTCUTS_UPDATE_FAILED)).show();
        }
      }
    }
    return stored_shortcuts || default_shortcuts;
  };

  this._store_shortcuts = function(shortcuts)
  {
    var hash = shortcuts && this._hash_shortcuts(window.ini.default_shortcuts) || "";
    window.settings.general.set("shortcuts", shortcuts);
    window.settings.general.set("shortcuts-hash", hash);
  };

  this._sync_shortcuts = function(source, target)
  {
    for (var prop in source)
    {
      if (typeof source[prop] == 'object')
      {
        if (!target.hasOwnProperty(prop))
        {
          target[prop] = {};
        }
        this._sync_shortcuts(source[prop], target[prop]);
      }
      else
      {
        if (!target.hasOwnProperty(prop))
        {
          target[prop] = source[prop];
        }
      }
    }
    return target;
  };

  this._hash_shortcuts = function(shortcuts)
  {
    return JSON.stringify(shortcuts).replace(/["{},:\- ]/g, '');
  };

  /* implementation */

  this.register_handler = function(action_handler)
  {
    if (!(action_handler && action_handler.id))
      throw 'missing id on action_handler in ActionBroker.instance.register_handler';
    this._handlers[action_handler.id] = action_handler;
    if (action_handler.shared_shortcuts)
    {
      this._inherited_handlers[action_handler.shared_shortcuts] = action_handler;
      if (action_handler.shared_shortcuts_label)
      {
        this._shared_shortcuts_labels[action_handler.shared_shortcuts] =
          action_handler.shared_shortcuts_label;
      }
    }
  }

  this.dispatch_action = function(action_handler_id, action_id, event, target)
  {
    this._handlers[action_handler_id].handle(action_id, event, target);
  }

  this.dispatch_key_input = function(key_id, event)
  {
    if (this._action_context.check_mode)
      this._action_context.check_mode(event);

    var shortcuts = this._current_shortcuts[this._action_context.mode] || {};
    var shared_shortcuts = this._current_shared_shortcuts[this._action_context.mode] || {};
    var action = shortcuts[key_id] || shared_shortcuts[key_id] || '';
    var propagate_event = true;
    if (action)
    {
      propagate_event = this._action_context.handle(action,
                                                    event,
                                                    this._container);
    }

    if (!(propagate_event === false) &&
         this._action_context != this._global_handler)
    {
      // to ensure that the global action handler uses the correct mode
      // even if it's not the current action handler
      this._global_handler.check_mode(event);
      shortcuts = this._global_shortcuts[this._global_handler.mode];
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
    this._global_shortcuts = this._shortcuts.global;
    this._store_shortcuts(clear_setting == true ? null : this._shortcuts);
    this._key_identifier.set_shortcuts(this._get_shortcut_keys());
    window.messages.post('shortcuts-changed');
  };

  this.get_actions_with_handler_id = function(handler_id)
  {

    return (
      (this._handlers[handler_id] && this._handlers[handler_id].get_action_list().sort()) ||
      (this._inherited_handlers[handler_id] && this._inherited_handlers[handler_id].get_action_list().sort())
    );
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
    return (this._handlers[handler_id] && this._handlers[handler_id].mode_labels[mode]) ||
           (this._inherited_handlers[handler_id] && this._inherited_handlers[handler_id].mode_labels[mode]);
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

  this.get_shortcut_with_handler_and_action = function(handler_id, action)
  {
    var
    shortcuts = this._shortcuts && this._shortcuts[handler_id],
    shortcuts_mode = null,
    mode = '',
    key = '';

    if (shortcuts)
      for (mode in shortcuts)
      {
        shortcuts_mode = shortcuts[mode];
        for (key in shortcuts_mode)
          if (shortcuts_mode[key] == action)
            return key;
      }
    return '';
  };

  this.get_action_container = function()
  {
    return this._container;
  }

  this.get_current_handler_id = function()
  {
    return this._action_context_id;
  };

  this.focus_handler = function(handler_id, event)
  {
    var view = window.views[handler_id];
    if (view && view.isvisible() && this._handlers[handler_id])
    {
      this._last_event_target = event.target;
      this._set_current_handler(handler_id, event, view.get_container());
    }
  };

  this.get_shared_shortcuts_label = function(shared_shortcuts)
  {
    return this._shared_shortcuts_labels[shared_shortcuts] || "";
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
