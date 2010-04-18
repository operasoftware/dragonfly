window.cls || (window.cls = {});
cls.debug || (cls.debug = {});

cls.debug.wrap_transmit = function()
{
  opera._debug_wrap_scopeTransmit = opera.scopeTransmit;
  opera.scopeTransmit = function(service, message, command, tag)
  {
    window.debug.log_transmit(service, message, command, tag);
    opera._debug_wrap_scopeTransmit(service, message, command, tag);
  };
  cls.debug.wrap_transmit = function(){};
}

cls.debug.guess_message_map = function()
{
  var
  service = '',
  versions = null,
  version_arr = null,
  version = '',
  re_version = /^\d+\.\d+$/;

  for(service in window.message_maps)
  {
    version_arr = [];
    versions = window.message_maps[service];
    for(version in versions)
    {
      if(re_version.test(version))
      {
        version_arr.push(version);
      }
    }
    version_arr = version_arr.sort();
    if(version_arr.length)
    {
      window.message_maps[service] = versions[version_arr[version_arr.length - 1]];
      window.message_maps[service].versions = versions;
    }
  }
}

cls.debug.create_debug_environment = function(params)
{
  window.ini.debug = true;
  cls.debug.guess_message_map();
  window.cls.TestFramework.prototype = ViewBase;
  cls.debug.Debug.prototype =
  window.cls.debug.TestScopeMessages.prototype =
  new window.cls.TestFramework();
  window.debug = new cls.debug.Debug('debug', 'Debug', 'scroll debug-container');
  new cls.debug.ConfigureMessageFilters(
    'configure-message-filters', 'Message Filters', 'scroll filter-container');
  var test_messages = new cls.debug.TestScopeMessages(
    'test-messages', 'Test Messages', 'scroll test-messages');
  eventHandlers.click['test-messages'] = test_messages.get_bound_click_handler();
  eventHandlers.change['test-messages'] = test_messages.get_bound_change_handler();
  new CompositeView('debug_new', 'Debug', {
      dir: 'v', width: 700, height: 700,
      children:
      [
        { height: 200, tabs: ['debug', 'test-messages'] }
      ]
    });

  new Settings
  (
    // id
    'debug',
    // kel-value map
    {
      'show-as-tab': true,
      'pretty-print-messages': true
    },
    // key-label map
    {
      'show-as-tab': 'Show view in a tab',
      'pretty-print-messages': "Pretty print the scope messages",
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
        handler: 'debug-clear-log',
        title: 'Clear debug log'
      },
      {
        handler: 'configure-message-filters',
        title: 'Configure Message Filters'
      },
      {
        handler: 'reload-dragonfly',
        title: 'Reload Dragonfly'
      }
    ]
  )
  new Switches
  (
    'debug',
    [
      'pretty-print-messages',
    ]
  );

  eventHandlers.click['reload-dragonfly'] = function(event, target)
  {
    window.location.reload();
  }

  eventHandlers.click['debug-clear-log'] = function(event, target)
  {
    window.debug.clear_log();
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



  /**
   * Cookie handling functions
   */
  window.cookies = new function()
  {
    /**
     * Set a cookie named "key" to the value "value" with expiry in "time "
     * seconds. If time is not set, time out after a year
     */
    this.set = function(key, value, time)
    {
      document.cookie = (
        key + "=" + encodeURIComponent(value) +
        "; expires=" +
        ( new Date( new Date().getTime() + ( time || 360*24*60*60*1000 ) ) ).toGMTString() +
        "; path=/");
      return value;
    }

    /**
     * Get a cookie with name "key"
     */
    this.get = function(key)
    {
      var value = new RegExp(key + "=([^;]*)").exec(document.cookie);
      return value && decodeURIComponent(value[1]);
    }

  }

}
