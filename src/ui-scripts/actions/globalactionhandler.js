var GlobalActionHandler = function(id)
{
  /* interface */
  /**
    * A view id to identify an action implementer.
    */
  this.id = id;

  /**
    * To handle a single action.
    * Returning false will cancel the event (preventDefault and stopPropagation),
    * true will pass it to the next level if any.
    */
  this.handle = function(action_id, event, target){};

  /**
    * To get a list of supported actions.
    */
  this.get_action_list = function(){};

  /**
    * Gets called if an action implementer changes to be the current context.
    */
  this.focus = function(container){};

  /**
    * Gets called if an action implementer stops to be the current context.
    */
  this.blur = function(){};

  /**
    * Gets called if an action implementer is the current context.
    * Returning false will cancel the event (preventDefault and stopPropagation),
    * true will pass it to the next level if any.
    */
  this.onclick = function(event){};

  /* constants */

  const
  MODE_DEFAULT = ActionBroker.MODE_DEFAULT,
  MODE_EDIT = ActionBroker.MODE_EDIT;

  /* privat */


  this._broker = ActionBroker.get_instance();
  this._handlers = {};

  this._handlers['continue-run'] =
  this._handlers['continue-step-next-line'] =
  this._handlers['continue-step-out-of-call'] =
  this._handlers['continue-step-into-call'] =
  function(action_id, event, target)
  {
    var button = document.getElementById(action_id);
    if (button && !button.disabled)
      button.click();
    return false;
  };

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

  /* implementation */

  this.handle = function(action_id, event, target)
  {
    if (action_id in this._handlers)
      return this._handlers[action_id](action_id, event, target);
  }

  this.onclick = function(event)
  {
    this._broker.set_mode(this, /input|textarea/i.test(event.target.nodeName) ?
                                MODE_EDIT :
                                MODE_DEFAULT);
  };

  /* instatiation */


}
