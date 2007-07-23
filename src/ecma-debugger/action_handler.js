var action_handler = new function()
{
  var handler = function(event)
  {
    var handler = event.target.getAttribute('handler');
    if(handler)
    {
      handlers[handler](event);
    }
  }

  var handlers = {};
  /*
"<examine-objects>" 
  "<tag>" UNSIGNED "</tag>"
  "<runtime-id>" UNSIGNED "</runtime-id>" 
  "<object-id>" UNSIGNED "</object-id>"*
"</examine-objects>"

  {
    var msg = "<runtimes>";
    var tag = tagManager.setCB(this, parseRuntime);
    msg += "<tag>" + tag +"</tag>";
    var i=0, r_t=0;
    for ( ; r_t = arguments[i]; i++)
    {
      msg += "<runtime-id>" + r_t +"</runtime-id>";
    }
    msg += "</runtimes>";
    proxy.POST("/" + service, msg);
  }

  <LI 
  handler="show-frame" 
  runtime_id="1" 
  argument_id="0" 
  scope_id="0" 
  line="3" 
  script_id="1">anonymous line 3 script id 1</LI>

  */

  handlers['show-frame'] = function(event)
  {
    var ele = event.target;
    var runtime_id = ele.getAttribute('runtime_id');
    var container = document.getElementById('examine-objects');
    container.innerHTML = '';
    var tag = tagManager.setCB(null, responseHandlers.examinFrame, [runtime_id, container, ele.getAttribute('argument_id')]);
    helpers.examine_objects( runtime_id, tag, ele.getAttribute('scope_id') );
  }

  handlers['examine-object'] = function(event)
  {
    var ele = event.target.parentNode, list = null;
    if( list = ele.getElementsByTagName('ul')[0] )
    {
      ele.removeChild(list);
      event.target.style.removeProperty('background-position');
    }
    else
    {
      var runtime_id = ele.getAttribute('runtime-id');
      var tag = tagManager.setCB(null, responseHandlers.examinObject, [runtime_id, ele]);
      helpers.examine_objects( runtime_id, tag, ele.getAttribute('object-id') );
      event.target.style.backgroundPosition = '0 -11px';
    }
  }

  this.init = function()
  {
    document.addEventListener('click', handler, false);
  }
}