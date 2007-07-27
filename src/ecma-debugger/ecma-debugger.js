
var debugger = new function()
{
  var self = this;
  var service = "ecmascript-debugger";

  this.getEvent = function()
  {
    proxy.GET( "/" + service, genericEventListener );
  }

  var genericEventListener = function(xml) 
  {
    if(xml)
    {
      if( tagManager.handleResponse(xml) )
      {
        //alert('handled by tag manager');
      }
      else if( self[xml.documentElement.nodeName] )
      {
        //alert('handled by else if');
        self[xml.documentElement.nodeName](xml)
      }
      else
      {
        if( ini.debug )
        {
          debug.output('not implemented: '+new XMLSerializer().serializeToString(xml));
        }
      }
      if( ini.debug )
      {
        debug.formatXML(new XMLSerializer().serializeToString(xml));
      }
    }
    self.getEvent();
  }

  var parseBacktrace = function(xml, runtime_id)
  {
    
    var _frames = xml.getElementsByTagName('frame'), frame = null, i = 0;
    var fn_name = '', line = '', script_id = '', argument_id = '', scope_id = '';
    var _frames_length = _frames.length;
    var container = document.getElementById('backtrace');
    container.innerHTML = '';
    var is_all_frames = _frames_length <= ini.max_frames;
    for( ; frame  = _frames[i]; i++ )
    {
      if( is_all_frames && i == _frames_length - 1 )
      {
        fn_name = 'global scope';
        line = ''; 
        script_id = '';
        argument_id = frame.getNodeData('argument-object');
        scope_id = frame.getNodeData('variable-object');
        container.render(templates.frame(fn_name, line, runtime_id, script_id, argument_id, scope_id));
      }
      else
      {
        fn_name = frame.getNodeData('function-name');
        line = frame.getNodeData('line-number'); 
        script_id = frame.getNodeData('script-id');
        argument_id = frame.getNodeData('argument-object');
        scope_id = frame.getNodeData('variable-object');
        container.render(templates.frame(fn_name, line, runtime_id, script_id, argument_id, scope_id));
      }
    }
  }
  
  var environment = {}

  /**** generic event listener ****/

  /*

  hello>
  <protocol-version>1</protocol-version>
  <operating-system>WinGogi</operating-system>
  <platform>WinGogi</platform>
  <user-agent>WinGogiOpera/9.0 (Wi...</user-agent>
</hello>

*/

  this['hello'] = function(xml)
  {
    var children = xml.documentElement.childNodes, child=null, i=0;
    for ( ; child = children[i]; i++)
    {
      environment[child.nodeName] = child.textContent;
    }
    document.getElementById('hello').render(templates.hello(environment));
    if( ini.protocol_version == environment['protocol-version'] )
    {

      var config = storage.config_stop_at.get();
      var config_arr = [], prop = '';
      for ( prop in config )
      {
        config_arr[config_arr.length] = prop;
        config_arr[config_arr.length] = config[prop];
      }
      self.setConfiguration.apply(self, config_arr);
      document.getElementById('configuration').render(templates.configStopAt(config));
      document.getElementById('continues').render(templates.continues());
      helpers.setUpListeners();
    }
    else
    {
      document.getElementById('source-view').render
      (
        ['h2', 'The debugger works with protocol version ' + ini.protocol_version, 'class', 'failed' ]
      );


    }

  }

  this['new-script'] = function(xml)
  {
    
    runtimes.handle(xml);
    }

  this['timeout'] = function() 
  {

  }

  this['runtimes-reply'] = function(xml)
  {
    alert(88);
    var tag = xml.getNodeData('tag'), handler=null;
    if(tag && ( handler = tags[parseInt(tag)] ))
    {
      handler(xml);
    }
    else
    {
      throw "runtimes-reply, missing tag";
    }
    //self.getEvent();
  }
  /*

    <frame>

    <function-id>23</function-id>
    <argument-count>24</argument-count>
    <variable-count>25</variable-count>

    <source-position>
      <script-id>9</script-id>
      <line-number>5</line-number>
    </source-position>

    <object-value>
      <object-id>23</object-id>
      <object-attributes>
        <iscallable/>
        <isfunction/>
      </object-attributes>
      <function-name>foo</function-name>
    </object-value>

  </frame>

  */



  /*

  <thread-stopped-at>
  <runtime-id>2</runtime-id>
  <thread-id>8</thread-id>
  <script-id>10</script-id>
  <line-number>2</line-number>
  <stopped-reason>unknown</stopped-reason>
</thread-stopped-at>

<runtimes-reply>

CONTINUE ::= "<continue>" 
                 RUNTIME-ID 
                 THREAD-ID 
                 MODE 
               "</continue>" ;
RUNTIME-ID ::= "<runtime-id>" UNSIGNED "</runtime-id>" ;
THREAD-ID ::= "<thread-id>" UNSIGNED "</thread-id>" ;
MODE ::= "<mode>" 
             ( "run" | "step-into-call" | "step-over-call" | "finish-call" )
           "</mode>" ;
*/

  var __stopAt = {}; // there can be only one stop at at the time

  var __stopAtId = 1;

  var getStopAtId = function()
  {
    return __stopAtId++;
  }

  this['thread-stopped-at'] = function(xml)
  {
    var stopAt = {};
    var id = getStopAtId();
    var children = xml.documentElement.childNodes, child=null, i=0;
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
    __stopAt[id] = stopAt;
    var line = parseInt( stopAt['line-number'] );
    if( typeof line == 'number' )
    {
      self.backtrace(stopAt);
      
      views.source_code.showLine( stopAt['script-id'], line );
      helpers.disableContinues(id, false);
    }
    else
    {
      throw 'not a line number: '+stopAt['line-number'];
    }
  }
/*

  'runtime-id'
  'script-id'
  'script-type'
  'script-data'
  'uri'

*/
  var scripts = [];

  this.getScripts=function(runtime_id)
  {
    var ret=[], script = null, i=0;
    for( ; script = scripts[i]; i++)
    {
      if(script['runtime-id'] == runtime_id)
      {
        ret[ret.length] = script;
      }
    }
    return ret;
  }

  this.getScript=function(script_id)
  {
    var script = null, i=0;
    for( ; script = scripts[i]; i++)
    {
      if(script['script-id'] == script_id)
      {
        return script;
      }
    }
    return null;
  }



  this.setup = function()
  {
    var args = location.search, params = {}, arg = '', i = 0, ele = null;;
    if( args )
    {
      args = args.slice(1).split(';');
      for( ; arg = args[i]; i++)
      {
        arg = arg.split('=');
        params[arg[0]] = arg[1] ? arg[1] : true;
      }
    }
    if(params.debug)
    {
      ini.debug = true;
    }
    else
    {
      var rem = ['command-line', 'debug-container'];
      for( i = 0; arg = rem[i]; i++)
      {
        ele = document.getElementById(arg);
        ele.parentNode.removeChild(ele);
      }
      document.body.insertBefore(document.render(['h1', 'prototype ecma script debugger']), document.body.children[0]);
    }

    verticalFrames.init
    (
      document.body.getElementsByTagName('div')[0], 
      function(){ return window.innerHeight - document.body.getElementsByTagName('div')[0].offsetTop }
    )

    action_handler.init();

    var host = location.host.split(':');

    proxy.onsetup = function()
    {
      if (!proxy.enable(service))	
      {
        alert( "No service: " + service );
        return;
      }
      else
      {
        self.getEvent();
      }

    }
    proxy.configure(host[0], host[1]);
  }


  /**** commands ****/

  this.setConfiguration = function() // stopAt
  {
    var msg = "<set-configuration>", type='', bol='', i=0; 
    for ( ; (type = arguments[i++]) && (bol=arguments[i]); i++ )
    {
      msg += "<stop-at>" + 
          ( bol=='yes' ? "<yes/>" : "<no/>" ) +
          "<stop-type>"+type+"</stop-type>"+
        "</stop-at>";
    }
    msg += "</set-configuration>";
    proxy.POST("/" + service, msg);
  }

  this.backtrace = function(stopAt)
  {
    var tag = tagManager.setCB(this, parseBacktrace, [stopAt['runtime-id']]); 
    var msg = "<backtrace>";
    msg += "<tag>" + tag + "</tag>";
    msg += "<runtime-id>" + stopAt['runtime-id'] + "</runtime-id>";
    msg += "<thread-id>" + stopAt['thread-id'] + "</thread-id>";
    msg += "<maxframes>" + ini.max_frames + "</maxframes>";  // not sure what is correct here;
    msg += "</backtrace>";
    proxy.POST("/" + service, msg);
    //self.getEvent();
  }

  this.addBreakpoint = function(id, msg_how )
  {
    var msg = "<add-breakpoint>";
    msg += "<breakpoint-id>" + id + "</breakpoint-id>";
    msg += msg_how;
    msg += "</add-breakpoint>";
    proxy.POST("/" + service, msg);
  }

  var addBreakpointWithSourcePosition = function(script_id, line)
  {
    var msg = "<source-position>";
    msg += "<script-id>" + script_id + "</script-id>";
    msg += "<line-number>" + line + "</line-number>"
    msg += "</source-position>";
    return msg;
  }

  this.removeBreakpoint = function(id)
  {
    var msg = "<remove-breakpoint>";
    msg += "<breakpoint-id>" + id + "</breakpoint-id>";
    msg += "</remove-breakpoint>";
    proxy.POST("/" + service, msg);
  }


  this.__continue = function (stopAtId, mode)
  {
    var msg = "<continue>";
    msg += "<runtime-id>" + __stopAt[stopAtId]['runtime-id'] + "</runtime-id>";
    msg += "<thread-id>" + __stopAt[stopAtId]['thread-id'] + "</thread-id>";
    msg += "<mode>" + mode + "</mode>";
    msg += "</continue>";
    proxy.POST("/" + service, msg);
    //self.getEvent();
  }

  this.postCommandline = function(msg)
  {
    var msg = document.getElementById('command-line').getElementsByTagName('textarea')[0].value;
    proxy.POST("/" + service, msg);
  }

  /*

  var breakpoints = {};

  var __breakpointCounter = 1;

  var getBreakpointId = function()
  {
    return __breakpointCounter++;
  }

  var storeBreakpoint = function(script, line, id)
  {
    breakpoints[id] = 
    {
      'script-id': script,
      'line': line
    }
    return id;
  }

  var clearBreakpoint = function(id)
  {
    delete breakpoints[id];
  }

  var getBreakpointsByScriptId = function(script_id)
  {
    var ret = [], cursor = null;
    for( cursor in breakpoints )
    {
      if ( breakpoints[cursor]['script-id'] == script_id )
      {
        ret[ret.length] = cursor;
      }
    }
    return ret;
  }

  var getBreakpointsByScriptIdAndLine = function(script_id, line)
  {
    var cursor = null, i=0;
    var b_p_ids = getBreakpointsByScriptId(script_id);
    for( ; cursor = b_p_ids[i]; i++ )
    {
      if ( breakpoints[cursor]['line'] == line )
      {
        return cursor;
      }
    }
    return null;
  }

  this.handleBreakpoint = function(script_id, line)
  {
    var b_p = getBreakpointsByScriptIdAndLine(script_id, line);
    if(b_p)
    {
      self.removeBreakpoint(b_p);
      clearBreakpoint(b_p);
      helpers.removeBreakpoint(b_p);
    }
    else
    {
      b_p = storeBreakpoint(script_id, line, getBreakpointId());
      self.addBreakpoint(b_p, addBreakpointWithSourcePosition(script_id, line));
      helpers.displayBreakpoint(line, b_p);
    }
  }

  */

  /**** tags handling ****/

  /*

  var tags = {};
  var __tagCounter=0;

  var getTagId = function()
  {
    return __tagCounter++;
  }

  var setTagCB =function(tagId, cb)
  {
    tags[tagId] = cb;
  }

  var clearTagId = function(tagId)
  {
    delete tags[tagId];
  }

  */

  //proxy.onReceive = this.getEvent;

}


onload = debugger.setup