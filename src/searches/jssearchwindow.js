window.cls.JSSearchWindow = function(id, name, container_class, searchhandler)
{
  /* interface */
  this.createView = function(container){};

  this.highlight_next = function(){};

  this.highligh_previous = function(){};


  /* private */




  this._on_active_tab_bound = function(msg)
  {
    this._rt_ids = msg.activeTab.slice(0);
    this._searchterm = '';
  }.bind(this);


  this._onhighlightnext = function()
  {
    var searchterm = this._input.value;
    if (searchterm != this._searchterm)
    {
      this._searchterm = searchterm;
      this.searchresults = {};
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
      this._text_search.reset_match_cursor();
      this._create_search_results_view();
    }
    this._text_search.highlight_next();
  }

  this._create_search_results_view = function()
  {
    this._output.style.removeProperty('width');
    this._output.clearAndRender(window.templates.js_serach_results(this.searchresults));
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
  }

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
      this._text_search.set_hit(line_ele, script.line_offsets[i], script.match_length);
    }
  }

  this._onhighlightprevious = function()
  {
    this._text_search.highlight_previous();
  }


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
      // TODO content of serach view to highlight matches in a single file
      this._input = input;
      this._output = output;
      this._text_search.set_info_element(info_ele);
      this._text_search.set_container(container);
    }
  }

  this.ondestroy = function()
  {

  }

  

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
          }
          else
          {
            break;
          }
        }
        this._text_search.set_match_cursor(match);
      }
    }

  };
  
  this.show_script = function(event, target)
  {
    if (event.type == "click")
    {
      this._update_match_highlight(event);
    }
    var cursor = this._text_search.get_match_cursor();
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
      window.views.js_source.highlight(script.script_id, script.line_matches[cursor]);
    }
    /*
    var script_id = event.target.get_attr('parent-node-chain', 'data-script-id');
    var line_no = event.target.get_attr('parent-node-chain', 'data-line-no');
    if (script_id && line_no)
    {
      //window.views.js_source.highlight
      window.views.js_source.highlight(parseInt(script_id), parseInt(line_no));
    }
    */
  }
  
  ActionHandlerInterface.apply(this);
  
  this._handlers['show-script'] = this.show_script.bind(this);

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
    this._searchterm = '';
    this.searchresults = {};
    this._text_search = new JSSearchWindowHighlight();
    window.messages.addListener('active-tab', this._on_active_tab_bound);
    ActionBroker.get_instance().register_handler(this);
  }

  this.init(id, name, container_class, searchhandler);

}

window.cls.JSSearchWindow.prototype = new window.cls.SearchWindowBase();
