var stop_at = new function()
{

  /**
  * two layers are needed. 
  * stop_at script must be enabled allways to be able to reasign breakpoints. 
  */ 

  var stop_at_settings =
  {
    script: 1,
    exception: 0,
    error: 0,
    abort: 0,
    gc: 0
  }

  // replace with settings['js-source'].get(key)
  var stop_at_user_settings =
  {
    script: 0,
    exception: 0,
    error: 0,
    abort: 0,
    gc: 0
  }

  var stopAt = {}; // there can be only one stop at at the time

  var runtime_id = '';

  var callstack = [];

  var __controls_enabled = false;

  var __stopAtId = 1;

  var getStopAtId = function()
  {
    return __stopAtId++;
  }

  this.getStopAts = function()
  {
    return stop_at_user_settings; // should be  copied
  }

  var onSettingChange = function(msg)
  {
    if(msg.id == 'js-source' )
    {
      var key = msg.key, value = settings['js-source'].get(key);
      if( key == 'script' )
      {

      }
      else
      {
        stop_at_settings[key] = value;
        services['ecmascript-debugger'].setConfiguration(key, value ? 'yes' : 'no');
      }
    }
  }

  this.setUserStopAt = function(key, value)
  {
    //stop_at_user_settings[key] = value; // true or false;
    opera.postError('clean up. this should no longer be called. stop_at.setUserStopAt'); 

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
          this_id : frame.getNodeData('this-object'),
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
          this_id : frame.getNodeData('this-object'),
          id: i
        }
      }
      // fake a click event on the top frame in the stack
      if( i == 0 )
      {
        action_handler.post('show-frame', {'target': { 'ref-id': 0 } });
      }
    }
    views.callstack.update();
  }

  this.setInitialSettings = function()
  {
    var config_arr = [], prop = '';
    for ( prop in stop_at_settings )
    {
      config_arr[config_arr.length] = prop;
      config_arr[config_arr.length] = stop_at_settings[prop] ? 'yes' : 'no';
    }
    services['ecmascript-debugger'].setConfiguration.apply(services['ecmascript-debugger'], config_arr);
  }

  this.__continue = function (mode) //
  {
    __controls_enabled = false;

    runtimes.setObserve(stopAt['runtime-id'], mode != 'run');

    services['ecmascript-debugger'].__continue(stopAt, mode);
    toolbars.js_source.disableButtons('continue');
    messages.post('host-state', {state: 'ready'});
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
      /**
      * This event is enabled by default to reassign breakpoints. 
      * Here it must be checked if the user likes actually to stop or not.
      * At the moment this is a hack because the stop reason is not set for that case.
      * The check is if the stop reason is 'unknown' ( should be 'new script')
      */
      if(stopAt['stopped-reason'] == 'unknown')
      {
        runtime_id = stopAt['runtime-id'];
        if(  settings['js_source'].get('script') || runtimes.getObserve(runtime_id))
        {
          // the runtime id can be different for each frame. 
          var tag = tagManager.setCB(null, parseBacktrace, [stopAt['runtime-id']]); 
          services['ecmascript-debugger'].backtrace(tag, stopAt);
          if( views.js_source.showLine( stopAt['script-id'], line - 10 ) )
          {
            views.js_source.showLinePointer( line, true );
          }
          __controls_enabled = true;
          toolbars.js_source.enableButtons('continue');
          messages.post('host-state', {state: 'waiting'});
        }
        else
        {
          this.__continue('run');
        }
      }
      else
      {
        runtime_id = stopAt['runtime-id'];
        // the runtime id can be different for each frame. 
        var tag = tagManager.setCB(null, parseBacktrace, [stopAt['runtime-id']]); 
        services['ecmascript-debugger'].backtrace(tag, stopAt);
        if( views.js_source.showLine( stopAt['script-id'], line - 10 ) )
        {
          views.js_source.showLinePointer( line, true );
        }
        __controls_enabled = true;
        toolbars.js_source.enableButtons('continue');
      }
    }
    else
    {
      throw 'not a line number: '+stopAt['line-number'];
    }
  }



  messages.addListener('setting-changed', onSettingChange);
}