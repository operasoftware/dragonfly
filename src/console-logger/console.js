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
  this._dragonfly_msgs = [];
  this._views = [];
  this._selected_rt_url = '';
  this._url_self = location.host + location.pathname;
  this._lastid = 0;

  this._updateviews = function()
  {
    var view = '', i = 0;
    for( ; view = this._views[i]; i++)
    {
      window.views[view].update();
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
    else
    {
      this._dragonfly_msgs.push(entry);
    }

    window.messages.post('console-message', entry);
    this._updateviews();
  };

  /**
   * Clear the log. If source is set, clear only the entries with that source
   */
  this.clear = function(source)
  {
    if( source ) {
      var fun = function(e) {return e.source!=source;};
      this._msgs = this._msgs.filter(fun);
    }
    else {
      this._msgs = [];
      this._toggled = [];
    }
    this._updateviews();
  };

  /**
   * Toggle an entry. This is context sensitive.
   * Whatever is in the list behaves opposite of the default. In other words,
   * when items are expanded by default, items in the toggled list are not
   * expanded and vice-versa.
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

  /**
   * Return all the messages. If souce is set, return only messages for
   * that source.
   */
  this._get_msgs_without_filter = function(source)
  {
    if( source ) {
        var fun = function(e) {return e.source==source;};
        return this._msgs.filter(fun);
    }
    return this._msgs;
  };

  /**
   * Return all the messages whose uri is the same as __selected_rt_url.
   * If souce is set, return only messages for that source.
   */
  this._get_msgs_with_filter = function(source)
  {
    var fun = function(e) { return e.uri == this._selected_rt_url &&
                            (!source || e.source==source);
    };
  return this._msgs.filter(fun);
  };

  this.get_messages = function(source, filter)
  {
    return filter || settings.console.get('use-selected-runtime-as-filter')
      ? this._get_msgs_with_filter(source, filter)
      : this._get_msgs_without_filter(source);
  };

  this.get_message = function(id)
  {
    if (! this._msgs)
    {
      return null;
    }
    else
    {
      var fun = function(e) {
        return e.id == id;
      };
      return this._msgs.filter(fun)[0] || null;
    }
  };

  this.clear_dragonfly_messages = function()
  {
    this._dragonfly_msgs = [];
    this._updateviews();
  };

  this.get_dragonfly_messages = function()
  {
    return this._dragonfly_msgs;
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
          toggled = [];
          this._updateviews();
          break;
        }
        case 'use-selected-runtime-as-filter': {
          this._updateviews();
          break;
        }
        default: { // these settings are names of tabs to show.
          var is_disabled = !settings[msg.id].get(msg.key);
          views[msg.key].ishidden_in_menu = is_disabled;
          topCell.disableTab(msg.key, is_disabled);
        }
      }
    }
  };

  this._extract_title = function(description)
  {
    var parts = description.split("\n");
    if (parts.length)
    {
      return parts[0] == "Error:" ? parts[1].substr(6) : parts[0];
    }
    return "";
  };

  this._extract_line = function(description)
  {
    var matcher = /[lL]ine (\d*)/;
    var linematch = matcher.exec(description);
    return linematch ? linematch[1] : null;
  };

  this._on_console_message = function(message)
  {
    /*
     const
     WINDOW_ID = 0,
     TIME = 1,
     DESCRIPTION = 2,
     URI = 3,
     CONTEXT = 4,
     SOURCE = 5,
     SEVERITY = 6;
     */
    this.addentry({
      id: "" + (++this._lastid),
      window_id: message[0],
      time: new Date(parseInt(message[1])),
      description: message[2],
      title: this._extract_title(message[2]),
      line: this._extract_line(message[2]),
      uri: message[3],
      context: message[4],
      source: message[5],
      severity: message[6]
    });

  };

  this._on_runtime_selecetd = function(msg)
  {
    var rt = window.runtimes.getRuntime(msg.id);
    this._selected_rt_url = rt && rt.uri || '';
  };

  this.init = function()
  {
    window.messages.addListener('setting-changed', this._on_setting_change.bind(this));
    window.messages.addListener('runtime-selected', this._on_runtime_selecetd.bind(this));
    var service = window.services['console-logger'];
    service.add_listener("consolemessage", this._on_console_message.bind(this));
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
  container_class = container_class ? container_class : 'scroll error-console';
  name = name ? name : 'missing name ' + id;

  var _expand_all_state = null;
  var _table_ele = null;

  this.createView = function(container)
  {
    // Switch on whether we have a table element allready. If we do, just
    // render the latest log entry
    var entries = window.error_console_data.get_messages(source);
    topCell.statusbar.updateInfo(ui_strings.S_CONSOLE_TOOLBAR_MESSAGES_COUNT.replace("%s", entries.length));
    var expand_all = settings.console.get('expand-all-entries');

    // If there is no table, it's empty or expand state changed, render all
    if (! _table_ele || ! entries.length || expand_all != _expand_all_state)
    {
      // The expand all state thingy is to make sure we handle switching
      // between expand all/collapse all properly.
      _expand_all_state = expand_all;
      this.renderFull(container, entries, expand_all);
    }
    // but if not, check if there are new entries to show and just
    // update the list with them
    else if (_table_ele.childNodes.length-1 < entries.length)
    {
      this.renderUpdate(entries.slice(-1), expand_all);
    }
  };


  this.renderFull = function(container, messages, expand_all)
  {
    container.clearAndRender(templates.error_log_table(messages,
                                                       expand_all,
                                                       window.error_console_data.get_toggled(),
                                                       this.id)
                             );
    _table_ele = container.getElementsByTagName("table")[0];
    //container.scrollTop = container.scrollHeight;
  };

  this.renderUpdate = function(entries, expandAll)
  {
    for (var n=0, cur; cur=entries[n]; n++)
    {
      _table_ele.render(templates.error_log_row(cur, expandAll, window.error_console_data.get_toggled(), this.id));
    }
  };

  this.ondestroy = function() {
    delete _table_ele;
    _table_ele = null;
  };

  this.init(id, name, container_class );
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
    id: 'console-java',
    name: ui_strings.M_VIEW_LABEL_ERROR_JAVA,
    source: 'java'
  },
  {
    id: 'console-m2',
    name: ui_strings.M_VIEW_LABEL_ERROR_M2,
    source: 'm2'
  },
  {
    id: 'console-network',
    name: ui_strings.M_VIEW_LABEL_ERROR_NETWORK,
    source: 'network'
  },
  {
    id: 'console-xml',
    name: ui_strings.M_VIEW_LABEL_ERROR_XML,
    source: 'xml'
  },
  {
    id: 'console-html',
    name: ui_strings.M_VIEW_LABEL_ERROR_HTML,
    source: 'html'
  },
  {
    id: 'console-xslt',
    name: ui_strings.M_VIEW_LABEL_ERROR_XSLT,
    source: 'xslt'
  },
  {
    id: 'console-svg',
    name: ui_strings.M_VIEW_LABEL_ERROR_SVG,
    source: 'svg'
  },
  {
    id: 'console-bittorrent',
    name: ui_strings.M_VIEW_LABEL_ERROR_BITTORRENT,
    source: 'bittorrent'
  },
  {
    id: 'console-voice',
    name: ui_strings.M_VIEW_LABEL_ERROR_VOICE,
    source: 'ecmascript'
  },
  {
    id: 'console-widget',
    name: ui_strings.M_VIEW_LABEL_ERROR_WIDGET,
    source: 'widget'
  }
];

