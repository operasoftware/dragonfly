/**
  * @constructor 
  */

var TextSearch = function()
{
  const 
  DEFAULT_STYLE = "background-color:#ff0; color:#000;",
  HIGHLIGHT_STYLE = "background-color:#0f0; color:#000;",
  DEFAULT_SCROLL_MARGIN = 50,
  SEARCH_DELAY = 50;

  var 
  self = this, 
  search_therm = '',
  search_results = [], // collection of span elements
  cursor = -1,
  container = null,
  __input = null,
  timeouts = new Timeouts(), 

  span_set_default_style = function(span)
  {
    span.style.cssText = DEFAULT_STYLE;
  },
  span_set_highlight_style = function(span)
  {
    span.style.cssText = HIGHLIGHT_STYLE;
  },
  check_parent = function(hit)
  {
    return hit[0].parentElement;
  },
  search_node = function(node) 
  {
    var 
    text_content = container.textContent.toLowerCase(),
    matches = [],
    match_cursor = 0,
    match = 0,
    matches_length = 0,
    pos = 0,
    last_pos = 0,
    search_term_length = search_therm.length,
    consumed_total_length = 0,
    to_consume_hit_length = 0,
    span = null,
    search_result = null,

    consume_node = function(node)
    {
      if( node && ( match_cursor < matches_length || to_consume_hit_length ) )
      {
        switch(node.nodeType)
        {
          case 1:
          {
            consume_node(node.firstChild);
            break;
          }
          case 3:
          {
            if(to_consume_hit_length)
            {
              if( node.nodeValue.length >= to_consume_hit_length )
              {
                node.splitText(to_consume_hit_length);
              }
              to_consume_hit_length -= node.nodeValue.length;
              search_result[search_result.length] = span = document.createElement('span');
              node.parentNode.replaceChild(span, node);
              span.appendChild(node);
              span.style.cssText = DEFAULT_STYLE;
              consumed_total_length += node.nodeValue.length;
              node = span;
            }
            else
            {
              if( match - consumed_total_length < node.nodeValue.length )
              {
                node.splitText(match - consumed_total_length);
                match = matches[++match_cursor];
                to_consume_hit_length = search_term_length;
                search_result = search_results[search_results.length] = [];
              }
              consumed_total_length += node.nodeValue.length;
            }
          }
        }
        consume_node(node.nextSibling);
      }
    };
    while( ( pos = text_content.indexOf(search_therm, last_pos) ) != -1 ) 
    { 
      matches[matches.length] = pos;
      last_pos = pos + search_term_length;
    }
    search_results = [];
    matches_length = matches.length;
    match = matches[match_cursor];
    consume_node(container);
  },
    
  update_status_bar = function()
  {
    topCell.statusbar.updateInfo(ui_strings.S_TEXT_STATUS_SEARCH.
      replace("%(SEARCH_TERM)s", search_therm).
      replace("%(SEARCH_COUNT_TOTAL)s", search_results.length).
      replace("%(SEARCH_COUNT_INDEX)s", ( cursor + 1 )) );
  };
  
  this.search = function(new_search_therm, old_cursor)
  {
    var cur = null, i = 0, parent = null, search_hit = null, j = 0;
    if( new_search_therm != search_therm )
    {
      search_therm = new_search_therm;
      if(search_results)
      {
        for( ; cur = search_results[i]; i++)
        {
          for( j = 0; search_hit = cur[j]; j++)
          {
            if( parent = search_hit.parentNode )
            {
              parent.replaceChild(search_hit.firstChild, search_hit);
              parent.normalize();
            }
          }
        }
      }
      search_results = [];
      cursor = -1;
      if( search_therm.length > 2 )
      {
        if(container)
        {
          search_node(container);
          if( old_cursor && search_results[old_cursor] )
          {
            cursor = old_cursor;
            search_results[cursor].style.cssText = HIGHLIGHT_STYLE;
            update_status_bar();
          }
          else
          {
            self.highlight(true);
          }
        }
      }
      else
      {
        topCell.statusbar.updateInfo('');
      }
    }
  }

  this.searchDelayed = function(new_search_therm)
  {
    timeouts.set(this.search, SEARCH_DELAY, new_search_therm.toLowerCase());
  }
  
  this.update = function()
  {
    var new_search_therm = search_therm;
    if( search_therm.length > 2 )
    {
      search_therm = '';
      this.search(new_search_therm);
    }
  }

  this.highlight = function(check_position)
  {
    if(search_results.length)
    {
      if( cursor >= 0 )
      {
        search_results[cursor].forEach(span_set_default_style);
      }
      if( check_position )
      {
        cursor = 0;
        while( search_results[cursor] && search_results[cursor][0].offsetTop < 0  )
        {
          cursor++;
        }
      }
      else
      {
        cursor++;
      }
      if( cursor > search_results.length - 1)
      {
        cursor = 0;
      }
      search_results[cursor].forEach(span_set_highlight_style);
      if( !check_position || search_results[cursor][0].offsetTop > DEFAULT_SCROLL_MARGIN )
      {
        container.scrollTop += search_results[cursor][0].offsetTop - DEFAULT_SCROLL_MARGIN;
      }
      update_status_bar();
    }
  }

  this.revalidateSearch = function()
  {
    if( !search_results.every(function(hit){ return hit[0].parentElement } ) )
    {
      var new_search_therm = search_therm;
      search_therm = '';
      this.search(new_search_therm, cursor);
    }
  }

  this.setContainer = function(_container)
  {
    if( container != _container )
    {
      container = _container;
    }
  }

  this.setFormInput = function(input)
  {
    __input = input;
    if(search_therm)
    {
      var new_search_therm = search_therm;
      __input.value = search_therm;
      __input.parentNode.firstChild.textContent = '';
      search_therm = '';
      this.searchDelayed (new_search_therm);
    }
  }

  this.cleanup = function()
  {
    search_results = [];
    cursor = -1;
    __input = container = null;
  }
  
};