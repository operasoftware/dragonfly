
/**
 * Generic search/highlight component that uses a backing store for its data
 * instead of the actual DOM. Used in the various code views where the DOM
 * content is generated on demand based on the view, e.g. where only the 
 * visible lines of a given script are created in the DOM.
 * Use case is basically where the DOM view is only a slice of the actual data.
 * @see TextSearch
 * @see ListTextSearch
 * @constructor 
 */
var VirtualTextSearch = function()
{

  /* interface */

  /**
    * Initiate the search of a new search term.
    *
    * @param {String} new_search_term 
    */
  this.search_delayed = function(new_search_term){};
  /**
    * Highlight the next match if any.
    */
  this.highligh_next = function(){};
  /**
    * Highlight the previous match if any.
    */
  this.highligh_previous = function(){};
  /**
    * Update the a new create view.
    *
    * @param {Number} top_line The start of the visible slice in line count
    * @param {Number} bottom_line The end of the visible slice in line count
    */
  this.update_hits = function(top_line, bottom_line){};
  /**
    * Register the DOM element of the view.
    *
    * @param {Element} The DOM element with the visible view.
    */
  this.set_container = function(container){};
  /**
    * Register the DOM input to enter a search.
    * This is not used to trigger the search, 
    * but to update a view and it's search box 
    * if a given view is re-created, e.g. on switching tabs.
    *
    * @param {HTMLInputElement}
    */
  this.set_form_input = function(input){};
  /**
    * To register the script data.
    * the script object must have at least the following properties:
    *  - source, the script source string
    *  - line_arr, a list of character offsets for all new lines
    */
  this.set_script = function(script_obj){};
  /**
    * To reset any state.
    */
  this.cleanup = function(){};

  /* constants */

  const 
  DEFAULT_STYLE = document.styleSheets.getDeclaration ('.search-highlight').cssText,
  HIGHLIGHT_STYLE = document.styleSheets.getDeclaration ('.search-highlight-selected').cssText,
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
  __hits = [], // list of DOM highlight elements for all matches
  __hit = [],  // list of DOM highlight elements for a single match
  __input = null,
  __last_match_cursor = 0;

  /**
    * Starts a new search.
    */
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
          search_source();
          if (__script.line_matches.length)
          {
            highlight(true);
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

  /**
    * Searches the actual data.
    * Updates the __script object with the following properties for all matches:
    *   - line_matches, a list of all matches in the source, 
    *     the values are the lines numbers of a given match
    *   - line_offsets, a list of all matches in the source,
    *     the values are the character offset in the line of the match
    *   - match_cursor, pointing to the selected match
    *   _ match_length, the length of the search term
    */
  var search_source = function()
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

  /**
    * Initiate the search in the actual DOM.
    * Scroll the view to the correct slice if needed.
    * 
    * @param {Boolean} set_match_cursor 
    *     If true the match cursor is set starting from the current top line
    *     (so that the view doesn't scroll if there is a match in the visible slice).
    */
  var highlight = function(set_match_cursor)
  {
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
        search_source();
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
  }

  /**
    * Create the highlight spans in a DOM element 
    * which represents a line of the source file.
    * __offset and __length are variables of the scope of the class.
    * The function is called recursively on all nodes in there flow 
    * of the containing line node till the two values are consumed.
    *
    * @param {Element} node The DOM element which represents a line of the source file.
    */
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

  /**
    * Helper to initiate the search in a single line.
    */
  var set_hit = function(line, index)
  {
    if (__top_line <= line && line <= __bottom_line)
    {
      __offset = __script.line_offsets[index];
      __length = __script.match_length;
      __highlight_style = index == __script.match_cursor && HIGHLIGHT_STYLE || DEFAULT_STYLE;
      __hits[index] = __hit = [];
      search_node(source_container.getElementsByTagName('div')[line - __top_line]);
    }
  }

  /**
    * Helper to scroll the view vertically if the selected match is not in the view.
    */
  var scroll_selected_hit_in_to_view = function()
  {
    source_container.parentNode.scrollLeft = 0;
    __hit = __hits[__script.match_cursor];
    if (__hit.length
       && __hit[0].offsetLeft > source_container_parent.scrollLeft + source_container_parent.offsetWidth)
    {
      source_container.parentNode.scrollLeft = __hit[0].offsetLeft - 50;
    }
  }

  /**
    * Helper to update the match cursor.
    */
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

  /**
    * Helper to update the css style in list of matches.
    */
  var update_hit = function(hit_arr, index)
  {
    hit_arr.forEach(index == __script.match_cursor && set_highlight_style || set_default_style);
  }

  /**
    * Helper to update the css style of a single DOM element.
    */
  var set_highlight_style = function(ele)
  {
    ele.style.cssText = HIGHLIGHT_STYLE;
  }

  /**
    * Helper to update the css style of a single DOM element.
    */
  var set_default_style = function(ele)
  {
    ele.style.cssText = DEFAULT_STYLE;
  }

  /**
    * Helper to remove a list of highlight elements from the DOM.
    */
  var clear_highlight_spans = function(hit)
  {
    hit.forEach(clear_highlight_span);
  }

  /**
    * Helper to remove a highlight element from the DOM.
    */
  var clear_highlight_span = function(ele)
  {
    var parent = ele.parentNode;
    parent.replaceChild(ele.firstChild, ele);
    parent.normalize();
  }


  /**
    * Helper to reset the list of highlight elements.
    */
  var clear_hits = function()
  {
    __hits.forEach(clear_highlight_spans);
    __hits = [];
    __hit = null;
    __search_hits_valid = false;
  }

  /**
    * Helper to reset the search data.
    */
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

  /* interface implementation */

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