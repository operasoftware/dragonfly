window.cls || (window.cls = {});
cls.WindowManager || (cls.WindowManager = {});
cls.WindowManager["2.0"] || (cls.WindowManager["2.0"] = {});


cls.WindowManager["2.0"].WindowManagerData = function()
{
  this.active_window = null;

  this.window_list = null;

  this.debug_context = 0;

  var view = "window_manager";

  var self = this;


  // command bindings

  var window_manager = window.services['window-manager'];


  // response bindings



  window_manager.handleGetActiveWindow = 
  window_manager.onWindowActivated = function(status, msg)
  {
    self.set_active_window(msg[0]);
  }


  window_manager.handleListWindows = function(status, message)
  {
    self.set_window_list(message[0].map(_parse_window));
  }

  // event bindings

  window_manager.onWindowUpdated = function(status, message)
  {
    self.update_list(_parse_window(message));
  }

  window_manager.onWindowClosed = function(status, message)
  {
    self.remove_window(message[0]);
  }



  // TODO is this still ok?

  var _get_context = function()
  {
    if( !self.active_window )
    {
      window_manager.requestGetActiveWindow();
    }
    else if( !window_manager_data.debug_context )
    {
      self.setDebugContext(self.active_window);
    }
      
    if( !window_manager_data.window_list )
    {
      window_manager.requestListWindows();
    }

    if( !self.active_window || !self.window_list )
    {
      if( check_counter++ < 20 )
      {
        setTimeout(_get_context, 100);
      }
      else
      {
        throw "it not possible to get the active window";
      }
    }
  }

  var check_counter = 0;

  window_manager.on_enable_success = function()
  {
    _get_context();
  }


  var _parse_window = function(win)
  {
    /*
    WINDOW_ID = 0,
    TITLE = 1,
    WINDOW_TYPE = 2,
    OPENER_ID = 3;
    */
    return {window_id: win[0], title: win[1], window_type: win[2], opener_id: win[3]};
  }

  var update_views = function()
  {
    windowsDropDown.update();
    // views["window_manager"].update();
  }

  this.set_active_window_as_debug_context = function()
  {
    if( this.active_window && this.active_window != this.debug_context )
    {
      this.setDebugContext(this.active_window);
      update_views();
    }
  }

  this.set_active_window = function(win_id)
  {
    this.active_window = win_id;
    update_views();
  }

  this.getDebugContextTitle = function()
  {
    var cursor = null, i = 0;
    if( this.window_list )
    {
      for( ; ( cursor = this.window_list[i] ) && cursor['window-id'] != this.debug_context; i++);
    }
    return cursor && cursor['title'] || '';
  }

  this.has_window_id_in_list = function(id)
  {
    var cursor = null, i = 0;
    if( this.window_list )
    {
      for( ; ( cursor = this.window_list[i] ) && ! (cursor.window_id == id ); i++);
    }
    return cursor && true || false;
  }

  this.set_window_list = function(window_list)
  {
    this.window_list = 
      !settings.general.get('show-only-normal-and-gadget-type-windows') && window_list
      || window_list.filter(this.window_filter);

    if( this.active_window && !this.has_window_id_in_list(this.active_window) )
    {
      // TODO 
      // workaround for wrong active window id. must be removed
      this.setDebugContext(this.window_list[0].window_id);
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 'active window id does not exist');
    }
    update_views();
  }

  this.setDebugContext = function(win_id)
  {
    
    window_manager.requestModifyFilter(0, [1, [win_id]]);
    this.debug_context = win_id;
    
    // TODO cleanup, the active window id should just be at one place
    runtimes.setActiveWindowId(win_id);
    update_views();
    /*
    // workaround as long as we don't have a command confirmation. see bug 361876
    setTimeout
    (
      function() 
      {
        runtimes.createAllRuntimesOnDebugContextChange(win_id);
      }, 
      100
    )
    */

  }

  this.window_filter = function(win)
  {
    return win.window_type in {"normal": 1, "gadget": 1};
  }

  this.update_list = function(win_obj)
  {
    var id = win_obj.window_id, win = null, i = 0;
    if( !settings.general.get('show-only-normal-and-gadget-type-windows') 
        || this.window_filter(win_obj) )
    {
      if( this.window_list )
      {
        for( ; ( win = this.window_list[i] ) && !( id == win.window_id ); i++ );
      }
      else
      {
        this.window_list = [];
      }
      this.window_list[i] = win_obj;
      update_views();
    }
  }

  this.remove_window = function(win_id)
  {
    var win = null, i = 0;
    if( this.window_list )
    {
      for( ; win = this.window_list[i]; i++ )
      {
        if( win_id == win.window_id )
        {
          this.window_list.splice(i, 1);
          if( win_id == this.active_window )
          {
            if (this.window_list.length)
            {
              this.setDebugContext(this.window_list[0].window_id)
            }
          }
          break;
        }
      }
    }
    update_views();
  }

}

