(function()
{

  /**
    * Templates with svg_ prefix are meant to be used as part 
    * of an other svg template, e.g. the svg root element must already exist.
    */
  var get_id = (function()
  {
    var id_count = 0;
    return function()
    {
      return "svg-uid-" + (++id_count);
    };
  })();
  
  this.svg_stop = function(offset, stop_color, stop_opacity)
  {
    return (
    ['stop', 
      'offset', offset, 
      'stop-color', stop_color
    ].concat( stop_opacity ? ['stop-opacity', stop_opacity] : [] ));
  };

  this.svg_liner_gradient = function(id, colors, rotate)
  {
    var ret = ['linearGradient'];
    var count = colors.length - 1;
    ret.push(colors.map(function(color, index, colors)
    {
      return this.svg_stop((index / count * 100).toFixed(2) + '%', color);
    }, this));
    ret.push('id', id, 'gradientUnits', 'objectBoundingBox');
    if (rotate) ret.push('x1', '50%', 'y1', '100%', 'x2', '50%', 'y2', '0%');
    return ret;
  }
  
  this.svg_rect = function(x, y, width, height, rx, ry, fill, mask, id)
  {
    var ret = 
    ['rect', 
      'x', x.toString(), 
      'y', y.toString(), 
      'width', width.toString(), 
      'height', height.toString()
    ];
    if (rx) 
      ret.push('rx', rx.toString());
    if (ry) 
      ret.push('ry', ry.toString());
    if (fill) 
      ret.push('fill', fill);
    if (mask) 
      ret.push('mask', mask);
    if (id) 
      ret.push('id', id);
    return ret;
  };
  
  this.svg_liner_mask = function(id, rotate)
  {
    var grad_id = get_id();
    return ( 
    [
      this.svg_liner_gradient(grad_id, ['#fff', '#000'], rotate),
      ['mask',
        this.svg_rect(0, 0, '100%', '100%', 0, 0, 'url(#' + grad_id + ')'),
        'maskUnits', 'objectBoundingBox',
        'x', '0', 
        'y', '0',
        'width', '100%',  
        'height', '100%',
        'id', id
      ]
    ]);
  };
  
  this.svg_gradient = function(x, y, width, height, colors, rotate, mask)
  {
    var svg_defs = ['defs'];
    if (colors.length > 1)
    {
      var grad_id = get_id();
      svg_defs.push(this.svg_liner_gradient(grad_id, colors, rotate));
    }
    if (mask)
    {
      var mask_id = get_id();
      svg_defs.push(this.svg_liner_mask(mask_id, true));
    }
    return (
    [
      svg_defs,
      this.svg_rect(x, y, width, height, 0, 0, 
                    colors.length > 1 ? 'url(#' + grad_id + ')' : colors[0], 
                    mask ? 'url(#' + mask_id + ')' : false),
    ]); 
  };
  
  /**
    * To create an svg gradient.
    * @param {Array} colors. An array of css color values.
    * @param {Boolean} rotate. If turned on, the gradient will be 
    * turned by 90 degrees.
    * @param  {Boolean} mask. If turned on the gradient will be masked with 
    * an alpha gradient 0 - 1, turned by 90 degrees.
    * @param {Number} x. The x position. Defaults to 0.
    * @param {Number} y. The y position. Defaults to 0.
    * @param {Number} width. The width. Defaults to 100%.
    * @param {Number} height. The height. Defaults to 100%.
    */
  this.gradient = function(colors, rotate, mask, x, y, width, height)
  {
    x || (x = 0);
    y || (y = 0);
    width || (width = '100%');
    height || (height = '100%');
    
    return (
    ['svg:svg',
      this.svg_gradient(x, y, width, height, colors, rotate, mask),
      'viewBox', '0 0 100% 100%'
    ]);
  };
  
  /**
    * To create an 2d svg gradient, e.g a layer in a rgb color space.
    * @param {Array} top_colors. An array of css color values 
    * for top-left to top-right.
    * @param {Array} bottom_colors. An array of css color values 
    * for bottom-left to bottom-right.
    * @param {Number} x. The x position. Defaults to 0.
    * @param {Number} y. The y position. Defaults to 0.
    * @param {Number} width. The width. Defaults to 100%.
    * @param {Number} height. The height. Defaults to 100%.
    */
  this.gradient_2d = function(top_colors, bottom_colors, x, y, width, height)
  {
    x || (x = 0);
    y || (y = 0);
    width || (width = '100%');
    height || (height = '100%');
    
    return (
    ['svg:svg',
      this.svg_gradient(x, y, width, height, top_colors),
      this.svg_gradient(x, y, width, height, bottom_colors, false, true),
      'viewBox', '0 0 100% 100%'
    ]);
  };
  
  this.color_picker_inputs = function(z_axis)
  { 

    const COLORSPACE = 0, Z = 4;

    var 
    set_checked = function(colorspace)
    {
      if (colorspace[COLORSPACE][Z] == z_axis)
        colorspace.push('checked')
      return colorspace;
    },
    shv_inputs = 
    [
      ['s-v-h', 'h', 'H:', 'number', '°', '0', '360'],
      ['h-v-s', 's', 'S:', 'number', '%', '0', '100'],
      ['h-s-v', 'v', 'V:', 'number', '%', '0', '100'],
    ].map(set_checked),
    rgb_inputs = 
    [
      ['b-g-r', 'r', 'R:', 'number', null, '0', '255'],
      ['b-r-g', 'g', 'G:', 'number', null, '0', '255'],
      ['r-g-b', 'b', 'B:', 'number', null, '0', '255'],
    ].map(set_checked),
    hex_inputs =
    [
      [null, 'hex', '#', 'text'],
    ];
    
    return (
    ['form', 
      ['table', 
        shv_inputs.map(this.color_picker_inputs_row, this),
        ['tr', ['td', 'class', 'color-picker-spacer', 'colspan', '4']],
        rgb_inputs.map(this.color_picker_inputs_row, this),
        ['tr', ['td', 'class', 'color-picker-spacer', 'colspan', '4']],
        hex_inputs.map(this.color_picker_inputs_row, this),
        'class', 'color-picker-inputs'
      ]
    ]);
  };
  
  this.color_picker_inputs_row = function(input, index)
  {
    const 
    COLOR_SPACE = 0, 
    METHOD = 1, 
    LABEL = 2, 
    TYPE = 3, 
    UNITS = 4, 
    MIN = 5, 
    MAX = 6,
    CHECKED = 7;
    
    return (
    ['tr', 
      ['td',
        input[COLOR_SPACE] ? 
        ['input', 
          'type', 'radio', 
          'name', 'color-space', 
          'value', input[COLOR_SPACE]
        ].concat(input[CHECKED] ? ['checked', 'checked'] : []) :
        []
      ],
      ['td', input[LABEL]], 
      ['td',
        ['input', 
          'name', input[METHOD], 
          'type', input[TYPE],
          'class', 'color-picker-' + input[TYPE], 
        ].concat(input[MIN] ? ['min', input[MIN], 'max', input[MAX]] : []),
      ].concat(input[UNITS] ? [] : ['colspan', '2']),
      input[UNITS] ? ['td', input[UNITS]] : []
    ])
  }

  this.slider_focus_catcher = function()
  {
    return (
    ['input', 'style', 'display: block; ' +
                       'position:absolute; ' +
                       'left: -1000px; ' +
                       'top:0; ' +
                       'width: 10px;'
    ]);
  }
  
  this.color_picker_popup = function(existing_color, cp_class, cp_2d_class, 
                                     cp_1d_class, cp_old_class, cp_new_class,
                                     z_axis, cp_alpha_class, cp_alpha_bg)
  {
    var has_alpha = typeof existing_color.alpha == "number";
    return (
    ['div',
      ['div',
        ['div', 'class', 'height-100'],
        'data-handler', 'onxy',
        'class', cp_2d_class
      ],
      ['div',
        ['div', 'class', 'height-100'],
        'data-handler', 'onz',
        'class', cp_1d_class
      ],
      window.templates.color_picker_inputs(z_axis), 
      has_alpha ? 
      ['svg:svg',
        this.svg_rect(0, 0, 100, 36, 0, 0, "#000"), 
        ['path', 
          'd', 'M 50 0 l -50 0 l 0 36 l 50 -36 l 50 0 l -50 36 z',
          'fill', '#fff', 
        ],
        'viewBox', '0 0 100px 36px',
        'class', 'color-sample-alpha-bg'
      ] : [],
      ['div', 
        'class', cp_old_class, 
        'data-color', 'cancel',
        'style', 'background-color:' + existing_color.rgba
      ],
      ['div', 'class', cp_new_class],
      has_alpha ?
      ['div',
        ['div', 'class', 'height-100'],
        'data-handler', 'onalpha',
        'class', cp_alpha_class
      ] : [],
      has_alpha ?
      ['div',
        ['label',
          'alpha: ',
          ['input', 
            'name', 'alpha', 
            'type', 'number', 
            'min', '0', 
            'max', '1',
            'step', '0.01',
            'class', cp_alpha_bg, 
          ],
        ],
        'class', 'color-picker-input-alpha'
      ]: [],
      'class', cp_class + (has_alpha ? ' alpha' : '')
    ]);
  }

  this.svg_slider_z = function(rotate)
  {
    return (
    ['svg:svg',
        ['path', 
          'd', rotate ? 
               'M 0.5 0.5 l 18 0 l 0 6 l -9 12 l -9 -12 z' :
               'M 0.5 0.5 l 0 18 l 6 0 l 12 -9 l -12 -9 z',
          'fill', 'hsl(0, 0%, 70%)', 
          'stroke', '#000', 
          'stroke-width', '1'
        ],
        ['path', 
          'd', rotate ?
               'M 0.5 79.5 l 18 0 l 0 -6 l -9 -12 l -9 12 z' : 
               'M 79.5 0.5 l 0 18 l -6 0 l -12 -9 l 12 -9 z', 
          'fill', 'hsl(0, 0%, 70%)', 
          'stroke', '#000', 
          'stroke-width', '1'
        ],
      'viewBox', rotate ? '0 0 20 80' : '0 0 80 20'
    ]);
  }
  
  this.slider = function(slider_base_class, slider_class, slider_template)
  {
    return (
    ['div',
      ['div',
        slider_template || this.svg_slider_z(),
        'class', slider_class
      ],
      'class', slider_base_class
    ]);
  }

  this.svg_slider_circle = function()
  {
    return (
    ['svg:svg',
      ['circle', 
        'cx', '10', 
        'cy', '10', 
        'r', '9.5', 
        'fill', 'none', 
        'stroke', 
        'hsl(0, 0%, 20%)', 
        'stroke-width', '1'
      ],
      'viewBox', '0 0 20 20'
    ]);
  }
  
  this.pointer = function(pointer_class)
  {
    return (
    ['div',
      this.svg_slider_circle(),
      'class', pointer_class
    ]);
  }
  
}).apply(window.templates || (window.templates = {}));
