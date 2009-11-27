/**
 * @fileoverview
 * This file contains most of the code implementing the console view in
 * Dragonfly
 */

var cls = window.cls || ( window.cls = {} );

/**
  * Error console service class
  * @constructor 
  * @extends ServiceBase
  */
cls.ErrorConsoleService = function(name)
{
    var self = this;
    var messages = [];
    var lastId = 0;
  
    this.onreceive = function(xml) // only called if there is a xml
    {
        if(ini.debug) {
            debug.logEvents(xml);
        }

        if(self[xml.documentElement.nodeName]) {
          self[xml.documentElement.nodeName](xml)
        }
        else {
            opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
                               'error in console, genericEventListener');
        }
    }
    
    /**
     * Makes a dict out of a lump of xml
     */
    var parseLogEntry = function(xml)
    {
        //var uri = message_event.getNodeData('uri'); FIXME!

        // this id is usefull for getting a particular message from the log
        var message = {"id": ""+(++lastId)};
        var children = xml.documentElement.childNodes;

        for (var n=0, e; e=children[n]; n++) {
            switch (e.nodeName) {
                case "time":
                    message.time = new Date(parseFloat(e.textContent))
                    break;
                  
                case "description":
                    var parts = e.textContent.split("\n");
                    if (parts.length) {
                        if (parts[0] == "Error:") {
                            message.title = parts[1].substr(6);
                        }
                        else {
                            message.title = parts[0];
                        }
                    }
                    else {
                        message.title = ""
                    }
                    var matcher = /[lL]ine (\d*)/g;
                    
                    // If this is not set explicitly, the value is something
                    // bogus for every other use of the regexp.
                    // This is scary and confusing.
                    matcher.lastIndex = 0;

                    var linematch = matcher.exec(e.textContent);
                    if (linematch) {
                        message.line = linematch[1];
                    }
                    else {
                        message.line = null;
                    }
                    
                // There is no break here. message is handled normally too!
                default:
                    message[e.nodeName] = e.textContent;
            }
        }
        return message;
    }

    this['message'] = function(message) 
    {
        window.ErrorConsoleData.addEntry(parseLogEntry(message));
    }
  
    // constructor calls
  
    this.initBase(name);
    
    if (!client) {
        opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
                  'client must be created in ecma console.js');
        return;
    }
    client.addService(this);
}



/*

<?xml version="1.0"?>
<message>
<time>1194441921</time>
<uri>file://localhost/d:/cvs-source/scope/http-clients/ecma-debugger/tests/test-console.html</uri>
<context>Inline script thread</context>
<severity>error</severity>
<source>ecmascript</source>
<description xml:space="preserve">Error:
name: ReferenceError
message: Statement on line 2: Undefined variable: b
Backtrace:
  Line 2 of inline#1 script in file://localhost/d:/cvs-source/scope/http-clients/ecma-debugger/tests/test-console.html
    b.b = 'hallo';
</description>
</message>


<message>
<time>1194442013</time>
<uri>file://localhost/d:/cvs-source/scope/http-clients/ecma-debugger/tests/test-console.html</uri>
<context>Inlined stylesheet</context>
<severity>information</severity>
<source>css</source>
<description xml:space="preserve">xxcolor is an unknown property

Line 2:
  body {xxcolor:red}
  --------------^</description></message>

*/

cls.ErrorConsoleService.prototype = ServiceBase;
new cls.ErrorConsoleService('console-logger');

/**
 * Data class for console logger
 * @constructor 
 */
