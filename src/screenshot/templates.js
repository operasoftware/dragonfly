(function()
{
  this.scrennshot_controls = function()
  {
  	return (
  	['div',
      ['table',
        ['tr',
          ['td', 'Zoom:'],
          ['td', '100%'],
          ['td',
            ['input',
              'type', 'range',
              'min', '1', 'max', '30', 'step', '1',
              'handler', 'screenshot-zoom']],
          ['td', '3000%']],
        ['tr',
          ['td', 'Sample Size:'],
          ['td', '1 x 1'],
          ['td',
            ['input',
              'type', 'range',
              'min', '1', 'max', '9', 'step', '2',
              'handler', 'screenshot-sample-size']],
          ['td', '9 x 9']]],
      ['p',
        ['button',
          'Update screenshot',
          'handler', 'screenshot-update',
          'class', 'container-button']],
      ['div', 'class', 'screenshot-sample-container'],
      'class', 'padding']);
  };

  this.sample_color = function(color)
  {
    return (
    ['pre',
      ['button',
            'Store color',
            'handler', 'screenshot-store-color',
            'data-color', color.getHex(),
            'class', 'container-button screenshot-store-color'],
      ['span', 'RGB: '], color.getRGB().join(', ') + '\n',
      ['span', 'HSL: '], color.getHSL().join('%, ').replace('%', '') + '%\n',
      ['span', 'HEX: '], '#' + color.getHex() + '\n',
      ['div',
        'class', 'screenshot-sample-color',
        'style', 'background-color:' + this._sample_color.hhex],
      'class', 'mono']);
  };

  this.color_palette = function(color_palette)
  {
    return (
    [
      ['ul',
        color_palette.map(this.color_palette_item, this),
        'handler', 'color-palette-edit-color',
        'class', 'color-palette mono'],
      ['p',
        ['button',
          'Add color',
          'handler', 'color-palette-add-color',
          'class', 'container-button color-palette-add-button']]]);

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
