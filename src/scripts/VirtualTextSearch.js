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
  search_results = [], // collection of span elements
  cursor = -1,
  container = null,
  source_container = null,
  source_container_parentNode = null,
  timeouts = new Timeouts(),
  __script = null,
  __offset = 0,
  __length = 0,
  __hit = null,
  //matches = null,
 
  search_node = function(node) 
  {
    var cur_node = node.firstChild, pos = 0, hit = null, span = null, length = 0;
    while( cur_node && __offset ) 
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
              __offset = 0;
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
    __hit.parentNode.replaceChild(__hit.firstChild, __hit);
    __hit = null;
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
        if(__hit)
        {
          self.clearHit();
        }
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
            while( line_cur < line_arr_length && line_arr[line_cur] < pos && ++line_cur );
            line_matches[line_matches.length] = line_cur;
            line_offsets[line_offsets.length] = pos - line_arr[line_cur - 1];
          }
          self.highlight();
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

  this.highlight = function()
  {
    if(__script && __script.line_matches && __script.line_matches.length )
    {
      var line = __script.line_matches[__script.match_cursor];
      if( views.js_source.showLine(__script.id, line - 7 ) )
      {
        var top_line = views.js_source.getTopLine();
        if( !source_container )
        {
          source_container_parentNode = container.getElementsByTagName('div')[0];
          source_container = container.getElementsByTagName('div')[1];
        }
        var div = source_container.getElementsByTagName('div')[line - top_line];
        __offset = __script.line_offsets[__script.match_cursor];
        __length = __script.match_length;
        __hit = null;
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
  }

  this.setContainer = function(_container)
  {
    if( container != _container )
    {
      container = _container;
    }
  }
  
  this.setScript = function(script)
  {
    __script = script;
  }

  this.cleanup = function()
  {
    search_therm = '';
    search_results = [];
    cursor = -1;
    container = null;
    source_container = null;
    source_container_parentNode = null;
    __offset = 0;
    __hit = null;
  }
  
};