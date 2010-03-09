window.cls || (window.cls = {});

/**
  * @constructor 
  * @extends ViewBase
  */

cls.ThreadsView = function(id, name, container_class)
{
  var self = this;
  var __container = null;
  var cursor = 0;
  const INDENT = ' ', NL = '\n';


  var propsKey = 
  [
    'event_type',
    'stoped_at_queue',
    'threads',
    'rt_id',
    'thread_id',
    'parent-thread-id', 
    'thread-type',
    'status',
    'script-id',
    'line-number',
    'stopped-reason'
  ];

  var propsMap = 
  {
    event_type: function(value)
    {
      return value + ':' + NL || '';
    },
    stoped_at_queue: function(value)
    {
      return value.length && INDENT + 'stoped at queue: ' + value.join(' ') + NL || '';
      
    },
    threads: function(value)
    {
      var ret = '', thread = null, i = 0, t = '', k = 0;
      if(value.length)
      {
        ret = INDENT + 'threads overview:' + NL;
        for( ; thread = value[i]; i++)
        {
          ret += INDENT + INDENT + 'runtime ' + thread[0] +': ';
          for( k = 1; t = thread[k]; k++)
          {
            ret += t + ' ';
          }
          ret += NL;
        }
      }
      return ret;

    },
    rt_id: function(value)
    {
      return INDENT + 'runtime id: ' + value + NL || '';
    },
    thread_id: function(value)
    {
      return INDENT + 'thread id: ' + value + NL || '';
    },
    'parent-thread-id': function(value)
    {
      return value && value != '0' && INDENT + 'parent thread id: ' + value + NL || '';
    },
    'thread-type': function(value)
    {
      return value && INDENT + 'thread type: ' + value + NL || '';
    },
    'status': function(value)
    {
      return value && INDENT + 'status: ' + value + NL || '';
    },
    'script-id': function(value)
    {
      return value && INDENT + 'script id: ' + value + NL || '';
    },
    'line-number': function(value)
    {
      return value && INDENT + 'line number: ' + value + NL || '';
    },
    'stopped-reason': function(value)
    {
      return value && INDENT + 'stop reason: ' + value + NL || '';
    }
  }




  this.createView = function(container)
  {
    var threads = runtimes.getThreads(), thread = null, key = '', i = 0, j = 0;
    var inner = "", thread_inner='';
    
    if( !__container || !container.firstChild )
    {
      container.innerHTML = '';
      __container = container.render(['div', 'class', 'padding']);
    }
    for( ; thread = threads[cursor]; cursor++)
    {
      thread_inner = "<pre>";
      for( j = 0; key = propsKey[j]; j++)
      {
        thread_inner += propsMap[key](thread[key]);
      }
      inner += thread_inner + "</pre>";
    }
    
    __container.innerHTML += inner;
    container.scrollTop = container.scrollHeight;
  }

  this.ondestroy = function()
  {
    __container = null;
    cursor = 0;
  }

  this.resetCursor = function()
  {
    cursor = 0;
  }

  this.exportLog = function()
  {
    var threads = runtimes.getThreads(), thread = null, key = '', i = 0, j = 0;
    var log = '';
    for( ; thread = threads[i]; i++)
    {
      for( j = 0; key = propsKey[j]; j++)
      {
        log += propsMap[key](thread[key]);
      }
      log += NL;
    }
    export_data.data = log;
    topCell.showView('export_data');
    //window.open('data:text/plain;charset=utf-8,'+encodeURIComponent(log));
  }





  this.init(id, name, container_class);
}

cls.ThreadsView.create_ui_widgets = function()
{

  new Settings
  (
    // id
    'threads', 
    // key-value map
    {
      'log-threads': false
    }, 
    // key-label map
    {
      'log-threads': ui_strings.S_BUTTON_LABEL_LOG_THREADS
    },
    // settings map
    {
      checkboxes:
      [
        'log-threads'
      ]
    }
  );

  new ToolbarConfig
  (
    'threads',
    [
      {
        handler: 'threads-clear-log',
        title: ui_strings.S_BUTTON_LABEL_CLEAR_LOG
      },
      {
        handler: 'threads-export-log',
        title: ui_strings.S_BUTTON_LABEL_EXPORT_LOG
      }
    ]
  );

  // button handlers
  eventHandlers.click['threads-clear-log'] = function(event, target, container)
  {
    runtimes.clearThreadLog();
    views.threads.resetCursor();
    if( container && container.firstChild )
    {
      container.firstChild.innerHTML = '';
    }
    
  }

  eventHandlers.click['threads-export-log'] = function(event, target, container)
  {
    views.threads.exportLog();
  }

}

