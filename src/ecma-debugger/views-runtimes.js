//(function()
//{

var cls = window.cls || ( window.cls = {} );

/**
  * @constructor 
  * @extends ViewBase
  */

var RuntimeBaseView = function()
{
  this.updateWindowDropdown = function(container)
  {
    var 
    select = this.getToolbarControl(container, 'select-window'),
    windows = runtimes.getWindows(),
    win = null,
    i = 0,
    markup = '<option value="-1"> - ' + ui_strings.S_SELECT_WINDOW_EMPTY + ' - </option>';
    if(select)
    {
      for( ; win = windows[i]; i++ )
      {
        markup += '<option value="' + win.id + '"' + 
          ( win.is_selected ? ' selected="selected"' : '' ) + '>' + 
          ( win.title || win.uri ) + 
          '</option>';
      }
      select.innerHTML = markup;
    }
  }
}

RuntimeBaseView.prototype = ViewBase;

/**
  * @constructor 
  * @extends RuntimeBaseView
  */

var RuntimeView = function(){};
RuntimeView.prototype = new RuntimeBaseView();

var templates = window.templates || ( window.templates = {} );
templates.windowSelect = function()
{
  return [
    'window-select',
    [
      'select',
      'handler', this.handler
    ]
  ];
}

RuntimeBaseView.reload_button = 
[
  {
    handler: 'reload-window',
    title: ui_strings.S_BUTTON_LABEL_RELOAD_HOST
  }
]

RuntimeBaseView.custum_controls =
[
  {
    handler: 'select-window',
    title: ui_strings.S_BUTTON_LABEL_SELECT_WINDOW,
    type: 'dropdown',
    class: 'window-select-dropdown',
    template: templates.windowSelect
  }
]



eventHandlers.click['reload-window'] = function(event, target)
{
  runtimes.reloadWindow();
}

new Settings
(
  // id
  'runtimes', 
  // kel-value map
  {
    'selected-window': '',
    'reload-runtime-automatically': true
  }, 
  // key-label map
  {
    'reload-runtime-automatically': ui_strings.S_SWITCH_RELOAD_SCRIPTS_AUTOMATICALLY
  },
  // settings map
  {
    checkboxes:
    [
      'reload-runtime-automatically'
    ]
  }
);



  /****** scripts ******/

/**
  * @constructor 
  * @extends RuntimeView
  */

cls.RuntimesView = function(id, name, container_class)
{
  var self = this;

  this.createView = function(container)
  {
    this.updateWindowDropdown(container);
    container.innerHTML = '';

    var active_window_id = runtimes.getActiveWindowId();

    if( active_window_id )
    {
      var 
      _runtimes = runtimes.getRuntimes(active_window_id),
      rt = null, 
      i = 0;

      for( ; ( rt = _runtimes[i] ) && !rt['selected']; i++);
      if( !rt && _runtimes[0] )
      {
        // much too often called
        // opera.postError('setSelectedRuntimeId in runtimes view')
        //runtimes.setSelectedRuntimeId(_runtimes[0]['runtime-id']);
        return;
      }

      for( ; ( rt = _runtimes[i] ) && !rt['unfolded-script']; i++);
      if( !rt && _runtimes[0] )
      {
        _runtimes[0]['unfolded-script'] = true;
      }
      container.render(['div', 
        templates.runtimes(_runtimes, 'script', 'folder'), 
        'class', 'padding']);
    }
  }

  this.updateSelectedScript = function( target, script_id )
  {

    var 
    containers = self.getAllContainers(), 
    c = null , 
    i = 0, 
    old_target = null;

    for( ; c = containers[i]; i++)
    {
      if ( old_target = c.getElementsByClassName('selected')[0] )
      {
        old_target.removeClass('selected');
      }
    }
    target.addClass('selected');
  }

  var onThreadStopped = function(msg)
  {
    var script_id = msg.stop_at['script-id'];
    var containers = self.getAllContainers(), c = null , i = 0;
    var lis = null, li = null , k = 0;
    for( ; c = containers[i]; i++)
    {
      lis = c.getElementsByTagName('li');
      for( k = 0; li = lis[k]; k++)
      {
        if( li.getAttribute('script-id') == script_id )
        {
          li.style.backgroundPosition = '0 0';
          li.scrollIntoView();
          return;
        }
      }
    }
  }

  var onThreadContinue = function(msg)
  {
    var script_id = msg.stop_at['script-id'];
    var containers = self.getAllContainers(), c = null , i = 0;
    var lis = null, li = null , k = 0;
    for( ; c = containers[i]; i++)
    {
      lis = c.getElementsByTagName('li');
      for( k = 0; li = lis[k]; k++)
      {
        if( li.getAttribute('script-id') == script_id )
        {
          li.style.removeProperty('background-position');
          return;
        }
      }
    }
  }



  this.init(id, name, container_class);

  messages.addListener("thread-stopped-event", onThreadStopped);
  messages.addListener("thread-continue-event", onThreadContinue);
}

