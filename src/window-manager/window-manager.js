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
    }
  }

  // events

  this['active-window'] = function(msg) 
  {
    window_manager_data.set_active_window(msg.getNodeData("window-id"));
  }

  this['list-windows-reply'] = function(msg) 
  {
    var
    window_list = [],
    windows = msg.getElementsByTagName('window'),
    win = null,
    i = 0;
    
    for( ; win = windows[i]; i++)
    {
      window_list[i] = this.parseWindow(win);
    }
    window_manager_data.set_window_list(window_list);
  }

  this['updated-window'] = function(msg) 
  {
    window_manager_data.update_list( this.parseWindow(msg.getElementsByTagName('window')[0]) );
  }

  this['window-closed'] = function(msg)
  {
    window_manager_data.remove_window( msg.getNodeData('window-id') );
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
                "<clear />" +
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
    self.getWindowList();
  }

  // helpers

  this.parseWindow = function(win)
  {
    var 
    win_obj = {},
    children = win.childNodes,
    child = null,
    first_child = null,
    i = 0;

    for( ; child = children[i]; i++ )
    {
      win_obj[child.nodeName] = 
        ( first_child = child.firstChild ) && first_child.nodeValue || "undefined";
    }
    return win_obj;
  }

  // constructor calls

  this.initBase(name);
  
  if( ! client)
  {
    opera.postError('client does not exist');
    return;
  }
  client.addService(this);

}

cls.WindowManagerService.prototype = ServiceBase;
new cls.WindowManagerService('window-manager');


var window_manager_data = new function()
{
  this.active_window = null;

  this.window_list = null;

  var view = "window_manager";

  this.set_active_window = function(win_id)
  {
    this.active_window = win_id;
    views[view].update();
  }

  this.set_window_list = function(window_list)
  {
    this.window_list = window_list;
    views[view].update();
  }

  this.update_list = function(win_obj)
  {
    var 
    id = win_obj["window-id"],
    win = null, 
    i = 0;

    if( this.window_list )
    {
      for( ; ( win = this.window_list[i] ) && !( id == win["window-id"] ); i++ ) {}
    }
    this.window_list[i] = win_obj;
    views[view].update();
  }

  this.remove_window = function(win_id)
  {
    var 
    win = null, 
    i = 0;

    if( this.window_list )
    {
      for( ; win = this.window_list[i]; i++ )
      {
        if( win_id == win["window-id"] )
        {
          this.window_list.splice(i, 1);
          break;
        }
      }
    }
    views[view].update();
  }
}

var cls = window.cls || ( window.cls = {} );

// for testing the window manager service

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







