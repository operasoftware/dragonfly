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
    if (searchterm == this._searchterm)
    {

    }
    else
    {
      this._searchterm = searchterm;
      this.searchresults = {};
      this._text_search.cleanup();
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
      this._output.clearAndRender(window.templates.js_serach_results(this.searchresults));
      // .js-search-results-runtime
      //   .js-search-results-script
      //     div (for each line)
      var rts = this._output.getElementsByClassName('js-search-results-runtime');
      var rt_index = 0;
      var script_eles = null, script_ele = null, i = 0;
      for (var rt_id in this.searchresults)
      {
        script_eles = rts[rt_index].getElementsByClassName('js-search-results-script');
        for (i = 0; script_ele = script_eles[i]; i++)
        {
          this._set_hits(this.searchresults[rt_id][i], script_ele);
        }
      }
      // TODO subclass VirtualTextSerach
      //this._text_search._update_info();
    }

  }

  this._set_hits = function(script, script_ele)
  {
    var line_eles = script_ele.getElementsByTagName('div');
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
      // a bit sheaky
      this._text_search.set_hit(line_ele, script.line_offsets[i] + 6, script.match_length);
    }
  }

  this._onhighlightprevious = function()
  {

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
    this._text_search.set_info_element(info_ele);
    if (input && output)
    {
      // TODO content of serach view to highlight matches in a single file
      this._input = input;
      this._output = output;
    }
  }

  this.ondestroy = function()
  {

  }

  /* initialistaion */

  this.init = function(id, name, container_class, searchhandler)
  {
    ViewBase.init.call(this, id, name, container_class);
    this._searchhandler = searchhandler;
    this._ui = UI.get_instance();
    this.highlight_next = this._onhighlightnext.bind(this);
    this.highligh_previous = this._onhighlightprevious.bind(this);
    this._input = null;
    this._output = null;
    this._rt_ids = null;
    this._searchterm = '';
    this.searchresults = {};
    this._text_search = new VirtualTextSearch();
    window.messages.addListener('active-tab', this._on_active_tab_bound);
  }

  this.init(id, name, container_class, searchhandler);

}

window.cls.JSSearchWindow.prototype = new window.cls.SearchWindowBase();
