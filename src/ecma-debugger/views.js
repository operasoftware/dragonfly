(function(){ window.views = window.views || {}; })();

(function()
{



  var View = function(id, name, container_class)
  {
    var self = this;

    this.createView = function(container)
    {
      container.innerHTML = '';
      container.render(templates.runtimes(runtimes.getRuntimes()));
    }
    this.init(id, name, container_class);
  }
  View.prototype = ViewBase;
  new View('runtimes', 'Runtimes', 'scroll runtimes');





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
      container.render(['div', ['div', 'id', container_id], 'id', 'examine-objects-container']); // TODO clean up
      this.updatePath(null);
    }

    this.updatePath = function( path_arr )
    {
      var container = getContainer( path_arr );
      if( container )
      {
        container.renderInner( templates.examineObject( frame_inspection.getObject( path_arr ).items ) );
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
    }

    this.init(id, name, container_class);

  }

  View.prototype = ViewBase;
  new View('frame_inspection', 'Frame Inspection', 'scroll');

  View = function(id, name, container_class)
  {
    /* a quick hack */


    /*      var tag = tagManager.setCB(
        null, 
        responseHandlers.examinFrame, 
        [runtime_id, frame.argument_id, frame.this_id]
        );
        <?xml version="1.0"?>
        <eval-reply>
        <tag>4</tag>
        <status>completed</status>
        <value-data>
        <data-type>string</data-type>
        <string>red</string>
        </value-data>
        </eval-reply>

 <?xml version="1.0"?>
 <eval-reply>
 <tag>6</tag>
 <status>completed</status>
 <value-data>
 <data-type>object</data-type>
 <object-id>285</object-id>
 </value-data>
 </eval-reply>

        */

    var self = this;

    var handleEval = function(xml)
    {
      var value_type = xml.getNodeData('data-type');
      var return_value = xml.getElementsByTagName('string')[0];
      if(return_value)
      {
        var out = document.getElementById('console-output');
        out.render(['pre', return_value.firstChild.nodeValue]);
      }
      
    }


    var markup = "\
      <div class='padding'>\
        <div id='console-output'></div>\
        <div id='console-input' handler='console-focus-input'>\
          <div>&gt;&gt;&gt;</div>\
          <textarea rows='1' handler='console-input'></textarea>\
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
        var tag = tagManager.setCB(null,handleEval);
        // this.eval = function(tag, runtime_id, thread_id, frame_id, script_data, name_id_pairs)
        services['ecmascript-debugger'].eval(tag, rt_id, '', '', input);
      }
      else
      {
        alert('select runtime');
      }
      //opera.postError('submitted: '+input);
    }

    var lines_count_old = -1;

    eventHandlers.input['console-input'] = function(event)
    {
      var lines = event.target.value.split(/\r?\n/);
      var lines_count = lines.length;
      if( lines_count != lines_count_old  )
      {
        var line_heads = '>>>';
        var i = 1;
        var is_ready = false;
        var input = '';
        for( ; i < lines_count; i++)
        {
          if(is_ready)
          {
            var console_entry = 
            {
              type: 'input', 
              category: 'Input', 
              timestamp: new Date().toString().replace(/GMT.*$/, ''),
              path: location.href,
              msg: ( input = lines.slice(0, lines_count - 1).join('\r\n') )
            };
            document.getElementById('console-output').render(templates.consoleInput(console_entry));
            event.target.value = '';
            line_heads = '>>>'
            lines_count = 1;
            submit(input);
            break;
          }
          if( lines[i] )
          {
            line_heads += '\n...';
          }
          else
          {
            is_ready = true;
            line_heads += '\n<';
          }
        }
        event.target.parentElement.getElementsByTagName('div')[0].textContent= line_heads;
        event.target.setAttribute('rows', lines_count);
        var container = event.target.parentElement;
        while( !/container/.test(container.nodeName) && ( container = container.parentElement ) );
        if(container)
        {
          container.scrollTop = container.scrollHeight;
        }
        if( lines[lines_count-1] )
        {
          lines_count_old = lines_count;
        };
      }
    }

    this.createView = function(container)
    {
      lines_count_old = -1;
      container.innerHTML = markup;
    }

    this.init(id, name, container_class);

  }

  View.prototype = ViewBase;
  new View('command_line', 'Command Line', 'scroll');

})()


