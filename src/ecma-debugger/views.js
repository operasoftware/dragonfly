(function()
{



  var View = function(id, name, container_class)
  {
    var self = this;

    this.createView = function(container)
    {
      container.innerHTML = '';
      //container.render(templates.runtimes(runtimes.getRuntimes()));
      container.render(templates.windows(runtimes.getWindows(), 'script'));
    }
    this.init(id, name, container_class);
  }
  View.prototype = ViewBase;
  new View('runtimes', 'Runtimes Script', 'scroll runtimes');


  View = function(id, name, container_class)
  {
    var self = this;

    this.createView = function(container)
    {
      container.innerHTML = '';
      container.render(templates.windows(runtimes.getWindows(), 'dom'));
    }

    this.updateSelectedRuntime = function(rt_id)
    {
      var containers = this.getAllContainers(), c = null , i = 0;
      var lis = null, li = null , k = 0;
      for( ; c = containers[i]; i++)
      {
        lis = c.getElementsByTagName('li');
        for( k = 0; li = lis[k]; k++ )
        {
          if( li.hasAttribute('runtime_id') )
          {
            if( li.getAttribute('runtime_id') == rt_id)
            {
              li.firstChild.addClass('selected-runtime');
              helpers.setSelected({target: li.parentNode.parentNode});
            }
            else
            {
              li.firstChild.removeClass('selected-runtime');
            }
          }
        }
      }
    }
    
    var onRuntimeSelected = function(msg)
    {
      if(self.isvisible())
      {
        self.updateSelectedRuntime(msg.id);
      }
      
    }

    this.init(id, name, container_class);
    
    messages.addListener('runtime-selected', onRuntimeSelected);

    var onViewCreated = function(msg)
    {
      if( msg.id == 'dom' )
      {
        topCell.showView(id);
      }
    }
    messages.addListener('view-created', onViewCreated);

    
  }
  View.prototype = ViewBase;
  new View('runtimes_dom', 'Runtimes DOM', 'scroll runtimes');
  
  View = function(id, name, container_class)
  {
    var self = this;

    this.createView = function(container)
    {
      container.innerHTML = '';
      container.render(templates.windows(runtimes.getWindows(), 'css'));
    }

    this.updateSelectedRuntime = function(rt_id)
    {
      /*
      var containers = this.getAllContainers(), c = null , i = 0;
      var lis = null, li = null , k = 0;
      for( ; c = containers[i]; i++)
      {
        lis = c.getElementsByTagName('li');
        for( k = 0; li = lis[k]; k++ )
        {
          if( li.hasAttribute('runtime_id') )
          {
            if( li.getAttribute('runtime_id') == rt_id)
            {
              li.firstChild.addClass('selected-runtime');
              helpers.setSelected({target: li.parentNode.parentNode});
            }
            else
            {
              li.firstChild.removeClass('selected-runtime');
            }
          }
        }
      }
      */
    }
    
    var onRuntimeSelected = function(msg)
    {
      if(self.isvisible())
      {
        //self.updateSelectedRuntime(msg.id);
      }
      
    }

    var onViewCreated = function(msg)
    {
      if( msg.id == 'stylesheets' )
      {
        topCell.showView(id);
      }
    }
    messages.addListener('view-created', onViewCreated);

    this.init(id, name, container_class);
    
    messages.addListener('runtime-selected', onRuntimeSelected);
  }
  View.prototype = ViewBase;
  new View('runtimes_css', 'Runtimes CSS', 'scroll runtimes');



  View = function(id, name, container_class)
  {
    var self = this;
    this.createView = function(container)
    {
      container.innerHTML = '';
      container.render( templates.hello( services['ecmascript-debugger'].getEnvironment()) );
    }
    this.init(id, name, container_class);
  }
  View.prototype = ViewBase;
  new View('environment', 'Environment', 'scroll');





  View = function(id, name, container_class)
  {
    var container_id = 'backtrace';
    var __clear_timeout = 0;

    var __clearView = function()
    {
      var container = document.getElementById(container_id);
      if( container ) 
      {
        container.innerHTML = ''; 
        __clear_timeout = 0;
      }
    }

    this.createView = function(container)
    {
      var list = container.getElementsByTagName('ul')[0];
      if(!list)
      {
        container.innerHTML = "<div id='backtrace-container'><ul id='backtrace'></ul></div>"; // TODO clean up
        list = container.getElementsByTagName('ul')[0];
      }

      if( __clear_timeout )
      {
        __clear_timeout = clearTimeout( __clear_timeout );
      }
      var _frames = stop_at.getFrames(), frame = null, i = 0;
      list.innerHTML = '';
      for( ; frame = _frames[i]; i++)
      {
        list.render(templates.frame(frame, i == 0));
      }
      
    }

    this.clearView = function()
    {
      __clear_timeout = setTimeout( __clearView, 150 );
    }

    this.init(id, name, container_class);
  }

  View.prototype = ViewBase;
  new View('callstack', 'Callstack', 'scroll');





  View = function(id, name, container_class)
  {
    this.ishidden_in_menu = true;
    this.createView = function(container)
    {
    }
    this.init(id, name, container_class);
  }
  View.prototype = ViewBase;
  new View('general', 'General', '');

  new Settings
  (
    // id
    'general', 
    // key-value map
    {
      "show-views-menu": false
    }, 
    // key-label map
    {
      "show-views-menu": "show views menu"
    },
    // settings map
    {
      checkboxes:
      [
        "show-views-menu"
      ]
    }

  );
  
  View = function(id, name, container_class)
  {
    var __url = '';
    this.setURL = function(url)
    {
      __url = url;
    }
    this.createView = function(container)
    {
      if( __url )
      {
        container.render(['iframe',
                          'width', '100%', 'height', '100%',
                          'style', 'dispaly:block;border:none',
                          'src', __url])
      }

    }
    this.init(id, name, container_class);
  }

  View.prototype = ViewBase;

  new View('documentation', 'Documentation', '');
  
  View = function(id, name, container_class)
  {
    this.ishidden_in_menu = true;
    this.createView = function(container)
    {
      ;
    }
    this.init(id, name, container_class);
  }

  View.prototype = ViewBase;

  new View('debug_remote_setting', 'Debug remote', '');
  
  new Settings
  (
    // id
    'debug_remote_setting', 
    // key-value map
    {
      "debug-remote": false,
      "port": 7001
    }, 
    // key-label map
    {
      "debug-remote": "debug remote"
    },
    // settings map
    {
      checkboxes:
      [
        "debug-remote"
      ]
    },
    // template
    function(setting)
    {
      return [
        ['setting-composite',
          ['label',
            ['input',
              'type', 'checkbox',
              'checked', this.get('debug-remote'),
              'handler', 'toggle-remote-debug'
            ],
            this.label_map['debug-remote']
          ],
          ['label',
            'port: ',
            ['input',
              'type', 'number',
              'value', this.get('port'),
              'disabled', !this.get('debug-remote')
            ]
          ],
          ['input',
            'type', 'button',
            'value', 'apply',
            'handler', 'apply-remote-debugging'
          ]
        ]
      ];
    }
  );
  
  eventHandlers.change['toggle-remote-debug'] = function(event, target)
  {
    target.parentNode.nextSibling.childNodes[1].disabled = !event.target.checked;  
  }
  
  eventHandlers.click['apply-remote-debugging'] = function(event, target)
  {
    var is_debug_remote = target.parentNode.getElementsByTagName('input')[0].checked;
    var port = parseInt(target.parentNode.getElementsByTagName('input')[1].value);
    if( port )
    {
      settings.debug_remote_setting.set('debug-remote', is_debug_remote);
      settings.debug_remote_setting.set('port', port);  
      client.scopeSetupClient();
    }
  }

})()


