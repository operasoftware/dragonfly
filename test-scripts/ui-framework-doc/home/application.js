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
new cls.HelloWorldView('hello-world', "Navigation", 'scroll navigation-tab');

ui_framework.layouts.main_layout =
{
  id: 'main-view', 
  tabs: ['hello-world-composite']
}

ui_framework.layouts.hello_world_rough_layout =
{
  dir: 'h',
  tabs: ['hello-world'] 
}

var helloWorldApplication = new function()
{
  ui_framework.beforeSetup = function()
  {
    new CompositeView('hello-world-composite', "Hello World", ui_framework.layouts.hello_world_rough_layout);
  }
  ui_framework.afterSetup = function()
  {
    new TopCell(ui_framework.layouts.main_layout);
  }
}
