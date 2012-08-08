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
  };

  var _on_host_quit = function(client)
  {
    var port = client.port;
    self.current_client = null;
    if (client.connected)
    {
      window.window_manager_data.clear_debug_context();
      messages.post('host-state', {state: global_state.ui_framework.spin_state = 'inactive'});
      window.client.setup();
    }
    else if (self.connection_is_remote(client))
    {
      var remote_debug_setting = document.getElementById("remote-debug-settings");
      if (remote_debug_setting)
      {
        var tmpl = window.templates.remote_debug_settings(port + 1);
        remote_debug_setting.clearAndRender(tmpl);
      }
      var button = UI.get_instance().get_button("toggle-remote-debug-overlay");
      if (button)
        button.addClass("alert");

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
  };

  var get_quit_callback = function(client)
  {
    // workaround for bug CORE-25389
    // onQuit() callback is called twice when
    // creating new client with addScopeClient
    return function()
    {
      if (self.current_client && self.current_client.id == client.id)
      {
        _on_host_quit(client);
      }
    }
  };

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
  };

  this.connection_is_remote = function(client)
  {
    return client.port != 0;
  };

  this.setup = function()
  {
    window.services.scope.reset();
    var port = _get_port_number();
    var client = {
      id: clients.length + 1,
      connected: false,
      port: port
    };
    this.current_client = client;
    clients.push(client);

    window.ini || (window.ini = {debug: false});
    window.messages.post('reset-state');
    if (!opera.scopeAddClient)
    {
      // implement the scope DOM API
      cls.ScopeHTTPInterface.call(opera /*, force_stp_0 */);
      cls.ScopeHTTPInterface.is_enabled = true;
    }

    if (!opera.stpVersion)
    {
      // reimplement the scope DOM API STP/1 compatible
      // in case of a (builtin) STP/0 proxy
      cls.STP_0_Wrapper.call(opera);
    }

    var cb_index = cbs.push(get_quit_callback(client)) - 1;
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

    this._create_ui(client);
  };

  // TODO: rename
  this._create_ui = function(client)
  {
    var is_remote_connection = this.connection_is_remote(client);
    var port = client.port;

    if (!is_remote_connection && window.topCell)
    {
      this.create_top_level_views(window.services);
      if(window.topCell)
      {
        window.topCell.cleanUp();
      }
    }

    if(_first_setup)
    {
      _first_setup = false;
      _waiting_screen_timeout = setTimeout(function() {
        show_info(ui_strings.S_INFO_WAITING_FORHOST_CONNECTION.replace(/%s/, port), port);
      }, 250);
    }
    else if (is_remote_connection)
    {
      var button = UI.get_instance().get_button("toggle-remote-debug-overlay");
      if (button)
        button.removeClass("alert");

      Overlay.get_instance().set_info_content(
        window.templates.remote_debug_waiting_help(port)
      );

      var remote_debug_setting = document.getElementById("remote-debug-settings");
      if (remote_debug_setting)
      {
        var tmpl = window.templates.remote_debug_waiting(port);
        remote_debug_setting.clearAndRender(tmpl);
      }
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
            (port ? "<p><span class='ui-button' handler='cancel-remote-debug' tabindex='1'>" +
                      ui_strings.S_BUTTON_CANCEL_REMOTE_DEBUG +
                    "</span></p>"
                  : "") +
        "</div>" +
      "</div>";
    var window_controls = document.querySelector('window-controls');
    if (window_controls)
    {
      window_controls.parentNode.removeChild(window_controls);
    }
    document.documentElement.render(templates.window_controls_close());
  };

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
    search = location.search;

    file_name = file_name.indexOf('.') > -1 && file_name || '';
    this.onload = function()
    {
      if (this.status != 200)
      {
        opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
            "could not load fallback urls. (during local development this is OK!)");
        return;
      }
      var fallback_urls = JSON.parse(this.responseText);
      if (fallback_urls && fallback_urls[type] && version in fallback_urls[type])
      {
        if (confirm(ui_strings.S_CONFIRM_LOAD_COMPATIBLE_VERSION))
        {
          location = protocol +
                     hostname + port +
                     fallback_urls[type][version] +
                     file_name + search;
        }
      }
      else
      {
        alert(ui_strings.S_INFO_NO_COMPATIBLE_VERSION);
      }
    };
    this.open('GET', protocol + hostname + port + fallback_filename);
    this.send(null);
  };

  this.handle_fallback = function(version)
  {
    handle_fallback.call(new XMLHttpRequest(), version);
  };

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
                      layouts.error_console_rough_layout,
                      null,
                      services);
    new CompositeView('utils',
                      ui_strings.M_VIEW_LABEL_UTILITIES,
                      layouts.utils_rough_layout,
                      null,
                      services);
    new CompositeView('resource_panel',
                      ui_strings.M_VIEW_LABEL_RESOURCES,
                      layouts.resource_rough_layout);
    new CompositeView('console_panel',
                      ui_strings.M_VIEW_LABEL_COMMAND_LINE,
                      layouts.console_rough_layout);
    new CompositeView('profiler_mode',
                      ui_strings.M_VIEW_LABEL_PROFILER,
                      layouts.profiler_rough_layout,
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
      new Button("top-window-toggle-attach", is_attached ? "attached" : "", is_attached ? ui_strings.S_SWITCH_DETACH_WINDOW : ui_strings.S_SWITCH_ATTACH_WINDOW)
    ];

    if (is_attached)
    {
      controls.push(new Button("top-window-close", "", ui_strings.S_BUTTON_LABEL_CLOSE_WINDOW));
    }

    var win_ctrls = document.documentElement.render(templates.window_controls(controls));
    window.messages.post("window-controls-created", {window_controls: win_ctrls});

    var button = UI.get_instance().get_button("toggle-remote-debug-overlay");
    if (button)
    {
      if (this.current_client && this.connection_is_remote(this.current_client))
        button.addClass("remote-active");
      else
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
        if(window.settings.debug.get('show-as-tab'))
        {
          ui_framework.layouts.main_layout.tabs.push('debug_new');
          window.topCell.tab.addTab(new Tab('debug_new', window.views['debug_new'].name));
          window.topCell.onresize();
        }
      }
      // a short workaround to hide some tabs as long as we don't have the dynamic tabs
      var tabs = ui_framework.layouts.error_console_rough_layout.children[0].tabs,
      tab = '',
      i = 1;

      // tabs[0] is skipped, as that is console-all, that should never be hidden.
      for( i = 1; tab = tabs[i]; i++ )
      {
        views[tab].is_hidden = true;
        topCell.disableTab(tab, true);
      }
      arguments.callee._called_once = true;
    }
  };

  this.setup_top_cell = function(services)
  {
    var last_selected_view = UI.get_instance().retrieve_last_selected_view();
    var open_windows = UIWindowBase.close_all_windows();
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
    setTimeout(function(){
      open_windows.forEach(function(view_id){UIWindowBase.showWindow(view_id)});
    }, 250);
    if (last_selected_view)
    {
      var esdi = window.services['ecmascript-debugger'];
      this._on_profile_enabled_cb = this._profile_enabled.bind(this, last_selected_view);
      window.messages.addListener("profile-enabled", this._on_profile_enabled_cb);
    }
  };

  this._profile_enabled = function(last_selected_view, msg)
  {
    if (msg.profile == window.app.profiles.DEFAULT)
    {
      var tag = window.tag_manager.set_callback(this, function(status, message)
      {
        const OBJECT_ID = 0;
        if (!message[OBJECT_ID])
          this._show_last_selected_view(last_selected_view);
      });
      var esdi = window.services["ecmascript-debugger"];
      esdi.requestGetSelectedObject(tag);
    }
    else
      this._show_last_selected_view(last_selected_view);

    window.messages.removeListener("profile-enabled", this._on_profile_enabled_cb);

  };

  this._show_last_selected_view = function(last_selected_view)
  {
    // if last_selected_view is hidden and the tab has a fallback_view_id, use that.
    if (window.views[last_selected_view] &&
        window.views[last_selected_view].is_hidden &&
        window.views[last_selected_view].fallback_view_id)
    {
      last_selected_view = window.views[last_selected_view].fallback_view_id;
    }
    UI.get_instance().show_view(last_selected_view);
  };

  window.app.addListener('services-created', this.on_services_created.bind(this));

};

