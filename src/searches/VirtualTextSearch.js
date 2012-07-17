
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
var VirtualTextSearch = function(config)
{
  this._init(config);
};

var JSSearchWindowHighlight = function()
{
  this._init();
};

var JSSearchWindowHighlightPrototype = function()
{
  this._get_match_counts = TextSearch.prototype._get_match_counts;
  this._get_search_cursor = TextSearch.prototype._get_search_cursor;
  this.highlight_next = TextSearch.prototype.highlight_next;
  this.highlight_previous = TextSearch.prototype.highlight_previous;

  this.reset_match_cursor = function()
  {
    this._match_cursor = -1;
    this._hits = [];
    this._hit = null;
  };

  this.set_match_cursor = function(target)
  {
    var hit = null;
    for (var i = 0, hit = null; hit = this._hits[i]; i++)
    {
      if (hit.indexOf(target) != -1)
      {
        this._hits[this._match_cursor].forEach(this._set_default_style, this);
        this._match_cursor = i;
        this._hits[this._match_cursor].forEach(this._set_highlight_style, this);
        break;
      }
    }
  };

  this.get_match_cursor = function()
  {
    return this._match_cursor;
  };

};

var VirtualTextSearchBase = function()
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
  this.highlight_next = function(){};
  /**
    * Highlight the previous match if any.
    */
  this.highlight_previous = function(){};
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

  this.highlight_matches = function(script){};

  this.set_hit = function(node, offset, length, style, do_store, skip_query){};

  this.get_hit_count = function(){};

  this.update_search = function(){};

  // deprecated
  this.update = function(){};

  this.scroll_selected_hit_in_to_view = function(){};

  /* constants */

  const
  DEFAULT_SCROLL_MARGIN = 50,
  SEARCH_DELAY = 50, // in ms
  MIN_TERM_LENGTH = 1,
  NO_MATCH = 1,
  EMPTY = 2,
  DEFAULT_MATCH_CLASS = TextSearch.DEFAULT_MATCH_CLASS,
  SELECTED_MATCH_CLASS = TextSearch.SELECTED_MATCH_CLASS,
  DEFAULT_MATCH_MORE_CLASS = TextSearch.DEFAULT_MATCH_MORE_CLASS,
  SELECTED_MATCH_MORE_CLASS = TextSearch.SELECTED_MATCH_MORE_CLASS;

  /* private */

  this._init = function(config)
  {
    this._search_term = '';
    this._cursor = -1;
    this._container = null;
    this._source_container = null;
    this._source_container_parent = null;
    this._timeouts = new Timeouts();
    this._script = null;
    this._offset = -1;
    this._length = 0;
    this._highlight_style = '';
    this._search_hits_valid = false;
    this._top_line = 0;
    this._bottom_line = 0;
    this._hits = []; // list of DOM highlight elements for all matches
    this._hit = [];  // list of DOM highlight elements for a single match
    this._input = null;
    this._last_match_cursor = 0;
    this._search_bound = this._search.bind(this);
    if (config)
    {
      if (config.css_classes)
      {
        ["selected_match_class",
         "selected_match_class_first",
         "selected_match_class_between",
         "selected_match_class_last"].forEach(function(class_)
        {
          if (config.css_classes.hasOwnProperty(class_))
            this["_" + class_] = config.css_classes[class_];
        }, this);
      }
    }
  };

  /**
    * Starts a new search.
    */
  this._search = function(new_search_term)
  {
    var pos = -1, source = '', line_arr = null, line_arr_length = 0, line_cur = 0;
    new_search_term = new_search_term.toLowerCase();
    if (new_search_term != this._search_term)
    {
      this._search_term = new_search_term;
      this.post_message("onbeforesearch",
                        {search_term: this._search_term.length >= MIN_TERM_LENGTH ?
                                      this._search_term : ""});
      if (new_search_term.length >= MIN_TERM_LENGTH)
      {
        this._clear_hits();
        if (this._script)
        {
          this._search_source();
          if (this._script.line_matches.length)
          {
            this._highlight(true);
            this.scroll_selected_hit_in_to_view();
          }
          else
          {
            this._update_info(NO_MATCH);
          }
        }
      }
      else
      {
        if (this._hits.length)
        {
          this._clear_hits();
        }
        this._search_term = '';
        this._update_info(EMPTY);
      }
    }
  };

  this._search_source = function()
  {
    if (this._search_term != this._script.search_term)
    {
      this._script.search_source(this._search_term);
      if (this._last_match_cursor)
      {
        if (this._last_match_cursor < this._script.line_matches.length)
        {
          this._script.match_cursor = this._last_match_cursor;
        }
        this._last_match_cursor = 0;
      }
    }
  };

  /**
    * Initiate the search in the actual DOM.
    * Scroll the view to the correct slice if needed.
    *
    * @param {Boolean} set_match_cursor
    *     If true the match cursor is set starting from the current top line
    *     (so that the view doesn't scroll if there is a match in the visible slice).
    */
  this._highlight = function(set_match_cursor)
  {
    if (views.js_source.isvisible() &&
          this._script && this._script.line_matches && this._script.line_matches.length)
    {
      var line = this._script.line_matches[this._script.match_cursor];

      this._top_line = views.js_source.getTopLine();
      this._bottom_line = views.js_source.getBottomLine();
      if (set_match_cursor)
      {
        this._script.match_cursor = 0;
        while (this._script.line_matches[this._script.match_cursor] < this._top_line)
        {
          this._script.match_cursor++;
        }
        line = this._script.line_matches[this._script.match_cursor];
      }
      if (line < this._top_line || line >= this._bottom_line)
      {
        var plus_lines = views.js_source.getMaxLines() <= 7
          ? views.js_source.getMaxLines() / 2 >> 0
          : 7;
        views.js_source.showLine(this._script.script_id, line - plus_lines, true);
        this._top_line = views.js_source.getTopLine();
        this._bottom_line = views.js_source.getBottomLine();
        this._search_hits_valid = false;
      }
      if (!this._source_container)
      {
        this._set_source_container();
      }
      // views.js_source.showLine can invalidate the current script source
      // _search_source only performs the search if the current search term
      // is not the search term of the script
      this._search_source();
      if (this._search_hits_valid)
      {
        this._hits.forEach(this._update_hit, this);
      }
      else
      {
        this._clear_hits();
        this._script.line_matches.forEach(this._set_hit, this);
        this._search_hits_valid = true;
      }
      this._last_match_cursor = this._script.match_cursor;
      this._update_info();
    }
  };

  this._set_source_container = function()
  {
    this._source_container_parent = this._container.getElementsByTagName('div')[0];
    this._source_container = this._container.getElementsByTagName('div')[1];
  };

  /**
    * Create the highlight spans in a DOM element
    * which represents a line of the source file.
    * this._offset and this._length are variables of the scope of the class.
    * The function is called recursively on all nodes in there flow
    * of the containing line node till the two values are consumed.
    *
    * @param {Element} node The DOM element which represents a line of the source file.
    */
  this._search_node = function(node, skip_query)
  {
    var cur_node = node && node.firstChild, pos = 0, hit = null, span = null, length = 0;
    while (cur_node && this._offset > -1)
    {
      switch (cur_node.nodeType)
      {
        case 1:
        {
          if (!skip_query || !cur_node.matchesSelector(skip_query))
          {
            this._search_node(cur_node, skip_query);
          }
          break;
        }
        case 3:
        {
          if (cur_node.nodeValue.length > this._offset)
          {
            pos = this._offset;
            hit = cur_node.splitText(pos);
            if ((length = hit.nodeValue.length) >= this._length)
            {
              length = this._length;
              this._offset = -1;
            }
            else
            {
              this._length -= length;
              this._offset = 0;
            }
            cur_node = hit.splitText(length);
            span = node.insertBefore(node.ownerDocument.createElement('em'), hit);
            span.appendChild(node.removeChild(hit));
            this._hit[this._hit.length] = span;
          }
          else
          {
            this._offset -= cur_node.nodeValue.length;
          }
          break;
        };
      }
      cur_node = cur_node.nextSibling;
    }
  };

  /**
    * Helper to initiate the search in a single line.
    */
  this._set_hit = function(line, index)
  {
    if (this._top_line <= line && line <= this._bottom_line)
    {
      this._offset = this._script.line_offsets[index];
      this._length = this._script.match_length;
      this._hits[index] = this._hit = [];
      if (!this._source_container)
      {
        this._set_source_container();
      }
      this._search_node(this._source_container.getElementsByTagName('div')[line - this._top_line]);
      this._hit.forEach(index == this._script.match_cursor ?
                        this._set_highlight_style :
                        this._set_default_style, this);
    }
  };

  /**
    * Helper to scroll the view vertically if the selected match is not in the view.
    */
  this.scroll_selected_hit_in_to_view = function()
  {
    if (!this._source_container)
    {
      this._set_source_container();
    }
    this._source_container.parentNode.scrollLeft = 0;
    this._hit = this._hits[this._script.match_cursor];
    if (this._hit && this._hit.length
       && this._hit[0].offsetLeft > this._source_container_parent.scrollLeft +
                                    this._source_container_parent.offsetWidth)
    {
      this._source_container.parentNode.scrollLeft = this._hit[0].offsetLeft - 50;
    }
  }

  /**
    * Helper to update the match cursor.
    */
  this._move_match_cursor = function(dir)
  {
    if (this._script && this._script.line_matches && this._script.line_matches.length)
    {
      if (dir > 0)
      {
        if (--this._script.match_cursor < 0 )
        {
          this._script.match_cursor = this._script.line_matches.length - 1;
        }
      }
      else
      {
        if (++this._script.match_cursor >= this._script.line_matches.length )
        {
          this._script.match_cursor = 0;
        }
      }
      this._highlight();
      this.scroll_selected_hit_in_to_view();
    }
  };

  /**
    * Helper to update the css style in list of matches.
    */
  this._update_hit = function(hit_arr, index)
  {
    hit_arr.forEach(index == this._script.match_cursor &&
                    this._set_highlight_style ||
                    this._set_default_style, this);
  }

  /**
    * Helper to remove a list of highlight elements from the DOM.
    */
  this._clear_highlight_spans = function(hit)
  {
    hit.forEach(this._clear_highlight_span, this);
  }

  /**
    * Helper to remove a highlight element from the DOM.
    */
  this._clear_highlight_span = function(ele)
  {
    var parent = ele && ele.parentNode;
    if (parent)
    {
      parent.replaceChild(ele.firstChild, ele);
      parent.normalize();
    }
  }


  /**
    * Helper to reset the list of highlight elements.
    */
  this._clear_hits = function()
  {
    this._hits.forEach(this._clear_highlight_spans, this);
    this._hits = [];
    this._hit = null;
    this._search_hits_valid = false;
  }

  this._get_match_counts = function()
  {
    return this._script.line_matches.length;
  }

  this._get_search_cursor = function()
  {
    return this._script.match_cursor + 1;
  }

  /* interface implementation */

  this.search_delayed = function(new_search_term)
  {
    this._timeouts.set(this._search_bound, SEARCH_DELAY, new_search_term);
  }

  this.highlight_next = function()
  {
    this._move_match_cursor(-1);
  }

  this.highlight_previous = function()
  {
    this._move_match_cursor(1);
  }

  this.update_hits = function(top_line, bottom_line)
  {
    if (this._script && this._script.search_term &&
        this._script.line_matches && this._script.line_matches.length)
    {
      this._clear_hits();
      this._top_line = top_line;
      this._bottom_line = bottom_line;
      this._script.line_matches.forEach(this._set_hit, this);
      this._search_hits_valid = true;
    }
  }

  this.set_container = function(_container)
  {
    if(_container)
    {
      this._container = _container;
      this._source_container = null;
      this._source_container_parent = null;
    }
  }

  this.set_form_input = function(input)
  {
    if(input)
    {
      this._input = input;
      if(this._search_term)
      {
        this._input.value = this._search_term;
        this._input.parentNode.firstChild.textContent = '';
        var new_search_term = this._search_term;
        this._search_term = '';
        this._search_bound(new_search_term);
      }
    }
  }

  this.set_script = function(script)
  {
    if (script != this._script)
    {
      this._script = script;
      this._source_container = null;
      this._source_container_parent = null;
    }
  }

  this.cleanup = function()
  {
    this._last_match_cursor = this._script && this._script.match_cursor || 0;
    this._cursor = -1;
    this._clear_hits();
    this._container = this._source_container = this._source_container_parent = this._input = null;
    this._offset = -1;
    this._update_info(EMPTY);
  }

  /* search window */
  this.set_hit = function(node, offset, length, style, do_store, skip_query)
  {
    this._offset = offset;
    this._length = length;
    this._hit = []
    if (typeof do_store != 'boolean' || do_store)
    {
      this._hits.push(this._hit);
    }
    this._search_node(node, skip_query);
    this._hit.forEach(style == TextSearch.HIGHLIGHT_STYLE ?
                      this._set_highlight_style :
                      this._set_default_style, this);
    return this._hit;
  };

  this.clear_hit = function()
  {
    this._clear_hits();
  };

  this.highlight_matches = function(script)
  {

  };

  this.update_search = function()
  {
    if (!this._search_term && this._script)
    {
      this._search_source();
    }
    var new_search_term = this._search_term || '';
    this._search_term = '';
    this._search_bound(new_search_term);
  }

  this.update = this.update_search;

};

VirtualTextSearchBase.prototype = TextSearch.prototype;
VirtualTextSearch.prototype = new VirtualTextSearchBase();
JSSearchWindowHighlightPrototype.prototype = VirtualTextSearch.prototype;
JSSearchWindowHighlight.prototype = new JSSearchWindowHighlightPrototype();

