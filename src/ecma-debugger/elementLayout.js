/**
  * @constructor 
  */

var elementLayout = new function()
{
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
  OFFSETS =
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
  ],
  GET_OFFSETS_SCRIPT = "\
    <![CDATA[\
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
      while( parent = parent.parentElement )\
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
    ]]>";
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
    __selectedElement = {rt_id: msg.rt_id,  obj_id: msg.obj_id};

    var i = 0, view_id = '';
    for ( i = 0; view_id = __views[i]; i++)
    {
      views[view_id].update();
    }
  }
  
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
    
    if( stylesheets.hasStylesheetsRuntime(rt_id) )
    {
      var tag = tagManager.setCB(null, handleGetMetricsData, [rt_id, obj_id, org_args]);
      services['ecmascript-debugger'].cssGetStyleDeclarations( tag, rt_id, obj_id, '10000', 'json' );
    }
    else
    {
      stylesheets.getStylesheets(__selectedElement.rt_id, arguments);
    }
    return null;
  }

  var handleGetMetricsData = function(xml, rt_id, obj_id, org_args)
  {
    var 
    json = xml.getNodeData('matching-style-declarations'), 
    declarations = null;

    if( json )
    {
      declarations = eval('(' + json +')');
      __comp_style =  declarations[0];
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
  }
  
  this.getOffsetsValues = function(org_args)
  {
    if( !__selectedElement)
    {
      return null;
    }
    if(__offsets_values)
    {
      return __offsets_values;
    }
    
    var
    rt_id = __selectedElement.rt_id,
    obj_id = __selectedElement.obj_id,
    tag = tagManager.setCB(null, handleGetOffsetsData, [rt_id, obj_id, org_args] );
    
    services['ecmascript-debugger'].eval( tag, rt_id, '', '', GET_OFFSETS_SCRIPT, ['ele', obj_id]);
    return null;
  }
  
  this.prettyprintOffsetValues = function()
  {
    var
    data = __offsets_values.split(';'),
    ret = '<h2>' +  ui_strings.VIEW_SUB_PARENT_OFFSETS + '</h2><parent-node-chain>',
    i = 0,
    chain = data[0].split(','),
    cur = '';
    
    for( i = 0; cur = chain[i]; i++)
    {
      cur = cur.split('|');
      ret += i ? " > " : "";
      if( cur[1] == '1' )
      {
        ret += "<parent-offset>" + cur[0] + "</parent-offset>";       
      }
      else
      {
        ret += cur[0]; 
      }
    }
    ret += "</parent-node-chain><h2>" +  ui_strings.VIEW_SUB_OFFSET_VALUES + "</h2><offsets>";
    for( i = 1; data[i]; i++ )
    {
      ret += "<item>" +
        "<key>" + OFFSETS[i] + "</key>" +
        "<value>" + data[i] + "</value>" +
        "</item>";
    }
    ret += "</offsets>";
    return ret;
  }
    
  var handleGetOffsetsData = function(xml, rt_id, obj_id, org_args)
  {
    if( xml.getNodeData('status') == 'completed' )
    {
      __offsets_values = xml.getNodeData('string')
      if( org_args && !org_args[0].__call_count )
      {
        org_args[0].__call_count = 1;
        org_args.callee.apply(null, org_args)
      }
    }
    else
    {
      opera.postError('handleGetOffsetsData failed')
    }
  }
  
  this.metricsTemplate = function(styles)
  {
    
    return ['div', 
        ['ul', 
          ['li',['p','\u00a0',['span', 'margin']]],
          ['li', __comp_style[layout_map[MARGIN_TOP]]],
          ['li']
        ],
        ['ul', ['li', __comp_style[layout_map[MARGIN_LEFT]]], ['li', 
          ['ul', 
            ['li',['p','\u00a0',['span', 'border']]], 
            ['li', __comp_style[layout_map[BORDER_TOP_WIDTH]]],
            ['li']
          ],
          ['ul', ['li', __comp_style[layout_map[BORDER_LEFT_WIDTH]]], ['li',
            ['ul', 
              ['li',['p','\u00a0',['span', 'padding']]], 
              ['li', __comp_style[layout_map[PADDING_TOP]]], 
              ['li']
            ],
            ['ul', 
              ['li', __comp_style[layout_map[PADDING_LEFT]]], 
              ['li', 
                ['ul', ['li', __comp_style[layout_map[WIDTH]], 'class', 'elementWidth']],
                ['ul', ['li', __comp_style[layout_map[HEIGHT]],'class', 'elementHeight']],
                ['ul', ['li', '\u00a0']],
                'class', 'element'], 
              ['li', __comp_style[layout_map[PADDING_RIGHT]]]
            ],
            ['ul', ['li', __comp_style[layout_map[PADDING_BOTTOM]], 'colspan', '3']],
            'class', 'padding'], ['li', __comp_style[layout_map[BORDER_RIGHT_WIDTH]]]],
          ['ul', ['li', __comp_style[layout_map[BORDER_BOTTOM_WIDTH]], 'colspan', '3']],
          'class', 'border'], ['li', __comp_style[layout_map[MARGIN_RIGHT]]]],
        ['ul', ['li', __comp_style[layout_map[MARGIN_BOTTOM]], 'colspan', '3']],
        'class', 'metrics border'];
  }

  messages.addListener('element-selected', onElementSelected);

}


