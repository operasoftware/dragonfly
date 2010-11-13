(function()
{
  this.shortcut_config = function()
  {
    var shortcuts = ActionBroker.get_instance().get_shortcuts();
    var sections = [];
    for (var key in shortcuts)
      sections.push({id: key, name: window.views[key].name});
    //sections.sort(this._scc_sort_by_name);
    return (
    ['setting-composite',
        ['filter', 
          ['em', 'Quick find' ],
          [
            'input', 
            'autocomplete', 'off', 
            'type', 'text', 
            'handler', 'scc-quick-find', 
            'title', 'Find shortcut',
            'default-text', 'Quick find'
          ],
          'focus-handler', 'focus',
          'blur-handler', 'blur' 
        ],
      ['ul', sections.map(this.scc_section)]
    ]);
  }
  
  this.scc_section = function(section, index)
  {
    return (
    [
      'li',
        ['header',
          ['input', 'type', 'button'],
          section.name,
          'handler', 'scc-expand-section',
        ],
      'handler-id', section.id,
      'class', section.is_search && !section.is_unfolded ? 'search-no-match' : ''
    ]);
  }
  
  this.scc_shortcuts_table = function(handler_id)
  {
    var broker = ActionBroker.get_instance();
    var shortcuts = broker.get_shortcuts();
    var actions = broker.get_actions_with_handler_id(handler_id);
    shortcuts = shortcuts && shortcuts[handler_id];
    if (shortcuts && actions)
    {
      var ret = [];
      var action_select = this.scc_action_select.bind(this, actions);
      var mode = '';
      for (mode in shortcuts)
      {
        ret.extend(this.scc_shortcuts_mode(mode, shortcuts[mode], action_select));
        ret.push(this.scc_controls([['Add', 'scc-add-shortcut']]));
      }
      ret.push(this.scc_controls([['Reset to defaults', 'scc-reset-to-defaults'],
                                  ['Save', 'scc-save-shartcuts']]));
      return ['table', ret, 'handler-id', handler_id];
      
    }
    else
    {
    
    }
  }
  
  this.scc_controls = function(label_handler_list)
  {
    return (
    ['tr',
      label_handler_list.map(this.scc_control, this),
      'colspan', '2'
    ]);
  }
  
  this.scc_control = function(label_handler)
  {
    const LABEL = 0, HANDLER = 1;
    return (
    ['input',
      'type', 'button',
      'value', label_handler[LABEL],
      'handler', label_handler[HANDLER]
    ]);
  }
  this.scc_shortcuts_mode = function(mode, shortcuts, action_select)
  {
    var labels = 
    {
      "default": "Shortcuts in default mode",
      "edit": "Shortcuts in edit mode"
    };
    var ret = [['tr', ['th', labels[mode], 'colspan', '2', 'data-mode', mode]]];
    for (var shortcut in shortcuts)
      ret.push(
      ['tr', 
        ['td', ['input', 'value', shortcut]], 
        ['td', action_select(shortcuts[shortcut])]
      ]);
    return ret;
  }
  
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
    return ['select', ret];
  }
  this._scc_sort_by_name = function(a, b)
  { 
    return a.name < b.name ? 1 : a.name > b.name ? -1 : 0;
  }
}).apply(window.templates || (window.templates = {})); 