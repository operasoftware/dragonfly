(function()
{
  this.monospace_font_selection = function(setting)
  {
    var fonts = ["", "use-lang-def"].concat(window.defaults["monospace-fonts"]);
    return (
    ['setting-composite',
      ['table',
        this._font_selection(ui_strings.S_LABEL_FONT_SELECTION_FACE,
                             fonts,
                             'monospace-font-face',
                             {"": ui_strings.S_LABEL_DEFAULT_SELECTION}),
        this._font_selection(ui_strings.S_LABEL_FONT_SELECTION_SIZE,
                             ['10px', '11px', '12px', '13px',
                              '14px', '15px', '16px'],
                             'monospace-font-size'),
        this._font_selection(ui_strings.S_LABEL_FONT_SELECTION_LINE_HEIGHT,
                             ['auto', '14px', '15px', '16px', '17px',
                              '18px', '19px', '20px'],
                             'monospace-line-height'),
        'handler', 'font-selection'
      ],
      ['p',
        ['span',
          ['span', ui_strings.S_BUTTON_RESET_TO_DEFAULTS],
          'handler', 'font-defualt-selection',
          'class', 'ui-button',
          'tabindex', '1'
        ]
      ]
    ]);
  }

  this._font_selection = function(label, option_values, setting_name,
                                  option_names)
  {
    var selected = window.settings.monospacefont.get(setting_name);
    return (
    ['tr',
      ['td', ['label', label + ': ']],
      ['td',
        ['select',
          option_values.map(function(option_value)
          {
            var ret = ['option',
                        option_names && option_names[option_value] ||
                        option_value,
                        "value", option_value];
            if (selected == option_value)
            {
              ret.push('selected', 'selected');
            }
            return ret;
          }),
          'name', setting_name
        ]
      ]
    ]);
  };
}).apply(window.templates || (window.templates = {}));
