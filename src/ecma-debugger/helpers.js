/**
 * @fileoverview
 * <strong>fixme: Deprecated. marked for removal</strong>
 */

/**
  * @constructor 
  * @deprecated
  * use EventHandler and BaseActions
  */

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
        case 119: // F8
        {
          event.preventDefault();
          handleKeypress(event, 'continue-run');
          break;
        }
        case 121: // F10
        {
          event.preventDefault();
          handleKeypress(event, 'continue-step-next-line');
          break;
        }
        case 122: // F11
        {
          event.preventDefault();
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
    var parent = ele.parentNode;
    var siblings = parent.getElementsByTagName(ele.nodeName), sibling = null, i=0;
    for( ; sibling = siblings[i]; i++)
    {
      if( sibling.parentElement == parent )
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
  }

  this.shortenURI = function(uri)
  {
    var ret_uri = uri;
    var title = '';
    var max_length = 40;
    if( ret_uri && ret_uri.length > max_length )
    {
      title = uri;
      ret_uri = uri.split('?')[0];
      if( ret_uri.length > max_length )
      {
        var temp = /\/([^/]+)$/.exec(ret_uri);
        if( temp )
        {
          ret_uri = temp[1];
        }
      }
    }
    return {uri: ret_uri, title: title};
  }

  this.resolveURLS = function(top_url, url)
  {
    return (
        /^.{4,5}:\/\//.test(url) && url
        || /^\//.test(url) && /^.{4,5}:\/\/[^/]*/.exec(top_url)[0] + url
        || top_url.replace(/\/[^/]*$/, "/") + url );
  }

  this.escapeTextHtml = function(str)
  {
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&(?!.{2,4};)/g, "&amp;");
  }
  
  document.addEventListener('keypress', keypressListener, true);




}