helpers = new function()
{
  var self = this;

  var __current_script_id = 0;

  var __stop_at_id = 0;

  this.formatScript = function(data)
  {
    /* *
    var ret = '<ol>';
    var lines = data.split('\n'), length = lines.length, line='', i=0;
    for( ; i<length; i++)
    {
      line = lines[i].replace(/</g, '&lt');
      if (!line.length) line ='\u00A0';
      ret += "<li line='" + i + "'><span>"+line+"</span></li>";
    }
    ret +="</ol>";
    return ret;
    /* */

    return simple_js_parser.parse(data);

  }

  this.showLine = function(scriptId, line)
  {
    //opera.postError(scriptId+' '+line);
    var s_c = document.getElementById('source-view'), script = null;
    if( scriptId == __current_script_id )
    {

    }
    else
    {
      script = debugger.getScript(scriptId);
      if(script)
      {
        __current_script_id = scriptId;
        s_c.setAttribute('script-id', scriptId);
        s_c.innerHTML = self.formatScript(script['script-data']);
      }
      else
      {
        opera.postError( "Script id not registered");
      }
    }
    var __line = s_c.getElementsByTagName('li')[line-1];
    var line_pointer = document.getElementById('line-pointer');
    if(__line)
    {
      if(line_pointer)
      {
        line_pointer.parentElement.removeChild(line_pointer);
      }
      line_pointer = s_c.firstChild.render
      (
        ['li', 
          'id', 'line-pointer', 
          'style', 'top:'+ __line.offsetTop +'px'
        ]
      );
      // line_pointer.style.top = __line.offsetTop + 'px';
      document.getElementById('source-view').scrollTop = __line.offsetTop - 100;

    }
    else
    {
      opera.postError( "the script has no according line "+line);
    }
  }

  this.displayBreakpoint = function(line, id)
  {
    var s_c = document.getElementById('source-view')
    var line = s_c.getElementsByTagName('li')[line-1];
    if(line)
    {
      s_c.firstChild.render
      (
        ['li',
          'class', 'breakpoint',
          'id', 'breakpoint-'+id,
          'style', 'top:'+ line.offsetTop +'px'
        ]
      )
    }
    else
    {
      opera.postError('missing line for breakpoint')
    }
  }

  this.removeBreakpoint = function(id)
  {
    var b_p = document.getElementById('breakpoint-'+id);
    if (b_p)
    {
      b_p.parentNode.removeChild(b_p);
    }
    else
    {
      opera.postError('there is no breakpoint with that id');
    }
  }



  var handleKeypress = function(event, id)
  {
    event.preventDefault();
    event.stopPropagation();
    var button = document.getElementById(id);
    if(button && !button.disabled)
    {
      button.click();
    }
  }


  var keypressListener = function(event)
  {
    if( event.which == 0 )
    {
      switch(event.keyCode)
      {
        case 116: // F5
        {
          handleKeypress(event, 'continue-run');
          break;
        }
        case 121: // F10
        {
          handleKeypress(event, 'continue-step-over-call');
          break;
        }
        case 122: // F11
        {
          if(event.shiftKey)
          {
            handleKeypress(event, 'continue-finish-call');
          }
          else
          {
            handleKeypress(event, 'continue-step-into-call');
          }
          break;
        }
      }
    }
  }

  this.setSelected = function(event)
  {
    var ele=event.target;
    var siblings = ele.parentNode.getElementsByTagName(ele.nodeName), sibling = null, i=0;
    for( ; sibling = siblings[i]; i++)
    {
      if(sibling == ele) 
      {
        sibling.addClass('selected'); 
      }
      else
      {
        sibling.removeClass('selected'); 
      }
    }
  }

  this.setUpListeners = function()
  {
    document.addEventListener('keypress', keypressListener, true);
    document.getElementById('source-view').addEventListener('click', handlers.breakpoint, false);
  }

  this.examine_objects = function() // runtime_id, tag, object_1, ...
  {
    var msg = "<examine-objects>", i = 2;
    msg += "<tag>" + arguments[1] +"</tag>";
    msg += "<runtime-id>" + arguments[0] +"</runtime-id>";
    for( ; i < arguments.length; i++)
    {
      msg += "<object-id>" + arguments[i] +"</object-id>";
    }
    msg += "</examine-objects>";
    proxy.POST("/" + "ecmascript-debugger", msg);
  }


}