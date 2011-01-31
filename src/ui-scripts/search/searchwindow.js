window.cls || (window.cls = {});

window.cls.SearchWindowBase = function(id, name, container_class)
{
  /* interface */
  this.createView = function(container){};
  /**
    * To show the color picker.
    * @param {Event} event. The event target is the color sample to be edited.
    */
  this.show_search_window = function(event){};

  this.close_search_window = function(event){};

  /* settings */
  this.show_in_views_menu = true;
  this.window_top = 20;
  this.window_left = 20;
  this.window_width = 450;
  this.window_height = 250;
  this.window_statusbar = false;
  this.window_class = "context-window";


  /* private */




  /* implementation */
  this.createView = function(container)
  {
    container.clearAndRender(['h1', 'hello']);
  }

  this.show_search_window = function(event)
  {
    UIWindowBase.showWindow(this.id,
                            this.window_top,
                            this.window_left,
                            this.window_width,
                            this.window_height);
  }

  this.close_search_window = function(event)
  {
    UIWindowBase.closeWindow(this.id);
  };

  this.ondestroy = function()
  {

  }



}

window.cls.SearchWindowBase.prototype = ViewBase;

window.cls.JSSearchWindow = function(id, name, container_class, searchhandler)
{
  /* interface */
  this.createView = function(container){};

  this.highlight_next = function(){};

  this.highligh_previous = function(){};


  /* private */




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
      this._search.set_input_and_output(input, output);
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
    this._search = new cls.AdvancedJSSerach();

    this._ui = UI.get_instance();
    this.highlight_next = this._search.get_highlight_next_handler();
    this.highligh_previous = this._search.get_highlight_previous_handler();
  }

  this.init(id, name, container_class, searchhandler);

}

window.cls.JSSearchWindow.prototype = new window.cls.SearchWindowBase();
