var client = new function()
{
  var self = this;

  var services = [];
  var services_dict = {};
  var services_avaible = {};
  
  this.addService = function(service)
  {
    services[services.length] = service;
    services_dict[service.name] = service;
  }

  /**** methods for integrated proxy ****/

  var host_connected = function(_services)
  {
    //opera.postError('on host_connected: '+_services);
    services_avaible = eval("({\"" + _services.replace(/,/g, "\":1,\"") + "\":1})");
    var service = null, i = 0;
    for( ; service = services[i]; i++)
    {
      if (service.name in services_avaible)	
      {
        opera.postError(service.name);
        opera.scopeEnableService(service.name);
      }
      else
      {
        alert
        ( 
           'Service is avaible: ' + service.name
        );
      }
    }
  }

  var receive = function(service, msg)
  {
    //opera.postError(service+' '+msg);
    var xml_doc = ( new DOMParser() ).parseFromString(msg, "application/xml");
    if(xml_doc)
    {
      services_dict[service].onreceive(xml_doc);
    }
  }  

  var quit = function()
  {
    alert('Session quited');
  }

  var post_scope = function(service, msg)
  {
    if( ini.debug )
    {
      debug.logCommand(msg);
    }
    opera.scopeTransmit(service, "<?xml version=\"1.0\"?>" + msg)
  }

  /**** methods for standalone proxy ****/

  var post_proxy = function(service, msg)
  {
    if( ini.debug )
    {
      debug.logCommand(msg);
      
    }
    proxy.POST("/" + service, msg);
  }



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

  var proxy_onsetup = function()
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

  this.scopeSetupClient = function()
  {      
    var port = settings.debug_remote_setting.get('debug-remote') 
      && settings.debug_remote_setting.get('port')
      || 0; 
    opera.scopeAddClient(host_connected, receive, quit, port);
  }


  this.setup = function()
  {
    document.removeEventListener('load', arguments.callee, false);

    var args = location.search, params = {}, arg = '', i = 0, ele = null;

    var no_params = true;

    if( args )
    {
      args = args.slice(1).split(';');
      for( ; arg = args[i]; i++)
      {
        arg = arg.split('=');
        params[arg[0]] = arg[1] ? arg[1] : true;
        no_params = false;
      }
    }

    if( params.debug || params['event-flow'] )
    {
      Debug.init();
      if(params.debug) ini.debug = true;
      if(params['event-flow']) window.__debug_event_flow__ = true;
    }
     // e.g. log-events=thread-started,thread-stopped-at,thread-finished,new-script
    if( params['log-events'] )
    {
      
      if(!ini.debug) 
      {
        ini.debug = true;
        Debug.init();
      }
      debug.setEventFilter(params['log-events']);
    }
    // e.g. log-commands=continue
    if( params['log-commands'] )
    {
      if(!ini.debug) 
      {
        ini.debug = true;
        Debug.init();
      }
      debug.setCommandFilter(params['log-commands']);
    }

    if( params['profiling'] )
    {
      Debug.init();
      window.__profiling__ = true;
      window.__times__ = [];
    }

    if( params['test'] )
    {
      Debug.init();
      window.__testing__ = true;
      window.__times_spotlight__ = [];
    }



    if( params['profile-dom'] )
    {
      Debug.init();
      window.__times_dom = [];
    }

    if( !ini.debug || !params['error-console'] )
    {
      // opera.postError = function(){};
    }



  


    window[defaults.viewport] = document.getElementsByTagName(defaults.viewport_main_container)[0];

    if( viewport )
    {
      setupMarkup();

      var host = location.host.split(':');

      if( opera.scopeAddClient )
      {
        self.post = post_scope;
        self.scopeSetupClient();
      }
      else
      {
        if( host[1] )
        {
          self.post = post_proxy;
          proxy.onsetup = proxy_onsetup;
          proxy.configure(host[0], host[1]);
        }
        else
        {
          alert(ui_strings.ALERT_WRONG_START);
          return;

        }
      }
    }
    else
    {
      opera.postError('missing viewport');
    }

    messages.post('application-setup', {});
    
  }

  var setupMarkup = function()
  {


    UIBase.copyCSS(resolve_map);

    // TODO clean up

    var container = viewport.appendChild(document.createElement('div'));
    container.style.cssText = 'position:absolute;top:0;left:-1000px;';
    container.innerHTML = resolve_map_2.markup;

    var set = null, i = 0;

    for( ; set = resolve_map_2[i]; i++ )
    {
      defaults[set.target] = set.getValue();
    }
    viewport.removeChild(container);

    new CompositeView('console_new', ui_strings.VIEW_LABEL_COMPOSITE_ERROR_CONSOLE, console_rough_layout);
    new CompositeView('js_new', ui_strings.VIEW_LABEL_COMPOSITE_SCRIPTS, js_rough_layout);
    new CompositeView('dom_new', ui_strings.VIEW_LABEL_COMPOSITE_DOM, dom_rough_layout);

    new CompositeView('export_new', ui_strings.VIEW_LABEL_COMPOSITE_EXPORTS, export_rough_layout);

    window.topCell = new TopCell
    (
      main_layout, 
      function()
      {
        this.top = 0; 
        this.left = 0; 
        this.width = innerWidth; 
        this.height = innerHeight;
      },
      function()
      {
        this.setStartDimesions();
        this.update();
        this.setup();
      }  
    );
    
    // event handlers to resize the views
    new SlideViews(document);
    
    messages.post('setting-changed', {id: 'general', key: 'show-views-menu'});

    // a short workwround to hide some tabs as long as we don't have the dynamic tabs
    var is_disbaled = null, tabs = console_rough_layout.children[0].tabs, tab = '';
    for( i = 0; tab = tabs[i]; i++ )
    {
      is_disbaled = !settings.console.get(tab);
      views[tab].ishidden_in_menu = is_disbaled;
      topCell.disableTab(tab, is_disbaled);
    }

  }

  this.onquit = function()
  {
    messages.post('host-state', {state: 'inactive'});
  }

  document.addEventListener('load', this.setup, false);

}

