helpers = new function()
{
  var self = this;


  var handleKeypress = function(event, id)
  {
    event.preventDefault();
    event.stopPropagation();
    var button = document.getElementById(id);
    if(button && !button.disabled)
    {
      button.click();
    }
  }


  var keypressListener = function(event)
  {
    if( event.which == 0 )
    {
      switch(event.keyCode)
      {
        case 116: // F5
        {
          handleKeypress(event, 'continue-run');
          break;
        }
        case 121: // F10
        {
          handleKeypress(event, 'continue-step-next-line');
          break;
        }
        case 122: // F11
        {
          if(event.shiftKey)
          {
            handleKeypress(event, 'continue-step-out-of-call');
          }
          else
          {
            handleKeypress(event, 'continue-step-into-call');
          }
          break;
        }
      }
    }
  }

  this.setSelected = function(event)
  {
    var ele=event.target;
    var siblings = ele.parentNode.getElementsByTagName(ele.nodeName), sibling = null, i=0;
    for( ; sibling = siblings[i]; i++)
    {
      if(sibling == ele) 
      {
        sibling.addClass('selected'); 
      }
      else
      {
        sibling.removeClass('selected'); 
      }
    }
  }
  
  document.addEventListener('keypress', keypressListener, true);




}