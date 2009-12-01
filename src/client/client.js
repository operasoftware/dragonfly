/**
  * @constructor 
  */
// test

var composite_view_convert_table = 
{
  // opera.attached.toString()
  "true": 
  {
    'console_new': 'console_new',
    'settings_new': 'settings_new',
    'js_panel': 'js_panel',
    'js_new': 'js_panel',
    'dom_panel': 'dom_panel',
    'dom_new': 'dom_panel',
    'network_panel': 'network_panel',
    'export_new': 'export_new',
    'utils': 'utils'
  },
  "false": 
  {
    'console_new': 'console_new',
    'settings_new': 'settings_new',
    'js_panel': 'js_new',
    'js_new': 'js_new',
    'dom_panel': 'dom_new',
    'dom_new': 'dom_new',
    'network_panel': 'network_panel',
    'export_new': 'export_new',
    'utils': 'utils'
  }
}




window.cls || ( window.cls = {} );

window.cls.Client = function()
{
  /* generated code */
  // singleton
  if(arguments.callee.instance)
  {
    return arguments.callee.instance;
  }
  arguments.callee.instance = this;

  var self = this;

  var _on_host_connected = function(servicelist)
  {
    servicelist = servicelist.split(',');
    // TODO sort out all protocol version
    // TODO check proxy version
    if(servicelist.indexOf('stp-1') != -1)
    {
      services.scope.requestHostInfo();
    }
  }

  var _on_host_quit = function()
  {

  }

  var _get_port_number = function()
  {
    // TODO
    // port 0 means debugging to current Opera instance, 
    // any other port means remote debugging.
    return settings.debug_remote_setting.get('debug-remote') 
      && settings.debug_remote_setting.get('port')
      || 0;
  }

  this.setup = function()
  {
    window.ini || ( window.ini = {debug: false} );
    if( !opera.scopeAddClient )
    {
      // implement the scope DOM API
      cls.ScopeHTTPInterface.call(opera /*, force_stp_0 */);
    }
    if( !opera.stpVersion )
    {
      // reimplement the scope DOM API STP/1 compatible
      // in case of a (builtin) STP/0 proxy
      cls.STP_0_Wrapper.call(opera);
    }
    opera.scopeAddClient(
        _on_host_connected, 
        cls.ServiceBase.get_generic_message_handler(), 
        _on_host_quit, 
        _get_port_number()
      );

    viewport.innerHTML = "<div class='padding'>" +
        "<div class='info-box'>Waiting for a host connection</div>" +
      "</div>";
  }

  /* end generated code */


  /*
  var services = [];
  var services_dict = {};
  var services_avaible = {};

  var _client_id = 0;

  // the quit calback of scopeAddClient doesn't work 
  // if the callback is created in the scope of scopeSetupClient
  var quit_callback = null; 
  
  this.addService = function(service)
  {
    services[services.length] = service;
    services_dict[service.name] = service;
  }
  */

  /**** methods for integrated proxy ****/

  /*
  var host_connected = function(_services)
  {
    services_avaible = eval("({\"" + _services.replace(/,/g, "\":1,\"") + "\":1})");
    // workaround for a missing hello message
    if( 'window-manager' in services_avaible )
    {
      var service = null, i = 0;
      for( ; service = services[i]; i++)
      {
        if (service.name in services_avaible)	
        {
          opera.scopeEnableService(service.name);
          service.is_implemented = true;
          service.onconnect();
        }
        else
        {
          alert ( ui_strings.S_INFO_SERVICE_NOT_AVAILABLE.replace(/%s/, service.name) );
        }
      }
    }
    else
    {
      handle_fallback.apply(new XMLHttpRequest(), ["protocol-3"]);
    }



  }

  var receive = function(service, msg)
  {
    var xml_doc = ( new DOMParser() ).parseFromString(msg, "application/xml");
    if(xml_doc)
    {
      services_dict[service].onreceive(xml_doc);
    }
  }  

  this.onquit_timeout = 0;

  this.reset_onquit_timeout = function()
  {
    self.onquit_timeout = 0;
    self.scopeSetupClient();
  }

  var get_quit_callback = function(client_id)
  {
    // workaround for bug CORE-25389
    // onQuit() callback is called twice when 
    // creating new client with addScopeClient
    return function(msg)
    {
      if(client_id == _client_id)
      {
        quit(msg);
      }
    }
  }

  var quit = function(msg)
  {
    if( !self.onquit_timeout )
    {
      // workaround. right now for each service a quit event is dispatched
      messages.post('reset-state'); 
      messages.post('host-state', {state: 'inactive'});
      for( var view_id in views )
      {
        if( !views[view_id].do_not_reset )
        {
          views[view_id].clearAllContainers();
        }
      }
      self.onquit_timeout = setTimeout(self.reset_onquit_timeout, 500);
    }
  }

  

  var post_scope = function(service, msg)
  {
    if( ini.debug )
    {
      debug.logCommand(msg);
    }
    opera.scopeTransmit(service, "<?xml version=\"1.0\"?>" + msg)
  }

  */

  /* methods for standalone proxy Dragonkeeper */

  /*
  var receive_dragonkeeper = function(xml, xhr)
  {
    // opera.postError('scope message: ' + (''+new Date().getTime()).slice(6) + ' '+ xml.documentElement.nodeName + ' '+ xhr.responseText)
    if(xml.documentElement.nodeName != 'timeout')
    {
      services_dict[xhr.getResponseHeader("X-Scope-Message-Service")].onreceive(xml);
    }
    proxy.GET( "/scope-message?time" + new Date().getTime(), receive_dragonkeeper);
  } 

  */

  /**** methods for standalone proxy Java ****/

  /*
  var command_name = "/";
  var post_proxy = function(service, msg)
  {
    if( ini.debug )
    {
      debug.logCommand(msg);
      
    }
    proxy.POST(command_name + service, msg);
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

  var proxy_onsetup = function(xhr)
  {
    var service = null, i = 0, is_event_loop = false, server_name = xhr.getResponseHeader("Server");
    // workaround for a missing hello message
    // TODO check the fake core service version
    for( ; ( service = this.services[i] ) && !( service == 'window-manager' ); i++);
    if( service == 'window-manager' )
    {
      for( i = 0; service = services[i]; i++)
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
          service.is_implemented = true;
          if(server_name && server_name.indexOf("Dragonkeeper") != -1 )
          {
            if(!is_event_loop)
            {
              window.client.scope_proxy = "dragonkeeper";
              command_name = "/send-command/";
              is_event_loop = true;
              setTimeout(function(){
                proxy.GET( "/scope-message?time=" + new Date().getTime(), receive_dragonkeeper);
              }, 10, service);
            }
            setTimeout(function(service){
              service.onconnect();
            }, 10, service);
          }
          else
          {
            setTimeout(function(service){
              service.onconnect();
              proxy.GET( "/" + service.name, bindCB(service) );
            }, 10, service);
          }
        }
      }
    }
    else
    {
      handle_fallback.apply(new XMLHttpRequest(), ["protocol-3"]);
    }
  }

  */

  var handle_fallback = function(version)
  {
    // for local testing
    var 
    href = location.href,
    root_path = href.slice(0, href.indexOf('/app') > -1 ? href.indexOf('/app') : href.indexOf('/src') ),
    file_name = href.slice(href.lastIndexOf('/') + 1),
    type = href.indexOf('cutting-edge') > -1 && 'cutting-edge' || 'default',
    search = location.search;

    file_name = file_name.indexOf('.') > -1 && file_name || '';
    this.onload = function()
    {
      if (this.status != 200)
      {
        opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
                        "could not load fallback urls. (during local development this is OK!)")
        return;
      }
      var fallback_urls = eval( "(" + this.responseText + ")" );
      if( fallback_urls && fallback_urls[type] && version in fallback_urls[type] )
      {
        if( confirm(ui_strings.S_CONFIRM_LOAD_COMPATIBLE_VERSION) )
        {
          location = root_path + fallback_urls[type][version] + file_name + search;
        }
      }
      else
      {
        alert(ui_strings.S_INFO_NO_COMPATIBLE_VERSION);
      }
    }
    this.open('GET', root_path + '/app/fall-back-urls.json');
    this.send();
  }

  
  this.scopeSetupClient = function()
  {      
    _client_id++;
    quit_callback = get_quit_callback(_client_id);
    var port = settings.debug_remote_setting.get('debug-remote') 
      && settings.debug_remote_setting.get('port')
      || 0;
    
    if(port)
    {
      alert(ui_strings.S_INFO_WAITING_FOR_CONNECTION.replace(/%s/, port));
    }
    opera.scopeAddClient(host_connected, receive, quit_callback, port);
  }

  this.post = function(){};

  this.beforeUIFrameworkSetup = function()
  {
    var args = location.search, params = {}, arg = '', i = 0, ele = null;
    var no_params = true;
    var host = location.host.split(':');
    var layouts = ui_framework.layouts;

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
    settings.general.set('show-views-menu', ini.debug)
    /*
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
        alert(ui_strings.S_INFO_WRONG_START);
      }
    }
    */
    new CompositeView('network_panel', ui_strings.M_VIEW_LABEL_NETWORK, layouts.network_rough_layout);
    new CompositeView('console_new', ui_strings.M_VIEW_LABEL_COMPOSITE_ERROR_CONSOLE, layouts.console_rough_layout);
    new CompositeView('js_new', ui_strings.M_VIEW_LABEL_COMPOSITE_SCRIPTS, layouts.js_rough_layout);
    new CompositeView('dom_new', ui_strings.M_VIEW_LABEL_COMPOSITE_DOM, layouts.dom_rough_layout);
    new CompositeView('export_new', ui_strings.M_VIEW_LABEL_COMPOSITE_EXPORTS, layouts.export_rough_layout);
    new CompositeView('js_panel', ui_strings.M_VIEW_LABEL_COMPOSITE_SCRIPTS, layouts.js_rough_layout_panel);
    new CompositeView('dom_panel', ui_strings.M_VIEW_LABEL_COMPOSITE_DOM, layouts.dom_rough_layout_panel);
    new CompositeView('settings_new', ui_strings.S_BUTTON_LABEL_SETTINGS, layouts.settings_rough_layout);
    new CompositeView('utils', 'Utils', layouts.utils_rough_layout);
    if( window.opera.attached != settings.general.get('window-attached') )
    {
      window.opera.attached = settings.general.get('window-attached') || false;
    }
  }

  this.afterUIFrameworkSetup =  function()
  {
    this.setupTopCell();
    if( window.opera.attached )
    {
      topCell.tab.changeStyleProperty("padding-right", 80);
    }
    else
    {
      topCell.toolbar.changeStyleProperty("padding-right", 30);
    }
    document.documentElement.render(templates.window_controls(window.opera.attached))
    messages.post('setting-changed', {id: 'general', key: 'show-views-menu'});
    // a short workwround to hide some tabs as long as we don't have the dynamic tabs
    var is_disbaled = null, tabs = ui_framework.layouts.console_rough_layout.children[0].tabs, tab = '';
    for( i = 0; tab = tabs[i]; i++ )
    {
      is_disbaled = !settings.console.get(tab);
      views[tab].ishidden_in_menu = is_disbaled;
      topCell.disableTab(tab, is_disbaled);
    }

    //this.setup();
  }

  this.setupTopCell = function()
  {
    for( var tabs = viewport.getElementsByTagName('tab'), i = 0; tab = tabs[i]; i++)
    {
      if( tab.hasClass('active') )
      {
        messages.post("hide-view", {id: tab.getAttribute('ref-id')});
      }
    }
    viewport.innerHTML = '';
    new TopCell
    (
      window.opera.attached ? ui_framework.layouts.panel_layout : ui_framework.layouts.main_layout,
      null, 
      null, 
      TopToolbar, 
      TopStatusbar
    );
    windowsDropDown.update();
    var view_id = global_state && global_state.ui_framework.last_selected_tab;
    if(  view_id && views[view_id] && !views[view_id].isvisible())
    {
      window.topCell.showView(view_id);
    } 
    if(global_state.ui_framework.spin_state)
    {
      messages.post("host-state", {state: global_state.ui_framework.spin_state});
    }
  }

  this.onquit = function()
  {
    messages.post('host-state', {state: 'inactive'});
  }

  window.app.addListener('services-created', function()
  {
    self.afterUIFrameworkSetup();
  });
}

