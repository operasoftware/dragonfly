window.cls.JSSearchWindow = function(id, name, container_class, searchhandler)
{
  /* interface */

  this.createView = function(container){};

  this.highlight_next = function(){};

  this.highligh_previous = function(){};

  this.show_script_of_search_match = function(){};

  /* constants */

  const JS_SOURCE_ID = 'js_source';
  /* private */


  this._on_active_tab = function(msg)
  {
    this._rt_ids = msg.activeTab.slice(0);
    this._search_term = '';
  };

  this._onhighlightnext = function()
  {
    var searchterm = this._input.value;
    if (searchterm != this._search_term)
    {
      this._search_term = searchterm;
      this.post_message("onbeforesearch", {search_term: this._search_term});
      this.searchresults = {};
      this._onscriptselected();
      this._window_highlighter.reset_match_cursor();
      this._window_highlighter.set_search_term(searchterm);
      this._output.style.removeProperty('width');
      this._output.clearAndRender(['div', 'searching ...', 
                                   'class', 'info-is-searching']);
      if (searchterm)
      {
        if (this._rt_ids)
        {
          this._rt_ids.forEach(function(rt_id)
          {
            var scripts = window.runtimes.getScripts(rt_id).filter(function(script)
            {
              script.search_source(searchterm);
              return script.line_matches.length;
            });
            if (scripts.length)
            {
              this.searchresults[rt_id] = scripts;
            }
          }, this);
        }
      }
      setTimeout(this._show_search_results_bound, 5);
    }
    else
    {
      this._window_highlighter.highlight_next();
    }
  };

  this._show_search_results = function()
  {
    this._create_search_results_view();
    this._window_highlighter.highlight_next();
  };

  this._onhighlightprevious = function()
  {
    this._window_highlighter.highlight_previous();
  };

  this._onscriptselected = function(msg)
  {
    messages.removeListener('view-scrolled', this._onviewscrolled_bound);
    this._source_highlighter.cleanup();
  };

  this._onviewscrolled = function(msg)
  {
    if (msg.id == JS_SOURCE_ID)
    {
      this._source_highlighter.update_hits(msg.top_line, msg.bottom_line);
    }
  };

  this._onsourceviewdestroyed = function(msg)
  {
    if (msg.id == JS_SOURCE_ID)
    {
      this._onscriptselected();
    }
  };

  this._create_search_results_view = function()
  {
    this._output.clearAndRender(window.templates.js_search_results(this.searchresults));
    // .js-search-results-runtime
    //   .js-search-results-script
    //     div (for each line)
    var rts = this._output.getElementsByClassName('js-search-results-runtime');
    var rt_index = 0;
    var script_eles = null, script_ele = null, i = 0;
    for (var rt_id in this.searchresults)
    {
      script_eles = rts[rt_index++].getElementsByClassName('js-search-results-script');
      for (i = 0; script_ele = script_eles[i]; i++)
      {
        this._set_hits(this.searchresults[rt_id][i], script_ele);
      }
    }
    this._output.style.width = this._output.parentNode.scrollWidth + 'px';
  };

  this._set_hits = function(script, script_ele)
  {
    var line_eles = script_ele.getElementsByTagName('code');
    var cur_line_no = 0;
    var line_no = 0;
    var line_ele = null;
    var line_ele_index = 0;
    for (var i = 0; i < script.line_matches.length; i++)
    {
      cur_line = script.line_matches[i];
      if (cur_line != line_no)
      {
        line_no = cur_line;
        line_ele = line_eles[line_ele_index++];
      }
      this._window_highlighter.set_hit(line_ele, script.line_offsets[i], script.match_length);
    }
  };

  this._update_match_highlight = function(event, target)
  {
    var cur = event.target;
    while (cur && cur.nodeName.toLowerCase() != 'div' && (cur = cur.parentNode));
    if (cur)
    {
      var matches = cur.getElementsByTagName('em');
      var match_cursor = 0;
      var match = matches[match_cursor];
      if (match)
      {
        var left = event.clientX;
        var cur_left = match.getBoundingClientRect().left;
        var temp_left = 0;
        while (match && matches[++match_cursor])
        {
          temp_left = matches[match_cursor].getBoundingClientRect().left;
          if (Math.abs(left - temp_left) < Math.abs(left - cur_left))
          {
            match = matches[match_cursor];
            cur_left = match.getBoundingClientRect().left;
          }
          else
          {
            break;
          }
        }
        this._window_highlighter.set_match_cursor(match);
      }
    }
  };

  this._show_script = function(event, target)
  {
    this._update_match_highlight(event, target);
    this.show_script_of_search_match(event, target)
  };

  /* implementation */

  this.createView = function(container)
  {
    container.clearAndRender(window.templates.js_search_window());
    // TODO improve this method
    var input = this.getToolbarControl(container, this._searchhandler);
    var output = container.querySelector('.js-search-results');
    var toolbar = document.getElementById(container.id.replace("container", "toolbar"));
    info_ele = toolbar && toolbar.getElementsByTagName('info')[0];
    if (input && output)
    {
      this._input = input;
      this._output = output;
      this._window_highlighter.set_info_element(info_ele);
      this._window_highlighter.set_container(container);
      messages.addListener('script-selected', this._onscriptselected_bound);
      messages.addListener('view-destroyed', this._onsourceviewdestroyed.bind(this));
      if (this._search_term)
      {
        this._input.value = this._search_term;
        this._search_term = "";
        this._onhighlightnext();
      }
      input.focus();
    }
  };

  this.ondestroy = function()
  {
    this.searchresults = null;
    this._window_highlighter.cleanup();
    this._source_highlighter.cleanup();
    messages.removeListener('script-selected', this._onscriptselected_bound);
    messages.removeListener('view-scrolled', this._onviewscrolled_bound);
  };

  this.show_script_of_search_match = function(event, target)
  {
    var cursor = this._window_highlighter.get_match_cursor();
    var script = null, i = 0;
    for (var rt_id in this.searchresults)
    {
      for (i = 0; script = this.searchresults[rt_id][i]; i++)
      {
        if (cursor < script.line_matches.length)
        {
          break;
        }
        else
        {
          cursor -= script.line_matches.length;
        }
      }
      if (script)
      {
        break;
      }
    }
    if (script)
    {
      var js_source_view = window.views.js_source;
      if (!js_source_view.isvisible())
      {
        this._ui.show_view(JS_SOURCE_ID);
      }
      script.match_cursor = cursor;
      js_source_view.showLine(script.script_id, script.line_matches[cursor] - 10);
      this._source_highlighter.set_container(js_source_view.get_container());
      this._source_highlighter.set_script(script);
      this._source_highlighter.update_hits(js_source_view.getTopLine(),
                                           js_source_view.getBottomLine());
      this._source_highlighter.scroll_selected_hit_in_to_view();
      messages.addListener('view-scrolled', this._onviewscrolled_bound);
    }
  };

  this.set_search_term = function(search_term)
  {
    this._search_term = search_term;
  }

  /* message interface */

  window.cls.MessageMixin.apply(this);

  /* action handler interface */

  ActionHandlerInterface.apply(this);
  this._handlers['show-script'] = this._show_script.bind(this);

  /* initialistaion */

  this.init = function(id, name, container_class, searchhandler)
  {
    ViewBase.init.call(this, id, name, container_class);
    this._searchhandler = searchhandler;
    this._ui = UI.get_instance();
    this.highlight_next = this._onhighlightnext.bind(this);
    this.highlight_previous = this._onhighlightprevious.bind(this);
    this._input = null;
    this._output = null;
    this._rt_ids = null;
    this._search_term = '';
    this.searchresults = {};
    this._window_highlighter = new JSSearchWindowHighlight();
    this._source_highlighter = new VirtualTextSearch();
    this._onscriptselected_bound = this._onscriptselected.bind(this);
    this._onviewscrolled_bound = this._onviewscrolled.bind(this);
    this._show_search_results_bound = this._show_search_results.bind(this);
    window.messages.addListener('active-tab', this._on_active_tab.bind(this));
    ActionBroker.get_instance().register_handler(this);
  }

  this.init(id, name, container_class, searchhandler);

};

window.cls.JSSearchWindow.prototype = new window.cls.SearchWindowBase();
