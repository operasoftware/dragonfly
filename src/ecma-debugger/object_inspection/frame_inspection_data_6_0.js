window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * @constructor 
  * @extends InspectionBaseData
  */
cls.EcmascriptDebugger["6.0"].FrameInspectionData = function(id, views)
{

  const KEY = 0, VALUE = 1;

  this._is_active_inspection = true;
  this.filter_type = KEY;

  this._on_frame_selected = function(msg)
  { 
    var frame = stop_at.getFrame(msg.frame_index);
    if (frame)
    {
      var virtual_properties =
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
      this.setObject(frame.rt_id, frame.scope_id, virtual_properties);
    }
    else
    {
      this.clearData();
    }
    
    if (this._is_active_inspection)
    {
      this._update_views();
    }
  };

  this._on_active_inspection_type = function(msg)
  {
    this._is_active_inspection = msg.inspection_type == 'frame';
  }

  this._init(id, views);
  window.messages.addListener('frame-selected', this._on_frame_selected.bind(this));
  window.messages.addListener('active-inspection-type', this._on_active_inspection_type.bind(this));
  
}
