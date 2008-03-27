(function()
{

  var View = function(id, name, container_class)
  {
    var self = this;

    this.createView = function(container)
    {
      var selected_sheet = stylesheets.getSelectedSheet();
      if(selected_sheet)
      {
        // TODO check markup
        //var t = new Date().getTime();
        container.innerHTML = 
          "<div class='padding'>" + 
          stylesheets.prettyPrintRules(selected_sheet.rules, settings[this.id].get('shortcuts') ) + 
          "</div>";
        //window.open('data:text/plain;charset=utf-8,'+encodeURIComponent(container.innerHTML))
        //opera.postError((new Date().getTime() - t) +' '+ container.innerHTML.length);  
      }
      else
      {
        container.innerHTML = '';
      }
      
    }
    
    this.show = function(rules)
    {
      if( !this.isvisible() )
      {
        topCell.showView(this.id);
      }
      var cs = this.getAllContainers(), c = null , i= 0;
      for( ; c = cs[i]; i++)
      {
        
      }
      
    }
    this.init(id, name, container_class);
  }
  View.prototype = ViewBase;
  new View('stylesheets', 'Stylesheets', 'scroll stylesheets');
  
  new Settings
  (
    // id
    'stylesheets', 
    // key-value map
    {
      'shortcuts': true
    }, 
    // key-label map
    {
      'shortcuts': ' use shortcuts for properties'
    },
    // settings map
    {
      checkboxes:
      [
        'shortcuts'
      ]
    }
  );

  new ToolbarConfig
  (
    'stylesheets',
    null,
    [
      {
        handler: 'stylesheets-text-search',
        title: 'text search'
      }
    ]
  )

  new Switches
  (
    'stylesheets',
    [
      'shortcuts'
    ]
  )

  // button handlers


  // filter handlers
  var textSearch = new TextSearch();

  var onViewCreated = function(msg)
  {
    if( msg.id == 'stylesheets' )
    {
      textSearch.setContainer(msg.container);
      textSearch.update();
    }
  }

  var onViewDestroyed = function(msg)
  {
    if( msg.id == 'stylesheets' )
    {
      textSearch.cleanup();
    }
  }

  messages.addListener('view-created', onViewCreated);
  messages.addListener('view-destroyed', onViewDestroyed);



  eventHandlers.input['stylesheets-text-search'] = function(event, target)
  {
    textSearch.searchDelayed(target.value);
  }

  eventHandlers.keyup['stylesheets-text-search'] = function(event, target)
  {
    if( event.keyCode == 13 )
    {
      textSearch.highlight();
    }
  }
  
})();