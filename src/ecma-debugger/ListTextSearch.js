﻿/**
 * Generic search/higlight component that honours depths and
 * expanded/collapsed trees.
 * @see VirtualTextSearch
 * @see TextSearch
 * @constructor
 */
var ListTextSearch = function()
{
  const
  SEARCH_DELAY = 50; // in ms

  var
  self = this,
  search_term = '',
  search_results = [],
  cursor = -1,
  container = null,
  input = null,
  timeouts = new Timeouts(),
  cache = {},
  current_id = '',
  current_context = null,
  go_back = {},
  highlightColor = '';

  this.search = function(new_search_term)
  {
    var cur = null, cur_2 = null, depth = 0, display = '';

    if( new_search_term != search_term )
    {
      if(go_back[current_id])
      {
        delete go_back[current_id];
      }
      search_results = [];
      cache[current_id] = search_term = new_search_term;
      cur = container.getElementsByTagName('start-search-scope')[0];
      while( cur && ( cur = cur.nextSibling ) && cur.nodeName.toLowerCase() != "end-search-scope" )
      {
        display =
          cur.getElementsByTagName('key')[0].textContent.indexOf(search_term) == -1
          && 'none'
          || '';
        cur.style.display = display;
        if( !display )
        {
          search_results[search_results.length] = cur;
        }
        depth = parseInt( cur.getAttribute('depth'));
        cur_2 = cur;
        while( ( cur_2 = cur_2.nextSibling )
                  && cur_2.nodeName.toLowerCase() != "end-search-scope"
                  && ( parseInt( cur.getAttribute('depth')) < depth ) )
        {
          cur = cur_2;
          cur.style.display = display;
        }
      }
    }
  }

  this.searchDelayed = function(new_search_term)
  {
    timeouts.set(this.search, SEARCH_DELAY, new_search_term);
  }

  var __selected_element = null;

  var selectNextInput = function(start, next, direction)
  {
    var
    cur = __selected_element && __selected_element.parentNode
      || container.getElementsByTagName(start)[0],
    scrollTop = 0,
    scrollBottom = 0,
    targetTop = 0,
    targetBottom = 0;

    while( ( cur = cur[next] )
      && !( cur.nodeName.toLowerCase() == 'item'
      && cur.style.display != 'none'
      && ( cur.firstChild && /input/i.test(cur.firstChild.nodeName) ) ) );
    if( cur && cur.nodeName.toLowerCase() == 'item' )
    {
      if( __selected_element )
      {
        //__selected_element.parentNode.removeClass('selected');
        __selected_element.parentNode.style.removeProperty('background-color');
      }
      __selected_element = cur.firstChild;
      //cur.addClass('selected');
      cur.style.backgroundColor = highlightColor;
      scrollTop = container.scrollTop;
      scrollBottom = scrollTop + container.offsetHeight;
      targetTop = cur.offsetTop;
      targetBottom = targetTop + cur.offsetHeight;
      if( targetBottom > scrollBottom )
      {
        container.scrollTop += 50 + targetBottom - scrollBottom;
      }
      else if( targetTop < scrollTop )
      {
        container.scrollTop += targetTop - scrollTop - 50;
      }
    }
    else
    {
      container.scrollTop += direction * 50;
    }
  }


  this.handleKey = function(event, target)
  {
    event.stopPropagation();
    event.preventDefault();
    switch( event.keyCode)
    {
      case 40: // down
      {
        selectNextInput('start-search-scope', 'nextSibling', 1);
        break;
      }

      case 38: // up
      {
        selectNextInput('end-search-scope', 'previousSibling', -1);
        break;
      }

      case 13:
      {
        if( __selected_element )
        {
          __selected_element.click();
        }
        break;
      }

      default:
      {
        if( __selected_element )
        {
          __selected_element.parentNode.removeClass('selected');
          __selected_element = null;
        }

      }
    }
  }

  this.handleEnterKey = function()
  {
    switch( event.keyCode)
    {
      case 13:
      {
        if( search_results.length == 1 )
        {
          var _input = search_results[0].getElementsByTagName('input')[0];
          if( _input )
          {
            _input.click();
          }
        }
        break;
      }
      case 8:
      {
        if(input && !input.value)
        {
          var target = getTarget();
          if( target && ( target = target.getElementsByTagName('input')[0] ) )
          {
            // TODO this call causes problems
            if( go_back[current_id] )
            {
              target.click();
            }
            else
            {
              go_back[current_id] = 1;
            }
            //target.click();
          }
        }

        break;
      }
    }
  }

  var getTarget = function(str_id)
  {
    var items = null, item = null, i = 0;
    if( container && current_context )
    {
      items = container.getElementsByTagName('item');
      for( ; item = items[i]; i++)
      {
        if( item.getAttribute('obj-id') == current_context.obj_id
            && item.getAttribute('depth') == current_context.depth
            && item.getElementsByTagName('key')[0].textContent == current_context.key )
        {
          break;
        }
      }
    }
    return item;
  }

  this.onNewContext = function(msg)
  {
    current_context = msg;
    current_id = msg.rt_id + "." + msg.obj_id + "." + msg.depth;
    if( input )
    {
      if( cache[current_id] )
      {
        input.value = cache[current_id];
        //this.search(cache[current_id]);
      }
      else
      {
        input.value = '';
      }
    }
  }

  this.setInput = function(target)
  {
    input = target;
  }

  this.setContainer = function(_container)
  {
    if( container != _container )
    {
      container = _container;
      if( !highlightColor )
      {
        highlightColor =
          document.styleSheets.getPropertyValue('item.selected', 'background-color');
      }
    }
  }

  this.cleanup = function()
  {
    /*
    search_term = '';
    search_results = [];
    cursor = -1;
    */
    current_id = '';
    current_context = null;
    search_results = [];
    input = null;
    container = null;
  }

};
