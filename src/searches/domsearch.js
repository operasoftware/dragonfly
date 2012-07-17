var DOMSearch = function(min_length)
{

  /* inherits from TextSearch */

  this._super_init = this._init;
  this._super_highlight_next = this.highlight_next;
  this._super_highlight_previous = this.highlight_previous;
  this._super_set_form_input = this.set_form_input;

  /* interface */

  this.highlight_next = function() {};

  this.highlight_previous = function() {};

  this.set_form_input = function() {};

  this.search_delayed = function(event) {};

  this.inspect_selected_node = function() {};

  this.show_last_search = function() {};

  this.clear_style_highlight_node = function() {};

  // returns an object with object_id, node_type, offset, and length.
  this.get_search_hit = function() {};

  this.get_current_hit_element = function() {};


  // overwrites _update_info
  PanelSearch.apply(this);

  /* constants */
  const
  TOKEN_HIGHLIGHT = [DOMSearch.PLAIN_TEXT, DOMSearch.REGEXP],
  MATCH_NODE_HIGHLIGHT_CLASS = PanelSearch.MATCH_NODE_HIGHLIGHT_CLASS,
  NO_MATCH = TextSearch.NO_MATCH,
  EMPTY = TextSearch.EMPTY,
  H_TEXT_LENGTH = '#text'.length;

  /* private */

  this._set_highlight_handlers = function(target)
  {
    if (TOKEN_HIGHLIGHT.indexOf(this.search_type) != -1)
    {
      this.is_token_search = true;
      this._initial_highlight = this._initial_highlight_token;
      this._highlight_next = this._highlight_next_token;
      this._highlight_previous = this._highlight_previous_token;
      this._get_match_counts = this._get_match_counts_token;
      this._get_search_cursor = this._get_search_cursor_token;
      this.set_form_input = this._set_form_input_token;
      if (target)
      {
        target.form['dom-search-ignore-case'].disabled = false;
      }
    }
    else
    {
      this.is_token_search = false;
      this._initial_highlight = this._initial_highlight_node;
      this._highlight_next = this._highlight_next_node;
      this._highlight_previous = this._highlight_previous_node;
      this._get_match_counts = this._get_match_counts_node;
      this._get_search_cursor = this._get_search_cursor_node;
      this.set_form_input = this._set_form_input_node;
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

  this._set_form_input_token = function(input)
  {
    this._input = input;
    if (this._search_term)
    {
      this._input.value = this._orig_search_term;
      this._input.parentNode.firstChild.textContent = '';
    }
  };

  /* methods for search type css and xpath */

  this._initial_highlight_node = function()
  {
    this._match_count = this._model.get_match_count();
    this._orig_search_term = this._last_query;
    if (this._container)
    {
      var nodes = this._container.getElementsByClassName('search-match');
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

  this._set_form_input_node = function(input)
  {
    this._input = input;
    if (this._last_query)
    {
      this._input.value = this._last_query;
    }
  };

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
    }
  }.bind(this);

  this._onelementselected = function(msg)
  {
    this._selected_node = msg.obj_id;
    this._selected_runtime = msg.rt_id;
  };

  this._init = function(min_length)
  {
    this._super_init(min_length);
    this._setting = window.settings.dom;
    this.search_type = this._setting.get('dom-search-type');
    this.ignore_case = this._setting.get('dom-search-ignore-case');
    this._re_match_target = /match-token/i;
    this._min_term_length = 1;
    this._last_query = '';
    this._last_search_type = 0;
    this._last_ignore_case = this.ignore_case;
    this._tagman = window.tag_manager;
    this._esdi = window.services['ecmascript-debugger'];
    this._broker = ActionBroker.get_instance();
    window.eventHandlers.change['dom-search-type-changed'] =
      this._onsearchtypechange;
    this._query_selector = "." + PanelSearch.MATCH_NODE_CLASS;
    this._set_highlight_handlers();
    window.messages.addListener('element-selected',
                                this._onelementselected.bind(this));
  };

  this._validate_current_search = function()
  {
    if (this._input.value != this._last_query ||
        this.search_type != this._last_search_type ||
        this.ignore_case != this._last_ignore_case ||
        this._last_selected_runtime != this._selected_runtime)
    {
      this._last_query = this._input.value;
      this._orig_search_term = this._last_query;
      this._last_search_type = this.search_type;
      this._last_ignore_case = this.ignore_case;
      this._last_selected_node = this._selected_node;
      this._last_selected_runtime = this._selected_runtime;
      this._match_node_cursor = -1;
      this._match_cursor = -1;
      if (this._last_query)
      {
        var error = this.search_type == TextSearch.REGEXP &&
                    this._validate_reg_exp();

        if (error)
        {
          this._model = null;
          this._match_nodes = null;
          this._match_count = 0;
          this._hits = [];
          this._update_info(EMPTY);
          var tmpl = ['div', error, 'class', 'info-box'];
          this._container.firstElementChild.clearAndRender(tmpl);
        }
        else
        {
          this._match_nodes = null;
          this._match_count = 0;
          this._hits = [];
          this._model = new cls.InspectableDOMNode(this._last_selected_runtime,
                                                   this._selected_node);
          this._is_processing = true;
          this._queued_input = false;
          this._model.search(this._last_query,
                             this.search_type,
                             this.ignore_case,
                             0,
                             this._handle_search);
        }
      }
      else
      {
        this._model = null;
        this._match_nodes = null;
        this._match_count = 0;
        this._hits = [];
        this._handle_search();
        this._update_info(EMPTY);
      }
      return false;
    }
    this._is_processing = false;
    this._queued_input = false;
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
    window.messages.post("panel-search-executed");
  }.bind(this);

  /* implementation */

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

  this.show_last_search = function()
  {
    this._handle_search();
  };

  this.clear_style_highlight_node = function()
  {
    if (this._highligh_node)
    {
      this._highligh_node.removeClass(MATCH_NODE_HIGHLIGHT_CLASS);
      this._highligh_node = null;
    }
  };

  this._get_match_offset = function(node, ctx)
  {
    const ELEMENT = document.ELEMENT_NODE;
    const TEXT = document.TEXT_NODE;

    while (node && !ctx.is_target && !(ctx.is_target = node == ctx.target))
    {
      if (node.nodeType == ELEMENT)
      {
        this._get_match_offset(node.firstChild, ctx);
      }
      if (!ctx.is_target && node.nodeType == TEXT)
      {
        ctx.offset += node.nodeValue.length;
      }
      node = node.nextSibling;
    }
  };

  this.get_search_hit = function()
  {
    var hit = null;
    if (TOKEN_HIGHLIGHT.indexOf(this.search_type) != -1)
    {
      hit = this._hits[this._match_cursor];
      var ret = {};
      if (hit)
      {
        var search_hit_ele = hit[0].get_ancestor(this._query_selector);
        if (search_hit_ele)
        {
          var ctx = {is_target: false, offset: 0, target: hit[0]};
          var offset = this._get_match_offset(search_hit_ele.firstChild, ctx);
          if (search_hit_ele.getElementsByClassName('dom-search-text-node')[0])
          {
            ctx.offset -= H_TEXT_LENGTH; // '#text'.length;
          }
          return (
          {
            offset: ctx.offset,
            length: hit[0].textContent.length,
            object_id: parseInt(search_hit_ele.getAttribute('obj-id')),
            runtime_id: this._last_selected_runtime,
            target: search_hit_ele
          });
        }
      }
    }
    else if (hit = this._match_nodes[this._match_node_cursor])
    {
      return (
      {
        object_id: parseInt(hit.getAttribute('obj-id')),
        runtime_id: this._last_selected_runtime,
        target: hit
      });
    }
    return null;
  };

  this.get_current_hit_element = function()
  {
    var hit = this._hits[this._match_cursor];
    return hit && hit[0] || null;
  };


  this.update_match_highlight = this._update_match_highlight;

  this._init(min_length);
};

DOMSearch.prototype = SearchSingleNodes.prototype;

DOMSearch.PLAIN_TEXT = TextSearch.PLAIN_TEXT;
DOMSearch.REGEXP = TextSearch.REGEXP;
DOMSearch.XPATH = 3;
DOMSearch.CSS = 4;
