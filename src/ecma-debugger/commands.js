var commands = new function()
{
  var service = "ecmascript-debugger";
  var self = this;

  this.addBreakpoint = function(msg_how, id )
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
    proxy.POST("/" + "ecmascript-debugger", msg);
  }

  this.backtrace = function(tag, stopAt)
  {
     
    var msg = "<backtrace>";
    msg += "<tag>" + tag + "</tag>";
    msg += "<runtime-id>" + stopAt['runtime-id'] + "</runtime-id>";
    msg += "<thread-id>" + stopAt['thread-id'] + "</thread-id>";
    msg += "<maxframes>" + ini.max_frames + "</maxframes>";  // not sure what is correct here;
    msg += "</backtrace>";
    proxy.POST("/" + service, msg);
  }

  this.__continue = function (stopAt, mode)
  {
    var msg = "<continue>";
    msg += "<runtime-id>" + stopAt['runtime-id'] + "</runtime-id>";
    msg += "<thread-id>" + stopAt['thread-id'] + "</thread-id>";
    msg += "<mode>" + mode + "</mode>";
    msg += "</continue>";
    proxy.POST("/" + service, msg);
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
    proxy.POST("/" + service, msg);
  }

  this.addEventHandler = function(id, object_id, event, namespace)
  {
    var msg = "<add-event-handler>"+
        "<handler-id>" + id + "</handler-id>" +
        "<object-id>" + object_id + "</object-id>" +
        "<namespace>" + ( namespace ? namespace : "null" ) + "</namespace>" +
        "<event-type>" + event + "</event-type>" +
      "</add-event-handler>";
    proxy.POST("/" + "ecmascript-debugger", msg);
  }

  this.removeEventHandler = function(id)
  {
    var msg = "<remove-event-handler>" + id + "</remove-event-handler>";
    proxy.POST("/" + "ecmascript-debugger", msg);
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
    proxy.POST("/" + "ecmascript-debugger", msg);
  }

  this.spotlight = function(runtime, node_id)
  {
    var msg = "<spotlight-object>" +
                "<runtime-id>" + runtime + "</runtime-id>" +
                "<object-id>" + node_id + "</object-id>" +
              "</spotlight-object>";
    proxy.POST("/" + "ecmascript-debugger", msg);
  }

  this.clearSpotlight = function(runtime)
  {
    var msg = "<spotlight-object>"+
                "<runtime-id>"+runtime+"</runtime-id>"+
                "<object-id>0</object-id>"+
              "</spotlight-object>";
    proxy.POST("/" + "ecmascript-debugger", msg);
  }

}