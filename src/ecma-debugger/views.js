
var cls = window.cls || ( window.cls = {} );

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

cls.EnvironmentView.prototype = ViewBase;
new cls.EnvironmentView('environment', ui_strings.M_VIEW_LABEL_ENVIRONMENT, 'scroll');

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
  }


);


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

cls.CallstackView.prototype = ViewBase;
new cls.CallstackView('callstack', ui_strings.M_VIEW_LABEL_CALLSTACK, 'scroll');


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
cls.GeneralView.prototype = ViewBase;
new cls.GeneralView('general', ui_strings.M_SETTING_LABEL_GENERAL, '');


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
  }
);

eventHandlers.change['set-ui-language'] = function(event)
{
  helpers.setCookie('ui-lang', event.target.value);
  helpers.setCookie('ui-lang-set', '1');
  location.reload();
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
cls.HostSpotlightView.prototype = ViewBase;
new cls.GeneralView('host-spotlight', ui_strings.S_LABEL_SPOTLIGHT_TITLE, '');

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
  }
);

eventHandlers.change['set-ui-language'] = function(event)
{
  helpers.setCookie('ui-lang', event.target.value);
  helpers.setCookie('ui-lang-set', '1');
  location.reload();
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

cls.DocumentationView.prototype = ViewBase;

new cls.DocumentationView('documentation', 'Documentation', '');
  
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
    ;
  }
  this.init(id, name, container_class);
}

cls.DebugRemoteSettingView.prototype = ViewBase;

new cls.DebugRemoteSettingView('debug_remote_setting', ui_strings.S_SWITCH_REMOTE_DEBUG, '');

new Settings
(
  // id
  'debug_remote_setting', 
  // key-value map
  {
    "debug-remote": false,
    "port": 7001
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
      return [
        ['setting-composite',
          ['label',
            ['input',
              'type', 'checkbox',
              'checked', setting.get('debug-remote'),
              'handler', 'toggle-remote-debug'
            ],
            setting.label_map['debug-remote']
          ],
          ['label',
            ui_strings.S_LABEL_PORT + ': ',
            ['input',
              'type', 'number',
              'min', '1',
              'max', '65535',
              'value', setting.get('port'),
              'disabled', !setting.get('debug-remote'),
              'handler', 'change-port-number-remote-debug',
              'current-port', setting.get('port').toString()
            ]
          ],
          ['input',
            'type', 'button',
            'disabled', 'disabled',
            'value', ui_strings.S_BUTTON_TEXT_APPLY,
            'handler', 'apply-remote-debugging'
          ],
          'class', 'apply-button'
        ]
      ];
    }
  }
);

eventHandlers.change['change-port-number-remote-debug'] = function(event, target)
{
  target.parentNode.nextSibling.disabled = target.getAttribute('current-port') == target.value;
}

eventHandlers.change['toggle-remote-debug'] = function(event, target)
{
  target.parentNode.nextSibling.childNodes[1].disabled = !event.target.checked; 
  target.parentNode.nextSibling.nextSibling.disabled = 
    event.target.checked == settings.debug_remote_setting.get('debug-remote') 
}

eventHandlers.click['apply-remote-debugging'] = function(event, target)
{
  var is_debug_remote = target.parentNode.getElementsByTagName('input')[0].checked;
  var port = parseInt(target.parentNode.getElementsByTagName('input')[1].value);
  if (typeof port == 'number')
  {
    if(0 < port && port <= 0xffff)
    {
      settings.debug_remote_setting.set('debug-remote', is_debug_remote);
      settings.debug_remote_setting.set('port', port);  
      // for older clients
      windows.helpers.setCookie('debug-remote', JSON.stringify(is_debug_remote));
      windows.helpers.setCookie('port', JSON.stringify(port));
      client.setup();
      target.disabled = (
        target.previousSibling.previousSibling.firstChild.checked == 
                      settings.debug_remote_setting.get('debug-remote'));
    }
    else
    {
      alert(ui_strings.S_INFO_NO_VALID_PORT_NUMBER);
      target.parentNode.getElementsByTagName('input')[1].value = port < 1 && 1 || 0xffff;
    }
  }

}

eventHandlers.click['cancel-remote-debug'] = function(event, target)
{
  settings.debug_remote_setting.set('debug-remote', false); 
  client.setup();
}




// TODO clean up

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


new ToolbarConfig
(
  'main-view',
  [
    {
      handler: 'reload-window',
      title: ui_strings.S_BUTTON_LABEL_RELOAD_HOST
    }
  ],
  null,
  null,
  [
    {
      handler: 'select-window',
      title: ui_strings.S_BUTTON_LABEL_SELECT_WINDOW,
      type: 'dropdown',
      class: 'window-select-dropdown',
      template: templates.windowSelect
    }
  ]
)

eventHandlers.click['reload-window'] = function(event, target)
{
  runtimes.reloadWindow();
}