ui_framework.layouts.error_console_rough_layout =
{
  dir: 'v', width: 700, height: 700,
  children:
  [
    { height: 200, tabs:
      [
        'console-all',
        'console-script',
        'console-css',
        'console-html',
        'console-svg',
        'console-storage',
        'console-other'
      ]
    }
  ]
}

ui_framework.layouts.profiler_rough_layout =
{
    dir: 'v',
    width: 1000,
    height: 1000,
    children: [{ height: 1000, tabbar: { tabs: ["profiler_all"], is_hidden: true } }]
}

ui_framework.layouts.environment_rough_layout =
{
  dir: 'v', width: 700, height: 700,
  children:
  [
    { height: 200, tabs: ['environment'] }
  ]
};

ui_framework.layouts.dom_rough_layout =
{
  dir: 'h', width: 700, height: 700,
  children:
  [
    {
      tabbar: { tabs: ['dom'], is_hidden: true }
    },
    {
      name: 'dom_panel',
      width: 350,
      get_tabs: function(services)
      {
        if (services['ecmascript-debugger'].satisfies_version(6, 11))
        {
          return ['dom-side-panel',
                  'dom_attrs',
                  'css-layout',
                  'ev-listeners-side-panel',
                  'dom-search'];
        }

        return ['dom-side-panel', 'dom_attrs', 'css-layout', 'dom-search'];
      }
    }
  ]
};

