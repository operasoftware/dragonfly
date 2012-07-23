/**
  * @constructor
  *
  *
  * @class
  * A queue to handle message is order, if the handling of messages itself
  * is asynchron, e.g. due to new calls on the scope interface to be
  * able to handle the message.
  */
var Queue = function(handler_object)
{
  /* interface */

  /**
    * To process calls in order.
    * The method takes a handler and returns a new handler.
    * A call to that new handler will be executed in order.
    * That means, if the queue is empty, it will be executed instantly,
    * otherwise it will be stored on top of the queue.
    * The signature of the handler does not change.
    * Handlers will be called on the handler_object.
    * @param {Function} handler. A method of the handler_object.
    * @return a queued handler.
    */
  this.queue = function(handler){};

  /**
    * To stop processing the queue.
    */
  this.stop_processing = function(){};

  /**
    * To continue processing the queue.
    */
  this.continue_processing = function(){};

  /* private */

  this._msg_queue = [];
  this._is_processing = false;

  this._queue_msg_with_handler = function(handler)
  {
    var args = Array.prototype.slice.call(arguments, 1);
    if (this._is_processing)
    {
      this._msg_queue.push([handler, args]);
    }
    else
    {
      handler.apply(this._handler_object, args);
    }
  };

  this._process_msg_queue = function()
  {
    const METHOD = 0, ARGS = 1;
    var item = null;
    while (!this._is_processing && this._msg_queue.length)
    {
      item = this._msg_queue.shift();
      item[METHOD].apply(this._handler_object, item[ARGS]);
    }
  }

  /* implementation */

  this.queue = function(handler)
  {
    return this._queue_msg_with_handler.bind(this, handler);
  };

  this.stop_processing = function()
  {
    this._is_processing = true;
  };

  this.continue_processing = function()
  {
    if (this._is_processing)
    {
      this._is_processing = false;
      this._process_msg_queue();
    }
  };

  /* initialisation */

  this.init = function(handler_object)
  {
    this._handler_object = handler_object;
  };

  this.init(handler_object);

};
