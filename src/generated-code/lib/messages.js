window.cls || ( window.cls = {} );

/**
 * @fileoverview
 * Message handling class definition and singleton instansiation.
 *
 */

/**
 * @class
 * <p>
 * Message broker singleton. There is a single, global message object instance.
 * Code can subscribe to event notifications on the object, as well as
 * dispatch messages. There can be an arbitrary number of listeners for any
 * message.
 * </p>
 *  
 */

window.cls.Messages = function()
{

  var __listeners = {};
  
  /**
   * Add a message listener
   * @param key {String} The name of the message to listen for
   * @param cb {function} The callback to call when message is received
   */
  this.addListener = function(key, cb)
  {
    if( __listeners[ key ] )
    {
      __listeners[ key ].push( cb );
    }
    else
    {
      __listeners[ key ] = [ cb ];
    }
  }
  
  /**
   * Remove a listener for a specific message.
   * @param key {String} the name of the message to dispatch
   * @param cb {Object} the callback function for the message.
   */
  this.removeListener = function(key, cb)
  {
    var cur = null, listeners = __listeners[ key ], i = 0;
    if( listeners )
    {
      for( ; cur = listeners[i]; i++)
      {
        if (cur == cb)
        {
          listeners.splice(i, 1);
          i--;
        }
      }
    }
  }

  /**
   * Post a message to all its listeners, optionally with a payload. The
   * payload object gets an extra "type" key with the name of the message
   * @param key {String} the name of the message to dispatch
   * @param msg {Object} the payload to the message. Optional
   */
  this.post = function( key, msg )
  {
    msg = msg || {};
    var listeners = __listeners[ key ], cb = null, i = 0;
    msg.type = key;
    msg.target = this;
    if( listeners )
    {
      for( ; cb = listeners[i]; i++)
      {
        cb(msg);
      }
    }
  }
}