ui_framework.layouts.js_rough_layout =
{
  dir: 'h', width: 700, height: 700,
  children:
  [
    {
      children:
      [
        {
          height: 350,
          tabbar: { tabs: ['js_source'], is_hidden: true }
        }
      ]
    },
    {
      name: 'js_panel',
      width: 350,
      children:
      [
        {
          get_tabs: function(services)
          {
            return services['ecmascript-debugger'].major_version > 5 ?
                   ['scripts-side-panel', 'breakpoints-side-panel', 'js-search'] :
                   ['scripts-side-panel', 'js-search'];
          }
        }
      ]
    }
  ]
};

ui_framework.layouts.network_rough_layout =
{
    dir: 'v',
    width: 1000,
    height: 1000,
    children: [ { height: 1000, tabs:
                  [
                    'network_logger',
                    'request_crafter',
                    'network_options'
                  ]
                }
              ]
};


ui_framework.layouts.resource_rough_layout =
{
    dir: 'v',
    width: 1000,
    height: 1000,
    children: [ { height: 1000, tabbar: { id: "resources", tabs: ['resource_all'] } } ]
};

ui_framework.layouts.utils_rough_layout =
{
  dir: 'h', width: 700, height: 700,
  children:
  [
    {
      children:
      [
        {
          tabbar: { tabs: ['screenshot'], is_hidden: true }
        }
      ]
    },
    {
      name: 'utils_panel',
      width: 350,
      children:
      [
        {
          tabs: ['screenshot-controls', 'color-palette']
        }
      ]
    }
  ]
};

ui_framework.layouts.storage_rough_layout =
{
    dir: 'v',
    width: 1000,
    height: 1000,
    children: [ {
      height: 1000,
      get_tabs: function(services)
      {
        var cookie_module = 'cookies';
        if(services["cookie-manager"] && services["cookie-manager"].is_implemented)
        {
          cookie_module = 'cookie_manager';
        }
        return [cookie_module, 'local_storage', 'session_storage', 'widget_preferences']
      }
    } ]
};

ui_framework.layouts.console_rough_layout =
{
    dir: 'v',
    width: 1000,
    height: 1000,
    children: [{ height: 1000, tabbar: { tabs: ["command_line"], is_hidden: true } }]
};

ui_framework.layouts.main_layout =
{
  id: 'main-view',
  // tab and tabbar can have an according get_ function.
  // the function gets called with the services returned
  // and created depending on Scope.HostInfo
  get_tabs: function(services)
  {
    // return a layout depending on services
    // e.g. services['ecmascript-debugger'].version
    // e.g. services['ecmascript-debugger'].is_implemented
    return [
      'dom_mode',
      {view: 'js_mode', tab_class: JavaScriptTab},
      'network_mode',
      'resource_panel',
      'storage',
      'profiler_mode',
      {view: 'console_mode', tab_class: ErrorConsoleTab},
      'utils',
      'console_panel'
    ];
  }
};
