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
new cls.HelloWorldView('hello-world-1', "Navigation", 'scroll navigation-tab');


cls.HelloWorldViewTemplatesCode = function(id, name, container_class)
{
  var self = this;
  var source_file = '';
  var GetSource = function(url, org_args)
  {
    this.onload = function()
    {
      source_file = this.responseText;
      org_args.callee.apply(self, org_args);
    }
    this.open('GET', url);
    this.send();
  }
  var getSource = function(org_args)
  {
    if( source_file.length )
    {
      return source_file;
    }
    GetSource.call(new XMLHttpRequest(), 'application.js', org_args);
    return '';
  }
  this.createView = function(container)
  {
    var source_file = getSource(arguments);
    if(source_file.length)
    {
      var script_obj = {};
      script_obj.source = script_obj.source_data = new String(source_file);
      script_obj.line_arr = [];
      script_obj.state_arr = [];
      pre_lexer(script_obj);
      container.innerHTML = "\
      <div class='padding'>\
      <h1>Code</h1>\
      <h2>Data</h2>\
      <pre>" + simple_js_parser.format(script_obj, 101, 143 - 101 ).join('') + "</pre>\
      <h2>Templates</h2>\
      <pre>" + simple_js_parser.format(script_obj, 144, 168 - 144 ).join('') + "</pre>\
      <h2>Call</h2>\
      <pre>" + simple_js_parser.format(script_obj, 83, 93 - 83 ).join('') + "</pre>\
      </div>";
    }
  }
  this.init(id, name, container_class);
}

cls.HelloWorldViewTemplatesCode.prototype = ViewBase;
new cls.HelloWorldViewTemplatesCode('hello-world-templates-code', "Code", 'scroll templates-code');

cls.HelloWorldViewTemplatesView = function(id, name, container_class)
{
  var self = this;


  this.createView = function(container)
  {
    container.clearAndRender
    (
      ['div',
        ['h1', 'View'],
        templates.addressbook(addressbook),
        'class', 'padding'
      ]
    )
  }
  this.init(id, name, container_class);
}

cls.HelloWorldViewTemplatesView.prototype = ViewBase;
new cls.HelloWorldViewTemplatesView('hello-world-templates-view', "View", 'scroll templates');


var addressbook =
[
  {
    name: "Peter",
    last_name: "Karlson",
    address: "Toftesgate 8",
    city: "Oslo",
    phone_numbers:
    [
      {
        number: 78656543,
        type: "private"
      }
    ]  
  },
  {
    name: "Olav",
    last_name: "Torstein",
    address: "Waldemar Thranes gate 81",
    city: "Oslo",
    phone_numbers:
    [
      {
        number: 78656543,
        type: "private"
      }
    ]  
  },
  {
    name: "Rune",
    last_name: "Hansen",
    address: "Thorvald Meyers gate 77",
    city: "Oslo",
    phone_numbers:
    [
      {
        number: 78656543,
        type: "private"
      }
    ]  
  }
]

window.templates || ( window.templates = {} );

templates.addressbook = function(addressbook)
{
  return ['ul', addressbook.map(templates.person)];
}

templates.person = function(person)
{
  return \
  [
    'li',
    ['h3', person.name + ' ' + person.last_name],
    ['h4', 'Address:'],
    ['p', person.city + ', ' + person.address],
    ['h4', 'Phone Numbers:'],
    ['ul', person.phone_numbers.map(templates.phonenumber)]
  ]
}

templates.phonenumber = function(phonenumber)
{
  return ['li', phonenumber.type + ': ' + phonenumber.number]
}



ui_framework.layouts.main_layout =
{
  id: 'main-view', 
  tabs: ['hello-world-composite-1', 'hello-world-composite-templates']
}

ui_framework.layouts.hello_world_rough_layout_1 =
{
  dir: 'h', width: 700, height: 700,
  tabs: ['hello-world-1']
}

ui_framework.layouts.hello_world_rough_layout_2 =
{
  dir: 'h', width: 700, height: 700,
  children:
  [
    {
      width: 500,
      tabs: ['hello-world-templates-code']
    },
    {
      tabs: ['hello-world-templates-view']
    }
  ]
  
}

var helloWorldApplication = new function()
{
  ui_framework.beforeSetup = function()
  {
    new CompositeView('hello-world-composite-1', "Navigation", ui_framework.layouts.hello_world_rough_layout_1);
    new CompositeView('hello-world-composite-templates', "Templates", ui_framework.layouts.hello_world_rough_layout_2);
  }
  ui_framework.afterSetup = function()
  {
    new TopCell(ui_framework.layouts.main_layout);
    topCell.showView('hello-world-templates-code');
  }
}
