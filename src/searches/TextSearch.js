/**
 * Generic search/higlight component. Used for instance in http logger and
 * console logger to highlight words. Searches through an actual DOM for
 * the target text.
 * @see VirtualTextSearch
 * @see ListTextSearch
 * @constructor
 */
var TextSearch = function(min_length)
{
  this._init(min_length);
};

TextSearch.PLAIN_TEXT = 1;
TextSearch.REGEXP = 2;
TextSearch.NO_MATCH = 1;
TextSearch.EMPTY = 2;
TextSearch.DEFAULT_MATCH_CLASS = "search-highlight";
TextSearch.DEFAULT_MATCH_CLASS_FIRST = "search-highlight-first";
TextSearch.DEFAULT_MATCH_CLASS_BETWEEN = "search-highlight-between";
TextSearch.DEFAULT_MATCH_CLASS_LAST = "search-highlight-last";
TextSearch.SELECTED_MATCH_CLASS = "search-highlight-selected";
TextSearch.SELECTED_MATCH_CLASS_FIRST = "search-highlight-selected-first";
TextSearch.SELECTED_MATCH_CLASS_BETWEEN = "search-highlight-selected-between";
TextSearch.SELECTED_MATCH_CLASS_LAST = "search-highlight-selected-last";

TextSearch.DEFAULT_STYLE = 1;
TextSearch.HIGHLIGHT_STYLE = 1;

