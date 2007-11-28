var client = new function()
{
  var self = this;

  var services = [];
  
  var bindCB = function(service)
  {
    var service_name = service.name;
    var boundGetEvent = function(xml)
    {
      if(xml.documentElement.nodeName != 'timeout')
      {
        service.onreceive(xml);
      }
      proxy.GET( "/" + service_name, boundGetEvent );
    }
    return boundGetEvent;
  }

  this.addService = function(service)
  {
    services[services.length] = service;
  }


  this.setup = function()
  {

    document.addEventListener('load', arguments.callee, false);

    var args = location.search, params = {}, arg = '', i = 0, ele = null;

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

    if( params['profiling'] )
    {
      window.__profiling__ = true;
      window.__times__ = [];
    }

    if( params['test'] )
    {
      window.__testing__ = true;
      window.__times_spotlight__ = [];
    }

    if( params['profile-dom'] )
    {
      window.__times_dom = [];
    }

  
    // TODO clean up

    var viewport = document.getElementsByTagName('viewbox')[0];

    if( viewport )
    {
      viewport.insertBefore(document.render(templates.toolbars()), viewport.children[0]);

      verticalFrames.init
      (
        document.getElementById('main-container'), 
        function(){ return window.innerHeight - document.getElementById('main-container').offsetTop }
      )

      action_handler.init();

      scroll_handler.init();

      var host = location.host.split(':');

      proxy.onsetup = function()
      {

        var service = null, i = 0;
        for( ; service = services[i]; i++)
        {
          if (!proxy.enable(service.name))	
          {
            alert
            ( 
               'Could not find an Opera session to connect to.\n' +
               'Please try the following:\n' + 
               '1. Open another Opera instance\n' +
               '2. In that Opera instance, open opera:config and check "Enable Debugging" and "Enable Script Debugging" under "Developer Tools"\n' +
               '3. Restart that Opera instance' 
            );
          }
          else
          {
            service.onconnect();
            proxy.GET( "/" + service.name, bindCB(service) );
          }
        }

      }
      proxy.configure(host[0], host[1]);
    }
    else
    {
      opera.postError('missing viewport');
    }
    
  }

  this.onquit = function()
  {
    document.body.render
    (
      ['div', 
        ['h2', 'There is no longer a connection to the proxy'],
      'class', 'info']
      
    );
  }

  this.post = function(service, msg)
  {
    proxy.POST("/" + service, msg);
  }

  document.addEventListener('load', this.setup, false);

}


