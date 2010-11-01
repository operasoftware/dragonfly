window.cls || (window.cls = {});

/**
  * @constructor 
  * @extends ViewBase
  */

cls.EnvironmentView = function(id, name, container_class)
{
  var self = this;
  this.createView = function(container)
  {
    container.innerHTML = '';
    container.render(templates.hello(window.services['scope'].get_hello_message()));
  }
  this.init(id, name, container_class);
}

cls.EnvironmentView.create_ui_widgets = function()
{
  new Settings
  (
    // id
    'environment', 
    // key-value map
    {
      'environment': true
    }, 
    // key-label map
    {
    },
    // settings map
    {
      customSettings:
      [
        'environment'
      ]
    },
    // template
    {
      environment:
      function(setting)
      {
        return templates.hello(window.services['scope'].get_hello_message());
      }
    },
    "general"

  );
};

cls.AboutView = function(id, name, container_class)
{
  this.init(id, name, container_class);
}

cls.AboutView.create_ui_widgets = function()
{
  new Settings
  (
    // id
    'about', 
    // key-value map
    {
      'about': true
    }, 
    // key-label map
    {
    },
    // settings map
    {
      customSettings:
      [
        'about'
      ]
    },
    // template
    {
      about:
      function(setting)
      {
        new XMLHttpRequest().loadResource('AUTHORS', function(xml)
        {
          var 
          authors = document.getElementById('about-authors'),
          response_text = xml.responseText;
          if(authors && response_text)
          {
            authors.render(['pre', response_text]);
          }
        });
        return ['ul', ['li', 'id', 'about-authors']];
      }
    },
    "about"
  );
}


/**
  * @constructor 
  * @extends ViewBase
  */

cls.CallstackView = function(id, name, container_class)
{
  var container_id = 'backtrace';
  var __clear_timeout = 0;

  var __clearView = function()
  {
    var container = document.getElementById(container_id);
    if( container ) 
    {
      container.innerHTML = ''; 
      __clear_timeout = 0;
    }
  }

  this.createView = function(container)
  {
    var list = container.getElementsByTagName('ul')[0];
    if(!list)
    {
      container.innerHTML = "<div id='backtrace-container'><ul id='backtrace'></ul></div>"; // TODO clean up
      list = container.getElementsByTagName('ul')[0];
    }

    if( __clear_timeout )
    {
      __clear_timeout = clearTimeout( __clear_timeout );
    }
    var _frames = stop_at.getFrames(), frame = null, i = 0;
    list.innerHTML = '';
    for( ; frame = _frames[i]; i++)
    {
      list.render(templates.frame(frame, i == 0));
    }
    
  }

  this.clearView = function()
  {
    __clear_timeout = setTimeout( __clearView, 150 );
  }

  this.init(id, name, container_class);
}

/**
  * @constructor 
  * @extends ViewBase
  * Settings are bound to a view. This class it only to have 'General Settings'.
  */

cls.GeneralView = function(id, name, container_class)
{
  this.ishidden_in_menu = true;
  this.createView = function(container)
  {
  }
  this.init(id, name, container_class);
}

cls.GeneralView.create_ui_widgets = function()
{
  new Settings
  (
    // id
    'general', 
    // key-value map
    {
      "show-views-menu": false,
      "window-attached": true,
      "show-only-normal-and-gadget-type-windows": true
    }, 
    // key-label map
    {
      "show-views-menu": ui_strings.S_SWITCH_SHOW_VIEWS_MENU,
      "show-only-normal-and-gadget-type-windows": ui_strings.S_SWITCH_SHOW_ONLY_NORMAL_AND_GADGETS_TYPE_WINDOWS
    },
    // settings map
    {
      checkboxes:
      [
        "show-only-normal-and-gadget-type-windows"
      ],
      customSettings:
      [
        'hr',
        'ui-language'
      ]
    },
    // custom templates
    {
      'hr':
      function(setting)
      {
        return ['hr'];
      },
      'ui-language':
      function(setting)
      {
        return [
          ['setting-composite',
            'User Interface Language' + ': ',
            [
              'select',
              templates.uiLangOptions(),
              'handler', 'set-ui-language'
            ]
          ]
        ];
      }
    },
    "general"
  );

  eventHandlers.change['set-ui-language'] = function(event)
  {
    helpers.setCookie('ui-lang', event.target.value);
    helpers.setCookie('ui-lang-set', '1');
    location.reload();
  };

}



/**
  * @constructor 
  * @extends ViewBase
  * Settings are bound to a view. This class it only to have 'General Settings'.
  */

cls.HostSpotlightView = function(id, name, container_class)
{
  this.ishidden_in_menu = true;
  this.createView = function(container)
  {
  }
  this.init(id, name, container_class);
}

cls.HostSpotlightView.create_ui_widgets = function()
{
  new Settings
  (
    // id
    'host-spotlight', 
    // key-value map
    {

    }, 
    // key-label map
    {

    },
    // settings map
    {
      checkboxes:
      [

      ],
      customSettings:
      [
        'colors'
      ]
    },
    // custom templates
    {
      'colors':
      function(setting)
      {
        return hostspotlighter.colorSelectsTemplate();
      }
    },
    "document"
  );
}


  
/**
  * @constructor 
  * @extends ViewBase
  * Settings are bound to a view. This class it only to have 'General Settings'.
  */