TextSearch.prototype = new function()
{
  const
  DEFAULT_SCROLL_MARGIN = 50,
  SEARCH_DELAY = 50, // in ms
  MIN_TERM_LENGTH = 2, // search term must be this long or longer
  NO_MATCH = TextSearch.NO_MATCH,
  EMPTY = TextSearch.EMPTY,
  DEFAULT_MATCH_CLASS = TextSearch.DEFAULT_MATCH_CLASS,
  DEFAULT_MATCH_CLASS_FIRST = TextSearch.DEFAULT_MATCH_CLASS_FIRST,
  DEFAULT_MATCH_CLASS_BETWEEN = TextSearch.DEFAULT_MATCH_CLASS_BETWEEN,
  DEFAULT_MATCH_CLASS_LAST = TextSearch.DEFAULT_MATCH_CLASS_LAST,
  SELECTED_MATCH_CLASS = TextSearch.SELECTED_MATCH_CLASS,
  SELECTED_MATCH_CLASS_FIRST = TextSearch.SELECTED_MATCH_CLASS_FIRST,
  SELECTED_MATCH_CLASS_BETWEEN = TextSearch.SELECTED_MATCH_CLASS_BETWEEN,
  SELECTED_MATCH_CLASS_LAST = TextSearch.SELECTED_MATCH_CLASS_LAST;

  window.cls.MessageMixin.apply(this); // mix in message handler behaviour.

  this._init = function(min_length)
  {
    this._search_term = '';
    this._orig_search_term = '';
    // collection of span elements. This is so because a hit may cross an
    // element border, so multiple elements needed for highlight.
    this._hits = [];
    this._match_cursor = -1;
    this._container = null;
    this._input = null;
    this._min_term_length = min_length || MIN_TERM_LENGTH;
    this._search_target = "";
    this._search_term_length = 0;
    this._current_match_index = 0;
    this._last_match_index = 0;
    this._consumed_total_length = 0;
    this._length_to_consume = 0;
    this._curent_search_result = null;
    this._timeouts = new Timeouts();
    this._search_bound = this.search.bind(this);
    this.ignore_case = 1;
    this.search_type = TextSearch.PLAIN_TEXT;
    this.no_highlight = false;
  }

  this._set_default_style = function(span, index, array)
  {
    var length = array.length;
    if (length > 1)
    {
      span.className = index == 0
                     ? DEFAULT_MATCH_CLASS_FIRST
                     : index == length - 1
                     ? DEFAULT_MATCH_CLASS_LAST
                     : DEFAULT_MATCH_CLASS_BETWEEN;
    }
    else
    {
      span.className = DEFAULT_MATCH_CLASS;
    }
  };

  this._set_highlight_style = function(span, index, array)
  {
    var length = array.length;
    if (length > 1)
    {
      if (index == 0)
      {
        span.className = this._selected_match_class_first ||
                         SELECTED_MATCH_CLASS_FIRST;
      }
      else if (index == length - 1)
      {
        span.className = this._selected_match_class_last ||
                         SELECTED_MATCH_CLASS_LAST;
      }
      else
      {
        span.className = this._selected_match_class_between ||
                         SELECTED_MATCH_CLASS_BETWEEN;
      }
    }
    else
    {
      span.className = this._selected_match_class ||
                       SELECTED_MATCH_CLASS;
    }
  };

  this._update_info = function(type)
  {
    if(this._info_ele)
    {
      var info = "";
      switch (type)
      {
        case EMPTY:
        {
          break;
        }
        case NO_MATCH:
        {
          info = ui_strings.S_TEXT_STATUS_SEARCH_NO_MATCH.
                 replace("%(SEARCH_TERM)s", this._orig_search_term);
          break;
        }
        default:
        {
          info = ui_strings.S_TEXT_STATUS_SEARCH.
                 replace("%(SEARCH_TERM)s", this._orig_search_term).
                 replace("%(SEARCH_COUNT_TOTAL)s", this._get_match_counts()).
                 replace("%(SEARCH_COUNT_INDEX)s", this._get_search_cursor());
        }
      }
      this._info_ele.textContent = info;
    }
  };

  this._get_match_counts = function()
  {
    return this._hits.length;
  }

  this._get_search_cursor = function()
  {
    return this._match_cursor + 1;
  }

  this._consume_node = function(node)
  {
    while (node && (this._current_match_index != -1 || this._length_to_consume))
    {
      switch (node.nodeType)
      {
        case 1:
        {
          this._consume_node(node.firstChild);
          break;
        }
        case 3:
        {
          if (this._length_to_consume)
          {
            if (node.nodeValue.length >= this._length_to_consume)
            {
              node.splitText(this._length_to_consume);
            }
            // if the search token does not fit in the current node value and
            // the current node is not part of some simple text formatting
            // sequence disregard that this._current_match_index
            else if (!(node.nextSibling || node.parentNode.nextSibling))
            {
              this._length_to_consume = 0;
              this._consumed_total_length += node.nodeValue.length;
              this._hits.pop();
              return;
            }
            this._length_to_consume -= node.nodeValue.length;
            var span = document.createElement('em');
            this._curent_search_result.push(span);
            node.parentNode.replaceChild(span, node);
            span.appendChild(node);
            this._consumed_total_length += node.nodeValue.length;
            node = span;
            if (this._length_to_consume < 1)
            {
              this._curent_search_result.forEach(this._set_default_style, this);
            }
          }
          else
          {
            if (this._current_match_index - this._consumed_total_length < node.nodeValue.length)
            {
              node.splitText(this._current_match_index - this._consumed_total_length);
              this._length_to_consume = this._search_term_length;
              this._search_next_match();
              this._curent_search_result = this._hits[this._hits.length] = [];
            }
            this._consumed_total_length += node.nodeValue.length;
          }
        }
      }
      node = node.nextSibling;
    }
  };

  this._search_node = function(node)
  {
    this._search_target = this.ignore_case &&
                          this.search_type == TextSearch.PLAIN_TEXT ?
                          node.textContent.toLowerCase() :
                          node.textContent;
    this._last_match_index = 0;
    if (this._reg_exp)
    {
      this._reg_exp.lastIndex = 0;
    }
    else
    {
      this._search_term_length = this._search_term.length;
    }
    this._search_next_match();
    this._consumed_total_length = 0;
    this._length_to_consume = 0;
    this._curent_search_result = null;
    this._consume_node(node);
  };

  this._search_next_match = function()
  {
    if (this._reg_exp)
    {
      this._reg_exp_match = this._reg_exp.exec(this._search_target);
      this._current_match_index = this._reg_exp_match ?
                                  this._reg_exp_match.index : -1;
      this._search_term_length = this._reg_exp_match ?
                                 this._reg_exp_match[0].length : 0;
    }
    else
    {
      this._current_match_index = this._search_target.indexOf(this._search_term,
                                                              this._last_match_index);
    }
    if (this._current_match_index != -1)
    {
      this._last_match_index = this._current_match_index + this._search_term_length;
    }
  };

  this._clear_search_results = function()
  {
    var cur = null, i = 0, parent = null, search_hit = null, j = 0;
    for (; cur = this._hits[i]; i++)
    {
      for (j = 0; search_hit = cur[j]; j++)
      {
        if (parent = search_hit.parentNode)
        {
          parent.replaceChild(search_hit.firstChild, search_hit);
          parent.normalize();
        }
      }
    }
  };

  this.search = function(new_search_term, old_cursor, force_search)
  {
    var orig_search_term = new_search_term;
    if (this.ignore_case)
    {
      new_search_term = new_search_term.toLowerCase();
    }
    if (new_search_term != this._search_term)
    {
      this._search_term = new_search_term;
      this._orig_search_term = orig_search_term;
      this._search_forced = Boolean(force_search);
      if (this._is_update_search)
      {
        old_cursor = this._match_cursor;
      }
      if(this._hits)
      {
        this._clear_search_results();
      }
      this._hits = [];
      this._match_cursor = -1;
      this.post_message("onbeforesearch",
                        {search_term: (
                                        this._search_term.length >= this._min_term_length ||
                                        this._search_forced
                                      ) ?
                                      this._search_term : ""});
      if (this._search_term.length >= this._min_term_length || force_search)
      {
        this._reg_exp = this.search_type == TextSearch.REGEXP ?
                        new RegExp(this._search_term,
                                   this.ignore_case ? 'gi' : 'g') :
                        null;
        if(this._container)
        {
          if (this._query_selector)
          {
            var nodes = this._container.querySelectorAll(this._query_selector);
            Array.prototype.forEach.call(nodes, this._search_node, this);
          }
          else
          {
            this._search_node(this._container);
          }
          if (old_cursor && this._hits[old_cursor] &&
              this._hits.length == this._old_hits_length)
          {
            this._match_cursor = old_cursor;
            if (!this.no_highlight)
              this._hits[this._match_cursor].forEach(this._set_highlight_style, this);
            if (this._onhighlightstyle)
            {
              this._onhighlightstyle(this._hits[this._match_cursor]);
            }
            this._update_info();
          }
          else
          {
            this._update_info(NO_MATCH);
            this._container.scrollTop = 0;
            this.highlight(true);
          }
          this._old_hits_length = this._hits.length;
        }
        else if (this._is_update_search && old_cursor)
        {
          this._match_cursor = old_cursor;
        }

      }
      else
      {
        this._update_info(EMPTY);
      }
    }
    this._is_update_search = false;
  };

  this.search_delayed =
  this.searchDelayed = function(new_search_term)
  {
    this._timeouts.set(this._search_bound, SEARCH_DELAY, new_search_term);
  }

  this.update_search = function()
  {
    var new_search_term = this._search_term;
    this._search_term = '';
    this._is_update_search = true;
    this.search(new_search_term);
  };

  this.update = this.update_search;

  /**
   * Highlight a search result. The result to highlight is kept in the
   * "this._match_cursor" instance variable. If check_position is true the highlight will
   * only be applied to what is visible withing the viewport.
   */
  this.highlight = function(check_position, direction)
  {
    if (this.no_highlight)
      return;

    if (this._search_term &&
        this._search_term.length < this._min_term_length &&
        !this._search_forced)
    {
      var new_search_term = this._search_term;
      this._search_term = '';
      this.search(new_search_term, null, true);
      this._search_forced = true;
      return;
    }
    if (this._hits.length)
    {
      if (this._match_cursor >= 0) // if we have a currently highlighted hit..
      {
        // then reset its style to the default
        this._hits[this._match_cursor].forEach(this._set_default_style, this);
      }

      if (check_position)
      {
        this._match_cursor = 0;
        while (this._hits[this._match_cursor] &&
               this.getRealOffsetTop(this._hits[this._match_cursor][0]) < 0)
        {
          this._match_cursor++;
        }
      }
      else
      {
        this._match_cursor += direction;
      }
      if (this._match_cursor > this._hits.length - 1)
      {
        this._match_cursor = 0;
      }
      else if (this._match_cursor < 0)
      {
        this._match_cursor = this._hits.length - 1;
      }
      this._hits[this._match_cursor].forEach(this._set_highlight_style, this);
      if (this._onhighlightstyle)
      {
        this._onhighlightstyle(this._hits[this._match_cursor]);
      }
      var target = this._hits[this._match_cursor][0];
      this._scroll_target_into_view(target, direction);
      this._update_info();
    }
    else if (this._orig_search_term)
    {
      this._update_info(NO_MATCH);
    }
    else
    {
      this._update_info(EMPTY);
    }
  };

  this._scroll_target_into_view = function(target, direction, top, left)
  {
    if (this._container && target)
    {
      if (typeof top == 'number')
      {
        this._container.scrollTop = top;
      }
      else
      {
        this._scroll_into_margined_view(this._container.clientHeight,
                                        target.offsetHeight,
                                        this.getRealOffsetTop(target),
                                        DEFAULT_SCROLL_MARGIN,
                                        direction,
                                        'scrollTop');
      }
      if (typeof left == 'number')
      {
        this._container.scrollLeft = left
      }
      else
      {
        this._scroll_into_margined_view(this._container.clientWidth,
                                        target.offsetWidth,
                                        this.getRealOffsetLeft(target),
                                        DEFAULT_SCROLL_MARGIN,
                                        direction,
                                        'scrollLeft');
      }
    }
  };

  this._scroll_into_margined_view = function(container_dim,
                                             target_dim,
                                             offset_dim,
                                             scroll_margin,
                                             direction,
                                             scroll_dim)
  {
    if (container_dim < 2 * scroll_margin + target_dim)
    {
      scroll_margin = Math.max((container_dim - target_dim) / 2, 0);
    }
    target_dim = Math.min(target_dim, container_dim - 2 * scroll_margin);
    if (offset_dim < scroll_margin ||
        container_dim - scroll_margin - target_dim < offset_dim)
    {
      if (direction == 1)
        this._container[scroll_dim] += offset_dim - scroll_margin;
      else
        this._container[scroll_dim] += offset_dim - (container_dim -
                                               scroll_margin -
                                               target_dim);
    }
  };

  this.highlight_next = function()
  {
    this.highlight(null, 1);
  };

  this.highlight_previous = function()
  {
    this.highlight(null, -1);
  };

  /**
   * Returns the top coordinate of ele in releation to this._container
   */
  this.getRealOffsetTop = function(ele)
  {
    if (!this._container_box_sizing_checked)
    {
      this._box_size_delta = 0;
      this._container_box_sizing_checked = true;
      var style = window.getComputedStyle(this._container, null);
      if (style.getPropertyValue('box-sizing') == 'border-box')
      {
        this._box_size_delta = parseInt(style.getPropertyValue('border-top-width'));
      }
    }
    return ele.getBoundingClientRect().top -
           (this._container.getBoundingClientRect().top + this._box_size_delta);
  };

  this.getRealOffsetLeft = function(ele)
  {
    return ele.getBoundingClientRect().left - this._container.getBoundingClientRect().left;
  };

  this.revalidateSearch = function()
  {
    if( this._container && this._search_term )
    {
      var new_search_term = this._search_term;
      this._search_term = '';
      this.search(new_search_term, this._match_cursor);
    }
  };

  this.set_container =
  this.setContainer = function(cont)
  {
    this._container_box_sizing_checked = false;
    if (this._container != cont)
    {
      this._container = cont;
    }
  };

  this.set_info_element = function(info_ele)
  {
    this._info_ele = info_ele;
  };

  this.set_form_input =
  this.setFormInput = function(input)
  {
    this._input = input;
    if (this._search_term)
    {
      var new_search_term = this._search_term;
      this._input.value = this._orig_search_term;
      this._input.parentNode.firstChild.textContent = '';
      this._search_term = '';
      this.searchDelayed(new_search_term);
    }
  };

  /**
   * Cleanup to be performed when searching has ended
   */
  this.cleanup = function()
  {
    this._clear_search_results();
    this._hits = [];
    this._input = this._container = this._info_ele = null;
    this._container_box_sizing_checked = false;
  };

  this.set_search_term = function(search_term)
  {
    this._orig_search_term = this._search_term = search_term;
  }

  this.get_match_style = function(type)
  {
    return type == 'highlight' ?
           this._match_style_highlight :
           this._match_style_default;
  }

  this.set_query_selector = function(selector)
  {
    this._query_selector = selector;
  };

  this.get_match_target = function()
  {
    return this._hits &&
           this._hits[this._match_cursor] &&
           this._hits[this._match_cursor][0] &&
           this._hits[this._match_cursor][0].parentElement || null;
  };


};
