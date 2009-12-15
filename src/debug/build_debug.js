window.cls || (window.cls = {});
cls.debug || (cls.debug = {});

cls.debug.wrap_transmit = function()
{
  opera._scopeTransmit = opera.scopeTransmit;
  opera.scopeTransmit = function(service, message, command, tag)
  {
    window.debug.log_transmit(service, message, command, tag);
    opera._scopeTransmit(service, message, command, tag);
  };
}

cls.debug.create_debug_environment = function(params)
{
  window.ini.debug = true;
  window.debug = new cls.debug.Debug('debug', 'Debug', 'scroll debug-container');
  new cls.debug.ConfigureMessgeFilters('configure-message-filters', 
                      'Message Filters', 'scroll filter-container');
  new CompositeView('debug_new', 'Debug', {
      dir: 'v', width: 700, height: 700,
      children: 
      [
        { height: 200, tabs: ['debug'] }
      ]
    });
  
  
  new Settings
  (
    // id
    'debug', 
    // kel-value map
    {
      'show-as-tab': true
    }, 
    // key-label map
    {
      'show-as-tab': 'Show view in a tab',
    },
    // settings map
    {
      checkboxes:
      [

      ]
    }
  );
  new ToolbarConfig
  (
    'debug',
    [
      {
        handler: 'clear-debug-view',
        title: 'clear debug log'
      },
      {
        handler: 'export-debug-log',
        title: 'export debug log'
      },
      {
        handler: 'configure-message-filters',
        title: 'Configure Message Filters'
      }
    ]
  )
  new Switches
  (
    'debug',
    [
      'show-as-tab'
    ]
  )
  eventHandlers.click['clear-debug-view'] = function(event, target)
  {
    debug.clear_log();
  }
  eventHandlers.click['export-debug-log'] = function(event, target)
  {
    debug.export_data();
  }

  eventHandlers.click['configure-message-filters'] = function(event, target)
  {
    UIWindowBase.showWindow('configure-message-filters');
  }

  eventHandlers.click['toggle-filter-messages'] = function(event, target)
  {
    var
    parent = event.target.parentNode,
    view = window.views['configure-message-filters'],
    service = event.target.getAttribute('data-service-name');
    unfold_container = parent.getElementsByTagName('div')[0];

    view.set_unfold(service, !unfold_container);
    if(unfold_container)
    {
      parent.removeChild(unfold_container);
      parent.removeClass('open');
    }
    else
    {
      view.show_configuration(parent, service);
      parent.addClass('open');
    }
  }

  eventHandlers.change['config-filter-msg'] = function(event, target)
  {
    var 
    parent = event.target.parentNode.parentNode.parentNode,
    msg = event.target.getAttribute('data-filter-target'),
    type = parent.getAttribute('data-filter-type'),
    service = parent.getAttribute('data-service-name');

    window.debug.set_log_filter(service, type, msg, event.target.checked);
    if(msg == 'all')
    {
      if(service == 'all')
      {
        window.views['configure-message-filters'].update();
      }
      else
      {
        parent = parent.parentNode.parentNode;
        var div = parent.getElementsByTagName('div')[0];
        parent.removeChild(div);
        window.views['configure-message-filters'].show_configuration(parent, service);
      }
    }
  }
}
