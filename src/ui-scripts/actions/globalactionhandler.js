var GlobalActionHandler = function(id)
{
  /* interface */
  /**
    * A view id to identify an action handler.
    */
  this.id = id;

  /**
    * To handle a single action.
    * Returning false (as in === false) will cancel the event
    * (preventDefault and stopPropagation),
    * true will pass it to the next level if any.
    * @param {String} action_id
    * @param {Event} event
    * @param {Element} target
    */
  this.handle = function(action_id, event, target){};

  /**
    * To get a list of supported actions.
    */
  this.get_action_list = function(){};

  /**
    * Gets called if an action handler changes to be the current context.
    */
  this.focus = function(container){};

  /**
    * Gets called if an action handle stops to be the current context.
    */
  this.blur = function(){};

  /**
    * Gets called if an action handler is the current context.
    * Returning false (as in === false) will cancel the event
    * (preventDefault and stopPropagation),
    * true will pass it to the next level if any.
    */
  this.onclick = function(event){};

  /**
    * To register a shortcut listener with a unique id token
    * on a global input element. Global as not being part of a view pane, e.g.
    * an input in a toolbar.
    * @param {String} listener_id. A unique token.
    * @param {Function} callback
    * @param {Array} action_list. A list of action supported by
    * that listener, optional.
    */
  this.register_shortcut_listener = function(listener_id, callback, action_list){};

  /* constants */

  const
  MODE_DEFAULT = "default",
  MODE_EDIT = "edit";

  this.mode = MODE_DEFAULT;

  this.mode_labels =
  {
    "default": ui_strings.S_LABEL_KEYBOARDCONFIG_MODE_DEFAULT,
    "edit": ui_strings.S_LABEL_KEYBOARDCONFIG_MODE_EDIT,
  }

  /* privat */


  this._broker = ActionBroker.get_instance();
  this._handlers = {};
  this._listener_handlers = [];

  this._sc_listeners = {};

  this.get_action_list = function()
  {
    var actions = [], key = '';
    for (key in this._handlers)
      actions.push(key);
    return actions.concat(this._listener_handlers);
  };

  this._clear_stopped_views = function()
  {
    window.views.js_source.clearLinePointer();
    window.views.callstack.clearView();
    window.views.inspection.clearView();
  }

  this._handlers['continue-run'] =
  function(action_id, event, target)
  {
    this._clear_stopped_views();
    window.stop_at.__continue('run');
    return false;
  }.bind(this);

  this._handlers['continue-step-next-line'] =
  function(action_id, event, target)
  {
    this._clear_stopped_views();
    window.stop_at.__continue('step-next-line');
    return false;
  }.bind(this);

  this._handlers['continue-step-out-of-call'] =
  function(action_id, event, target)
  {
    this._clear_stopped_views();
    window.stop_at.__continue('step-out-of-call');
    return false;
  }.bind(this);

  this._handlers['continue-step-into-call'] =
  function(action_id, event, target)
  {
    this._clear_stopped_views();
    window.stop_at.__continue('step-into-call');
    return false;
  }.bind(this);

  this._handlers["select-all"] = function(action_id, event, target)
  {
    var selection = getSelection();
    var range = document.createRange();
    selection.removeAllRanges()
    range.selectNodeContents(target);
    selection.addRange(range);
    return false;
  };

  this._handlers["invert-spotlight-colors"] = function(action_id, event, target)
  {
    window.hostspotlighter.invertColors();
    return false;
  };

  this._handlers["navigate-next-top-tab"] = function(action_id, event, target)
  {
    window.topCell.tab.navigate_to_next_or_previous_tab(false);
    return false;
  }

  this._handlers["navigate-previous-top-tab"] = function(action_id, event, target)
  {
    window.topCell.tab.navigate_to_next_or_previous_tab(true);
    return false;
  }

  /* implementation */

  this.handle = function(action_id, event, target)
  {
    if (action_id in this._handlers &&
        this._handlers[action_id](action_id, event, target) == false)
      return false;
    var sc_listener = event.target.get_attr('parent-node-chain', 'shortcuts');
      if (sc_listener && sc_listener in this._sc_listeners)
        return this._sc_listeners[sc_listener](action_id, event, target);
  }

  this.onclick = function(event)
  {
    this.mode = /input|textarea/i.test(event.target.nodeName) ?
                                       MODE_EDIT :
                                       MODE_DEFAULT;
  };

  this.register_shortcut_listener = function(listener_id, callback, action_list)
  {
    this._sc_listeners[listener_id] = callback;
    if (action_list)
      action_list.forEach(function(action)
      {
        if (this._listener_handlers.indexOf(action) == -1)
          this._listener_handlers.push(action);
      }, this);
  };

  /* instatiation */


}