cls.RuntimesView.prototype = new RuntimeView();

new cls.RuntimesView('runtimes', ui_strings.M_VIEW_LABEL_SCRIPTS, 'scroll runtimes');

new ToolbarConfig
(
  'runtimes',
  RuntimeBaseView.reload_button,
  null,
  null,
  RuntimeBaseView.custum_controls
)

/****** dom ******/

/**
  * @constructor 
  * @extends RuntimeView
  */

cls.RuntimesDOMView = function(id, name, container_class)
{
  var self = this;

  this.createView = function(container)
  {
    this.updateWindowDropdown(container);
    container.innerHTML = '';

    var active_window_id = runtimes.getActiveWindowId();

    if( active_window_id )
    {
      var 
      _runtimes = runtimes.getRuntimes(active_window_id),
      rt = null, 
      i = 0;

      

      if( !dom_data.getDataRuntimeId() && _runtimes[0] )
      {
        dom_data.getDOM(_runtimes[0]['runtime-id']);
      }
      
      for( ; ( rt = _runtimes[i] ) && !rt['unfolded-dom']; i++);
      if( !rt && _runtimes[0] )
      {
        _runtimes[0]['unfolded-dom'] = true;
      }

      container.render(['div', 
        templates.runtimes(_runtimes, 'dom', 'folder'), 
        'class', 'padding']);
    }

  }

  this.updateSelectedRuntime = function(rt_id)
  {

    var containers = this.getAllContainers(), c = null , i = 0;
    var lis = null, li = null , k = 0;
    for( ; c = containers[i]; i++)
    {
      lis = c.getElementsByTagName('li');
      for( k = 0; li = lis[k]; k++ )
      {
        if( li.hasAttribute('runtime_id') )
        {
          if( li.getAttribute('runtime_id') == rt_id)
          {
            li.firstChild.addClass('selected-runtime');
            helpers.setSelected({target: li.parentNode.parentNode});
          }
          else
          {
            li.firstChild.removeClass('selected-runtime');
          }
        }
      }
    }
  }

  var onRuntimeSelected = function(msg)
  {
    if(self.isvisible())
    {
      self.updateSelectedRuntime(msg.id);
    }
    
  }

  var onViewCreated = function(msg)
  {
    if( !window.opera.attached && msg.id == 'dom' )
    {
      topCell.showView(id);
    }
  }

  this.init(id, name, container_class);
  messages.addListener('runtime-selected', onRuntimeSelected);
  messages.addListener('view-created', onViewCreated);

  
}

cls.RuntimesDOMView.prototype = new RuntimeView();

new cls.RuntimesDOMView('runtimes_dom', ui_strings.M_VIEW_LABEL_DOCUMENTS, 'scroll runtimes');

new ToolbarConfig
(
  'runtimes_dom',
  RuntimeBaseView.reload_button,
  null,
  null,
  RuntimeBaseView.custum_controls
)

/* css */

/**
  * @constructor 
  * @extends RuntimeView
  */

cls.RuntimesCSSView = function(id, name, container_class)
{
  var self = this;

  this.createView = function(container)
  {
    self.updateWindowDropdown(container);
    container.innerHTML = '';

    var active_window_id = runtimes.getActiveWindowId();

    if( active_window_id )
    {
      var 
      _runtimes = runtimes.getRuntimes(active_window_id),
      rt = null, 
      i = 0,
      selected = null,
      lis = null;

      for( ; ( rt = _runtimes[i] ) && !rt['unfolded-css']; i++);
      if( !rt && _runtimes[0] )
      {
        runtimes.setUnfolded(_runtimes[0]['runtime-id'], 'css', true);
      }

      container.render
      (
        ['div', 
          templates.runtimes(_runtimes, 'css', 'folder', arguments), 
          'class', 'padding'
        ]
      );

      if( !( selected = container.getElementsByClassName('selected')[0] ) )
      {
        lis = container.getElementsByTagName('li');
        i = 0;
        while( selected = lis[i++] )
        {
          if( selected.getAttribute('handler') == 'display-stylesheet' )
          {
            selected.releaseEvent('click');
            break;
          }
        }
      }
      if(selected)
      {
        delete container.__call_count;
      }
    }
  }

  var onViewCreated = function(msg)
  {
    if( !window.opera.attached && msg.id == 'stylesheets' )
    {
      topCell.showView(id);
    }
  }
  
  this.init(id, name, container_class);
  messages.addListener('view-created', onViewCreated);
}

cls.RuntimesCSSView.prototype = new RuntimeView();

new cls.RuntimesCSSView('runtimes_css', ui_strings.M_VIEW_LABEL_STYLESHEETS, 'scroll runtimes');

new ToolbarConfig
(
  'runtimes_css',
  RuntimeBaseView.reload_button,
  null,
  null,
  RuntimeBaseView.custum_controls
)

