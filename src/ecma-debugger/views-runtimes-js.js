(function()
{
  var View = function(id, name, container_class)
  {
    var self = this;

    this.createView = function(container)
    {
      container.innerHTML = '';
      //container.render(templates.runtimes(runtimes.getRuntimes()));
      container.render(templates.windows(runtimes.getWindows(), 'script'));
    }
    this.init(id, name, container_class);
  }
  View.prototype = ViewBase;
  new View('runtimes', 'Runtimes Script', 'scroll runtimes');

  var templates = window.templates ? window.templates : ( window.templates = {} );
  templates.windowSelect = function()
  {
    return [
      'window-select',
      [
        'select',
        'handler', this.handler
      ]
    ];
  }

  new ToolbarConfig
  (
    'runtimes',
    [
      {
        handler: 'reload-window',
        title: 'Reload selected window in the host'
      }
    ],
    null,
    null,
    [
      {
        handler: 'select-window',
        title: 'Select which window you like to debug',
        type: 'dropdown',
        class: 'window-select-dropdown',
        template: templates.windowSelect
      }
    ]
  )

})()