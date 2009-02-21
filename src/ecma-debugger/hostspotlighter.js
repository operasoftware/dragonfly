var hostspotlighter = new function()
{
  var self = this;
  var matrixes = [];
  var client_colors = {};

  const
  DIMENSION = 0,
  PADDING = 1,
  BORDER = 2,
  MARGIN = 3,
  FILL = 0,
  FRAME = 1,
  GRID = 2,
  START_TAG = ["<fill-color>", "<frame-color>", "<grid-color>"],
  END_TAG = ["</fill-color>", "</frame-color>", "</grid-color>"],
  CSS_TEXT = ["background-color: ", "border-color: ", "border-color: "],
  CSS_CONVERT_TABLE =
  {
    'background-color': 'backgroundColor', 
    'border-color': 'borderColor',
    'color':  'color'
  },
  INNER_INNER = 0,
  INNER = 1,
  ACTIVE = 2,
  DEFAULT = 0,
  HOVER = 1,
  LOCKED = 2,
  COLOR_THEME_ALPHAS = // red: 1 grid color 0 fill-and-frame color
  [
    [
      [[0, 0, 0, .3 * 255], [0, 0, 0, .6 * 255], 0],
      [[0, 0, 0, .5 * 255], [0, 0, 0, .8 * 255], 0],
      [[0, 0, 0, .7 * 255], [0, 0, 0, .1 * 255], [1, 0, 0, .3 * 255]],
      [0, 0, 0]
    ],
    [
      [[0, 0, 0, .3 * 255], 0, 0],
      [[0, 0, 0, .3 * 255], [0, 0, 0, .8 * 255], 0],
      [[0, 0, 0, .7 * 255], [0, 0, 0, .8 * 255], [1, 0, 0, .3 * 255]],
      [0, 0, 0]
    ],
    [
      [0, 0, 0],
      [0, 0, 0],
      [0, [1, 0, 0, .9 * 255], 0],
      [0, 0, 0]
    ],
  ]
  
  var commands = {};

  var parse_int_16 = function(str)
  {
    return parseInt(str, 16);
  };

  var convert_hex = function(hex)
  {
    if(hex && hex.length == 8)
    {
      return /(..)(..)(..)(..)/.exec(hex).slice(1).map(parse_int_16);
    }
    return 0;
  }

  var convert_rgba_to_int = function(arr)
  {
    var i = 4, ret = 0;
    if(arr && arr.length == 4)
    {
      for( ; i--; )
      {
        ret += arr[3-i] << (i * 8);
      }
    }
    return ret;
  }
  // adjust the luminosity with the alpah channel
  var convert_rgba_to_hex = function(arr)
  {
    var i = 4, ret = 0;
    if(arr && arr.length == 4)
    {
      colors.setRGB(arr.slice(0,3));
      var l = parseFloat(colors.getLuminosity());
      colors.setLuminosity(l + (100 - l) * (1 - arr[3]/255));
      return "#" + colors.getHex();
    }
    return "";
  }



  /*

  var t = []
  t[5] = []
  t[5][7] = [];
  t[5][7][3] = "hallo";
  var id = ( 5 << 6 ) | (7 << 3 ) | 3 ;
  alert(id)
  alert((id>>6 & 7) +' '+ (id>>3&7) +' '+ (id&7))
  alert(t[id>>6 & 7][id>>3&7][id&7])

  */


  var set_initial_values = function()
  {
    matrixes[DEFAULT] = ini.hostspotlight_matrixes["default"];
    matrixes[HOVER] = ini.hostspotlight_matrixes["metrics-hover"];
    matrixes[LOCKED] = ini.hostspotlight_matrixes["locked"];
    normalize_matrixes();
    stringify_commands();
    create_color_selects();
  }

  var stringify_commands = function()
  {
    var matrix = [matrixes[HOVER][0]].concat(matrixes[HOVER]);
    commands["default"] = stringify_command(matrixes[DEFAULT]);
    commands["locked"] = stringify_command(matrixes[LOCKED]);
    commands["dimension"] = stringify_command(matrix.slice(3));
    commands["padding"] = stringify_command(matrix.slice(2));
    commands["border"] = stringify_command(matrix.slice(1));
    commands["margin"] = stringify_command(matrix.slice(0));
    extract_css_properties(matrixes[HOVER][2], ( client_colors.active = {} ) );
    extract_css_properties(matrixes[HOVER][1], ( client_colors.inner = {} ) );
  }
  
  this.setRGBA = function(target, rgba_arr)
  {

  }

  this.setHex = function(target, hex)
  {

  }
  
  var stringify_command = function(matrix)
  {
    var ret = "", box = null, color = null, i = 0, j = 0;
    for( ; i < 4; i++)
    {
      if( box = matrix[i] )
      {
        ret += "<box><box-type>" + i + "</box-type>";
        for( j = 0; j < 3; j++)
        {
          if( color = box[j])
          {
            ret += START_TAG[j] + convert_rgba_to_int(color) + END_TAG[j];
            
          }
        }
        ret += "</box>";
      }
    }
    return ret;
  }
  
  var normalize_matrixes = function()
  {
    var matrix = null, i = 0, j = 0, k = 0;
    for( i = 0; i < 3; i++)
    {
      matrix = matrixes[i];
      for( j = 0; j < 4; j++)
      {
        matrix[j] || ( matrix[j] = [0, 0, 0] );
      }
    }
  }
  
  var create_color_selects = function()
  {
    var matrix = null, box = null, i = 0, j = 0, k = 0;
    new CstSelectColor
    (
      "spotlight-color-fill-and-frame", 
      matrixes[0][0][0] || [0, 0, 255, 255],
      "set-spotlight-color-theme",
      "no-opacity"
    );
    new CstSelectColor
    (
      "spotlight-color-grid", 
      matrixes[0][2][2] || [0, 0, 255, 255],
      "set-spotlight-color-theme",
      "no-opacity"
    );
    for( i = 0; i < 3; i++)
    {
      matrix = matrixes[i];
      for( j = 0; j < 4; j++)
      {
        box = matrix[j] || [];
        for( k = 0; k < 3; k++)
        {
          new CstSelectColor
          (
            "spotlight-color-" + ( ( i << 6 ) | ( j << 3 ) | ( k ) ), 
            box[k] || [0, 0, 255, 255],
            "set-spotlight-color"
          );
        }
      }
    }
  }
  
  var set_color_theme = function(fill_frame_color, grid_color)
  {
    var color = null, i = 0, j = 0, k = 0;
    for( i = 0; i < 3; i++)
    {
      for( j = 0; j < 4; j++)
      {
        for( k = 0; k < 3; k++)
        {
          if( color = COLOR_THEME_ALPHAS[i][j][k] )
          {
            matrixes[i][j][k] = color[0] && grid_color.slice(0) || fill_frame_color.slice(0);
            matrixes[i][j][k][3] = color[3];
          }
          else
          {
            matrixes[i][j][k] = 0;
          }
        }
      }
    }
    stringify_commands();
  }
  
  this.colorSelectsTemplate = function()
  {
    return \
    [
      [
        'div',
        [
          'label',
          'fill and frame: '
          window['cst-selects']['spotlight-color-fill-and-frame'].template(),
        ],
        [
          'label',
          'grid: '
          window['cst-selects']['spotlight-color-grid'].template(),
        ]
      ],
      [
        'table',
        [
          'tbody',
          color_select_row("dimension", 0, 0),
          color_select_row("padding", 0, 1),
          color_select_row("border", 0, 2),
          color_select_row("margin", 0, 3)
        ]
      ]
    ]
        
  }
  eventHandlers.change['set-spotlight-color'] = function(event)
  {
    var target = event.target;
    var id = parseInt(target.getAttribute('cst-id').slice(16));
    matrixes[id >> 6 & 7][id >> 3 & 7][id & 7] = 
      window['cst-selects'][target.getAttribute('cst-id')].getSelectedValue();
    stringify_commands();
  }
  
  eventHandlers.change['set-spotlight-color-theme'] = function(event)
  {
    set_color_theme(window['cst-selects']['spotlight-color-fill-and-frame'].getSelectedValue(),
      window['cst-selects']['spotlight-color-grid'].getSelectedValue());
  }
  

  var color_select_row = function(label, i, j)
  {
    var row_id = ( i << 6 ) | ( j << 3 );
    var ret = [];
    var k = 0;
    var checked = false;
 
    for( ; k < 3; k++)
    {
      checked = matrixes[i][j][k] && true || false;
      ret[ret.length] =
      ['td', 
        ['input', 'type', 'checkbox', 'checked', checked], 
        window['cst-selects']['spotlight-color-' + ( row_id | k ) ].template(!checked)
      ]
    }
    return \
    [
      'tr', 
      ['td', label]
    ].concat(ret)
  }
  

  

  
  

  var invert_colors = function(matrix)
  {
    var matrix = null, prop = '', box = null, color = null, i = 0, j = 0, k = 0;
    for( i = 0; i < 3; i++)
    {
      matrix = matrixes[i];
      for( j = 0; j < 4; j++)
      {
        if( box = matrix[j] )
        {
          for( k = 0; k < 3; k++)
          {
            if( box[k])
            {
              box[k] = colors.setRGB(box[k]).invert().getRGB().concat(box[k][3]);
            }
          }
        }
      }
    }
  }

  var extract_css_properties = function(box, target)
  {
    // fill, frame, grid
    var 
      properties = ['background-color', 'border-color', 'border-color'],
      color = null, 
      i = 0;

    

    for( i = 2; i > -1; i--)
    {
      if( color = box[i])
      {
        target[properties[i]] = convert_rgba_to_hex(color);
      }
    }
    target['color'] = colors.getGrayValue() > 130 && "#000" || "#fff";
    return target;
  }

  
  this.get_command = function(node_id, scroll_into_view, name)
  {
    return \
      "<spotlight-object>" +
        "<object-id>" + node_id + "</object-id>" +
        "<scroll-into-view>" + ( scroll_into_view && 1 || 0 ) + "</scroll-into-view>" +
        commands[name] +
      "</spotlight-object>";
  }

  this.spotlight = function(node_id, scroll_into_view, type)
  {
    services['ecmascript-debugger'].post
    (
      "<spotlight-objects>" +
        this.get_command(node_id, scroll_into_view, type || "default") +
        ( settings.dom.get('lock-selecked-elements') 
          && locked_elements.map(this.get_locked_commands, this).join("")
          || "" ) +
      "</spotlight-objects>"
    )
  }
    
  this.get_locked_commands = function(node_id)
  {
    return this.get_command(node_id, 0, "locked");
  }

  var mouse_handler_target = null;
  var mouse_handler_timeouts = new Timeouts();
  var colors = new Colors();
  var class_names = ['margin', 'border', 'padding', 'dimension'];
  this.clearMouseHandlerTarget = function()
  {
    var index = 0, 
    style = null,
    style_source = client_colors.active, 
    prop = '';

    

    if(mouse_handler_target)
    {
      style = mouse_handler_target.style;
      for( prop in style_source )
      {
        style.removeProperty(prop);
      } 
      index = class_names.indexOf(mouse_handler_target.className) + 1;
      if( index && index < 4 )
      {
        style = mouse_handler_target.getElementsByClassName(class_names[index])[0].style;
        style_source = client_colors.inner;
        for( prop in style_source )
        {
          style.removeProperty(prop);
        } 
      }
      self.clearSpotlight();
    }
    mouse_handler_target = null;    
  }
  var setStyleMouseHandlerTarget = function(target, class_name)
  {
    var 
    index = class_names.indexOf(class_name) + 1, 
    style = target.style,
    style_source = client_colors.active, 
    prop = '';

    mouse_handler_target = target;
    for( prop in style_source )
    {
      style[CSS_CONVERT_TABLE[prop]] = style_source[prop];
    }
    if( index && index < 4 )
    {
      style = target.getElementsByClassName(class_names[index])[0].style;
      style_source = client_colors.inner;
      for( prop in style_source )
      {
        style[CSS_CONVERT_TABLE[prop]] = style_source[prop];
      }
    }
  }
  // mouseover handler in Layout Metrics
  this.metricsMouseoverHandler = function(event)
  {
    var target = event.target, class_name = '';
    while(target && target != this 
            && !(class_name = target.className) &&  ( target = target.parentNode ) );
    if( target && class_name )
    {
      mouse_handler_timeouts.clear();
      self.clearMouseHandlerTarget();
      setStyleMouseHandlerTarget(target, class_name);
      self.spotlight(dom_data.getCurrentTarget(), 0, class_name);
    }
  }
  // mouseover handler in Layout Metrics
  this.metricsMouseoutHandler = function(event)
  {
    var target = event.target, class_name = '';
    while(target && target != this 
            && !(class_name = target.className) &&  ( target = target.parentNode ) );
    if( target && class_name && /^margin$/.test(class_name)  )
    {
      mouse_handler_timeouts.set(self.clearMouseHandlerTarget, 50);
    }
  }

  this.clearSpotlight = function()
  {
    services['ecmascript-debugger'].post("<spotlight-objects/>");
  }
  //{obj_id: obj_id, rt_id: data_runtime_id});
  

  this.invertColors = function()
  {
    invert_colors();
    stringify_commands();
  }

  // {activeTab: __activeTab} 
  // TODO make a new message for new top runtime
  var onActiveTab = function(msg)
  {
    if( msg.activeTab[0] != top_runtime )
    {
      top_runtime = msg.activeTab[0];
      locked_elements = [];
    }
  }
  var locked_elements = [];
  var top_runtime ='';
  var settings_id = 'dom';
  var onElementSelected = function(msg)
  {
    if(settings.dom.get('lock-selecked-elements'))
    {
      locked_elements[locked_elements.length] = msg.obj_id;
    }
  }
  var onSettingChange = function(msg)
  {
    if( msg.id == settings_id )
    {

      switch (msg.key)
      {
        case 'lock-selecked-elements':
        {
          if(!settings[settings_id].get(msg.key))
          {
            locked_elements = [];
            self.clearSpotlight();
          }
          break;
        }
      }
    }
  }

  messages.addListener("element-selected", onElementSelected); 
  messages.addListener('active-tab', onActiveTab);
  messages.addListener('setting-changed', onSettingChange);

  set_initial_values();
}