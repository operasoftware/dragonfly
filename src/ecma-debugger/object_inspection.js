/**
  * @constructor 
  * @extends ObjectDataBase
  */

var Object_inspection = function()
{

  const 
  KEY = 0,
  VALUE = 1;

  var __selectedObject = null;
  // should be general inspection
  var __views = ['frame_inspection'];

  var __is_active_inspection = false;

  this.rt_id = '';
  this.data = [];

  this.filter_type = KEY;

  var self = this;

  this.getSelectedObject = function()
  {
    return __selectedObject;
  }

  this.getSelectedObjectData = function()
  {
    if(__selectedObject)
    {
      return this.getData(__selectedObject.rt_id, __selectedObject.obj_id);
    }
  }

  this.getDataFilter = function()
  {
    return settings['object_inspection'].get("hide-default-properties-in-global-scope") 
      && js_default_global_scope_properties || null;
  }


  this.examineObject = function(rt_id, obj_id)
  {
    __selectedObject = {rt_id: rt_id, obj_id: obj_id};
    self.setObject(rt_id, obj_id);
    var view_id = '', i = 0;
    if( __is_active_inspection )
    {
      for ( ; view_id = __views[i] ; i++)
      {
        views[view_id].update();
      }
    }
  }

  var handleShowGlobalScope = function(xml, rt_id)
  {
    if( xml.getNodeData('status') == 'completed' )
    {
      self.examineObject(rt_id, xml.getNodeData('object-id'));
    }
    else
    {
      opera.postError('getting window id has failed in handleShowGlobalScope in object_inspection');
    }
  }

  this.showGlobalScope = function(rt_id)
  {
    var tag = tagManager.setCB(null, handleShowGlobalScope, [rt_id]);
    var script = "return window";
    services['ecmascript-debugger'].eval(tag, rt_id, '', '', script);
  }


  var onObjectSelected = function(msg)
  { 
    __selectedObject = {rt_id: msg.rt_id, obj_id: msg.obj_id};
    self.setObject(__selectedObject.rt_id, __selectedObject.obj_id);
    var view_id = '', i = 0;
    if( __is_active_inspection )
    {
      for ( ; view_id = __views[i] ; i++)
      {
        views[view_id].update();
      }
    }
  }

  messages.addListener('object-selected', onObjectSelected);

  var onActiveInspectionType = function(msg)
  {
    __is_active_inspection = msg.inspection_type == 'object';
  }

  messages.addListener('active-inspection-type', onActiveInspectionType);

  var onRuntimeDestroyed = function(msg)
  {
    if(__selectedObject && __selectedObject.rt_id == msg.id )
    {
      __selectedObject = null;
      views.frame_inspection.clearAllContainers();
    }

  }

  messages.addListener('runtime-destroyed', onRuntimeDestroyed);
  
}

Object_inspection.prototype = ObjectDataBase;
object_inspection = new Object_inspection();

