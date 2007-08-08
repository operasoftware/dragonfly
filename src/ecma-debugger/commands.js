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
    //alert('command set breakpoint '+script_id+' '+line_nr+' '+ breakpoint_id)



    self.addBreakpoint( addBreakpointWithSourcePosition(script_id, line_nr), breakpoint_id);
  }

  this.removeBreakpoint = function(script_id, line_nr, breakpoint_id)
  {
    
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

}