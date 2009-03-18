/**
  * @constructor 
  * @extends ViewBase
  */

cls.HelloWorldView = function(id, name, container_class)
{
  var self = this;
  this.createView = function(container)
  {
    if( settings['hello-world-toolbar-switch'].get('hello-world-test-switch') )
    {
      container.addClass('test-switch');
    }
    else
    {
      container.removeClass('test-switch');
    }
    container.clearAndRender
    (
      ['div', 
        ['h1', 'Hello World'],
        ['p', 'A short documentation of the ui framework used in Opera Dragonfly'],
        templates.navigation(),
        'class', 'padding' 
      ]
    );
  }
  this.init(id, name, container_class);
}

cls.HelloWorldView.prototype = ViewBase;
new cls.HelloWorldView('hello-world-toolbar-switch', "Navigation", 'scroll navigation-tab');


new ToolbarConfig
(
  'hello-world-toolbar-switch', []
)

new Settings
(
  // id
  'hello-world-toolbar-switch', 
  // kel-value map
  {

    'hello-world-test-switch': false
  }, 
  // key-label map
  {
    'hello-world-test-switch': "A test setting for a switch"
  },
  // settings map
  null
);

new Switches
(
  'hello-world-toolbar-switch',
  [
    'hello-world-test-switch'
  ]
)

ui_framework.layouts.main_layout =
{
  id: 'main-view', 
  tabs: ['hello-world-composite']
}

ui_framework.layouts.hello_world_rough_layout =
{
  dir: 'h',
  tabs: ['hello-world-toolbar-switch'] 
}

var helloWorldApplication = new function()
{
  ui_framework.beforeSetup = function()
  {
    new CompositeView('hello-world-composite', "Hello World Toolbar Switch", ui_framework.layouts.hello_world_rough_layout);
  }
  ui_framework.afterSetup = function()
  {
    new TopCell(ui_framework.layouts.main_layout);
  }
}
