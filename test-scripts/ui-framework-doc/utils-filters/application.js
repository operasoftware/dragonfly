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


cls.HelloWorldViewFilters = function(id, name, container_class)
{
  var self = this;

  this.createView = function(container)
  {
    container.clearAndRender
    (
      ['div', 
        ['h2', 'Actions, Keyhandler, und Filter'], 
        ['p', 'Click the pane to set the focus. Use arrow keys to select a match. Filter nodes:', 
          ['input', 'value', '*']
        ],
        ['div', 'div',
          ['div', 'div',
            ['div', 'div',
              ['div', 'div',
                ['span', 'span'],
                ['p', 'p']
              ],
              ['div', 'div',
                ['span', 'span'],
                ['p', 'p', ['span', 'span']]
              ],
              ['span', 'span']
              ['p', 'p']
            ],
          ['span', 'span']
          ['p', 'p']
          ],
          ['div', 'div',
            ['span', 'span'],
            ['p', 'p']
          ],
          ['div', 'div',
            ['span', 'span'],
            ['p', 'p']
          ]
        ],
        'class', 'padding'
      ]
    )
  }
  this.init(id, name, container_class);
}

cls.HelloWorldViewFilters.prototype = ViewBase;
new cls.HelloWorldViewFilters('hello-world-filters', "Filters", 'scroll filters');

/**
  * @constructor 
  * @extends BaseActions
  */

cls.TestFiltersActions = function(id)
{
  var self = this;
  var test_container = null;
  var selected_ele = null;
  var selection = null;
  var range = null;
  var filter_value = null;

  this.view_id = id;

  this.setContainer = function(event, container)
  {
    test_container = container.getElementsByTagName('div')[0];
    filter_value = container.getElementsByTagName('input')[0];
    selection = getSelection();
    range = document.createRange();
    this.setSelected(selected_ele || ( selected_ele = test_container.firstElementChild ) )
    this.setSelected(selected_ele);
  }
  var filter = function(ele)
  { 
    var value = filter_value.value;
    return ele.firstChild && ( value == '' || value == '*' || value == ele.nodeName );
  }
  this.setSelected = function(ele)
  {
    if(ele)
    {
      selection.collapse(document.documentElement, 0)
      range.selectNodeContents(ele.firstChild);
      selection.addRange(range);
      selected_ele = ele;
    }
  }
  this.blur = function(event)
  {
    test_container = null;
    selected_ele = null;
    selection = null;
    range = null;
  }
  this.nav_up = this.nav_left = function(event, action_id)
  {
    this.setSelected(selected_ele.getPreviousWithFilter(test_container, filter));
    return true;
  }
  this.nav_down = this.nav_right = function(event, action_id)
  {
    this.setSelected(selected_ele.getNextWithFilter(test_container, filter));
    return true;
  }
  this.select_all = function(event, action_id)
  {
    var selection = getSelection();
    var range = document.createRange();
    selection.collapse(view_container, 0);
    range.selectNodeContents(view_container);
    selection.addRange(range);
  }
  this.init(id);
};

cls.TestFiltersActions.prototype = BaseActions;

new cls.TestFiltersActions('hello-world-filters'); // the view id

/**
  * @constructor 
  * @extends BaseKeyhandler
  */

cls.DOMInspectorKeyhandler = function(id)
{
  var __actions = actions[id];

  this[this.NAV_UP] =  function(event, action_id)
  {
    return __actions.nav_up(event, action_id);
  }
  this[this.NAV_DOWN] = function(event, action_id)
  {
    return __actions.nav_down(event, action_id);
  }
  this[this.NAV_LEFT] = function(event, action_id)
  {
    return __actions.nav_left(event, action_id);
  }
  this[this.NAV_RIGHT] = function(event, action_id)
  {
    return __actions.nav_right(event, action_id);
  }
  this.focus = function(event, container)
  {
    __actions.setContainer(event, container);
  }
  this.blur = function(event)
  {
    __actions.blur(event);
  }
  this.init(id);
};

cls.DOMInspectorKeyhandler.prototype = BaseKeyhandler;

new cls.DOMInspectorKeyhandler('hello-world-filters');


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
  tabs: ['hello-world-filters']
  
}

var helloWorldApplication = new function()
{
  ui_framework.beforeSetup = function()
  {
    new CompositeView('hello-world-composite-1', "Navigation", ui_framework.layouts.hello_world_rough_layout_1);
    new CompositeView('hello-world-composite-templates', "Actions, Keyhandlers and Filters", ui_framework.layouts.hello_world_rough_layout_2);
  }
  ui_framework.afterSetup = function()
  {
    new TopCell(ui_framework.layouts.main_layout);
    topCell.showView('hello-world-filters');
  }
}
