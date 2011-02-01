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
    window.messages.addListener('active-tab', this._on_active_tab_bound);
  }

  this.init(id, name, container_class, searchhandler);

}

window.cls.JSSearchWindow.prototype = new window.cls.SearchWindowBase();
