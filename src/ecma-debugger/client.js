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
      Debug.init();
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

  


    window[defaults.viewport] = document.getElementsByTagName(defaults.viewport_main_container)[0];

    if( viewport )
    {
      setupMarkup();

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

  var setupMarkup = function()
  {


    UIBase.copyCSS(resolve_map);

    // TODO clean up

    container = viewport.appendChild(document.createElement('div'));
    container.style.cssText = 'position:absolute;top:0;left:-1000px;';
    container.innerHTML = resolve_map_2.markup;

    var set = null, i = 0;

    for( ; set = resolve_map_2[i]; i++ )
    {
      defaults[set.target] = set.getValue();
    }
    viewport.removeChild(container);

    new CompositeView('console_new', 'Console', console_rough_layout);
    new CompositeView('js_new', 'JS', js_rough_layout);
    new CompositeView('dom_new', 'DOM', dom_rough_layout);

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

    new SlideViews(document);
  }

  this.onquit = function()
  {
    viewport.render
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

/* TODO take that out from the global scope */

new ToolbarConfig
(
  'main-view',
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
    { height: 200, tabs: ['runtimes'] },
    { height: 200, tabs: ['console'] }
  ]
}

var dom_rough_layout =
{
  dir: 'h', width: 700, height: 700,
  children: 
  [
    { width: 200, tabs: ['dom-markup-style', 'dom-tree-style'] }
  ]
}

var js_rough_layout =
{
  dir: 'h', width: 700, height: 700,
  children: 
  [
    { width: 650, tabs: ['js_source']},
    { 
      width: 300, 
      children: 
      [
        { height: 250, tabs: ['callstack'] },
        { height: 1000, tabs: ['frame_inspection'] }
      ] 
    }
  ]
}


var main_layout =
{
  id: 'main-view', 
  tabs: ['console_new', 'js_new', 'dom_new']
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
    target: Statusbar.prototype,
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


