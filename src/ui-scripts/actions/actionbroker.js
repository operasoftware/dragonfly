

var ActionBroker = function()
{
  /*  
      static constants
        ActionBroker.MODE_DEFAULT = "default";

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
    * To get a list of (key_id, action_id) tuples.
    */
  this.get_keyboard_bindings = function(view_id, mode){};

  /**
    * To set a list of (key_id, action_id) tuples.
    */
  this.set_keyboard_bindings = function(view_id, mode){};

  this.get_shortcuts = function(){};
  this.set_shortcuts = function(shortcuts, handler_id){};

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
  
  this.delay_action = function(type, handler_id, action_id, event, target){};

  this.clear_delayed_actions = function(type){};
  
  
  this.get_actions_with_handler_id = function(handler_id){};

  this.get_label_with_handler_id_and_mode = function(hnadler_id, mode){};

  this.get_global_handler = function(){};

  /* constants */

  const GLOBAL_HANDLER = ActionBroker.GLOBAL_HANDLER_ID;

  /* privat */

  this._handlers = {};
  this._action_context = null;
  this._action_context_id = '';
  this._container = null;
  this._shortcuts = null;
  this._gloabal_shortcuts = null;
  this._current_shortcuts = null;

  this._mode_labels = {};
  this._mode_labels[ActionBroker.MODE_DEFAULT] = "Default";


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
      this._container = container || document.documentElement;
      this._action_context.focus(event, container);
    }
  }

  this._init = function()
  {
    this._key_identifier = new KeyIdentifier(this.dispatch_key_input.bind(this));
    this._global_handler = new GlobalActionHandler(GLOBAL_HANDLER);
    this.register_handler(this._global_handler);
    window.app.addListener('services-created', function()
    {
      this.set_shortcuts(window.settings.general.get("shortcuts") ||
                         window.ini.default_shortcuts.windows);
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
    return this._shortcuts;
  }

  this.set_shortcuts = function(shortcuts, handler_id, clear_setting)
  {
    shortcuts = JSON.parse(JSON.stringify(shortcuts));
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
    var temp = this._mode_labels[mode];
    if (temp)
      return temp;
    temp = this._handlers[handler_id];
    return temp && temp.mode_labels[mode] || '';
  };

  this.get_global_handler = function()
  {
    return this._global_handler;
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
ActionBroker.MODE_DEFAULT = "default";
