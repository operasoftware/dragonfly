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

    var self = this;
    var container_id = 'examine-objects';

    var getContainer = function(path_arr)
    {
      var container = document.getElementById(container_id);
      var prov = null, length = 0, i = 0;
      if( container )
      {
        if( path_arr )
        {
          length = path_arr.length
          for( ; i < length; i++ )
          {
            container = container.getElementsByTagName('ul')[0].childNodes[ path_arr[ i ] ];
            if( !container )
            {
              opera.postError('Error in views.frame_inspection.update');
              break;
            }
          }
        }
      }
      return container;
    }

    this.createView = function(container)
    {
      container.clearAndRender(['div', ['div', 'id', container_id], 'id', 'examine-objects-container']); // TODO clean up
      this.updatePath(null);
    }

    this.showGlobalScopeUpdateLink = function()
    {
      var containers = this.getAllContainers(), c = null , i = 0;
      var lis = null, li = null , k = 0;
      for( ; c = containers[i]; i++)
      {
       c.innerHTML = 
        "<div class='padding'><p handler='update-global-scope'>show global scope</p></div>";
      }
    }

    this.updatePath = function( path_arr )
    {
      var container = getContainer( path_arr );
      if( container )
      {
        var items = frame_inspection.getObject( path_arr ).items;
        if(items.length)
        {
          container.renderInner( templates.examineObject( items ) );
        }
        else
        {
          var input = container.getElementsByTagName('input')[0];
          if(input)
          {
            input.removeAttribute('handler');
            input.removeAttribute('style');
            input.disabled = true;
          }
        }
      }
    }

    this.clearView = function(path_arr) 
    {
      var container = getContainer( path_arr );
      if( container )
      {
        var ul = container.getElementsByTagName('ul')[0];
        if( ul )
        {
          container.removeChild( ul );
        }
      }
      else
      {
        var containers = this.getAllContainers(), c = null , i = 0;
        for( ; c = containers[i]; i++)
        {
         c.clearAndRender(['div', ['div', 'id', container_id], 'id', 'examine-objects-container']);  
        }
      }
    }

    this.init(id, name, container_class);

  }

  View.prototype = ViewBase;
  new View('frame_inspection', 'Frame Inspection', 'scroll');

  new Settings
  (
    // id
    'frame_inspection', 
    // key-value map
    {
      'automatic-update-global-scope': false
    }, 
    // key-label map
    {
      'automatic-update-global-scope': ' update global scope automatically'
    },
    // settings map
    {
      checkboxes:
      [
        'automatic-update-global-scope'
      ]
    }
  );

  View = function(id, name, container_class)
  {
    /* a quick hack */


    var self = this;

    var handleEval = function(xml, runtime_id)
    {
      var value_type = xml.getNodeData('data-type');
      var status = xml.getNodeData('status');
      if( status == 'completed' )
      {
        var return_value = xml.getElementsByTagName('string')[0];
        if(return_value)
        {
          var out = document.getElementById('console-output');
          out.render(['pre', return_value.firstChild.nodeValue]);
          var container = out.parentNode.parentNode;
          container.scrollTop = container.scrollHeight;
        }
        else if (return_value = xml.getElementsByTagName('object-id')[0])
        {
          var object_id = return_value.textContent;
          var object_ref_name = "$" + object_id;
          var tag = tagManager.setCB(null, handleEval, [runtime_id] );
          var script_string  = "return " + object_ref_name + ".toString()";
          services['ecmascript-debugger'].eval(
            tag, runtime_id, '', '', "<![CDATA["+script_string+"]]>", [object_ref_name, object_id]);
        }
      }
      else
      {
        var error_id = xml.getNodeData('object-id');
        if( error_id )
        {
          var tag = tagManager.setCB(null, handleError);
          services['ecmascript-debugger'].examineObjects(tag, runtime_id, error_id);
        }
      }
      
    }

    var handleError = function(xml)
    {
      var return_value = xml.getElementsByTagName('string')[0];
      if(return_value)
      {
        var out = document.getElementById('console-output');
        out.render(['pre', return_value.firstChild.nodeValue]);
        var container = out.parentNode.parentNode;
        container.scrollTop = container.scrollHeight;
      }
    }

    var markup = "\
      <div class='padding'>\
        <div id='console-output'></div>\
        <div id='console-input' handler='console-focus-input'>\
          <span id='commandline-prefix'>&gt;&gt;&gt; </span>\
          <div><textarea handler='commandline' rows='1' title='hold shift to add a new line'></textarea></div>\
        </div>\
      </div>";

    var templates = {};

    templates.consoleInput = function(entry)
    {
      var lines_count = entry.msg.split(/\r?\n/).length;
      var line_head = '>>>';
      while( --lines_count > 1 )
      {
        line_head += '\n...';
      }
      return [['div', line_head], ['pre', entry.msg]];
    }

    eventHandlers.click['console-focus-input'] = function(event, ele)
    {
      ele.getElementsByTagName('textarea')[0].focus();
    }

    var submit = function(input)
    {
      var rt_id = runtimes.getSelectedRuntimeId();
      if(rt_id)
      {
        var tag = tagManager.setCB(null, handleEval, [rt_id] );
        var script_string  = submit_buffer.join('');
        services['ecmascript-debugger'].eval(tag, rt_id, '', '', "<![CDATA["+script_string+"]]>");
        submit_buffer = [];
      }
      else
      {
        alert('select runtime');
      }
    }

    var submit_buffer = [];
    var line_buffer = [];
    var line_buffer_cursor = 0;

    var line_buffer_push = function(line)
    {
      line_buffer[line_buffer.length] = line.replace(/\r\n/g, "");
      if( line_buffer.length > 100 )
      {
        line_buffer = line_buffer.slice(line_buffer.length - 100);
      }
      line_buffer_cursor = line_buffer.length;
    }

    eventHandlers.keyup['commandline'] = function(event)
    {
      if(event.keyCode == 38 || event.keyCode == 40)
      {
        
        line_buffer_cursor += event.keyCode == 38 ? -1 : 1;
        line_buffer_cursor = 
          line_buffer_cursor < 0 ? line_buffer.length-1 : line_buffer_cursor > line_buffer.length-1 ? 0 : line_buffer_cursor;
        event.target.value = (line_buffer.length ? line_buffer[line_buffer_cursor] : '').replace(/\r\n/g, ''); 
        event.preventDefault();
        return;
      }
      const CRLF = "\r\n";
      var value = event.target.value;
      var lastCRLFIndex = value.lastIndexOf(CRLF);
      if(lastCRLFIndex != -1)
      {
        if ( value.length -2 != lastCRLFIndex )
        {
          value = value.slice(0, lastCRLFIndex) + value.slice(lastCRLFIndex + 2) + CRLF;
        }
        document.getElementById("console-output").render(
          ['div', ( submit_buffer.length ? "... " : ">>> " ) + value, 'class', 'log-entry']);
        line_buffer_push( submit_buffer[submit_buffer.length] = value );
        if(!event.shiftKey)
        {
          submit();
        }
        document.getElementById("commandline-prefix").textContent = submit_buffer.length ? "... " : ">>> ";
        event.target.value = '';
      }

    }

    this.createView = function(container)
    {
      container.innerHTML = markup;
      container.scrollTop = container.scrollHeight
    }

    this.init(id, name, container_class);

  }

  View.prototype = ViewBase;
  new View('command_line', 'Command Line', 'scroll');

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


