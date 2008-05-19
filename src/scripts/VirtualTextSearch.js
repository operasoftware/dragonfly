var VirtualTextSearch = function()
{
  const 
  DEFAULT_STYLE = "background-color:#ff0; color:#000;",
  HIGHLIGHT_STYLE = "background-color:#0f0; color:#000;",
  DEFAULT_SCROLL_MARGIN = 50,
  SEARCH_DELAY = 50;



  var 
  self = this, 
  search_therm = '',
  cursor = -1,
  container = null,
  source_container = null,
  source_container_parentNode = null,
  timeouts = new Timeouts(),
  __script = null,
  __offset = -1,
  __length = 0,
  __hit = null,
  __input = null,
 
  search_node = function(node) 
  {
    var cur_node = node.firstChild, pos = 0, hit = null, span = null, length = 0;
    while( cur_node && __offset > -1 ) 
    {
      switch(cur_node.nodeType)
      {
        case 1:
        {
          search_node(cur_node);
          break;
        }
        case 3:
        {
          if( cur_node.nodeValue.length > __offset )
          {
            pos = __offset;
            hit = cur_node.splitText(pos);
            if( ( length = hit.nodeValue.length ) >= __length )
            {
              length = __length;
              __offset = -1;
            }
            else
            {
              __length = __offset = __length - length;
            }
            cur_node = hit.splitText(length);
            span = node.insertBefore(node.ownerDocument.createElement('span'), hit);
            span.style.cssText = HIGHLIGHT_STYLE;
            span.appendChild(node.removeChild(hit));
            if( !__hit )
            {
              __hit = span;
            }
          }
          else
          {
            __offset -= cur_node.nodeValue.length;
          }
          break;
        };
      }
      cur_node = cur_node.nextSibling;
    }
  };
  
  this.clearHit = function()
  {
    if( __hit )
    {
      var parent = __hit.parentNode;
      parent.replaceChild(__hit.firstChild, __hit);
      parent.normalize();
      __hit = null;
    }
  }
  

  this.search = function(new_search_therm)
  {    
    var
    pos = -1,
    source = '',
    line_arr = null,
    line_arr_length = 0,
    line_cur = 0;

    if( new_search_therm && new_search_therm != search_therm )
    {
      if(new_search_therm.length > 2)
      {
        search_therm = new_search_therm;
        self.clearHit();
        if( __script )
        {
          var line_matches = __script.line_matches = [];
          var line_offsets = __script.line_offsets = [];
          __script.match_cursor = 0;
          __script.match_length = search_therm.length
          source = __script.source;
          line_arr = __script.line_arr;
          line_arr_length = line_arr.length
          while( ( pos = source.indexOf(search_therm, pos + 1) ) != -1 )
          {
            while( line_cur < line_arr_length && line_arr[line_cur] <= pos && ++line_cur );
            line_matches[line_matches.length] = line_cur;
            line_offsets[line_offsets.length] = pos - line_arr[line_cur - 1];
          }
          self.highlight(true);
          topCell.statusbar.updateInfo('matches for "' + search_therm + '": ' +line_matches.length );
        }
      }
      else
      {
        if(__hit)
        {
          self.clearHit();
        }
        topCell.statusbar.updateInfo('');
        search_therm = '';
      }
    }

  }

  this.searchDelayed = function(new_search_therm)
  {
    timeouts.set(this.search, SEARCH_DELAY, new_search_therm);
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

  this.highlight = function(set_match_cursor)
  {
    if( views.js_source.isvisible() 
        && __script 
        && __script.line_matches 
        && __script.line_matches.length )
    {
      var line = __script.line_matches[__script.match_cursor];
      var top_line = views.js_source.getTopLine();
      var bottom_line = views.js_source.getBottomLine();
      if(set_match_cursor)
      {
        __script.match_cursor = 0;
        while( __script.line_matches[__script.match_cursor] < top_line )
        {
          __script.match_cursor++;
        }
        line = __script.line_matches[__script.match_cursor];
      }
      if( line <= top_line || line >= bottom_line )
      {
        views.js_source.showLine(__script.id, line - 7 );
        top_line = views.js_source.getTopLine();
      }
      if( !source_container )
      {
        source_container_parentNode = container.getElementsByTagName('div')[0];
        source_container = container.getElementsByTagName('div')[1];
      }
      var div = source_container.getElementsByTagName('div')[line - top_line];
      __offset = __script.line_offsets[__script.match_cursor];
      __length = __script.match_length;
      self.clearHit();
      search_node(div);
      source_container.parentNode.scrollLeft = 0;
      if( __hit
         && __hit.offsetLeft > source_container_parentNode.scrollLeft + source_container_parentNode.offsetWidth )
      {
        source_container.parentNode.scrollLeft = __hit.offsetLeft - 50;
      }
      topCell.statusbar.updateInfo('matches for "' + 
        search_therm + '": ' + __script.line_matches.length +', match ' + __script.match_cursor );
      if( ++__script.match_cursor >= __script.line_matches.length )
      {
        __script.match_cursor = 0;
      }
      
    }
  }

  this.setContainer = function(_container)
  {
    if( container != _container )
    {
      container = _container;
      source_container = null;
      source_container_parentNode = null;
    }
  }

  this.setFormInput = function(input)
  {
    __input = input;
    if(search_therm)
    {
      __input.value = search_therm;
      __input.parentNode.firstChild.textContent = '';
    }
  }
  
  this.setScript = function(script)
  {
    __script = script;
    source_container = null;
    source_container_parentNode = null;
  }

  this.cleanup = function()
  {
    cursor = -1;
    container = source_container = source_container_parentNode = __hit = __input = null;
    __offset = -1;
  }
  
};