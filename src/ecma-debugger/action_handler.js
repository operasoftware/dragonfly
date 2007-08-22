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
      views.scope.clear();
      var tag = tagManager.setCB(null, responseHandlers.examinFrame, [runtime_id, views.scope.get(), frame.argument_id]);
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
    var ele = event.target.parentNode, list = null;
    if( list = ele.getElementsByTagName('ul')[0] )
    {
      ele.removeChild(list);
      event.target.style.removeProperty('background-position');
    }
    else
    {
      var runtime_id = ele.getAttribute('runtime-id');
      var tag = tagManager.setCB(null, responseHandlers.examinObject, [runtime_id, ele]);
      helpers.examine_objects( runtime_id, tag, ele.getAttribute('object-id') );
      event.target.style.backgroundPosition = '0 -11px';
    }
  }

  handlers['show-scripts'] = function(event)
  {
    var scripts = runtimes.getScripts(event.target.getAttribute('runtime_id'));
    var scripts_container = document.getElementById('scripts');
    scripts_container.innerHTML = '';
    var script = null, i=0;
    for( ; script = scripts[i]; i++)
    {
      scripts_container.render(templates.scriptLink(script));
    }
    helpers.setSelected(event);
  }

  handlers['continue'] = function(event)
  {
    views.js_source.clearView();
    views.callstack.clearView();
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