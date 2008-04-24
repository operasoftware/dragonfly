var Frame_inspection = function()
{
  var __selectedObject = null;
  var __views = ['frame_inspection'];

  this.rt_id = '';
  this.data = [];

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
          frame.this_id,
          'object',
          0
        ]
      ];
      self.setObject(__selectedObject.rt_id, __selectedObject.obj_id, virtualProperties);
      var view_id = '', i = 0;
      for ( ; view_id = __views[i] ; i++)
      {
        views[view_id].update();
      }
    }
    else
    {
      opera.postError('failed in frame_inspection.onFrameSelected');
    }
  }

  messages.addListener('frame-selected', onFrameSelected);
}

Frame_inspection.prototype = ObjectDataBase;
frame_inspection = new Frame_inspection();

