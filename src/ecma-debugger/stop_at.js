var stop_at = new function()
{
  var stopAt = {}; // there can be only one stop at at the time

  var runtime_id = '';

  var callstack = [];

  var __controls_enabled = false;

  var __stopAtId = 1;

  var getStopAtId = function()
  {
    return __stopAtId++;
  }

  this.getRuntimeId = function()
  {
    return runtime_id;
  }

  this.getControlsEnabled = function()
  {
    return __controls_enabled;
  }

  this.getFrames = function()
  {
    return callstack; // should be copied
  }

  this.getFrame = function(id)
  {
    return callstack[id];
  }

  var parseBacktrace = function(xml, runtime_id)
  {
    var _frames = xml.getElementsByTagName('frame'), frame = null, i = 0;
    var fn_name = '', line = '', script_id = '', argument_id = '', scope_id = '';
    var _frames_length = _frames.length;

    var is_all_frames = _frames_length <= ini.max_frames;
    callstack = [];
    for( ; frame  = _frames[i]; i++ )
    {
      if( is_all_frames && i == _frames_length - 1 )
      {
        callstack[i] =
        {
          fn_name : 'global scope',
          line : '', 
          script_id : '',
          argument_id : frame.getNodeData('argument-object'),
          scope_id : frame.getNodeData('variable-object'),
          id: i
        }
      }
      else
      {
        callstack[i] =
        {
          fn_name : frame.getNodeData('function-name'),
          line : frame.getNodeData('line-number'), 
          script_id : frame.getNodeData('script-id'),
          argument_id : frame.getNodeData('argument-object'),
          scope_id : frame.getNodeData('variable-object'),
          id: i
        }
      }
      views.callstack.update();
    }
  }

  this.__continue = function (mode)
  {
    __controls_enabled = false;
    commands.__continue(stopAt, mode);
    views.continues.update();
  }


  this.handle = function(stop_at_event)
  {
    stopAt = {};
    var id = getStopAtId();
    var children = stop_at_event.documentElement.childNodes, child=null, i=0;
    for ( ; child = children[i]; i++)
    {
      if(child.firstChild)
      {
        stopAt[child.nodeName] = child.firstChild.nodeValue;
      }
      else
      {
        opera.postError( "empty element in <thread-stopped-at> event");
        stopAt[child.nodeName] = null
      }
    }
    var line = parseInt( stopAt['line-number'] );
    if( typeof line == 'number' )
    {
      runtime_id = stopAt['runtime-id'];
      // the runtime id can be different for each frame. 
      var tag = tagManager.setCB(null, parseBacktrace, [stopAt['runtime-id']]); 
      commands.backtrace(tag, stopAt);
      
      views.source_code.showLine( stopAt['script-id'], line );
      __controls_enabled = true;
      views.continues.update();
    }
    else
    {
      throw 'not a line number: '+stopAt['line-number'];
    }
  }
}