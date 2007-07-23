var responseHandlers = new function()
{
  this.examinObject = function(xml, runtime_id, container)
  {
    container.render( templates.examineObject(xml, runtime_id) );
  }
}