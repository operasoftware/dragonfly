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
new cls.HelloWorldView('hello-world-toolbar-search', "Navigation", 'scroll navigation-tab');

new ToolbarConfig
(
  'hello-world-toolbar-search',
  null,
  [
    {
      handler: 'test-text-search',
      title: "Test Search"
    }
  ]
);

(function()
{
  var textSearch = new TextSearch();

  var onViewCreated = function(msg)
  {
    if( msg.id == 'hello-world-toolbar-search' )
    {
      textSearch.setContainer(msg.container);
      textSearch.setFormInput(views['hello-world-toolbar-search'].getToolbarControl( msg.container, 'test-text-search'));
    }
  }

  var onViewDestroyed = function(msg)
  {
    if( msg.id == 'hello-world-toolbar-search' )
    {
      textSearch.cleanup();
      //topCell.statusbar.updateInfo();
    }
  }

  var onActionModeChanged = function(msg)
  {
    if( msg.id == 'dom' && msg.mode == 'default' )
    {
      textSearch.revalidateSearch();
    }
  }

  messages.addListener('view-created', onViewCreated);
  messages.addListener('view-destroyed', onViewDestroyed);
  messages.addListener('action-mode-changed', onActionModeChanged);

  eventHandlers.input['test-text-search'] = function(event, target)
  {
    textSearch.searchDelayed(target.value);
  }

  eventHandlers.keyup['test-text-search'] = function(event, target)
  {
    if( event.keyCode == 13 )
    {
      textSearch.highlight();
    }
  }

})();

ui_framework.layouts.main_layout =
{
  id: 'main-view', 
  tabs: ['hello-world-composite']
}

ui_framework.layouts.hello_world_rough_layout =
{
  dir: 'h',
  tabs: ['hello-world-toolbar-search'] 
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
