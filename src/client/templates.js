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
        ['span',
          ui_strings.S_BUTTON_TEXT_APPLY,
          'handler', 'apply-remote-debugging',
          'class', 'ui-button',
          'tabindex', '1'
        ]
      ],
      ['p',
        error || "",
        'id', 'remote-debug-info'
      ],
      'id', 'remote-debug-settings'
    ];
  };

  this.remote_debug_waiting_help = function(port)
  {
     return [
       ["p", ui_strings.S_REMOTE_DEBUG_GUIDE_WAITING_HEADER],
       ["ol",
         ["li", ui_strings.S_REMOTE_DEBUG_GUIDE_WAITING_STEP_1],
         ["li", ui_strings.S_REMOTE_DEBUG_GUIDE_WAITING_STEP_2],
         ["li", ui_strings.S_REMOTE_DEBUG_GUIDE_WAITING_STEP_3.replace("%s", port)],
         ["li", ui_strings.S_REMOTE_DEBUG_GUIDE_WAITING_STEP_4],
         ["li", ui_strings.S_REMOTE_DEBUG_GUIDE_WAITING_STEP_5]
       ]
     ]
  };

  this.remote_debug_waiting = function(port)
  {
    return [
      ["p",
        ui_strings.S_INFO_WAITING_FORHOST_CONNECTION.replace(/%s/, port)
      ],
      //["p",
      //  ["img",
      //    "src",
      //    "https://chart.googleapis.com/chart?chs=100x100&cht=qr&chl=opera%3Adebug&chld=L|0&choe=UTF-8",
      //    "width", "100",
      //    "height", "100"
      //  ]
      //],
      ["p",
        ["span",
          ui_strings.S_BUTTON_CANCEL_REMOTE_DEBUG,
          "handler",
          "cancel-remote-debug",
          "class", "ui-button",
          "tabindex", "1"
        ]
      ]
    ]
  };
}).apply(window.templates || (window.templates = {}));
