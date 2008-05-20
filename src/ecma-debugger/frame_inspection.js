var Frame_inspection = function()
{

  const 
  KEY = 0,
  VALUE = 1;

  var __selectedObject = null;
  var __views = ['frame_inspection'];

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
    return settings['frame_inspection'].get("hide-default-properties-in-global-scope") 
      && js_default_global_scope_properties || null;
  }

  this.examineObject = function(rt_id, obj_id)
  {
    __selectedObject = {rt_id: rt_id, obj_id: obj_id};
    self.setObject(rt_id, obj_id);
    var view_id = '', i = 0;
    for ( ; view_id = __views[i] ; i++)
    {
      views[view_id].update();
    }
  }

  var handleShowGlobalScope = function(xml, rt_id)
  {
    if( xml.getNodeData('status') == 'completed' )
    {
      frame_inspection.examineObject(rt_id, xml.getNodeData('object-id'));
    }
    else
    {
      opera.postError('getting window id has failed in handleShowGlobalScope in frame_inspection');
    }
  }

  this.showGlobalScope = function(rt_id)
  {
    var tag = tagManager.setCB(null, handleShowGlobalScope, [rt_id]);
    var script = "return window";
    services['ecmascript-debugger'].eval(tag, rt_id, '', '', script);
  }

  var onFrameSelected = function(msg)
  { 
    var frame = stop_at.getFrame(msg.frame_index);
    if( frame )
    {
      __selectedObject = {rt_id: frame.rt_id, obj_id: frame.scope_id};
      var virtualProperties =
      [
        [
          'arguments',
          frame.argument_id,
          'object',
          0
        ],
        [
          'this',
          frame.this_id == '0' ? frame.rt_id : frame.this_id,
          'object',
          0
        ]
      ];
      self.setObject(__selectedObject.rt_id, __selectedObject.obj_id, virtualProperties);
    }
    else
    {
      __selectedObject = null;
      self.clearData();
    }
    var view_id = '', i = 0;
    for ( ; view_id = __views[i] ; i++)
    {
      views[view_id].update();
    }
  }

  var onObjectSelected = function(msg)
  { 
    __selectedObject = {rt_id: msg.rt_id, obj_id: msg.obj_id};
    self.setObject(__selectedObject.rt_id, __selectedObject.obj_id);
    var view_id = '', i = 0;
    for ( ; view_id = __views[i] ; i++)
    {
      views[view_id].update();
    }
  }

  messages.addListener('frame-selected', onFrameSelected);
  messages.addListener('object-selected', onObjectSelected);
  
}

Frame_inspection.prototype = ObjectDataBase;
frame_inspection = new Frame_inspection();

