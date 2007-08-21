
var debugger = new function()
{
  var self = this;
  var service = "ecmascript-debugger";

  this.getEvent = function()
  {
    proxy.GET( "/" + service, genericEventListener );
  }

  var genericEventListener = function(xml) 
  {
    if(xml)
    {
      if( ini.debug )
      {
        debug.formatXML(new XMLSerializer().serializeToString(xml));
      }
      if( tagManager.handleResponse(xml) )
      {
        //alert('handled by tag manager');
      }
      else if( self[xml.documentElement.nodeName] )
      {
        //alert('handled by else if');
        self[xml.documentElement.nodeName](xml)
      }
      else
      {
        if( ini.debug )
        {
          debug.output('not implemented: '+new XMLSerializer().serializeToString(xml));
        }
      }

    }
    self.getEvent();
  }


  
  var environment = {}

  /**** generic event listener ****/


  this['hello'] = function(xml)
  {
    var children = xml.documentElement.childNodes, child=null, i=0;
    for ( ; child = children[i]; i++)
    {
      environment[child.nodeName] = child.textContent;
    }
    document.getElementById('hello').render(templates.hello(environment));
    if( ini.protocol_version == environment['protocol-version'] )
    {
      stop_at.setInitialSettings();

      views.configuration.render();
      views.continues.render();
      
      helpers.setUpListeners(); // clean this up!

    }
    else
    {
      document.getElementById('source-view').render
      (
        ['h2', 'The debugger works with protocol version ' + ini.protocol_version, 'class', 'failed' ]
      );


    }

  }

  this['new-script'] = function(xml)
  {
    runtimes.handle(xml);
  }

  this['thread-stopped-at'] = function(xml)
  {
    stop_at.handle(xml);
  }


  this['timeout'] = function() 
  {

  }

  this['runtimes-reply'] = function(xml)
  {
    alert(88);
    var tag = xml.getNodeData('tag'), handler=null;
    if(tag && ( handler = tags[parseInt(tag)] ))
    {
      handler(xml);
    }
    else
    {
      throw "runtimes-reply, missing tag";
    }
    //self.getEvent();
  }




  this.setup = function()
  {
    var args = location.search, params = {}, arg = '', i = 0, ele = null;;
    if( args )
    {
      args = args.slice(1).split(';');
      for( ; arg = args[i]; i++)
      {
        arg = arg.split('=');
        params[arg[0]] = arg[1] ? arg[1] : true;
      }
    }
    if( params.debug || params['event-flow'] )
    {
      if(params.debug) ini.debug = true;
      if(params['event-flow']) window.__debug_event_flow__ = true;
    }
    else
    {
      var rem = ['command-line', 'debug-container'];
      for( i = 0; arg = rem[i]; i++)
      {
        ele = document.getElementById(arg);
        ele.parentNode.removeChild(ele);
      }
      document.body.insertBefore(document.render(['h1', 'prototype ecma script debugger']), document.body.children[0]);
    }

    verticalFrames.init
    (
      document.body.getElementsByTagName('div')[0], 
      function(){ return window.innerHeight - document.body.getElementsByTagName('div')[0].offsetTop }
    )

    action_handler.init();

    scroll_handler.init();

    window.views.js_source.setupBasics();
    window.views.js_source.setup(1);

    var host = location.host.split(':');

    proxy.onsetup = function()
    {
      if (!proxy.enable(service))	
      {
        alert( "No service: " + service );
        return;
      }
      else
      {
        self.getEvent();
      }

    }
    proxy.configure(host[0], host[1]);
  }


  /**** commands ****/



  this.postCommandline = function(msg)
  {
    var msg = document.getElementById('command-line').getElementsByTagName('textarea')[0].value;
    proxy.POST("/" + service, msg);
  }



}


onload = debugger.setup