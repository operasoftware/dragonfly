/**
 * Generic search/higlight component that uses a backing store for its data
 * instead of the actual DOM. Used in the various code views where the DOM
 * content is generated on demand based on the view.
 * @see TextSearch
 * @see ListTextSearch
 * @constructor 
 */
var VirtualTextSearch = function()
{
  const 
  DEFAULT_STYLE = "background-color:#ff0; color:#000;",
  HIGHLIGHT_STYLE = "background-color:#0f0; color:#000;",
  DEFAULT_SCROLL_MARGIN = 50,
  SEARCH_DELAY = 50; // in ms

  var 
  self = this, 
  search_term = '',
  cursor = -1,
  container = null,
  source_container = null,
  source_container_parentNode = null,
  timeouts = new Timeouts(),
  __script = null,
  __offset = -1,
  __length = 0,
  __hit = [],
  __input = null,
  __last_match_cursor = 0,
 
  search_node = function(node) 
  {
    var cur_node = node && node.firstChild, pos = 0, hit = null, span = null, length = 0;
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
              __length -= length;
              __offset = 0;
            }
            cur_node = hit.splitText(length);
            span = node.insertBefore(node.ownerDocument.createElement('span'), hit);
            span.style.cssText = HIGHLIGHT_STYLE;
            span.appendChild(node.removeChild(hit));
            __hit[__hit.length] = span;
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

  this.clearHighlightSpan = function(ele)
  {
      var parent = ele.parentNode;
      parent.replaceChild(ele.firstChild, ele);
      parent.normalize();
  }
  
  this.clearHit = function()
  {
    __hit.forEach(this.clearHighlightSpan);
    __hit = [];
  }

  this.clearScriptContext = function()
  {
    if(__script)
    {
      delete __script.line_matches;
      delete __script.line_offsets;
      delete __script.match_cursor;
      delete __script.match_length;
    }
  }
  
  this.search = function(new_search_term)
  {    
    var
    pos = -1,
    source = '',
    line_arr = null,
    line_arr_length = 0,
    line_cur = 0;
    
    if( new_search_term != search_term )
    {
      search_term = new_search_term;
      if(new_search_term.length > 2)
      {
        self.clearHit();
        if( __script )
        {
          var line_matches = __script.line_matches = [];
          var line_offsets = __script.line_offsets = [];
          __script.match_cursor = 0;
          __script.match_length = search_term.length
          source = __script.source;
          line_arr = __script.line_arr;
          line_arr_length = line_arr.length
          while( ( pos = source.indexOf(search_term, pos + 1) ) != -1 )
          {
            while( line_cur < line_arr_length && line_arr[line_cur] <= pos && ++line_cur );
            line_matches[line_matches.length] = line_cur;
            line_offsets[line_offsets.length] = pos - line_arr[line_cur - 1];
          }
          if( __last_match_cursor )
          {
            if( __last_match_cursor < __script.match_length )
            {
              __script.match_cursor = __last_match_cursor;
            }
            __last_match_cursor = 0;
          }
          if( __script.line_matches.length )
          {
            self.highlight(true, new_search_term);
          }
          else
          {
            topCell.statusbar.updateInfo(ui_strings.S_TEXT_STATUS_SEARCH_NO_MATCH.
              replace("%(SEARCH_TERM)s", new_search_term));
          }
        }
      }
      else
      {
        if(__hit.length)
        {
          self.clearHit();
        }
        self.clearScriptContext();
        topCell.statusbar.updateInfo('');
        search_term = '';
      }
    }

  }

  this.searchDelayed = function(new_search_term)
  {
    timeouts.set(this.search, SEARCH_DELAY, new_search_term);
  }
  
  this.update = function()
  {
    var new_search_term = search_term;
    if( search_term.length > 2 )
    {
      search_term = '';
      this.search(new_search_term);
    }
  }

  this.highlight = function(set_match_cursor, new_search_term)
  {
    // new_search_term is passed to know the arguments.callee.caller context
    // highlight is called at the end of a succesful search and
    // on keyup if it was the enter key to highlight the next tolken
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
        var plus_lines = views.js_source.getMaxLines() <= 7 
          ? views.js_source.getMaxLines() / 2 >> 0 
          : 7;
        views.js_source.showLine(__script.id, line - plus_lines );
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
      if( __hit.length
         && __hit[0].offsetLeft > source_container_parentNode.scrollLeft + source_container_parentNode.offsetWidth )
      {
        source_container.parentNode.scrollLeft = __hit[0].offsetLeft - 50;
      }
      topCell.statusbar.updateInfo(ui_strings.S_TEXT_STATUS_SEARCH.
        replace("%(SEARCH_TERM)s", search_term).
        replace("%(SEARCH_COUNT_TOTAL)s", __script.line_matches.length).
        replace("%(SEARCH_COUNT_INDEX)s", __script.match_cursor + 1) );
      if( ++__script.match_cursor >= __script.line_matches.length )
      {
        __script.match_cursor = 0;
      }
      
    }
    // if the view was switched and the search tolken is still there
    // but no search was done jet for that new view 
    // keyup event callback, so new_search_term will be 'undefined'
    else if( new_search_term != search_term )
    {
      var new_search_term = search_term;
      search_term = '';
      this.search(new_search_term);
    }
    
  }

  this.setContainer = function(_container)
  {
    if(_container)
    {
      container = _container;
      source_container = null;
      source_container_parentNode = null;
    }
  }

  this.setFormInput = function(input)
  {
    if(input)
    {
      __input = input;
      if(search_term)
      {
        __input.value = search_term;
        __input.parentNode.firstChild.textContent = '';
        var new_search_term = search_term;
        search_term = '';
        this.search(new_search_term);
      }
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
    __last_match_cursor = __script && __script.match_cursor || 0;
    cursor = -1;
    self.clearScriptContext();
    self.clearHit();
    container = source_container = source_container_parentNode = __input = null;
    __offset = -1;
    topCell.statusbar.updateInfo('');
  }
  
};