(function()
{
  var Service = function(name)
  {

    var self = this;

    this.onconnect = function()
    {

    }

    this.onreceive = function(xml) 
    {
      
      if( ini.debug )
      {
        debug.logEvents(xml);
        
      }
      var is_handled = false;
      if( tagManager.handleResponse(xml) )
      {
        is_handled = true;
      }
      else if( events[xml.documentElement.nodeName] )
      {
        events[xml.documentElement.nodeName](xml);
        is_handled = true;
      }
      if( ini.debug && !is_handled)
      {
        debug.output('not implemented: '+new XMLSerializer().serializeToString(xml));
      }
      
    }

    this.onquit = function()
    {

    }


    var environment = {}

    this.getEnvironment = function()
    {
      return environment;
    }

    /**** event listener ****/

    var events = {};


    events['hello'] = function(xml)
    {
      messages.post('host-state', {state: 'ready'});
      var children = xml.documentElement.childNodes, child=null, i=0;
      for ( ; child = children[i]; i++)
      {
        environment[child.nodeName] = child.textContent;
      }

      views.environment.update();
      
      if( ini.protocol_version == environment['protocol-version'] )
      {
        stop_at.setInitialSettings();
        

      }
      else
      {
        document.body.render
        (
          ['div', 
            ['h2', 'The debugger works with protocol version ' + ini.protocol_version +
                ', but the Opera version you are connecting to uses version ' + environment['protocol-version'], 'class', 'failed' ],
          'class', 'info']
        );

      }

    }

    events['new-script'] = function(xml)
    {
      runtimes.handle(xml);
    }



    events['handle-event'] = function(xml)
    {
      host_tabs.handleEventHandler(xml);
    }

    events['runtimes-reply'] = runtimes.handleRuntimesReplay;

    events['runtime-stopped'] = runtimes.handleRuntimeStoped;


    events['thread-started'] = runtimes.handleThreadStarted;

    events['thread-stopped-at'] = runtimes.handleThreadStopedAt;

    events['thread-finished'] = runtimes.handleThreadFinished;






    // constructor calls

    this.initBase(name);
    
    if( ! client)
    {
      opera.postError('client must be created in ecma debugger.js');
      return;
    }
    client.addService(this);

    /***** commands *****/

    var service = "ecmascript-debugger";
    var self = this;

    var addBreakpointWithSourcePosition = function(script_id, line)
    {
      var msg = "<source-position>";
      msg += "<script-id>" + script_id + "</script-id>";
      msg += "<line-number>" + line + "</line-number>"
      msg += "</source-position>";
      return msg;
    }

    this.postCommandline = function(msg)
    {
      var msg = document.getElementById('command-line-debug').getElementsByTagName('textarea')[0].value;
      this.post(msg);
    }

    this.addBreakpoint = function(msg_how, id )
    {
      var msg = "<add-breakpoint>";
      msg += "<breakpoint-id>" + id + "</breakpoint-id>";
      msg += msg_how;
      msg += "</add-breakpoint>";
      this.post(msg);
    }

    this.removeBreakpoint = function(id)
    {
      var msg = "<remove-breakpoint>";
      msg += "<breakpoint-id>" + id + "</breakpoint-id>";
      msg += "</remove-breakpoint>";
      this.post(msg);
    }

    this.setBreakpoint = function(script_id, line_nr, breakpoint_id)
    {
      self.addBreakpoint( addBreakpointWithSourcePosition(script_id, line_nr), breakpoint_id);
    }

    this.getRuntime = function(/* tag, runtime_1, ... */) 
    {
      var msg = "<runtimes>";
      msg += "<tag>" + arguments[0] +"</tag>";
      var i=1, r_t=0;
      for ( ; r_t = arguments[i]; i++)
      {
        msg += "<runtime-id>" + r_t +"</runtime-id>";
      }
      msg += "</runtimes>";
      this.post(msg);
    }

    this.backtrace = function(tag, stopAt)
    {     
      var msg = "<backtrace>";
      msg += "<tag>" + tag + "</tag>";
      msg += "<runtime-id>" + stopAt['runtime-id'] + "</runtime-id>";
      msg += "<thread-id>" + stopAt['thread-id'] + "</thread-id>";
      msg += "<maxframes>" + ini.max_frames + "</maxframes>";  // not sure what is correct here;
      msg += "</backtrace>";
      this.post(msg);
    }

    this.__continue = function (stopAt, mode)
    {
      var msg = "<continue>";
      msg += "<runtime-id>" + stopAt['runtime-id'] + "</runtime-id>";
      msg += "<thread-id>" + stopAt['thread-id'] + "</thread-id>";
      msg += "<mode>" + mode + "</mode>";
      msg += "</continue>";
      this.post(msg);
    }

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
      this.post(msg);
    }

    this.addEventHandler = function(id, object_id, event, namespace)
    {
      var msg = "<add-event-handler>"+
          "<handler-id>" + id + "</handler-id>" +
          "<object-id>" + object_id + "</object-id>" +
          "<namespace>" + ( namespace ? namespace : "null" ) + "</namespace>" +
          "<event-type>" + event + "</event-type>" +
        "</add-event-handler>";
      this.post(msg);
    }

    this.removeEventHandler = function(id)
    {
      var msg = "<remove-event-handler>" +
                  "<handler-id>" + id + "</handler-id>" +  
                "</remove-event-handler>";
      this.post(msg);
    }

    this.getDocumentFromRuntime = function(tag, runtime)
    {
      var msg = "<eval>" +
                  "<tag>" + tag + "</tag>" +
                  "<runtime-id>" + runtime + "</runtime-id>" +
                  "<thread-id></thread-id>"+
                  "<frame-id></frame-id>"+
                  "<script-data>return window.document</script-data>"+
                "</eval>";
      this.post(msg);
    }

    this.spotlight = function(runtime, node_id)
    {
      var msg = "<spotlight-object>" +
                  "<object-id>" + node_id + "</object-id>" +
                "</spotlight-object>";
      this.post(msg);
    }

    this.clearSpotlight = function(runtime)
    {
      var msg = "<spotlight-object>"+
                  "<object-id>0</object-id>"+
                "</spotlight-object>";
      this.post(msg);
    }

    this.examineObjects = function() // tag, runtime_id, object_1, ...
    {
      var msg = "<examine-objects>", i = 2;
      msg += "<tag>" + arguments[0] +"</tag>";
      msg += "<runtime-id>" + arguments[1] +"</runtime-id>";
      for( ; i < arguments.length; i++)
      {
        msg += "<object-id>" + arguments[i] +"</object-id>";
      }
      msg += "</examine-objects>";
      this.post(msg);
    }

    this.eval = function(tag, runtime_id, thread_id, frame_id, script_data, name_id_pairs)
    {
      /* name_id_pairs: ( object_ref_name, object_id ) *  */
      var msg = "<eval>"+
                  "<tag>" + tag + "</tag>" +
                  "<runtime-id>" + runtime_id + "</runtime-id>" +
                  "<thread-id>" + thread_id + "</thread-id>" +
                  "<frame-id>" + frame_id + "</frame-id>" +
                  "<script-data xml:space=\"preserve\">" + script_data + "</script-data>";
      
      if( name_id_pairs )
      {
        var i = 0, length = name_id_pairs.length;
        for( ; i < length; i++ )
        {
          msg += "<property>" +
                   "<property-name>" + name_id_pairs[i++] + "</property-name>" +
                   "<value-data>" +
                     "<data-type>object-id</data-type>" +
                     "<object-id>" + name_id_pairs[i] + "</object-id>" +
                   "</value-data>" +
                 "</property>";
        }
      }
      msg += "</eval>";
      
      this.post(msg);
    }

    this.createAllRuntimes = function()
    {
      this.post("<runtimes><tag></tag><create-all-runtimes/></runtimes>");
    }

    this.getMatchingCSSRules = function(tag, obj_id, rt_id)
    {
      var msg = "<get-matching-css-rules>"+
          "<tag>" + tag + "</tag>"+
          "<runtime-id>" + obj_id + "</runtime-id>"+
          "<object-id>" + rt_id + "</object-id>"+
        "</get-matching-css-rules>";
      this.post(msg);
    }

  }

  Service.prototype = ServiceBase;
  new Service('ecmascript-debugger');

})()


