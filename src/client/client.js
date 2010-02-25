/**
  * @constructor 
  */

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
    'utils': 'utils',
    'storage': 'storage'
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
    'utils': 'utils',
    'storage': 'storage'
  }
}

window.cls || ( window.cls = {} );

window.cls.Client = function()
{
  if(arguments.callee.instance)
  {
    return arguments.callee.instance;
  }
  arguments.callee.instance = this;

  var self = this;
  var _client_id = 0;
  var _first_setup = true;
  var _waiting_screen_timeout = 0;

  var _on_host_connected = function(servicelist)
  {
    if(_waiting_screen_timeout)
    {
      clearTimeout(_waiting_screen_timeout);
      _waiting_screen_timeout = 0;
    }
    servicelist = servicelist.split(',');
    if(servicelist.indexOf('stp-1') != -1)
    {
      messages.post('host-state', {state: global_state.ui_framework.spin_state = 'ready'});
      services.scope.requestHostInfo();
    }
    else
    {
      var 
      has_window_manager = servicelist.indexOf('window-manager') != -1, 
      i = 0, 
      core_version = '',
      fallback_version = !has_window_manager && 'protocol-3' || '';

      if(!fallback_version)
      {
        for( ; (core_version = servicelist[i] ) && !(core_version.slice(0, 5) == 'core-'); i++);
        if(core_version)
        {
          if(core_version == 'core-2-5')
          {
            fallback_version = 'core-2-4';
          }
          else
          {
            fallback_version = core_version;
          }
        }
        else
        {
          if(has_window_manager)
          {
            fallback_version = 'protocol-4';
          }
        }
      }
      handle_fallback.call(new XMLHttpRequest(), fallback_version);
    }
  }

  var _on_host_quit = function()
  {

    window.window_manager_data.clear_debug_context();
    messages.post('host-state', {state: global_state.ui_framework.spin_state = 'inactive'});
    client.setup();
  }

  var get_quit_callback = function(client_id)
  {
    // workaround for bug CORE-25389
    // onQuit() callback is called twice when 
    // creating new client with addScopeClient
    return function()
    {
      if(client_id == _client_id)
      {
        _on_host_quit();
      }
    }
  }

  var _get_port_number = function()
  {
    // TODO
    // port 0 means debugging to current Opera instance, 
    // any other port means remote debugging.
    var is_remote_debug = 
      settings.debug_remote_setting.get('debug-remote') ||
      JSON.parse(window.helpers.getCookie('debug-remote')) || 
      false;
    
    return ( 
      is_remote_debug && 
      (settings.debug_remote_setting.get('port') ||
      JSON.parse(window.helpers.getCookie('port'))) ||
      0);
  }

  this.setup = function()
  {
    _client_id++;
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
    var port = _get_port_number();
    opera.scopeAddClient(
        _on_host_connected, 
        cls.ServiceBase.get_generic_message_handler(), 
        get_quit_callback(_client_id), 
        port
      );
    if(window.ini.debug && !opera.scopeHTTPInterface)
    {
      cls.debug.wrap_transmit();
    }
    if(window.topCell)
    {
      window.topCell.cleanUp();
    }
    if(_first_setup)
    {
      _first_setup = false;
      _waiting_screen_timeout = setTimeout(show_waiting_screen, 250, port);
      
    }
    else
    {
      show_waiting_screen(port);
    }
  }

  var show_waiting_screen = function(port)
  {
    viewport.innerHTML = 
    "<div class='padding'>" +
      "<div class='info-box'>" + ui_strings.S_INFO_WAITING_FORHOST_CONNECTION.replace(/%s/, port) +
          ( port ? "<p><input type='button' value='" + ui_strings.S_BUTTON_CANCEL_REMOTE_DEBUG + "'" +
                " handler='cancel-remote-debug'></p>" : "") +
      "</div>" +
    "</div>";
  }

  var handle_fallback = function(version)
  {
    var 
    href = location.href,
    protocol = location.protocol + '//',
    hostname = location.hostname,
    port = location.port ? ':' + location.port : '',
    path = location.pathname,
    file_name = path.slice(path.lastIndexOf('/') + 1),
    fallback_filename = '/app/fall-back-urls.json',
    type = href.indexOf('cutting-edge') > -1 && 'cutting-edge' || 'default',
    search = location.search,
    pos = 0;

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
          location = protocol + hostname + port + fallback_urls[type][version] + file_name + search;
        }
      }
      else
      {
        alert(ui_strings.S_INFO_NO_COMPATIBLE_VERSION);
      }
    }
    this.open('GET', protocol + hostname + port + fallback_filename);
    this.send(null);
  }

  this.beforeUIFrameworkSetup = function()
  {
    var layouts = ui_framework.layouts;
    new CompositeView('network_panel', ui_strings.M_VIEW_LABEL_NETWORK, layouts.network_rough_layout);
    new CompositeView('console_new', ui_strings.M_VIEW_LABEL_COMPOSITE_ERROR_CONSOLE, layouts.console_rough_layout);
    new CompositeView('js_new', ui_strings.M_VIEW_LABEL_COMPOSITE_SCRIPTS, layouts.js_rough_layout);
    new CompositeView('dom_new', ui_strings.M_VIEW_LABEL_COMPOSITE_DOM, layouts.dom_rough_layout);
    new CompositeView('export_new', ui_strings.M_VIEW_LABEL_COMPOSITE_EXPORTS, layouts.export_rough_layout);
    new CompositeView('js_panel', ui_strings.M_VIEW_LABEL_COMPOSITE_SCRIPTS, layouts.js_rough_layout_panel);
    new CompositeView('dom_panel', ui_strings.M_VIEW_LABEL_COMPOSITE_DOM, layouts.dom_rough_layout_panel);
    new CompositeView('settings_new', ui_strings.S_BUTTON_LABEL_SETTINGS, layouts.settings_rough_layout);
    new CompositeView('utils', 'Utilities', layouts.utils_rough_layout);
    new CompositeView('storage', 'Storage', layouts.storage_rough_layout);
    if( window.opera.attached != settings.general.get('window-attached') )
    {
      window.opera.attached = settings.general.get('window-attached') || false;
    }
  }

  this.afterUIFrameworkSetup =  function()
  {
    this.setupTopCell();
    if(!arguments.callee._called_once)
    {
      if( window.opera.attached )
      {
        topCell.tab.changeStyleProperty("padding-right", 80);
      }
      else
      {
        topCell.toolbar.changeStyleProperty("padding-right", 30);
      }
      document.documentElement.render(templates.window_controls(window.opera.attached))
      if(window.ini.debug)
      {
        window.viewsMenu.create();
        if(window.settings.debug.get('show-as-tab'))
        {
          ui_framework.layouts.main_layout.tabs.push('debug_new');
          ui_framework.layouts.panel_layout.tabs.push('debug_new');
          window.topCell.tab.addTab(new Tab('debug_new', window.views['debug_new'].name));
        }
      }
      // a short workwround to hide some tabs as long as we don't have the dynamic tabs
      var is_disbaled = null, tabs = ui_framework.layouts.console_rough_layout.children[0].tabs, tab = '';
      for( i = 0; tab = tabs[i]; i++ )
      {
        is_disbaled = !settings.console.get(tab);
        views[tab].ishidden_in_menu = is_disbaled;
        topCell.disableTab(tab, is_disbaled);
      }
      arguments.callee._called_once = true;
    }
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

ui_framework.layouts.storage_rough_layout =
{
    dir: 'v',
    width: 1000,
    height: 1000,
    children: [ { height: 1000, tabs: ['local_storage'] } ] 
}

ui_framework.layouts.main_layout =
{
  id: 'main-view', 
  tabs: ['dom_new', 'js_new', 'network_panel', 'storage', 'console_new', 'utils', 'settings_new']
}

ui_framework.layouts.panel_layout =
{
  id: 'main-view', 
  tabs: ['dom_panel', 'js_panel', 'network_panel', 'storage', 'console_new', 'utils', 'settings_new']
}
