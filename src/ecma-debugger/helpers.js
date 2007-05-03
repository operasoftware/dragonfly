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

  this.setUpListeners = function()
  {
    document.addEventListener('keypress', keypressListener, true);
    document.addEventListener('resize', self.verticalFrames.resizeListener, false);
  }

  this.verticalFrames = new function()
  {
    var self = this;
    var min_height_vertical_frame = 150;
    var min_height_vertical_frame_onresize = 25;
    var resizeEvents = [];
    var resize_slider = null;
    var resize_slider_delta = 0;
    var selection_catcher = null;
    var __frames = [];
    var __vertical_frames_containers = [];
    var is_resizing_frames = false;

    var resize_frame_onmosemove = function(event)
    {
      if( is_resizing_frames ) return;
      is_resizing_frames = true;
      selection_catcher.focus();
      var slider_top = event.pageY - resize_slider_delta;
      var length = __frames.length;
      var win_height = or_win_height = window.innerHeight;
      var slider = frame = null;
      for( i=0; frame = __frames[i]; i++ )
      {
        if ( i == 0 )
        {
          if( slider_top - frame.offsetTop > min_height_vertical_frame_onresize )
          {
            frame.style.height = ( slider_top - frame.offsetTop ) + 'px';
            win_height -= frame.offsetTop + frame.offsetHeight;
            resize_slider.style.top = slider_top + 'px';
          }
          else
          {
            frame.style.height = min_height_vertical_frame_onresize + 'px';
            win_height -= frame.offsetTop + frame.offsetHeight;
            resize_slider.style.top = ( or_win_height - win_height - 5 ) +'px';
          }
        }
        else if( i == length-1 )
        {
          frame.style.height = (win_height-6)+'px';
        }
        else
        {
          win_height -= frame.offsetHeight;
        }
        slider = document.getElementById('slider-for-' + frame.id);
        if( slider  && slider != resize_slider)
        {
          slider.style.top = ( or_win_height - win_height - 5 ) +'px';
        }
      }
      is_resizing_frames = false;
    }

    var finish_frame_resize = function(event)
    {
      document.removeEventListener('mousemove', resize_frame_onmosemove, false);
      document.removeEventListener('mouseup', finish_frame_resize, false);
    }

    var handleResizeEvents = function()
    {
      var cursor = 0,  length = resizeEvents.length, i=0;
      for ( ; cursor = resizeEvents[i]; i++)
      {
        clearTimeout(cursor);
      }
      resizeEvents = [];
      self.setUpFrames();
    }

    this.resizeListener = function(event)
    {
      resizeEvents[resizeEvents.length] = setTimeout(handleResizeEvents, 10);
    }

    this.setUpAllFrames = function()
    {
      var cursor = null, i = 0;
      for( ; cursor = __vertical_frames_containers[i]; i++)
      {
        self.setUpFrames(cursor);
      }
    }

    this.setUpFrames = function(container)
    {
      var children = container.childNodes, child = null, i = 0;
      var __frames = [];
      for( ; child = children[i]; i++)
      {
        if( child.nodeType == 1 && child.hasClass('frame-vertical'))
        {
          __frames[__frames.length] = child;
        }
      }
      var length = __frames.length;
      var win_height = or_win_height = window.innerHeight;
      var height = 0, styleHeight = 0;
      var slider = null;
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
          win_height = or_win_height - height - child.offsetTop;
        }
        slider = document.getElementById('slider-for-' + child.id);
        if( slider )
        {
          slider.style.top = ( or_win_height - win_height - 5 ) +'px';
        }
      }
    }

    this.setUpResizeFrame = function(event)
    {
      var children = event.target.parentElement.childNodes, child = null, i = 0;
      __frames = [];
      var addFrame = false;
      for( ; child = children[i]; i++)
      {
        if ( !addFrame && child.nodeType == 1 && 
          document.getElementById(event.target.id.slice(11)) == child )
        {
          addFrame = true;
        }
        if( addFrame && child.nodeType == 1 && child.hasClass('frame-vertical'))
        {
          __frames[__frames.length] = child;
        }
      }
      resize_slider = event.target;
      resize_slider_delta = event.offsetY;
      document.addEventListener('mousemove', resize_frame_onmosemove, false);
      document.addEventListener('mouseup', finish_frame_resize, false);
      selection_catcher = 
        document.getElementById('selection_catcher_container').getElementsByTagName('input')[0];
    }

    this.initFrames = function()
    {
      var frames_containers = document.getElementsByClassName('vertical-frame-container');
      var cursor = __frames = frame = null, length = i =  j = 0;
      for( ; cursor = frames_containers[i]; i++)
      {
        __frames = cursor.getElementsByClassName('frame-vertical');
        length = __frames.length;
        for( j=0; j < length-1; j++ )
        {
          cursor.render( templates.verticalFrameSlider(__frames[j].id) )
        }
      }
      __vertical_frames_containers = frames_containers;
      self.setUpAllFrames();
    }
  }
}