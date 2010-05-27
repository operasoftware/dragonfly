window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * @constructor 
  * @extends ObjectDataBase
  */
cls.EcmascriptDebugger["6.0"].FrameInspectionData = function(id)
{

  const KEY = 0, VALUE = 1;

  this._views = ['inspection'];
  this._is_active_inspection = true;
  this.filter_type = KEY;
  this.id = id;

  this.getSelectedObject = function()
  {
    return this._obj_id && {rt_id: this._rt_id, obj_id: this._obj_id} || null;
  }

  this._on_frame_selected = function(msg)
  { 
    var frame = stop_at.getFrame(msg.frame_index);
    if (frame)
    {
      var virtualProperties =
      [
        [
          'arguments',
          'object',
          ,
          [frame.argument_id, 0, 'object', ,'']
        ],
        [
          'this',
          'object',
          ,
          [frame.this_id == '0' ? frame.rt_id : frame.this_id, 0, 'object', , '']
        ]
      ];
      this.setObject(frame.rt_id, frame.scope_id, virtualProperties);
    }
    else
    {
      this.clearData();
    }
    
    if (this._is_active_inspection)
    {
      for (var view_id = '', i = 0; view_id = this._views[i]; i++)
      {
        views[view_id].update();
      }
    }
  };

  this._on_active_inspection_type = function(msg)
  {
    this._is_active_inspection = msg.inspection_type == 'frame';
  }

  messages.addListener('frame-selected', this._on_frame_selected.bind(this));
  messages.addListener('active-inspection-type', this._on_active_inspection_type.bind(this));
  
}
