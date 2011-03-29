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
      ['span', 'RGB: '], color.getRGB().join(', ') + '\n',
      ['span', 'HSL: '], color.getHSL().join('%, ').replace('%', '') + '%\n',
      ['span', 'HEX: '], '#' + color.getHex() + '\n',
      ['div',
        'class', 'screenshot-sample-color',
        'style', 'background-color:' + this._sample_color.hhex],
      'class', 'mono']);
  }



}).apply(window.templates || (window.templates = {}))