/**
  * @constructor 
  * @extends ViewBase
  */

cls.HelloWorldView = function(id, name, container_class)
{
  var self = this;
  this.createView = function(container)
  {
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
new cls.HelloWorldView('hello-world-custom-select', "Navigation", 'scroll navigation-tab');

cls.TestSelect = function(id, class_name)
{

  var test_list =
  [
    {
      title: "Option 1",
      value: "1"
    },
    {
      title: "Option 2",
      value: "2"
    },
    {
      title: "Option 3",
      value: "3"
    },
  ];

  var selected_option = test_list[0];

  this.getSelectedOptionText = function()
  {
    return selected_option.title;
  }

  this.getSelectedOptionValue = function()
  {
    return selected_option.value;
  }

  var template_option = function(option)
  {
    return ['cst-option', option.title, 'value', option.value];
  }

  this.templateOptionList = function(select_obj)
  {
    return test_list.map(template_option);
  }

  this.checkChange = function(target_ele)
  {
    var value = target_ele.getAttribute('value');
    if( value != selected_option.value )
    {
      selected_option = test_list.filter(function(option){return option.value == value})[0];
      return true;
    }
    return false;
  }

  this.init(id, class_name);
}

cls.TestSelect.prototype = new CstSelect();
new cls.TestSelect('test-select', 'test-options');
eventHandlers.change['test-select'] = function(event)
{
  alert(window['cst-selects'][event.target.getAttribute('cst-id')].getSelectedOptionValue())
}


new ToolbarConfig
(
  'hello-world-custom-select', 
  null,
  null,
  null,
  [
    {
      template: window['cst-selects']['test-select'].getTemplate()
    }
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
  tabs: ['hello-world-custom-select']
}



var helloWorldApplication = new function()
{
  ui_framework.beforeSetup = function()
  {
    new CompositeView
    (
      'hello-world-composite', 
      'Hello World Custom Select', 
      ui_framework.layouts.hello_world_rough_layout
    );
  }
  ui_framework.afterSetup = function()
  {
    new TopCell(ui_framework.layouts.main_layout);
  }
}
