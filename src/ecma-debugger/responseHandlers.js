var responseHandlers = new function()
{
  this.examinFrame = function(xml, runtime_id, arguments_id, this_id)
  {
    frame_inspection.setNewFrame(runtime_id);
    frame_inspection.handleExamineObject(xml, null);
    frame_inspection.addObjects(null, 
      0, 
      {key: 'arguments', value: arguments_id, type: 'object', items: []});
    frame_inspection.addObjects(null, 
      1, 
      {key: 'this', value: this_id, type: 'object', items: []});
    views.frame_inspection.update(null);
    debug.checkProfiling();

  }

  this.examinObject = function(xml, runtime_id, path_arr)
  {
    //alert(new XMLSerializer().serializeToString(xml))
    frame_inspection.handleExamineObject(xml, path_arr);
    views.frame_inspection.update(path_arr);
    debug.checkProfiling();
    /*
    container.render( templates.examineObject(xml, runtime_id) );
    debug.checkProfiling();
    */
  }
}
