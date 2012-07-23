window.templates = window.templates || ( window.templates = {} );

(function()
{
  var self = this;

  this.tab = function(obj, is_active_tab, is_first_temp_tab)
  {
    var ret = ['tab', obj.name];
    var class_name = [is_active_tab  && 'active',
                      is_first_temp_tab && 'first-temp-tab']
                     .filter(Boolean).join(' ');
    if (obj.has_close_button)
    {
      ret.push(['span',
                'tabindex', '1',
                'handler', 'close-tab',
                'class', 'close-tab-button']);
    }
    ret.push('handler', 'tab', 'ref-id', obj.ref_id);
    if (class_name)
    {
      ret.push('class', class_name);
    }
    return ret;
  }

  this.top_tab = function(obj, is_active_tab)
  {
    return (
    ['tab',
      ['span', "class", "icon " + obj.ref_id],
      ['span', "class", "badge"],
      ['span',
        ['span', obj.name, 'class', 'block-content'],
        'class', 'inline-block'
      ],
      'handler', 'tab',
      'ref-id', obj.ref_id
    ].concat(is_active_tab ? ['class', 'active'] : [] ));
  };

  this.horizontal_navigation_content = function()
  {
    return [
        ["nav",
          "◀",
          "dir", "back",
          "handler", "horizontal-nav"],
        ["breadcrumbs",
         "handler", "breadcrumbs-drag"],
        ["nav",
          "▶",
          "dir", "forward",
          "handler", "horizontal-nav"]
      ];
  };

  this.contextmenu = function(items)
  {
    var ret = [];
    for (var i = 0, item; item = items[i]; i++)
    {
      var icon = "";
      if (item.checked || (settings[item.menu_id] && settings[item.menu_id].get(item.settings_id)))
      {
        icon = "check";
      }
      else if (item.selected)
      {
        icon = "radio";
      }

      if (!item.separator)
      {
        ret.push(["li",
            [["span", "class", "menu-icon " + icon], ["span", item.label]],
            "data-handler-id", item.id,
            "data-menu-id", item.menu_id,
            "class", item.disabled ? "disabled" : ""
        ]);
      }
      else
      {
        ret.push(["li", ["hr"], "class", "separator"]);
      }
    }
    return ["menu", ret, "id", "contextmenu", "class", "menu"];
  };

  this.filters = function(filters)
  {
    var
    ret = ['toolbar-filters'],
    filter = '',
    i = 0,
    default_text = '',
    tpl_input = null;

    for (; filter = filters[i]; i++)
    {
      if (filter.type && this[filter.type])
      {
        ret.push(this[filter.type](filter));
      }
      else
      {
        ret.push(this.default_filter(filter));
      }
    }
    return ret;
  }

  this.default_filter = function(filter)
  {
    var default_text = filter.label ?
                       filter.label :
                       ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH;
    var tpl_input =
    [
      "input",
      "autocomplete", "off",
      "type", "text",
      "handler", filter.handler,
      "shortcuts", filter.shortcuts,
      "title", filter.title,
      "placeholder", default_text
    ];
    ["handler",
     "shortcuts",
     "focus-handler",
     "blur-handler"].forEach(function(attr)
    {
      if (filter.hasOwnProperty(attr))
        tpl_input.push(attr, filter[attr]);
    });
    return ["filter", tpl_input, "class", filter.type || filter.class || ""];
  }

  this.search_control = function(button)
  {
    var ret =
    ['span',
        'tabindex', '1',
        'class', 'ui-button ' + button.class,
        'handler', button.handler,
        'title', button.title
    ];
    if (button.label)
    {
      ret.push('value', button.label);
    }
    return ret;
  }

  this.search_button = function(search)
  {
    return (
    ['toolbar-search',
      ['button',
        'class', 'search ui-control ' + (search.is_active ? "is-active" : ""),
        'handler', 'show-search',
        'title', ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH
      ]
     ]);
  }

  this.dropdown = function(filter)
  {
    return ['filter',
          //['em', filter.label ? filter.label : 'search'],
          [
            'select',
            'handler', filter.handler,
            'title', filter.title,
            'class', filter.class || ''
          ],
          'class', 'dropdown'
        ];
  }

  this.buttons = function(buttons)
  {
    var ret = ['toolbar-buttons'];
    if (buttons)
      ret.extend(buttons.map(this.button, this));

    return ret;
  }

  this.toolbar_group_wrapper = function(button_templates, group, view_id)
  {
    var ret = ["toolbar-buttons", button_templates];
    if (group.type)  // single-select or switch
    {
      if (group.type === UI.TYPE_SWITCH_CUSTOM_HANDLER)
        ret.push("handler", group.handler);
      else
        ret.push("handler", "toolbar-" + group.type);

      if (group.type === "single-select")
      {
        ret = ret.concat(["data-single-select-name", group.name,
                          "data-view-id", view_id]);
      }
    }
    return ret;
  }

  this.toolbar_button = function(button)
  {
    var icon_classname = button.icon;
    if (!icon_classname && !button.text)
      icon_classname = button.handler;
    return ["span",
        button.text || "",
        "title", button.title,
        "tabindex", "1",
        "class", "ui-button ui-control" +
                 (icon_classname ? " " + icon_classname  : "") +
                 (button.class_name ? " " + button.class_name : "") +
                 (button.text ? " text-button" : "")
      ].concat(
          button.id ? ["id", button.id] : [],
          button.disabled ? ["disabled", "disabled"] : [],
          button.param ? ["param", button.param] : [],
          button.handler ? ["handler", button.handler] : [],
          button.key ? ["key", button.key] : []
      );
  }

  this.single_select_button = function(button, values)
  {
    var icon_classname = button.icon;
    if (!icon_classname && !button.text)
      icon_classname = button.handler;
    var is_active = values.contains(button.value);
    var template =
      ["span", button.text || "",
        "data-single-select-value", button.value,
        "tabindex", "1",
        "class", "ui-button ui-control " +
                 (icon_classname ? icon_classname + " " : " ") +
                 (button.class_name ? button.class_name + " " : "") +
                 (button.text ? "text-button " : " ") +
                 (is_active ? "is-active " : " ")
      ].concat(button.title ? ["title", button.title] : []);
    return template;
  }

  this.toolbar_settings = function(toolbar_settings)
  {
    return ['cst-select-toolbar-setting',
              ['cst-icon'],
              ['cst-drop-down'],
            'class', 'toolbar-settings ui-control dropdown ' + toolbar_settings.class_name,
            'cst-id', toolbar_settings.id];
  }

  this.switches = function(switches, handler)
  {
    var
    ret = ["toolbar-buttons"],
    i = 0,
    setting = null;

    ret.extend(switches.map(this._switch, this));
    ret.push("handler", handler || "toolbar-switch");
    return ret;
  }

  this._switch = function(switch_)
  {
    var ret = "";
    if (setting = Settings.get_setting_with_view_key_token(switch_))
    {
      ret = ['span',
          'title', setting.label,
          'key', switch_,
          'tabindex', '1',
          'class', switch_ + ' ui-button switch' + (setting.value ? ' is-active' : '')
        ];
    }
    else
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
        "Can't attach switch to a setting that does not exist: " + switch_ );
    }
    return ret;
  }

  this.toolbarSeparator = function()
  {
    return ['toolbar-separator'];
  }

  this['window-statusbar'] = function()
  {
    return [ ['info']]
  }

  this.configButton = function(handler)
  {
    return ['button', 'type', 'button', 'handler', handler, 'title', ui_strings.S_BUTTON_LABEL_SETTINGS];
  }

  this.tabs = function(obj)
  {
    var ret = [];
    var tab = null, i = 0, is_first_temp_tab = false;
    for (; tab = obj.tabs[i]; i++)
    {
      if (!tab.disabled)
      {
        ret[ret.length] = this.tab(tab,
                                   obj.activeTab == tab.ref_id,
                                   tab.has_close_button && !is_first_temp_tab);
        if (!is_first_temp_tab)
        {
          is_first_temp_tab = Boolean(tab.has_close_button);
        }
      }
    }
    return ret;
  }

  this.viewMenu = function()
  {
    return (
    [
      'ui-menu',
      ['h2', ui_strings.M_VIEW_LABEL_VIEWS, 'handler', 'show-menu', 'tabindex', '1'],
      'id', 'main-view-menu'
    ].concat(opera.attached ? ['class', 'attached'] : []) );
  }

  this['top-tabs'] = function(obj)
  {
    var ret = [];
    var tab = null, i = 0;
    // ret[ret.length] =  this.window_controls();
    for( ; tab = obj.tabs[i]; i++)
    {
      ret[ret.length] = this.top_tab(tab, obj.activeTab == tab.ref_id)
    }
    return ret;
  }

  this.window_controls = function(controls)
  {
    var is_attached = window.opera.attached;
    var template = [];
    for (var i = 0, control; control = controls[i]; i++)
    {
      template.push(control.get_template());
    }

    return [
      'window-controls',
      template,
      'class', 'attached'
    ];
  };

  this.window_controls_close = function()
  {
    if (window.opera.attached)
    {
      return (
      ['window-controls',
        ['button',
          'class', 'ui-control',
          'id', 'top-window-close',
          'onclick', 'window.close()',
          'title', ui_strings.S_BUTTON_LABEL_CLOSE_WINDOW
        ],
        'class', 'no-tabbar'
      ]);
    }
    return [];
  }

  this.settings = function(view_arr)
  {
    var
      ret = ['settings-container'],
      view_id = null,
      view = null,
      i = 0;
    for( ; view_id = view_arr[i]; i++)
    {
      if(settings[view_id])
      {
        view = views[view_id];
        ret[ret.length] = this.setting(view_id, view.name, view.isvisible());
      }
    }
    return ret;

  }

  // this will be called as a method from a setting object

  this.setting = function(view_id, view_name, is_unfolded)
  {
    var ret = ['fieldset', ['legend', view_name]];
    var setting = settings[view_id];
    var settings_map = setting.setting_map;
    var cat_name = '';
    // so far checkboxes, customSettings
    for( cat_name in settings_map )
    {
      ret[ret.length] = this[cat_name](setting, settings_map[cat_name]);
    }
    return ret;
  }

  this.overlay = function(groups)
  {
    var tabs = [];
    for (var i = 0, group; group = groups[i]; i++)
    {
      tabs.push(["tab", group.label, "group", group.group_name, "handler", "overlay-tab"]);
    }

    return [
      "overlay",
      [
        "overlay-window",
        [
          ["overlay-arrow"],
          ["overlay-tabs", tabs],
          ["overlay-info"],
          ["overlay-content"],
        ]
      ],
      "class", "overlay"
    ];
  };

  this.checkboxes = function(setting, checkbox_arr)
  {
    var checkboxes = ['checkboxes'], arr = null, view_id = '', key = '', i = 0;
    for( ; key = checkbox_arr[i]; i++)
    {
      if( key.indexOf('.') == -1 )
      {
        checkboxes[checkboxes.length] =
          this.settingCheckbox
          (
            setting.view_id,
            key,
            setting.get(key),
            setting.label_map[key]
          );
      }
      else
      {
        arr = key.split('.');
        view_id = arr[0];
        key = arr[1];
        if( settings[view_id] )
        {
          checkboxes[checkboxes.length] =
            this.settingCheckbox
            (
              view_id,
              key,
              settings[view_id].get(key),
              settings[view_id].label_map[key],
              setting.view_id
            );
        }
        else
        {
          opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
            'failed in ui-templates checkboxes '+ arr + ' ' +setting.view_id);
        }
      }
    }
    return checkboxes;
  }

  this.customSettings = function(setting, template_name_arr)
  {
    var ret = [], name = null, i = 0, templates = setting.templates;
    for( ; name = template_name_arr[i]; i++)
    {
      ret[ret.length] = templates[name](setting);
    }
    return ret;
  }

  this.settingCheckbox = function(view_id, key, value, label, host)
  {
    var input = ['input',
        'type', 'checkbox',
        'handler', 'checkbox-setting',
        'name', key,
        'view-id', view_id
      ];
    if( value )
    {
      input.splice(input.length, 0, 'checked', 'checked');
    }
    if( host )
    {
      input.splice(input.length, 0, 'host-view-id', host);
    }
    return ['checkbox', ['label', input, label ] ];
  }

  this._window_types = {};
  this._window_types[UIWindow.HUD] = "_window_type_hud";

  this._window = function(win)
  {
    if (this._window_types.hasOwnProperty(win.window_type))
    {
      return this[this._window_types[UIWindow.HUD]](win);
    }
    var ret =
    ['window',
        win.header ? this.window_header(views[win.view_id].name) : [],
        win.is_resizable ?
        [
          ['window-control', 'handler', 'window-scale-top-left', 'class', 'window-scale-top-left'],
          ['window-control', 'handler', 'window-scale-top', 'class', 'window-scale-top'],
          ['window-control', 'handler', 'window-scale-top-right', 'class', 'window-scale-top-right'],
          ['window-control', 'handler', 'window-scale-right', 'class', 'window-scale-right'],
          ['window-control', 'handler', 'window-scale-bottom', 'class', 'window-scale-bottom'],
          ['window-control', 'handler', 'window-scale-bottom-right', 'class', 'window-scale-bottom-right'],
          ['window-control', 'handler', 'window-scale-bottom-left', 'class', 'window-scale-bottom-left'],
          ['window-control', 'handler', 'window-scale-left', 'class', 'window-scale-left'],
        ] : [],
      'id', win.id,
      'style',
      'top:' + win.top + 'px;' +
      'left: ' + win.left + 'px;' +
      'width: '+ win.width + 'px;' +
      'height: ' + win.height + 'px;',
      'view_id', win.view_id
    ];
    if (win.window_class)
    {
      ret.push('class', win.window_class);
    }
    return ret;
  }

  this._window_type_hud = function(win)
  {
    return (
    ['window',
      ['window-control', 'handler', 'window-scale-top', 'class', 'window-scale-top'],
      'id', win.id,
      'style',
      'top:' + win.top + 'px;' +
      'left: ' + win.left + 'px;' +
      'width: '+ win.width + 'px;' +
      'height: ' + win.height + 'px;',
      'view_id', win.view_id,
      'class', 'hud'
    ]);
  }

  this.window_header = function(name)
  {
    return ['window-header',
        ['window-control', 'handler', 'window-close', 'class', 'window-close'],
        name,
      'handler', 'window-move',
      'class', 'window-move'
    ]
  }
}).apply(window.templates);
