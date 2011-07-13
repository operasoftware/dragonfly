/**
 * @fileoverview
 * This file contains most of the code implementing the console view in
 * Dragonfly
 */

window.cls || (window.cls = {});
cls.ConsoleLogger || (cls.ConsoleLogger = {});
cls.ConsoleLogger["2.0"] || (cls.ConsoleLogger["2.0"] = {});

/**
 * Data class for console logger
 * @constructor
 */
cls.ConsoleLogger["2.0"].ErrorConsoleData = function()
{
  this._msgs = [];
  this._toggled = [];
  this._views = [];
  this._url_self = location.host + location.pathname;
  this._lastid = 0;
  this.current_error_count = 0;

  this._update_views = function()
  {
    for (view = '', i = 0; view = this._views[i]; i++)
    {
      window.views[view].update()
    }
    var last_shown_error_view = this.last_shown_error_view || this._views[0];
    if (last_shown_error_view && window.views[last_shown_error_view])
    {
      window.views[last_shown_error_view].update_error_count();
    }
  };

  this.addview = function(view_id)
  {
    this._views.push(view_id);
  };

  /**
   * Adds a log entry to the data model.
   */
  this.addentry = function(entry)
  {
    if( !entry.uri || entry.uri.indexOf(this._url_self) == -1 )
    {
      this._msgs.push(entry);
    }

    // before calling update_views, need to make sure the respective view is not hidden.
    if (entry.source)
    {
      var corresponding_tab = this._views[0];
      for (var i=0; i < ErrorConsoleView.roughViews.length; i++)
      {
        if (ErrorConsoleView.roughViews[i].source === entry.source)
        {
          corresponding_tab = ErrorConsoleView.roughViews[i].id;
        }
      };
      if(views[corresponding_tab].is_hidden)
      {
        views[corresponding_tab].is_hidden = false;
        topCell.disableTab(corresponding_tab, false); // means enable
      }
    }
    this._update_views();
  };

  /**
   * Clear the visible items in the log, based on source and query, both optional.
   */
  this.clear = function(source, query)
  {
    var messages = this.get_messages(source, query);
    if (this._filter_bound)
    {
      messages = messages.filter(this._filter_bound);
    }
    var message_ids = messages.map( function(e){return e.id} );
    this._msgs = this._msgs.filter( function(e){return message_ids.indexOf(e.id) == -1} );
    this._update_views();
  };

  this.clear_all_and_hide_tabs = function()
  {
    this._msgs = [];
    for (var i = 1, view_id; view_id = this._views[i]; i++)
    {
      window.views[view_id].is_hidden = true;
      topCell.disableTab(view_id, true);
    };
    this._update_views();
  }

  /**
   * Toggle an entry.
   */
  this.toggle_entry = function(logid)
  {
    if (this._toggled.indexOf(logid) == -1) {
      this._toggled.push(logid);
    }
    else {
      this._toggled.splice(this._toggled.indexOf(logid), 1);
    }
  };

  this.get_messages = function(source, query)
  {
    var messages = this._msgs;
    if (source)
    {
      messages = messages.filter(function(e) {return e.source==source;});
    }
    if (query)
    {
      var query_filter = this._get_string_filter(query);
      messages = messages.filter(query_filter);
    }
    return messages;
  };

  this.get_toggled = function()
  {
    return this._toggled;
  };

  this._on_setting_change = function(msg)
  {
    if( msg.id == 'console' )
    {
      switch(msg.key)
      {
        case 'expand-all-entries': {
          this._toggled = [];
          this._update_views();
          break;
        }
        case 'css-filter':
        case 'use-css-filter':
        {
          this._set_css_filter();
          this._update_views();
          break;
        }
      }
    }
  };

  this._on_console_message = function(data)
  {
    var message = new cls.ConsoleLogger["2.0"].ConsoleMessage(data);
    message.id = "" + (++this._lastid);

    // only take console messages over ECMAScriptDebugger, will be setting dependend
    if (!message.context.startswith("console."))
    {
      this.addentry(message);
    }
  };

  this._filter = function(message)
  {
    if (!this._filters || !this._filters.hasOwnProperty('css'))
    {
      this._set_css_filter();
    }
    if (message.source == "css" && this._filters.css)
    {
      for (var i = 0, filter; filter = this._filters.css[i]; i++)
      {
        if (message.description.indexOf(filter) != -1)
        {
          return false;
        }
      }
    }
    return true;
  };
  this._filter_bound = this._filter.bind(this);

  this._set_css_filter = function()
  {
    if (!this._filters)
    {
      this._filters = {};
    }
    if (!this._setting)
    {
      this._setting = window.settings.console;
    }
    
    this._filters.css = null;
    if (this._setting.get('use-css-filter'))
    {
      this._filters.css = (this._setting.get('css-filter') || '')
                          .split(/,\s*/).map(function(token)
                          {
                            return token.trim();
                          }).filter(Boolean);
    }
  };

  this._string_filter_config = [
    {
      id: "title"
    },
    {
      id: "description"
    },
    {
      id: "details",
      requires_expansion: true
    },
    {
      id: "context"
    },
    {
      id: "line"
    },
    {
      id: "uri"
    },
    {
      id: "source"
    },
    {
      id: "severity"
    },
    {
      id: "location_string"
    }
  ];

  this._get_string_filter = function (query, string_filter_config)
  {
    string_filter_config || (string_filter_config = this._string_filter_config);
    return (function(entry)
    {
      // adds require_expansion flag, returns false for hidden fields
      var is_hidden = true;
      entry.requires_expansion = false;
      if (query)
      {
        for (var i = 0, filter_config; filter_config = string_filter_config[i]; i++)
        {
          if (
            filter_config.id &&
            entry[filter_config.id] &&
            (entry[filter_config.id].toLowerCase().indexOf(query.toLowerCase()) !== -1)
          )
          {
            is_hidden = false;
            if (filter_config.requires_expansion)
            {
              entry.requires_expansion = true;
            }
          }
        }
        return !is_hidden;
      }
      return true;
    })
  }

  this.init = function()
  {
    this._filters = {};

    window.messages.addListener("setting-changed", this._on_setting_change.bind(this));
    window.messages.addListener("debug-context-selected", this.clear_all_and_hide_tabs.bind(this));

    var logger = window.services["console-logger"];
    logger.add_listener("consolemessage", this._on_console_message.bind(this));
  };
  this.init();
};

