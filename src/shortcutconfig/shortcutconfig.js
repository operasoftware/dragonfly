window.cls || (window.cls = {});

/**
  * @constructor
  * @extends ViewBase
  */

cls.ShortcutConfigView = function(id, name, container_class)
{
  this.init(id, name, container_class);

  /* ActionHandler interface */

  const
  GLOBAL_HANDLER = "global",
  MINUS = -1,
  PLUS = 1;

  this.id = id;
  this._broker = ActionBroker.get_instance();
  this._broker.register_handler(this);
  this._handlers = {};

  this.get_action_list = function()
  {
    var actions = [], key = '';
    for (key in this._handlers)
      actions.push(key);
    return actions;
  };

  this.focus = function(event, container){};

  this.blur = function(event){};

  this.onclick = function(event){};

  this.handle = function(action_id, event, target)
  {
    if (action_id in this._handlers)
      return this._handlers[action_id](event, target);
  }

  this._handlers['expand-section'] = function(event, target)
  {
    var
    parent = target.parentNode,
    handler_id = parent.getAttribute('handler-id'),
    table = parent.getElementsByTagName('table')[0],
    input = target.getElementsByTagName('input')[0];

    if (table)
    {
      parent.removeChild(table);
      input.removeClass('unfolded');
    }
    else
    {
      parent.render(window.templates.scc_shortcuts_table(handler_id));
      input.addClass('unfolded');
    }
  }.bind(this);

  this._handlers['save-shortcuts'] = function(event, target)
  {
    var
    shortcuts = {},
    cur_mode = null,
    mode = null,
    select = null,
    input = null,
    shortcut = '',
    invalid_shortcuts = [],
    table = event.target.has_attr('parent-node-chain', 'handler-id'),
    handler_id = table && table.getAttribute('handler-id'),
    trs = table && table.getElementsByTagName('tr'),
    tr = null,
    i = 0,
    is_search = table && table.hasClass('is-search'),
    shortcuts_match = is_search ? {} : null,
    shortcuts_match_mode = null;

    if (trs)
    {
      for (; tr = trs[i]; i++)
      {
        mode = tr.getAttribute('data-mode');
        if (mode)
        {
          shortcuts[mode] = cur_mode = {};
          if (shortcuts_match)
            shortcuts_match_mode = shortcuts_match[mode] = {};
        }
        if (cur_mode && (select = tr.getElementsByTagName('select')[0]))
        {
          input = tr.getElementsByTagName('input')[0];
          shortcut = input && input.value.trim() || '';
          if (shortcut)
          {
            cur_mode[shortcut] = select.value;
            if (!KeyIdentifier.validate_shortcut(shortcut))
              invalid_shortcuts.push(shortcut);
            if (shortcuts_match_mode && !tr.hasClass('scc-no-match'))
            {
              shortcuts_match_mode[shortcut] = select.value;
              shortcuts_match_mode.has_match = true;
            }
          }
        }
      }
    }

    table.re_render(window.templates.scc_shortcuts_table (handler_id,
                                                          shortcuts,
                                                          shortcuts_match,
                                                          invalid_shortcuts));

    var invalid_shortcut = document.querySelector(".invalid-shortcut input");
    if (invalid_shortcut)
    {
      invalid_shortcut.focus();
      invalid_shortcut.selectionStart = invalid_shortcut.selectionEnd = invalid_shortcut.value.length;
    }

    if (!invalid_shortcuts.length)
      this._broker.set_shortcuts(shortcuts, handler_id);
  }.bind(this);

  this._handlers['reset-all-to-defaults'] = function(event, target)
  {
    var shortcuts = window.ini.default_shortcuts;
    this._broker.set_shortcuts(shortcuts, null, true);
  }.bind(this);

  this._handlers['add-shortcut'] = function(event, target)
  {
    var
    table = event.target.has_attr('parent-node-chain', 'handler-id'),
    handler_id = table && table.getAttribute('handler-id'),
    tr = event.target,
    actions = this._broker.get_actions_with_handler_id(handler_id),
    tpl =
    ['tr',
      ['td', ['input', 'class', 'scc-input']],
      ['td', window.templates.scc_action_select(actions)]
    ];

    while (tr && tr.nodeName.toLowerCase() != "tr")
      tr = tr.parentNode;
    if (tr)
      tr.parentNode.insertBefore(document.render(tpl), tr);
  }.bind(this);

  this._handlers['reset-to-defaults'] = function(event, target)
  {
    var
    shortcuts = window.helpers.copy_object(window.ini.default_shortcuts),
    table = event.target.has_attr('parent-node-chain', 'handler-id'),
    handler_id = table && table.getAttribute('handler-id');

    shortcuts = shortcuts[handler_id];
    this._broker.set_shortcuts(shortcuts, handler_id);
    table.re_render(window.templates.scc_shortcuts_table (handler_id, shortcuts));
  }.bind(this);

  this._handlers['quick-find'] = function(event, target)
  {
    var search = event.target.value.toLowerCase().trim();
    var shortcuts = this._broker.get_shortcuts();
    var cur_section = null;
    var cur_mode = null;
    var shortcuts_match = {is_search: Boolean(search)};
    var section = '';
    var modes = null;
    var mode = '';
    var container = event.target;
    var ul = null;
    var tpl = null;
    var has_match = false;

    for (section in shortcuts)
    {
      for (mode in shortcuts[section])
      {
        if (!shortcuts_match[section])
          shortcuts_match[section] = {};
        shortcuts_match[section][mode] =
          this._search_mode(shortcuts[section][mode], search);
        if (shortcuts_match[section][mode].has_match)
          shortcuts_match[section].has_match = true;
      }
    }
    while (container && container.nodeName.toLowerCase() != "setting-composite")
      container = container.parentNode;
    if (container)
    {
      tpl = templates.scc_sections(shortcuts, search && shortcuts_match);
      if (ul = container.getElementsByTagName('ul')[0])
        container.replaceChild(document.render(tpl), ul);
    }

  }.bind(this);

  this._search_mode = function(mode_source, search)
  {
    var mode_target = {};
    var has_match = false;
    for (var key in mode_source)
    {
      if (search && key.toLowerCase().indexOf(search) != -1) // search value too?
      {
        mode_target[key] = mode_source[key];
        has_match = true;
      }
    }
    mode_target.has_match = has_match;
    return mode_target;
  }

}

