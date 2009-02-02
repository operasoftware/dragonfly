/**
  * @constructor 
  */

var SlideViews = function(container)
{
  const VER = 'v', HOR = 'h';
  var self = this; 
  var focus_catcher = null;

  var mousedownevents = null;

  var resizehandler = function()
  {
    if( !self.checkDimesions() )
    {
      self.cell.update(self.cell.left, self.cell.top, true);
    }
  }

  var _target = null;

  var _delta = 0;

  var _event = null;

  var interval = 0;

  var intervaled_mousemovehandler = function(event)
  {
    _target.handleResizeEvent(_event, _delta);
    
  } 

  var mousemovehandler = function(event)
  {
    _event = event;
    focus_catcher.focus();
  }

  var mouseuphandler = function(event)
  {
    clearInterval(interval);
    _event = event;
    intervaled_mousemovehandler();
    document.removeEventListener('mousemove', mousemovehandler, false);
    document.removeEventListener('mouseup', mouseuphandler, false);
    _target = null;
    _delta = 0;
    _event = null;
  }

  var mousedownhandler = function(event)
  {
    var ele = event.target;
    if( ele.nodeName.indexOf(defaults.slider_name) == 0 )
    {
      event.stopPropagation();
      event.preventDefault();
      var target = CellBase.getCellById(ele.id.slice(11));
      _event = event;
      if( target )
      {
        _target = target;
        _delta =  event[target.dir == HOR ? 'offsetY' : 'offsetX'] + 2 * defaults.view_border_width;
        document.addEventListener('mousemove', mousemovehandler, false);
        document.addEventListener('mouseup', mouseuphandler, false);
        interval = setInterval(intervaled_mousemovehandler, 15);
      }
      else
      {
        opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
          'missing target in mousedownhandler in slideViews');
      }

      if(!focus_catcher)
      {
        focus_catcher = UIBase.getFocusCatcher();
      }
      
    }
  }

  container.addEventListener('mousedown', mousedownhandler, false); 

}