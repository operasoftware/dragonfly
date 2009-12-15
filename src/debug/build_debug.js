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
    debug.clear();
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

  eventHandlers.change['config-filter-msg-all'] = function(event, target)
  {
    var filter_target = event.target.getAttribute('data-filter-target');
    window.debug.set_filter(filter_target, 
      event.target.getAttribute('data-filter-type'), event.target.checked);
    if(filter_target == 'all')
    {
      window.views['configure-message-filters'].update();
    }
    else
    {
      var parent = event.target.parentNode.parentNode.parentNode.parentNode.parentNode;
      var div = parent.getElementsByTagName('div')[0];
      parent.removeChild(div);
      window.views['configure-message-filters'].show_configuration(
                    parent, parent.firstElementChild.getAttribute('data-service-name'));
    }
  }

  eventHandlers.change['config-filter-msg'] = function(event, target)
  {
    var 
    msg = event.target.getAttribute('data-filter-target'),
    parent = event.target.parentNode.parentNode.parentNode,
    type = parent.getAttribute('data-filter-type'),
    service = parent.getAttribute('data-service-name');

    window.debug.set_filter_message(service, type, msg, event.target.checked);
  }

  
  // 

/*
  var View = function(id, name, container_class)
  {




    this.createView = function(container)
    {
      container.render
      (
        ['div', 
          ['div',
            ['input', 
              'type', 'button', 
              'value', 'spotlight', 
              'onclick', "this.parentNode.parentNode.getElementsByTagName('textarea')[0].value='<spotlight-objects>\\n  <spotlight-object>\\n    <object-id>xx</object-id>\\n    <scroll-into-view>1</scroll-into-view>\\n    <box>\\n      <box-type>0</box-type>\\n      <fill-color>16711858</fill-color>\\n      <frame-color>4278190335</frame-color>\\n      <grid-color>0</grid-color>\\n    </box> \\n  </spotlight-object>\\n</spotlight-objects>';"],
            ['input', 
              'type', 'button', 
              'value', 'eval', 
              'onclick', "this.parentNode.parentNode.getElementsByTagName('textarea')[0].value='<eval>\\n  <tag>1</tag>\\n  <runtime-id></runtime-id>\\n  <thread-id></thread-id>\\n  <frame-id></frame-id>\\n  <script-data></script-data>\\n</eval>';"],
            ['input', 
              'type', 'button', 
              'value', 'set breakpoint', 
              'onclick', "this.parentNode.parentNode.getElementsByTagName('textarea')[0].value='<add-breakpoint>\\n  <breakpoint-id> x </breakpoint-id>\\n  <source-position>\\n    <script-id> x </script-id>\\n    <line-number> x </line-number>\\n  </source-position>\\n</add-breakpoint>';"],
            ['input', 
              'type', 'button', 
              'value', 'examine obj', 
              'onclick', "this.parentNode.parentNode.getElementsByTagName('textarea')[0].value='<examine-objects>\\n  <tag>1</tag>\\n  <runtime-id>x</runtime-id>\\n  <object-id>x</object-id>\\n</examine-objects>';"],
            ['input', 
              'type', 'button', 
              'value', 'post', 
              'style', 'margin-left:10px',
              'onclick', 'services[\'ecmascript-debugger\'].postCommandline()'],
          'style', 'text-align: right'],
          ['div', ['textarea'], 'id', 'command-line-debug-container'],
        'class', 'window-container', 'id', 'command-line-debug']
      )
      
    }



    this.init(id, name, container_class);
  }

  View.prototype = ViewBase;
  new View('commandline_debug', 'Commandline Debug', 'scroll');
  */
}