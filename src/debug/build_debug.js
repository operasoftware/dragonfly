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
  window.cls.TestFramework.prototype = ViewBase; 
  cls.debug.Debug.prototype = 
  window.cls.debug.TestScopeMessages.prototype = 
  new window.cls.TestFramework();
  window.debug = new cls.debug.Debug('debug', 'Debug', 'scroll debug-container');
  new cls.debug.ConfigureMessgeFilters(
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
        handler: 'debug-clear-log',
        title: 'clear debug log'
      },
      {
        handler: 'configure-message-filters',
        title: 'Configure Message Filters'
      }
    ]
  )
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
      document.cookie = \
        key + "=" + encodeURIComponent(value) +
        "; expires=" + 
        ( new Date( new Date().getTime() + ( time || 360*24*60*60*1000 ) ) ).toGMTString() + 
        "; path=/";
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

  /**
   * Convenience function for loading a resource with XHR using the get method.
   * Will automatically append a "time" guery argument to avoid caching.
   * When the load is finished, callback will be invoced with context as its
   * "this" value
   */
  XMLHttpRequest.prototype.loadResource = function(url, callback, context)
  {
    this.onload = function()
    {
      callback(this, context);
    }
    this.open('GET', url);
    this.send(null);
  }
}