/*
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

*/


// TODO use the action class

eventHandlers.click['get-active-window'] = function(event, target)
{
  services['window-manager'].requestGetActiveWindow();
}

eventHandlers.click['list-windows'] = function(event, target)
{
  services['window-manager'].requestListWindows();
}

eventHandlers.click['set-filter-active-window'] = function(event, target)
{
  alert("not implemented eventHandlers.click['set-filter-active-window'] in window-manager.js")
  // services['window-manager'].setFilterActiveWindow();
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
      window_manager_data.setDebugContext(parseInt(win_id));
    }
  }
}

cls.WindowManager["2.0"].WindowsDropDown = function()
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
      props = ['window_id', 'title', 'window_type', 'opener_id'],
      prop = '', 
      i = 0,
      id = '',
      markup = "";

      if(win_list && select)
      {
        for( ; win = win_list[i]; i++ )
        {
          id = win.window_id;
          markup += '<option value="' + id + '"' + 
            ( id == debug_context ? ' selected="selected"' : '' ) + '>' + 
            win.title + 
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
    window_manager_data.setDebugContext(parseInt(parseInt(target.value)));
  }
}

cls.WindowManager["2.0"].DebuggerMenu = function(id, class_name)
{
  /*
  * TODO needs to be merged with windowsDropDown
  */

  var selected_value = "";

  this._action_entries =   
  [
    {
      handler: 'reload-window',  
      text: ui_strings.S_MENU_RELOAD_DEBUG_CONTEXT
    }
  ];

  this.getSelectedOptionValue = function()
  {

  }

  this.templateOptionList = function(select_obj)
  {
    var 
    win_list = window_manager_data.window_list,
    active_window = window_manager_data.active_window,
    debug_context = window_manager_data.debug_context,
    win = null,
    ret = [],
    opt = null, 
    i = 0;

    if( active_window != debug_context )
    {
      ret[ret.length] = [
          "cst-option",
          ui_strings.S_MENU_SELECT_ACTIVE_WINDOW,
          "opt-index", i,
          "value", active_window.toString(),
          "unselectable", "on"
        ]
    }
    ret = ret.concat(select_obj._action_entries.map(this._action_entry));
    ret[ret.length] = ["hr"];
    for( ; win = win_list[i]; i++ )
    {
      ret[ret.length] = [
          "cst-option",
          win.title,
          "opt-index", i,
          "value", win.window_id.toString(),
          "class", win.window_id == debug_context ? "selected" : "",
          "unselectable", "on"
        ]
    }
    return ret;
  }
  
  this.checkChange = function(target_ele)
  {
    var win_id = parseInt(target_ele.getAttribute('value'));
    if( win_id != window_manager_data.debug_context )
    {
      window_manager_data.setDebugContext(win_id);
      return true;
    }
  }

  // this.updateElement



  this.getTemplate = function()
  {
    var select = this;
    return function()
    {
      return [
          "cst-select",
          ["cst-drop-down"],
          "cst-id", select.getId(),
          "handler", select.getId(),
          "unselectable", "on",
          "class", select.class_name
        ]
    }
  }

  this.init(id, class_name);
  this.select_template = this.getTemplate();
}


