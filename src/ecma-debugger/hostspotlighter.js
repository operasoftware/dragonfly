var hostspotlighter = new function()
{
  /* interface */
  // type: default, dimension, padding, border, margin, locked 
  this.spotlight = function(node_id, scroll_into_view, type){};
  this.clearSpotlight = function(){};
  this.invertColors = function(){};
  /* templates */
  this.colorSelectsTemplate = function(){};
  this.colorAdvancedSelectsTemplate = function(){};
  /* Metrics mouse event handlers */
  this.metricsMouseoutHandler = function(event){};
  this.metricsMouseoverHandler = function(event){};
  this.clearMouseHandlerTarget = function(){};
  
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
      [[0, 0, 0, .2 * 255], [0, 0, 0, .6 * 255], 0],
      [[0, 0, 0, .45 * 255], [0, 0, 0, .8 * 255], 0],
      [[0, 0, 0, .7 * 255], [0, 0, 0, .1 * 255], [1, 0, 0, .3 * 255]],
      [0, 0, 0]
    ],
    [
      [[0, 0, 0, .2 * 255], 0, 0],
      [[0, 0, 0, .2 * 255], [0, 0, 0, .8 * 255], 0],
      [[0, 0, 0, .7 * 255], [0, 0, 0, .8 * 255], [1, 0, 0, .3 * 255]],
      [0, 0, 0]
    ],
    [
      [[0, 0, 0, .05 * 255], [0, 0, 0, .1 * 255], 0],
      [[0, 0, 0, .1 * 255], [0, 0, 0, .15 * 255], 0],
      [[0, 0, 0, .15 * 255], [1, 0, 0, .5 * 255], 0],
      [0, 0, 0]
    ],
  ];


  var self = this;
  var matrixes = [];
  var client_colors = {};
  var commands = {};
  var colors = new Colors();
  var last_spotlight_commands = "";
  var spotlight_clear_timeouts = new Timeouts();
  var locked_elements = [];
  var top_runtime = '';
  var settings_id = 'dom';
  var mouse_handler_target = null;
  var mouse_handler_timeouts = new Timeouts();
  var class_names = ['margin', 'border', 'padding', 'dimension'];
   
  /* helpers */

  var get_command = function(node_id, scroll_into_view, name)
  {
    return [node_id, scroll_into_view && 1 || 0, commands[name]];
    /*
      "<spotlight-object>" +
        "<object-id>" + node_id + "</object-id>" +
        "<scroll-into-view>" + ( scroll_into_view && 1 || 0 ) + "</scroll-into-view>" +
        commands[name] +
      "</spotlight-object>";
    */
  }

  var get_locked_commands = function(node_id)
  {
    return get_command(node_id, 0, "locked");
  }

  var clear_spotlight = function()
  {
    last_spotlight_commands = "";
    // workaround for bug CORE-18426
    var root_id = dom_data.getRootElement();
    services['ecmascript-debugger'].post
    (
      "<spotlight-objects>" +
        ( root_id && 
          "<spotlight-object>" +
            "<object-id>" + root_id + "</object-id>" +
            "<scroll-into-view>0</scroll-into-view>" +
            "<box>" +
              "<box-type>0</box-type>" +
              "<fill-color>0</fill-color>" +
            "</box>" +
          "</spotlight-object>" 
          || "" ) +
        ( settings.dom.get('lock-selecked-elements') 
          && locked_elements.map(get_locked_commands).join("")
          || "" ) +
      "</spotlight-objects>"
    );
  }

  var set_color_theme = function(fill_frame_color, grid_color)
  {
    var color = null, i = 0, j = 0, k = 0;
    var sat = 0;
    for( i = 0; i < 3; i++)
    {
      for( j = 0; j < 4; j++)
      {
        for( k = 0; k < 3; k++)
        {
          if( color = COLOR_THEME_ALPHAS[i][j][k] )
          {
            colors.setRGB( color[0] && grid_color || fill_frame_color );
            if( !color[0] )
            {
              colors.setSaturationV(colors.getSaturationV() * ( 1 - j * .28 ) * ( k == 1 && .2 || 1 ) );
              colors.setValue(colors.getValue() * ( 1 - j * .28 ) * ( k == 1 && .2 || 1 ) );
            }
            matrixes[i][j][k] = colors.getRGB();
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

  var set_initial_values = function()
  {
    matrixes[DEFAULT] = ini.hostspotlight_matrixes["default"].map(copy_array);
    matrixes[HOVER] = ini.hostspotlight_matrixes["metrics-hover"].map(copy_array);
    matrixes[LOCKED] = ini.hostspotlight_matrixes["locked"].map(copy_array);
    normalize_matrixes();
    stringify_commands();
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
    
  var stringify_command = function(matrix)
  {
    var ret = [], box = null, spot_box = null, i = 0, j = 0;
    for( ; i < 4; i++)
    {
      if( box = matrix[i] )
      {
        spot_box = [i];
        for( j = 0; j < 3; j++)
        {
          spot_box[spot_box.length] = convert_rgba_to_int(box[j]);
        }
        ret[ret.length] = spot_box;
      }
    }
    return ret;
  }
  /* used by helper Metrics mouse event handler */
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

  var update_color_selects = function()
  {
    var matrix = null, box = null, i = 0, j = 0, k = 0;
    var cst_selects = window['cst-selects'];
    var cst_select = null;

    cst_select = cst_selects["spotlight-color-fill-and-frame"];
    cst_select.setSelectedValue(matrixes[0][0][0] || [0, 0, 255, 255]);
    cst_select.updateElement();

    cst_select = cst_selects["spotlight-color-grid"];
    cst_select.setSelectedValue(matrixes[0][2][2] || [0, 0, 255, 255]);
    cst_select.updateElement();

    for( i = 0; i < 3; i++)
    {
      matrix = matrixes[i];
      for( j = 0; j < 4; j++)
      {
        box = matrix[j] || [];
        for( k = 0; k < 3; k++)
        {
          cst_select = cst_selects["spotlight-color-" + ( ( i << 6 ) | ( j << 3 ) | ( k ) )];
          cst_select.setSelectedValue(box[k] || [0, 0, 255, 255]);
          cst_select.updateElement(box[k] != 0);
        }
      }
    }
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

  /* helpers to manage locked elements */
  // TODO make a new message for new top runtime
  var onActiveTab = function(msg)
  {
    if( msg.activeTab[0] != top_runtime )
    {
      top_runtime = msg.activeTab[0];
      locked_elements = [];
    }
  }

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

  /* helper Metrics mouse event handler */
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

  /* template */
  var color_select_row_template = function(label, i, j)
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
        ['input', 'type', 'checkbox', 'checked', checked, 'handler', 'check-spotlight-color-select'], 
        window['cst-selects']['spotlight-color-' + ( row_id | k ) ].template(null, !checked)
      ]
    }
    return \
    [
      'tr', 
      ['td', label]
    ].concat(ret)
  }
  /* convert a rgba array to a integer */
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

  /* convert a rgba array to a hex value
     the alpha channel is used in the luminosity versus a white background */
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

  /* map function to copy an array of arrays */
  var copy_array = function(item)
  {
    if( Object.prototype.toString.call(item) == "[object Array]" )
    {
      return item.map(copy_array);
    }
    else
    {
      return item;
    }
  }

  /* event handlers */

  eventHandlers.click["toggle-advanced-color-setting"] = function(event, target)
  {
    var 
    parent = target.parentElement, 
    table = parent.getElementsByTagName('table')[0];

    if(table)
    {
      parent.removeChild(table);
      target.firstElementChild.removeClass('unfolded');
    }
    else
    {
      parent.render(self.colorAdvancedSelectsTemplate());
      target.firstElementChild.addClass('unfolded');
    }
  }

  eventHandlers.click["reset-default-spotlight-colors"] = function(event, target)
  {
    set_initial_values();
    update_color_selects();
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

  eventHandlers.change['check-spotlight-color-select'] = function(event)
  {
    var 
    target = event.target,
    cst_select = target.nextElementSibling,
    id = cst_select.getAttribute('cst-id'),
    select_obj = window['cst-selects'][id];

    id = parseInt(id.slice(16));
    if(target.checked)
    {
      cst_select.removeAttribute('disabled');
      matrixes[id >> 6 & 7][id >> 3 & 7][id & 7] = select_obj.getSelectedValue();
    }
    else
    {
      cst_select.setAttribute('disabled', 'disabled');
      matrixes[id >> 6 & 7][id >> 3 & 7][id & 7] = 0;
    }
    stringify_commands();
  }
  
  /* interface */
  
  this.spotlight = function(node_id, scroll_into_view, type)
  {
    spotlight_clear_timeouts.clear();
    if( arguments.join() != last_spotlight_commands )
    {
      last_spotlight_commands = arguments.join();

      services['ecmascript-debugger'].requestSpotlightObjects(0,
        [[get_command(node_id, scroll_into_view, type || "default")]])

/*
        ]
      (
        "<spotlight-objects>" +
          get_command(node_id, scroll_into_view, type || "default") +
          ( settings.dom.get('lock-selecked-elements') 
            && locked_elements.map(get_locked_commands).join("")
            || "" ) +
        "</spotlight-objects>"
      )
*/
    }
  }
  
  this.clearSpotlight = function()
  {
    spotlight_clear_timeouts.set(clear_spotlight, 50);
  }
  
  this.invertColors = function()
  {
    invert_colors();
    stringify_commands();
  }

  /* templates */
  this.colorSelectsTemplate = function()
  {
    return \
    [
      'setting-composite',
      [
        'h3', ui_strings.S_LABEL_SPOTLIGHT_COLOR_THEME,
        [
          'label',
          " " + ui_strings.S_LABEL_SPOTLIGHT_PROPERTY_FILL + ", " +  
          ui_strings.S_LABEL_SPOTLIGHT_PROPERTY_FRAME + " ",
          window['cst-selects']['spotlight-color-fill-and-frame'].template(),
        ],
        [
          'label',
          ui_strings.S_LABEL_SPOTLIGHT_PROPERTY_GRID + ' ',
          window['cst-selects']['spotlight-color-grid'].template(),
        ]
      ],
      [
        'input', 
        'type', 'button', 
        'value', ui_strings.S_BUTTON_SPOTLIGHT_RESET_DEFAULT_COLORS, 
        'handler', 'reset-default-spotlight-colors',
        'class', 'reset-defaults'],
      [
        'settings-header',
        ['input', 'type', 'button'],
        ui_strings.S_BUTTON_SPOTLIGHT_ADVANCED,
        'handler', 'toggle-advanced-color-setting'
      ],
      'class', 'host-spotlight'
    ]  
  }
  
  this.colorAdvancedSelectsTemplate = function()
  {
    return \
    [
      'table',
      [
        'tbody',
        ['tr', ['th', ['h2', ui_strings.S_LABEL_SPOTLIGHT_TITLE_DEFAULT], 'colspan', '4']],
        ['tr', 
          ['td'], 
          ['td', ui_strings.S_LABEL_SPOTLIGHT_PROPERTY_FILL], 
          ['td', ui_strings.S_LABEL_SPOTLIGHT_PROPERTY_FRAME], 
          ['td', ui_strings.S_LABEL_SPOTLIGHT_PROPERTY_GRID]
        ],
        color_select_row_template(ui_strings.S_LABEL_SPOTLIGHT_BOX_TYPE_DIMENSION, 0, 0),
        color_select_row_template(ui_strings.S_LABEL_SPOTLIGHT_BOX_TYPE_PADDING, 0, 1),
        color_select_row_template(ui_strings.S_LABEL_SPOTLIGHT_BOX_TYPE_BORDER, 0, 2),
        color_select_row_template(ui_strings.S_LABEL_SPOTLIGHT_BOX_TYPE_MARGIN, 0, 3),
        ['tr', ['th', ['h2', ui_strings.S_LABEL_SPOTLIGHT_TITLE_METRICS], 'colspan', '4']],
        ['tr', 
          ['td'], 
          ['td', ui_strings.S_LABEL_SPOTLIGHT_PROPERTY_FILL], 
          ['td', ui_strings.S_LABEL_SPOTLIGHT_PROPERTY_FRAME], 
          ['td', ui_strings.S_LABEL_SPOTLIGHT_PROPERTY_GRID]
        ],
        color_select_row_template(ui_strings.S_LABEL_SPOTLIGHT_BOX_TYPE_INNER_ANY, 1, 0),
        color_select_row_template(ui_strings.S_LABEL_SPOTLIGHT_BOX_TYPE_INNER, 1, 1),
        color_select_row_template(ui_strings.S_LABEL_SPOTLIGHT_BOX_TYPE_HOVER, 1, 2),
        ['tr', ['th', ['h2', ui_strings.S_LABEL_SPOTLIGHT_TITLE_LOCKED_ELEMENTS], 'colspan', '4']],
        ['tr', 
          ['td'], 
          ['td', ui_strings.S_LABEL_SPOTLIGHT_PROPERTY_FILL], 
          ['td', ui_strings.S_LABEL_SPOTLIGHT_PROPERTY_FRAME], 
          ['td', ui_strings.S_LABEL_SPOTLIGHT_PROPERTY_GRID]
        ],
        color_select_row_template(ui_strings.S_LABEL_SPOTLIGHT_BOX_TYPE_DIMENSION, 2, 0),
        color_select_row_template(ui_strings.S_LABEL_SPOTLIGHT_BOX_TYPE_PADDING, 2, 1),
        color_select_row_template(ui_strings.S_LABEL_SPOTLIGHT_BOX_TYPE_BORDER, 2, 2),
        color_select_row_template(ui_strings.S_LABEL_SPOTLIGHT_BOX_TYPE_MARGIN, 2, 3)
      ],
      'class', 'advanced-spotlight-color-settings'
    ]
  }
  
  /* Metrics mouse event handlers */
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
 
  /* constructor calls */

  messages.addListener("element-selected", onElementSelected); 
  messages.addListener('active-tab', onActiveTab);
  messages.addListener('setting-changed', onSettingChange);
  set_initial_values();
  create_color_selects();
  
}