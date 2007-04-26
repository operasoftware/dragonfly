handlers = new function()
{
  this.showAllScripts = function()
  {
    var scripts=debugger.getScripts(this.getAttribute('runtime_id'));
    var scripts_container = document.getElementById('scripts');
    scripts_container.innerHTML = '';
    var script = null, i=0;
    for( ; script = scripts[i]; i++)
    {
      scripts_container.render(templates.scriptLink(script));
    }
  }

  this.showScript = function()
  {
    document.getElementById('source-view').clearAndRender(['pre', this.ref['script-data']]);
  }
}