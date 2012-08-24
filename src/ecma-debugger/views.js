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
    "about"

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
            authors.textContent = response_text;
          }
        });
        return ['ul', ['li', 'id', 'about-authors', 'class', 'padding selectable']];
      }
    },
    "about"
  );
}

/**
  * @constructor
  * @extends ViewBase
  * Settings are bound to a view. This class it only to have 'General Settings'.
  */

cls.GeneralView = function(id, name, container_class)
{
  this.is_hidden = true;
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
      "show-only-normal-and-gadget-type-windows": true,
      "shortcuts": null,
      "shortcuts-hash": "",
      "track-usage": true,
    },
    // key-label map
    {
      "show-views-menu": ui_strings.S_SWITCH_SHOW_VIEWS_MENU,
      "show-only-normal-and-gadget-type-windows": ui_strings.S_SWITCH_SHOW_ONLY_NORMAL_AND_GADGETS_TYPE_WINDOWS,
      "track-usage": ui_strings.S_SWITCH_TRACK_USAGE,
    },
    // settings map
    {
      checkboxes:
      [
        "show-only-normal-and-gadget-type-windows",
        "track-usage",
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
            ui_strings.M_LABEL_UI_LANGUAGE + ': ',
            [
              'select',
              templates.uiLangOptions(),
              'handler', 'set-ui-language'
            ],
            [
              "span", ui_strings.S_BUTTON_LOAD_PO_FILE,
              "handler", "show-po-selector",
              "class", "ui-button",
              "tabindex", "1"
            ]
          ]
        ];
      }
    },
    "general"
  );

  eventHandlers.click["show-po-selector"] = function(event)
  {
    UIWindowBase.showWindow('test-po-file');
  }

  eventHandlers.change['set-ui-language'] = function(event)
  {
    helpers.setCookie('ui-lang', event.target.value);
    helpers.setCookie('ui-lang-set', '1');
    var parent = event.target.parentNode;
    var container = parent.getElementsByClassName('change-ui-lang-info')[0] ||
                    parent.render(['div', 'class', 'change-ui-lang-info selectable']);
    var ui_str = ui_strings.S_LABEL_CHANGE_UI_LANGUAGE_INFO.split("%s");
    var tmpl =
    [
      ['h2',
        ui_str[0] + ' ',
        ['a',
          'opera:config#DeveloperTools|DeveloperToolsURL',
          'href', 'opera:config#DeveloperTools|DeveloperToolsURL',
          'target', '_blank'
        ],
        ' ' + ui_str[1]
      ],
      ['ul',
        ["", "cutting-edge/", "experimental/"].map(function(part)
        {
          return (
          ['li',
            ['code', "https://dragonfly.opera.com/app/"  + part + "client-" +
                     event.target.value + ".xml"]
          ]);
        }),
      ]
    ];
    container.clearAndRender(tmpl);
  };

}



/**
  * @constructor
  * @extends ViewBase
  * Settings are bound to a view. This class it only to have 'General Settings'.
  */

cls.HostSpotlightView = function(id, name, container_class)
{
  this.is_hidden = true;
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
      'spotlight-color': "3875d7",
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
  this.is_hidden = true;
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

        if (!settings.debug_remote_setting.get('debug-remote'))
        {
          Overlay.get_instance().set_info_content(
            [
              ["p", ui_strings.S_REMOTE_DEBUG_GUIDE_PRECONNECT_HEADER],
              ["ol",
                ["li", ui_strings.S_REMOTE_DEBUG_GUIDE_PRECONNECT_STEP_1],
                ["li", ui_strings.S_REMOTE_DEBUG_GUIDE_PRECONNECT_STEP_2]
              ]
            ]
          );

          return [
            ['setting-composite',
              window.templates.remote_debug_settings(setting.get('port'))
            ]
          ]
        }
        else
        {
          return ['setting-composite',
            ['span',
              ui_strings.S_BUTTON_CANCEL_REMOTE_DEBUG,
              'handler', 'cancel-remote-debug',
              'class', 'ui-button',
              'tabindex', '1'
            ]
          ]
        }
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
        window.helpers.setCookie('debug-remote', "true");
        window.helpers.setCookie('port', JSON.stringify(port));
        client.setup(true);
      }
      else
      {
        // TODO: fix string to show new min port number
        document.getElementById("remote-debug-info").textContent =
            ui_strings.S_INFO_NO_VALID_PORT_NUMBER.replace("%s", PORT_MIN)
                                                  .replace("%s", PORT_MAX);
        target.parentNode.getElementsByTagName('input')[0].value =
            port < PORT_MIN ? PORT_MIN : PORT_MAX;
      }
    }
  };

  eventHandlers.click['cancel-remote-debug'] = function(event, target)
  {
    Overlay.get_instance().hide();
    settings.debug_remote_setting.set('debug-remote', false);
    window.helpers.setCookie('debug-remote', "false");
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
  this.is_hidden = true;
  this.createView = function(container) {};
  this.init(id, name, container_class);
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
        handler: 'toggle-remote-debug-overlay',
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
    var window_id = Number(target.get_attr("parent-node-chain", "data-reload-window-id"));
    runtimes.reloadWindow(window_id);
  }
}
