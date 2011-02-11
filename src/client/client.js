/**
  * @constructor
  */

window.cls || ( window.cls = {} );

window.cls.Client = function()
{
  if(arguments.callee.instance)
  {
    return arguments.callee.instance;
  }
  arguments.callee.instance = this;

  var self = this;
  var clients = [];
  var _first_setup = true;
  var _waiting_screen_timeout = 0;
  var cbs = [];

  this.current_client = null;

  var _on_host_connected = function(client, servicelist)
  {
    Overlay.get_instance().hide();
    client.connected = true;
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

  var _on_host_quit = function(client, port)
  {
    self.current_client = null;
    if (client.connected)
    {
      window.window_manager_data.clear_debug_context();
      messages.post('host-state', {state: global_state.ui_framework.spin_state = 'inactive'});
      window.client.setup();
    }
    else if (client.is_remote_debug)
    {
      document.getElementById("remote-debug-settings").clearAndRender(
        window.templates.remote_debug_settings(port + 1)
      );

      UI.get_instance().get_button("toggle-remote-debug-overlay")
                       .addClass("alert");

      Overlay.get_instance().set_info_content(
        ["p", ui_strings.S_INFO_ERROR_LISTENING.replace(/%s/, port)]
      );

      // Reset this so we don't start in remote debug next time
      settings.debug_remote_setting.set('debug-remote', false);
      window.helpers.setCookie('debug-remote', "false");
    }
    else
    {
      show_info(ui_strings.S_INFO_ERROR_LISTENING.replace(/%s/, port), port);
    }
  }

  var get_quit_callback = function(client, port)
  {
    // workaround for bug CORE-25389
    // onQuit() callback is called twice when
    // creating new client with addScopeClient
    return function()
    {
      if (client.id == clients.length)
      {
        _on_host_quit(client, port);
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

  this.setup = function(is_remote_debug)
  {
    var client = {
      id: clients.length + 1,
      connected: false,
      is_remote_debug: !!is_remote_debug
    };
    this.current_client = client;
    clients.push(client);

    window.ini || (window.ini = {debug: false});
    window.messages.post('reset-state');
    if (!opera.scopeAddClient)
    {
      // implement the scope DOM API
      cls.ScopeHTTPInterface.call(opera /*, force_stp_0 */);
    }

    if (!opera.stpVersion)
    {
      // reimplement the scope DOM API STP/1 compatible
      // in case of a (builtin) STP/0 proxy
      cls.STP_0_Wrapper.call(opera);
    }

    var port = _get_port_number();
    var cb_index = cbs.push(get_quit_callback(client, port)) - 1;
    opera.scopeAddClient(
        _on_host_connected.bind(this, client),
        cls.ServiceBase.get_generic_message_handler(),
        cbs[cb_index],
        port
      );

    if(window.ini.debug && !opera.scopeHTTPInterface)
    {
      cls.debug.wrap_transmit();
    }

    this._create_ui(is_remote_debug, port);
  };

  // TODO: rename
  this._create_ui = function(is_remote_debug, port)
  {
    // Move this to some function
    if (!is_remote_debug && window.topCell)
    {
      window.topCell.cleanUp();
    }

    if(_first_setup)
    {
      _first_setup = false;
      _waiting_screen_timeout = setTimeout(function() {
        show_info(ui_strings.S_INFO_WAITING_FORHOST_CONNECTION.replace(/%s/, port), port);
      }, 250);
    }
    else if (is_remote_debug)
    {
      UI.get_instance().get_button("toggle-remote-debug-overlay")
                       .removeClass("alert");

      Overlay.get_instance().set_info_content(
        [
          ["p", ui_strings.S_REMOTE_DEBUG_GUIDE_WAITING_HEADER],
          ["ol",
            ["li", ui_strings.S_REMOTE_DEBUG_GUIDE_WAITING_STEP_1],
            ["li", ui_strings.S_REMOTE_DEBUG_GUIDE_WAITING_STEP_2],
            ["li", ui_strings.S_REMOTE_DEBUG_GUIDE_WAITING_STEP_3],
            ["li", ui_strings.S_REMOTE_DEBUG_GUIDE_WAITING_STEP_4],
            ["li", ui_strings.S_REMOTE_DEBUG_GUIDE_WAITING_STEP_5]
          ]
        ]
      );

      document.getElementById("remote-debug-settings").clearAndRender([
        ["p",
          ui_strings.S_INFO_WAITING_FORHOST_CONNECTION.replace(/%s/, port)
        ],
        //["p",
        //  ["img",
        //    "src",
        //    "https://chart.googleapis.com/chart?chs=100x100&cht=qr&chl=opera%3Adebug&chld=L|0&choe=UTF-8",
        //    "width", "100",
        //    "height", "100"
        //  ]
        //],
        ["p",
          ["button",
            ui_strings.S_BUTTON_CANCEL_REMOTE_DEBUG,
            "handler",
            "cancel-remote-debug"
          ]
        ]
      ]);
    }
    else
    {
      show_info(ui_strings.S_INFO_WAITING_FORHOST_CONNECTION.replace(/%s/, port), port);
    }
  };

  var show_info = function(msg, port)
  {
    viewport.innerHTML =
    "<div class='padding' id='waiting-for-connection'>" +
      "<div class='info-box'>" + msg +
          ( port ? "<p><input type='button' value='" + ui_strings.S_BUTTON_CANCEL_REMOTE_DEBUG + "'" +
                " handler='cancel-remote-debug'></p>" : "") +
      "</div>" +
    "</div>";
    var window_controls = document.getElementsByTagName('window-controls')[0];
    if (window_controls)
    {
      window_controls.parentNode.removeChild(window_controls);
    };
    document.documentElement.render(templates.window_controls_close());
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

  this.create_top_level_views = function(services)
  {
    var layouts = ui_framework.layouts;
    var ui = UI.get_instance();
    var modebar_dom = ui.register_modebar('dom', HorizontalNavigation);
    new CompositeView('dom_mode',
                      ui_strings.M_VIEW_LABEL_COMPOSITE_DOM,
                      layouts.dom_rough_layout,
                      'dom',
                      services);
    new CompositeView('js_mode',
                      ui_strings.M_VIEW_LABEL_COMPOSITE_SCRIPTS,
                      layouts.js_rough_layout,
                      'scripts',
                      services);
    new CompositeView('network_mode',
                      ui_strings.M_VIEW_LABEL_NETWORK,
                      layouts.network_rough_layout,
                      null,
                      services);
    new CompositeView('storage',
                      ui_strings.M_VIEW_LABEL_STORAGE,
                      layouts.storage_rough_layout,
                      null,
                      services);
    new CompositeView('console_mode',
                      ui_strings.M_VIEW_LABEL_COMPOSITE_ERROR_CONSOLE,
                      layouts.console_rough_layout,
                      null,
                      services);
    new CompositeView('utils',
                      ui_strings.M_VIEW_LABEL_UTILITIES,
                      layouts.utils_rough_layout,
                      null,
                      services);
    new CompositeView('export_new',
                      ui_strings.M_VIEW_LABEL_COMPOSITE_EXPORTS,
                      layouts.export_rough_layout,
                      null,
                      services);
  }

  this.create_window_controls = function()
  {
    var window_controls = document.querySelector("window-controls");
    if (window_controls)
    {
      window_controls.parentNode.removeChild(window_controls);
    }

    var is_attached = window.opera.attached;

    var controls = [
      new Button("toggle-console", "", ui_strings.S_BUTTON_TOGGLE_CONSOLE),
      new ToolbarSeparator(),
      new Button("toggle-settings-overlay", "", ui_strings.S_BUTTON_TOGGLE_SETTINGS, "toggle-overlay", {"data-overlay-id": "settings-overlay"}),
      new Button("toggle-remote-debug-overlay", "", ui_strings.S_BUTTON_TOGGLE_REMOTE_DEBUG, "toggle-overlay", {"data-overlay-id": "remote-debug-overlay"}),
      new ToolbarSeparator(),
      window['cst-selects']['debugger-menu'],
      new Button("top-window-toggle-attach", is_attached ? "attached" : "", is_attached ? ui_strings.S_SWITCH_DETACH_WINDOW : ui_strings.S_SWITCH_ATTACH_WINDOW),
    ];

    if (is_attached)
    {
      controls.push(new Button("top-window-close", "", ui_strings.S_BUTTON_LABEL_CLOSE_WINDOW));
    }

    document.documentElement.render(templates.window_controls(controls));

    var button = UI.get_instance().get_button("toggle-remote-debug-overlay");
    if (this.current_client && this.current_client.is_remote_debug)
    {
      button.addClass("remote-active");
    }
    else
    {
      button.removeClass("remote-active");
    }
  };

  this.on_services_created = function()
  {
    this.create_top_level_views(window.services);
    this.setup_top_cell(window.services);
    this.create_window_controls();
    if(!arguments.callee._called_once)
    {
      if( window.opera.attached )
      {
        topCell.tab.changeStyleProperty("padding-right", 80);
      }
      if(window.ini.debug)
      {
        window.viewsMenu.create();
        if(window.settings.debug.get('show-as-tab'))
        {
          ui_framework.layouts.main_layout.tabs.push('debug_new');
          window.topCell.tab.addTab(new Tab('debug_new', window.views['debug_new'].name));
        }
      }
      // a short workwround to hide some tabs as long as we don't have the dynamic tabs
      var
      is_disbaled = null,
      tabs = ui_framework.layouts.console_rough_layout.children[0].tabs,
      tab = '',
      i = 0;

      for( i = 0; tab = tabs[i]; i++ )
      {
        is_disbaled = !settings.console.get(tab);
        views[tab].ishidden_in_menu = is_disbaled;
        topCell.disableTab(tab, is_disbaled);
      }
      arguments.callee._called_once = true;
    }
  }

  this.setup_top_cell = function(services)
  {
    var tabs = viewport.getElementsByTagName('tab'), i = 0, tab = null;
    for( ; tab = tabs[i]; i++)
    {
      if( tab.hasClass('active') )
      {
        messages.post("hide-view", {id: tab.getAttribute('ref-id')});
      }
    }
    for (var id in window.views)
    {
      window.views[id].reset_containers();
    }
    viewport.innerHTML = '';
    new TopCell
    (
      ui_framework.layouts.main_layout,
      null,
      null,
      TopToolbar,
      services
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

  window.app.addListener('services-created', this.on_services_created.bind(this));

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
        'console-widget'
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
      width: 700, 
      tabbar: { tabs: ['dom'], is_hidden: true }
    },
    {
      width: 250, tabs: ['dom-side-panel', 'dom_attrs', 'css-layout']
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
        { 
          height: 350, 
          tabbar: { tabs: ['js_source'], is_hidden: true }
        }
      ]
    },
    {
      width: 250,
      children:
      [
        { 
          height: 250,
          tabs: function(services)
          {
            return services['ecmascript-debugger'].major_version > 5 ? 
                   ['scripts-side-panel', 'event-breakpoints'] :
                   ['scripts-side-panel'];
          }
        }
      ]
    }
  ]
}

ui_framework.layouts.network_rough_layout =
{
    dir: 'v',
    width: 1000,
    height: 1000,
    children: [ { height: 1000, tabbar: { id: "request", tabs: ['request_list'] } } ]
}

ui_framework.layouts.utils_rough_layout =
{
    dir: 'v',
    width: 1000,
    height: 1000,
    children: [ { height: 1000, tabbar: { tabs: ['color_picker'], is_hidden: true } } ]
}

ui_framework.layouts.storage_rough_layout =
{
    dir: 'v',
    width: 1000,
    height: 1000,
    children: [ { height: 1000, tabs: ['cookies', 'local_storage', 'session_storage', 'widget_preferences'] } ]
}

ui_framework.layouts.main_layout =
{
  id: 'main-view',
  // tab (and tabbar) can either be a layout list
  // or a function returning a layout list
  // the function gets called with the services returned 
  // and created depending on Scope.HostInfo
  tabs: function(services)
  {
    // return a layout depending on services
    // e.g. services['ecmascript-debugger'].version
    // e.g. services['ecmascript-debugger'].is_implemented
    return [
      'dom_mode',
      {view: 'js_mode', tab_class: JavaScriptTab},
      'network_mode',
      'storage',
      {view: 'console_mode', tab_class: ErrorConsoleTab},
      'utils'
    ];
  }
}
