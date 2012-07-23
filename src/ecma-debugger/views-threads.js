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

  this.createView = function(container)
  {
    var threads = runtimes.getThreads();
    if (!__container || !container.firstChild)
    {
      container.innerHTML = '';
      __container = container.render(['div', ['pre'], 'class', 'padding']).firstElementChild;
    }
    __container.textContent += threads.slice(cursor).join('\n') + '\n';
    cursor = threads.length;
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
    },
    null,
    "script"
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