ErrorConsoleView.roughViews.bindClearSource = function(source)
{
  return function(event, target)
  {
    window.error_console_data.clear(source);
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
          title: ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH
        }
    ]

    );
    new Switches
    (
      r_v.id,
      [
        'console.expand-all-entries'
        //'console.use-selected-runtime-as-filter' // Not in use
      ]
    );
    eventHandlers.click[handler_id] = this.bindClearSource( r_v.source ? r_v.source : '' );

    /* create the handler code for the text search box
       We make a function here so we close around the view id */
    (function() {
      var textSearch = new TextSearch();

      var view_id = r_v.id;
      var onViewCreated = function(msg)
      {
        if( msg.id == view_id )
        {
          textSearch.setContainer(msg.container);
          textSearch.setFormInput(views.console.getToolbarControl( msg.container, 'console-text-search-' + view_id));
        }
      };

      var onViewDestroyed = function(msg)
      {
        if( msg.id == view_id )
        {
          textSearch.cleanup();
        }
      };

      messages.addListener('view-created', onViewCreated);
      messages.addListener('view-destroyed', onViewDestroyed);

      eventHandlers.input['console-text-search-'+ view_id] = function(event, target)
      {
        textSearch.searchDelayed(target.value);
      };

      eventHandlers.keypress['console-text-search-'+ view_id] = function(event, target)
      {
        if( event.keyCode == 13 )
        {
          textSearch.highlight();
        }
      };
    })();

  }
};

