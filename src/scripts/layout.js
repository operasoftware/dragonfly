var Layout = function(container_id, rough_layout)
{
  const VER = 'v', HOR = 'h';
  var self = this; // most likely to bind listeners

  var mousedownevents = null;

  var resizehandler = function()
  {
    //opera.postError('check: '+self.checkDimesions());
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
    //_target.handleResizeEvent(event, _delta);
    
  }

  var mouseuphandler = function(event)
  {
    clearInterval(interval);
    _event = event;
    intervaled_mousemovehandler();
    document.removeEventListener('mousemove', mousemovehandler, false);
    document.removeEventListener('mouseup', mouseuphandler, false);
  }

  var mousedownhandler = function(event)
  {
    var ele = event.target;
    if( new RegExp('^' +Layout.defaults.slider_name + '$').test(ele.nodeName) )
    {
      var target = self.cell.getCellById(ele.id.slice(11));
      _event = event;
      if( target )
      {
        _target = target;
        _delta =  event[target.dir == HOR ? 'offsetY' : 'offsetX'] + 2 * Layout.defaults.view_border_width;
        document.addEventListener('mousemove', mousemovehandler, false);
        document.addEventListener('mouseup', mouseuphandler, false);
        interval = setInterval(intervaled_mousemovehandler, 15);
      }
      else
      {
        opera.postError('missing target in mousedownhandler in Layouts');
      }
      
    }
  }

  var oncreation = function(event)
  {
    if( event.target.id == self.container )
    {
      self.onshow();
    }
  }

  var ondestroy = function(event)
  {
    if( event.target.id == self.container )
    {
      // clean up
    }
  }

  var init = function(rough_layout)
  {
    if( rough_layout)
    {
      self.parse(rough_layout);
    }
    if( document.getElementById(self.container) )
    {
      self.onshow();
    }
  }

  this.cell = {left: 0, top: 0};

  this.container = container_id;

  this.onshow = function()
  {
    var layout = document.getElementById(this.container);
    if( layout )
    {
      layout.addEventListener('mousedown', mousedownhandler, false); 
    }
    else
    {
      opera.postError( 'layout does not exist in addListeners in Layout');
    }
    document.addEventListener('resize', resizehandler, false);
    this.checkDimesions();
    this.cell.update(this.cell.left, this.cell.top);
  }

  this.onhide = function()
  {

  }

  document.addEventListener('DOMNodeInserted', oncreation, false);
  document.addEventListener('DOMNodeRemoved', ondestroy, false);

  init(rough_layout);
}



Layout.prototype = new function()
{
  this.checkDimesions = function()
  {
    var layout = document.getElementById(this.container);
    var left = Layout.defaults.outer_border_width;
    var width = innerWidth - 2 * left;
    var top = layout.offsetTop + Layout.defaults.outer_border_width;
    var height = innerHeight - top - Layout.defaults.outer_border_width;
    var cell = this.cell;
    if( !( left == cell.left && top == cell.top && width == cell.width && height == cell.height ) )
    {
      cell.left = left;
      cell.top = top;
      cell.width = width;
      cell.height = height;
      cell.setDefaultDimensions();
      return false;
    }
    return true;
  }

  this.parse = function(layout_rough)
  {
    this.cell = new Cell(layout_rough, layout_rough.dir, null, this.container);
  }
}


// this is not good
Layout.defaults =
{
  min_height: 50,
  min_width: 50,
  maxHeight: 1000,
  maxWidth: 1000,
  container_name: 'view',
  slider_name: 'view-slider',
  border_width: 5,
  outer_border_width: 7,
  view_border_width: 1,
  name: 'layout'
}