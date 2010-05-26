window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["5.0"] || (cls.EcmascriptDebugger["5.0"] = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * @constructor 
  * @extends ObjectDataBase
  */

cls.EcmascriptDebugger["6.0"].Node_dom_attrs = 
cls.EcmascriptDebugger["5.0"].Node_dom_attrs = function()
{

  const 
  KEY = 0,
  VALUE = 1;

  var __selectedElement = null;
  var __views = ['dom_attrs'];

  this.rt_id = '';
  this.data = [];

  var self = this;

  this.filter_type = VALUE;

  this.getSelectedNode = function()
  {
    return __selectedElement;
  }

  this.getSelectedNodeData = function()
  {
    if(__selectedElement)
    {
      return this.getData(__selectedElement.rt_id, __selectedElement.obj_id);
    }
  }

  var onElementSelected = function(msg)
  {
    __selectedElement = {rt_id: msg.rt_id,  obj_id: msg.obj_id};
    self.setObject(msg.rt_id, msg.obj_id);
    var view_id = '', i = 0;
    for ( ; view_id = __views[i] ; i++)
    {
      views[view_id].update();
    }
  }

  messages.addListener('element-selected', onElementSelected);
}

