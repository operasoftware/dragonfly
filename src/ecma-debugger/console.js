
var console = new function()
{
  var self = this;
  var service = "console-logger";

  this.getEvent = function()
  {
    proxy.GET( "/" + service, genericEventListener );
  }

  var messages = [];

  var genericEventListener = function(xml) 
  {
    if( xml && self[xml.documentElement.nodeName] )
    {
      self[xml.documentElement.nodeName](xml)
    }
    else
    {
      opera.postError('error in console, genericEventListener');
    }
    self.getEvent();
  }

  this['timeout'] = function() 
  {

  }

  this['message'] = function(message) 
  {
    window.console_messages.handle(message);
  }

  this.setup = function()
  {
    if (!proxy.enable(service))	
    {
      alert( "No service: " + service );
      return;
    }
    else
    {
      self.getEvent();
    }
  }
  
}


var console_messages = new function()
{
  var msgs = [];
  
  this.handle = function(message_event)
  {
    var message = {};
    //alert(new XMLSerializer().serializeToString(message_event))
    var children = message_event.documentElement.childNodes, child=null, i=0, value = '';
    for ( ; child = children[i]; i++)
    {
      if( value = child.getAttribute('value') )
      {
        message[child.nodeName] = value;
      }
      else if ( child.firstChild )
      {
        message[child.nodeName] = child.firstChild.nodeValue; 
      }
      
    }
    msgs[msgs.length] = message;
    views.console.update();
  }

  this.getMessages = function()
  {
    return msgs;
  }
  
};


(function(){ window.views = window.views || {}; })();

views.console = new function()
{
  var container_id = 'console-view';
  this.update = function()
  {
    var container = document.getElementById( container_id ); 
    if( container )
    {
      container.innerHTML = '';
      container.renderInner(templates.messages(console_messages.getMessages()));
    }
  }
}

//onload = console.setup;