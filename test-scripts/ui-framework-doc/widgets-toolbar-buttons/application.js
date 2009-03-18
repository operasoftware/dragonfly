/**
  * @constructor 
  * @extends ViewBase
  */

cls.HelloWorldView = function(id, name, container_class)
{
  var self = this;
  this.createView = function(container)
  {
    container.render
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
new cls.HelloWorldView('hello-world-toolbar-button', "Navigation", 'scroll navigation-tab');

new ToolbarConfig
(
  'hello-world-toolbar-button',
  [
    {
      handler: 'test-toolbar-button',
      title: "Test how toolbar button works"
    }
  ]
)

eventHandlers.click['test-toolbar-button'] = function(event, target)
{
  alert('Hello World Toolbar Button');
}

ui_framework.layouts.main_layout =
{
  id: 'main-view', 
  tabs: ['hello-world-composite']
}

ui_framework.layouts.hello_world_rough_layout =
{
  dir: 'h',
  tabs: ['hello-world-toolbar-button'] 
}

var helloWorldApplication = new function()
{
  ui_framework.beforeSetup = function()
  {
    new CompositeView('hello-world-composite', "Hello World Toolbar Button", ui_framework.layouts.hello_world_rough_layout);
  }
  ui_framework.afterSetup = function()
  {
    new TopCell(ui_framework.layouts.main_layout);
  }
}
