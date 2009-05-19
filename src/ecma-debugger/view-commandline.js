var cls = window.cls || ( window.cls = {} );

/**
  * @constructor 
  * @extends ViewBase
  */

cls.CommandLineView = function(id, name, container_class, html, default_handler)
{

  var self = this;

  var __frame_index = -1;

  var __container = null;
  var __console_output = null;
  var __console_input = null;
  var __prefix = null;
  var __textarea = null;
  var __textarea_value = '';

  var submit_buffer = [];
  var line_buffer = [];
  var line_buffer_cursor = 0;

  var __selection_start = -1;

  var console_output_data = [];

  var toolbar_visibility = true;

  var cons_out_render_return_val = function(entry)
  {
    if( __console_output )
    {
      __console_output.render
      (
        ['pre', entry.value ].concat
        ( 
          entry.obj_id 
          ? [
              'handler', 'inspect-object-link', 
              'rt-id', entry.runtime_id, 
              'obj-id', entry.obj_id
            ] 
          : [] 
        )
      );
    }
  }

  var cons_out_render_input = function(entry)
  {
    if( __console_output )
    {
      __console_output.render(['div', entry.value, 'class', 'log-entry']);
    }
  }

  var type_map =
  {
    "return-value": cons_out_render_return_val,
    "input-value": cons_out_render_input
  }

  var cons_out_update = function()
  {
    if( __console_output )
    {
      __console_output.innerHTML = '';
      var entry = null, i = 0;
      for( ; entry = console_output_data[i]; i++ )
      {
        type_map[entry.type](entry);
      }
      __container.scrollTop = __container.scrollHeight;
    };
    if( __textarea )
    {
      __textarea.value = __textarea_value;
      __textarea.selectionEnd = __textarea.selectionStart = __textarea_value.length;
      __textarea.focus();
    };
  }

  var handleEval = function(xml, runtime_id, obj_id, callback)
  {
    var value_type = xml.getNodeData('data-type');
    var status = xml.getNodeData('status');
    if( status == 'completed' )
    {
      var return_value = xml.getElementsByTagName('string')[0];
      if(return_value || /null|undefined/.test(value_type) )
      {
        var value = return_value && return_value.firstChild && 
                          return_value.firstChild.nodeValue || ''; 
        if( !obj_id )
        {
          switch (value_type)
          {
            case 'string':
            {
              value = '"' + value + '"';
              break;
            }
            case 'null':
            case 'undefined':
            {
              value = value_type;
              break;
            }
          }
        }
        if(callback)
        {
          callback(runtime_id, obj_id);
        }
        cons_out_render_return_val
        (
          console_output_data[console_output_data.length] =
          {
            type: "return-value",
            obj_id: obj_id,
            runtime_id: runtime_id,
            value: value
          }
        );
        __container.scrollTop = __container.scrollHeight;
      }
      else if (return_value = xml.getElementsByTagName('object-id')[0])
      {
        var object_id = return_value.textContent;
        var object_ref_name = "$" + object_id;
        var tag = tagManager.setCB(null, handleEval, [runtime_id, object_id, callback] );
        var script_string  = "return " + object_ref_name + ".toString()";
        services['ecmascript-debugger'].eval(
          tag, runtime_id, '', '', script_string, [object_ref_name, object_id]);
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
      cons_out_render_return_val
      (
        console_output_data[console_output_data.length] =
        {
          type: "return-value",
          value: return_value.firstChild.nodeValue
        }
      );
      __container.scrollTop = __container.scrollHeight;
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

  var dir_obj = function(rt_id, obj_id)
  {
    messages.post('active-inspection-type', {inspection_type: 'object'});
    // if that works it should be just inspection
    topCell.showView(views.inspection.id);
    messages.post('object-selected', {rt_id: rt_id, obj_id: obj_id});
  }

  var command_map =
  {
    "clear": function(rt_id, frame_id, thread_id, script_string)
    {
      console_output_data = [];
      cons_out_update();
    },
    "dir": function(rt_id, frame_id, thread_id, script_string)
    {
      var tag = tagManager.setCB(null, handleEval, [rt_id, null, dir_obj] );
      services['ecmascript-debugger'].eval(tag, rt_id, thread_id, frame_id, script_string);
    }
  };

  var submit = function(input)
  {
    var 
    rt_id = runtimes.getSelectedRuntimeId(),
    frame_id = '', 
    thread_id = '',
    script_string  = '',
    command = '',
    opening_brace = 0,
    closing_brace = 0,
    tag = 0;

    if(rt_id)
    {
      if( __frame_index > -1 )
      {
        frame_id = __frame_index;
        thread_id = stop_at.getThreadId();
      }
      script_string  = submit_buffer.join('');
      opening_brace = script_string.indexOf('(');
      command = ( opening_brace != -1 && script_string.slice(0, opening_brace) || '' ).
        replace(/ +$/, '').replace(/^ +/, '');
      closing_brace = script_string.lastIndexOf(')');
      if ( command && command in command_map && closing_brace != -1 )
      {
        command_map[command](rt_id, frame_id, thread_id, script_string.slice(opening_brace + 1, closing_brace));
      }
      else if( !/^\s*$/.test(script_string) )
      {
        tag = tagManager.setCB(null, handleEval, [rt_id] );
        services['ecmascript-debugger'].eval(tag, rt_id, thread_id, frame_id, script_string);
      }
      submit_buffer = [];
    }
    else
    {
      alert(ui_strings.S_INFO_NO_RUNTIME_SELECTED);
    }
  }



  var line_buffer_push = function(line)
  {
    line = line.replace(/\r\n/g, "");
    var index = line_buffer.indexOf(line);
    if(index != -1)
    {
      line_buffer.splice(index, 1);
    }
    line_buffer[line_buffer.length] = line;
    if( line_buffer.length > 100 )
    {
      line_buffer = line_buffer.slice(line_buffer.length - 100);
    }
    line_buffer_cursor = line_buffer.length;
  }

  eventHandlers.keyup['commandline'] = function(event)
  {
    /*
      TODO use the Keyhandler Classes
    */  
    if(event.keyCode == 38 || event.keyCode == 40)
    {
      event.preventDefault();
      return;
    }
    const CRLF = "\r\n";
    var value = event.target.value;
    var lastCRLFIndex = value.lastIndexOf(CRLF);
    if(lastCRLFIndex != -1)
    {
      if ( value.length - 2 != lastCRLFIndex )
      {
        value = value.slice(0, lastCRLFIndex) + value.slice(lastCRLFIndex + 2) + CRLF;
      }
      cons_out_render_input
      (
        console_output_data[console_output_data.length] =
        {
          type: "input-value",
          value: ( submit_buffer.length ? "... " : ">>> " ) + value
        }
      );
      line_buffer_push( submit_buffer[submit_buffer.length] = value );
      if(!event.shiftKey)
      {
        submit();
      }
      __prefix.textContent = submit_buffer.length ? "... " : ">>> ";
      event.target.value = '';
      __container.scrollTop = __container.scrollHeight;
      __textarea.scrollTop = 0;
    }
    __textarea_value = event.target.value;

  }

  
  eventHandlers.keypress['commandline'] = function(event)
  {
    /*
      TODO use the Keyhandler Classes
    */  
    var target = event.target, key_code = event.keyCode;
    if( !(event.shiftKey || event.ctrlKey || event.altKey ) )
    {
      switch(key_code)
      {
        case 38:
        case 40:
        {
          line_buffer_cursor += key_code == 38 ? -1 : 1;
          line_buffer_cursor = 
            line_buffer_cursor < 0 ? line_buffer.length-1 : line_buffer_cursor > line_buffer.length-1 ? 0 : line_buffer_cursor;
          __textarea_value = event.target.value = (line_buffer.length ? line_buffer[line_buffer_cursor] : '').replace(/\r\n/g, ''); 
          event.preventDefault();
          break;
        }
        case 16:
        case 9:
        {
          break;
        }
        default:
        {
          __selection_start = -1;
        }
      }
    }
    if(key_code == 9)
    {
      event.preventDefault();
      if( __selection_start == -1 )
      {
        __selection_start = target.selectionStart;
      }
      var cur_str = target.value.slice(0, __selection_start);
      var suggest = autocomplete.getSuggest(cur_str, event.shiftKey, arguments);
      if( suggest )
      {
        target.value = cur_str + suggest;
      }
    }
  }

  var autocomplete = new function()
  {
    var str_input = '';
    var path = '';
    var id = '';
    var scope = null;
    var current_path = '';
    var match = [];
    var match_cur = 0;
    var local_frame_index = 0;
    var _shift_key = false;
   
    
    const 
    SCRIPT = "(function(){var a = '', b= ''; for( a in %s ){ b += a + '_,_'; }; return b; })()",
    KEY = 0,
    DEPTH = 3;

    var get_scope = function(path, old_args)
    {
      var 
      rt_id = runtimes.getSelectedRuntimeId(),
      frame_id = '', 
      thread_id = '';

      if(rt_id)
      {
        if( !path && __frame_index == -1 )
        {
          path = 'this';
        }
        if( __frame_index.toString() + rt_id + path == current_path )
        {
          return scope;
        }
        if( __frame_index > -1 )
        {
          frame_id = __frame_index;
          thread_id = stop_at.getThreadId();
          if( !path )
          {
            var selectedObject = frame_inspection_data.getSelectedObject()
            var data = frame_inspection_data.getData(selectedObject.rt_id, selectedObject.obj_id, -1, arguments);
            if( data )
            {
              var i = 2, prop = null;
              scope = [];
              for( ; prop = data[i]; i++ )
              {
                if( prop[DEPTH] == 0 )
                {
                  scope[scope.length] = prop[KEY];
                }
              }
              current_path = __frame_index.toString() + rt_id + path;
              return scope;
            }
            else
            {
              return null;
            }
          }
        }
        var tag = tagManager.setCB(null, handleEvalScope, [__frame_index, rt_id, path, old_args] );
        services['ecmascript-debugger'].eval(tag, rt_id, thread_id, 
          frame_id, SCRIPT.replace(/%s/, path));
      }
      else
      {
        alert('select a window');
      }
      return null;
    }

    var handleEvalScope = function(xml, __frame_index, rt_id, path, old_args)
    {
      var status = xml.getNodeData('status');
      if( status == 'completed' )
      {
        var return_value = xml.getElementsByTagName('string')[0];
        if(return_value)
        {
          scope = return_value.textContent.split('_,_');
          current_path = __frame_index.toString() + rt_id + path;
          if( !old_args[0].__call_count )
          {
            old_args[0].__call_count = 1;
            old_args.callee.call(null, old_args[0]);
          }
        }
      }
      else
      {
        str_input = current_path = '';
        opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
          "getting scope failed in autocomplete view-commandline");
      }
    }

    this._move_match_cursor = function(shift_key, delta)
    {
      if(shift_key)
      {
        match_cur -= delta || 1;
        if( match_cur < 0 )
        {
          match_cur = match.length ? match.length - 1 : 0;
        }
      }
      else
      {
        match_cur += delta || 1;
        if( match_cur >= match.length )
        {
          match_cur = 0;
        }
      }
      return shift_key;
    }

    this.getSuggest = function(str, shift_key, old_args)
    {
      if( match.length && shift_key != _shift_key )
      {
        _shift_key = this._move_match_cursor(shift_key, 2);
      }
      if( !str || str != str_input )
      {
        var last_bracket = str.lastIndexOf('['), last_brace = str.lastIndexOf('(');
        last_brace = str.lastIndexOf(')') <= last_brace ? last_brace : -1;
        last_bracket = str.lastIndexOf(']') <= last_bracket ? last_bracket : -1;
        str = str.slice( Math.max(
                  last_brace, 
                  last_bracket, 
                  str.lastIndexOf('=') ) + 1 
                ).replace(/^ +/, '').replace(/ $/, '');

        var         
        last_dot = str.lastIndexOf('.'), 
        new_path = '', 
        new_id = '',
        ret = '';

        if(last_dot > -1)
        {
          new_path = str.slice(0, last_dot);
          new_id = str.slice(last_dot + 1);
        }
        else
        {
          new_id = str;
        }
        if( path != new_path || !scope )
        {
          match = [];
          if( !( scope = get_scope(new_path, old_args) ) )
          {
            return '';
          }
          path = new_path;
        }
        if( !match.length || id != new_id )
        {
          match = [];
          match_cur = 0;
          var prop = '', i = 0;
          for( ; prop = scope[i]; i++)
          {
            if( prop.indexOf(new_id) == 0 )
            {
              match[match.length] = prop;
            }
          }
          id = new_id;
        }
        str_input = str;

      }
      ret = match[match_cur] || '';
      this._move_match_cursor(shift_key);
      return  ret.slice(id.length);
    }

    this.clear = function(frame_index)
    {
      // it could be that this check is too simple
      // basically the global scope is invalided with a new thread
      // but the tab completion feature is not very helpfull 
      // with sites with intervals or timeouts
      if( frame_index > -1 || frame_index != local_frame_index )
      {
        local_frame_index = -1;
        str_input = '';
        path = '';
        id = '';
        scope = null;
        current_path = '';
        match = [];
        match_cur = 0;
      }
    };


  };

  this.createView = function(container)
  {
    checkToolbarVisibility();
    container.innerHTML = markup;
    container.scrollTop = container.scrollHeight;
    __container = container;
    __console_output = container.getElementsByTagName('div')[1];
    __console_input = container.getElementsByTagName('div')[2];
    __prefix = __console_input.getElementsByTagName('span')[0];
    __textarea = container.getElementsByTagName('textarea')[0];
    cons_out_update();
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
    autocomplete.clear(__frame_index);
  }

  var onConsoleMessage = function(msg)
  {
    if( settings['command_line'].get('show-ecma-errors') && msg['source'] == 'ecmascript')
    {
      cons_out_render_return_val
      (
        console_output_data[console_output_data.length] =
        {
          type: "return-value",
          value: msg['context'] + '\n' + msg['description']
        }
      );
    }
  }

  var checkToolbarVisibility = function(msg)
  { 
    var isMultiRuntime = host_tabs.isMultiRuntime();
    if( toolbar_visibility != isMultiRuntime )
    {
      topCell.setTooolbarVisibility('command_line', toolbar_visibility = isMultiRuntime );
    }
  }

  messages.addListener('frame-selected', onFrameSelected);
  messages.addListener('console-message', onConsoleMessage);
  messages.addListener('active-tab', checkToolbarVisibility);

  this.init(id, name, container_class, html, default_handler);

}

cls.CommandLineView.prototype = ViewBase;
new cls.CommandLineView('command_line', ui_strings.M_VIEW_LABEL_COMMAND_LINE, 'scroll', '', 'cmd-focus');

new Settings
(
  // id
  'command_line', 
  // key-value map
  {
    "show-ecma-errors": true,
  }, 
  // key-label map
  {
    "show-ecma-errors": ui_strings.S_SWITCH_SHOW_ECMA_ERRORS_IN_COMMAND_LINE
  },
  // settings map
  {
    checkboxes:
    [
      "show-ecma-errors"
    ]
  }
);

eventHandlers.click['cmd-focus'] = function(event, target)
{
  target.getElementsByTagName('textarea')[0].focus();
}


cls.CndRtSelect = function(id, class_name)
{

  var selected_value = "";

  this.getSelectedOptionText = function()
  {
    var selected_rt_id = runtimes.getSelectedRuntimeId();
    if( selected_rt_id )
    {
      var rt = runtimes.getRuntime(selected_rt_id);
      if( rt )
      {
        return rt['title'] || helpers.shortenURI(rt['uri']).uri; 
      }
    }
    return '';
  }

  this.getSelectedOptionValue = function()
  {

  }

  this.templateOptionList = function(select_obj)
  {
    // TODO this is a relict of protocol 3, needs cleanup
    
    var active_window_id = runtimes.getActiveWindowId();

    if( active_window_id )
    {
      var 
      _runtimes = runtimes.getRuntimes(active_window_id),
      rt = null, 
      i = 0;

      for( ; ( rt = _runtimes[i] ) && !rt['selected']; i++);
      if( !rt && _runtimes[0] )
      {
        opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 'no runtime selected')
        return;
      }
      return templates.runtimes(_runtimes, 'runtime');
    }
    
  }

  this.checkChange = function(target_ele)
  {
    var rt_id = target_ele.getAttribute('rt-id');
    if( rt_id && rt_id != runtimes.getSelectedRuntimeId() )
    {
      runtimes.setSelectedRuntimeId(rt_id)
    }
    return true;
  }

  this.init(id, class_name);
}

cls.CndRtSelect.prototype = new CstSelect();

new cls.CndRtSelect('cmd-runtime-select', 'cmd-line-runtimes');

new ToolbarConfig
(
  'command_line',
  null,
  null,
  null,
  [
    {
      handler: 'select-window',
      title: ui_strings.S_BUTTON_LABEL_SELECT_WINDOW,
      type: 'dropdown',
      class: 'window-select-dropdown',
      template: window['cst-selects']['cmd-runtime-select'].getTemplate()
    }
  ]
);

