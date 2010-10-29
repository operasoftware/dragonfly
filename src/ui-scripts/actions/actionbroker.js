var ActionBroker = function()
{
  
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
  this.dispatch_key_input = function(key_id, event, target){};

  /* privat */

  this._handlers = {};
  this._action_context = null;
  this._action_context_id = '';
  this._container = null;
  this._short_cuts = null;
  this._gloabal_short_cuts = null;
  this._current_short_cuts = null;
  this._mode = "default";

  this._set_action_context_bound = (function(event)
  {
    if (!(this._action_context && this._action_context.onclick(event) === false))
    {
      var container = event.target;
      while (container && container.nodeType == 1 && 
             !/^(?:top-)?(?:container|toolbar|tabs)$/i.test(container.nodeName))
        container = container.parentNode;

      switch (container && container.nodeName.toLowerCase() || '')
      {
        case 'container':
        {
          var ui_obj = UIBase.getUIById(container.getAttribute('ui-id'));
          if (ui_obj && ui_obj.view_id != this._action_context_id)
          {
            this._clear_current_handler();
            this._set_current_handler(ui_obj.view_id);
            this._action_context.focus(event, container);
            this._container = container;
          }
          break;
        }
        // TODO set according key handler, e.g. toolbar, tab
        default:
        {
          this._clear_current_handler();
        }
      }
    }
  }).bind(this);

  this._set_current_handler = function(handler_id)
  {
    this._action_context = this._handlers[handler_id] || this._empty_handler;
    this._action_context_id = this._action_context.id;
    this._current_short_cuts = this._current_short[this._action_context_id] || {};
  }

  this._clear_current_handler = function()
  {
    if (this._action_context)
      this._action_context.blur();
    if (this._container && this._container.hasClass('edit-mode'))
      this._container.removeClass('edit-mode');
    this._container = null;
    this._set_current_handler(this._empty_handler.id);
  };

  /* implementation */

  this.register_handler = function(action_handler)
  {
    if (!(action_handler && action_handler.id))
      throw 'missing id on action_handler in ActionBroker.instance.register_handler';
    this._action_handlers[action_handler.id] = action_handler;
  }

  this.dispatch_action = function(action_handler_id, action_id, event, target)
  {
    this._action_handlers[action_handler_id].handle_action(action_id, event, target);
  }

  this.dispatch_key_input = function(key_id, event, target)
  {
    
  }

  this._init = function()
  {
    this._empty_handler = new function()
    {
      this.id = '';
      this.handle_action = function(action_id, event, target){};
      this.get_action_list = function(){return []};
      this.focus = function(container){};
      this.blur = function(){};
      this.click = function(event, target){};
    }
    this._set_current_handler(this._empty_handler.id);
    this._short_cuts = ActionBroker.default_shortcuts;
    this._gloabal_short_cuts = this._short_cuts.global;
    document.addEventListener('click', this._set_action_context_bound, true);
  }

  this._init();

}

ActionBroker.default_shortcuts =
{
  "global":
  {
    "default":
    {
      "CTRL_A": "select-all",
    },
    "edit":
    {

    }
  },
  "dom":
  {
    "default":
    {
      "UP": "nav-up",
      "DOWN": "nav-down",
      "LEFT": "nav-left",
      "RIGHT": "nav-right",
      "ENTER": "target-enter",
      "CTRL_ENTER": "target-ctrl-enter",
    },
    "edit":
    {
      "SHIFT_TAB": "nav-previous-edit-mode",
      "TAB": "nav-next-edit-mode",
      "ENTER": "enter-edit-mode",
      "CTRL_ENTER": "ctrl-enter-edit-mode",
      "ESCAPE": "escape-edit-mode",
    }
  }
};










