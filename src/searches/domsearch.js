var DOMSearch = function(min_length)
{
  // TODO clean up onview destroy
  // TODO this.update_search, this.update (which one?), dependent on search type

  this._init_super = this._init;

  const 
  TOKEN_HIGHLIGHT = [DOMSearch.PLAIN_TEXT, DOMSearch.REGEXP],
  MATCH_NODE_HIGHLIGHT_CLASS = "dom-search-match-cursor",
  NO_MATCH = TextSearch.NO_MATCH,
  EMPTY = TextSearch.EMPTY;

  this._onsearchtypechange = function(event)
  {
    switch (event.target.name)
    {
      case 'dom-search-type':
      {
        this.search_type = parseInt(event.target.value);
        this._set_highlight_handlers(event.target);
        this._setting.set('dom-search-type', this.search_type);
        this._validate_current_search();
        break;
      }
      case 'dom-search-ignore-case':
      {
        this.ignore_case = Number(event.target.checked);
        this._setting.set('dom-search-ignore-case', this.ignore_case);
        this._validate_current_search();
        break;
      }
      case 'dom-search-only-selected-node':
      {
        this.search_only_selected_node = Number(event.target.checked);
        this._setting.set('dom-search-only-selected-node',
                          this.search_only_selected_node);
        this._validate_current_search();
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
      this.update_search = this.update_search_token;
      this.set_form_input = this.set_form_input_token;
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
      this.update_search = this.update_search_node;
      this.set_form_input = this.set_form_input_node;
      if (target)
      {
        target.form['dom-search-ignore-case'].disabled = true;
      }
    }
  };

  /* methods for search type text and reg exp */

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

  this.inspect_selected_node = function()
  {
    if (this._highligh_node)
    {
      this._broker.dispatch_action("dom", 
                                   "inspect-node-link",
                                   null,
                                   this._highligh_node);
    }
  };

  this.update_search_token = function()
  {
    this._search_term = this._last_query;
    this.update_search_super();
  };

  this.set_form_input_token = function(input)
  {
    this._input = input;
    if (this._search_term)
    {
      this._input.value = this._orig_search_term;
      this._input.parentNode.firstChild.textContent = '';
      this.update_search_token();
    }
  };

  this.show_last_search = function()
  {
    this._handle_search();
  };

  /* methods for search type css and xpath */
   
  this._initial_highlight_node = function()
  {
    this._match_count = this._model.get_match_count();
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
      this._highlight_match_node(this._match_node_cursor < 0 ? 1 : 0);
    }
  };

  this.clear_style_highlight_node = function()
  {
    if (this._highligh_node)
    {
      this._highligh_node.removeClass(MATCH_NODE_HIGHLIGHT_CLASS);
      this._highligh_node = null;
    }
  };

  this._highlight_match_node = function(direction)
  {
    if (this._match_nodes)
    {
      this.clear_style_highlight_node();
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
        this._highligh_node = this._match_nodes[this._match_node_cursor];
        this._highligh_node.addClass(MATCH_NODE_HIGHLIGHT_CLASS);
        this._scroll_target_into_view(this._match_nodes[this._match_node_cursor],
                                      direction, null, 0);
        this._update_info();
      }
      else
      {
        this._update_info(NO_MATCH);
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

  this.update_search_node = function()
  {
    this._initial_highlight_node();
  };

  this.set_form_input_node = function(input)
  {
    this._input = input;
    if (this._last_query)
    {
      this._input.value = this._last_query;
      this.update_search_node();
    }
  };

  this._onelementselected = function(msg)
  {
    this._selected_node = msg.obj_id;
    this._selected_runtime = msg.rt_id;
  }

  this._onhighlightstyle = function(span_list)
  {
    if (span_list.length)
    {
      var target = span_list[0].get_ancestor('.dom-search-match');
      if (this._highligh_node && this._highligh_node != target)
      {
        this._highligh_node.removeClass('dom-search-match-cursor')
      }
      if (target)
      {
        this._highligh_node = target;
        this._highligh_node.addClass('dom-search-match-cursor');
      }
    }
  };

  this._init = function(min_length)
  {
    this._init_super(min_length);
    this._setting = window.settings.dom;
    this.search_type = this._setting.get('dom-search-type');
    this.ignore_case = this._setting.get('dom-search-ignore-case');
    this.search_only_selected_node = this._setting.get('dom-search-only-selected-node');
    this._min_term_length = 1;
    this._last_query = '';
    this._last_search_type = 0;
    this._last_ignore_case = this.ignore_case;
    this._tagman = window.tag_manager;
    this._esdi = window.services['ecmascript-debugger'];
    this._broker = ActionBroker.get_instance();

    window.eventHandlers.change['dom-search-type-changed'] = this._onsearchtypechange;
    this._query_selector = ".dom-search-match";
    this._set_highlight_handlers();
    window.messages.addListener('element-selected', 
                                this._onelementselected.bind(this));
  };



  this._super_highlight_next = this.highlight_next;
  this._super_highlight_previous = this.highlight_previous;

  this._validate_current_search = function()
  {
    if (this._input.value != this._last_query ||
        this.search_type != this._last_search_type ||
        this.ignore_case != this._last_ignore_case ||
        this.search_only_selected_node != this._last_search_only_selected_node ||
        (this.search_only_selected_node &&
         this._selected_node != this._last_selected_node))
    {
      this._last_query = this._input.value;
      this._orig_search_term = this._last_query;
      this._last_search_type = this.search_type;
      this._last_ignore_case = this.ignore_case;
      this._last_search_only_selected_node = this.search_only_selected_node;
      this._last_selected_node = this._selected_node;
      this._match_node_cursor = -1;
      this._match_cursor = -1;
      if (this._last_query)
      {
        this._model = new cls.InspectableDOMNode(this._selected_runtime,
                                                 this._selected_node);
        this._is_processing = true;
        this._queued_input = false;
        this._model.search(this._last_query,
                           this.search_type,
                           this.ignore_case,
                           this.search_only_selected_node ?
                           this._selected_node : 
                           0,
                           this._handle_search);
      }
      else
      {
        this._model = null;
        this._handle_search();
        this._update_info(EMPTY);
      }
      return false;
    }
    return true;
  }.bind(this);

  this._handle_search = function(status, message, rt_id, object_id)
  {
    if (this._container)
    {
      if (this._model)
      {
        var tmpl = window.templates.dom_search(this._model);
        this._container.firstElementChild.clearAndRender(tmpl);
        if (this._model.getData() && this._model.getData().length)
        {
          this._initial_highlight();
        }
        else
        {
          this._update_info(NO_MATCH);
        }
      }
      else
      {
        this._container.firstElementChild.innerHTML = "";
        this._update_info(EMPTY);
      }
    }
    if (this._queued_input)
    {
      setTimeout(this._validate_current_search, 100);
    }
    else
    {
      this._is_processing = false;
    }
  }.bind(this);

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
  this.update_search_super = this.update_search;
  
  this.update_search = function()
  {
    // set depending on the search type in this._set_highlight_handlers
  };

  this.set_form_input_super = this.set_form_input;

  this.set_form_input = function()
  {
    // set depending on the search type in this._set_highlight_handlers
  };

  this.search_delayed = function(event)
  {
    if (this._is_processing)
    {
      this._queued_input = true;
    }
    else
    {
      this._validate_current_search();
    }
  };

  this._init(min_length);
};

DOMSearch.prototype = TextSearch.prototype;

DOMSearch.PLAIN_TEXT = TextSearch.PLAIN_TEXT;
DOMSearch.REGEXP = TextSearch.REGEXP;
DOMSearch.XPATH = 3;
DOMSearch.CSS = 4;
