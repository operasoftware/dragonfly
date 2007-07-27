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

}