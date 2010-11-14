(function()
{
  this.shortcut_config = function()
  {
    var shortcuts = ActionBroker.get_instance().get_shortcuts();
    return (
    ['setting-composite',
        this.scc_control(['Reset all to defaults', 'scc-reset-all-to-defaults']),
        ['filter', 
          ['em', 'Quick find' ],
          ['input', 
            'autocomplete', 'off', 
            'type', 'text', 
            'handler', 'scc-quick-find', 
            'title', 'Find shortcut',
            'default-text', 'Quick find'
          ],
          'focus-handler', 'focus',
          'blur-handler', 'blur' 
        ],
      this.scc_sections(shortcuts),
    ]);
  }
  
  this.scc_sections = function(shortcuts, shortcuts_match)
  {

    var sections = [];
    for (var key in shortcuts)
      sections.push({id: key, 
                     name: window.views[key].name,
                     is_search: Boolean(shortcuts_match),
                     has_match: shortcuts_match && shortcuts_match[key].has_match});
    return (
    ['ul', 
      sections.map(this.scc_section.bind(this, shortcuts, shortcuts_match)), 
      'class', 'shortcuts-config'
    ]);
  }
  
  this.scc_section = function(shortcuts, shortcuts_match, section, index)
  {
    return (
    [
      'li',
        ['header',
          ['input', 
            'type', 'button', 
            'class', section.has_match ? 'unfolded' : ''
          ],
          section.name,
        ].concat(section.is_search ?
                 [] :
                 ['handler', 'scc-expand-section']),
        section.is_search && section.has_match ?
        this.scc_shortcuts_table(section.id, 
                                 shortcuts[section.id], 
                                 shortcuts_match[section.id]) :
        [],
      'handler-id', section.id,
      'class', section.is_search && !section.has_match ? 'search-no-match' : ''
    ]);
  }
  
  this.scc_shortcuts_table = function(handler_id, shortcuts, shortcuts_match, invalid_shortcuts)
  {
    var broker = ActionBroker.get_instance();
    var actions = broker.get_actions_with_handler_id(handler_id);
    if (!shortcuts)
    {
      shortcuts = broker.get_shortcuts();
      shortcuts = shortcuts && shortcuts[handler_id];
    }
    if (shortcuts && actions)
    {
      var ret = [];
      var action_select = this.scc_action_select.bind(this, actions);
      var modes = ["default", "edit"], mode = '', i = 0;
      for (; mode = modes[i]; i++)
      {
        ret.extend(this.scc_shortcuts_mode(handler_id, 
                                           mode, 
                                           shortcuts[mode], 
                                           shortcuts_match && shortcuts_match[mode],
                                           action_select,
                                           invalid_shortcuts));
        if (!shortcuts_match)
          ret.push(this.scc_controls([['Add', 'scc-add-shortcut']]));
      }
      if (shortcuts_match)
        ret.push(this.scc_controls([['Save', 'scc-save-shortcuts']]));
      else
        ret.push(this.scc_controls([['Reset to defaults', 'scc-reset-to-defaults'],
                                    ['Save', 'scc-save-shortcuts']]));
      return (
      ['table', 
        ret, 
        'handler-id', handler_id, 
        'class', 'shortcuts' + (shortcuts_match ? ' is-search' : '')
      ]);
    }
  }
  
  this.scc_shortcuts_mode = function(handler_id, 
                                     mode, 
                                     shortcuts, 
                                     shortcuts_match,
                                     action_select, 
                                     invalid_shortcuts)
  {
    var labels = 
    {
      "default": "Shortcuts %s in default mode",
      "edit": "Shortcuts %s in edit mode"
    };
    var tr =
    ['tr', 
      ['th', 
        labels[mode].replace("%s", views[handler_id].name), 
        'colspan', '2',
      ],
      'data-mode', mode
    ];
    if (shortcuts_match && !shortcuts_match.has_match)
      tr.push('class', 'scc-no-match');
    var ret = [tr];
    var is_invalid = false;
    for (var shortcut in shortcuts)
    {
      is_invalid = invalid_shortcuts && 
                   (invalid_shortcuts.indexOf(shortcut) != -1);
      tr =
      ['tr', 
        ['td',
          is_invalid ?
          ['p', 'Invalid shortcut:', 'class', 'invalid-shortcut'] :
          [],
          ['input', 'value', shortcut, 'class', 'scc-input'],
        ],
        ['td', action_select(shortcuts[shortcut])]
      ];
      if (shortcuts_match && !(shortcut in shortcuts_match))
        tr.push('class', 'scc-no-match');
      ret.push(tr);
    }
    return ret;
  };
  
  this.scc_controls = function(label_handler_list)
  {
    return (
    ['tr',
      ['td',
        label_handler_list.map(this.scc_control, this),
        'colspan', '2',
        'class', 'controls'
      ]
    ]);
  };
  
  this.scc_control = function(label_handler)
  {
    const LABEL = 0, HANDLER = 1;
    return (
    ['input',
      'type', 'button',
      'value', label_handler[LABEL],
      'handler', label_handler[HANDLER]
    ]);
  };
  
  this.scc_action_select = function(action_list, selected_action)
  {
    var ret = [], i = 0, action = null;
    for (; action = action_list[i]; i++)
    {
      if (selected_action == action)
        ret.push(['option', action, 'selected', 'selected']);
      else
        ret.push(['option', action])
    }
    return ['select', ret, 'class', 'scc-select'];
  };
  
  this._scc_sort_by_name = function(a, b)
  { 
    return a.name < b.name ? 1 : a.name > b.name ? -1 : 0;
  };
  
}).apply(window.templates || (window.templates = {})); 