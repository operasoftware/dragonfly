window.cls.JSSearchWindow = function(id, name, container_class, searchhandler)
{
  /* interface */
  this.createView = function(container){};

  this.highlight_next = function(){};

  this.highligh_previous = function(){};


  /* private */





  this._onhighlightnext = function()
  {
    this._output.textContent = this._input.value;
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
  }

  this.init(id, name, container_class, searchhandler);

}

window.cls.JSSearchWindow.prototype = new window.cls.SearchWindowBase();
