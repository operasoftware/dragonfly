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
    i = 0;
    
    if (trs)
    {
      for (; tr = trs[i]; i++)
      {
        mode = tr.getAttribute('data-mode');
        if (mode)
          shortcuts[mode] = cur_mode = {};
        if (cur_mode && (select = tr.getElementsByTagName('select')[0]))
        {
          input = tr.getElementsByTagName('input')[0];
          shortcut = input && input.value.trim() || '';
          if (shortcut)
          {
            cur_mode[shortcut] = select.value;
            if (!KeyIdentifier.validate_shortcut(shortcut))
              invalid_shortcuts.push(shortcut);
          }
        }
      }
    }
    
    table.re_render(window.templates.scc_shortcuts_table (handler_id, 
                                                          shortcuts, 
                                                          invalid_shortcuts));
    if (!invalid_shortcuts.length)
      alert(JSON.stringify(shortcuts)+'\n'+invalid_shortcuts)
  }
  
  
};