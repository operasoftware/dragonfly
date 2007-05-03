handlers = new function()
{
  var self = this;

  this.showAllScripts = function(event)
  {
    var scripts=debugger.getScripts(this.getAttribute('runtime_id'));
    var scripts_container = document.getElementById('scripts');
    scripts_container.innerHTML = '';
    var script = null, i=0;
    for( ; script = scripts[i]; i++)
    {
      scripts_container.render(templates.scriptLink(script));
    }
    self.setSelected(event);
  }

  this.showScript = function(event)
  {
    var scipt=helpers.formatScript(this.ref['script-data']);
    document.getElementById('source-view').innerHTML = scipt;//clearAndRender(['pre', this.ref['script-data']]);
    self.setSelected(event);

  }

  this.setSelected = function(event)
  {
    var ele=event.target;
    var siblings = ele.parentNode.getElementsByTagName(ele.nodeName), sibling = null, i=0;
    for( ; sibling = siblings[i]; i++)
    {
      if(sibling == ele) 
      {
        sibling.addClass('selected'); 
      }
      else
      {
        sibling.removeClass('selected'); 
      }
    }
  }

  this.setStopAt = function(event)
  {
    debugger.setConfiguration(event.target.value, event.target.checked ? 'yes' : 'no');
  }

  this.__continue = function(event)
  {
    var id = event.target.__stop_at_id;
    helpers.disableContinues(0, true);
    debugger.__continue(id, event.target.getAttribute('mode'));
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
      debugger.handleBreakpoint
      (
        ele.parentNode.parentNode.getAttribute('script-id'), 
        parseInt(ele.getAttribute('line-ref'))
      )
    }
  }
}