var action_handler = new function()
{
  var handler = function(event)
  {
    
    var handler = event.target.getAttribute('handler');
    if(handler && handlers[handler])
    {
      handlers[handler](event);
    }
  }

  var handlers = {};
  /*
"<examine-objects>" 
  "<tag>" UNSIGNED "</tag>"
  "<runtime-id>" UNSIGNED "</runtime-id>" 
  "<object-id>" UNSIGNED "</object-id>"*
"</examine-objects>"

  {
    var msg = "<runtimes>";
    var tag = tagManager.setCB(this, parseRuntime);
    msg += "<tag>" + tag +"</tag>";
    var i=0, r_t=0;
    for ( ; r_t = arguments[i]; i++)
    {
      msg += "<runtime-id>" + r_t +"</runtime-id>";
    }
    msg += "</runtimes>";
    proxy.POST("/" + service, msg);
  }

  <LI 
  handler="show-frame" 
  runtime_id="1" 
  argument_id="0" 
  scope_id="0" 
  line="3" 
  script_id="1">anonymous line 3 script id 1</LI>

  */

  handlers['show-frame'] = function(event)
  {
    var frame = stop_at.getFrame(event.target['ref-id']);
    // is this schabernack? each frame can be in a different runtime
    var runtime_id = stop_at.getRuntimeId();
    if(frame)
    {
      views.frame_inspection.clearView();
      var tag = tagManager.setCB(
        null, 
        responseHandlers.examinFrame, 
        [runtime_id, frame.argument_id]
        );
      helpers.examine_objects( runtime_id, tag, frame.scope_id );
      if( event.type == 'click' )
      {
        helpers.setSelected(event);
        if( frame.script_id )
        {
          views.js_source.showLine( frame.script_id, frame.line - 10 );
          views.js_source.showLinePointer( frame.line, frame.id == 0 );
        }
        else
        {
          views.js_source.clearView();
        }
      }
    }
    else
    {
      opera.postError("missing frame in 'show-frame' handler");
    }

    
  }

  handlers['examine-object'] = function(event)
  {
    var ele = event.target.parentNode, 
      list = null, 
      path_arr = [], 
      cur = ele, 
      par = cur;
    do
    {
      cur = par;
      path_arr.unshift( parseInt( cur.getAttribute( 'ref_index' ) ) );
    }
    while ( ( par = cur.parentElement ) && ( par = par.parentElement ) && par.id != 'examine-objects' );
    var obj = frame_inspection.getObject(path_arr);
    //alert(path_arr +' '+obj);
    if( !obj )
    {
      opera.postError("Error in action_handler handlers['examine-object']");
    }
    if(obj.items.length)
    {
      obj.items = []; // that should be done in frame_inspection
      views.frame_inspection.clearView(path_arr);
      event.target.style.removeProperty('background-position');
    }
    else
    {
      var runtime_id = frame_inspection.getRuntimeId();
      var tag = tagManager.setCB(null, responseHandlers.examinObject, [runtime_id, path_arr]);
      helpers.examine_objects( runtime_id, tag, obj.value );
      event.target.style.backgroundPosition = '0 -11px';
    }
  }

  handlers['show-global-scope'] = function(event)
  {
    var ele = event.target;
    var runtime = runtimes.getRuntimeIdWithURL(ele.childNodes[1].nodeValue);
    if( runtime )
    {
      alert(runtime['runtime-id'] +' '+runtime['object-id'] )
      views.frame_inspection.clearView();
      var tag = tagManager.setCB(null, responseHandlers.examinObject, [ runtime['runtime-id'] ]);
      helpers.examine_objects( runtime['runtime-id'], tag, runtime['object-id'] );
    }
  }

  handlers['show-scripts'] = function(event)
  {
    var runtime_id = event.target.getAttribute('runtime_id');
    var scripts = runtimes.getScripts(runtime_id);
    var scripts_container = event.target.parentNode.getElementsByTagName('ul')[0];
    var script = null, i=0;
    if(scripts_container)
    {
      event.target.parentNode.removeChild(scripts_container);
      event.target.style.removeProperty('background-position');
      runtimes.setUnfolded(runtime_id, false);
    }
    else
    {
      scripts_container =['ul'];
      for( ; script = scripts[i]; i++)
      {
        scripts_container.push(templates.scriptLink(script));
      }
      event.target.parentNode.render(scripts_container);
      event.target.style.backgroundPosition = '0 -11px';
      runtimes.setUnfolded(runtime_id, true);
    }
  }

  handlers['display-script'] = function(event)
  {
    var id  = event.target.getAttribute('script-id');

    if(id)
    {
      views.js_source.showLine(id, 0);
      helpers.setSelected(event);
    }
    else
    {
      opera.postError("missing script id in handlers['display-script']")
    }
  }

  handlers['continue'] = function(event)
  {
    views.js_source.clearView();
    views.callstack.clearView();
    views.frame_inspection.clearView();
    stop_at.__continue(event.target.getAttribute('mode'));
  }

  handlers['set-stop-at'] = function(event)
  {
    stop_at.setUserStopAt(event.target.value, event.target.checked);
  }

  handlers['set-break-point'] = function(event)
  {
    var line = event.target.parentElement.children[0].value;
    var script_id = views.js_source.getCurrentScriptId();
    if( line )
    {
      if( runtimes.hasBreakpoint(script_id, line) )
      {
        runtimes.removeBreakpoint(script_id, line);
        views.js_source.removeBreakpoint(line);
      }
      else
      {
        runtimes.setBreakpoint(script_id, line);
        views.js_source.addBreakpoint(parseInt(line));
      }
    }
  }

  handlers['drop-down'] = function(event)
  {
    var ele = event.target;
    var drop_down = document.getElementById('drop-down-view');
    var type = ele.getAttribute('ref');
    if(drop_down)
    {
      //document.body.removeChild(drop_down.parentNode);
    }
    else
    {
      switch(type)
      {
        case 'runtimes':
        {
          if( windows.showWindow('runtimes', 'Runtimes', templates.runtimes_dropdown(ele)) )
          {
            views.runtimes.update();
          }
          break;
        }
        case 'console':
        {
          if( windows.showWindow('console', 'Console', ['div', 'class', 'window-container', 'id', 'console-view']) )
          {
            views.console.update();
          }
          break;
        }
        case 'environment':
        {
          if( windows.showWindow('environment', 'Environment', ['div', 'class', 'window-container', 'id', 'view-environment']) )
          {
            views.environment.update();
          }
          break;
        }
        case 'configuration':
        {
          if( windows.showWindow('configuration', 'Stop At', ['div', 'class', 'window-container', 'id', 'configuration']) )
          {
            views.configuration.update();
          }
          break;
        }
        case 'debug':
        {
          if( windows.showWindow
            (
              'debug', 
              'Debug', 
              ['div', 
                ['input', 
                  'type', 'button', 
                  'value', 'clear output', 
                  'onclick', 'debug.clear()'],
                ['pre', 'id', 'debug'],
              'class', 'window-container', 'id', 'debug-container']
            )
          )
          {
            window.debug.output();
          }
          break;
        }

        case 'command-line':
        {
          if( windows.showWindow
            (
              'command-line', 
              'Command Line', 
              ['div', 
                ['div',
                  ['input', 
                    'type', 'button', 
                    'value', 'eval', 
                    'onclick', "this.parentNode.parentNode.getElementsByTagName('textarea')[0].value='<eval>\\n  <tag>1</tag>\\n  <runtime-id></runtime-id>\\n  <thread-id></thread-id>\\n  <frame-id></frame-id>\\n  <script-data></script-data>\\n</eval>';"],
                  ['input', 
                    'type', 'button', 
                    'value', 'set breakpoint', 
                    'onclick', "this.parentNode.parentNode.getElementsByTagName('textarea')[0].value='<add-breakpoint>\\n  <breakpoint-id> x </breakpoint-id>\\n  <source-position>\\n    <script-id> x </script-id>\\n    <line-number> x </line-number>\\n  </source-position>\\n</add-breakpoint>';"],
                  ['input', 
                    'type', 'button', 
                    'value', 'examine obj', 
                    'onclick', "this.parentNode.parentNode.getElementsByTagName('textarea')[0].value='<examine-objects>\\n  <tag>1</tag>\\n  <runtime-id>x</runtime-id>\\n  <object-id>x</object-id>\\n</examine-objects>';"],
                  ['input', 
                    'type', 'button', 
                    'value', 'post', 
                    'style', 'margin-left:10px',
                    'onclick', 'debugger.postCommandline()'],
                'style', 'text-align: right'],
                ['div', ['textarea'], 'id', 'command-line-container'],
              'class', 'window-container', 'id', 'command-line']
            )
          )
          {
            window.debug.output();
          }
          break;
        }       
      }
    }

  }

  this.init = function()
  {
    document.addEventListener('click', handler, false);
  }

  this.post = function(handler, event)
  {
    if(handlers[handler])
    {
      handlers[handler](event);
    }
  }
}
