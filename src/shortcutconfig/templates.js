(function()
{
  this.shortcut_config = function()
  {
    var shortcuts = ActionBroker.get_instance().get_shortcuts();
    var quick_find =
    {
      label: ui_strings.S_INPUT_DEFAULT_TEXT_FILTER,
      handler: 'scc-quick-find',
      title: ui_strings.S_BUTTON_SEARCH_SHORTCUT,
      type: "filter"
    };
    return (
    ['setting-composite',
      ['toolbar',
        ['toolbar-buttons',
          this.scc_control([ui_strings.S_BUTTON_RESET_ALL_TO_DEFAULTS,
                            'scc-reset-all-to-defaults']),
        ],
        this.filters([quick_find]),
        'style', 'position: static;',
      ],
      this.scc_sections(shortcuts),
      'class', 'shortcuts-config'
    ]);
  }

  this.scc_sections = function(shortcuts, shortcuts_match)
  {
    var sections = [];
    var broker = ActionBroker.get_instance();
    for (var key in shortcuts)
    {
      if (broker.get_actions_with_handler_id(key))
        sections.push({id: key,
                       name: window.views[key]
                           ? window.views[key].name
                           : broker.get_shared_shortcuts_label(key),
                       is_search: Boolean(shortcuts_match),
                       has_match: shortcuts_match && shortcuts_match[key].has_match});
    }

    return (
    ['ul',
      sections.map(this.scc_section.bind(this, shortcuts, shortcuts_match)),

    ]);
  }

  this.scc_section = function(shortcuts, shortcuts_match, section, index)
  {
    var header =
    ['header',
      ['input',
        'type', 'button',
        'class', section.has_match ? 'unfolded' : ''
      ],
      section.name,
    ];
    if (!section.is_search)
      header.push('handler', 'scc-expand-section');
    var li = ['li', header];
    if (section.is_search)
    {
      if (section.has_match)
        li.push(this.scc_shortcuts_table(section.id,
                                         shortcuts[section.id],
                                         shortcuts_match[section.id]));
      else
        li.push('class', 'search-no-match');
    }
    li.push('handler-id', section.id);
    return li;
  }

  this.scc_shortcuts_table = function(handler_id,
                                      shortcuts,
                                      shortcuts_match,
                                      invalid_shortcuts)
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
      var mode_label = '';
      for (var mode in shortcuts)
      {
        mode_label = broker.get_label_with_handler_id_and_mode(handler_id, mode);
        ret.extend(this.scc_shortcuts_mode(handler_id,
                                           mode,
                                           mode_label,
                                           shortcuts[mode],
                                           shortcuts_match && shortcuts_match[mode],
                                           action_select,
                                           invalid_shortcuts));
        if (!shortcuts_match)
          ret.push(this.scc_controls([[ui_strings.S_LABEL_STORAGE_ADD,
                                       'scc-add-shortcut']]));
      }
      if (shortcuts_match)
        ret.push(this.scc_controls([[ui_strings.S_BUTTON_TEXT_APPLY,
                                     'scc-save-shortcuts']]));
      else
        ret.push(this.scc_controls([[ui_strings.S_BUTTON_RESET_TO_DEFAULTS,
                                     'scc-reset-to-defaults'],
                                    [ui_strings.S_BUTTON_TEXT_APPLY,
                                     'scc-save-shortcuts']]));
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
                                     mode_label,
                                     shortcuts,
                                     shortcuts_match,
                                     action_select,
                                     invalid_shortcuts)
  {
    var tr = ['tr', ['th', mode_label, 'colspan', '2'], 'data-mode', mode];
    if (shortcuts_match && !shortcuts_match.has_match)
      tr.push('class', 'scc-no-match');
    var ret = [tr];
    var is_invalid = false;
    for (var shortcut in shortcuts)
    {
      is_invalid = invalid_shortcuts &&
                   invalid_shortcuts.indexOf(shortcut) != -1;
      tr =
      ['tr',
        ['td',
          ['input', 'value', shortcut, 'class', 'scc-input'],
        ],
        ['td', action_select(shortcuts[shortcut])]
      ];
      if (is_invalid)
        tr.push('class', 'invalid-shortcut');
      if (shortcuts_match && !(shortcut in shortcuts_match))
        tr.push('class', 'scc-no-match');
      ret.push(tr);
      if (is_invalid)
        ret.push(this.ssc_invalid_shortcut());
    }
    return ret;
  };

  this.ssc_invalid_shortcut = function()
  {
    return (
    ['tr',
      ['td', ui_strings.S_LABEL_KEYBOARDCONFIG_INVALID_SHORTCUT, 'colspan', '2'],
      'class', 'invalid-shortcut'
    ]);
  }

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
    ['button',
      label_handler[LABEL],
      'handler', label_handler[HANDLER],
      'class', 'ui-button',
      'tabindex', '1'
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
