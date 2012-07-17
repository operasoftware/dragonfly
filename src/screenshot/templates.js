(function()
{
  this.screenshot_controls = function(color)
  {
  	return (
  	['div',
      ['p',
        ['span',
          ui_strings.S_BUTTON_UPDATE_SCREESHOT,
          'handler', 'screenshot-update',
          'class', 'ui-button',
          'tabindex', '1']],
      ['table',
        ['tr',
          ['td', ui_strings.S_LABEL_COLOR_PICKER_ZOOM + ':'],
          ['td', '100%'],
          ['td',
            ['input',
              'type', 'range',
              'min', '1', 'max', '30', 'step', '1',
              'handler', 'screenshot-zoom'],
            'class', 'selectable'],
          ['td', '3000%']],
        ['tr',
          ['td', ui_strings.S_LABEL_COLOR_PICKER_SAMPLE_SIZE + ':'],
          ['td', '1 x 1'],
          ['td',
            ['input',
              'type', 'range',
              'min', '1', 'max', '9', 'step', '2',
              'handler', 'screenshot-sample-size'],
            'class', 'selectable'],
          ['td', '9 x 9']]],
      ['div',
        this.sample_color(color),
        'class', 'screenshot-sample-container'],
        this._ruler_controls(),
      'class', 'padding screenshot-max-height']);
  };

  this._ruler_controls = function()
  {
    return (
    ['div',
      ['span',
            'Show ruler',
            'handler', 'screenshot-show-ruler',
            'class', 'ui-button',
            'tabindex', '1'],
      ['pre', 'class', 'screenshot-ruler-dimensions'],
      'class', 'screenshot-ruler']);
  };

  this.sample_color = function(color)
  {
    return (
    ['div',
      ['pre',
        ['span', 'RGB: '], color.getRGB().join(', ') + '\n',
        ['span', 'HSL: '], color.getHSL().join('%, ').replace('%', '') + '%\n',
        ['span', 'HEX: '], '#' + color.getHex() + '\n',
        'class', 'mono screenshot-sample-values selectable'],
      ['span',
            ui_strings.S_BUTTON_STORE_COLOR,
            'handler', 'screenshot-store-color',
            'data-color', color.getHex(),
            'class', 'ui-button',
            'tabindex', '1'],
      ['div',
        ['canvas'],
        'class', 'screenshot-sample-color',
        'style', 'background-color:' + color.hhex],
      'class', 'screenshot-sample-color-container']);
  };

  this.color_palette = function(color_palette)
  {
    return (
    [
      ['ul',
        color_palette.map(this.color_palette_item, this),
        'handler', 'color-palette-edit-color',
        'edit-handler', 'color-palette-edit-color',
        'class', 'color-palette mono'],
      ['p',
        ['span',
          ui_strings.M_CONTEXTMENU_ADD_COLOR,
          'handler', 'color-palette-add-color',
          'class', 'color-palette-add-button ui-button',
          'tabindex', '1']]]);

  };

  this.color_palette_item = function(item, index)
  {
    return (
    ['li',
      ['span',
        'class', 'color-palette-sample',
        'style', 'background-color: #' + item.color],
      '#' + item.color,
      'data-color-id', String(item.id),
      'class', 'color-palette-item']);
  };

}).apply(window.templates || (window.templates = {}));
