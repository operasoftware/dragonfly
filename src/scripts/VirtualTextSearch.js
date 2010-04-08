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

  /* interface */

  this.search_delayed = function(new_search_term){};
  this.highligh_next = function(){};
  this.highligh_previous = function(){};
  this.update_hits = function(top_line, bottom_line){};
  this.set_container = function(container){};
  this.set_form_input = function(input){};
  this.set_script = function(script_obj){};
  this.cleanup = function(){};

  /* constants */

  const 
  DEFAULT_STYLE = document.styleSheets.getDeclaration ('.serach-highlight').cssText,
  HIGHLIGHT_STYLE = document.styleSheets.getDeclaration ('.serach-highlight-selected').cssText,
  DEFAULT_SCROLL_MARGIN = 50,
  SEARCH_DELAY = 50; // in ms

  /* private */

  var 
  self = this, 
  search_term = '',
  cursor = -1,
  container = null,
  source_container = null,
  source_container_parent = null,
  timeouts = new Timeouts(),
  __script = null,
  __offset = -1,
  __length = 0,
  __highlight_style = '', 
  __search_hits_valid = false,
  __top_line = 0,
  __bottom_line = 0,
  __hits = [],
  __hit = [],
  __input = null,
  __last_match_cursor = 0;

  var search = function(new_search_term)
  {    
    var pos = -1, source = '', line_arr = null, line_arr_length = 0, line_cur = 0;
    new_search_term = new_search_term.toLowerCase();
    if (new_search_term != search_term)
    {
      search_term = new_search_term;
      if(new_search_term.length > 2)
      {
        clear_hits();
        if (__script)
        {
          serach_source();
          if (__script.line_matches.length)
          {
            highlight(true, new_search_term);
            scroll_selected_hit_in_to_view();
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
        if (__hits.length)
        {
          clear_hits();
        }
        clear_script_context();
        topCell.statusbar.updateInfo('');
        search_term = '';
      }
    }
  }

  var serach_source = function()
  {
    __script.line_matches = [];
    __script.line_offsets = [];
    __script.match_cursor = 0;
    __script.match_length = search_term.length;

    var
    pos = -1,
    line_cur = 0,
    source = __script.source.toLowerCase(),
    line_arr = __script.line_arr,
    line_arr_length = line_arr.length,
    line_matches = __script.line_matches,
    line_offsets = __script.line_offsets;

    while ((pos = source.indexOf(search_term, pos + 1)) != -1)
    {
      while (line_cur < line_arr_length && line_arr[line_cur] <= pos)
      {
        ++line_cur;
      }
      line_matches[line_matches.length] = line_cur;
      line_offsets[line_offsets.length] = pos - line_arr[line_cur - 1];
    }
    if (__last_match_cursor)
    {
      if (__last_match_cursor < __script.match_length)
      {
        __script.match_cursor = __last_match_cursor;
      }
      __last_match_cursor = 0;
    }
  }

  var highlight = function(set_match_cursor, new_search_term)
  {
    // new_search_term is passed to know the arguments.callee.caller context
    // highlight is called at the end of a succesful search and
    // on keyup if it was the enter key to highlight the next tolken
    if (views.js_source.isvisible() &&
          __script && __script.line_matches && __script.line_matches.length)
    {
      var line = __script.line_matches[__script.match_cursor];
      __top_line = views.js_source.getTopLine();
      __bottom_line = views.js_source.getBottomLine();
      if (set_match_cursor)
      {
        __script.match_cursor = 0;
        while (__script.line_matches[__script.match_cursor] < __top_line)
        {
          __script.match_cursor++;
        }
        line = __script.line_matches[__script.match_cursor];
      }
      if (line < __top_line || line >= __bottom_line)
      {
        var plus_lines = views.js_source.getMaxLines() <= 7 
          ? views.js_source.getMaxLines() / 2 >> 0 
          : 7;
        views.js_source.showLine(__script.id, line - plus_lines, true);
        __top_line = views.js_source.getTopLine();
        __bottom_line = views.js_source.getBottomLine();
        __search_hits_valid = false;
      }
      if (!source_container)
      {
        source_container_parent = container.getElementsByTagName('div')[0];
        source_container = container.getElementsByTagName('div')[1];
      }
      // views.js_source.showLine can invalidate the current script source
      if (!__script.line_offsets) 
      {
        serach_source();
      }
      if (__search_hits_valid)
      {
        __hits.forEach(update_hit);
      }
      else
      {
        clear_hits();
        __script.line_matches.forEach(set_hit);
        __search_hits_valid = true;
      }
      topCell.statusbar.updateInfo(ui_strings.S_TEXT_STATUS_SEARCH.
        replace("%(SEARCH_TERM)s", search_term).
        replace("%(SEARCH_COUNT_TOTAL)s", __script.line_matches.length).
        replace("%(SEARCH_COUNT_INDEX)s", __script.match_cursor + 1) );
      __last_match_cursor = __script.match_cursor;
    }
    // if the view was switched and the search tolken is still there
    // but no search was done jet for that new view 
    // keyup event callback, so new_search_term will be 'undefined'
    else if (new_search_term != search_term)
    {
      var new_search_term = search_term;
      search_term = '';
      search(new_search_term);
    }
  }

  var search_node = function(node) 
  {
    var cur_node = node && node.firstChild, pos = 0, hit = null, span = null, length = 0;
    while (cur_node && __offset > -1) 
    {
      switch (cur_node.nodeType)
      {
        case 1:
        {
          search_node(cur_node);
          break;
        }
        case 3:
        {
          if (cur_node.nodeValue.length > __offset)
          {
            pos = __offset;
            hit = cur_node.splitText(pos);
            if ((length = hit.nodeValue.length) >= __length)
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
            span.style.cssText = __highlight_style;
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
  }

  var set_hit = function(line, index)
  {
    if (__top_line <= line && line <= __bottom_line)
    {
      __offset = __script.line_offsets[index];
      __length = __script.match_length;
      __highlight_style = index == __script.match_cursor && HIGHLIGHT_STYLE || DEFAULT_STYLE
      __hits[index] = __hit = [];
      search_node(source_container.getElementsByTagName('div')[line - __top_line]);
    }
  }

  var scroll_selected_hit_in_to_view = function()
  {
    source_container.parentNode.scrollLeft = 0;
    __hit = __hits[__script.match_cursor];
    if( __hit.length
       && __hit[0].offsetLeft > source_container_parent.scrollLeft + source_container_parent.offsetWidth )
    {
      source_container.parentNode.scrollLeft = __hit[0].offsetLeft - 50;
    }
  }

  var move_match_cursor = function(dir)
  {
    if (__script && __script.line_matches && __script.line_matches.length)
    {
      if (dir > 0)
      {
        if (--__script.match_cursor < 0 )
        {
          __script.match_cursor = __script.line_matches.length - 1;
        }
      }
      else
      {
        if (++__script.match_cursor >= __script.line_matches.length )
        {
          __script.match_cursor = 0;
        }
      }
      highlight();
      scroll_selected_hit_in_to_view();
    }
  }

  var update_hit = function(hit_arr, index)
  {
    hit_arr.forEach(index == __script.match_cursor && set_highlight_style || set_default_style);
  }

  var set_highlight_style = function(ele)
  {
    ele.style.cssText = HIGHLIGHT_STYLE;
  }

  var set_default_style = function(ele)
  {
    ele.style.cssText = DEFAULT_STYLE;
  }

  var clear_highlight_span = function(ele)
  {
    var parent = ele.parentNode;
    parent.replaceChild(ele.firstChild, ele);
    parent.normalize();
  }

  var clear_highlight_spans = function(hit)
  {
    hit.forEach(clear_highlight_span);
  }

  var clear_hits = function()
  {
    __hits.forEach(clear_highlight_spans);
    __hits = [];
    __hit = null;
    __search_hits_valid = false;
  }

  var clear_script_context = function()
  {
    if(__script)
    {
      __script.line_matches = null;
      __script.line_offsets = null;
      __script.match_cursor = null;
      __script.match_length = null;
    }
  }

  /* interface implemantation */

  this.search_delayed = function(new_search_term)
  {
    timeouts.set(search, SEARCH_DELAY, new_search_term);
  }

  this.highligh_next = function()
  {
    move_match_cursor(-1);
  }

  this.highligh_previous = function()
  {
    move_match_cursor(1);
  }

  this.update_hits = function(top_line, bottom_line)
  {
    if (search_term && __script && __script.line_matches && __script.line_matches.length)
    {
      clear_hits();
      __top_line = top_line;
      __bottom_line = bottom_line;
      __script.line_matches.forEach(set_hit);
      __search_hits_valid = true;
    }
  }

  this.set_container = function(_container)
  {
    if(_container)
    {
      container = _container;
      source_container = null;
      source_container_parent = null;
    }
  }

  this.set_form_input = function(input)
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
        search(new_search_term);
      }
    }
  }
  
  this.set_script = function(script)
  {
    __script = script;
    source_container = null;
    source_container_parent = null;
  }

  this.cleanup = function()
  {
    __last_match_cursor = __script && __script.match_cursor || 0;
    cursor = -1;
    clear_script_context();
    clear_hits();
    container = source_container = source_container_parent = __input = null;
    __offset = -1;
    topCell.statusbar.updateInfo('');
  }
  
};