cls.ShortcutConfigView.create_ui_widgets = function()
{
  new Settings
  (
    // id
    'shortcut-config',
    // key-value map
    {
      'shortcut_config': true
    },
    // key-label map
    {
    },
    // settings map
    {
      customSettings:
      [
        'shortcut_config'
      ]
    },
    // template
    {
      shortcut_config:
      function(setting)
      {
        return window.templates.shortcut_config();
      }
    },
    "keyboard-shortcuts"
  );

  window.eventHandlers.click['scc-expand-section'] = function(event, target)
  {
    this.broker.dispatch_action('shortcut-config', 'expand-section', event, target);
  };

  window.eventHandlers.click['scc-save-shortcuts'] = function(event, target)
  {
    this.broker.dispatch_action('shortcut-config', 'save-shortcuts', event, target);
  };

  window.eventHandlers.click["scc-reset-all-to-defaults"] = function(event, target)
  {
    this.broker.dispatch_action('shortcut-config', 'reset-all-to-defaults', event, target);
  };

  window.eventHandlers.click["scc-add-shortcut"] = function(event, target)
  {
    this.broker.dispatch_action('shortcut-config', 'add-shortcut', event, target);
  };

  window.eventHandlers.click["scc-reset-to-defaults"] = function(event, target)
  {
    this.broker.dispatch_action('shortcut-config', 'reset-to-defaults', event, target);
  };

  window.eventHandlers.input['scc-quick-find'] = function(event, target)
  {
    this.broker.dispatch_action('shortcut-config', 'quick-find', event, target);
  };

};