ui_framework.layouts.console_rough_layout =
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

ui_framework.layouts.environment_rough_layout =
{
  dir: 'v', width: 700, height: 700,
  children: 
  [
    { height: 200, tabs: ['environment'] }
  ]
}

ui_framework.layouts.export_rough_layout =
{
  dir: 'v', width: 700, height: 700,
  children: 
  [
    { height: 200, tabs: ['export_data'] }
  ]
}

ui_framework.layouts.settings_rough_layout =
{
  dir: 'v', width: 700, height: 700,
  children: 
  [
    { height: 200, tabs: ['settings_view'] }
  ]
}

  

ui_framework.layouts.dom_rough_layout =
{
  dir: 'h', width: 700, height: 700,
  children: 
  [
    { 
      width: 700, tabs: ['dom', 'stylesheets']
    },
    { 
      width: 250, tabs: ['css-inspector', 'dom_attrs', 'css-layout'] 
    }
  ]
}

ui_framework.layouts.dom_rough_layout_panel =
{
  dir: 'h', width: 700, height: 700,
  children: 
  [
    { 
      width: 700, tabs: ['dom', 'stylesheets']
    },
    { 
      width: 250, tabs: ['css-inspector', 'dom_attrs', 'css-layout'] 
    }
  ]
}

ui_framework.layouts.js_rough_layout =
{
  dir: 'h', width: 700, height: 700,
  children: 
  [
    { 
      width: 700, 
      children: 
      [
        { height: 350, tabs: ['js_source']},
        { height: 250, tabs:['command_line']}
      ] 
    },
    { 
      width: 250, 
      children: 
      [
        { height: 250, tabs: ['callstack', 'threads'] },
        { height: 1000, tabs: ['inspection'] }
      ] 
    }
  ]
}

ui_framework.layouts.js_rough_layout_panel =
{
  dir: 'h', width: 700, height: 700,
  children: 
  [
    { 
      width: 700, 
      children: 
      [
        { height: 150, tabs: [/*'runtimes', */'js_source', 'command_line'] }
      ] 
    },
    { 
      width: 250, 
      children: 
      [
        { height: 250, tabs: ['callstack', 'inspection', 'threads'] }
      ] 
    }
  ]
}

ui_framework.layouts.network_rough_layout =
{
    dir: 'v',
    width: 1000,
    height: 1000,
    children: [ { height: 1000, tabs: ['request_list'] } ] 
}

ui_framework.layouts.utils_rough_layout =
{
    dir: 'v',
    width: 1000,
    height: 1000,
    children: [ { height: 1000, tabs: ['color_picker'] } ] 
}

ui_framework.layouts.main_layout =
{
  id: 'main-view', 
  tabs: ['dom_new', 'js_new', 'network_panel', 'console_new', 'settings_new', 'utils']
}

ui_framework.layouts.panel_layout =
{
  id: 'main-view', 
  tabs: ['dom_panel', 'js_panel', 'network_panel', 'console_new', 'settings_new', 'utils']
}








