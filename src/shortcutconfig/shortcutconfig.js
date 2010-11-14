window.cls || (window.cls = {});

/**
  * @constructor 
  * @extends ViewBase
  */

cls.ShortcutConfigView = function(id, name, container_class)
{
  this.init(id, name, container_class);
}

cls.ShortcutConfigView.create_ui_widgets = function()
{
  new Settings
  (
    // id
    'shortcut_config', 
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
    }


  );
  
  window.eventHandlers.click['scc-expand-section'] = function(event, target)
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
  }
  
  window.eventHandlers.click['scc-save-shortcuts'] = function(event, target)
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
    shortcuts_match = is_search ? {"default": {}, "edit": {}} : null,
    shortcuts_match_mode = null;
        
    if (trs)
    {
      for (; tr = trs[i]; i++)
      {
        mode = tr.getAttribute('data-mode');
        if (mode)
        {
          shortcuts[mode] = cur_mode = {};
          if (shortcuts_match && shortcuts_match[mode])
            shortcuts_match_mode = shortcuts_match[mode];
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
    if (!invalid_shortcuts.length)
      alert(JSON.stringify(shortcuts)+'\n'+invalid_shortcuts)
  }
  
  var search_mode = function(mode_source, search)
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
  
  window.eventHandlers.input['scc-quick-find'] = function(event, target)
  {
    var search = event.target.value.toLowerCase().trim();
    var broker = ActionBroker.get_instance();
    var shortcuts = broker.get_shortcuts();
    var cur_section = null;
    var cur_mode = null;
    var shortcuts_match = {is_search: Boolean(search)};
    var section = '';
    var mode = '';
    var has_match = false;
    var container = event.target;
    var ul = null;
    var tpl = null;
    
    for (section in shortcuts)
    {
      shortcuts_match[section] = 
      {
        "default": {}, 
        "edit": {}, 
        is_search: Boolean(search)
      };
      shortcuts_match[section]["default"] = 
        search_mode(shortcuts[section]["default"], search);
      shortcuts_match[section]["edit"] = 
        search_mode(shortcuts[section]["edit"], search);
      shortcuts_match[section].has_match = 
        shortcuts_match[section]["default"].has_match ||
        shortcuts_match[section]["edit"].has_match;
    }
    
    while (container && container.nodeName.toLowerCase() != "setting-composite")
      container = container.parentNode;
    
    if (container)
    {
      tpl = templates.scc_sections(shortcuts, search && shortcuts_match);
      if (ul = container.getElementsByTagName('ul')[0])
        container.replaceChild(document.render(tpl), ul);
    }
    
  }
  
  
  
};