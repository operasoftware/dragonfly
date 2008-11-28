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

  this.onreceive = function(xml) // only called if there is a xml
  {
    if( ini.debug )
    {
      debug.logEvents(xml);
    }
    if( self[xml.documentElement.nodeName] )
    {
      self[xml.documentElement.nodeName](xml)
    }
    else
    {
      opera.postError('error in console, genericEventListener');
    }
  }

  this['message'] = function(message) 
  {
    window.console_messages.handle(message);
  }

  // constructor calls

  this.initBase(name);
  
  if( ! client)
  {
    opera.postError('client must be created in ecma comsole.js');
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
  * @constructor 
  */

var console_messages = new function()
{
  var msgs = [];
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

  this.handle = function(message_event)
  {
    var uri = message_event.getNodeData('uri');
    var message = {};
    var children = message_event.documentElement.childNodes, child=null, i=0, value = '';
    for ( ; child = children[i]; i++)
    {
      message[child.nodeName] = child.textContent;
    }
    // TODO uri is not always present
    if( !uri || uri.indexOf(url_self) == -1 )
    {
      msgs[msgs.length] = message;
    }
    else
    {
      dragonfly_msgs[dragonfly_msgs.length] = message;
    }
    updateViews();
  }

  this.clear = function(source)
  {
    var msg = null, i = 0;
    if( source )
    {
      for( ; msg = msgs[i]; i++ )
      {
        if( msg.source == source )
        {
          msgs.splice(i, 1);
          i--;
        }
      }
    }
    else
    {
      msgs = [];
    }
    updateViews();
  }

  var getMessagesWithoutFilter = function(source)
  {
    var ret = [], msg = null, i = 0;
    if( source )
    {
      for( ; msg = msgs[i]; i++ )
      {
        if( msg.source == source )
        {
          ret[ret.length] =  msg;
        }
      }
    }
    else
    {
      ret = msgs;
    }
    return ret;
  }

  var getMessagesWithFilter = function(source)
  {
    var ret = [], msg = null, i = 0;
    for( ; msg = msgs[i]; i++ )
    {
      if( msg.uri == __selected_rt_url )
      {
        if( source )
        {
          if( msg.source == source )
          {
            ret[ret.length] =  msg;
          }
        }
        else
        {
          ret[ret.length] =  msg;
        }
      }
    }
    return ret;
  }

  this.getMessages = function(source, filter)
  {
    return filter || settings.console.get('use-selected-runtime-as-filter') 
      ? getMessagesWithFilter(source, filter)
      : getMessagesWithoutFilter(source);
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

  var onSettingChange = function(msg)
  {
    if( msg.id == 'console' )
    {
      switch(msg.key)
      {
        case 'use-selected-runtime-as-filter':
        {
          updateViews();
          break;
        }
        default:
        {
          var is_disbaled = !settings[msg.id].get(msg.key);
          views[msg.key].ishidden_in_menu = is_disbaled;
          topCell.disableTab(msg.key, is_disbaled);
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
  * @constructor 
  * @extends ViewBase
  */

var ErrorConsoleView = function(id, name, container_class, source)
{
  container_class = container_class ? container_class : 'scroll error-console';
  name = name ? name : 'missing name ' + id;
  this.createView = function(container)
  {
    container.innerHTML = '';
    container.render(templates.messages(console_messages.getMessages(source)));
    container.scrollTop = container.scrollHeight;
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
    console_messages.clear(source);
  }
}


ErrorConsoleView.roughViews.createViews = function()
{
  var r_v = null, i = 0, handler_id = '';
  for( ; r_v = this[i]; i++)
  {
    new ErrorConsoleView(r_v.id, r_v.name, r_v.container_class, r_v.source);
    console_messages.addView(r_v.id);
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
    /*
    new Switches
    (
      r_v.id,
      [
        'console.use-selected-runtime-as-filter'
      ]
    );
    */
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
    
      eventHandlers.keyup['console-text-search-'+ view_id] = function(event, target)
      {
        //opera.postError("keyup in " + view_id);
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
  * @constructor 
  * @extends ViewBase
  */
cls.ConsoleDragonflyView = function(id, name, container_class)
{
  this.createView = function(container)
  {
    container.innerHTML = '';
    container.renderInner(templates.messages(console_messages.getDragonflyMessages()));
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
      title: 'Clear Log'
    }
  ]
);

eventHandlers.click['clear-error-console-dragonfly'] = function()
{
  console_messages.clearDragonflyMessages();
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
    'use-selected-runtime-as-filter': false
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
    'use-selected-runtime-as-filter': ' use selected runtime as filter'
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