/* TODO take that out from the global scope */
/* this is a quick hack to get the create all runtimes button in the toptab bar */
new ToolbarConfig
(
  'main-view-top-tab',
  [
    {
      handler: 'create-all-runtimes',
      title: 'Create all runtimes'
    }
  ]
)

var console_rough_layout =
{
  dir: 'v', width: 700, height: 700,
  children: 
  [
    { height: 200, tabs: 
      [
        'console-all', 
        'console-script', 
        'console-css', 
        'console-xml',
        'console-java',
        'console-m2',
        'console-network',
        'console-html',
        'console-xslt',
        'console-svg',
        'console-bittorrent',
        'console-voice',
        'console-widget',
        'console-dragonfly'
      ] 
    }
  ]
}

var export_rough_layout =
{
  dir: 'v', width: 700, height: 700,
  children: 
  [
    { height: 200, tabs: ['export_data'] }
  ]
}

var dom_rough_layout =
{
  dir: 'h', width: 700, height: 700,
  children: 
  [
    { 
      width: 700,
      children: 
      [
        { height: 150, tabs: ['runtimes_dom', 'runtimes_css', 'environment'] },
        { width: 200, tabs: ['dom', 'stylesheets'] }
      ]
    },
    { 
      width: 250, tabs: ['css-inspector', 'dom_attrs', 'css-layout'] 
    }
  ]
}

var js_rough_layout =
{
  dir: 'h', width: 700, height: 700,
  children: 
  [
    { 
      width: 700, 
      children: 
      [
        { height: 150, tabs: ['runtimes', 'environment'] },
        { height: 650, tabs: ['js_source']},
        { height: 150, tabs:['command_line']}
      ] 
    },
    { 
      width: 250, 
      children: 
      [
        { height: 250, tabs: ['callstack', 'threads'] },
        { height: 1000, tabs: ['frame_inspection'] }
      ] 
    }
  ]
}


var main_layout =
{
  id: 'main-view', 
  tabs: ['js_new', 'dom_new', 'console_new'/*, 'export_new'*/]
}

var resolve_map_properties = 
[
  {s_name: 'border-top-width'}, 
  {s_name: 'border-right-width'}, 
  {s_name: 'border-bottom-width'}, 
  {s_name: 'border-left-width'}, 
  {s_name: 'padding-top'}, 
  {s_name: 'padding-right'}, 
  {s_name: 'padding-bottom'}, 
  {s_name: 'padding-left'},
  {s_name: 'width'},
  {s_name: 'height'}
]

var resolve_map = 
[
  {
    source: 'toolbar',
    target: Toolbar.prototype,
    properties: resolve_map_properties
  },
  {
    source: 'tabs',
    target: Tabs.prototype,
    properties: resolve_map_properties
  },
  {
    source: 'container',
    target: Container.prototype,
    properties: resolve_map_properties
  },
  {
    source: 'top-tabs',
    target: TopTabs.prototype,
    properties: resolve_map_properties
  },
  {
    source: 'top-container',
    target: TopContainer.prototype,
    properties: resolve_map_properties
  },
  {
    source: 'top-statusbar',
    target: TopStatusbar.prototype,
    properties: resolve_map_properties
  },
  {
    source: 'top-toolbar',
    target: TopToolbar.prototype,
    properties: resolve_map_properties
  },
  {
    source: 'window-toolbar',
    target: WindowToolbar.prototype,
    properties: resolve_map_properties
  },
  {
    source: 'window-header',
    target: defaults,
    properties: 
    [
      {
        t_name: 'window_header_offsetHeight', 
        setProp: function(source, decalaration)
        {
          return source.offsetHeight;
        }
      }
    ]
  },
  {
    source: 'window-container',
    target: WindowContainer.prototype,
    properties: resolve_map_properties
  },
  {
    source: 'window-satusbar',
    target: WindowStatusbar.prototype,
    properties: resolve_map_properties
  },
  {
    source: 'window-statusbar',
    target: defaults,
    properties: 
    [
      {
        t_name: 'window_statusbar_offsetHeight', 
        setProp: function(source, decalaration)
        {
          return source.offsetHeight;
        }
      }
    ]
  },
];

var resolve_map_2 =
[
  {
    id: 'test-line-height',
    property: 'lineHeight',
    target: 'js-source-line-height',
    getValue: function(){return parseInt(document.getElementById(this.id).currentStyle[this.property])}
  },
  {
    id: 'test-scrollbar-width',
    target: 'scrollbar-width',
    getValue: function(){return ( 100 - document.getElementById(this.id).offsetWidth )}
  }
];

resolve_map_2.markup = 
  "<div class='js-source'>"+
    "<div id='js-source-scroll-content'>"+
      "<div id='js-source-content'>"+
        "<div id='test-line-height'>test<div>"+
        "<div style='position:absolute;width:100px;height:100px;overflow:auto'>"+
          "<div id='test-scrollbar-width' style='height:300px'></div>"+
        "</div>"        
      "</div>"+
    "</div>"+
  "</div>";


