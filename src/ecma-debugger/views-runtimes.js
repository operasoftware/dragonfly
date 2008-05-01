(function()
{

  var RuntimeBaseView = function()
  {
    this.updateWindowDropdown = function(container)
    {
      var 
      select = this.getToolbarControl(container, 'select-window'),
      windows = runtimes.getWindows(),
      win = null,
      i = 0,
      markup = '<option value="-1"> - select a window - </option>';
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

  var RuntimeView = function(){};
  RuntimeView.prototype = new RuntimeBaseView();

  var templates = window.templates ? window.templates : ( window.templates = {} );
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

  var reload_button = 
  [
    {
      handler: 'reload-window',
      title: 'Reload selected window in the host'
    }
  ]

  var custum_controls =
  [
    {
      handler: 'select-window',
      title: 'Select which window you like to debug',
      type: 'dropdown',
      class: 'window-select-dropdown',
      template: templates.windowSelect
    }
  ]

  eventHandlers.change['select-window'] = function(event, target)
  {
    if(target.value)
    {
      host_tabs.setActiveTab(target.value);
    }
  }

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
      'selected-window': ''
    }, 
    // key-label map
    {
    },
    // settings map
    {
      checkboxes:
      [
      ]
    }
  );

  var View = null;

  /* scripts */

  View = function(id, name, container_class)
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
          runtimes.setSelectedRuntimeId(_runtimes[0]['runtime-id']);
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
    this.init(id, name, container_class);
  }

  View.prototype = new RuntimeView();

  new View('runtimes', 'Runtimes Script', 'scroll runtimes');

  new ToolbarConfig
  (
    'runtimes',
    reload_button,
    null,
    null,
    custum_controls
  )

  /* dom */

  View = function(id, name, container_class)
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
      if( msg.id == 'dom' )
      {
        topCell.showView(id);
      }
    }

    this.init(id, name, container_class);
    messages.addListener('runtime-selected', onRuntimeSelected);
    messages.addListener('view-created', onViewCreated);

    
  }

  View.prototype = new RuntimeView();

  new View('runtimes_dom', 'Runtimes DOM', 'scroll runtimes');

  new ToolbarConfig
  (
    'runtimes_dom',
    reload_button,
    null,
    null,
    custum_controls
  )

  /* css */

  View = function(id, name, container_class)
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
          runtimes.setSelectedRuntimeId(_runtimes[0]['runtime-id']);
          return;
        }
        

        for( ; ( rt = _runtimes[i] ) && !rt['unfolded-css']; i++);
        if( !rt && _runtimes[0] )
        {
          showStylesheets({}, _runtimes[0]['runtime-id']);
        }

        container.render(['div', 
          templates.runtimes(_runtimes, 'css', 'folder'), 
          'class', 'padding']);
      }
    }

    var showStylesheets = function(obj, rt_id)
    {
      // stylesheets.getStylesheets will call this function again if data is not avaible
      // handleGetAllStylesheets in stylesheets will 
      // set for this reason __call_count on the event object
      var sheets = stylesheets.getStylesheets(rt_id, arguments);
      if(sheets)
      {
        runtimes.setUnfolded(rt_id, 'css', true);
        if( !stylesheets.hasSelectedSheetRuntime(rt_id) && stylesheets.getStylesheets.length )
        {
          delete obj.__call_count;
          // stylesheets.getRulesWithSheetIndex will call this function again if data is not avaible
          // handleGetRulesWithIndex in stylesheets will 
          // set for this reason __call_count on the event object
          var rules = stylesheets.getRulesWithSheetIndex(rt_id, 0, arguments);
          if(rules)
          {
            stylesheets.setSelectedSheet(rt_id, 0, rules);
            topCell.showView(views.stylesheets.id);
            self.update();
          }
        }
        self.update();
      }
    }

    var onViewCreated = function(msg)
    {
      if( msg.id == 'stylesheets' )
      {
        topCell.showView(id);
      }
    }
    
    this.init(id, name, container_class);
    messages.addListener('view-created', onViewCreated);
  }

  View.prototype = new RuntimeView();

  new View('runtimes_css', 'Runtimes CSS', 'scroll runtimes');

  new ToolbarConfig
  (
    'runtimes_css',
    reload_button,
    null,
    null,
    custum_controls
  )

})()