eventHandlers.click['error-log-list-expand-collapse'] = function(event, target)
{
  var logid = target.getAttribute("data-logid");
  window.error_console_data.toggle_entry(logid);
  if (target.hasClass("expanded"))
  {
    target.parentNode.removeChild(target.nextSibling);
    target.swapClass("expanded", "collapsed");
  }
  else
  {
    var entry = window.error_console_data.get_message(logid);
    var row = document.render(templates.error_log_detail_row(entry));
    target.parentNode.insertAfter(row, target);
    target.swapClass("collapsed", "expanded");
    row.scrollSoftIntoContainerView();
  }
};


/**
  * @constructor
  * @extends ViewBase
  * General view to get general console setting.
  */
cls.ConsoleLogger["2.0"].ConsoleView = function(id, name, container_class)
{
  this.ishidden_in_menu = true;
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
      'console-all': true,
      'console-script': true,
      'console-css': true,
      'console-xml': false,
      'console-java': false,
      'console-m2': false,
      'console-network': false,
      'console-html': false,
      'console-xslt': false,
      'console-svg': false,
      'console-bittorrent': false,
      'console-voice': false,
      'console-widget': false,
      'use-selected-runtime-as-filter': false,
      'expand-all-entries': false
    },
    // key-label map
    {
      'console-all': ui_strings.S_SWITCH_SHOW_TAB_ALL,
      'console-script': ui_strings.S_SWITCH_SHOW_TAB_SCRIPT,
      'console-css': ui_strings.S_SWITCH_SHOW_TAB_CSS,
      'console-xml': ui_strings.S_SWITCH_SHOW_TAB_XML,
      'console-java': ui_strings.S_SWITCH_SHOW_TAB_JAVA,
      'console-m2': ui_strings.S_SWITCH_SHOW_TAB_M2,
      'console-network': ui_strings.S_SWITCH_SHOW_TAB_NETWORK,
      'console-html': ui_strings.S_SWITCH_SHOW_TAB_HTML,
      'console-xslt': ui_strings.S_SWITCH_SHOW_TAB_XSLT,
      'console-svg': ui_strings.S_SWITCH_SHOW_TAB_SVG,
      'console-bittorrent': ui_strings.S_SWITCH_SHOW_TAB_BITTORRENT,
      'console-voice': ui_strings.S_SWITCH_SHOW_TAB_VOICE,
      'console-widget': ui_strings.S_SWITCH_SHOW_TAB_WIDGET,
      'use-selected-runtime-as-filter': ' use selected runtime as filter', // Not in use!
      'expand-all-entries': ui_strings.S_SWITCH_EXPAND_ALL
  },
    // settings map
    {
      checkboxes:
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
  );
};
