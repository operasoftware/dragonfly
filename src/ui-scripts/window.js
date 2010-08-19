/**
  * @constructor
  */

var UIWindowBase = new function()
{
  var self = this;
  var id_count = 1;
  var ids = [];

  var getId = function()
  {
    return 'ui-window-' + (id_count++).toString();
  }

  this.default_width = 500;
  this.default_height = 300;
  this.default_top = 100;
  this.default_left = 100;



  var
  min_width = 200,
  min_height = 100,
  min_z_index = 100;

  var viewport = null;

  this.init = function(view_id, left, top, width, height)
  {
    var view = window.views[view_id];
    var has_statusbar = 
      typeof view.window_statusbar == 'boolean' ? view.window_statusbar : true;
    ids[ids.length] = this.id = getId();
    this.view_id = view_id;
    this.top = top || view && view.window_top || this.default_top;
    this.left = left || view && view.window_left || this.default_left;
    this.width = width || view && view.window_width || this.default_width;
    this.height = height || view && view.window_height || this.default_height;
    this.min_top = 6;
    this.min_visible_height = 80;
    this.min_visible_width = 150;
    this.container = new WindowContainer(this);
    this.is_resizable = 
      typeof view.window_resizable == 'boolean' ? view.window_resizable : true;
    if (has_statusbar)
      this.statusbar = new WindowStatusbar(this);
    if(toolbars[view_id])
    {
      this.toolbar = new WindowToolbar(this, toolbars[view_id].buttons, toolbars[view_id].filters );
    }
    if(!window.ui_windows)
    {
      window.ui_windows = {};
    }
    window.ui_windows[this.id] = this;
    this.render();
  }

  this.render = function(resizable)
  {
    var win = viewport.render(templates._window(this));


    if( this.toolbar )
    {
      this.toolbar.setDimensions();
      this.toolbar.setup(this.view_id);
    }

    this.container.setup(this.view_id);

    if (this.statusbar)
      this.statusbar.setup(this.view_id);

    this.setZIndex();
    win.style.zIndex = 200;
  }

  this._delete = function(id)
  {
    var
    _id = '',
    i = 0;
    for( ; ( _id = ids[i] ) && _id != id; i++);
    if(_id)
    {
      delete window['ui-windows'][id];
      ids.splice(i, 1);
      return true;
    }
    return false;
  }

  this.setZIndex = function()
  {
    var win = null, id = '', i = 0, z = 0;
    for( ; id = ids[i]; i++)
    {
      win = document.getElementById( id );
      if( win )
      {
        if( ( z = parseInt( win.style.zIndex ) ) && z > min_z_index )
        win.style.zIndex = z - 1;
      }
    }
  }

  this.getWindowByViewId = function(view_id)
  {
    var win = null, id = '', i = 0;
    for( ; id = ids[i]; i++)
    {
      if( ui_windows[id].view_id == view_id )
      {
        return ui_windows[id];
      }
    }
    return null;
  }

  this.update = function()
  {
    this.container.setDimensions();
  }

  this.showWindow = function(view_id, top, left, width, height)
  {
    var win = this.getWindowByViewId(view_id);

    if(win)
    {
      if (!win.is_resizable)
      {
        if (typeof width == 'number')
          win.width = width;
        if (typeof height == 'number')
          win.height = height;
      }
        
      if(document.getElementById(win.id))
      {
        self.setZIndex();
        document.getElementById(win.id).style.zIndex = 200;
        window.views[view_id].update();
      }
      else
      {
        win.render();
      }
    }
    else
    {
      win = new UIWindow(view_id, top, left, width, height);
    }
    return win;

  }

  this.closeWindow = function(view_id)
  {
    var win = this.getWindowByViewId(view_id), win_ele = null;
    if(win && (win_ele = document.getElementById(win.id)))
    {
      win.container.onclose();
      win_ele.parentNode.removeChild(win_ele);
    }
  }

 /* event handling */

  var
  handlers =
  {
    'window-scale-top-left': true,
    'window-scale-top': true,
    'window-scale-top-right': true,
    'window-move': true,
    'window-scale-right': true,
    'window-scale-left': true,
    'window-scale-bottom': true,
    'window-scale-bottom-right': true,
    'window-scale-bottom-left': true
  },
  set = {},
  update = {},
  click_handlers = {},
  current_target = null,
  __event = null,
  interval = 0,
  current_style = null,
  update_handler = null,
  left_delta = 0,
  top_delta = 0,
  bottom_delta = 0,
  right_delta = 0,
  focus_catcher = null,
  window_shadows = null,

  store_event = function(event)
  {
    __event = event;
    focus_catcher.focus();
  },

  force_reflow_shadows = function()
  {
    if(window_shadows)
    {
      window_shadows.innerHTML = "" +
        "<window-shadow class='top-left'></window-shadow>" +
        "<window-shadow class='top'></window-shadow>" +
        "<window-shadow class='top-right'></window-shadow>" +
        "<window-shadow class='left'></window-shadow>" +
        "<window-shadow class='right'></window-shadow>" +
        "<window-shadow class='bottom-left'></window-shadow>" +
        "<window-shadow class='bottom'></window-shadow>" +
        "<window-shadow class='bottom-right'></window-shadow>";
    }
  },

  mousedown = function(event)
  {
    var handler = event.target.getAttribute('handler');
    {
      if( handler in handlers )
      {
        if( interval )
        {
          interval = clearInterval( interval );
        }
        if(!focus_catcher)
        {
          focus_catcher = UIBase.getFocusCatcher();
        }
        window_shadows = event.target.parentNode.getElementsByTagName('window-shadows')[0];
        current_style = event.target.parentNode.style;
        self.setZIndex();
        current_style.zIndex = 200;
        interval = setInterval( update[handler], 30 );
        update_handler = update[handler];
        set[handler](event);
        current_target = ui_windows[event.target.parentNode.id] || {};
        document.addEventListener('mousemove', store_event, false);
        document.addEventListener('mouseup', mouseup, false);
      }
    }
  },

  mouseclick = function(event)
  {
    var handler = event.target.getAttribute('handler');
    {
      if( handler in click_handlers )
      {
        click_handlers[handler](event);
      }
      else
      {
        var parent = event.target;
        while( parent )
        {
          if( /^window$/i.test(parent.nodeName) )
          {
            self.setZIndex();
            parent.style.zIndex = 200;
            break;
          }
          parent = parent.parentElement;
        }
      }
    }
  },

  mouseup = function(event)
  {
    document.removeEventListener('mousemove', store_event, false);
    document.removeEventListener('mouseup', mouseup, false);
    document.onselectstart = null;
    interval = clearInterval( interval );
    update_handler();
    window_shadows = current_target = current_style = __event = update_handler = null;
  },
  
  verify_left = function(win, inner_width, left)
  {
    if (left > inner_width - win.min_visible_width)
      left = inner_width - win.min_visible_width;
    if (left < win.min_visible_width - win.width)
      left = win.min_visible_width - win.width;
    return left;
  },
  
  verify_top = function(win, inner_height, top)
  {
    if (top > inner_height - win.min_visible_height)
      top = inner_height - win.min_visible_height;
    if (top < win.min_top)
      top = win.min_top;
    return top
  };

  set['window-move'] = function(event)
  {
    left_delta = event.pageX - event.target.parentNode.offsetLeft;
    top_delta = event.pageY - event.target.parentNode.offsetTop;
  }

  update['window-move'] = function()
  {
  
    if(__event)
    {
      var inner_height = window.innerHeight, inner_width = window.innerWidth;
      if( __event.pageX < inner_width && __event.pageX > 0 )
      {
        current_target.left = verify_left(current_target, inner_width, 
                                          __event.pageX - left_delta);
        current_style.left = current_target.left + 'px';
      }
      if( __event.pageY < inner_height && __event.pageY > 0 )
      {
        current_target.top = verify_top(current_target, inner_height, 
                                        __event.pageY - top_delta)
        current_style.top = current_target.top + 'px';
      }
      focus_catcher.focus();
    }
  }

  set['window-scale-top'] = function(event)
  {
    top_delta = event.pageY - event.target.parentNode.offsetTop;
    bottom_delta = event.target.parentNode.offsetTop + event.target.parentNode.offsetHeight - 2;
  }

  update['window-scale-top'] = function(event)
  {
    if( __event )
    {
      var top = __event.pageY - top_delta;
      var height =  bottom_delta - top;
      if( height > min_width )
      {
        current_style.height = ( current_target.height = height ) + 'px';
        current_style.top = ( current_target.top = top ) + 'px';
        current_target.update();
        focus_catcher.focus();
      }
    }
  }

  set['window-scale-right'] = function(event)
  {
    left_delta = event.pageX - ( event.target.parentNode.offsetWidth - 2 );
  }

  update['window-scale-right'] = function()
  {
    if(__event)
    {
      var width = __event.pageX - left_delta;
      if( width > min_width )
      {
        current_style.width = ( current_target.width = width ) + 'px';
        current_target.update();
        focus_catcher.focus();
      }
    }
  }

  set['window-scale-left'] = function(event)
  {
    left_delta = event.pageX - event.target.parentNode.offsetLeft;
    right_delta = event.target.parentNode.offsetLeft + event.target.parentNode.offsetWidth - 2;
  }

  update['window-scale-left'] = function(event)
  {
    if( __event )
    {
      var left = __event.pageX - left_delta;
      var width =  right_delta - left;
      if( width > min_width )
      {
        current_style.width = ( current_target.width = width ) + 'px';
        current_style.left = ( current_target.left = left ) + 'px';
        current_target.update();
        focus_catcher.focus();
      }
    }
  }

  set['window-scale-bottom'] = function(event)
  {
    top_delta = event.pageY - event.target.parentNode.offsetHeight;
  }

  update['window-scale-bottom'] = function()
  {
    if( __event )
    {
      var height = __event.pageY - top_delta;
      if( height > min_height )
      {
        current_style.height = ( current_target.height = height ) + 'px';
        current_target.update();
        focus_catcher.focus();
        force_reflow_shadows();
      }
    }
  }

  set['window-scale-top-left'] = function(event)
  {
    set['window-scale-left'](event);
    set['window-scale-top'](event);
  }

  update['window-scale-top-left'] = function()
  {
    update['window-scale-left']();
    update['window-scale-top']();
  }

  set['window-scale-top-right'] = function(event)
  {
    set['window-scale-right'](event);
    set['window-scale-top'](event);
  }

  update['window-scale-top-right'] = function()
  {
    update['window-scale-right']();
    update['window-scale-top']();
  }

  set['window-scale-bottom-right'] = function(event)
  {
    set['window-scale-right'](event);
    set['window-scale-bottom'](event);
  }

  update['window-scale-bottom-right'] = function()
  {
    update['window-scale-right']();
    update['window-scale-bottom']();
  }

  set['window-scale-bottom-left'] = function(event)
  {
    set['window-scale-left'](event);
    set['window-scale-bottom'](event);
  }

  update['window-scale-bottom-left'] = function()
  {
    update['window-scale-left']();
    update['window-scale-bottom']();
  }

  click_handlers['window-close'] = function(event)
  {
    var win = event.target.parentElement.parentElement;
    if(win)
    {
      ref_obj = ui_windows[win.id];
      ref_obj.container.onclose();
      messages.post("hide-view", {id: win.getAttribute('view_id')});
      win.parentElement.removeChild(win);
    }
  }
  
  var resize = function()
  {
    if (window.ui_windows)
    {
      var 
      id = '',
      inner_height = window.innerHeight, 
      inner_width = window.innerWidth,
      current_target = null,
      current_style = null,
      top = 0,
      left = 0;
      
      for (id in window.ui_windows)
      {
        current_target = window.ui_windows[id];
        if (current_style = (document.getElementById(id) && 
                             document.getElementById(id).style))
        {
          left = verify_left(current_target, inner_width, current_target.left);
          if (left != current_target.left)
            current_style.left = (current_target.left = left) + 'px';
          top = verify_left(current_target, inner_height, current_target.top);
          if (top != current_target.top)
            current_style.top = (current_target.top = top) + 'px';
        }
      }
    }
  }

  var init = function(event)
  {
    document.removeEventListener('load', arguments.callee, false);
    viewport = document.getElementsByTagName(defaults.window_container)[0];
    if(!viewport)
    {
      self.showWindow = function(){};
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
        'missing view port in init in windows');
    }
  }

  document.addEventListener('mousedown', mousedown, false);
  document.addEventListener('click', mouseclick, false);
  window.addEventListener('load', init, false);
  window.addEventListener('resize', resize, false);

}

/**
  * @constructor
  * @extends UIWindowBase
  */

var UIWindow = function(view_id, top, left, width, height)
{
  this.init(view_id, top, left, width, height);
}

UIWindow.prototype = UIWindowBase;
