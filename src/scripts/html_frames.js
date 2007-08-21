var verticalFrames = new function()
{
  /* settings */

  var vertical_frame_height = 150;
  var min_frame_height = 25;
  var intervalOnResize = 100;

  /* end settings */

  var resizeEvents = [];
  var mousemoveEvents = [];
  var resize_slider_height = 0;
  var resize_slider_delta = 0;
  var selection_catcher = null;
  var __container_top = 0;
  var __previous = null;
  var __next = null;

  var __start_ele = null;
  var __getstart_height = null;
  var self = this;

  var mousedownListener = function(event)
  {
    var slider = event.target;
    var container = slider.parentElement;
    __container_top = container.getTop();
    var children = container.getChildElements(), child = null, i = 0;
    for( ; child = children[i]; i++)
    {
      if ( child == slider )
      {
        __previous = children[i-1];
        __next = children[i+1];
        break;
      }
    }
    resize_slider_height = slider.offsetHeight;
    resize_slider_delta = event.offsetY;
    //document.documentElement.style.cursor='n-resize';
    document.addEventListener('mousemove', resize_frame_onmousemove_listener, false);
    document.addEventListener('mouseup', finish_frame_resize, false);
    selection_catcher = 
      document.getElementById('selection_catcher_container').getElementsByTagName('input')[0];
    selection_catcher.focus();
  }

  var resize_frame_onmousemove_listener = function(event)
  {
    clearMousemoveTimeouts();
    mousemoveEvents[mousemoveEvents.length] = setTimeout(resize_frame_onmousemove, 10, event)
  }

  var clearMousemoveTimeouts = function()
  {
    var c = null, i=0;
    for( ; c = mousemoveEvents[i]; i++) clearTimeout(c);
    mousemoveEvents = []
  }

  var resize_frame_onmousemove = function(event)
  {
    clearMousemoveTimeouts();
    selection_catcher.focus();
    var slider_top = event.pageY - __container_top - resize_slider_delta;
    var previous_offsetHeight = __previous.offsetHeight;
    var next_offsetHeight = __next.offsetHeight;
    var delta = slider_top - __previous.offsetTop - previous_offsetHeight;
    if(  delta < min_frame_height - previous_offsetHeight )
    {
      delta = min_frame_height - previous_offsetHeight;
    }
    else if (   delta > next_offsetHeight -min_frame_height)
    {
      delta = next_offsetHeight -min_frame_height
    }
    __previous.style.height = ( previous_offsetHeight 
      + delta  
      - getPaddingAndBorders(__previous) )+'px';
    __next.style.height = ( next_offsetHeight  
      - delta 
      - getPaddingAndBorders(__next) )+'px';
    if(__previous.hasClass('horizontal-frame-container'))
    {
      horizontalFrames.setFramesHeight(__previous, __previous.offsetHeight)
    }
    if(__next.hasClass('horizontal-frame-container'))
    {
      horizontalFrames.setFramesHeight(__next, __next.offsetHeight)
    } 
    messages.post('update-layout', {});
    
  }

  var finish_frame_resize = function(event)
  {
    document.removeEventListener('mousemove', resize_frame_onmousemove_listener, false);
    document.removeEventListener('mouseup', finish_frame_resize, false);
    
    //document.documentElement.style.removeProperty('cursor');
  }

  var resizeListener = function(event)
  {
    resizeEvents[resizeEvents.length] = setTimeout(handleResizeEvents, intervalOnResize);
  }

  var handleResizeEvents = function()
  {
    var cursor = 0,  length = resizeEvents.length, i=0;
    for ( ; cursor = resizeEvents[i]; i++)
    {
      clearTimeout(cursor);
    }
    resizeEvents = [];
    self.setUpFrames(__start_ele, __getstart_height());
    messages.post('update-layout', {});
  }

  this.setHeightFrames = function(container, height)
  {
    var _frames = container.getChildElements(), frame = null, i = 0,
      length = _frames.length;
    container.__height = height;
    for(i=0; frame = _frames[i]; i++)
    {
      if( frame.hasClass('vertical-frame') )
      {
        if( i == length-1 )
        {
          var new_height = height 
            - _frames[i-1].offsetTop - _frames[i-1].offsetHeight 
            - getPaddingAndBorders(frame);
          if( new_height > 0 )
          {
            frame.style.height = new_height +'px';
          }
        }
        else
        {
          frame.style.height = (vertical_frame_height)+'px';
        }
        /* horizontal frame container must have 0 padding and 0 border width */
        if(frame.hasClass('horizontal-frame-container'))
        {
          horizontalFrames.setUpFrames(frame, frame.offsetHeight)
        }
      }
    }
  }

  this.setUpFrames = function(container, height)
  {
    var _frames = null, frame =  null, length = 0, i = 0;
    if( !container.__init )
    {
      container.__init = true;
      _frames = container.getChildElements();
      length = _frames.length;
      for( i=0; frame = _frames[i]; i++ )
      {
        frame.addClass('vertical-frame');
        if( i != length-1 )
        {
          container.insertBefore(document.render(sliderTemplate()), _frames[i+1])
        }
      }
      if ( !document.getElementById('selection_catcher_container') )
      {
        document.body.render(selectionCatcherTemplate());
      }
    }
    self.setHeightFrames(container, height);
    document.addEventListener('resize', resizeListener, false);
  }

  this.init = function(ele, getHeight)
  {
    if( !__start_ele )
    {
      __start_ele = ele;
      __getstart_height = getHeight
    }
    self.setUpFrames(__start_ele, __getstart_height());
  }

  var getPaddingAndBorders = function(frame)
  {
    var style = window.getComputedStyle(frame, null);
    return 0 + 
      + parseInt(style['paddingTop']) + parseInt(style['paddingBottom']) 
      + parseInt(style['borderTopWidth']) + parseInt(style['borderBottomWidth']);
  }

  var sliderTemplate = function()
  {
    return ['div', 
      'class', 'vertical-frame-slider',
      'onmousedown', mousedownListener]
  }

  var selectionCatcherTemplate = function()
  {
    return ['div', ['input'], 'id', 'selection_catcher_container']
  }
 
}

