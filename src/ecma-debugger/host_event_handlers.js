/**
  * @constructor 
  */

var host_event_handlers = new function()
{
  var self = this;

  var listeners = {};

  this.handle = function(xml)
  {
    if( window.__times_spotlight__ ) 
    {
      window.__times_spotlight__[0] =  new Date().getTime();
    }
    var event = {};


    var children = xml.documentElement.childNodes, child=null, i=0;
    for ( ; child = children[i]; i++)
    {
      event[child.nodeName] = child.firstChild.nodeValue;
    }
    if( event['handler-id'] in listeners )
    {
      listeners[ event['handler-id'] ](event);
    }
  }

  this.addListener = function( id, callback )
  {
    if ( !(id in listeners) )
    {
      listeners[id] = callback;
    }
  }

  this.removeListener = function( id, callback )
  {
    delete listeners[id];
  }
  
}