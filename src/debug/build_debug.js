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

cls.debug.create_debug_environment = function(params)
{
  window.ini.debug = true;
  window.cls.TestFramework.prototype = ViewBase;
  cls.debug.Debug.prototype =
  window.cls.debug.TestScopeMessages.prototype =
  new window.cls.TestFramework();
  window.debug = new cls.debug.Debug('debug', 'Debug', 'scroll debug-container filter-container');
  var test_messages = new cls.debug.TestScopeMessages(
    'test-messages', 'Test Messages', 'scroll test-messages');

  eventHandlers.click['test-messages'] = test_messages.get_bound_click_handler();
  eventHandlers.change['test-messages'] = test_messages.get_bound_change_handler();
  new CompositeView('debug_new', 'Debug', {
      dir: 'h', width: 700, height: 700,
      children:
      [
        {
          tabs: ['debug', 'test-messages']
        }
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
        title: 'Clear debug log',
        text: 'Clear'
      },
      {
        handler: 'reload-dragonfly',
        title: 'Reload Dragonfly',
        text: 'Reload'
      },
      {
        handler: 'find-strings',
        title: 'Find untranslated strings',
        text: 'Find untranslated'
      },
    ]
  )
  new Switches
  (
    'debug',
    [
      'pretty-print-messages'
    ]
  );

  eventHandlers.click['find-strings'] = function(event, target)
  {
    for (var key in window.ui_strings) {
      window.ui_strings[key] = "# " + key + " #";
    }
    client.setup();
  }

  eventHandlers.click['reload-dragonfly'] = function(event, target)
  {
    window.location.reload();
  }

  eventHandlers.click['debug-clear-log'] = function(event, target)
  {
    window.debug.clear_log();
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