var ErrorConsoleData = new function()
{
  var msgs = [];
  var toggled = [];
  var dragonfly_msgs = [];
  var __views = ['console-dragonfly'];
  var __selected_rt_url = '';
  var url_self = location.host + location.pathname;

  var updateViews = function()
  {
    var view = '', i = 0;
    for( ; view = __views[i]; i++)
    {
      views[view].update();
    }
  }

  this.addView = function(view_id)
  {
    __views[__views.length] = view_id;
  }

  /**
   * Adds a log entry to the data model.
   */
  this.addEntry = function(entry)
  {
    if( !entry.uri || entry.uri.indexOf(url_self) == -1 )
    {
      msgs.push(entry);
    }
    else
    {
      dragonfly_msgs.push(entry);
    }

    messages.post('console-message', entry);
    updateViews();
  }

  /**
   * Clear the log. If source is set, clear only the entries with that source
   */
  this.clear = function(source)
  {
      if( source ) {
          var fun = function(e) {return e.source!=source}
          msgs = msgs.filter(fun)
      }
      else {
          msgs = [];
          toggled = [];
      }
      updateViews();
  }

  /**
   * Toggle an entry. This is context sensitive.
   * Whatever is in the list behaves opposite of the default. In other words,
   * when items are expanded by default, items in the toggled list are not
   * expanded and vice-versa.
   */
  this.toggleEntry = function(logid)
  {
      if (toggled.indexOf(logid) == -1) {
          toggled.push(logid);
      }
      else {
          toggled.splice(toggled.indexOf(logid), 1);
      }
  }

  /**
   * Return all the messages. If souce is set, return only messages for
   * that source.
   */
  var getMessagesWithoutFilter = function(source)
  {
    if( source ) {
        var fun = function(e) {return e.source==source}
        return msgs.filter(fun)
    }
    return msgs;
  }

  /**
   * Return all the messages whose uri is the same as __selected_rt_url.
   * If souce is set, return only messages for that source.
   */
  var getMessagesWithFilter = function(source)
  {
      var fun = function(e) { return e.uri == __selected_rt_url &&
                              (!source || e.source==source)
      }
      return msgs.filter(fun)
  }

  this.getMessages = function(source, filter)
  {
    return filter || settings.console.get('use-selected-runtime-as-filter') 
      ? getMessagesWithFilter(source, filter)
      : getMessagesWithoutFilter(source);
  }

  this.getMessage = function(id)
  {
    if (! msgs)
    {
        return null
    }
    else
    {
      var filterFun = function(e) {
        return e.id == id;
      }
      return msgs.filter(filterFun)[0] || null;
    }
  }

  this.clearDragonflyMessages = function()
  {
    dragonfly_msgs = [];
    updateViews();
  }

  this.getDragonflyMessages = function()
  {
    return dragonfly_msgs;
  }

  this.getToggled = function()
  {
    return toggled;
  }

  var onSettingChange = function(msg)
  {
    if( msg.id == 'console' )
    {
      switch(msg.key)
      {
        case 'expand-all-entries': {
          toggled = [];
          updateViews();
          break;
        }
        case 'use-selected-runtime-as-filter': {
          updateViews();
          break;
        }
        default: { // these settings are names of tabs to show.
          var is_disabled = !settings[msg.id].get(msg.key);
          views[msg.key].ishidden_in_menu = is_disabled;
          topCell.disableTab(msg.key, is_disabled);
        }
      }

    }
  }

  messages.addListener('setting-changed', onSettingChange);

  var onRuntimeSelecetd = function(msg)
  {
    var rt = runtimes.getRuntime(msg.id);
    __selected_rt_url = rt && rt.uri || '';
  }

  messages.addListener('runtime-selected', onRuntimeSelecetd);
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
    var entries = ErrorConsoleData.getMessages(source);
    var expand_all = settings.console.get('expand-all-entries');

    // Under these conditions, we re-render the whole thing:
    if (! _table_ele || ! entries.length || expand_all != _expand_all_state)
    {
        // The expand all state thingy is to make sure we handle switching
        // between expand all/collapse all properly.
        _expand_all_state = expand_all;
        this.renderFull(container, entries, expand_all);
    }
    else
    {
        this.renderUpdate(entries.slice(-1), expand_all);
    }
    this.renderFull
  }

  this.renderFull = function(container, messages, expand_all)
  {
    container.clearAndRender(templates.error_log_table(messages,
                                                       expand_all,
                                                       ErrorConsoleData.getToggled(),
                                                       this.id)
                             );
    _table_ele = container.getElementsByTagName("table")[0];
    //container.scrollTop = container.scrollHeight;
  }

  this.renderUpdate = function(entries, expandAll)
  {
    for (var n=0, cur; cur=entries[n]; n++)
    {
        _table_ele.render(templates.error_log_row(cur, expandAll, ErrorConsoleData.getToggled(), this.id));
    }
  }

  this.ondestroy = function() {
    delete _table_ele;
    _table_ele = null;
  }

  this.init(id, name, container_class );
}

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
]

