var DOMSearch = function(min_length)
{
  // TODO clean up onview destroy
  // TODO this.update_search, this.update (which one?), dependent on search type

  this._init_super = this._init;

  const 
  TOKEN_HIGHLIGHT = [DOMSearch.PLAIN_TEXT, DOMSearch.REGEXP],
  MATCH_NODE_HIGHLIGHT_CLASS = "dom-search-node-highlight";

  this._onsearchtypechange = function(event)
  {
    switch (event.target.name)
    {
      case 'dom-search-type':
      {
        this.search_type = parseInt(event.target.value);
        this._set_highlight_handlers(event.target);
        break;
      }
      case 'dom-search-ignore-case':
      {
        this.ignore_case = Number(event.target.checked);
        break;
      }
    }
  }.bind(this);

  this._set_highlight_handlers = function(target)
  {
    if (TOKEN_HIGHLIGHT.indexOf(this.search_type) != -1)
    {
      this._initial_highlight = this._initial_highlight_token;
      this._highlight_next = this._highlight_next_token;
      this._highlight_previous = this._highlight_previous_token;
      this._get_match_counts = this._get_match_counts_token;
      this._get_search_cursor = this._get_search_cursor_token;
      if (target)
      {
        target.form['dom-search-ignore-case'].disabled = false;
      }
    }
    else
    {
      this._initial_highlight = this._initial_highlight_node;
      this._highlight_next = this._highlight_next_node;
      this._highlight_previous = this._highlight_previous_node;
      this._get_match_counts = this._get_match_counts_node;
      this._get_search_cursor = this._get_search_cursor_node;
      if (target)
      {
        target.form['dom-search-ignore-case'].disabled = true;
      }
    }
  };

  // highlight handlers for text and reg exp search
  this._initial_highlight_token = function()
  {
    this._search_term = '';
    this.search(this._last_query);
  };

  this._highlight_next_token = function()
  {
    this._super_highlight_next();
  };

  this._highlight_previous_token = function()
  {
    this._super_highlight_previous();
  };

  this._get_match_counts_token = function()
  {
    return this._hits.length;
  };

  this._get_search_cursor_token = function()
  {
    return this._match_cursor + 1;
  };

  // highlight handlers for css and xpath search
  this._initial_highlight_node = function()
  {
    this._match_count = this._dom_data.get_match_count();
    this._match_node_cursor = -1;
    this._orig_search_term = this._last_query;
    if (this._container)
    {
      var nodes = this._container.getElementsByClassName('dom-search-match');
      this._match_nodes = Array.prototype.reduce.call(nodes, function(list, node)
      {
        if (!/^<\//.test(node.textContent))
        {
          list.push(/div/i.test(node.nodeName) ? node : node.parentNode);
        };
        return list;
      }, []);
      this._highlight_match_node(1);
    }
  };

  this._highlight_match_node = function(direction)
  {
    if (this._match_nodes)
    {
      if (this._match_nodes[this._match_node_cursor])
      {
        this._match_nodes[this._match_node_cursor]
            .removeClass(MATCH_NODE_HIGHLIGHT_CLASS);
      }
      this._match_node_cursor += direction;
      if (this._match_node_cursor >= this._match_nodes.length)
      {
        this._match_node_cursor = 0;
      }
      else if (this._match_node_cursor < 0)
      {
        this._match_node_cursor = this._match_nodes.length - 1;
      }
      if (this._match_nodes[this._match_node_cursor])
      {
        this._match_nodes[this._match_node_cursor]
            .addClass(MATCH_NODE_HIGHLIGHT_CLASS);
        this._scroll_target_into_view(this._match_nodes[this._match_node_cursor],
                                      direction);
        this._update_info();
      }
    }
  };

  this._highlight_next_node = function()
  {
    this._highlight_match_node(1);
  };

  this._highlight_previous_node = function()
  {
    this._highlight_match_node(-1);
  };

  this._get_match_counts_node = function()
  {
    return this._match_count;
  };

  this._get_search_cursor_node = function()
  {
    return this._match_node_cursor + 1;
  };

  this._init = function(min_length)
  {
    this._init_super(min_length);
    this.search_type = DOMSearch.PLAIN_TEXT;
    this.ignore_case = 1;
    this._min_term_length = 1;
    this._last_query = '';
    this._last_search_type = 0;
    this._last_ignore_case = this.ignore_case;
    this._dom_data = window.dom_data;

    window.eventHandlers.change['dom-search-type-changed'] = this._onsearchtypechange;
    this._query_selector = ".dom-search-match";
    this._set_highlight_handlers();
  };

  this._handle_search = function()
  {
    window.views.dom.update();
    this._initial_highlight();
  }.bind(this);

  this._super_highlight_next = this.highlight_next;
  this._super_highlight_previous = this.highlight_previous;

  this._validate_current_search = function()
  {
    if (this._input.value != this._last_query ||
        this.search_type != this._last_search_type ||
        this.ignore_case != this._last_ignore_case)
    {
      this._last_query = this._input.value;
      this._last_search_type = this.search_type;
      this._last_ignore_case = this.ignore_case;
      window.dom_data.search(this._last_query,
                             this.search_type,
                             this.ignore_case,
                             0,
                             this._handle_search);
      return false;
    }
    return true;
  }
  this.highlight_next = function()
  {
    if (this._validate_current_search())
    {
      this._highlight_next();
    }
  };

  this.highlight_previous = function()
  {
    if (this._validate_current_search())
    {
      this._highlight_previous();
    }
  };

  // handler for a view update
  this.update_search = function()
  {
    // TODO
  }

  // handler for a view update
  this.update = function()
  {
    // TODO
    // TODO check update methods
  }

  this.search_delayed = function(event)
  {
    
  };

  this._init(min_length);
};

DOMSearch.prototype = TextSearch.prototype;

DOMSearch.PLAIN_TEXT = TextSearch.PLAIN_TEXT;
DOMSearch.REGEXP = TextSearch.REGEXP;
DOMSearch.XPATH = 3;
DOMSearch.CSS = 4;
