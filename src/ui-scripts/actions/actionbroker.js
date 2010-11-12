

var ActionBroker = function()
{
  /*  
      static constants
        ActionBroker.MODE_DEFAULT = "default";
        ActionBroker.MODE_EDIT

      static properties
        ActionBroker.default_shortcuts_win

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
    * To set the mode either to 'default' or 'edit'.
    * The purpose is to have keyboard short depending on the mode.
    * The mode can only be set by the current context.
    */
  this.set_mode = function(action_handler, mode){};  // "default" or "edit"

  /**
    * To get a list of (key_id, action_id) tuples.
    */
  this.get_keyboard_bindings = function(view_id, mode){};

  /**
    * To set a list of (key_id, action_id) tuples.
    */
  this.set_keyboard_bindings = function(view_id, mode){};

  this.get_shortcuts = function(){};

  /**
    * To get a list of action implementer ids.
    */
  this.get_handlers = function(){};

  /**
    * To bind UI inputs, e.g. click or right click menu, to actions
    */
  this.dispatch_action = function(view_id, action_id, event, target){};

  /**
    * To handle key input. The implementation must map the key id
    * to an action id according to the current context and mode.
    */
  this.dispatch_key_input = function(key_id, event){};

  /* constants */

  const
  GLOBAL_HANDLER = "global",
  MODE_DEFAULT = ActionBroker.MODE_DEFAULT,
  MODE_EDIT = ActionBroker.MODE_EDIT;

  /* privat */

  this._handlers = {};
  this._action_context = null;
  this._action_context_id = '';
  this._container = null;
  this._shortcuts = null;
  this._gloabal_shortcuts = null;
  this._current_shortcuts = null;
  this._mode = MODE_DEFAULT;


  this._set_action_context_bound = (function(event)
  {
    if (!(this._action_context && this._action_context.onclick(event) === false))
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
      this._mode = MODE_DEFAULT;
      this._container = container || document.documentElement;
      this._action_context.focus(event, container);
    }
  }

  this._init = function()
  {
    this._shortcuts = ActionBroker.default_shortcuts_win;
    this._gloabal_shortcuts = this._shortcuts.global;
    this._key_identifier = new KeyIdentifier(this.dispatch_key_input.bind(this));
    this._key_identifier.set_shortcuts(this.get_shortcuts());
    this._global_handler = new GlobalActionHandler(GLOBAL_HANDLER);
    this.register_handler(this._global_handler);
    this._set_current_handler(this._global_handler);
    document.addEventListener('click', this._set_action_context_bound, true);
  }

  /* implementation */

  this.register_handler = function(action_handler)
  {
    if (!(action_handler && action_handler.id))
      throw 'missing id on action_handler in ActionBroker.instance.register_handler';
    this._handlers[action_handler.id] = action_handler;
  }

  this.set_mode = function(action_handler, mode)
  {
    if (action_handler == this._action_context && mode != this._mode)
      this._mode = mode;
  };

  this.dispatch_action = function(action_handler_id, action_id, event, target)
  {
    this._handlers[action_handler_id].handle(action_id, event, target);
  }

  this.dispatch_key_input = function(key_id, event)
  {
    var shortcuts = this._current_shortcuts[this._mode];
    var action = shortcuts && shortcuts[key_id] || '';
    var propagate_event = true;
    if (action)
      propagate_event = this._action_context.handle(action,
                                                    event,
                                                    this._container);
    if (!(propagate_event === false) &&
         this._action_context != this._global_handler)
    {
      shortcuts = this._gloabal_shortcuts[this._mode];
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
    };
  }

  this._delays = {}; 

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
    var ret = [], name = '', handler = null, key = '';
    for (name in this._shortcuts)
    {
      handler = this._shortcuts[name];
      for (key in handler["default"])
      {
        if (ret.indexOf(key) == -1)
          ret.push(key);
      }
      for (key in handler["edit"])
      {
        if (ret.indexOf(key) == -1)
          ret.push(key);
      }
    }
    return ret;
  }

  this._init();

}

ActionBroker.default_shortcuts_win =
{
  "global":
  {
    "default":
    {
      "ctrl a": "select-all",
      "ctrl i": "invert-spotlight-colors",
      "f8": "continue-run",
      "f10": "continue-step-next-line",
      "f11": "continue-step-into-call",
      "shift f11": "continue-step-out-of-call"
    },
    "edit":
    {
      "f8": "continue-run",
      "f10": "continue-step-next-line",
      "f11": "continue-step-into-call",
      "shift f11": "continue-step-out-of-call"
    }
  },
  "dom":
  {
    "default":
    {
      "up": "nav-up",
      "down": "nav-down",
      "left": "nav-left",
      "right": "nav-right",
      "enter": "dispatch-click",
      "ctrl enter": "dispatch-dbl-click",
    },
    "edit":
    {
      "shift tab": "edit-previous",
      "tab": "edit-next",
      "enter": "submit-edit-or-new-line",
      "ctrl enter": "ctrl-enter-edit-mode",
      "escape": "exit-edit",
    }
  },
  "css-inspector":
  {
    "default":
    {
      "up": "nav-up",
      "down": "nav-down",
      "left": "nav-up",
      "right": "nav-down",
      "ctrl enter": "dispatch-dbl-click",
    },
    "edit":
    {
      "up": "autocomplete-previous",
      "down": "autocomplete-next",
      "shift tab": "edit-previous",
      "tab": "edit-next",
      "enter": "submit-edit-and-new-edit",
      "escape": "exit-edit",
    }
  },
};

ActionBroker.get_instance = function()
{
  return this.instance || new ActionBroker();
}

ActionBroker.MODE_DEFAULT = "default";
ActionBroker.MODE_EDIT = "edit";
