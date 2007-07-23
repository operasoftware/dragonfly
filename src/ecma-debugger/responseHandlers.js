var responseHandlers = new function()
{
  this.examinFrame = function(xml, runtime_id, container, arguments_id)
  {
    container.render( templates.key_value_folder('arguments', runtime_id, arguments_id) );
    container.render( templates.examineObject(xml, runtime_id) );
  }

  this.examinObject = function(xml, runtime_id, container)
  {
    container.render( templates.examineObject(xml, runtime_id) );
  }
}