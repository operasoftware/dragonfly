/**
  * @constructor 
  * @extends ViewBase
  */

cls.HelloWorldView = function(id, name, container_class, template)
{
  var self = this;
  this.createView = function(container)
  {
    container.render(template);
  }
  this.init(id, name, container_class);
}

cls.HelloWorldView.prototype = ViewBase;
new cls.HelloWorldView('hello-world-1', "Navigation", 'scroll navigation-tab', 
  ['div', 
    ['h1', 'Hello World'],
    ['p', 'A short documentation of the ui framework used in Opera Dragonfly'],
    templates.navigation(),
  'class', 'padding'
  ]
);
new cls.HelloWorldView('hello-world-2', "Hello World 2", 'scroll tab-2',   
  ['div', 
    ['h1', 'Hello World'],
  'class', 'padding'
  ]
);
new cls.HelloWorldView('hello-world-3', "Hello World 3", 'scroll tab-3',   
  ['div', 
    ['h1', 'Hello World'],
  'class', 'padding'
  ]
);
new cls.HelloWorldView('hello-world-4', "Hello World 4", 'scroll tab-4',   
  ['div', 
    ['h1', 'Hello World'],
  'class', 'padding'
  ]
);

ui_framework.layouts.main_layout =
{
  id: 'main-view', 
  tabs: ['hello-world-composite-1', 'hello-world-composite-2', 'hello-world-composite-3', 'hello-world-composite-4']
}

ui_framework.layouts.hello_world_rough_layout_1 =
{
  dir: 'h', width: 700, height: 700,
  tabs: ['hello-world-1']
}

ui_framework.layouts.hello_world_rough_layout_2 =
{
  dir: 'h', width: 700, height: 700,
  tabs: ['hello-world-2']
}

ui_framework.layouts.hello_world_rough_layout_3 =
{
  dir: 'h', width: 700, height: 700,
  tabs: ['hello-world-3']
}

ui_framework.layouts.hello_world_rough_layout_4 =
{
  dir: 'h', width: 700, height: 700,
  tabs: ['hello-world-4']
}

var helloWorldApplication = new function()
{
  ui_framework.beforeSetup = function()
  {
    new CompositeView('hello-world-composite-1', "Navigation", ui_framework.layouts.hello_world_rough_layout_1);
    new CompositeView('hello-world-composite-2', "Hello World 2", ui_framework.layouts.hello_world_rough_layout_2);
    new CompositeView('hello-world-composite-3', "Hello World 3", ui_framework.layouts.hello_world_rough_layout_3);
    new CompositeView('hello-world-composite-4', "Hello World 4", ui_framework.layouts.hello_world_rough_layout_4);
  }
  ui_framework.afterSetup = function()
  {
    new TopCell(ui_framework.layouts.main_layout);
  }
}
