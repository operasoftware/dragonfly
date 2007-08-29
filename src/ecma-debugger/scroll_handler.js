var scroll_handler = new function()
{
  var handler = function(event)
  {
    var handler = event.target && event.target.getAttribute('handler');
    if(handler && handlers[handler])
    {
      handlers[handler](event);
    }
  }

  var handlers = {};

  handlers['scroll-js-source'] = function(event)
  {
    views.js_source.scroll();
  }


  this.init = function()
  {
    document.addEventListener('scroll', handler, false);
  }
}

