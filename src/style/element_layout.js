window.cls || (window.cls = {});

/**
  * @constructor 
  */

cls.ElementLayout = function()
{
  this._stylesheets = cls.Stylesheets.get_instance();

  const
  PADDING_TOP = 0,
  PADDING_RIGHT = 1,
  PADDING_BOTTOM = 2,
  PADDING_LEFT = 3,
  BORDER_TOP_WIDTH = 4,
  BORDER_RIGHT_WIDTH = 5,
  BORDER_BOTTOM_WIDTH = 6,
  BORDER_LEFT_WIDTH = 7,
  MARGIN_TOP = 8,
  MARGIN_RIGHT = 9,
  MARGIN_BOTTOM = 10,
  MARGIN_LEFT = 11,
  WIDTH = 12,
  HEIGHT = 13,
  TOP = 14,
  RIGHT = 15,
  BOTTOM = 16,
  LEFT = 17,
  POSITION = 18,
  Z_INDEX = 19,
  BOX_SIZING = 20,
  OFFSET_TOP= 1,
  OFFSET_LEFT= 2,
  OFFSET_WIDTH= 3,
  OFFSET_HEIGHT= 4,
  SCROLL_TOP= 5,
  SCROLL_LEFT= 6,
  SCROLL_WIDTH= 7,
  SCROLL_HEIGHT= 8,
  CLIENT_TOP= 9,
  CLIENT_LEFT= 10,
  CLIENT_WIDTH= 11,
  CLIENT_HEIGHT= 12,
  OFFSETS = cls.ElementLayout.OFFSETS,
  /*
  cls.ElementLayout.OFFSETS =
  [
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
  */
  GET_OFFSETS_SCRIPT = "\
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
      while( ( parent = parent.parentNode ) && parent.nodeType == 1 )\
      {\
        if(parent == offsetParent)\
        {\
          log = parent.nodeName + '|1,' + log;\
          offsetParent = parent.offsetParent;\
        }\
        else\
        {\
          log = parent.nodeName + '|0,' + log;\
        }\
      };\
      for( ; offset = offsets[i]; i++)\
      {\
        log += ele[offset] + ';';\
      }\
      return log;\
    })(ele)\
    ";
  var layout_map = [];
  
  var setup_layout_map = function()
  {
    var prop = '', i = 0;
    for (; prop = css_index_map[i]; i++)
    {
      switch(prop)
      {
        case 'padding-top':
        {
          layout_map[PADDING_TOP] = i;
          break;
        }
        case 'padding-right':
        {
          layout_map[PADDING_RIGHT] = i;
          break;
        }
        case 'padding-bottom':
        {
          layout_map[PADDING_BOTTOM] = i;
          break;
        }
        case 'padding-left':
        {
          layout_map[PADDING_LEFT] = i;
          break;
        }
        case 'border-top-width':
        {
          layout_map[BORDER_TOP_WIDTH] = i;
          break;
        }
        case 'border-right-width':
        {
          layout_map[BORDER_RIGHT_WIDTH] = i;
          break;
        }
        case 'border-bottom-width':
        {
          layout_map[BORDER_BOTTOM_WIDTH] = i;
          break;
        }
        case 'border-left-width':
        {
          layout_map[BORDER_LEFT_WIDTH] = i;
          break;
        }
        case 'margin-top':
        {
          layout_map[MARGIN_TOP] = i;
          break;
        }
        case 'margin-right':
        {
          layout_map[MARGIN_RIGHT] = i;
          break;
        }
        case 'margin-bottom':
        {
          layout_map[MARGIN_BOTTOM] = i;
          break;
        }
        case 'margin-left':
        {
          layout_map[MARGIN_LEFT] = i;
          break;
        }
        case 'width':
        {
          layout_map[WIDTH] = i;
          break;
        }
        case 'height':
        {
          layout_map[HEIGHT] = i;
          break;
        }
        case 'top':
        {
          layout_map[TOP] = i;
          break;
        }
        case 'right':
        {
          layout_map[RIGHT] = i;
          break;
        }
        case 'bottom':
        {
          layout_map[BOTTOM] = i;
          break;
        }
        case 'left':
        {
          layout_map[LEFT] = i;
          break;
        }
        case 'position':
        {
          layout_map[POSITION] = i;
          break;
        }
        case 'z-index':
        {
          layout_map[Z_INDEX] = i;
          break;
        }
        case 'box-sizing':
        {
          layout_map[BOX_SIZING] = i;
          break;
        }
      }
    }
  }

  var __selectedElement = null;
  var __comp_style = null;
  var __offsets_values = "";
  var __views = ['css-layout'];

  var onElementSelected = function(msg)
  {
    __comp_style = null;
    __offsets_values = "";
    __selectedElement = msg.rt_id && msg.obj_id && 
                        {rt_id: msg.rt_id,  
                         obj_id: msg.obj_id, 
                         model: msg.model} || null;

    var i = 0, view_id = '';
    for ( i = 0; view_id = __views[i]; i++)
    {
      views[view_id].update();
    }
  }
  
  this.has_selected_element = function()
  {
    return Boolean(__selectedElement);
  };

  this.getLayoutValues = function(org_args)
  {
    if( !__selectedElement)
    {
      return null;
    }
    if(__comp_style)
    {
      return __comp_style;
    }
    
    var
    rt_id = __selectedElement.rt_id,
    obj_id = __selectedElement.obj_id;
    
    if( this._stylesheets.has_stylesheets_runtime(rt_id) )
    {
      var tag = tagManager.set_callback(null, handleGetMetricsData, [rt_id, obj_id, org_args]);
      services['ecmascript-debugger'].requestCssGetStyleDeclarations(tag, [rt_id, obj_id]);
    }
    else
    {
      this._stylesheets.get_stylesheets(__selectedElement.rt_id, arguments);
    }
    return null;
  }

  var handleGetMetricsData = function(status, message, rt_id, obj_id, org_args)
  {
    const
    COMPUTED_STYLE_LIST = 0,
    NODE_STYLE_LIST = 1;

    __comp_style =  message[COMPUTED_STYLE_LIST];
    if( !layout_map.length )
    {
      setup_layout_map();
    }
    if( org_args && !org_args[0].__call_count )
    {
      org_args[0].__call_count = 1;
      org_args.callee.apply(null, org_args)
    }
  }
  
  this.getOffsetsValues = function(cb)
  {
    if (!__selectedElement)
      cb(null);
    else if(__offsets_values)
    {
      cb(window.helpers.copy_object(__offsets_values));
    }
    else
    {
      var
      rt_id = __selectedElement.rt_id,
      obj_id = __selectedElement.obj_id,
      tag = tagManager.set_callback(null, handleGetOffsetsData, [rt_id, obj_id, cb] );
      
      services['ecmascript-debugger'].requestEval(tag, [rt_id, 0, 0, GET_OFFSETS_SCRIPT, [['ele', obj_id]]]);
    }
  }

  var parse_offset_values = function(offset_values)
  {
    // HTML|0,BODY|1,DIV|0,DIV|0,DIV|0,DIV|0,P|0;234;39;640;95;0;0;640;95;0;0;640;95;
    var data = offset_values.split(';');
    data[0] = data[0].split(',').map(function(item){return item.split('|');});
    return data;  
  }
    
  var handleGetOffsetsData = function(status, message, rt_id, obj_id, cb)
  {
    const STATUS = 0, VALUE = 2;
    if (message[STATUS] == 'completed')
    {
      __offsets_values = parse_offset_values(message[VALUE]);
      if (cb)
        cb(window.helpers.copy_object(__offsets_values));
    }
    else
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE + 
        'handleGetOffsetsData failed')
    }
  }
  
  this.metricsTemplate = function()
  {
    var is_positioned = __comp_style[layout_map[POSITION]] != "static";
    return (
      ['div',
        [['ul',
          ['li',
            ['ul',
              [['li',['p','\u00A0',
                        ['span', is_positioned ? 'position' : '\u00A0']]],
              ['li', is_positioned ?
                     convert_to_unitless(__comp_style[layout_map[TOP]])
                     : '\u00A0'],
              ['li']]
            ],
            ['ul',
              ['li', is_positioned ? 
                     convert_to_unitless(__comp_style[layout_map[LEFT]]) :
                     '\u00A0'], 
              ['li',
              ['ul',
                ['li',['p','\u00a0',['span', 'margin']]],
                ['li', convert_to_unitless(__comp_style[layout_map[MARGIN_TOP]])],
                ['li']
              ],
            ['ul', ['li', convert_to_unitless(__comp_style[layout_map[MARGIN_LEFT]])], ['li',
              ['ul',
                ['li',['p','\u00a0',['span', 'border']]],
                ['li', convert_to_unitless(__comp_style[layout_map[BORDER_TOP_WIDTH]])],
                ['li']
              ],
              ['ul', ['li', convert_to_unitless(__comp_style[layout_map[BORDER_LEFT_WIDTH]])], ['li',
                ['ul',
                  ['li',['p','\u00a0',['span', 'padding']]],
                  ['li', convert_to_unitless(__comp_style[layout_map[PADDING_TOP]])],
                  ['li']
                ],
                ['ul',
                  ['li', convert_to_unitless(__comp_style[layout_map[PADDING_LEFT]])],
                  ['li',
                    ['ul', ['li', '\u00a0']],
                    ['ul', ['li', convert_to_unitless(__comp_style[layout_map[WIDTH]], true) + ' × ' + convert_to_unitless(__comp_style[layout_map[HEIGHT]], true)]],
                    ['ul', ['li', '\u00a0']],
                    'class', 'dimension'],
                  ['li', convert_to_unitless(__comp_style[layout_map[PADDING_RIGHT]])]
                ],
                ['ul', [['li'],['li', convert_to_unitless(__comp_style[layout_map[PADDING_BOTTOM]])],['li']]],
                'class', 'padding'], ['li', convert_to_unitless(__comp_style[layout_map[BORDER_RIGHT_WIDTH]])]],
              ['ul', [['li'],['li', convert_to_unitless(__comp_style[layout_map[BORDER_BOTTOM_WIDTH]])],['li']]],
              'class', 'border'], ['li', convert_to_unitless(__comp_style[layout_map[MARGIN_RIGHT]])]],
            ['ul', [['li'],['li', convert_to_unitless(__comp_style[layout_map[MARGIN_BOTTOM]])],['li']]],
            'class', 'margin'], 
              ['li', is_positioned ?
                     convert_to_unitless(__comp_style[layout_map[RIGHT]]) :
                     '\u00A0']],
          ['ul', 
            [['li'],['li', is_positioned ? 
                           convert_to_unitless(__comp_style[layout_map[BOTTOM]]) :
                           '\u00A0'],['li']]],
          'class', is_positioned ? 'position' : ''],
        'class', __comp_style[layout_map[BOX_SIZING]]]],
        ['table',
          ['tr',
            [['th', 'position:', 'data-spec', 'css#position'],
             ['td', __comp_style[layout_map[POSITION]] || "–"]],
          ],
          ['tr',
            [['th', 'z-index:', 'data-spec', 'css#z-index'],
             ['td', __comp_style[layout_map[Z_INDEX]] || "–"]],
          ],
          ['tr',
            [['th', 'box-sizing:', 'data-spec', 'css#box-sizing'],
             ['td', __comp_style[layout_map[BOX_SIZING]] || "–"]],
          ],
          'id', 'layout-info'
        ]
      ]
    );
  };

  function convert_to_unitless(value, no_replace)
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
      return "" + parseInt(value)
    }
  }

  messages.addListener('element-selected', onElementSelected);
}

cls.ElementLayout.OFFSETS =
[
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


