var testing = new function()
{
   var self = this;

   var __selected_runtime = '';

   var event_map =
  {
    'mouseover': '1',
    'click': '1',

  }

  var mouseover = function(event)
  {
    var msg = "<spotlight-object>"+
        "<runtime-id>"+__selected_runtime+"</runtime-id>"+
        "<object-id>"+ event['object-id'] +"</object-id>"+
      "</spotlight-object>";
    proxy.POST("/" + "ecmascript-debugger", msg);
    if( window.__times_spotlight__ ) 
    {
      debug.profileSpotlight();
    }
  }

  this.__setEventHandler = function(xml, __selected_runtime, event)
  {
    if( xml.getNodeData('status') == 'completed' )
    {
      var id = '1'; //event_map[event];
      host_event_handlers.addListener(id, mouseover);
      var msg = "<add-event-handler>"+
          "<handler-id>"+id+"</handler-id>"+
          "<object-id>"+ xml.getNodeData('object-id') +"</object-id>"+
          "<namespace>null</namespace>"+
          "<event-type>"+event+"</event-type>"+
        "</add-event-handler>";
      proxy.POST("/" + "ecmascript-debugger", msg);
     
    }
    else
    {
    opera.postError( 'Error in testing');
    }
  }

  var setEventHandler = function(event)
  {
    if( !__selected_runtime ) return alert('select first a runtime');
    if( !event ) return alert('define an event');
    var tag = tagManager.setCB(null, testing.__setEventHandler, [__selected_runtime, event]);
    var msg = "<eval><tag>"+tag+"</tag><runtime-id>"+__selected_runtime+"</runtime-id>"+
      "<thread-id></thread-id><frame-id></frame-id>"+
      "<script-data>return window.document</script-data>"+
      "</eval>";
   proxy.POST("/" + "ecmascript-debugger", msg);
  }

  this.view = new function()
  {
    var self = this;
    var container_id = 'testing';


      
    this.update = function()
    {
      var container = document.getElementById(container_id);
      if( container )
      {
        container.innerHTML = '';
        container.render(templates.runtimes(runtimes.getRuntimes()));
        container.render
          (
            ['p', 
              ['input', 
                'type', 'button',
                'value', 'set event handler',
                'onclick', function(){setEventHandler(this.nextSibling.value)}
              ], ['input', 'value', 'mouseover']
            ]
          );
      }
    }
    
  }

  var templates = new function()
  {
    var self = this;

    this.runtimes = function(runtimes)
    {
      var ret = ['ul'];
      var cur = '';
      for( cur in runtimes )  
      {
        if( runtimes[cur] ) // this is a temporary fix
        {
          ret[ret.length] = self.runtimeId(runtimes[cur]);
        }
      }
      return ret.concat(['class', 'folder']);
    }

    this.runtimeId = function(runtime)
    {
      return  ['li', runtime['uri'], 
        'runtime-id', runtime['runtime-id'], 
        'onclick', function()
        { 
          __selected_runtime = this.getAttribute('runtime-id');
          var lis = this.parentNode.getElementsByTagName('li'), li=null, i=0;
          for( ; li = lis[i]; i++)
          {
            li.style.cssText = this == li ? 'font-weight:bold;color:#09f' : '';
          }

        }
      ];
    }
  }

}