ErrorConsoleView.roughViews.bindClearSource = function(source)
{
  return function(event, target)
  {
    ErrorConsoleData.clear(source);
  }
}

ErrorConsoleView.roughViews.createViews = function()
{
  var r_v = null, i = 0, handler_id = '';
  for( ; r_v = this[i]; i++)
  {
    new ErrorConsoleView(r_v.id, r_v.name, r_v.container_class, r_v.source);
    ErrorConsoleData.addView(r_v.id);
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
        'console.expand-all-entries',
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
      }
    
      var onViewDestroyed = function(msg)
      {
        if( msg.id == view_id )
        {
          textSearch.cleanup();
        }
      }
    
      messages.addListener('view-created', onViewCreated);
      messages.addListener('view-destroyed', onViewDestroyed);
    
      eventHandlers.input['console-text-search-'+ view_id] = function(event, target)
      {
        textSearch.searchDelayed(target.value);
      }
    
      eventHandlers.keypress['console-text-search-'+ view_id] = function(event, target)
      {
        if( event.keyCode == 13 )
        {
          textSearch.highlight();
        }
      }
    })();

  }
}

ErrorConsoleView.roughViews.createViews();

/**
 * View class for the error console
 * @constructor 
 * @extends ViewBase
 */
cls.ConsoleDragonflyView = function(id, name, container_class)
{
  this.createView = function(container)
  {
    container.clearAndRender(templates.error_log_messages(ErrorConsoleData.getDragonflyMessages()));
    container.scrollTop = container.scrollHeight;
  }
  this.init(id, name, container_class );
}

cls.ConsoleDragonflyView.prototype = ViewBase;

new cls.ConsoleDragonflyView('console-dragonfly', ui_strings.M_VIEW_LABEL_ERROR_DRAGONFLY, 'scroll error-console');

new ToolbarConfig
(
  'console-dragonfly',
  [
    {
      handler: 'clear-error-console-dragonfly',
      title: ui_strings.S_BUTTON_LABEL_CLEAR_LOG
    }
  ]
);

eventHandlers.click['clear-error-console-dragonfly'] = function()
{
  ErrorConsoleData.clearDragonflyMessages();
}

eventHandlers.click['error-log-list-expand-collapse'] = function(event, target)
{
    var logid = target.getAttribute("data-logid");
    ErrorConsoleData.toggleEntry(logid);
    if (target.hasClass("expanded"))
    {
        target.parentNode.removeChild(target.nextSibling);
        target.swapClass("expanded", "collapsed");
    }
    else
    {   
        var entry = ErrorConsoleData.getMessage(logid);
        var row = document.render(templates.error_log_detail_row(entry));
        target.parentNode.insertAfter(row, target);
        target.swapClass("collapsed", "expanded");
        row.scrollSoftIntoContainerView();
    }
}


/**
  * @constructor 
  * @extends ViewBase
  * General view to get general console setting.
  */
cls.ConsoleView = function(id, name, container_class)
{
  this.ishidden_in_menu = true;
  this.createView = function(container)
  {
  }
  this.init(id, name, container_class);
}

cls.ConsoleView.prototype = ViewBase;

new cls.ConsoleView('console', ui_strings.M_VIEW_LABEL_CONSOLE, 'scroll');

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
    'console-dragonfly': false,
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
    'console-dragonfly': ui_strings.S_SWITCH_SHOW_TAB_DRAGONFLY,
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
      'console-widget',
      'console-dragonfly'
    ]
  }
);

