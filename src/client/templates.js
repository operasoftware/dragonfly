(function()
{
  this.remote_debug_settings = function(port, error)
  {
    const PORT_MIN = 1024;
    const PORT_MAX = 65535;
    return [
      ['label',
        ui_strings.S_LABEL_PORT + ': ',
        ['input',
          'type', 'number',
          'min', PORT_MIN,
          'max', PORT_MAX,
          'value', Math.min(PORT_MAX, Math.max(port, PORT_MIN))
        ],
        ['input',
          'type', 'button',
          'value', ui_strings.S_BUTTON_TEXT_APPLY,
          'handler', 'apply-remote-debugging'
        ]
      ],
      ['p',
        error || "",
        'id', 'remote-debug-info'
      ],
      'id', 'remote-debug-settings'
    ];
  };
}).apply(window.templates || (window.templates = {}));
