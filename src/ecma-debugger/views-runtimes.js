var cls = window.cls || ( window.cls = {} );

cls.RuntimesView = function(id, name, container_class)
{
  this.init(id, name, container_class);
}
cls.RuntimesView.prototype = ViewBase;
new cls.RuntimesView('runtimes', ui_strings.M_VIEW_LABEL_SCRIPTS, 'scroll runtimes');

// settings are bound to a view, currently
new Settings
(
  // id
  'runtimes', 
  // kel-value map
  {
    'selected-window': '',
    'reload-runtime-automatically': true
  }, 
  // key-label map
  {
    'reload-runtime-automatically': ui_strings.S_SWITCH_RELOAD_SCRIPTS_AUTOMATICALLY
  },
  // settings map
  {
    checkboxes:
    [
      'reload-runtime-automatically'
    ]
  }
);
