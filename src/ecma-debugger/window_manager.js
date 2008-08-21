/**
 * @fileoverview
 */

var cls = window.cls || ( window.cls = {} );

/**
  * Window manager service class
  * @constructor 
  * @extends ServiceBase
  */
cls.WindowManagerService = function(name)
{
  var self = this;

  var view = "window_manager";


  this.onreceive = function(xml) // only called if there is a xml
  {
    if( ini.debug )
    {
      debug.logEvents(xml);
    }
    if( self[xml.documentElement.nodeName] )
    {
      self[xml.documentElement.nodeName](xml)
    }
    else
    {
      opera.postError( "window manager not handled: " + new XMLSerializer().serializeToString(xml))
      // opera.postError('error in window manager, genericEventListener');
    }
  }

  // events
  // list-windows-reply, updated-window, window-closed, window

  this['active-window'] = function(msg) 
  {
    
    window_manager_data.active_window = msg.getNodeData("window-id");
    views[view].update();

    // opera.postError( "active window: " + new XMLSerializer().serializeToString(msg))
  }
  /*

  window manager not handled: <?xml version="1.0"?>
  <list-windows-reply>
  <window>
  <window-id>1</window-id>
  <title>Opera browser: Homepage</title>
  <window-type>normal</window-type>
  <opener-id>0</opener-id>
  </window>

  <window><window-id>2</window-id><title>(x)html, css, dom, js and design</title><window-type>normal</window-type><opener-id>0</opener-id></window></list-windows-reply>
  */

  this['list-windows-reply'] = function(msg) 
  {
    // opera.postError( "active window: " + new XMLSerializer().serializeToString(msg))
    var
      window_list = [],
      windows = msg.getElementsByTagName('window'),
      _window = null,
      children = null,
      child = null,
      win_obj = null,
      i = 0, 
      j = 0;
    
    for( ; _window = windows[i]; i++)
    {
      win_obj = {};
      children = _window.childNodes;
      for( j = 0; child = children[j]; j++ )
      {
        win_obj[child.nodeName] = child.firstChild.nodeValue;
      }
      window_list[i] = win_obj;
    }
    window_manager_data.window_list = window_list;
    // alert(JSON.stringify(window_manager_data.window_list))
    views[view].update();
  }

  // commands

  this.getActiveWindow = function()
  {
    this.post("<get-active-window />");
  }

  this.getWindowList = function()
  {
    this.post("<list-windows />");
  }

  this.setFilterActiveWindow = function()
  {
    var msg = "<filter>" +
                "<include>" +
                  "<window-id>" + 
                    window_manager_data.active_window + 
                  "</window-id>" +
                "</include>" +
              "</filter>";
    this.post(msg);
  }
  

  this.onconnect = function(xml)
  {
    self.getActiveWindow();
    // setInterval(function(){self.getActiveWindow();}, 5000);
    self.getWindowList();
    //setTimeout(function(){self.getWindowList();}, 1000);
  }

  var onAplicationsetup = function()
  {

  }

  // constructor calls

  this.initBase(name);
  
  if( ! client)
  {
    opera.postError('client does not exist');
    return;
  }
  client.addService(this);

  // messages.addListener('application-setup', onAplicationsetup);
}

cls.WindowManagerService.prototype = ServiceBase;
new cls.WindowManagerService('window-manager');

// for testing

var window_manager_data = new function()
{
  this.active_window = null;
}

var cls = window.cls || ( window.cls = {} );

/**
  * @constructor 
  * @extends ViewBase
  */

cls.WindowManagerTestView = function(id, name, container_class)
{
  var self = this;
  this.createView = function(container)
  {
    var win_list = window_manager_data.window_list,
      win = null,
      props = ['window-id', 'title', 'window-type', 'opener-id'],
      prop = '', 
      i = 0,
      j = 0,
      markup = \
        "<div>" +
          "<input type='button' value='get active window' handler='get-active-window'>" +
          "<input type='button' value='list windows' handler='list-windows'>" +
          "<input type='button' value='set filter active window' handler='set-filter-active-window'>" +
        "</div>" +
        "<h2>active window: " + window_manager_data.active_window + "</h2>" +
        "<h2>window list</h2>";
    if( win_list )
    {
      for ( ; win = win_list[i]; i++ )
      {
        markup += "<ul>";
        for( j = 0; prop = props[j]; j++ )
        {
          markup += "<li>" + prop + ": " + win[prop] + "</li>";
        }
        markup += "</ul>";
      }
    }
    else
    {
      markup += "<p>window list null</p>";
    }

    container.innerHTML = "<div class='padding'>" + markup + "</div>";

  }
  this.init(id, name, container_class);
}

cls.WindowManagerTestView.prototype = ViewBase;
new cls.WindowManagerTestView('window_manager', 'Test Window Manager', 'scroll windows-manager');

eventHandlers.click['get-active-window'] = function(event, target)
{
  services['window-manager'].getActiveWindow();
}

eventHandlers.click['list-windows'] = function(event, target)
{
  services['window-manager'].getWindowList();
}

eventHandlers.click['set-filter-active-window'] = function(event, target)
{
  services['window-manager'].setFilterActiveWindow();
}







