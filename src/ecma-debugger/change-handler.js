/**
  * @constructor 
  * @deprecated
  * use EventHandler and BaseActions
  */

var change_handler = new function()
{
  var handler = function(event)
  {
    
    var handler = event.target.id;
    if(handler && handlers[handler])
    {
      handlers[handler](event);
    }
  }

  var handlers = {};

  handlers['radio-markup-view'] =  
    handlers['radio-dom-view'] = 
    handlers['checkbox-show-attributes'] = 
    handlers['checkbox-force-lower-case'] = 
    handlers['checkbox-show-comments'] = 
    handlers['checkbox-show-white-space-nodes'] =  
    function()
    { 
      views['dom-inspector'].update();
    }

  handlers['checkbox-highlight-on-hover'] = dom_data.highlight_on_hover;

  handlers['checkbox-find-element-with-click'] = dom_data.set_click_handler;


  this.post = function(handler, event)
  {
    if(handlers[handler])
    {
      handlers[handler](event);
    }
  }

  document.addEventListener('change', handler, false);
}
