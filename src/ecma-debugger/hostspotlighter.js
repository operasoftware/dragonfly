window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

cls.EcmascriptDebugger["6.0"].Hostspotlighter = function()
{
  /* interface */
  // type: default, dimension, padding, border, margin, locked
  this.spotlight = function(node_id, scroll_into_view, type){};
  this.soft_spotlight = function(node_id) {};
  this.clearSpotlight = function(){};
  this.invertColors = function(){};
  /* templates */
  this.colorSelectsTemplate = function(){};
  this.colorAdvancedSelectsTemplate = function(){};
  /* Metrics mouse event handlers */
  this.metricsMouseoutHandler = function(event){};
  this.metricsMouseoverHandler = function(event){};


  const
  FILL = 0,
  FRAME = 1,
  GRID = 2,
  CSS_TEXT = ["background-color: ", "border-color: ", "border-color: "],
  CSS_CONVERT_TABLE =
  {
    'background-color': 'backgroundColor',
    'border-color': 'borderColor',
    'color':  'color'
  },
  ACTIVE = 2,
  DEFAULT = 0,
  HOVER = 1,
  LOCKED = 2,
  DIMENSION = 3,
  PADDING = 4,
  BORDER = 5,
  MARGIN = 6;

  var self = this;
  var matrixes = [];
  var client_colors = {};
  var commands = {};
  var colors = new Color();
  var last_spotlight_commands = "";
  var spotlight_clear_timeouts = new Timeouts();
  var locked_elements = [];
  var top_runtime = 0;
  var settings_id = 'dom';
  var mouse_handler_target = null;
  var mouse_handler_timeouts = new Timeouts();
  var class_names = ['margin', 'border', 'padding', 'dimension'];
  var last_spotlight_command = null;
  var rts = {};

  var _on_profile_disabled = function(msg)
  {
    if (msg.profile == window.app.profiles.DEFAULT)
    {
      last_spotlight_commands = "";
      last_spotlight_command = null;
      locked_elements = [];
    }
  };

  /* helpers */

  var get_command = function(node_id, scroll_into_view, name)
  {
    return [node_id, scroll_into_view && 1 || 0, commands[name]];
  }

  var get_locked_commands = function(node_id)
  {
    return get_command(node_id, 0, "locked");
  }

  var clear_spotlight = function(root_id)
  {
    last_spotlight_commands = "";
    // workaround for bug CORE-18426
    root_id || (root_id = dom_data.getRootElement());
    if(root_id)
    {
      services['ecmascript-debugger'].requestSpotlightObjects(0,
        [ settings.dom.get('lock-selected-elements') &&
            locked_elements.map(get_locked_commands) || [[root_id, 0, [[0,0]]]] ]);
    }
    else
    {
      get_root_id(clear_spotlight);
    }
  };

  var get_root_id = function(cb)
  {
    var ex_ctx = window.runtimes.get_execution_context();
    var rt_id = ex_ctx.rt_id;
    var thread_id = ex_ctx.thread_id;
    var frame_index = ex_ctx.frame_index;
    var script = "return document.documentElement";
    var msg = [rt_id, thread_id, frame_index, script];
    var tag = window.tag_manager.set_callback(null, handle_get_root_id, [cb]);
    window.services["ecmascript-debugger"].requestEval(tag, msg);
  };

  var handle_get_root_id = function(status, message, cb)
  {
    var STATUS = 0;
    var TYPE = 1;
    var VALUE = 2;
    var OBJECT_VALUE = 3;
    var OBJECT_ID = 0;

    if (!status && message[STATUS] == "completed" &&
        message[OBJECT_VALUE] && message[OBJECT_VALUE][OBJECT_ID])
    {
      cb(message[OBJECT_VALUE][OBJECT_ID]);
    }
  };

  var opacity =
  {
    "default":
    [
      // dimension box; fill, frame, grid
      [52, 0, 0],
      // padding box; fill, frame, grid
      [104, 0, 0],
      // border box; fill, frame, grid
      [208, 0, 128],
      // margin box; fill, frame, grid
      [156, 0, 0],
    ],
    "hover":
    [
      // dimension box; fill, frame, grid
      [24, 0, 0],
      // padding box; fill, frame, grid
      [52, 0, 0],
      // border box; fill, frame, grid
      [104, 0, 64],
      // margin box; fill, frame, grid
      [76, 0, 0],
    ],
    "locked":
    [
      // dimension box; fill, frame, grid
      [52, 0, 0],
      // padding box; fill, frame, grid
      [52, 0, 0],
      // border box; fill, frame, grid
      [52, 128, 0],
      // margin box; fill, frame, grid
      [0, 0, 0],
    ],
    "dimension":
    [
      // dimension box; fill, frame, grid
      [200, 0, 0],
      // padding box; fill, frame, grid
      [0, 0, 0],
      // border box; fill, frame, grid
      [0, 0, 128],
      // margin box; fill, frame, grid
      [0, 0, 0],
    ],
    "padding":
    [
      // dimension box; fill, frame, grid
      [0, 0, 0],
      // padding box; fill, frame, grid
      [200, 0, 0],
      // border box; fill, frame, grid
      [0, 0, 128],
      // margin box; fill, frame, grid
      [0, 0, 0],
    ],
    "border":
    [
      // dimension box; fill, frame, grid
      [0, 0, 0],
      // padding box; fill, frame, grid
      [0, 0, 0],
      // border box; fill, frame, grid
      [200, 0, 128],
      // margin box; fill, frame, grid
      [0, 0, 0],
    ],
    "margin":
    [
      // dimension box; fill, frame, grid
      [0, 0, 0],
      // padding box; fill, frame, grid
      [0, 0, 0],
      // border box; fill, frame, grid
      [0, 0, 128],
      // margin box; fill, frame, grid
      [200, 0, 0],
    ],

  };

  var create_matrix = function(hex_color, opacity_type)
  {
    var ret = [];
    var rgb = new Color().setHex(hex_color).getRGB();
    for (var i = 0, boxes, ops, j; i < 4; i++)
    {
      boxes = [];
      ret.push(boxes);
      ops = opacity[opacity_type][i];
      for (j = 0; j < 3; j++)
      {
        boxes.push(ops[j] ? rgb.concat([ops[j]]) : 0);
      }
    }
    return ret;
  };

  var invert_colors = function(matrix)
  {
    var matrix = null, prop = '', box = null, color = null, i = 0, j = 0, k = 0;
    for (i = 0; i < matrixes.length; i++)
    {
      matrix = matrixes[i];
      for (j = 0; j < 4; j++)
      {
        if (box = matrix[j])
        {
          for (k = 0; k < 3; k++)
          {
            if (box[k])
            {
              box[k] = colors.setRGB(box[k]).invert().getRGB().concat(box[k][3]);
            }
          }
        }
      }
    }
  };

  var set_initial_values = function()
  {
    var color = window.settings['host-spotlight'].get('spotlight-color');
    var locked_color = new Color().setHex(color);
    var hue = (360 + locked_color.getHue() - 120) % 360;
    locked_color = locked_color.setHue(hue).getHex();
    matrixes[DEFAULT] = create_matrix(color, "default");
    matrixes[HOVER] = create_matrix(color, "hover");
    matrixes[LOCKED] = create_matrix(locked_color, "locked");
    matrixes[DIMENSION] = create_matrix(color, "dimension");
    matrixes[PADDING] = create_matrix(color, "padding");
    matrixes[BORDER] = create_matrix(color, "border");
    matrixes[MARGIN] = create_matrix(color, "margin");
    normalize_matrixes();
    stringify_commands();
  };

  var stringify_commands = function()
  {
    var matrix = [matrixes[HOVER][0]].concat(matrixes[HOVER]);
    commands["default"] = stringify_command(matrixes[DEFAULT]);
    commands["hover"] = stringify_command(matrixes[HOVER]);
    commands["locked"] = stringify_command(matrixes[LOCKED]);
    commands["dimension"] = stringify_command(matrixes[DIMENSION]);
    commands["padding"] = stringify_command(matrixes[PADDING]);
    commands["border"] = stringify_command(matrixes[BORDER]);
    commands["margin"] = stringify_command(matrixes[MARGIN]);
    extract_css_properties(matrixes[DIMENSION][0], (client_colors.dimension = {}));
    extract_css_properties(matrixes[PADDING][1], (client_colors.padding = {}));
    extract_css_properties(matrixes[BORDER][2], (client_colors.border = {}));
    extract_css_properties(matrixes[MARGIN][3], (client_colors.margin = {}));
  };

  // TODO fix name
  var stringify_command = function(matrix)
  {
    var
    ret = [],
    box = null,
    spot_box = null,
    i = 0,
    j = 0,
    color = 0,
    has_color = 0;

    for( ; i < 4; i++)
    {
      if( box = matrix[i] )
      {
        has_color = 0;
        spot_box = [i];
        for( j = 3; j--; j)
        {
          if( has_color += ( color = convert_rgba_to_int(box[j] ) ) )
          {
            spot_box[j+1] = color;
          }
        }
        if(has_color)
        {
          ret[ret.length] = spot_box;
        }
      }
    }
    return ret;
  }
  /* used by helper Metrics mouse event handler */
  var extract_css_properties = function(box, target)
  {
    // fill, frame, grid
    var
    properties = ['background-color'],
    color = null,
    i = 0;

    for (i = 0; i < properties.length; i++)
    {
      if (color = box[i]) // box; fill, frame, grid
      {
        target[properties[i]] = convert_rgba_to_hex(color);
      }
    }
    target['color'] = colors.getGrayValue() > 130 && "#000" || "#fff";
    return target;
  };

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
  };

  /* helpers to manage locked elements */
  // TODO make a new message for new top runtime
  var onActiveTab = function(msg)
  {
    if (msg.activeTab[0] != top_runtime)
    {
      for (var rt_id in rts)
      {
        if (rts[rt_id] && msg.activeTab.indexOf(rt_id) == -1)
        {
          clear_spotlight(rts[rt_id].root_id);
          rts[rt_id] = null;
        }
      }
      top_runtime = msg.activeTab[0];
      locked_elements = [];
    }
  }

  var onElementSelected = function(msg)
  {
    if (!rts[msg.rt_id])
    {
      rts[msg.rt_id] = {root_id: dom_data.getRootElement()};
    }
    if (msg.rt_id && msg.obj_id &&
        settings.dom.get('lock-selected-elements') &&
        // events can be asynchronous
        window.host_tabs.is_runtime_of_active_tab(msg.rt_id))
    {
      locked_elements[locked_elements.length] = msg.obj_id;
    }
  }

  var onSettingChange = function(msg)
  {
    if (msg.id == settings_id)
    {
      switch (msg.key)
      {
        case 'lock-selected-elements':
        {
          if(!settings[settings_id].get(msg.key))
          {
            locked_elements = [];
            last_spotlight_command = null;
            self.clearSpotlight();
          }
          break;
        }
      }
    }
  }



  /* convert a rgba array to a integer */
  var convert_rgba_to_int = function(arr)
  {
    return arr && arr.length == 4 &&
        ((arr[0] << 23) * 2 + (arr[1] << 16) +(arr[2] << 8) + (arr[3] << 0)) || 0;
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

  this._oneditcolor = function(color)
  {
    this._edit_context.ele_value.style.backgroundColor = color.hhex;
    window.settings['host-spotlight'].set('spotlight-color', color.hex);
    set_initial_values();
  }.bind(this);

  /* helper Metrics mouse event handler */

  this._set_style_metrics_target = function(target, class_name)
  {
    var
    index = class_names.indexOf(class_name) + 1,
    style = target.style,
    style_source = client_colors[class_name];

    if (index)
    {
      mouse_handler_target = target;
      for (var prop in style_source)
      {
        style[CSS_CONVERT_TABLE[prop]] = style_source[prop];
      }
      if (class_name != "dimension")
      {
        style = target.getElementsByClassName(class_names[index])[0].style;
        style_source = {'background-color': '#fff', 'color': '#000'};
        for (var prop in style_source)
        {
          style[CSS_CONVERT_TABLE[prop]] = style_source[prop];
        }
      }
    }
  };

  this._clear_style_metrics_target = function()
  {
    if (mouse_handler_target)
    {
      mouse_handler_target.style.cssText = '';
      var index = class_names.indexOf(mouse_handler_target.className) + 1;
      if (index && index < 4)
      {
        mouse_handler_target.getElementsByClassName(class_names[index])[0].style.cssText = '';
      }
    }
    mouse_handler_target = null;
  };

  /* event handlers */

  eventHandlers.click["reset-default-spotlight-colors"] = function(event, target)
  {
    window.settings['host-spotlight'].set('spotlight-color',
                                          window.ini.spotlight_color);
    if (event.target.previousElementSibling)
    {
      event.target.previousElementSibling.style.backgroundColor =
        "#" + window.ini.spotlight_color;
    }
    set_initial_values();
  };

  eventHandlers.click['select-spotlight-color'] = function(event, target)
  {
    var color_sample = target;
    var initial_color = new Color().parseCSSColor(color_sample.style.backgroundColor);
    this._edit_context =
    {
      initial_color: initial_color,
      current_color: initial_color,
      ele_value: color_sample,
      vertical_anchor_selector: ".spotlight-color-select",
      horizontal_anchor_selector: ".spotlight-color-select",
      callback: this._oneditcolor,
      edit_class: 'edited-color',
      alpha_disabled: true,
      palette_disabled: true,
      z_index: 301 // higher than the overlay
    };
    window.views['color-selector'].show_color_picker(color_sample,
                                                     this._edit_context);
  }.bind(this);

  /* Metrics mouse event handlers */

  eventHandlers.mouseover['spotlight-box'] = function(event, target)
  {
    var ele = event.target, class_name = '', active_model = null;
    this._clear_style_metrics_target();
    while (ele && ele != target && !(class_name = ele.className))
    {
      ele = ele.parentNode;
    }
    this._set_style_metrics_target(ele, class_name);
    if ((active_model = window.dominspections && window.dominspections.active) &&
        window.settings.dom.get('highlight-on-hover'))
    {
      this.spotlight(active_model.target, 0, class_name || "default");
    }
  }.bind(this);

  /* interface */

  this.spotlight = function(node_id, scroll_into_view, type)
  {
    type || (type = "default");
    spotlight_clear_timeouts.clear();
    var join = Array.prototype.join;
    if (join.call(arguments) != last_spotlight_commands)
    {
      last_spotlight_commands = join.call(arguments);
      var locked_s = settings.dom.get('lock-selected-elements') &&
                     locked_elements.map(get_locked_commands) || null;
      var cmd = [get_command(node_id, scroll_into_view, type)];
      last_spotlight_command = [get_command(node_id, false, type)];
      if (locked_s)
      {
        cmd.push.apply(cmd, locked_s);
        last_spotlight_command.push.apply(last_spotlight_command, locked_s);
      }
      services['ecmascript-debugger'].requestSpotlightObjects(0, [cmd]);

    }
  };

  this.soft_spotlight = function(node_id)
  {
    var msg = [(last_spotlight_command || []).concat([get_command(node_id, 0, "hover")])];
    services['ecmascript-debugger'].requestSpotlightObjects(0, msg);
    last_spotlight_commands = '';
  }

  // commands["locked"]

  this.clearSpotlight = function()
  {
    spotlight_clear_timeouts.set(clear_spotlight, 50);
  }

  this.invertColors = function()
  {
    invert_colors();
    stringify_commands();
    last_spotlight_commands = [];
    var active_model = window.dominspections && window.dominspections.active;
    if (active_model && window.views.dom.isvisible())
    {
      this.spotlight(active_model.target, 0);
    }
  }

  /* templates */
  this.colorSelectsTemplate = function()
  {
    var shortcut = ActionBroker.get_instance()
                  .get_shortcut_with_handler_and_action('global',
                                                        'invert-spotlight-colors');
    var color = window.settings['host-spotlight'].get('spotlight-color');
    return (
    ['setting-composite',
      ['div',
        ['span',
          'style', 'background-color: #' + color,
          'class', 'spotlight-color-select',
          'handler', 'select-spotlight-color'],
        ['span',
          ui_strings.S_BUTTON_SPOTLIGHT_RESET_DEFAULT_COLORS,
          'handler', 'reset-default-spotlight-colors',
          'class', 'reset-defaults ui-button',
          'tabindex', '1'],
        ['p', ui_strings.S_INFO_INVERT_ELEMENT_HIGHLIGHT.replace ("%s", shortcut)],
      'class', 'host-spotlight']])
  };

  /* constructor calls */

  messages.addListener("element-selected", onElementSelected);
  messages.addListener('active-tab', onActiveTab);
  messages.addListener('setting-changed', onSettingChange);
  messages.addListener('profile-disabled', _on_profile_disabled);
  window.app.addListener('services-created', function()
  {
    set_initial_values();
  });

  this.bind = function(ecma_debugger)
  {
    ecma_debugger.handleSpotlightObjects = function(status, message){};
  };

};