/***** horizontal _frames *****/

var horizontalFrames = new function()
{
  /* settings */

  var min_frame_width = 50;
  var intervalOnResize = 100;

  /* end settings */

  var resize_slider_height = 0;
  var resize_slider_delta = 0;
  var selection_catcher = null;
  var is_resizing_frames = false;
  var __previous = null;
  var __next = null;
  var self = this;
  
  var mousedownListener = function(event)
  {
    var slider = event.target;
    var container = slider.parentElement;
    // the table, must have 0 padding and 0 border width */
    var children = container.getChildElements(), child = null, i = 0;
    for( ; child = children[i]; i++)
    {
      if ( child == slider )
      {
        __previous = children[i-1];
        __next = children[i+1];
        break;
      }
    }
    resize_slider_delta = event.offsetX;
    document.addEventListener('mousemove', resize_frame_onmousemove, false);
    document.addEventListener('mouseup', finish_frame_resize, false);
    selection_catcher = 
      document.getElementById('selection_catcher_container').getElementsByTagName('input')[0];
  }

  var resize_frame_onmousemove = function(event)
  {
    if( is_resizing_frames ) return;
    is_resizing_frames = true;
    selection_catcher.focus();
    /* TODO: container not over the whole window */
    var slider_left = event.pageX - resize_slider_delta;
    var previous_offsetWidth = __previous.offsetWidth;
    var next_offsetWidth = __next.offsetWidth;
    var delta = slider_left - __previous.offsetLeft - previous_offsetWidth;
    if( previous_offsetWidth + delta > min_frame_width 
      && next_offsetWidth - delta > min_frame_width )
    {
      __previous.style.width = ( previous_offsetWidth + delta  )+'px';
      __next.style.width = ( next_offsetWidth - delta )+'px';
      __next.style.cssText += '';
    }
    messages.post('update-layout', {});
    is_resizing_frames = false;
  }

  var finish_frame_resize = function(event)
  {
    document.removeEventListener('mousemove', resize_frame_onmousemove, false);
    document.removeEventListener('mouseup', finish_frame_resize, false);
    
  }

  this.setInitialFramesWidth = function(container)
  {
    var _frames = container.getChildElements(), frame = null, i = 0,
      length = _frames.length;
    for(i=0; frame = _frames[i]; i++)
    {
      if( frame.firstChild && i < length-1)
      {
        frame.style.width = frame.offsetWidth +'px';
      }
    }
  }

  this.setFramesHeight = function(container, height)
  {
    var _frames = container.getElementsByTagName('ul')[0].getChildElements(), 
      frame = null, firstChild = null, i = 0;
    for(i=0; frame = _frames[i]; i++)
    {
      if( firstChild = frame.firstChild )
      {
        firstChild.style.height = (height - getPaddingAndBorders(firstChild)) +'px';
        if(firstChild.hasClass('vertical-frame-container'))
        {
          verticalFrames.setUpFrames(firstChild, firstChild.offsetHeight);
        }
      }
    }
  }

  this.setUpFrames = function(container, height)
  {
    var _frames = null, frame = null, table = null, cell = null, 
      length = 0, i =  0;
    if( !container.__init )
    {
      container.__init = true;
      table = document.createElement('ul');
      table.className = 'table';
      //table.style.width='100%';
      
      _frames = container.getChildElements();
      length = _frames.length;
      for( i=0; frame = _frames[i]; i++ )
      {
        cell = table.render(['li']);
        frame.addClass('horizontal-frame');    
        cell.appendChild(container.removeChild(frame));
        if( i != length-1 )
        {
          table.render(sliderTemplate());
        }
      }
      container.appendChild(table);
      self.setInitialFramesWidth(table);
      if ( !document.getElementById('selection_catcher_container') )
      {
        document.body.render(selectionCatcherTemplate());
      }
    }
    self.setFramesHeight(container, height);
  }

  var getPaddingAndBorders = function(frame)
  {
    var style = window.getComputedStyle(frame, null);
    return 0 + 
      + parseInt(style['paddingTop']) + parseInt(style['paddingBottom']) 
      + parseInt(style['borderTopWidth']) + parseInt(style['borderBottomWidth']);
  }

  var sliderTemplate = function()
  {
    return ['li', 
      'class', 'horizontal-frame-slider',
      'onmousedown', mousedownListener
      ]
  }

  var selectionCatcherTemplate = function()
  {
    return ['div', ['input'], 'id', 'selection_catcher_container']
  }

}