cls.DocumentationView = function(id, name, container_class)
{
  var __url = '';
  this.setURL = function(url)
  {
    __url = url;
  }
  this.createView = function(container)
  {
    if( __url )
    {
      container.render(['iframe',
                        'width', '100%', 'height', '100%',
                        'style', 'dispaly:block;border:none',
                        'src', __url])
    }

  }
  this.init(id, name, container_class);
}

/**
  * @constructor 
  * @extends ViewBase
  * Settings are bound to a view. This class it only to have 'Debug Remote Setting'.
  */

cls.DebugRemoteSettingView = function(id, name, container_class)
{
  this.ishidden_in_menu = true;
  this.createView = function(container)
  {
    
  };
  this.init(id, name, container_class);
}

cls.DebugRemoteSettingView.create_ui_widgets = function()
{
  const PORT_DEFAULT = 7001;
  const PORT_MIN = 1024;
  const PORT_MAX = 65535;

  new Settings
  (
    // id
    'debug_remote_setting',
    // key-value map
    {
      "debug-remote": false,
      "port": PORT_DEFAULT
    },
    // key-label map
    {
      "debug-remote": ui_strings.S_SWITCH_REMOTE_DEBUG
    },
    // settings map
    {
      customSettings:
      [
        'debug-remote'
      ]
    },
    // custom templates
    {
      'debug-remote':
      function(setting)
      {
        return (
            !settings.debug_remote_setting.get('debug-remote')
            ?
              [
                ['setting-composite',
                  ['label',
                    ui_strings.S_LABEL_PORT + ': ',
                    ['input',
                      'type', 'number',
                      'min', PORT_MIN,
                      'max', PORT_MAX,
                      'value', setting.get('port'),
                      'current-port', setting.get('port').toString()
                    ]
                  ],
                  ['input',
                    'type', 'button',
                    'value', ui_strings.S_BUTTON_TEXT_APPLY,
                    'handler', 'apply-remote-debugging'
                  ],
                  ['p',
                   'id', 'remote-debug-info'
                  ],
                  'class', 'apply-button'
                ]
              ]
            :
              ['setting-composite',
                ['input',
                  'type', 'button',
                  'value', "Cancel",
                  'handler', 'cancel-remote-debug'
                ]
              ]
        );
      }
    },
    "remote_debug"
  );

  eventHandlers.click['apply-remote-debugging'] = function(event, target)
  {
    var port = parseInt(target.parentNode.getElementsByTagName('input')[0].value);
    if (typeof port == 'number')
    {
      if (PORT_MIN <= port && port <= PORT_MAX)
      {
        settings.debug_remote_setting.set('debug-remote', true);
        settings.debug_remote_setting.set('port', port);
        // for older clients
        window.helpers.setCookie('debug-remote', JSON.stringify(is_debug_remote));
        window.helpers.setCookie('port', JSON.stringify(port));
        window.topCell.showView('dom');
        client.setup();
      }
      else
      {
        // TODO: fix string to show new min port number
        document.querySelector("#remote-debug-info").textContent = ui_strings.S_INFO_NO_VALID_PORT_NUMBER;
        target.parentNode.getElementsByTagName('input')[0].value = port < PORT_MIN ? PORT_MIN : PORT_MAX;
      }
    }
  };

  eventHandlers.click['cancel-remote-debug'] = function(event, target)
  {
    settings.debug_remote_setting.set('debug-remote', false);
    window.helpers.setCookie('debug-remote', false);
    client.setup();
  };
};

/**
  * @constructor
  * @extends ViewBase
  * Settings are bound to a view. This class it only to have 'General Settings'.
  */

cls.ModebarView = function(id, name, container_class)
{
  this.ishidden_in_menu = true;
  this.createView = function(container) {};
  this.init(id, name, container_class);
};

cls.ModebarView.create_ui_widgets = function()
{
  new Settings
  (
    // id
    'modebar',
    // key-value map
    {
      "show-modebar": true
    },
    // key-label map
    {
      "show-modebar": "Show modebar"
    },
    // settings map
    {
      checkboxes:
      [
        "show-modebar"
      ]
    },
    // custom templates
    null,
    "general"
  );
};


cls.MainView = function(){};

cls.MainView .create_ui_widgets = function()
{

  // TODO clean up
  
  new ToolbarConfig
  (
    'main-view',
    [
      {
        handler: 'toggle-console',
        title: ui_strings.S_BUTTON_TOGGLE_CONSOLE
      },
      {
        handler: 'toggle-settings-overlay',
        title: ui_strings.S_BUTTON_TOGGLE_SETTINGS
      },
      {
        handler: 'toggle-remote-debug-config-overlay',
        title: ui_strings.S_BUTTON_TOGGLE_REMOTE_DEBUG
      }
    ],
    null,
    null,
    [
      //{
      //  handler: 'select-window',
      //  title: ui_strings.S_BUTTON_LABEL_SELECT_WINDOW,
      //  type: 'dropdown',
      //  class: 'window-select-dropdown',
      //  template: function()
      //  {
      //    return (
      //    ['window-select',
      //      [
      //        'select',
      //        'handler', this.handler
      //      ]
      //    ]);
      //  }
      //}
    ]
  )

  eventHandlers.click['reload-window'] = function(event, target)
  {
    runtimes.reloadWindow();
  }
}
