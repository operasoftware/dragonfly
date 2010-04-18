window.templates = window.templates || {};

// TODO create text strings

window.templates.color_picker = function(
    screenshot_width, screenshot_height, scale, delta_scale)
{
  return (
    ['div',
        ['div',
          ['h2', ui_strings.M_VIEW_LABEL_COLOR_MAGNIFIER_AND_PICKER],
          ['p',
            ['label',
              ui_strings.S_LABEL_UTIL_SCALE + ': ',
              ['select',
                this.color_picker_create_dimension_select(screenshot_width, screenshot_height),
                'id', 'color-picker-area',
                'handler', 'update-area']
            ],
            ' ',
            ['label',
             ui_strings.S_LABEL_UTIL_SCALE + ': ',
              ['select',
                this.color_picker_create_scale_select(scale, delta_scale),
                'id', 'color-picker-scale',
                'handler', 'set-color-picker-scale']
            ],
          'class', 'controls'],
          ['p',
            ['input',
              'type', 'button',
              'value', ui_strings.S_BUTTON_COLOR_RESTORE_DEFAULTS,
              'handler', 'color-picker-reset-default-values'],
            'class', 'color-picker-button-controls'
          ],
          ['h2', ui_strings.M_VIEW_LABEL_STORED_COLORS],
          this.color_picker_stored_colors(),
          ['p',
            ['input',
              'type', 'button',
              'value', ui_strings.S_BUTTON_COLOR_MANAGE_STORED,
              'handler', 'color-picker-manage-stored-colors'],
            'class', 'color-picker-button-controls'
          ],
        'class', 'color-picker'],
        ['div',
          ['div',
            ['div',
              ['div',
                ['canvas'],
                ['canvas', 'handler', 'color-picker-picked', 'id', 'color-picker-mask'],
              'class', 'canvas-container'],
            'class', 'outer-canvas-container'],
            'id', 'table-container',
            'handler', 'color-picker-picked'],
        'class', 'color-picker'],
        ['div',
          ['h2', ui_strings.M_VIEW_LABEL_COLOR_SELECT],
          this.color_picker_average_select(),
          ['div', 'id', 'center-color'],
          ['pre', 'id', 'center-color-values'],
          ['p',
            ['input',
              'type', 'button',
              'value', ui_strings.S_BUTTON_COLOR_STORE_COLOR,
              'handler', 'color-picker-store-color'],
            'class', 'color-picker-button-controls'
          ],
        'class', 'color-picker'],
      'class', 'table padding']);
}

window.templates.color_picker_stored_colors = function()
{
  return (
  ['ul',
    (window.settings.color_picker.get('color-picker-stored-colors') || []).map(this.color_picker_stored_color, this),
    'class', 'color-picker-stored-colors',
    'handler', 'color-picker-set-stored-color'
  ]);

}

window.templates.color_picker_stored_color = function(color)
{
  return (
  ['li',
    'style', 'background-color: #'+ color,
    'data-stored-color', color
  ]);
}

window.templates.manage_stored_colors = function()
{
  return (
  ['div',
    ['div',
      ['h2', ui_strings.S_BUTTON_COLOR_MANAGE_STORED],
      ['ul',
        (window.settings.color_picker.get('color-picker-stored-colors') || []).map(this.color_picker_manage_stored_color, this),

      ],
      ['p',
        ['input',
        'type', 'button',
        'value', 'Done',
        'handler', 'color-picker-manage-stored-colors-done'],
        'class', 'color-picker-button-controls'
      ],
     'class', 'manage-stored-colors'
    ],
  'class', 'padding']);
}

window.templates.color_picker_manage_stored_color = function(color, index)
{
  return (
  ['li',
    ['span', 'style', 'background-color: #'+ color],
    ['input',
      'type', 'button',
      'value', 'delete',
      'handler', 'delete-stored-color'],
    'data-color-index', index.toString()
  ]);
}

window.templates.color_picker_average_select = function()
{
  var ret = [], i = 1, average = window.views.color_picker.get_average_dimension();
  for( ; i < 10; i+=2)
  {
    ret[ret.length] =
      ['option', i + ' x ' + i, 'value', i.toString()].
        concat(average == i ? ['selected', 'selected'] : []);
  }
  return (
    ['p',
      ['label', 'FIXMEAverage color of ',
        ['select', ret, 'handler', 'update-average'],
        ' pixels'],
    ]);
}

window.templates.color_picker_create_dimension_select = function(width, height)
{
  // width and height are the actual pixel values of the screenshot
  var
  ret = [],
  delta = 3,
  steps = 4,
  lower_lim = steps,
  min = Math.min(width, height),
  i = 0,
  w = 0,
  h = 0;

  while ((i = min - lower_lim * delta) < 1)
  {
    lower_lim--;
  }
  for( ; i <= min + steps * delta; i += delta)
  {
    // i is either of type width or height
    w = i * (min == width ? 1 : width / height)  >> 0;
    h = i * (min == width ? height / width : 1)  >> 0;
    ret[ret.length] =
      ['option', w + " x " + h , 'value', JSON.stringify({w: w, h: h})].
      concat(i == min ? ['selected', 'selected'] : []);
  }
  return ret;
}

window.templates.color_picker_create_scale_select = function(scale, delta)
{
  var
  ret = [],
  steps = 3,
  lower_lim = steps,
  i = delta;

  while ((i = scale - lower_lim * delta) < 1)
  {
    lower_lim--;
  }
  for( ; i <= scale + steps * delta; i += delta)
  {
    ret[ret.length] =
      ['option', i.toString()].
      concat(i == scale ? ['selected', 'selected'] : []);
  }
  return ret;
}
