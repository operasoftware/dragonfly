/**
  * @constructor 
  * @extends ObjectDataBase
  */

var Frame_inspection_data = function()
{

  const 
  KEY = 0,
  VALUE = 1;

  var __selectedObject = null;
  var __views = ['inspection'];

  var __is_active_inspection = true;

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

  this.examineObject = function(rt_id, obj_id)
  {
    __selectedObject = {rt_id: rt_id, obj_id: obj_id};
    self.setObject(rt_id, obj_id);
    var view_id = '', i = 0;
    for ( ; view_id = __views[i] ; i++)
    {
      topCell.showView(views[view_id].id);
    }
  }

  var handleShowGlobalScope = function(status, message, rt_id)
  {
    const
    STATUS = 0,
    OBJECT_VALUE = 3,
    OBJECT_ID = 0;

    if( message[STATUS] == 'completed' )
    {
      frame_inspection_data.examineObject(rt_id, message[OBJECT_VALUE][OBJECT_ID]);
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        'getting window id has failed in handleShowGlobalScope in frame_inspection');
    }
  }

  this.showGlobalScope = function(rt_id)
  {
    var tag = tagManager.set_callback(null, handleShowGlobalScope, [rt_id]);
    var script = "return window";
    services['ecmascript-debugger'].requestEval(tag, [rt_id, 0, 0, script]);
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
    if( __is_active_inspection )
    {
      for ( ; view_id = __views[i] ; i++)
      {
        views[view_id].update();
        /*
        if( msg.frame_index == -1 )
        {
          views[view_id].update();
        }
        else
        {
          topCell.showView(views[view_id].id);
        }
        */
      }
    }
  }

  var onActiveInspectionType = function(msg)
  {
    __is_active_inspection = msg.inspection_type == 'frame';
  }

  messages.addListener('frame-selected', onFrameSelected);
  messages.addListener('active-inspection-type', onActiveInspectionType);
  

}

Frame_inspection_data.prototype = ObjectDataBase;
frame_inspection_data = new Frame_inspection_data();

