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

  this.set_debug_context = function(win_id)
  {
    var msg = "<filter>" +
                "<clear />" +
                "<include>" +
                  "<window-id>" + 
                    win_id + 
                  "</window-id>" +
                "</include>" +
              "</filter>";
    this.post(msg);
  }
  
  this.onconnect = function(xml)
  {
    get_context();
  }

  var get_context = function()
  {
    if( !window_manager_data.active_window )
    {
      self.getActiveWindow();
    }
    else if( !window_manager_data.debug_context )
    {
      window_manager_data.setDebugContext(window_manager_data.active_window);
    }
      
    if( !window_manager_data.window_list )
    {
      self.getWindowList();
    }

    if( !window_manager_data.active_window || !window_manager_data.window_list )
    {
      if( check_counter++ < 20 )
      {
        setTimeout(get_context, 100);
      }
      else
      {
        throw "it not possible to get the active window";
      }
    }
  },
  check_counter = 0;

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

  this.debug_context = 0;

  var view = "window_manager";

  var update_views = function()
  {

    windowsDropDown.update();
    views["window_manager"].update();

  }

  this.set_active_window = function(win_id)
  {
    this.active_window = win_id;
    update_views();
  }

  this.has_window_id_in_list = function(id)
  {
    var cursor = null, i = 0;
    if( this.window_list )
    {
      for( ; ( cursor = this.window_list[i] ) && ! (cursor['window-id'] == id ); i++);
    }
    return cursor && true || false;
  }

  this.set_window_list = function(window_list)
  {
    this.window_list = window_list;
    if( this.active_window && !this.has_window_id_in_list(this.active_window) )
    {
      // TODO 
      // workaround for wrong active window id. must be removed
      this.setDebugContext(this.window_list[0]['window-id']);
      opera.postError('active window id does not exist');
    }
    update_views();
  }

  this.setDebugContext = function(win_id)
  {
    services['window-manager'].set_debug_context(win_id);
    this.debug_context = win_id;
    // TODO cleanup, the active window id should just be at one place
    runtimes.setActiveWindowId(win_id);
    update_views();
    // workaround as long as we don't have a command confirmation. see bug 361876
    setTimeout
    (
      function() 
      {
        runtimes.createAllRuntimesOnDebugContextChange(win_id);
      }, 
      100
    )
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
    update_views();
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
          if( win_id == this.active_window )
          {
            if (this.window_list.length)
            {
              this.setDebugContext(this.window_list[0]['window-id'])
            }
          }
          break;
        }
      }
    }
    update_views();
  }
}

var cls = window.cls || ( window.cls = {} );

// for testing the window manager service

cls.WindowManagerTestView = function(id, name, container_class)
{
  var self = this;
  this.createView = function(container)
  {
    var 
    win_list = window_manager_data.window_list,
    win = null,
    props = ['window-id', 'title', 'window-type', 'opener-id'],
    prop = '', 
    i = 0,
    j = 0,
    debug_context = window_manager_data.debug_context,

    markup = \
      "<h2>active window: " + window_manager_data.active_window + "</h2>" +
      "<h2>debug context: " + debug_context + "</h2>" +
      "<h2>window list</h2>";

    if( win_list )
    {
      markup += "<form handler='set-debug-context'>";
      for ( ; win = win_list[i]; i++ )
      {
        markup += 
          "<ul window-id='" + win['window-id'] + "'>" +
          "<li><input type='radio'" + 
          ( 
            debug_context && debug_context == win['window-id']
            ? "checked='checked'" 
            : ""
          ) +
          "></li>";
        for( j = 0; prop = props[j]; j++ )
        {
          markup += "<li>" + prop + ": " + win[prop] + "</li>";
        }
        markup += "</ul>";
      }
      markup += "</form>";
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

eventHandlers.click['set-debug-context'] = function(event, target)
{
  if( /input/i.test(event.target.nodeName) )
  {
    var 
    container = event.target.parentElement.parentElement,
    win_id = container.getAttribute('window-id');

    if( win_id )
    {
      window_manager_data.setDebugContext(win_id);
    }
  }
}

var windowsDropDown = new function()
{

  this.update = function()
  {
    var toolbar = topCell.toolbar.getElement();
    if(toolbar)
    {
      var 
      select = toolbar.getElementsByTagName('select')[0],
      win_list = window_manager_data.window_list,
        active_window = window_manager_data.active_window,
        debug_context = window_manager_data.debug_context,
      win = null,
      props = ['window-id', 'title', 'window-type', 'opener-id'],
      prop = '', 
      i = 0,
      id = '',
      

      markup = "";

      if(win_list && select)
      {
        for( ; win = win_list[i]; i++ )
        {
          id = win['window-id'];
          markup += '<option value="' + id + '"' + 
            ( id == debug_context ? ' selected="selected"' : '' ) + '>' + 
            win['title'] + 
            '</option>';
        }
        select.innerHTML = markup;
      }
    }
   
  }
}

eventHandlers.change['select-window'] = function(event, target)
{
  if(target.value)
  {
    window_manager_data.setDebugContext(target.value);
    
  }
}












