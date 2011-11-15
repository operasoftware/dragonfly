window.cls || (window.cls = {});

/**
 * @constructor
 */
cls.ElementLayout = function()
{
  this._es_debugger = window.services['ecmascript-debugger'];
  this._stylesheets = cls.Stylesheets.get_instance();
  this._layout_map = [];
  this._selected_element = null;
  this._comp_style = null;
  this._offset_values = "";
  this._views = ['css-layout'];

  var PADDING_TOP = 0;
  var PADDING_RIGHT = 1;
  var PADDING_BOTTOM = 2;
  var PADDING_LEFT = 3;
  var BORDER_TOP_WIDTH = 4;
  var BORDER_RIGHT_WIDTH = 5;
  var BORDER_BOTTOM_WIDTH = 6;
  var BORDER_LEFT_WIDTH = 7;
  var MARGIN_TOP = 8;
  var MARGIN_RIGHT = 9;
  var MARGIN_BOTTOM = 10;
  var MARGIN_LEFT = 11;
  var WIDTH = 12;
  var HEIGHT = 13;
  var TOP = 14;
  var RIGHT = 15;
  var BOTTOM = 16;
  var LEFT = 17;
  var POSITION = 18;
  var Z_INDEX = 19;
  var BOX_SIZING = 20;
  var OFFSET_TOP = 1;
  var OFFSET_LEFT = 2;
  var OFFSET_WIDTH = 3;
  var OFFSET_HEIGHT = 4;
  var SCROLL_TOP = 5;
  var SCROLL_LEFT = 6;
  var SCROLL_WIDTH = 7;
  var SCROLL_HEIGHT = 8;
  var CLIENT_TOP = 9;
  var CLIENT_LEFT = 10;
  var CLIENT_WIDTH = 11;
  var CLIENT_HEIGHT = 12;
  var OFFSETS = cls.ElementLayout.OFFSETS;
  var GET_OFFSETS_SCRIPT = "\
    (function(ele)\
    {\
      var \
      parent = ele,\
      log = ele.nodeName + '|0;',\
      offsetParent = ele.offsetParent,\
      offsets =\
      [\
        '" + OFFSETS[OFFSET_TOP] + "',\
        '" + OFFSETS[OFFSET_LEFT] + "',\
        '" + OFFSETS[OFFSET_WIDTH] + "',\
        '" + OFFSETS[OFFSET_HEIGHT] + "',\
        '" + OFFSETS[SCROLL_TOP] + "',\
        '" + OFFSETS[SCROLL_LEFT] + "',\
        '" + OFFSETS[SCROLL_WIDTH] + "',\
        '" + OFFSETS[SCROLL_HEIGHT] + "',\
        '" + OFFSETS[CLIENT_TOP] + "',\
        '" + OFFSETS[CLIENT_LEFT] + "',\
        '" + OFFSETS[CLIENT_WIDTH] + "',\
        '" + OFFSETS[CLIENT_HEIGHT] + "'\
      ],\
      offset = '',\
      i = 0;\
      while ((parent = parent.parentNode) && parent.nodeType == 1)\
      {\
        if (parent == offsetParent)\
        {\
          log = parent.nodeName + '|1,' + log;\
          offsetParent = parent.offsetParent;\
        }\
        else\
        {\
          log = parent.nodeName + '|0,' + log;\
        }\
      };\
      for ( ; offset = offsets[i]; i++)\
      {\
        log += ele[offset] + ';';\
      }\
      return log;\
    })(ele)\
    ";

  this._setup_layout_map = function()
  {
    for (var i = 0, prop; prop = this._stylesheets.get_css_index_map()[i]; i++)
    {
      switch (prop)
      {
      case 'padding-top':
        this._layout_map[PADDING_TOP] = i;
        break;

      case 'padding-right':
        this._layout_map[PADDING_RIGHT] = i;
        break;

      case 'padding-bottom':
        this._layout_map[PADDING_BOTTOM] = i;
        break;

      case 'padding-left':
        this._layout_map[PADDING_LEFT] = i;
        break;

      case 'border-top-width':
        this._layout_map[BORDER_TOP_WIDTH] = i;
        break;

      case 'border-right-width':
        this._layout_map[BORDER_RIGHT_WIDTH] = i;
        break;

      case 'border-bottom-width':
        this._layout_map[BORDER_BOTTOM_WIDTH] = i;
        break;

      case 'border-left-width':
        this._layout_map[BORDER_LEFT_WIDTH] = i;
        break;

      case 'margin-top':
        this._layout_map[MARGIN_TOP] = i;
        break;

      case 'margin-right':
        this._layout_map[MARGIN_RIGHT] = i;
        break;

      case 'margin-bottom':
        this._layout_map[MARGIN_BOTTOM] = i;
        break;

      case 'margin-left':
        this._layout_map[MARGIN_LEFT] = i;
        break;

      case 'width':
        this._layout_map[WIDTH] = i;
        break;

      case 'height':
        this._layout_map[HEIGHT] = i;
        break;

      case 'top':
        this._layout_map[TOP] = i;
        break;

      case 'right':
        this._layout_map[RIGHT] = i;
        break;

      case 'bottom':
        this._layout_map[BOTTOM] = i;
        break;

      case 'left':
        this._layout_map[LEFT] = i;
        break;

      case 'position':
        this._layout_map[POSITION] = i;
        break;

      case 'z-index':
        this._layout_map[Z_INDEX] = i;
        break;

      case 'box-sizing':
        this._layout_map[BOX_SIZING] = i;
        break;
      }
    }
  };

  this._on_element_selected = function(msg)
  {
    this._comp_style = null;
    this._offset_values = "";
    this._selected_element = msg.rt_id && msg.obj_id
                           ? {rt_id: msg.rt_id,
                              obj_id: msg.obj_id,
                              model: msg.model}
                           : null;

    for (var i = 0, view_id; view_id = this._views[i]; i++)
    {
      window.views[view_id].update();
    }
  };

  this.has_selected_element = function()
  {
    return Boolean(this._selected_element);
  };

  this.get_layout_values = function(org_args)
  {
    if (!this._selected_element)
      return null;

    if (this._comp_style)
      return this._comp_style;

    var rt_id = this._selected_element.rt_id;
    var obj_id = this._selected_element.obj_id;

    if (this._stylesheets.has_stylesheets_runtime(rt_id))
    {
      var tag = tagManager.set_callback(null, this._handle_get_metrics_data.bind(this), [rt_id, obj_id, org_args]);
      this._es_debugger.requestCssGetStyleDeclarations(tag, [rt_id, obj_id]);
    }
    else
    {
      this._stylesheets.get_stylesheets(this._selected_element.rt_id, arguments);
    }
    return null;
  };

  this._handle_get_metrics_data = function(status, message, rt_id, obj_id, org_args)
  {
    var COMPUTED_STYLE_LIST = 0;
    var NODE_STYLE_LIST = 1;

    this._comp_style = message[COMPUTED_STYLE_LIST];
    if (!this._layout_map.length)
      this._setup_layout_map();

    if (org_args && !org_args[0].__call_count)
    {
      org_args[0].__call_count = 1;
      org_args.callee.apply(null, org_args)
    }
  };

  this.get_offset_values = function(cb)
  {
    if (!this._selected_element)
    {
      cb(null);
    }
    else if (this._offset_values)
    {
      cb(window.helpers.copy_object(this._offset_values));
    }
    else
    {
      var rt_id = this._selected_element.rt_id;
      var obj_id = this._selected_element.obj_id;
      var tag = tagManager.set_callback(null, this._handle_get_offset_data.bind(this), [rt_id, obj_id, cb] );
      this._es_debugger.requestEval(tag, [rt_id, 0, 0, GET_OFFSETS_SCRIPT, [['ele', obj_id]]]);
    }
  };

  this._handle_get_offset_data = function(status, message, rt_id, obj_id, cb)
  {
    var STATUS = 0;
    var VALUE = 2;
    if (message[STATUS] == 'completed')
    {
      this._offset_values = this._parse_offset_values(message[VALUE]);
      if (cb)
        cb(window.helpers.copy_object(this._offset_values));
    }
    else
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
        '_handle_get_offset_data failed')
    }
  };

  this._parse_offset_values = function(offset_values)
  {
    var data = offset_values.split(';');
    data[0] = data[0].split(',').map(function(item){
      return item.split('|');
    });
    return data;
  }

  this.get_metrics_template = function()
  {
    var is_positioned = this._comp_style[this._layout_map[POSITION]] != "static";
    return (
      ['div',
        [['ul',
          ['li',
            ['ul',
              [['li',['p','\u00A0',
                        ['span', is_positioned ? 'position' : '\u00A0']]],
              ['li', is_positioned ?
                     this._convert_to_unitless(this._comp_style[this._layout_map[TOP]])
                     : '\u00A0'],
              ['li']]
            ],
            ['ul',
              ['li', is_positioned ?
                     this._convert_to_unitless(this._comp_style[this._layout_map[LEFT]]) :
                     '\u00A0'],
              ['li',
              ['ul',
                ['li',['p','\u00a0',['span', 'margin']]],
                ['li', this._convert_to_unitless(this._comp_style[this._layout_map[MARGIN_TOP]])],
                ['li']
              ],
            ['ul', ['li', this._convert_to_unitless(this._comp_style[this._layout_map[MARGIN_LEFT]])], ['li',
              ['ul',
                ['li',['p','\u00a0',['span', 'border']]],
                ['li', this._convert_to_unitless(this._comp_style[this._layout_map[BORDER_TOP_WIDTH]])],
                ['li']
              ],
              ['ul', ['li', this._convert_to_unitless(this._comp_style[this._layout_map[BORDER_LEFT_WIDTH]])], ['li',
                ['ul',
                  ['li',['p','\u00a0',['span', 'padding']]],
                  ['li', this._convert_to_unitless(this._comp_style[this._layout_map[PADDING_TOP]])],
                  ['li']
                ],
                ['ul',
                  ['li', this._convert_to_unitless(this._comp_style[this._layout_map[PADDING_LEFT]])],
                  ['li',
                    ['ul', ['li', '\u00a0']],
                    ['ul', ['li', this._convert_to_unitless(this._comp_style[this._layout_map[WIDTH]], true) + ' × ' +
                                  this._convert_to_unitless(this._comp_style[this._layout_map[HEIGHT]], true)]],
                    ['ul', ['li', '\u00a0']],
                    'class', 'dimension'],
                  ['li', this._convert_to_unitless(this._comp_style[this._layout_map[PADDING_RIGHT]])]
                ],
                ['ul', [['li'],['li', this._convert_to_unitless(this._comp_style[this._layout_map[PADDING_BOTTOM]])],['li']]],
                'class', 'padding'], ['li', this._convert_to_unitless(this._comp_style[this._layout_map[BORDER_RIGHT_WIDTH]])]],
              ['ul', [['li'],['li', this._convert_to_unitless(this._comp_style[this._layout_map[BORDER_BOTTOM_WIDTH]])],['li']]],
              'class', 'border'], ['li', this._convert_to_unitless(this._comp_style[this._layout_map[MARGIN_RIGHT]])]],
            ['ul', [['li'],['li', this._convert_to_unitless(this._comp_style[this._layout_map[MARGIN_BOTTOM]])],['li']]],
            'class', 'margin'],
              ['li', is_positioned ?
                     this._convert_to_unitless(this._comp_style[this._layout_map[RIGHT]]) :
                     '\u00A0']],
          ['ul',
            [['li'],['li', is_positioned ?
                           this._convert_to_unitless(this._comp_style[this._layout_map[BOTTOM]]) :
                           '\u00A0'],['li']]],
          'class', is_positioned ? 'position' : ''],
        'class', this._comp_style[this._layout_map[BOX_SIZING]]]],
        ['table',
          ['tr',
            [['th', 'position:', 'data-spec', 'css#position'],
             ['td', this._comp_style[this._layout_map[POSITION]] || "–"]],
          ],
          ['tr',
            [['th', 'z-index:', 'data-spec', 'css#z-index'],
             ['td', this._comp_style[this._layout_map[Z_INDEX]] || "–"]],
          ],
          ['tr',
            [['th', 'box-sizing:', 'data-spec', 'css#box-sizing'],
             ['td', this._comp_style[this._layout_map[BOX_SIZING]] || "–"]],
          ],
          'id', 'layout-info'
        ]
      ]
    );
  };

  this._convert_to_unitless = function(value, no_replace)
  {
    switch (value)
    {
    case "auto":
      return value;
    case "0px":
      return no_replace ? "0" : "–";
    case "":
      return "–";
    default:
      return String(parseInt(value))
    }
  };

  window.messages.addListener('element-selected', this._on_element_selected.bind(this));
};

cls.ElementLayout.OFFSETS = [
  '',
  'offsetTop',
  'offsetLeft',
  'offsetWidth',
  'offsetHeight',
  'scrollTop',
  'scrollLeft',
  'scrollWidth',
  'scrollHeight',
  'clientTop',
  'clientLeft',
  'clientWidth',
  'clientHeight'
];

