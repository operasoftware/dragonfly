window.cls || (window.cls = {});
cls.debug || (cls.debug = {});

cls.debug.TestScopeMessages = function(id, name, container_class)
{
  /* interface */
  this.createView = function(container){};


  /* private */

  var self = this;

  this.show_in_views_menu = true;

  this._template_debug_context = function(win)
  {
    return (
    ['li',
      win ?
      ['pre',
        'window id: ' + win.window_id + '\n' +
        'title: ' + win.title + '\n'+
        'window type: ' + win.window_type + '\n' +
        'opener id: ' + win.opener_id
      ]:
      []
    ]);
  }

  this._template_runtime = function(rt_id)
  {
    var rt = window.runtimes.getRuntime(rt_id);
    return (
    ['li',
      rt ?
      ['pre',
        'runtimeID: ' + rt.runtime_id + '\n' + 
        'htmlFramePath: ' + rt.html_frame_path + '\n' +
        'windowID: ' + rt.window_id + '\n' +
        'objectID: ' + rt.object_id + '\n' +
        'uri: ' + rt.uri
      ] :
      []
    ]);
  }

  this._main_template = function()
  {
    var services = [], service = null;
    var debug_context = window.window_manager_data.get_debug_context();
    var win = window.window_manager_data.get_window(debug_context);
    var rts = window.runtimes.getRuntimeIdsFromWindow(debug_context);


    for(service in window.services)
    {
      if(window.services[service].is_implemented)
      {
        services.push(window.helpers.service_class_name(service));
      }
    }
    return (
    ['div',
      ['div',
        ['div',
          ['h2', 'Debug Context'],
          ['ul', 
            ( win ? this._template_debug_context(win) : []),
            'id', 'test-messages-debug-context'
          ],
        ],
        ['div',
          ['h2', 'Runtime List'],
          ['ul',
            (rts && rts.length ? rts.map(this._template_runtime) : []),
            'id', 'test-messages-runtime-list',
          ]
        ],
        'class', 'column',
      ],
      ['div',
        ['div',
          ['h2', 'Service List'],
          ['ul',
            services.map(function(service){return ['li', service]}),
            'id', 'service-list'
          ],
          'id', 'services'
        ],
        ['div',
          ['h2', 'Command List'],
          ['ul',
            'id', 'command-list'
          ],
          'id', 'command-list-container'
        ],
        ['div',
          ['h2', 'Event List'],
          ['ul',
            'id', 'event-list'
          ],
          'id', 'event-list-container'
        ],
        'class', 'column',
      ],
      ['div',
        ['div',
          'id', 'message-container'
        ],
      'class', 'column',
      ],
    'class', 'padding',
    'handler', 'test-messages']);
  }

  /* implementation */
  this.createView = function(container)
  {
    container.clearAndRender(this._main_template());
    this._rebuild_last_state();
  }

  this._on_active_tab = function(msg)
  {
    var container = document.getElementById('test-messages-debug-context');
    if(container)
    {
      var debug_context = window.window_manager_data.get_debug_context();
      var win = window.window_manager_data.get_window(debug_context);
      var rts = window.runtimes.getRuntimeIdsFromWindow(debug_context);
      container.clearAndRender(this._template_debug_context(win));
      document.getElementById('test-messages-runtime-list').clearAndRender(rts.map(this._template_runtime));
    }
  }

  this._on_active_tab_bound = (function(obj){
    return function(msg)
    {
      obj._on_active_tab(msg);
    }
  })(this);

  messages.addListener('active-tab', this._on_active_tab_bound);

  /* initialisation */
  this.init(id, name, container_class);
}



