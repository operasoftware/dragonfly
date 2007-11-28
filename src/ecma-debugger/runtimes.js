var runtimes = new function()
{
  var __runtimes = {};

  var registerRuntime = function(id)
  { 
    if( !(id in __runtimes) )
    {
      //alert('runtime: '+ id);
      __runtimes[id] = null;
      services['ecmascript-debugger'].getRuntime( tagManager.setCB(null, parseRuntime), id );
    }
  }

  this.handleRuntimesReplay = function(xml)
  {
    parseRuntime(xml);
  }

  var parseRuntime = function(xml)
  {
    var r_ts = xml.getElementsByTagName('runtime'), r_t=null, i=0;
    var runtimeId = '', runtime=null, prop = '', 
      children = null, child = null, j = 0;
    var cur = '';
    for ( ; r_t = r_ts[i]; i++)
    {
      runtimeId = r_t.getNodeData('runtime-id'); 
      //alert('parseRuntime: '+ runtimeId);
      if(runtimeId)
      {
        runtime={};
        children = r_t.childNodes;
        for(j=0 ; child = children[j]; j++)
        {
          runtime[child.nodeName] = child.textContent;
        }
        for( cur in __runtimes )
        {
          if( __runtimes[cur] && __runtimes[cur]['uri'] == runtime['uri'] )
          {
            // copy states
            //alert("__runtimes[cur]['unfolded'] "+__runtimes[cur]['unfolded'])
            if( __runtimes[cur]['unfolded'] )
            {
              runtime['unfolded'] = __runtimes[cur]['unfolded'];
            }
            delete __runtimes[cur];
          }
        }
        __runtimes[runtimeId] = runtime;

        // update view
        views.runtimes.update();
      }
    }
  }

  var __scripts = {};

/** checks if that script is already known from a previous runtime
  * checks first for the url and the for the script data. 
  * Both checks are not really reliable.
  * TODO we need a better logic to handle this
  */
  var registerScript = function(script)
  {
    var sc = null, is_known = false;
    var new_script_id = script['script-id'];
    for( sc in __scripts )
    {
      if( ( __scripts[sc]['uri'] && ( __scripts[sc]['uri'] == script['uri'] ) )|| __scripts[sc]['script-data'] == script['script-data'] )
      {
        is_known = true;
        break;
      }
    }

    if( is_known )
    {
      var old_b_ps = __scripts[sc]['breakpoints'];
      var new_b_ps = script['breakpoints'];
      for( b_p in old_b_ps )
      {
        services['ecmascript-debugger'].setBreakpoint(new_script_id, b_p, old_b_ps[b_p]);
        new_b_ps[b_p] = old_b_ps[b_p];
      }
      delete __scripts[sc];
    }

    __scripts[new_script_id] = script;

    var a ='', b='';
    for( a in __scripts ) b+=a+'; '; 

  }
  
/*
"<new-script>" 
   "<runtime-id>" UNSIGNED "</runtime-id>"
   "<script-id>" UNSIGNED "</script-id>" 
   "<script-type>" 
      ( "inline" | "event" | "linked" | "timeout" | "java" | "unknown" ) 
   "</script-type>"
   "<script-data>" TEXT "</script-data>" 
   "<uri>" TEXT "</uri>"             ; present if SCRIPT-TYPE is "linked"
 "</new-script>" ;
*/

  

  

  var breakpoint_count = 1;

  var getBreakpointId = function()
  {
    return ( breakpoint_count++ ).toString();
  }

  var script_count = 1;

  var getScriptId = function()
  {
    return ( script_count++ ).toString();
  }



  this.handle = function(new_script_event)
  {
    var script = {};
    var children = new_script_event.documentElement.childNodes, child=null, i=0;
    for ( ; child = children[i]; i++)
    {
      script[child.nodeName] = child.firstChild.nodeValue;
    }
    script['breakpoints'] = {};
    registerRuntime( script['runtime-id'] );
    registerScript( script );
    views.runtimes.update();
  }

  this.getRuntimes = function()
  {
    // not very clever
    return __runtimes;
  }

  this.getRuntimeIdWithURL = function(url)
  {
    var r = '';
    for( r in __runtimes )
    {
      if( __runtimes[r]['uri'] == url )
      {
        return __runtimes[r];
      }
    }
    return null;
  }

  this.getScript = function(scriptId)
  {
    return __scripts[scriptId];
  }

  this.getScriptSource = function(scriptId)
  {
    return __scripts[scriptId] && __scripts[scriptId]['script-data'] || null;
  }

  this.getScripts = function(runtime_id)
  {
    var ret=[], script = null, cur = '';
    for( cur in __scripts )
    {
      script = __scripts[cur];
      if(script['runtime-id'] == runtime_id)
      {
        ret[ret.length] = script;
      }
    }
    return ret;
  }


  this.hasBreakpoint = function(script_id, line_nr)
  {
    return (line_nr in __scripts[script_id]['breakpoints']);
  }

  this.setBreakpoint = function(script_id, line_nr)
  {
    var b_p_id = __scripts[script_id]['breakpoints'][line_nr] = getBreakpointId();
    services['ecmascript-debugger'].setBreakpoint(script_id, line_nr, b_p_id);
  }

  this.removeBreakpoint = function(script_id, line_nr)
  {
    services['ecmascript-debugger'].removeBreakpoint( __scripts[script_id]['breakpoints'][line_nr] );
    delete __scripts[script_id]['breakpoints'][line_nr];
  }

  this.getBreakpoints = function(script_id)
  {
    return __scripts[script_id] && __scripts[script_id]['breakpoints'];
  }


  this.setUnfolded = function(runtime_id, is_unfolded)
  {
    
    if( __runtimes[runtime_id] )
    {
      //alert(__runtimes[runtime_id]+' '+is_unfolded);
      __runtimes[runtime_id]['unfolded'] = is_unfolded;
    }
  }

  this.setObserve = function(runtime_id, observe)
  {
    if( __runtimes[runtime_id] )
    {
      __runtimes[runtime_id]['observe'] = observe;
    }
  }

  this.getObserve = function(runtime_id)
  {
    return __runtimes[runtime_id] && __runtimes[runtime_id]['observe']  || false;
  }

  // this is a temporary solution as long as we don't have a concept for tabs

  var __selected_runtime_id = '';

  this.setSelectedRuntime = function(runtime)
  {
    var r = '';
    for( r in __runtimes )
    {
      if( __runtimes[r] == runtime )
      {
        __runtimes[r]['selected'] = true;
        __selected_runtime_id = __runtimes[r]['runtime-id'];
      }
      else
      {
        __runtimes[r]['selected'] = false;
      }
    }
  }

  this.getSelectedRuntimeId = function()
  {
    return __selected_runtime_id;
  }




}

//