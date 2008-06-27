/**
  * @constructor 
  * @extends ObjectDataBase
  */
var Node_dom_attrs = function()
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

  this.getDataFilter = function()
  {
    return settings['dom_attrs'].get("hide-null-values") && { '""': 1, "null" : 1 } || null;
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

Node_dom_attrs.prototype = ObjectDataBase;
node_dom_attrs = new Node_dom_attrs();