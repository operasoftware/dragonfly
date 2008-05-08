(function()
{
  View = function(id, name, container_class)
  {
    /* a quick hack */


    var self = this;

    var __frame_index = -1;

    var __console_output = null;
    var __console_input = null;
    var __prefix = null;

    var handleEval = function(xml, runtime_id)
    {
      var value_type = xml.getNodeData('data-type');
      var status = xml.getNodeData('status');
      if( status == 'completed' )
      {
        var return_value = xml.getElementsByTagName('string')[0];
        if(return_value)
        {
          __console_output.render(['pre', return_value.firstChild && return_value.firstChild.nodeValue || '']);
          var container = __console_output.parentNode.parentNode;
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
        __console_output.render(['pre', return_value.firstChild.nodeValue]);
        var container = __console_output.parentNode.parentNode;
        container.scrollTop = container.scrollHeight;
      }
    }

    var markup = "\
      <div class='padding'>\
        <div class='console-output'></div>\
        <div class='console-input' handler='console-focus-input'>\
          <span class='commandline-prefix'>&gt;&gt;&gt; </span>\
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
      var 
      rt_id = runtimes.getSelectedRuntimeId(),
      frame_id = '', 
      thread_id = '';

      if(rt_id)
      {
        if( __frame_index > -1 )
        {
          frame_id = __frame_index;
          thread_id = stop_at.getThreadId();
        }
        var tag = tagManager.setCB(null, handleEval, [rt_id] );
        var script_string  = submit_buffer.join('');
        services['ecmascript-debugger'].eval(tag, rt_id, thread_id, frame_id, "<![CDATA["+script_string+"]]>");
        submit_buffer = [];
      }
      else
      {
        alert('select a runtime');
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
        __console_output.render(
          ['div', ( submit_buffer.length ? "... " : ">>> " ) + value, 'class', 'log-entry']);
        line_buffer_push( submit_buffer[submit_buffer.length] = value );
        if(!event.shiftKey)
        {
          submit();
        }
        __prefix.textContent = submit_buffer.length ? "... " : ">>> ";
        event.target.value = '';
      }

    }

    this.createView = function(container)
    {
      container.innerHTML = markup;
      container.scrollTop = container.scrollHeight;
      __console_output = container.getElementsByTagName('div')[1];
      __console_input = container.getElementsByTagName('div')[2];
      __prefix = __console_input.getElementsByTagName('span')[0];
    }

    this.ondestroy = function()
    {
      __console_output = null;
      __console_input = null;
      __prefix = null;
    }

    var onFrameSelected = function(msg)
    {
      __frame_index = msg.frame_index;
    }

    messages.addListener('frame-selected', onFrameSelected);

    this.init(id, name, container_class);

  }

  View.prototype = ViewBase;
  new View('command_line', ui_strings.VIEW_LABEL_COMMAND_LINE, 'scroll');
})()