/**
 * Error Console view
 * @constructor
 * @extends ViewBase
 */

var ErrorConsoleView = function(id, name, container_class, source)
{
  container_class || (container_class = "scroll error-console");

  this._expand_all_state = null;
  this._table_ele = null;

  if (id !== ErrorConsoleView.roughViews[0].id)
  {
    this.fallback_view_id = ErrorConsoleView.roughViews[0].id;
  }

  this.createView = function(container)
  {
    this._container = container;
    this._container.setAttribute("data-error-log-id", id);
    this._container.setAttribute("data-menu", "error-console");
    if (this.query)
    {
      // this triggers _create via on_before_search
      this._text_search.update_search();
    }
    else
    {
      this._create();
    }
  };

  this._create = function()
  {
    if (this._container)
    {
      window.error_console_data.last_shown_error_view = id;
      var entries = window.error_console_data
                      .get_messages(source, this.query)
                      .filter(window.error_console_data._filter_bound);
      this.update_error_count(entries);
      var expand_all = settings.console.get('expand-all-entries');
      var template = templates.errors.log_table(entries, 
                                                  expand_all,
                                                  window.error_console_data.get_toggled(),
                                                  this.id);
      this._container.clearAndRender(template);
      if (this._scrollTop)
      {
        this._container.scrollTop = this._scrollTop;
      }
      this._table_ele = this._container.getElementsByTagName("table")[0];
    }
  }

  this.update_error_count = function(entries)
  {
    if (!entries)
    {
      entries = window.error_console_data
                    .get_messages(source, this.query)
                    .filter(window.error_console_data._filter_bound);
    }
    window.messages.post("error-count-update", {current_error_count: entries.length});
  }

  this.ondestroy = function()
  {
    delete this._table_ele;
    this._table_ele = null;
  };

  this._on_before_search_bound = (function(message)
  {
    this.query = message.search_term;
    this._create();
  }).bind(this);

  this.init(id, name, container_class, null, "error-view");
};
ErrorConsoleView.prototype = ViewBase;

ErrorConsoleView.roughViews =
[
  {
    id: 'console-all',
    name: ui_strings.M_VIEW_LABEL_ERROR_ALL
  },
  {
    id: 'console-script',
    name: ui_strings.M_VIEW_LABEL_ERROR_SCRIPT,
    source: 'ecmascript'
  },
  {
    id: 'console-css',
    name: ui_strings.M_VIEW_LABEL_ERROR_CSS,
    source: 'css'
  },
  {
    id: 'console-html',
    name: ui_strings.M_VIEW_LABEL_ERROR_HTML,
    source: 'html'
  },
  {
    id: 'console-svg',
    name: ui_strings.M_VIEW_LABEL_ERROR_SVG,
    source: 'svg'
  },
  {
    id: 'console-storage',
    name: ui_strings.M_VIEW_LABEL_ERROR_STORAGE,
    source: 'persistent_storage'
  },
  {
    id: 'console-other',
    name: ui_strings.M_VIEW_LABEL_ERROR_OTHER
  }
];

ErrorConsoleView.roughViews.bindClearSource = function(source, view_id)
{
  return function(event, target)
  {
    var query = window.views[view_id] && window.views[view_id].query;
    window.error_console_data.clear(source, query);
  };
};

