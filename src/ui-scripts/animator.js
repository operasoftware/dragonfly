/**
  * @constructor 
  */

var Animator = function(target)
{
  var id = target.id;
  var delta = target.delta;
  var iterations = target.iterations;
  var busy = target.busy || 0;
  var ready = target.ready || 0;
  var x_position = target.x_position || '0px ';
  var time_delta = target.time_delta || 30;
  var current_count = 0;
  var interval = 0;

  var spin = function(ele)
  {
    if( ele = document.getElementById(id) )
    {
      ele.style.backgroundPosition = x_position + ( busy + ( current_count++ ) * delta ) + 'px';
      if( current_count >= iterations )
      {
        current_count = 0;
      }
    }
  }

  this.is_busy = function()
  {
    interval = interval ? interval : setInterval( spin, time_delta);
  }

  this.is_ready = function(ele)
  {
    interval = interval ? clearInterval(interval) : 0;
    if( ele = document.getElementById(id) )
    {
      ele.style.backgroundPosition = x_position + ( ready ) + 'px';
      current_count = 0;
    }
  }

  this.is_inactive = function(ele)
  {
    interval = interval ? clearInterval(interval) : 0;
    if( ele = document.getElementById(id) )
    {
      ele.style.backgroundPosition = x_position + ( 0 ) + 'px';
      current_count = 0;
    }
  }

  this.getId = function()
  {
    return id;
  }

}