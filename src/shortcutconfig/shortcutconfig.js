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
  
  window.eventHandlers.click['scc-save-shartcuts'] = function(event, target)
  {
    var table = event.target.has_attr('parent-node-chain', 'handler-id');
  }
  
  
};