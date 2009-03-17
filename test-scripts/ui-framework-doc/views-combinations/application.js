/**
  * @constructor 
  * @extends ViewBase
  */

cls.HelloWorldView = function(id, name, container_class, template)
{
  var self = this;
  this.createView = function(container)
  {
    container.clearAndRender(template);
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
  tabs: ['hello-world-composite', 'hello-world-composite-2']
}

ui_framework.layouts.hello_world_rough_layout =
{
  dir: 'h', width: 700, height: 700,
  children: 
  [
    { 
      width: 450, 
      children: 
      [
        { 
          height: 350, 
          tabs: ['hello-world-1', 'hello-world-2']
        },
         { 
          height: 700, 
          tabs: ['hello-world-2', 'hello-world-3']
        },
      ] 
    },
    { 
      width: 700, 
      children: 
      [
        { 
          height: 250, 
          tabs: ['hello-world-3', 'hello-world-4'] 
        },
         { 
          height: 700, 
          tabs: ['hello-world-4', 'hello-world-1'] 
        },
      ] 
    },
  ]
}

ui_framework.layouts.hello_world_2_rough_layout =
{
  dir: 'v', width: 700, height: 700,
  children: 
  [
    { 
      height: 250,
      tabs: ['hello-world-1']
    },
    { 
      children:
      [
        {
          width: 450,
          tabs: ['hello-world-2', 'hello-world-3', 'hello-world-4']
        },
        {tabs: ['hello-world-4', 'hello-world-3', 'hello-world-2']}
      ]
    },
  ]
}

var helloWorldApplication = new function()
{
  ui_framework.beforeSetup = function()
  {
    new CompositeView('hello-world-composite', "Hello World", ui_framework.layouts.hello_world_rough_layout);
    new CompositeView('hello-world-composite-2', "Second Tab", ui_framework.layouts.hello_world_2_rough_layout);
  }
  ui_framework.afterSetup = function()
  {
    new TopCell(ui_framework.layouts.main_layout);
  }
}
