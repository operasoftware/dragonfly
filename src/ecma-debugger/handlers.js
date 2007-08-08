handlers = new function()
{
  var self = this;



  this.showScript = function(event)
  {
    //var scipt=helpers.formatScript(this.ref['script-data']);
    //document.getElementById('source-view').innerHTML = scipt;//clearAndRender(['pre', this.ref['script-data']]);
    //self.setSelected(event);
    views.source_code.displayScript(event.target.getAttribute('script-id'));

  }






  this.breakpoint = function(event)
  {
    var ele = event.target;
    while(ele && !/^li$/i.test(ele.nodeName) && ele.parentElement)
    { 
      ele = ele.parentElement;
    }
    if(ele)
    {
      var script_id = ele.parentNode.parentNode.getAttribute('script-id');
      var line = ele.getAttribute('line-ref');
      if( runtimes.hasBreakpoint(script_id, line))
      {
        runtimes.removeBreakpoint(script_id, line);
      }
      else
      {
        runtimes.setBreakpoint(script_id, line);
        
      }
      views.source_code.updateBreakpoints();
    }
  }
}