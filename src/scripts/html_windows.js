var windows = new function()
{
  var win = null,
  left_delta = 0,
  top_delta = 0,
  bottom_delta = 0,
  right_delta = 0,
  min_width = 200, 
  min_height = 100,
  d_width = 500, 
  d_height = 300, 
  d_top = 100, 
  d_left = 100,
  current_style = null, 
  update_handler = null,
  id_counter = 0,
  window_ids = {},
  key_id = 'window-id-',
  min_z_index = 100,
  focus_catcher = null,
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
  ids = { 'empty': { top: 0, left: 0, width: 0, height: 0 } },
  current_id = null,
  __event = null,
  interval = 0,
  viewport = null,

  store_event = function(event)
  {
    __event = event;
    focus_catcher_focus();
  },

  setZIndex = function()
  {
    var win = null, id = '', z = 0;
    for( id in window_ids )
    {
      win = document.getElementById( id );
      if( win ) 
      {
        if( ( z = parseInt( win.style.zIndex ) ) && z > min_z_index )
        win.style.zIndex = z - 1;
      }
      else
      {
        delete window_ids[ id ];
      }
    }
  },

  checkRefId = function(ref_id)
  {
    var win = null, id = '';
    for( id in window_ids )
    {
      win = document.getElementById( id );
      if( win && ( win.getAttribute('ref_id') == ref_id ) ) 
      {
        return true;
      }
    }
    return false;
  },  

  template_focus_catcher = function()
  {
    return ['div', 
        ['input'], 
      'style', 'position:absolute;left:-1000px;top:0;'];
  },

  createFocusCatcher = function()
  {
    focus_catcher = document.body.render(template_focus_catcher()).firstChild;
  },

  focus_catcher_focus = function()
  {
    if( focus_catcher )
    {
      focus_catcher.focus();
    }
  },

  mousedown = function(event)
  {
    var handler = event.target.getAttribute('handler');
    {
      if( handler in handlers )
      {
        if( !focus_catcher && !interval )
        {
          createFocusCatcher();
        }
        current_style = event.target.parentNode.style;
        setZIndex();
        current_style.zIndex = 200;
        interval = setInterval( update[handler], 15 );
        update_handler = update[handler];
        set[handler](event);
        var ref_id = event.target.parentNode.getAttribute('ref_id');
        current_id = ref_id ? ids[ ref_id ] : ids[ 'empty' ];
        document.addEventListener('mousemove', store_event, false);
        document.addEventListener('mouseup', mouseup, false);
        document.onselectstart = function (event) { return false };
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
          if( /window/i.test(parent.nodeName) )
          {
            setZIndex();
            parent.style.zIndex = 200;
            break;
          }
          parent = parent.parentElement;
        }
      }
    }
  },

  template = function(ref_id, title, content_template, top, left, width, height)
  {
    window_ids[ key_id + id_counter ] = true;
    return ['window',
        ['window-header',   
          ['window-control', 'handler', 'window-close'],
          title,
          'handler', 'window-move'],
        content_template,
        template_shadows(),
        ['window-control', 'handler', 'window-scale-top-left'],
        ['window-control', 'handler', 'window-scale-top'],
        ['window-control', 'handler', 'window-scale-top-right'],
        ['window-control', 'handler', 'window-scale-right'],
        ['window-control', 'handler', 'window-scale-bottom'],
        ['window-control', 'handler', 'window-scale-bottom-right'],
        ['window-control', 'handler', 'window-scale-bottom-left'],
        ['window-control', 'handler', 'window-scale-left'],
      'id', ( key_id + id_counter++ ), 
      'style', 
      'top:' + ( top ? top : d_top ) + 'px;' +
      'left: ' + ( left ? left : d_left ) + 'px;' +
      'width: '+ ( width ? width : d_width ) + 'px;' +
      'height: ' + ( height ? height : d_height ) + 'px;',
      'ref_id', ref_id]
  },

  template_shadows = function()
  {
    return [ 
      ['window-shadow', 'class', 'top-left'],
      ['window-shadow', 'class', 'top'],
      ['window-shadow', 'class', 'top-right'],
      ['window-shadow', 'class', 'left'],
      ['window-shadow', 'class', 'right'],
      ['window-shadow', 'class', 'bottom-left'],
      ['window-shadow', 'class', 'bottom'],
      ['window-shadow', 'class', 'bottom-right']
      ];
  },

  mouseup = function(event)
  {
    document.removeEventListener('mousemove', store_event, false);
    document.removeEventListener('mouseup', mouseup, false);
    document.onselectstart = null;
    interval = clearInterval( interval );
    update_handler();
    current_id = current_style = __event = update_handler = null;
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
      if( __event.pageX < innerWidth && __event.pageX > 0 )
      {
        current_style.left = ( current_id.left = __event.pageX - left_delta ) + 'px';
      }
      if( __event.pageY < innerHeight && __event.pageY > 0 )
      {
        current_style.top = ( current_id.top = __event.pageY - top_delta ) + 'px';
      }
      focus_catcher_focus();
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
        current_style.height = ( current_id.height = height ) + 'px';
        current_style.top = ( current_id.top = top ) + 'px';
        focus_catcher_focus();
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
        current_style.width = ( current_id.width = width ) + 'px';
        focus_catcher_focus();
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
        current_style.width = ( current_id.width = width ) + 'px';
        current_style.left = ( current_id.left = left ) + 'px';
        focus_catcher_focus();
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
        current_style.height = ( current_id.height = height ) + 'px';
        focus_catcher_focus();
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
      messages.post("hide-view", {id: win.getAttribute('ref_id')});
      win.parentElement.removeChild(win);
    }
  }
  
  this.showWindow = function(ref_id, title, content_template, top, left, width, height)
  {
    if( checkRefId( ref_id ))
    {
      return false;
    }
    if ( ref_id )
    {
      if( ids[ref_id] )
      {
        top = ids[ref_id].top;
        left = ids[ref_id].left;
        width = ids[ref_id].width;
        height = ids[ref_id].height;
      }
      else
      {
        ids[ref_id] = { top: 0, left: 0, width: 0, height: 0 };
      }
      current_id = ids[ref_id];
      messages.post("show-view", {id: ref_id});
    }
    var win = viewport.render(template(ref_id, title, content_template, top, left, width, height));
    setZIndex();
    win.style.zIndex = 200;
    return true;
  }

  var init = function(event)
  {
    document.removeEventListener('load', arguments.callee, false);
    viewport = document.getElementsByTagName('viewbox')[0];
    if(!viewport)
    {
      self.showWindow = function(){};
      opera.postError( 'missing view port in init in windows');
    }
    
  }

  document.addEventListener('mousedown', mousedown, false);
  document.addEventListener('click', mouseclick, false);
  window.addEventListener('load', init, false);
  
}