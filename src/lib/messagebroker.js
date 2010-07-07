/**
 * The message broker is a singleton used for loosely coupled communication
 * between bits of code. The message broker is a singleton, anywhere a
 * message broker instance is used it is guaranteed to be the One True
 * Message Broker that is shared globally. The message broker supports
 * subscribing to messages and posting message. There is no requirement
 * to pre-register what kinds of messages can be sent. A message is
 * simply a (name, payload) tuple.
 *
 *
 * @requires MessageMixin
 */

window.cls || ( window.cls = {} );

cls.MessageBroker = function() {
   // message broker is a singleton
   if(cls.MessageBroker.instance)
   {
     return cls.MessageBroker.instance;
   }
   cls.MessageBroker.instance = this;

   cls.MessageMixin.apply(this); // mixin happens here.
   // At this point message broker instance has addListener and post
};
cls.MessageBroker.getInstance = function() { return new MessageBroker(); };
