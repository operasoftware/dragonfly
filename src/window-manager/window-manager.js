window.cls || (window.cls = {});
cls.WindowManager || (cls.WindowManager = {});
cls.WindowManager["2.0"] || (cls.WindowManager["2.0"] = {});


cls.WindowManager["2.0"].WindowManagerData = function()
{

  /* interface */

  this.get_active_window_id = function(){};
  this.get_window_list = function(){};
  this.get_debug_context = function(){};
  this.get_window = function(win_id){};
  this.set_debug_context = function(win_id){};
  this.clear_debug_context = function(){};
  this.get_debug_context_title = function(){};
  this.bind = function(){};

  /* private */

  var self = this;
  var window_manager = window.services['window-manager'];

  this._active_window = 0;
  this._window_list = null;
  this._debug_context = 0;
  this._check_counter = 0;

  // TODO is this still ok?

  this._get_context = function()
  {
    window_manager.requestListWindows();

  }

  this._parse_window = function(win)
  {
    /*
    WINDOW_ID = 0,
    TITLE = 1,
    WINDOW_TYPE = 2,
    OPENER_ID = 3;
    */
    return {window_id: win[0], title: win[1], window_type: win[2], opener_id: win[3]};
  }

  this._set_active_window_as_debug_context = function()
  {
    if( this._active_window && this._active_window != this._debug_context )
    {
      this.set_debug_context(this._active_window);
      window.windowsDropDown.update();
    }
  }

  this._set_active_window = function(win_id)
  {
    if(this._has_window_id_in_list(win_id))
    {
      this._active_window = win_id;
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
          'active window id does not exist, trying to select the first window instead');
      if(this._window_list.length)
      {
        this._active_window = this._window_list[0].window_id;
      }
    }
    if (this._active_window && !this._debug_context)
    {
      this.set_debug_context(this._active_window);
    }
    window.windowsDropDown.update();
  }

  this._has_window_id_in_list = function(id)
  {
    var cursor = null, i = 0;
    if (this._window_list)
    {
      for( ; ( cursor = this._window_list[i] ) && ! (cursor.window_id == id ); i++);
    }
    return cursor && true || false;
  }

  this._set_window_list = function(window_list)
  {
    this._window_list = 
      !settings.general.get('show-only-normal-and-gadget-type-windows') && window_list
      || window_list.filter(this._window_filter);

    if( !this._active_window )
    {
      window_manager.requestGetActiveWindow();
    }

    if( this._active_window && !this._has_window_id_in_list(this._active_window) )
    {
      // TODO 
      // workaround for wrong active window id. must be removed
      this._active_window = 0;
      this.set_debug_context(this._window_list[0].window_id);
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 'active window id does not exist');
    }
    window.windowsDropDown.update();
  }

  this._window_filter = function(win)
  {
    return win.window_type in {"normal": 1, "gadget": 1};
  }

  this._update_list = function(win_obj)
  {
    var id = win_obj.window_id, win = null, i = 0;
    if( !settings.general.get('show-only-normal-and-gadget-type-windows') 
        || this._window_filter(win_obj) )
    {
      if( this._window_list )
      {
        for( ; ( win = this._window_list[i] ) && !( id == win.window_id ); i++ );
      }
      else
      {
        this._window_list = [];
      }
      this._window_list[i] = win = win_obj;
      window.windowsDropDown.update();
    }
    else
    {
      this._remove_window(id);
    }
    window.messages.post('window-updated', 
      {window_id: win.window_id, title: win.title, window_type: win.window_type, opener_id: win.opener_id})
  }

  this._remove_window = function(win_id)
  {
    var win = null, i = 0;
    if( this._window_list )
    {
      for( ; win = this._window_list[i]; i++ )
      {
        if( win_id == win.window_id )
        {
          this._window_list.splice(i, 1);
          if( win_id == this._debug_context )
          {
            if (this._window_list.length)
            {
              this.set_debug_context(this._window_list[0].window_id)
            }
          }
          break;
        }
      }
    }
    window.windowsDropDown.update();
  }

  this._reset_state_handler = function(msg)
  {
    this._active_window = 0;
    this._window_list = null;
    this._debug_context = 0;
    this._check_counter = 0;
  }

  /* implementation */

  this.get_active_window_id = function()
  {
    return this._active_window;
  }

  this.get_window_list = function()
  {
    return this._window_list;
  }

  this.get_window = function(win_id)
  {
    var win = null, i = 0;
    if( this._window_list )
    {
      for( ; ( win = this._window_list[i] ) && win.window_id != win_id ; i++ );
    }
    return win;
  };

  this.get_debug_context = function()
  {
    return this._debug_context;
  }

  this.get_debug_context_title = function()
  {
    var cursor = null, i = 0;
    if( this._window_list )
    {
      for( ; ( cursor = this._window_list[i] ) && cursor.window_id != this._debug_context; i++);
    }
    return cursor && cursor.title || '';
  }

  this.set_debug_context = function(win_id)
  {
    window_manager.requestModifyFilter(0, [1, [win_id]]);
    this._debug_context = win_id;
    // TODO cleanup, the active window id should just be at one place
    runtimes.setActiveWindowId(win_id);
    window.windowsDropDown.update();
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

  this.clear_debug_context = function()
  {
    this._active_window = 0;
    this._window_list = null;
    this._debug_context = 0;
    this._check_counter = 0;
    window.host_tabs.setActiveTab(0);
    window.windowsDropDown.update();
  }

  this.bind = function()
  {
    var 
    self = this,
    window_manager = window.services['window-manager'];

    window_manager.handleGetActiveWindow = 
    window_manager.onWindowActivated = function(status, msg)
    {
      self._set_active_window(msg[0]);
    }
    window_manager.handleListWindows = function(status, message)
    {
      self._set_window_list(message[0].map(self._parse_window));
    }
    window_manager.onWindowUpdated = function(status, message)
    {
      self._update_list(self._parse_window(message));
    }
    window_manager.onWindowClosed = function(status, message)
    {
      self._remove_window(message[0]);
    }
    window.app.addListener('services-enabled', function()
    {
      window_manager.requestListWindows();
    });
  };

  window.messages.addListener('reset-state', function(msg)
  {
    self._reset_state_handler(msg);
  });

}

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
    win_id = parseInt(container.getAttribute('window-id'));

    if( win_id )
    {
      window_manager_data.set_debug_context(win_id);
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
      win_list = window_manager_data.get_window_list(),
      active_window = window_manager_data.get_active_window_id(),
      debug_context = window_manager_data.get_debug_context(),
      win = null,
      i = 0,
      markup = "";

      if(win_list && select)
      {
        for( ; win = win_list[i]; i++ )
        {
          markup += '<option value="' + win.window_id + '"' + 
            ( win.window_id == debug_context ? ' selected="selected"' : '' ) + '>' + 
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
    window_manager_data.set_debug_context(parseInt(target.value));
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
    win_list = window_manager_data.get_window_list(),
    active_window = window_manager_data.get_active_window_id(),
    debug_context = window_manager_data.get_debug_context(),
    win = null,
    ret = [],
    opt = null, 
    i = 0;

    if( active_window && active_window != debug_context )
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
          win.title || "\u00A0",
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
    if( win_id != window_manager_data.get_debug_context() )
    {
      window_manager_data.set_debug_context(win_id);
      return true;
    }
    return false;
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