ErrorConsoleView.roughViews.createViews = function()
{
  var r_v = null, i = 0, handler_id = '';
  for( ; r_v = this[i]; i++)
  {
    new ErrorConsoleView(r_v.id, r_v.name, r_v.container_class, r_v.source);
    window.error_console_data.addview(r_v.id);
    handler_id = 'clear-error-console' + ( r_v.source ? '-' + r_v.source : '' );
    new ToolbarConfig
    (
      r_v.id,
      [
        {
          handler: handler_id,
          title: ui_strings.S_BUTTON_LABEL_CLEAR_LOG,
          class_name: 'clear-log'
        }
      ],
      [
        {
          handler: 'console-text-search-' + r_v.id,
          shortcuts: 'console-text-search-' + r_v.id,
          title: ui_strings.S_SEARCH_INPUT_TOOLTIP,
          label: ui_strings.S_INPUT_DEFAULT_TEXT_FILTER,
          type: "filter"
        }
      ]
    );
    new Switches
    (
      r_v.id,
      [
        'console.expand-all-entries'
      ]
    );
    eventHandlers.click[handler_id] = this.bindClearSource( r_v.source ? r_v.source : '', r_v.id);

    /* create the handler code for the text search box
       We make a function here so we close around the view id */
    (function() {
      var view_id = r_v.id;

      var text_search = window.views[view_id]._text_search = new TextSearch(); // or pass (1) to make it search on 1 char
      var onShowView = function(msg)
      {
        if( msg.id == view_id )
        {
          var container = UI.get_instance().get_container(view_id);
          text_search.setContainer(container);
          text_search.setFormInput(views.console.getToolbarControl( container, 'console-text-search-' + view_id));
        }
      };

      var onViewDestroyed = function(msg)
      {
        if( msg.id == view_id )
        {
          text_search.cleanup();
        }
      };

      messages.addListener('show-view', onShowView);
      messages.addListener('view-destroyed', onViewDestroyed);
      text_search.add_listener("onbeforesearch", window.views[view_id]._on_before_search_bound);

      eventHandlers.input['console-text-search-'+ view_id] = function(event, target)
      {
        text_search.searchDelayed(target.value);
      };

      ActionBroker.get_instance().get_global_handler().
        register_shortcut_listener('console-text-search-'+ view_id, cls.Helpers.shortcut_search_cb.bind(text_search));
    })();

  }
};

eventHandlers.click['error-log-list-expand-collapse'] = function(event, target)
{
  var logid = target.getAttribute("data-logid");
  window.error_console_data.toggle_entry(logid);
  if (target.hasClass("expanded"))
  {
    target.swapClass("expanded", "collapsed");
  }
  else
  {
    target.swapClass("collapsed", "expanded");
    target.scrollSoftIntoContainerView();
  }
};


/**
  * @constructor
  * @extends ViewBase
  * General view to get general console setting.
  */
cls.ConsoleLogger["2.0"].ConsoleView = function(id, name, container_class)
{
  this.is_hidden = true;
  this.createView = function(container){};
  this.init(id, name, container_class);
};

cls.ConsoleLogger["2.0"].ConsoleView.create_ui_widgets = function()
{

  new Settings
  (
    // id
    'console',
    // key-value map
    {
      'expand-all-entries': false,
      'use-css-filter': false,
      'css-filter': 
      [
        '-webkit-, -khtml-, -moz-, -ms-, -o-',
        '_height, _width, _position, _display, _zoom',
        '_word-wrap, _z-index, _background, _padding',
        '_line-height, _vertical-align',
        '*width, *border, *margin, *font, *display', 
        '*top, *z-index, *line-height, *left',
        'zoom:, filter:, behavior:, DXImageTransform.Microsoft',
      ].join(',\n')
    },
    // key-label map
    {
      'expand-all-entries': ui_strings.S_SWITCH_EXPAND_ALL
    },
    // settings map
    {
      customSettings:
      [
        'css_error_filters'
      ]
    },
    {
      css_error_filters: window.templates.errors.log_settings_css_filter,
    },
    "console"  
  );

  var contextmenu = ContextMenu.get_instance();
  contextmenu.register("error-console", [
    {
      label: "Clear all errors",
      handler: function(event, target) {
        window.error_console_data.clear_all_and_hide_tabs();
      }
    }
  ]);
};

eventHandlers.input['error-console-css-filter'] = function(event, target)
{
  window.settings.console.set('css-filter', event.target.value);
};

eventHandlers.scroll["error-view"] = function(event, target)
{
  var container = target;
  while (container.nodeName.toLowerCase() != "container" && container.parentNode)
  {
    container = container.parentNode;
  }
  if (container)
  {
    var id = container.getAttribute("data-error-log-id");
    window.views[id]._scrollTop = container.scrollTop;
  }
};

