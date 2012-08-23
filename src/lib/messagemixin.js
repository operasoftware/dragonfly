/**
 * Mix in class that lets arbitrary classes act as message sources. The
 * mixin adds the public methods add_listener, remove_listener and post_message.
 * There are aliases, called post, addListener and removeListener, these are
 * deprecated and will at some point be removed.
 *
 * Note that the presence of a _public_ post method means anyone can
 * dispatch messages on an object, not just the object itself.
 *
 */

window.cls || ( window.cls = {} );

cls.MessageMixin = function()
{

  /**
   * Add a message listener
   * @param name {String} The name of the message to listen for
   * @param cb {function} The callback to call when message is received
   */
  this.add_listener = function(name, cb)
  {
    if (!cb)
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      "No callback function for message listener provided: " + name);
      return;
    }

    if(! this._mm_listeners)
    {
      this._mm_listeners = {};
    }

    if( name in this._mm_listeners)
    {
      this._mm_listeners[ name ].push( cb );
    }
    else
    {
      this._mm_listeners[ name ] = [ cb ];
    }
  };
  this.addListener = this.add_listener;

  /**
   * Remove a listener for a specific message.
   * @param name {String} the name of the message to dispatch
   * @param cb {Object} the callback function for the message.
   */
  this.remove_listener = function(name, cb)
  {
    if (! this._mm_listeners) { return; }
    var cur = null;
    var listeners = this._mm_listeners[ name ] || [];
    var i = 0;
    for( ; cur = listeners[i]; i++)
    {
      if (cur == cb)
      {
        listeners.splice(i, 1);
        i--;
      }
    }
  };
  this.removeListener = this.remove_listener;

  /**
   * Post a message to all its listeners, optionally with a payload. The
   * payload object gets an extra "type" key with the name of the message
   * @param name {String} the name of the message to dispatch
   * @param msg {Object} the payload to the message. Optional
   */
  this.post_message = function( name, msg )
  {
    if (! this._mm_listeners) { return false; }
    if (msg === undefined || msg === null)
    {
      msg = {};
    }
    var listeners = this._mm_listeners[ name ];
    var cb = null;
    var i = 0;
    msg.type = name;
    msg.target = this;
    if( listeners )
    {
      for( ; cb = listeners[i]; i++)
      {
        cb(msg);
      }
    }
    return Boolean(i);
  };
  this.post = this.post_message;
}
