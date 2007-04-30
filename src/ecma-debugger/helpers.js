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
    opera.postError(scriptId+' '+line);
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
        s_c.innerHTML = self.formatScript(script['script-data']);
      }
      else
      {
        throw "Script id not registered";
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
      //line_pointer.style.top = __line.offsetTop +'px';
      document.getElementById('inspection-container').scrollTop = __line.offsetTop;

    }
    else
    {
      throw "the script has no according line "+line;
    }
  }

  this.disableContinues = function(stopAtId, bol)
  {
    __stop_at_id = stopAtId;
    var inputs = document.getElementById('continues').getElementsByTagName('input'),
        input = null, i=0;
    for( ; input = inputs[i]; i++)
    {
      input.disabled = bol;
      input.__stop_at_id = stopAtId;
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

  this.setUpListeners = function()
  {
    document.addEventListener('keypress', keypressListener, true);
  }

  var min_height_vertical_frame = 150;

  this.setUpVerticalFrames = function()
  {
    var children = document.body.childNodes, child = null, i = 0;
    var __frames = [];
    for( ; child = children[i]; i++)
    {
      
      if( child.nodeType == 1 && child.hasClass('frame-vertical'))
      {
        __frames[__frames.length] = child;
      }
    }
    var length = __frames.length;
    var win_height = window.innerHeight;
    var height = 0, styleHeight = 0;
    for(i=0; child = __frames[i]; i++)
    {
      if( i == length-1 )
      {
        child.style.height = (win_height-6)+'px';
      }
      else
      {
        height = child.offsetHeight;
        if (height<min_height_vertical_frame)
        {
          child.style.height = (min_height_vertical_frame-6)+'px';
          height = child.offsetHeight;
        }
        win_height -= height;
      }
    }
  }
}